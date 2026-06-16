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
    expect(res.body.resumeData.personal.name).toBe("John Student");
    expect(res.body.resumeData.education[0].institution).toBe("College Education");
  });

  it("should save structured JSON resumeData, extract text, and compile PDF", async () => {
    const mockResumeData = {
      personal: { name: "John Test", email: "john@test.com", phone: "12345", location: "Bangalore" },
      education: [{ institution: "IIT", degree: "B.Tech", field: "CSE", cgpa: "9.8" }],
      experience: [{ company: "Google", role: "SDE", bullets: ["Solved complex search scale problems"] }],
      projects: [{ name: "PlaceIQ", technologies: "React", bullets: ["Created live ATS review matching score widget"] }],
      skills: { languages: "JavaScript", frameworks: "Node.js", tools: "Git" }
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
    expect(user.resumeData.personal.name).toBe("John Test");
    expect(user.resumeUrl).toBe("http://mockurl.com/resume.pdf");
    expect(user.resumeText).toContain("John Test");
    expect(user.resumeText).toContain("IIT");
    expect(user.resumeText).toContain("Google");
    expect(user.resumeText).toContain("Solved complex search scale problems");
  });

  it("should calculate ATS score against a general profile check", async () => {
    const res = await request(app)
      .post("/api/students/resume/ats-score")
      .send({ resumeText: "education experience project skills student@college.edu" });

    expect(res.statusCode).toBe(200);
    expect(res.body.score).toBeGreaterThanOrEqual(90);
  });
});
