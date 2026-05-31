/**
 * College model schema for institutional management and licensing.
 */
const mongoose = require("mongoose");

const collegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  emailDomain: { type: String, required: true, unique: true },
  licenceStatus: { type: String, enum: ["free", "paid", "expired"], default: "free" },
  licenceExpiresAt: Date,
  studentCount: { type: Number, default: 0 },
  coordinatorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  departments: { type: [String], default: ["CSE", "ECE", "MECH", "CIVIL", "EEE", "IT"] },
  cgpaScale: { type: Number, enum: [5, 10], default: 10 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("College", collegeSchema);
