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
const College = require("../models/College");
const paginate = require("../middleware/paginate");
const { enforceOnboarding } = require("../middleware/onboarded");
const { logAudit } = require("../middleware/auditLogger");
const { isEligible } = require("../services/eligibility");

// @route   GET /api/jobs
router.get("/", protect, paginate(), async (req, res) => {
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

      const total = jobsWithScores.length;
      const paginatedJobs = jobsWithScores.slice(req.pagination.skip, req.pagination.skip + req.pagination.limit);

      return res.json({
        total,
        page: req.pagination.page,
        limit: req.pagination.limit,
        pages: Math.ceil(total / req.pagination.limit),
        data: paginatedJobs
      });
    }

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip(req.pagination.skip)
      .limit(req.pagination.limit);

    res.json({
      total,
      page: req.pagination.page,
      limit: req.pagination.limit,
      pages: Math.ceil(total / req.pagination.limit),
      data: jobs
    });
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
    await logAudit(req, "CREATE_JOB", "Job", job._id, { title: job.title, company: job.company });
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
    if (scrapedData.stipend && scrapedData.stipend !== "N/A") scrapedData.ctc = scrapedData.stipend;
    if (scrapedData.ctc && scrapedData.ctc !== "N/A") scrapedData.stipend = scrapedData.ctc;
    // Build combined description for ATS/AI features
    const parts = [
      scrapedData.rolesAndResponsibilities,
      scrapedData.requirements,
      scrapedData.description
    ].filter(p => p && p !== "N/A");
    if (parts.length) scrapedData.description = parts.join("\n\n");
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
router.post("/:id/ai-review", protect, enforceOnboarding, async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student || student.role !== "student") return res.status(403).json({ error: "Only students can use AI Review" });
    
    // Check quota
    const college = await College.findById(student.collegeId);
    const quotaLimit = college?.aiReviewQuota ?? 3;
    
    const now = new Date();
    if (!student.aiReviewResetDate) {
      student.aiReviewResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (now > student.aiReviewResetDate) {
      student.aiReviewsUsed = 0;
      student.aiReviewResetDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    if (student.aiReviewsUsed >= quotaLimit) {
      return res.status(403).json({ error: `AI Review quota exceeded (${quotaLimit}/${quotaLimit}). Resets next month.` });
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
    await logAudit(req, "UPDATE_JOB", "Job", job._id, { title: job.title, company: job.company, changes: req.body });
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

    await logAudit(req, "DELETE_JOB", "Job", job._id, { title: job.title, company: job.company });
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("API Error deleting job:", error);
    res.status(500).json({ error: "Server error deleting job" });
  }
});

module.exports = router;
