/**
 * Application model schema for tracking student applications to jobs.
 */
const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  stage: {
    type: String,
    enum: ["applied", "oa", "interview", "offer", "rejected"],
    default: "applied"
  },
  stageHistory: [{
    stage: String,
    changedAt: { type: Date, default: Date.now }
  }],
  notes: { type: String, default: "" },
  matchScore: { type: Number, default: 0 },
  interviewRounds: [{
    roundNumber: Number,
    roundType: { type: String, enum: ["Technical", "Managerial", "HR", "GD", "Other"], default: "Technical" },
    scheduledAt: Date,
    status: { type: String, enum: ["scheduled", "passed", "failed", "no_show"], default: "scheduled" },
    feedback: String,
    notes: String
  }],
  offerDetails: {
    ctc: String,
    offerLetterUrl: String,
    uploadedAt: Date,
    status: { type: String, enum: ["pending_review", "verified", "rejected"], default: "pending_review" },
    reviewNotes: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date
  },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

applicationSchema.index({ studentId: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ collegeId: 1, stage: 1 });

module.exports = mongoose.model("Application", applicationSchema);
