/**
 * Auth routes for registration, login, and user profile.
 */
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const College = require("../models/College");
const { protect } = require("../middleware/auth");
const { sendEmail } = require("../services/notify");
const cacheMiddleware = require("../middleware/cache");



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
        hasCompletedTour: user.hasCompletedTour || false,
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
    const user = await User.findOne({ 
      email, 
      setupToken: token,
      $or: [
        { setupTokenExpiresAt: { $exists: false } },
        { setupTokenExpiresAt: null },
        { setupTokenExpiresAt: { $gt: new Date() } }
      ]
    });
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

    const user = await User.findOne({ 
      email, 
      setupToken: token,
      $or: [
        { setupTokenExpiresAt: { $exists: false } },
        { setupTokenExpiresAt: null },
        { setupTokenExpiresAt: { $gt: new Date() } }
      ]
    });
    if (!user) {
      return res.status(404).json({ error: "Invalid or expired setup token." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.isSetup = true;
    user.setupToken = undefined; // clear token
    user.setupTokenExpiresAt = undefined; // clear expiry
    
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      collegeId: user.collegeId,
      hasCompletedTour: user.hasCompletedTour || false,
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
router.get("/college", protect, cacheMiddleware(300), async (req, res) => {
  try {
    if (!req.user.collegeId) return res.status(400).json({ error: "No college associated" });
    const college = await College.findById(req.user.collegeId);
    if (!college) return res.status(404).json({ error: "College not found" });
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required." });
    }
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid current password." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    
    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ error: "Server error during password change." });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token and send email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }

    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiration
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;

    const emailSubject = "PlaceIQ: Reset Your Password";
    const emailText = "You are receiving this email because you (or someone else) requested a password reset for your PlaceIQ account.\n\n" +
      "Please click on the following link, or paste it into your browser to complete the process:\n\n" +
      `${resetUrl}\n\n` +
      "If you did not request this, please ignore this email and your password will remain unchanged.\n";
    
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #18181b;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>You requested a password reset for your PlaceIQ account.</p>
        <p>Please click the button below to set a new password. This link is valid for 1 hour.</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #71717a; font-size: 12px; margin-top: 24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    await sendEmail(user.email, emailSubject, emailText, emailHtml);
    res.json({ message: "If an account exists with that email, a reset link has been sent." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error during forgot password flow." });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, password } = req.body;
    if (!email || !token || !password) {
      return res.status(400).json({ error: "Email, token, and new password are required." });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid reset token or token has expired." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    if (!user.isSetup) user.isSetup = true;

    await user.save();
    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Server error during password reset." });
  }
});

// @route   PUT /api/auth/complete-tour
// @desc    Mark onboarding tour as completed
router.put("/complete-tour", protect, async (req, res) => {
  try {
    req.user.hasCompletedTour = true;
    await req.user.save();
    res.json({ message: "Tour completion saved", hasCompletedTour: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/auth/reset-tour
// @desc    Reset onboarding tour completion status
router.put("/reset-tour", protect, async (req, res) => {
  try {
    req.user.hasCompletedTour = false;
    await req.user.save();
    res.json({ message: "Tour completion reset", hasCompletedTour: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
