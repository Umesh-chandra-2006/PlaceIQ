/**
 * Auth routes for registration, login, and user profile.
 */
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const College = require("../models/College");
const { protect } = require("../middleware/auth");

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, branch, year, cgpa, phone } = req.body;
    let collegeId;

    // 1. Whitelist roles on registration (Prevent Privilege Escalation)
    if (!["student", "coordinator"].includes(role)) {
      return res.status(400).json({ error: "Invalid role specified" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "User already exists" });

    // 2. Verify College and Domain (Prevent Unauthorized College Access)
    const emailDomain = email.split("@")[1];
    const college = await College.findOne({ emailDomain });
    if (!college) {
      return res.status(404).json({ error: `College not found for domain: ${emailDomain}` });
    }
    collegeId = college._id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let subRole = null;
    if (role === "coordinator") {
      subRole = college.licenceStatus === "paid" ? "coordinator_paid" : "coordinator_free";
    }

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      subRole,
      collegeId,
      branch,
      year,
      cgpa,
      phone
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" })
      });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "An internal server error occurred during registration" });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      user.lastLoginAt = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        collegeId: user.collegeId,
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" })
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "An internal server error occurred during login" });
  }
});

// @route   GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
