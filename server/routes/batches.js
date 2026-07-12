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

const paginate = require("../middleware/paginate");
const { logAudit } = require("../middleware/auditLogger");

const upload = multer({ dest: "uploads/" });

// @route   GET /api/batches
// @desc    Get all batches for college
router.get("/", protect, requireRole("coordinator"), paginate(), async (req, res) => {
  try {
    const total = await Batch.countDocuments({ collegeId: req.user.collegeId });
    const batches = await Batch.find({ collegeId: req.user.collegeId })
      .sort({ createdAt: -1 })
      .skip(req.pagination.skip)
      .limit(req.pagination.limit);
      
    res.json({
      total,
      page: req.pagination.page,
      limit: req.pagination.limit,
      pages: Math.ceil(total / req.pagination.limit),
      data: batches
    });
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
    await logAudit(req, "CREATE_BATCH", "Batch", batch._id, { name: batch.name });
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/batches/:id/students
// @desc    Get students in a batch with pagination, search and filtering
router.get("/:id/students", protect, requireRole("coordinator"), paginate(), async (req, res) => {
  try {
    const batch = await Batch.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!batch) return res.status(404).json({ error: "Batch not found" });
    
    let studentQuery = { _id: { $in: batch.studentIds } };

    // Search by name, roll number, or email
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };
      studentQuery.$or = [
        { name: searchRegex },
        { rollNumber: searchRegex },
        { email: searchRegex }
      ];
    }

    // Filter by minimum CGPA
    if (req.query.minCgpa) {
      const cgpaVal = parseFloat(req.query.minCgpa);
      if (!isNaN(cgpaVal)) {
        studentQuery.cgpa = { $gte: cgpaVal };
      }
    }

    // Filter by department
    if (req.query.department) {
      studentQuery.department = req.query.department;
    }

    const total = await User.countDocuments(studentQuery);
    const students = await User.find(studentQuery)
      .select("-passwordHash -resumeText")
      .skip(req.pagination.skip)
      .limit(req.pagination.limit);

    res.json({
      total,
      page: req.pagination.page,
      limit: req.pagination.limit,
      pages: Math.ceil(total / req.pagination.limit),
      data: students
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/batches/:id/students
// @desc    Upload CSV to bulk import students
router.post("/:id/students", protect, requireRole("coordinator"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const batch = await Batch.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!batch) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Batch not found" });
    }

    const results = [];
    const stream = fs.createReadStream(req.file.path)
      .pipe(parse({ columns: true, skip_empty_lines: true }));

    stream.on("data", (data) => results.push(data));

    stream.on("error", (err) => {
      console.error("CSV Parse Error:", err);
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Failed to parse CSV file: " + err.message });
    });

    stream.on("end", async () => {
      try {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        const emails = results.map(row => (row.email || row.Email)).filter(Boolean);
        const emailsLower = emails.map(e => e.toLowerCase());
        const existingUsers = await User.find({ email: { $in: emailsLower } });
        const existingMap = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));

        const defaultHash = await bcrypt.hash("student123", 10);
        
        const studentsToCreate = [];
        const studentsToAddToBatch = [];

        // Track custom password hashes to execute them in parallel (if any)
        const passwordHashPromises = [];
        const rowIndexesWithCustomPassword = [];

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const email = row.email || row.Email;
          if (!email) continue;
          const emailLower = email.toLowerCase();

          const existingUser = existingMap.get(emailLower);
          if (existingUser) {
            if (existingUser.collegeId.toString() !== req.user.collegeId.toString()) {
              console.warn(`[HIJACK PREVENTED] Student ${email} belongs to college ${existingUser.collegeId}, but coordinator is from college ${req.user.collegeId}`);
              continue;
            }
            studentsToAddToBatch.push(existingUser);
          } else {
            const customPass = row.password || row.Password;
            if (customPass && customPass !== "student123") {
              passwordHashPromises.push(bcrypt.hash(customPass, 10));
              rowIndexesWithCustomPassword.push(studentsToCreate.length); // track index in studentsToCreate
            }
            
            studentsToCreate.push({
              name: row.name || row.Name,
              email: email,
              passwordHash: defaultHash, // default hash for now, updated later if custom
              role: "student",
              isSetup: true,
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
              backlogs: row.backlogs || row.Backlogs || 0,
              phone: row.phone || row.Phone || ""
            });
          }
        }

        // Resolve custom password hashes in parallel
        if (passwordHashPromises.length > 0) {
          const customHashes = await Promise.all(passwordHashPromises);
          for (let i = 0; i < customHashes.length; i++) {
            const createIndex = rowIndexesWithCustomPassword[i];
            studentsToCreate[createIndex].passwordHash = customHashes[i];
          }
        }

        // Bulk insert new students
        let createdUsers = [];
        if (studentsToCreate.length > 0) {
          createdUsers = await User.insertMany(studentsToCreate);
        }

        // Merge existing and created students
        const allStudents = [...studentsToAddToBatch, ...createdUsers];
        const newStudentsAdded = [];

        for (const student of allStudents) {
          if (!batch.studentIds.some(sid => sid.toString() === student._id.toString())) {
            batch.studentIds.push(student._id);
            newStudentsAdded.push(student);
          }
        }

        await batch.save();
        await logAudit(req, "IMPORT_STUDENTS", "Batch", batch._id, { count: newStudentsAdded.length });
        res.json({ message: `Imported ${newStudentsAdded.length} students`, students: newStudentsAdded });
      } catch (err) {
        console.error("Error processing CSV records:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to process imported student data" });
        }
      }
    });
  } catch (error) {
    console.error(error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/batches/:id/students/single
// @desc    Provision a single student under a batch (cohort)
router.post("/:id/students/single", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { name, email, rollNumber, branch, year, cgpa, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    const batch = await Batch.findOne({ _id: req.params.id, collegeId: req.user.collegeId });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    // Verify user doesn't already exist
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    // Default password student123
    const passwordHash = await bcrypt.hash("student123", 10);

    const student = await User.create({
      name,
      email,
      passwordHash,
      role: "student",
      isSetup: true,
      collegeId: req.user.collegeId,
      branch: branch || batch.branch,
      section: batch.section,
      rollNumber,
      year: year || batch.year,
      cgpa: cgpa || 0,
      phone: phone || ""
    });

    if (!batch.studentIds.includes(student._id)) {
      batch.studentIds.push(student._id);
      await batch.save();
    }

    res.status(201).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error provisioning student." });
  }
});

// @route   PUT /api/batches/students/:id/status
// @desc    Toggle active status of a student
router.put("/students/:id/status", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, collegeId: req.user.collegeId, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found" });

    student.isActive = !student.isActive;
    await student.save();
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/batches/students/:id/send-login
// @desc    Send login email to student
router.post("/students/:id/send-login", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, collegeId: req.user.collegeId, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found" });

    if (student.loginEmailSent) {
      return res.status(400).json({ error: "Login email already sent." });
    }

    // Mock sending email - logged to server console
    console.log("\n=================== DUMMY EMAIL DISPATCH ===================");
    console.log(`[EMAIL DISPATCH] To: ${student.email}`);
    console.log("Subject: Welcome to PlaceIQ - Portal Login Details");
    console.log("Body: Your student account has been created.");
    console.log("Access Credentials:");
    console.log("  - Login Link: http://localhost:3000/login");
    console.log(`  - Username: ${student.email}`);
    console.log("  - Password: student123");
    console.log("============================================================\n");

    student.loginEmailSent = true;
    await student.save();
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// @route   DELETE /api/batches/:id/students/:studentId
// @desc    Remove a student from a batch and clean up their pending applications for jobs in this batch
router.delete("/:id/students/:studentId", protect, requireRole("coordinator"), async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const batch = await Batch.findOne({ _id: id, collegeId: req.user.collegeId });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    // Remove student from batch
    batch.studentIds = batch.studentIds.filter(sid => sid.toString() !== studentId);
    await batch.save();

    // Find all jobs that target this batch
    const Job = require("../models/Job");
    const Application = require("../models/Application");
    
    const batchJobs = await Job.find({ "eligibility.batchIds": id });
    const batchJobIds = batchJobs.map(j => j._id);

    // Cancel their pending applications for these jobs
    const cleanupResult = await Application.updateMany(
      { studentId, stage: "applied", jobId: { $in: batchJobIds } },
      { $set: { stage: "rejected", notes: "Auto-cancelled: removed from cohort/batch" } }
    );

    res.json({ 
      message: "Student removed from batch and pending applications updated.", 
      modifiedApplicationsCount: cleanupResult.modifiedCount,
      studentIds: batch.studentIds 
    });
  } catch (error) {
    console.error("Error removing student from batch:", error);
    res.status(500).json({ error: "Server error removing student from batch." });
  }
});

module.exports = router;
