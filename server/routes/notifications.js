/**
 * Notification routes for in-app alerts and notifications.
 */
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// @route   GET /api/notifications
// @desc    Get all notifications for current user
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error fetching notifications" });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all user notifications as read
router.put("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all read:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
