const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Application = require("../models/Application");
const Batch = require("../models/Batch");
const Job = require("../models/Job");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

// GET /api/export/students?batchId=...
router.get("/students", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { batchId } = req.query;
    let query = { collegeId: req.user.collegeId, role: "student" };
    
    if (batchId) {
      const batch = await Batch.findOne({ _id: batchId, collegeId: req.user.collegeId });
      if (!batch) return res.status(404).json({ error: "Batch not found" });
      query._id = { $in: batch.studentIds };
    }

    const students = await User.find(query).select("name email rollNumber cgpa branch year placementStatus isActive");

    let csv = "Name,Email,Roll Number,CGPA,Branch,Graduation Year,Status,Active\n";
    students.forEach(s => {
      csv += `"${s.name || ""}","${s.email || ""}","${s.rollNumber || ""}","${s.cgpa || 0}","${s.branch || ""}","${s.year || ""}","${s.placementStatus || "not_placed"}","${s.isActive !== false ? "Yes" : "No"}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=students_export_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/applications?jobId=...
router.get("/applications", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { jobId } = req.query;
    let query = { collegeId: req.user.collegeId };
    if (jobId) {
      // Verify job belongs to this college
      const job = await Job.findOne({ _id: jobId, collegeId: req.user.collegeId });
      if (!job) return res.status(404).json({ error: "Job not found" });
      query.jobId = jobId;
    }

    const apps = await Application.find(query)
      .populate("studentId", "name email rollNumber cgpa branch")
      .populate("jobId", "title company");

    let csv = "Job ID,Company,Role,Student Name,Student Email,Roll Number,CGPA,Branch,Stage,Applied Date\n";
    apps.forEach(a => {
      const s = a.studentId || {};
      const j = a.jobId || {};
      csv += `"${a.jobId?._id || ""}","${j.company || ""}","${j.title || ""}","${s.name || ""}","${s.email || ""}","${s.rollNumber || ""}","${s.cgpa || 0}","${s.branch || ""}","${a.stage}","${a.createdAt?.toISOString() || ""}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=applications_export_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/export/placement-report
router.get("/placement-report", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const students = await User.find({ collegeId: req.user.collegeId, role: "student" }).select("name email rollNumber cgpa branch year placementStatus");
    
    let csv = "Student Name,Email,Roll Number,CGPA,Branch,Year,Placement Status\n";
    students.forEach(s => {
      csv += `"${s.name || ""}","${s.email || ""}","${s.rollNumber || ""}","${s.cgpa || 0}","${s.branch || ""}","${s.year || ""}","${s.placementStatus || "not_placed"}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=placement_report_${Date.now()}.csv`);
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
