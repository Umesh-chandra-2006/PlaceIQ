const express = require("express");
const router = express.Router();
const multer = require("multer");
const { parse } = require("csv-parse");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const Batch = require("../models/Batch");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

const upload = multer({ dest: "uploads/" });

// @route   GET /api/batches
// @desc    Get all batches for college
router.get("/", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const batches = await Batch.find({ collegeId: req.user.collegeId }).sort({ createdAt: -1 });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/batches
// @desc    Create a new batch
router.post("/", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const batch = await Batch.create({
      ...req.body,
      collegeId: req.user.collegeId
    });
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/batches/:id/students
// @desc    Get students in a batch
router.get("/:id/students", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, collegeId: req.user.collegeId }).populate("studentIds");
    if (!batch) return res.status(404).json({ error: "Batch not found" });
    res.json(batch.studentIds);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/batches/:id/students
// @desc    Upload CSV to bulk import students
router.post("/:id/students", protect, requireRole("coordinator"), upload.single("file"), async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    const results = [];
    fs.createReadStream(req.file.path)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        fs.unlinkSync(req.file.path);

        const newStudents = [];
        for (const row of results) {
          const email = row.email || row.Email;
          if (!email) continue;
          
          let user = await User.findOne({ email });
          if (!user) {
            const passwordHash = await bcrypt.hash(row.password || "student123", 10);
            user = await User.create({
              name: row.name || row.Name,
              email: email,
              passwordHash,
              role: "student",
              collegeId: req.user.collegeId,
              branch: row.branch || row.Branch,
              department: row.department || row.Department,
              section: row.section || row.Section || batch.section,
              rollNumber: row.rollNumber || row.RollNumber,
              year: row.year || row.Year || batch.year,
              cgpa: row.cgpa || row.CGPA || 0,
              tenthPercent: row.tenthPercent || row.TenthPercent || 0,
              twelfthPercent: row.twelfthPercent || row.TwelfthPercent || 0,
              activeBacklogs: row.activeBacklogs || row.ActiveBacklogs || 0,
              backlogs: row.backlogs || row.Backlogs || 0
            });
          }
          if (!batch.studentIds.includes(user._id)) {
            batch.studentIds.push(user._id);
            newStudents.push(user);
          }
        }
        await batch.save();
        res.json({ message: `Imported ${newStudents.length} students`, students: newStudents });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
