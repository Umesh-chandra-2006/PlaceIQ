/**
 * Admin routes for platform management.
 */
const express = require("express");
const router = express.Router();
const College = require("../models/College");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

// @route   POST /api/admin/colleges
router.post("/colleges", protect, requireRole("admin"), async (req, res) => {
  try {
    const college = await College.create(req.body);
    res.status(201).json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/colleges/:id/upgrade
router.put("/colleges/:id/upgrade", protect, requireRole("admin"), async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id, 
      { licenceStatus: "paid" }, 
      { new: true }
    );
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/admin/colleges
router.get("/colleges", protect, requireRole("admin"), async (req, res) => {
  try {
    const colleges = await College.find({});
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
