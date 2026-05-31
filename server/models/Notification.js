/**
 * Notification model schema for user alerts (shortlists, drives, schedules).
 */
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["job_drive", "shortlist", "interview", "offer", "general"], 
    default: "general" 
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
