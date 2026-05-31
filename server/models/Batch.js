const mongoose = require("mongoose");

const batchSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  name: { type: String, required: true },
  branch: String,
  section: String,
  year: Number,
  academicYear: String,
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

batchSchema.index({ collegeId: 1 });

module.exports = mongoose.model("Batch", batchSchema);
