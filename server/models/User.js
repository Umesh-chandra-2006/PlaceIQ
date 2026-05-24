/**
 * User model schema for authentication and profile management.
 * Supports roles: admin, coordinator, student.
 */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "coordinator", "student"], required: true },
  subRole: { type: String, enum: ["coordinator_free", "coordinator_paid", null], default: null },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
  branch: String,
  department: String,
  section: String,
  rollNumber: String,
  year: Number,
  cgpa: Number,
  tenthPercent: Number,
  twelfthPercent: Number,
  backlogs: { type: Number, default: 0 },
  activeBacklogs: { type: Number, default: 0 },
  skills: [String],
  resumeText: String,
  resumeUrl: String,
  resumeUpdatedAt: Date,
  isOnboarded: { type: Boolean, default: false },
  aiReviewsUsed: { type: Number, default: 0 },
  aiReviewResetDate: Date,
  placementStatus: {
    type: String,
    enum: ["not_placed", "placed_on_campus", "placed_off_campus", "opted_out"],
    default: "not_placed"
  },
  offers: [{
    company: String,
    ctc: String,
    offeredAt: Date,
    isAccepted: Boolean
  }],
  isPlaced: { type: Boolean, default: false },
  lastLoginAt: Date,
  applicationCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
