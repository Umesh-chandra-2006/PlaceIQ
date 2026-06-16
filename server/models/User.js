/**
 * User model schema for authentication and profile management.
 * Supports roles: admin, coordinator, student.
 */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["superadmin", "admin", "coordinator", "student"], required: true },
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
  latexResumeSource: { type: String, default: "" },
  resumeUpdatedAt: Date,
  isOnboarded: { type: Boolean, default: false },
  isSetup: { type: Boolean, default: false },
  setupToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
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
  isActive: { type: Boolean, default: true },
  loginEmailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ collegeId: 1, role: 1 });
userSchema.index({ email: 1 });
userSchema.index({ setupToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

module.exports = mongoose.model("User", userSchema);

