/**
 * Analytics routes for coordinators (paid tier).
 */
const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const User = require("../models/User");
const PlacementCycle = require("../models/PlacementCycle");
const { protect } = require("../middleware/auth");
const { requireRole, requirePaid } = require("../middleware/requireRole");

// @route   GET /api/analytics/overview
router.get("/overview", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const cycle = await PlacementCycle.findOne({ 
      collegeId: req.user.collegeId, 
      status: "active" 
    });
    
    const totalStudents = await User.countDocuments({ collegeId: req.user.collegeId, role: "student" });
    const placedStudents = await User.countDocuments({ collegeId: req.user.collegeId, role: "student", isPlaced: true });
    
    res.json({
      cycle,
      totalStudents,
      placedStudents,
      placementRate: totalStudents > 0 ? (placedStudents / totalStudents) * 100 : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/pipeline
router.get("/pipeline", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const stats = await Application.aggregate([
      { $match: { collegeId: req.user.collegeId } },
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/branch
router.get("/branch", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { collegeId: req.user.collegeId, role: "student" } },
      { $group: { 
          _id: "$branch", 
          total: { $sum: 1 },
          placed: { $sum: { $cond: ["$isPlaced", 1, 0] } }
      } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/at-risk
router.get("/at-risk", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const students = await User.find({ 
      collegeId: req.user.collegeId, 
      role: "student",
      isPlaced: false,
      $or: [
        { applicationCount: 0 },
        { activeBacklogs: { $gt: 0 } },
        { cgpa: { $lt: 6.5 } }
      ]
    }).select("name email branch year cgpa activeBacklogs applicationCount");
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/ats-distribution
router.get("/ats-distribution", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const distribution = await Application.aggregate([
      { $match: { collegeId: req.user.collegeId, matchScore: { $exists: true } } },
      { 
        $bucket: {
          groupBy: "$matchScore",
          boundaries: [0, 20, 40, 60, 80, 101],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    res.json(distribution);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/analytics/activity-heatmap
router.get("/activity-heatmap", protect, requireRole("coordinator"), requirePaid, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activity = await Application.aggregate([
      { 
        $match: { 
          collegeId: req.user.collegeId,
          appliedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
