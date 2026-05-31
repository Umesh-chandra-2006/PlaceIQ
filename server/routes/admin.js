/**
 * Admin routes for platform management.
 */
const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const College = require("../models/College");
const { protect } = require("../middleware/auth");
const { requireRole } = require("../middleware/requireRole");

// @route   POST /api/admin/colleges
router.post("/colleges", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const { name, licenceStatus, adminName, adminEmail } = req.body;
    // Sanitize: strip any accidental leading '@' the super-admin may have typed
    const emailDomain = (req.body.emailDomain || '').replace(/^@+/, '').trim().toLowerCase();

    if (!name || !emailDomain || !adminName || !adminEmail) {
      return res.status(400).json({ error: "Missing required fields (name, emailDomain, adminName, adminEmail)." });
    }

    // Reject if the domain still contains '@' (e.g. 'user@domain.com' was entered)
    if (emailDomain.includes('@')) {
      return res.status(400).json({ error: "Email Domain must be a plain domain, e.g. 'anu.edu.in' — do not include '@' or a full email address." });
    }

    if (!adminEmail.toLowerCase().endsWith(`@${emailDomain}`)) {
      return res.status(400).json({ error: `Admin email must end with @${emailDomain}` });
    }

    // Verify user doesn't already exist
    const User = require("../models/User");
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      return res.status(400).json({ error: "A user with this admin email already exists." });
    }

    const college = await College.create({
      name,
      emailDomain,
      licenceStatus: licenceStatus || "free"
    });

    const setupToken = crypto.randomBytes(20).toString("hex");
    const dummyHash = crypto.randomBytes(16).toString("hex");

    const adminUser = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash: dummyHash,
      role: "admin",
      collegeId: college._id,
      isSetup: false,
      setupToken
    });

    const clientOrigin = req.headers.origin || req.headers.referer || "http://localhost:3000";
    const origin = clientOrigin.replace(/\/$/, "");
    const setupLink = `${origin}/setup-account?email=${encodeURIComponent(adminEmail)}&token=${setupToken}`;

    res.status(201).json({
      college,
      admin: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email
      },
      setupLink
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/colleges/:id/upgrade
router.put("/colleges/:id/upgrade", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const { licenceStatus } = req.body;
    const status = licenceStatus || "paid";
    const college = await College.findByIdAndUpdate(
      req.params.id, 
      { licenceStatus: status }, 
      { new: true }
    );
    res.json(college);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/admin/colleges
router.get("/colleges", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const colleges = await College.find({ isDeleted: { $ne: true } });
    res.json(colleges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/college-settings
// @desc    Update college config (departments, cgpaScale) for the admin's own college
router.put("/college-settings", protect, requireRole("admin"), async (req, res) => {
  try {
    const { departments, cgpaScale } = req.body;
    const user = req.user; // populated by protect middleware
    
    // We assume the admin user belongs to a college
    const User = require("../models/User");
    const adminUser = await User.findById(user.id);
    
    if (!adminUser.collegeId) {
      return res.status(400).json({ error: "Admin does not belong to any college." });
    }

    const college = await College.findById(adminUser.collegeId);
    if (departments) college.departments = departments;
    if (cgpaScale) college.cgpaScale = cgpaScale;

    await college.save();
    res.json({ message: "College settings updated", college });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/admin/upgrade-simulation
// @desc    Simulate upgrading a college to the paid plan (developer testing)
router.post("/upgrade-simulation", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);
    if (!user.collegeId) {
      return res.status(400).json({ error: "User does not belong to any college." });
    }

    const college = await College.findById(user.collegeId);
    if (!college) return res.status(404).json({ error: "College not found." });

    college.licenceStatus = "paid";
    await college.save();

    // Dynamically upgrade the coordinator's subRole if applicable
    if (user.role === "coordinator") {
      user.subRole = "coordinator_paid";
      await user.save();
    }

    res.json({ message: "College successfully upgraded to paid tier.", college, userSubRole: user.subRole });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/admin/college-settings
router.get("/college-settings", protect, requireRole("admin"), async (req, res) => {
  try {
    const User = require("../models/User");
    const adminUser = await User.findById(req.user.id);
    if (!adminUser.collegeId) {
      return res.status(400).json({ error: "Admin does not belong to any college." });
    }
    const college = await College.findById(adminUser.collegeId);
    res.json({ departments: college.departments, cgpaScale: college.cgpaScale });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/admin/coordinators
// @desc    Provision a coordinator (whitelisted setup link)
router.post("/coordinators", protect, requireRole("admin"), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    // Load admin profile to get collegeId
    const User = require("../models/User");
    const adminUser = await User.findById(req.user.id);
    if (!adminUser.collegeId) {
      return res.status(400).json({ error: "Admin does not belong to any college." });
    }

    // Check college status to assign subRole and get emailDomain
    const college = await College.findById(adminUser.collegeId);
    if (!college) return res.status(404).json({ error: "College not found." });

    if (!email.endsWith(`@${college.emailDomain}`)) {
      return res.status(400).json({ error: `Coordinator email must end with @${college.emailDomain}` });
    }

    // Verify user doesn't already exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    const setupToken = crypto.randomBytes(20).toString("hex");
    const dummyHash = crypto.randomBytes(16).toString("hex");

    const coordinator = await User.create({
      name,
      email,
      passwordHash: dummyHash,
      role: "coordinator",
      subRole: college.licenceStatus === "paid" ? "coordinator_paid" : "coordinator_free",
      collegeId: adminUser.collegeId,
      isSetup: false,
      setupToken
    });

    const clientOrigin = req.headers.origin || req.headers.referer || "http://localhost:3000";
    const origin = clientOrigin.replace(/\/$/, "");
    const setupLink = `${origin}/setup-account?email=${encodeURIComponent(email)}&token=${setupToken}`;

    res.status(201).json({
      coordinator: {
        _id: coordinator._id,
        name: coordinator.name,
        email: coordinator.email,
        isSetup: coordinator.isSetup
      },
      setupLink
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/admin/coordinators
// @desc    Get all coordinators for the admin's college
router.get("/coordinators", protect, requireRole("admin"), async (req, res) => {
  try {
    const User = require("../models/User");
    const adminUser = await User.findById(req.user.id);
    if (!adminUser.collegeId) {
      return res.status(400).json({ error: "Admin does not belong to any college." });
    }

    const coordinators = await User.find({
      collegeId: adminUser.collegeId,
      role: "coordinator"
    }).select("name email isSetup setupToken");

    res.json(coordinators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/admin/colleges/:id
// @desc    Soft delete a college and deactivate its users
router.delete("/colleges/:id", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const college = await College.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!college) return res.status(404).json({ error: "College not found" });

    // Deactivate all users belonging to this college
    const User = require("../models/User");
    await User.updateMany({ collegeId: req.params.id }, { isActive: false });

    res.json({ message: "College soft deleted successfully", college });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
