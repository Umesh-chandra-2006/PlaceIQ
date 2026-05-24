const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  targetBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: "Batch" }], // Empty means global
  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", announcementSchema);
