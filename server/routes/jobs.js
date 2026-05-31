/**
 * Job routes for creating, listing, and managing placement opportunities.
 */
const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { requireRole, requirePaid } = require("../middleware/requireRole");
const { summariseJD } = require("../services/summarise");
const { scrapeUnstop } = require("../services/scraper");
const { broadcastJob } = require("../services/broadcast");
const { calculateRuleBasedScore, performAiReview } = require("../services/ats");
const AtsScore = require("../models/AtsScore");

// @route   GET /api/jobs
router.get("/", protect, async (req, res) => {
  try {
    let query = { collegeId: req.user.collegeId };

    // Add search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };
      query.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { rolesAndResponsibilities: searchRegex },
        { requirements: searchRegex },
        { stipend: searchRegex }
      ];
    }

    if (req.user.role === "student") {
      // Query student profile from DB instead of trusting JWT (Prevent CGPA Spoofing)
      const student = await User.findById(req.user._id);
      if (!student) return res.status(404).json({ error: "Student profile not found" });

      const Batch = require("../models/Batch");
      const studentBatches = await Batch.find({ studentIds: student._id }).select("_id");
      const batchIds = studentBatches.map(b => b._id);

      const isEligible = (student, job, batchIds) => {
        // 1. Check deadline (if set and has passed)
        if (job.deadline && new Date(job.deadline) < new Date()) {
          return false;
        }

        const elig = job.eligibility || {};

        // 2. CGPA check
        if (elig.minCgpa !== undefined && elig.minCgpa !== null && elig.minCgpa !== "N/A" && elig.minCgpa !== "") {
          const minCgpa = parseFloat(elig.minCgpa);
          if (!isNaN(minCgpa) && (student.cgpa || 0) < minCgpa) return false;
        }

        // 3. Max Backlogs check
        if (elig.maxBacklogs !== undefined && elig.maxBacklogs !== null && elig.maxBacklogs !== "N/A" && elig.maxBacklogs !== "") {
          const maxBacklogs = parseInt(elig.maxBacklogs);
          if (!isNaN(maxBacklogs) && (student.backlogs || 0) > maxBacklogs) return false;
        }

        // 4. Max Active Backlogs check
        if (elig.maxActiveBacklogs !== undefined && elig.maxActiveBacklogs !== null && elig.maxActiveBacklogs !== "N/A" && elig.maxActiveBacklogs !== "") {
          const maxActiveBacklogs = parseInt(elig.maxActiveBacklogs);
          if (!isNaN(maxActiveBacklogs) && (student.activeBacklogs || 0) > maxActiveBacklogs) return false;
        }

        // 5. Min 10th % check
        if (elig.minTenthPercent !== undefined && elig.minTenthPercent !== null && elig.minTenthPercent !== "N/A" && elig.minTenthPercent !== "") {
          const minTenth = parseFloat(elig.minTenthPercent);
          if (!isNaN(minTenth) && (student.tenthPercent || 0) < minTenth) return false;
        }

        // 6. Min 12th % check
        if (elig.minTwelfthPercent !== undefined && elig.minTwelfthPercent !== null && elig.minTwelfthPercent !== "N/A" && elig.minTwelfthPercent !== "") {
          const minTwelfth = parseFloat(elig.minTwelfthPercent);
          if (!isNaN(minTwelfth) && (student.twelfthPercent || 0) < minTwelfth) return false;
        }

        // 7. Batch Years check
        if (elig.batchYears && elig.batchYears.length > 0) {
          if (student.year && !elig.batchYears.includes(student.year)) return false;
        }

        // 8. Batch IDs check
        if (elig.batchIds && elig.batchIds.length > 0) {
          const hasMatchingBatch = elig.batchIds.some(bid => batchIds.some(sid => sid.toString() === bid.toString()));
          if (!hasMatchingBatch) return false;
        }

        // 9. Placement Status check
        if (elig.placementStatus && elig.placementStatus.length > 0) {
          if (!elig.placementStatus.includes(student.placementStatus || "not_placed")) return false;
        }

        // 10. Sections check
        if (elig.sections && elig.sections.length > 0) {
          if (student.section && !elig.sections.includes(student.section)) return false;
        }

        // 11. Departments check
        if (elig.departments && elig.departments.length > 0) {
          if (student.department && !elig.departments.includes(student.department)) return false;
        }

        // 12. Branches check (smart matching)
        if (elig.branches && elig.branches.length > 0) {
          const studentBranch = (student.branch || "").toUpperCase();
          const jobBranches = elig.branches.map(b => (b || "").toUpperCase());

          const isMatched = jobBranches.some(jb => {
            if (jb === studentBranch) return true;
            // If job branches includes general degrees or general engineering terms, student is eligible
            if (["B.TECH", "M.TECH", "BE", "ME", "DEGREE", "ANY", "ALL", "GRADUATE", "ENGINEERING", "MCA", "BCA", "BSC", "MSC"].includes(jb)) return true;
            if (jb.includes(studentBranch) || studentBranch.includes(jb)) return true;
            // Abbreviation checks
            if (studentBranch === "CSE" && (jb === "CS" || jb.includes("COMPUTER"))) return true;
            if (studentBranch === "ECE" && (jb === "EC" || jb.includes("ELECTRONIC"))) return true;
            if (studentBranch === "EEE" && (jb === "EE" || jb.includes("ELECTRICAL"))) return true;
            if (studentBranch === "MECH" && (jb === "ME" || jb.includes("MECHANICAL"))) return true;
            if (studentBranch === "CIVIL" && (jb === "CE" || jb.includes("CIVIL"))) return true;
            if (studentBranch === "IT" && (jb === "INFORMATION" || jb.includes("TECH"))) return true;
            return false;
          });

          if (!isMatched) return false;
        }

        return true;
      };

      // Reset query back to just collegeId and status for Javascript filtering
      query = { collegeId: req.user.collegeId, status: "active" };
      if (req.query.search) {
        const searchRegex = { $regex: req.query.search, $options: "i" };
        query.$or = [
          { title: searchRegex },
          { company: searchRegex },
          { location: searchRegex },
          { description: searchRegex },
          { rolesAndResponsibilities: searchRegex },
          { requirements: searchRegex },
          { stipend: searchRegex }
        ];
      }

      const jobs = await Job.find(query).sort({ urgencyScore: -1, createdAt: -1 });
      
      const Application = require("../models/Application");
      const studentApps = await Application.find({ studentId: req.user._id }).select("jobId");
      const appliedJobIds = new Set(studentApps.map(app => app.jobId.toString()));

      const filteredJobs = jobs.filter(job => !appliedJobIds.has(job._id.toString()) && isEligible(student, job, batchIds));

      const jobsWithScores = filteredJobs.map(job => {
        const jobObj = job.toObject();
        jobObj.matchScore = calculateRuleBasedScore(student.resumeText, job.description);
        return jobObj;
      });

      return res.json(jobsWithScores);
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/jobs
router.post("/", protect, requireRole("coordinator"), async (req, res) => {
  try {
    // Free tier check
    if (req.user.subRole === "coordinator_free") {
      const activeCount = await Job.countDocuments({ 
        collegeId: req.user.collegeId, 
        status: "active" 
      });
      if (activeCount >= 5) {
        return res.status(403).json({ error: "Free tier limit reached (5 active jobs). Upgrade to post more." });
      }
    }

    const job = await Job.create({
      ...req.body,
      collegeId: req.user.collegeId,
      postedBy: req.user._id
    });
    res.status(201).json(job);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/jobs/:id/summarise
router.post("/:id/summarise", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const summary = await summariseJD(job.description);
    job.aiSummary = summary;
    await job.save();
    res.json(job);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/jobs/scrape
router.post("/scrape", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const { url } = req.body;
    
    // Check if we already have this job in the database for the college
    const existingJob = await Job.findOne({ sourceUrl: url, collegeId: req.user.collegeId });
    if (existingJob) {
      console.log(`[CACHE HIT] Returning cached job details for URL: ${url}`);
      return res.json({
        title: existingJob.title,
        company: existingJob.company,
        description: existingJob.description,
        stipend: existingJob.stipend || existingJob.ctc,
        ctc: existingJob.ctc || existingJob.stipend,
        location: existingJob.location,
        deadline: existingJob.deadline,
        jobType: existingJob.jobType,
        eligibility: existingJob.eligibility,
        rolesAndResponsibilities: existingJob.rolesAndResponsibilities,
        requirements: existingJob.requirements,
        additionalInfo: existingJob.additionalInfo,
        sourceUrl: existingJob.sourceUrl,
        aiSummary: existingJob.aiSummary,
        cached: true
      });
    }

    const scrapedData = await scrapeUnstop(url);
    // Sync stipend <-> ctc for backwards compat
    if (scrapedData.stipend && scrapedData.stipend !== 'N/A') scrapedData.ctc = scrapedData.stipend;
    if (scrapedData.ctc && scrapedData.ctc !== 'N/A') scrapedData.stipend = scrapedData.ctc;
    // Build combined description for ATS/AI features
    const parts = [
      scrapedData.rolesAndResponsibilities,
      scrapedData.requirements,
      scrapedData.description
    ].filter(p => p && p !== 'N/A');
    if (parts.length) scrapedData.description = parts.join('\n\n');
    res.json(scrapedData);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/jobs/:id/broadcast
router.post("/:id/broadcast", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    const students = await User.find({ 
      collegeId: req.user.collegeId, 
      role: "student",
      // Optional: filter by eligibility
    });

    // Use the newly added phone field from User model
    const phoneNumbers = students.map(s => s.phone).filter(p => !!p);
    
    if (phoneNumbers.length === 0) {
      return res.status(400).json({ error: "No students with phone numbers found for broadcast" });
    }

    await broadcastJob(phoneNumbers, job);
    res.json({ message: "Broadcast initiated" });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/jobs/:id/ai-review
router.post("/:id/ai-review", protect, async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== "student") return res.status(403).json({ error: "Only students can use AI Review" });
    
    // Check quota
    const now = new Date();
    if (student.aiReviewResetDate && now > student.aiReviewResetDate) {
      student.aiReviewsUsed = 0;
      student.aiReviewResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    if (student.aiReviewsUsed >= 3) {
      return res.status(403).json({ error: "AI Review quota exceeded (3/3). Resets next month." });
    }

    if (!student.resumeText) {
      return res.status(400).json({ error: "No resume found. Please upload a resume in your profile." });
    }

    const job = await Job.findOne({ _id: req.params.id, collegeId: student.collegeId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Check cache
    const cached = await AtsScore.findOne({ studentId: student._id, jobId: job._id });
    if (cached) {
      if (student.resumeUpdatedAt && cached.createdAt > student.resumeUpdatedAt) {
        return res.json(cached); // Valid cache, don't burn quota
      } else {
        await AtsScore.deleteOne({ _id: cached._id }); // Stale cache
      }
    }

    // Call AI
    const result = await performAiReview(student.resumeText, job.description);
    
    // Save Cache
    const newScore = await AtsScore.create({
      studentId: student._id,
      jobId: job._id,
      score: result.score,
      grade: result.grade,
      matchedKeywords: result.matchedKeywords,
      missingKeywords: result.missingKeywords,
      suggestion: result.suggestion
    });

    // Burn Quota
    student.aiReviewsUsed += 1;
    await student.save();

    res.json(newScore);
  } catch (error) {
    console.error("AI Review API Error:", error);
    res.status(500).json({ error: "Failed to perform AI review" });
  }
});

// @route   PUT /api/jobs/:id
// @desc    Update a job details/status
router.put("/:id", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const job = await Job.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    // Update fields allowed
    const fieldsToUpdate = [
      "title", "company", "description", "stipend", "ctc", "location",
      "deadline", "status", "jobType", "workMode", "duration", "eligibility",
      "rolesAndResponsibilities", "requirements", "additionalInfo"
    ];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });
    // Keep ctc <-> stipend in sync
    if (req.body.stipend !== undefined) job.ctc = req.body.stipend;
    if (req.body.ctc !== undefined) job.stipend = req.body.ctc;

    await job.save();
    res.json(job);
  } catch (error) {
    console.error("API Error updating job:", error);
    res.status(500).json({ error: "Server error updating job" });
  }
});

// @route   DELETE /api/jobs/:id
// @desc    Delete a job listing
router.delete("/:id", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!job) return res.status(404).json({ error: "Job not found" });

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("API Error deleting job:", error);
    res.status(500).json({ error: "Server error deleting job" });
  }
});

module.exports = router;
