const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const User = require("../models/User");
const Batch = require("../models/Batch");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");
const { sendAnnouncementEmail } = require("../services/email");

// @route   GET /api/announcements
router.get("/", protect, async (req, res) => {
  try {
    let query = { collegeId: req.user.collegeId };

    if (req.user.role === "student") {
      const studentBatches = await Batch.find({ studentIds: req.user.id }).select("_id");
      const batchIds = studentBatches.map(b => b._id);

      query.$or = [
        { targetBatches: { $size: 0 } }, // Global
        { targetBatches: { $exists: false } },
        { targetBatches: { $in: batchIds } }
      ];
    }

    const announcements = await Announcement.find(query)
      .populate("author", "name email")
      .populate("targetBatches", "name")
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/announcements
router.post("/", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { title, content, targetBatches, priority } = req.body;

    const announcement = await Announcement.create({
      collegeId: req.user.collegeId,
      author: req.user.id,
      title,
      content,
      targetBatches: targetBatches || [],
      priority: priority || "normal"
    });

    // Handle high priority email
    if (priority === "high") {
      let targetEmails = [];
      if (!targetBatches || targetBatches.length === 0) {
        // Global
        const students = await User.find({ collegeId: req.user.collegeId, role: "student" }).select("email");
        targetEmails = students.map(s => s.email);
      } else {
        // Targeted
        const batches = await Batch.find({ _id: { $in: targetBatches } });
        let studentIds = [];
        batches.forEach(b => {
          studentIds.push(...b.studentIds);
        });
        const students = await User.find({ _id: { $in: studentIds } }).select("email");
        targetEmails = students.map(s => s.email);
      }

      if (targetEmails.length > 0) {
        // Send email
        await sendAnnouncementEmail(targetEmails, title, content);
      }
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// @route   POST /api/announcements/:id/read
router.post("/:id/read", protect, async (req, res) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ error: "Only students can mark as read" });

    const announcement = await Announcement.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!announcement) return res.status(404).json({ error: "Not found" });

    if (!announcement.readBy.some(id => id.toString() === req.user.id)) {
      announcement.readBy.push(req.user.id);
      await announcement.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
