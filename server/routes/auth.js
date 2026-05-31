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



// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (user.isActive === false) {
        return res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
      }
      if (user.collegeId) {
        const userCollege = await College.findById(user.collegeId);
        if (userCollege) {
          if (userCollege.isDeleted === true) {
            return res.status(403).json({ error: "Your institution account has been suspended or deleted. Please contact support." });
          }
          if (userCollege.isActive === false) {
            return res.status(403).json({ error: "Your institution account has been deactivated. Please contact support." });
          }
        }
      }
      if (!user.isSetup) {
        return res.status(403).json({ error: "Account setup is pending. Please complete account activation using your setup link." });
      }

      user.lastLoginAt = new Date();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        collegeId: user.collegeId,
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" })
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "An internal server error occurred during login" });
  }
});

// @route   GET /api/auth/setup-verify
// @desc    Verify setup token and email
router.get("/setup-verify", async (req, res) => {
  try {
    const { email, token } = req.query;
    if (!email || !token) {
      return res.status(400).json({ error: "Email and token are required." });
    }
    const user = await User.findOne({ email, setupToken: token });
    if (!user) {
      return res.status(404).json({ error: "Invalid setup link or expired token." });
    }
    res.json({ name: user.name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Server error during token verification." });
  }
});

// @route   POST /api/auth/setup-complete
// @desc    Complete account setup by setting password
router.post("/setup-complete", async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: "Email, token, and password are required." });
    }

    const user = await User.findOne({ email, setupToken: token });
    if (!user) {
      return res.status(404).json({ error: "Invalid or expired setup token." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.isSetup = true;
    user.setupToken = undefined; // clear token
    
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      collegeId: user.collegeId,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" })
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to complete account setup." });
  }
});

// @route   GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

// @route   GET /api/auth/college
// @desc    Get user's college details
router.get("/college", protect, async (req, res) => {
  try {
    if (!req.user.collegeId) return res.status(400).json({ error: "No college associated" });
    const college = await College.findById(req.user.collegeId);
    if (!college) return res.status(404).json({ error: "College not found" });
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
