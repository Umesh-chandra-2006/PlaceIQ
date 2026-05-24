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
      query.$or = [
        { title: { $regex: req.query.search, $options: "i" } },
        { company: { $regex: req.query.search, $options: "i" } }
      ];
    }

    if (req.user.role === "student") {
      // Query student profile from DB instead of trusting JWT (Prevent CGPA Spoofing)
      const student = await User.findById(req.user._id);
      if (!student) return res.status(404).json({ error: "Student profile not found" });

      const Batch = require("../models/Batch");
      const studentBatches = await Batch.find({ studentIds: student._id }).select("_id");
      const batchIds = studentBatches.map(b => b._id);

      query = {
        ...query,
        status: "active",
        deadline: { $gte: new Date() },
        "eligibility.branches": { $in: [student.branch] },
        "eligibility.minCgpa": { $lte: student.cgpa },
        "eligibility.maxBacklogs": { $gte: student.backlogs },
        "eligibility.maxActiveBacklogs": { $gte: student.activeBacklogs || 0 },
        "eligibility.minTenthPercent": { $lte: student.tenthPercent || 0 },
        "eligibility.minTwelfthPercent": { $lte: student.twelfthPercent || 0 },
        "eligibility.batchYears": { $in: [student.year] },
        $and: [
          {
            $or: [
              { "eligibility.departments": { $size: 0 } },
              { "eligibility.departments": { $exists: false } },
              { "eligibility.departments": { $in: [student.department] } }
            ]
          },
          {
            $or: [
              { "eligibility.sections": { $size: 0 } },
              { "eligibility.sections": { $exists: false } },
              { "eligibility.sections": { $in: [student.section] } }
            ]
          },
          {
            $or: [
              { "eligibility.batchIds": { $size: 0 } },
              { "eligibility.batchIds": { $exists: false } },
              { "eligibility.batchIds": { $in: batchIds } }
            ]
          },
          {
            $or: [
              { "eligibility.placementStatus": { $size: 0 } },
              { "eligibility.placementStatus": { $exists: false } },
              { "eligibility.placementStatus": { $in: [student.placementStatus || "not_placed"] } }
            ]
          }
        ]
      };
    }

    const jobs = await Job.find(query).sort({ urgencyScore: -1, createdAt: -1 });
    
    if (req.user.role === "student") {
      const student = await User.findById(req.user._id);
      const jobsWithScores = jobs.map(job => {
        const jobObj = job.toObject();
        jobObj.matchScore = calculateRuleBasedScore(student.resumeText, job.description);
        return jobObj;
      });
      return res.json(jobsWithScores);
    }

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
    const job = await Job.findById(req.params.id);
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
    const scrapedData = await scrapeUnstop(url);
    res.json(scrapedData);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/jobs/:id/broadcast
router.post("/:id/broadcast", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
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

    const job = await Job.findById(req.params.id);
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

module.exports = router;
