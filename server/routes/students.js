const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

const { uploadFile } = require("../services/storageService");

// Use memory storage to process PDF buffer in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

const uploadSingleResume = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// POST /api/students/onboard
router.post("/onboard", protect, uploadSingleResume, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can onboard here." });
    }

    const { department, section, rollNumber, cgpa, tenthPercent, twelfthPercent, activeBacklogs, skills } = req.body;
    
    // Fetch College config to validate CGPA
    const College = require("../models/College");
    const college = await College.findById(user.collegeId);
    if (!college) return res.status(404).json({ error: "College not found." });

    if (cgpa) {
      const numCgpa = Number(cgpa);
      if (numCgpa > college.cgpaScale) {
        return res.status(400).json({ error: `CGPA cannot exceed the maximum scale of ${college.cgpaScale}` });
      }
      user.cgpa = numCgpa;
    }

    // Update user fields
    if (department) {
      user.department = department;
      user.branch = department;
    }
    if (section) user.section = section;
    if (rollNumber) user.rollNumber = rollNumber;
    
    if (tenthPercent !== undefined) {
      const numTenth = Number(tenthPercent);
      if (numTenth > 100 || numTenth < 0) {
        return res.status(400).json({ error: "10th percentage must be between 0% and 100%." });
      }
      user.tenthPercent = numTenth;
    }
    
    if (twelfthPercent !== undefined) {
      const numTwelfth = Number(twelfthPercent);
      if (numTwelfth > 100 || numTwelfth < 0) {
        return res.status(400).json({ error: "12th percentage must be between 0% and 100%." });
      }
      user.twelfthPercent = numTwelfth;
    }
    
    if (activeBacklogs !== undefined) {
      user.activeBacklogs = Number(activeBacklogs);
    }
    
    if (skills) {
      user.skills = typeof skills === "string" ? skills.split(",").map(s => s.trim()) : skills;
    }

    // Process resume if uploaded
    if (req.file) {
      // Parse PDF text from in-memory buffer
      const pdfData = await pdfParse(req.file.buffer);
      user.resumeText = pdfData.text;
      
      // Upload using storage service
      const fileUrl = await uploadFile(req.file.buffer, req.file.originalname, "resume", user._id);
      user.resumeUrl = fileUrl;
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
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Onboarding Error:", error);
    res.status(500).json({ error: "Failed to complete onboarding: " + error.message });
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

// GET /api/students/college-config
router.get("/college-config", protect, async (req, res) => {
  try {
    const College = require("../models/College");
    const user = await User.findById(req.user.id);
    const college = await College.findById(user.collegeId);
    if (!college) return res.status(404).json({ error: "College not found." });
    
    res.json({
      departments: college.departments,
      cgpaScale: college.cgpaScale
    });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching college config" });
  }
});

// PUT /api/students/profile
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can update their profile here." });
    }

    const { name, department, section, rollNumber, cgpa, tenthPercent, twelfthPercent, activeBacklogs, skills } = req.body;

    const College = require("../models/College");
    const college = await College.findById(user.collegeId);
    if (!college) return res.status(404).json({ error: "College not found." });

    if (name) user.name = name;
    if (department) {
      user.department = department;
      user.branch = department; // keep branch synced with department
    }
    if (section) user.section = section;
    if (rollNumber) user.rollNumber = rollNumber;
    
    if (cgpa !== undefined && cgpa !== null) {
      const numCgpa = Number(cgpa);
      if (numCgpa > college.cgpaScale) {
        return res.status(400).json({ error: `CGPA cannot exceed the maximum scale of ${college.cgpaScale}` });
      }
      user.cgpa = numCgpa;
    }
    
    if (tenthPercent !== undefined && tenthPercent !== null) {
      const numTenth = Number(tenthPercent);
      if (numTenth > 100 || numTenth < 0) {
        return res.status(400).json({ error: "10th percentage must be between 0% and 100%." });
      }
      user.tenthPercent = numTenth;
    }
    
    if (twelfthPercent !== undefined && twelfthPercent !== null) {
      const numTwelfth = Number(twelfthPercent);
      if (numTwelfth > 100 || numTwelfth < 0) {
        return res.status(400).json({ error: "12th percentage must be between 0% and 100%." });
      }
      user.twelfthPercent = numTwelfth;
    }
    
    if (activeBacklogs !== undefined && activeBacklogs !== null) {
      user.activeBacklogs = Number(activeBacklogs);
    }
    
    if (skills) {
      user.skills = typeof skills === "string" ? skills.split(",").map(s => s.trim()).filter(Boolean) : skills;
    }

    await user.save();
    
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: "Failed to update profile: " + error.message });
  }
});

module.exports = router;
