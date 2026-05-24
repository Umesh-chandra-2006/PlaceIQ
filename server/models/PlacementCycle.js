/**
 * PlacementCycle model schema for tracking annual placement statistics.
 */
const mongoose = require("mongoose");

const placementCycleSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  academicYear: { type: String, required: true },
  startDate: Date,
  endDate: Date,
  totalStudents: { type: Number, default: 0 },
  placedStudents: { type: Number, default: 0 },
  avgCtc: { type: Number, default: 0 },
  highestCtc: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PlacementCycle", placementCycleSchema);
