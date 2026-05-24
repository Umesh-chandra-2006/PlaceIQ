/**
 * Job model schema for placement listings.
 */
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: String,
  aiSummary: [String],
  ctc: String,
  location: String,
  jobType: { type: String, enum: ["fulltime", "internship", "ppo"], default: "fulltime" },
  eligibility: {
    branches: [String],
    departments: [String],
    sections: [String],
    batchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
    minCgpa: { type: Number, default: 0 },
    maxBacklogs: { type: Number, default: 0 },
    maxActiveBacklogs: { type: Number, default: 0 },
    minTenthPercent: { type: Number, default: 0 },
    minTwelfthPercent: { type: Number, default: 0 },
    batchYears: [Number],
    placementStatus: { type: [String], default: ["not_placed"] }
  },
  sourceUrl: String,
  deadline: Date,
  urgencyScore: { type: Number, default: 0 },
  applicationCount: { type: Number, default: 0 },
  status: { type: String, enum: ["draft", "active", "closed"], default: "draft" },
  autoScraped: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Job", jobSchema);
