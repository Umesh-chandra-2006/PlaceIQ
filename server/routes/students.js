const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const fs = require("fs");
const latex = require("node-latex");
const PDFDocument = require("pdfkit");
const { Readable } = require("stream");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const { enforceOnboarding } = require("../middleware/onboarded");

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

    const { department, section, rollNumber, cgpa, tenthPercent, twelfthPercent, activeBacklogs, skills, phone } = req.body;
    
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

    if (phone) user.phone = phone;

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

    // Only initialize AI quota on first onboarding, not on subsequent resume re-uploads
    if (!user.isOnboarded) {
      user.aiReviewsUsed = 0;
      user.aiReviewResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
    user.isOnboarded = true;

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
      cgpaScale: college.cgpaScale,
      aiReviewQuota: college.aiReviewQuota || 3
    });
  } catch (error) {
    res.status(500).json({ error: "Server error fetching college config" });
  }
});

// PUT /api/students/profile
router.put("/profile", protect, enforceOnboarding, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can update their profile here." });
    }

    const { name, department, section, rollNumber, cgpa, tenthPercent, twelfthPercent, activeBacklogs, skills, phone } = req.body;

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

    if (phone !== undefined) user.phone = phone;

    await user.save();
    
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json(userObj);
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ error: "Failed to update profile: " + error.message });
  }
});

// Helpers for LaTeX resume generation and compilation
function getDefaultTemplate(user) {
  const name = user.name || "Student Name";
  const email = user.email || "student@college.edu";
  const phone = user.phone || "+91 9876543210";
  const dept = user.department || user.branch || "Computer Science";
  const cgpa = user.cgpa ? user.cgpa.toString() : "8.5";
  const tenth = user.tenthPercent ? user.tenthPercent.toString() : "90";
  const twelfth = user.twelfthPercent ? user.twelfthPercent.toString() : "88";
  const skillsList = user.skills && user.skills.length > 0 ? user.skills.join(", ") : "React, Node.js, Express, MongoDB, Python, Git";

  return `\\documentclass[10pt,letterpaper]{article}
\\usepackage[letterpaper,margin=0.75in]{geometry}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{10pt}{5pt}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
    {\\LARGE \\textbf{${name}}} \\\\
    Email: ${email} \\ | \\ Phone: ${phone} \\\\
    Department: ${dept} \\ | \\ CGPA: ${cgpa}
\\end{center}

\\section{Education}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{College Education} \\\\
    Bachelor of Technology in ${dept} \\hfill CGPA: ${cgpa} \\\\
    \\item \\textbf{High School (12th Grade)} \\hfill Percentage: ${twelfth}\\%
    \\item \\textbf{Secondary School (10th Grade)} \\hfill Percentage: ${tenth}\\%
\\end{itemize}

\\section{Skills}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Technical Skills:} ${skillsList}
\\end{itemize}

\\section{Projects}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Project 1: Online Placement Portal (PlaceIQ)} \\hfill \\textit{Jan 2026 -- Present}
    \\begin{itemize}
        \\item Built a fully functional multi-tenant college placement portal using Node.js, Express, React, and MongoDB.
        \\item Integrated AI-powered resume parsing and ATS scoring using meta-llama on OpenRouter.
    \\end{itemize}
    \\item \\textbf{Project 2: Job Scraper Microservice} \\hfill \\textit{Feb 2026}
    \\begin{itemize}
        \\item Created a FastAPI web scraping microservice with Python Playwright to pull dynamic postings.
    \\end{itemize}
\\end{itemize}

\\section{Experience}
\\begin{itemize}[leftmargin=*]
    \\item \\textbf{Software Engineer Intern} | PlaceIQ Corp \\hfill \\textit{May 2025 -- July 2025}
    \\begin{itemize}
        \\item Optimized database queries and indexes, decreasing search latency by 40\\%.
        \\item Created responsive superadmin dashboards and student onboarding guides.
    \\end{itemize}
\\end{itemize}

\\end{document}`;
}

function extractTextFromLatex(latexSource) {
  return latexSource
    .split("\n")
    .filter(line => !line.trim().startsWith("%"))
    .map(line => {
      return line
        .replace(/\\textbf\{([^}]+)\}/g, "$1")
        .replace(/\\textit\{([^}]+)\}/g, "$1")
        .replace(/\\LARGE|\\Large|\\large|\\normalsize|\\small|\\tiny/g, "")
        .replace(/\\hfill/g, "   ")
        .replace(/\\\\/g, "")
        .replace(/\\%/g, "%")
        .replace(/\\&/g, "&")
        .replace(/\\_/g, "_")
        .replace(/\\item/g, " •")
        .replace(/\\begin\{[^}]+\}/g, "")
        .replace(/\\end\{[^}]+\}/g, "")
        .replace(/\\documentclass[^}]+}/g, "")
        .replace(/\\usepackage[^}]+}/g, "")
        .replace(/\\titleformat[^}]+}/g, "")
        .replace(/\\titlespacing[^}]+}/g, "")
        .replace(/\\pagestyle[^}]+}/g, "")
        .replace(/\\/g, "")
        .replace(/[{}]/g, "")
        .trim();
    })
    .filter(line => line.length > 0)
    .join("\n");
}

function compileFallbackPdf(latexSource, studentName) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", err => reject(err));
      
      doc.fontSize(22).fillColor("#18181b").text(studentName || "Resume Preview", { align: "center" });
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor("#71717a").text("Simulated LaTeX Compilation Preview", { align: "center" });
      doc.fontSize(8).fillColor("#ef4444").text("(LaTeX compiler was not found on the host machine. Showing simulated render.)", { align: "center" });
      doc.moveDown(1.5);
      
      doc.fontSize(12).fillColor("#18181b").text("LaTeX Document Text Content:", { underline: true });
      doc.moveDown(0.5);
      
      const cleanText = extractTextFromLatex(latexSource);
      doc.font("Helvetica").fontSize(10).fillColor("#27272a");
      cleanText.split("\n").forEach(line => {
        if (doc.y > 720) {
          doc.addPage();
        }
        if (line.startsWith("•")) {
          doc.text(line, { indent: 15 });
        } else {
          doc.text(line);
        }
        doc.moveDown(0.15);
      });
      
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function compileLatex(latexSource, studentName) {
  return new Promise((resolve, reject) => {
    const input = Readable.from([latexSource]);
    const pdfStream = latex(input);
    const chunks = [];
    
    pdfStream.on("data", (chunk) => chunks.push(chunk));
    pdfStream.on("end", () => resolve({ buffer: Buffer.concat(chunks), fallback: false }));
    
    pdfStream.on("error", async (err) => {
      console.warn("LaTeX compilation failed, falling back to PDFKit:", err.message);
      try {
        const fallbackBuffer = await compileFallbackPdf(latexSource, studentName);
        resolve({ buffer: fallbackBuffer, fallback: true });
      } catch (fallbackErr) {
        reject(fallbackErr);
      }
    });
  });
}

// GET /api/students/resume/source
router.get("/resume/source", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can fetch resume source." });
    }

    let source = user.latexResumeSource;
    if (!source) {
      source = getDefaultTemplate(user);
    }

    res.json({ latexSource: source });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resume source: " + error.message });
  }
});

// POST /api/students/resume/compile
router.post("/resume/compile", protect, async (req, res) => {
  try {
    const { latexSource } = req.body;
    if (!latexSource) return res.status(400).json({ error: "No LaTeX source provided." });

    const student = await User.findById(req.user.id);
    const { buffer, fallback } = await compileLatex(latexSource, student?.name);

    if (fallback) {
      res.setHeader("x-latex-fallback", "true");
    }
    res.setHeader("Content-Type", "application/pdf");
    res.send(buffer);
  } catch (error) {
    console.error("Compile endpoint error:", error);
    res.status(500).json({ error: "Failed to compile LaTeX: " + error.message });
  }
});

// POST /api/students/resume/save
router.post("/resume/save", protect, async (req, res) => {
  try {
    const { latexSource } = req.body;
    if (!latexSource) return res.status(400).json({ error: "No LaTeX source provided." });

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can save resume source." });
    }

    const { buffer, fallback } = await compileLatex(latexSource, user.name);

    // Save PDF using existing storage service uploadFile
    const fileUrl = await uploadFile(buffer, "resume.pdf", "resume", user._id);
    
    // Parse the PDF text for ATS review matching
    let resumeText = "";
    try {
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text || "";
    } catch (parseErr) {
      console.warn("pdfParse failed on resume compile, extracting text from LaTeX code:", parseErr.message);
      resumeText = extractTextFromLatex(latexSource);
    }
    user.resumeText = resumeText;
    
    user.latexResumeSource = latexSource;
    user.resumeUrl = fileUrl;
    user.resumeUpdatedAt = Date.now();
    await user.save();

    res.json({
      message: "Resume compiled and saved successfully.",
      resumeUrl: fileUrl,
      fallback
    });
  } catch (error) {
    console.error("Save resume endpoint error:", error);
    res.status(500).json({ error: "Failed to save resume: " + error.message });
  }
});

function convertResumeDataToText(data) {
  if (!data) return "";
  const parts = [];
  if (data.personal) {
    parts.push(data.personal.name || "");
    parts.push(data.personal.email || "");
    parts.push(data.personal.phone || "");
    parts.push(data.personal.location || "");
  }
  if (Array.isArray(data.education)) {
    data.education.forEach(e => {
      parts.push(e.institution || "");
      parts.push(e.degree || "");
      parts.push(e.field || "");
      parts.push(e.cgpa || "");
    });
  }
  if (Array.isArray(data.experience)) {
    data.experience.forEach(exp => {
      parts.push(exp.company || "");
      parts.push(exp.role || "");
      if (Array.isArray(exp.bullets)) {
        parts.push(...exp.bullets);
      }
    });
  }
  if (Array.isArray(data.projects)) {
    data.projects.forEach(p => {
      parts.push(p.name || "");
      parts.push(p.technologies || "");
      if (Array.isArray(p.bullets)) {
        parts.push(...p.bullets);
      }
    });
  }
  if (data.skills) {
    parts.push(data.skills.languages || "");
    parts.push(data.skills.frameworks || "");
    parts.push(data.skills.tools || "");
  }
  return parts.filter(Boolean).join("\n");
}

function getDefaultResumeData(user) {
  const name = user.name || "Student Name";
  const email = user.email || "student@college.edu";
  const phone = user.phone || "+91 9876543210";
  const dept = user.department || user.branch || "Computer Science & Engineering";
  const cgpa = user.cgpa ? user.cgpa.toString() : "8.5";
  const tenth = user.tenthPercent ? user.tenthPercent.toString() : "90";
  const twelfth = user.twelfthPercent ? user.twelfthPercent.toString() : "88";
  const skillsList = user.skills && user.skills.length > 0 ? user.skills.join(", ") : "React, Node.js, Express, MongoDB, Python, Git";

  return {
    personal: {
      name,
      email,
      phone,
      github: "https://github.com/",
      linkedin: "https://linkedin.com/in/",
      location: "India"
    },
    education: [
      {
        institution: "College Education",
        degree: "Bachelor of Technology",
        field: dept,
        cgpa,
        startDate: "Aug 2022",
        endDate: "May 2026"
      },
      {
        institution: "High School",
        degree: "Class 12th Board",
        field: "Science",
        cgpa: twelfth + "%",
        startDate: "Apr 2020",
        endDate: "Mar 2022"
      },
      {
        institution: "Secondary School",
        degree: "Class 10th Board",
        field: "General Education",
        cgpa: tenth + "%",
        startDate: "Apr 2018",
        endDate: "Mar 2020"
      }
    ],
    experience: [
      {
        company: "PlaceIQ Corp",
        role: "Software Developer Intern",
        startDate: "May 2025",
        endDate: "July 2025",
        bullets: [
          "Optimized backend queries and database schemas for faster lookup response times.",
          "Designed multi-tenant authentication and user onboarding layout dashboards."
        ]
      }
    ],
    projects: [
      {
        name: "PlaceIQ Placement Portal",
        technologies: "React, Node.js, Express, MongoDB, TailwindCSS",
        startDate: "Jan 2026",
        endDate: "Present",
        bullets: [
          "Built a high-fidelity client-side CV builder using React-PDF with real-time preview layouts.",
          "Designed dynamic ATS keyword matching and review scoring widgets."
        ]
      }
    ],
    skills: {
      languages: "JavaScript, Python, C++, SQL",
      frameworks: "React, Express, Node.js, TailwindCSS",
      tools: "Git, Docker, Postman, MongoDB"
    }
  };
}

// GET /api/students/resume/data
router.get("/resume/data", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can fetch resume data." });
    }

    let data = user.resumeData;
    if (!data) {
      data = getDefaultResumeData(user);
    }

    res.json({ resumeData: data });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch resume data: " + error.message });
  }
});

// POST /api/students/resume/data
router.post("/resume/data", protect, async (req, res) => {
  try {
    const { resumeData, pdfBase64 } = req.body;
    if (!resumeData) return res.status(400).json({ error: "No resume data provided." });

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "student") {
      return res.status(403).json({ error: "Only students can save resume data." });
    }

    user.resumeData = resumeData;
    user.resumeText = convertResumeDataToText(resumeData);
    user.resumeUpdatedAt = Date.now();

    // If PDF base64 is provided, decode and save to file storage
    if (pdfBase64) {
      const buffer = Buffer.from(pdfBase64, "base64");
      const fileUrl = await uploadFile(buffer, "resume.pdf", "resume", user._id);
      user.resumeUrl = fileUrl;
    }

    await user.save();

    res.json({
      message: "Resume data saved and synced successfully.",
      resumeUrl: user.resumeUrl
    });
  } catch (error) {
    console.error("Save resume data error:", error);
    res.status(500).json({ error: "Failed to save resume data: " + error.message });
  }
});

// POST /api/students/resume/ats-score
router.post("/resume/ats-score", protect, async (req, res) => {
  try {
    const { resumeText, jobId } = req.body;
    if (!resumeText) return res.status(400).json({ error: "No resume text provided." });

    let jobDescription = "";
    if (jobId) {
      const Job = require("../models/Job");
      const job = await Job.findOne({ _id: jobId, collegeId: req.user.collegeId });
      if (job) jobDescription = job.description;
    }

    const { calculateAtsDashboard } = require("../services/ats");
    const result = calculateAtsDashboard(resumeText, jobDescription);

    res.json(result);
  } catch (error) {
    console.error("ATS score calc error:", error);
    res.status(500).json({ error: "Failed to calculate ATS score: " + error.message });
  }
});

module.exports = router;
