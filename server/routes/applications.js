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
const { calculateRuleBasedScore } = require("../services/ats");

const paginate = require("../middleware/paginate");
const { enforceOnboarding } = require("../middleware/onboarded");
const { logAudit } = require("../middleware/auditLogger");

// @route   GET /api/applications
router.get("/", protect, paginate(), async (req, res) => {
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
    const total = await Application.countDocuments(query);
    const apps = await Application.find(query)
      .populate("jobId")
      .populate("studentId", "name email branch year cgpa")
      .sort({ updatedAt: -1 })
      .skip(req.pagination.skip)
      .limit(req.pagination.limit);

    res.json({
      total,
      page: req.pagination.page,
      limit: req.pagination.limit,
      pages: Math.ceil(total / req.pagination.limit),
      data: apps
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   POST /api/applications
router.post("/", protect, enforceOnboarding, requireRole("student"), async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const existing = await Application.findOne({ jobId, studentId: req.user._id });
    if (existing) return res.status(400).json({ error: "Already applied" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (job.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Access denied: Job belongs to another college" });
    }

    const matchScore = calculateRuleBasedScore(req.user.resumeText, job.description);

    const app = await Application.create({
      jobId,
      studentId: req.user._id,
      collegeId: req.user.collegeId,
      stage: "applied",
      matchScore,
      stageHistory: [{ stage: "applied", changedAt: new Date() }]
    });

    job.applicationCount += 1;
    await job.save();

    req.user.applicationCount += 1;
    await req.user.save();

    res.status(201).json(app);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Already applied" });
    }
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// @route   PUT /api/applications/:id
router.put("/:id", protect, enforceOnboarding, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });

    const previousStage = app.stage;

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
      if (req.body.notes !== undefined) app.notes = req.body.notes;
      // Verify coordinator owns the job or belongs to the same college (already checked above)
      if (req.body.stage) {
        if (req.body.expectedStage && app.stage !== req.body.expectedStage) {
          return res.status(409).json({ 
            error: "Conflict: Application stage was changed by another user",
            currentStage: app.stage 
          });
        }
        const previousStage = app.stage; // already declared above, but keep compatibility
        app.stage = req.body.stage;
        app.stageHistory.push({ stage: req.body.stage, changedAt: new Date() });
        
        // If moved TO offer, mark student as placed
        if (req.body.stage === "offer") {
          await User.findByIdAndUpdate(app.studentId, {
            isPlaced: true,
            placementStatus: "placed_on_campus"
          });
        }
        // If moved AWAY from offer, revert placement status
        else if (previousStage === "offer") {
          // Only revert if the student has no other active offers
          const otherOffers = await Application.countDocuments({
            studentId: app.studentId,
            stage: "offer",
            _id: { $ne: app._id }
          });
          if (otherOffers === 0) {
            await User.findByIdAndUpdate(app.studentId, {
              isPlaced: false,
              placementStatus: "not_placed"
            });
          }
        }
      }
    }

    app.updatedAt = new Date();
    await app.save();
    await logAudit(req, "UPDATE_APPLICATION", "Application", app._id, { stage: app.stage, previousStage, notes: app.notes });
    res.json(app);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "An internal server error occurred" });
  }
});

// Configure Multer for PDF offer letter uploads
const multer = require("multer");
const { uploadFile } = require("../services/storageService");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadSingleOffer = (req, res, next) => {
  upload.single("offerLetter")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// @route   POST /api/applications/:id/rounds
// @desc    Schedule a new interview round for an application
router.post("/:id/rounds", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { roundType, scheduledAt, notes } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Forbidden: College mismatch" });
    }

    const nextRoundNumber = app.interviewRounds.length + 1;
    app.interviewRounds.push({
      roundNumber: nextRoundNumber,
      roundType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      notes,
      status: "scheduled"
    });

    app.updatedAt = new Date();
    await app.save();

    // Send in-app notification to student
    const Notification = require("../models/Notification");
    await Notification.create({
      userId: app.studentId,
      collegeId: app.collegeId,
      title: "Interview Round Scheduled",
      message: `Your ${roundType} round has been scheduled for ${scheduledAt ? new Date(scheduledAt).toLocaleDateString() : "N/A"}`,
      type: "interview"
    });

    res.json(app);
  } catch (error) {
    console.error("Error creating round:", error);
    res.status(500).json({ error: "Server error scheduling interview round" });
  }
});

// @route   PUT /api/applications/:id/rounds/:roundId
// @desc    Update status or notes of an interview round
router.put("/:id/rounds/:roundId", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { status, feedback, notes } = req.body;
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const round = app.interviewRounds.id(req.params.roundId);
    if (!round) return res.status(404).json({ error: "Round not found" });

    if (status) round.status = status;
    if (feedback !== undefined) round.feedback = feedback;
    if (notes !== undefined) round.notes = notes;

    app.updatedAt = new Date();
    await app.save();

    // Send in-app notification to student
    const Notification = require("../models/Notification");
    await Notification.create({
      userId: app.studentId,
      collegeId: app.collegeId,
      title: "Interview Round Updated",
      message: `Your ${round.roundType} interview round status is updated to: ${status.toUpperCase()}`,
      type: "interview"
    });

    res.json(app);
  } catch (error) {
    console.error("Error updating round:", error);
    res.status(500).json({ error: "Server error updating interview round" });
  }
});

// @route   PUT /api/applications/:id/offer-upload
// @desc    Allows students to upload their PDF offer letters
router.put("/:id/offer-upload", protect, enforceOnboarding, requireRole("student"), uploadSingleOffer, async (req, res) => {
  try {
    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized: Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Please upload a PDF offer letter file" });
    }

    const fileUrl = await uploadFile(req.file.buffer, req.file.originalname, "offer", req.params.id);

    app.offerDetails = {
      ctc: req.body.ctc || (app.offerDetails && app.offerDetails.ctc) || "",
      offerLetterUrl: fileUrl,
      uploadedAt: new Date(),
      status: "pending_review"
    };

    app.updatedAt = new Date();
    await app.save();
    await logAudit(req, "UPLOAD_OFFER_LETTER", "Application", app._id, { ctc: app.offerDetails.ctc });

    // Send in-app notification to college coordinators
    const Notification = require("../models/Notification");
    const coordinators = await User.find({ collegeId: app.collegeId, role: "coordinator" });
    for (const coord of coordinators) {
      await Notification.create({
        userId: coord._id,
        collegeId: app.collegeId,
        title: "New Offer Letter Uploaded",
        message: `${req.user.name} has uploaded an offer letter for review.`,
        type: "offer"
      });
    }

    res.json(app);
  } catch (error) {
    console.error("Error uploading offer letter:", error);
    res.status(500).json({ error: "Server error uploading offer letter" });
  }
});

// @route   PUT /api/applications/:id/offer-verify
// @desc    Coordinators verify or reject student offer letter uploads
router.put("/:id/offer-verify", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;
    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Status must be 'verified' or 'rejected'" });
    }

    const app = await Application.findById(req.params.id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!app.offerDetails || !app.offerDetails.offerLetterUrl) {
      return res.status(400).json({ error: "No offer letter uploaded yet" });
    }

    app.offerDetails.status = status;
    app.offerDetails.reviewNotes = reviewNotes || "";
    app.offerDetails.reviewedBy = req.user._id;
    app.offerDetails.reviewedAt = new Date();

    if (status === "verified") {
      app.stage = "offer";
      if (!app.stageHistory.some(h => h.stage === "offer")) {
        app.stageHistory.push({ stage: "offer", changedAt: new Date() });
      }
      
      // Update student placed status
      await User.findByIdAndUpdate(app.studentId, {
        isPlaced: true,
        placementStatus: "placed_on_campus"
      });
    }

    app.updatedAt = new Date();
    await app.save();

    // Send in-app notification to student
    const Notification = require("../models/Notification");
    await Notification.create({
      userId: app.studentId,
      collegeId: app.collegeId,
      title: `Offer Letter ${status === "verified" ? "Verified" : "Rejected"}`,
      message: `Your uploaded offer letter was ${status === "verified" ? "approved" : "rejected by the coordinator"}. Review notes: ${reviewNotes || "None"}`,
      type: "offer"
    });

    res.json(app);
  } catch (error) {
    console.error("Error verifying offer letter:", error);
    res.status(500).json({ error: "Server error verifying offer letter" });
  }
});

module.exports = router;
