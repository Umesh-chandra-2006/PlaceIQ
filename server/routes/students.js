const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Set up Multer storage for PDFs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}.pdf`);
  }
});
const upload = multer({ storage });

// POST /api/students/onboard
router.post("/onboard", protect, upload.single("resume"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can onboard here." });
    }

    const { department, section, rollNumber, cgpa, tenthPercent, twelfthPercent, activeBacklogs, skills } = req.body;
    
    // Update user fields
    if (department) user.department = department;
    if (section) user.section = section;
    if (rollNumber) user.rollNumber = rollNumber;
    if (cgpa) user.cgpa = Number(cgpa);
    if (tenthPercent) user.tenthPercent = Number(tenthPercent);
    if (twelfthPercent) user.twelfthPercent = Number(twelfthPercent);
    if (activeBacklogs) user.activeBacklogs = Number(activeBacklogs);
    if (skills) {
      user.skills = typeof skills === "string" ? skills.split(",").map(s => s.trim()) : skills;
    }

    // Process resume if uploaded
    if (req.file) {
      const dataBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(dataBuffer);
      user.resumeText = pdfData.text;
      user.resumeUrl = `/uploads/${req.file.filename}`;
      user.resumeUpdatedAt = Date.now();
    }

    user.isOnboarded = true;
    // Set initial quota
    user.aiReviewsUsed = 0;
    user.aiReviewResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    await user.save();
    
    // Return sanitized user
    const userObj = user.toObject();
    delete userObj.password;
    res.json(userObj);

  } catch (error) {
    console.error("Onboarding Error:", error);
    res.status(500).json({ error: "Failed to complete onboarding." });
  }
});

// GET /api/students/me
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resumeText");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
