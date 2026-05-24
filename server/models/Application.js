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
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Application", applicationSchema);
