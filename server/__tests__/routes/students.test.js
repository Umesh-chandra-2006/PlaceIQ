const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

let mockUser = {
  _id: new mongoose.Types.ObjectId(),
  role: "student",
  collegeId: new mongoose.Types.ObjectId(),
  name: "John Student"
};
mockUser.id = mockUser._id.toString();

// Mock protect middleware before requiring student routes
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

// Mock storageService to avoid actual Cloudinary calls
jest.mock("../../services/storageService", () => ({
  uploadFile: jest.fn().mockResolvedValue("http://mockurl.com/resume.pdf")
}));

const studentsRouter = require("../../routes/students");
const dbHelper = require("../../test-helpers/dbHelper");
const User = require("../../models/User");

const app = express();
app.use(express.json());
app.use("/api/students", studentsRouter);

describe("Student Resume Builder Routes", () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
    // Setup the mock student in the DB so that queries find it
    await User.create({
      _id: mockUser._id,
      name: mockUser.name,
      email: "student@college.edu",
      passwordHash: "passwordhash123",
      role: "student",
      collegeId: mockUser.collegeId,
      isOnboarded: true
    });
  });

  it("should return pre-filled default template if source is empty", async () => {
    const res = await request(app)
      .get("/api/students/resume/source");

    expect(res.statusCode).toBe(200);
    expect(res.body.latexSource).toContain("\\documentclass");
    expect(res.body.latexSource).toContain("John Student");
  });

  it("should compile LaTeX source code and return PDF buffer", async () => {
    const res = await request(app)
      .post("/api/students/resume/compile")
      .send({ latexSource: "% simple LaTeX comment source code" });

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    // Fallback mode header should be set since pdflatex is missing in testing environment
    expect(res.headers["x-latex-fallback"]).toBe("true");
  });

  it("should save LaTeX source and update user profile resume details", async () => {
    const res = await request(app)
      .post("/api/students/resume/save")
      .send({ latexSource: "LaTeX Document Text Content\n% saved LaTeX source code" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("successfully");
    expect(res.body.resumeUrl).toBe("http://mockurl.com/resume.pdf");

    const updatedUser = await User.findById(mockUser._id);
    expect(updatedUser.latexResumeSource).toBe("LaTeX Document Text Content\n% saved LaTeX source code");
    expect(updatedUser.resumeUrl).toBe("http://mockurl.com/resume.pdf");
    expect(updatedUser.resumeText).toContain("LaTeX Document Text Content");
  });

  it("should return default resume JSON data structure if empty", async () => {
    const res = await request(app)
      .get("/api/students/resume/data");

    expect(res.statusCode).toBe(200);
    expect(res.body.resumeData).toBeDefined();
    expect(res.body.resumeData.basics.name).toBe("John Student");
    expect(res.body.resumeData.education[0].institution).toBe("College Education");
  });

  it("should save structured JSON resumeData, extract text, and compile PDF", async () => {
    const mockResumeData = {
      basics: {
        name: "John Test",
        email: "john@test.com",
        phone: "12345",
        location: { city: "Bangalore" }
      },
      education: [{ institution: "IIT", studyType: "B.Tech", area: "CSE", score: "9.8" }],
      work: [{ name: "Google", position: "SDE", highlights: ["Solved complex search scale problems"] }],
      projects: [{ name: "PlaceIQ", keywords: ["React"], highlights: ["Created live ATS review matching score widget"] }],
      skills: [{ name: "Languages", keywords: ["JavaScript"] }]
    };

    const res = await request(app)
      .post("/api/students/resume/data")
      .send({
        resumeData: mockResumeData,
        pdfBase64: Buffer.from("mock-pdf-bytes").toString("base64")
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("successfully");
    expect(res.body.resumeUrl).toBe("http://mockurl.com/resume.pdf");

    const user = await User.findById(mockUser._id);
    expect(user.resumeData.basics.name).toBe("John Test");
    expect(user.resumeUrl).toBe("http://mockurl.com/resume.pdf");
    expect(user.resumeText).toContain("John Test");
    expect(user.resumeText).toContain("IIT");
    expect(user.resumeText).toContain("Google");
    expect(user.resumeText).toContain("Solved complex search scale problems");
  });

  it("should calculate ATS score against a general profile check", async () => {
    const richResumeText = `
      John Student
      Email: student@college.edu | Phone: +91 9999999999
      LinkedIn: linkedin.com/in/john | GitHub: github.com/john
      Location: Bangalore, India
      
      Education
      College of Engineering, B.Tech in Computer Science
      CGPA: 9.8 / 10
      
      Experience
      Software Engineer Intern
      - Built and developed high-performance web applications using React and Node.js.
      - Optimized database queries in MongoDB and led a team of three developers.
      - Implemented responsive UI designs and designed REST APIs.
      - Integrated external APIs and solved complex scaling issues.
      - Reduced load times by 40% and increased user engagement.
      - Managed project deployment pipelines.
      - Collaborated with product managers to define requirements.
      - Maintained high test coverage across all services.
      
      Projects
      PlaceIQ Platform
      - Created a robust live ATS review widget using JavaScript, HTML, and CSS.
      - Used Express and Git for collaborative development.
      - Deployed on AWS using Docker.
      
      Skills
      Languages: React, Node, Express, MongoDB, Python, JavaScript, HTML, CSS, Git, SQL, Java, C++, Docker, AWS, TypeScript, REST.
      
      Additional detailed descriptions to ensure the word count is well over 300 words. We want to demonstrate that the candidate has extensive experience and has worked on multiple projects. This includes writing detailed technical documentation, defining requirements, participating in sprint planning, conducting code reviews, writing unit tests, deploying to staging and production environments, and collaborating with cross-functional teams.
    `;

    const res = await request(app)
      .post("/api/students/resume/ats-score")
      .send({ resumeText: richResumeText });

    expect(res.statusCode).toBe(200);
    expect(res.body.score).toBeGreaterThanOrEqual(90);
    expect(res.body.grade).toBeDefined();
    expect(res.body.breakdown).toBeDefined();
    expect(res.body.breakdown.keywords).toBeGreaterThanOrEqual(80);
    expect(res.body.breakdown.formatting).toBeGreaterThanOrEqual(90);
    expect(res.body.breakdown.experience).toBeGreaterThanOrEqual(90);
    expect(res.body.breakdown.projects).toBeGreaterThanOrEqual(90);
    expect(res.body.breakdown.education).toBeGreaterThanOrEqual(90);
    expect(res.body.matchedKeywords).toBeDefined();
    expect(res.body.missingKeywords).toBeDefined();
    expect(res.body.healthInsights).toBeDefined();
  });
});
