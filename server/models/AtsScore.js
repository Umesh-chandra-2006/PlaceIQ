const mongoose = require("mongoose");

const atsScoreSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  score: { type: Number, required: true },
  grade: { type: String, required: true },
  matchedKeywords: [String],
  missingKeywords: [String],
  suggestion: String,
  createdAt: { type: Date, default: Date.now }
});

atsScoreSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("AtsScore", atsScoreSchema);
