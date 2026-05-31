/**
 * Job model schema for placement listings.
 */
const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Core identification
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  jobType: { type: String, enum: ["fulltime", "internship", "ppo"], default: "fulltime" },
  workMode: { type: String, enum: ["inoffice", "remote", "hybrid", "N/A"], default: "N/A" },
  duration: String,  // e.g. "3 months" for internships

  // Compensation — renamed to stipend; ctc kept as alias for backwards compat
  stipend: String,
  ctc: String, // legacy alias; mirrors stipend on save

  // Rich content fields
  description: String,         // legacy combined description (kept for ATS/AI review)
  rolesAndResponsibilities: String,
  requirements: String,
  additionalInfo: String,

  // AI-generated summary bullets
  aiSummary: [String],

  // Eligibility
  eligibility: {
    description: String,       // human-readable summary from scraper
    experience: String,        // e.g. "Fresher", "1-2 years"
    branches: [String],
    departments: [String],
    sections: [String],
    batchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }],
    minCgpa: { type: mongoose.Schema.Types.Mixed, default: "N/A" },
    maxBacklogs: { type: mongoose.Schema.Types.Mixed, default: "N/A" },
    maxActiveBacklogs: { type: mongoose.Schema.Types.Mixed, default: "N/A" },
    minTenthPercent: { type: mongoose.Schema.Types.Mixed, default: "N/A" },
    minTwelfthPercent: { type: mongoose.Schema.Types.Mixed, default: "N/A" },
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

jobSchema.index({ collegeId: 1, status: 1 });
jobSchema.index({ deadline: 1 });

module.exports = mongoose.model("Job", jobSchema);
