/**
 * Application routes for students to apply and coordinators to track.
 */
const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

// @route   GET /api/applications
router.get("/", protect, async (req, res) => {
  try {
    let query = { collegeId: req.user.collegeId }; // Always scope by collegeId

    if (req.user.role === "student") {
      query.studentId = req.user._id;
    } else if (req.user.role === "coordinator") {
      if (req.query.jobId) {
        // Verify job belongs to coordinator's college
        const job = await Job.findOne({ _id: req.query.jobId, collegeId: req.user.collegeId });
        if (!job) return res.status(403).json({ error: "Access denied to this job's applications" });
        query.jobId = req.query.jobId;
      }
    }
    const apps = await Application.find(query)
      .populate("jobId")
      .populate("studentId", "name email branch year cgpa")
      .sort({ updatedAt: -1 });
    res.json(apps);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/applications
router.post("/", protect, requireRole("student"), async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const existing = await Application.findOne({ jobId, studentId: req.user._id });
    if (existing) return res.status(400).json({ error: "Already applied" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    const app = await Application.create({
      jobId,
      studentId: req.user._id,
      collegeId: req.user.collegeId,
      stage: "applied",
      stageHistory: [{ stage: "applied", changedAt: new Date() }]
    });

    job.applicationCount += 1;
    await job.save();

    req.user.applicationCount += 1;
    await req.user.save();

    res.status(201).json(app);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   PUT /api/applications/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    // Ensure application belongs to the same college
    if (app.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Forbidden: Cross-college access denied" });
    }

    // Students can update notes, coordinators update stage
    if (req.user.role === "student") {
      if (app.studentId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      if (req.body.notes) app.notes = req.body.notes;
    } else if (req.user.role === "coordinator") {
      // Verify coordinator owns the job or belongs to the same college (already checked above)
      if (req.body.stage) {
        app.stage = req.body.stage;
        app.stageHistory.push({ stage: req.body.stage, changedAt: new Date() });
        
        // If offer accepted, mark student as placed
        if (req.body.stage === "offer") {
          await User.findByIdAndUpdate(app.studentId, { isPlaced: true });
        }
      }
    }

    app.updatedAt = new Date();
    await app.save();
    res.json(app);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

module.exports = router;
