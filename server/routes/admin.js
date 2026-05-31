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

    // Check if college domain already exists
    const existingCollege = await College.findOne({ emailDomain });
    if (existingCollege) {
      if (existingCollege.isActive === false && !existingCollege.isDeleted) {
        return res.status(400).json({ error: "A deactivated college with this email domain already exists. Please reactivate it from the list." });
      }
      return res.status(400).json({ error: "A college with this email domain already exists." });
    }

    // Verify user doesn't already exist
    const User = require("../models/User");
    const userExists = await User.findOne({ email: adminEmail });
    if (userExists) {
      if (userExists.collegeId) {
        const col = await College.findById(userExists.collegeId);
        if (col && col.isActive === false && !col.isDeleted) {
          return res.status(400).json({ error: "A user with this admin email exists and belongs to a deactivated college. Please reactivate the college." });
        }
      }
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
    const colleges = await College.find({ isDeleted: { $ne: true } }).lean();
    const User = require("../models/User");
    for (let col of colleges) {
      const adminUser = await User.findOne({ collegeId: col._id, role: "admin" });
      if (adminUser) {
        col.adminEmail = adminUser.email;
        col.adminName = adminUser.name;
        col.isAdminSetup = adminUser.isSetup;
        col.adminSetupToken = adminUser.setupToken;
      }
    }
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
router.post("/upgrade-simulation", protect, requireRole("superadmin", "admin"), async (req, res) => {
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

    // Dynamically upgrade all coordinators of this college to paid subRole
    await User.updateMany(
      { collegeId: college._id, role: "coordinator" },
      { subRole: "coordinator_paid" }
    );

    // If the upgrading user is a coordinator, update their in-memory session too
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
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ error: "College not found" });

    college.isDeleted = true;
    college.emailDomain = `${college.emailDomain}.deleted-${Date.now()}`;
    await college.save();

    // Deactivate all users belonging to this college and suffix their emails to release the unique constraint
    const User = require("../models/User");
    const users = await User.find({ collegeId: req.params.id });
    for (const u of users) {
      u.email = `${u.email}.deleted-${Date.now()}`;
      u.isActive = false;
      await u.save();
    }

    res.json({ message: "College soft deleted successfully", college });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/admin/colleges/:id/regenerate-setup
// @desc    Regenerate the setup link for a pending college admin
router.post("/colleges/:id/regenerate-setup", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const User = require("../models/User");
    const adminUser = await User.findOne({ collegeId: req.params.id, role: "admin" });
    if (!adminUser) return res.status(404).json({ error: "Admin user not found for this college." });
    if (adminUser.isSetup) {
      return res.status(400).json({ error: "This college admin has already completed account setup." });
    }

    const crypto = require("crypto");
    adminUser.setupToken = crypto.randomBytes(20).toString("hex");
    await adminUser.save();

    const clientOrigin = req.headers.origin || req.headers.referer || "http://localhost:3000";
    const origin = clientOrigin.replace(/\/$/, "");
    const setupLink = `${origin}/setup-account?email=${encodeURIComponent(adminUser.email)}&token=${adminUser.setupToken}`;

    res.json({ setupLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/admin/colleges/:id/toggle-active
// @desc    Toggle the active/deactivated status of a college
router.put("/colleges/:id/toggle-active", protect, requireRole("superadmin"), async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) return res.status(404).json({ error: "College not found" });

    // Toggle isActive field (defaulting to true if not set)
    college.isActive = college.isActive === false ? true : false;
    await college.save();

    res.json({ 
      message: `College status updated to ${college.isActive ? "active" : "deactivated"}.`, 
      college 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
