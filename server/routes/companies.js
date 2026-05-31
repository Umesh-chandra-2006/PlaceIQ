/**
 * Company routes for CRM and intelligence.
 */
const express = require("express");
const router = express.Router();
const Company = require("../models/Company");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

// @route   GET /api/companies
router.get("/", protect, async (req, res) => {
  try {
    const companies = await Company.find({
      $or: [
        { collegeId: req.user.collegeId },
        { collegeId: null }
      ]
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/companies
router.post("/", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const company = await Company.create({
      ...req.body,
      collegeId: req.user.collegeId
    });
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/companies/:id/intel
router.get("/:id/intel", protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Ensure company is global or belongs to the user's college
    if (company.collegeId && company.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Forbidden: Access to this company's intel is restricted" });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/companies/:id
// @desc    Update company contact, schedule, status, and CRM details
router.put("/:id", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // Verify ownership if company is tied to a specific college
    if (company.collegeId && company.collegeId.toString() !== req.user.collegeId.toString()) {
      return res.status(403).json({ error: "Forbidden: Access denied to this company" });
    }

    const fieldsToUpdate = [
      "name", "status", "expectedVisitDate", "contactPerson",
      "contactEmail", "contactPhone", "notes", "publicData", "historicalData"
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        company[field] = req.body[field];
      }
    });

    await company.save();
    res.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
