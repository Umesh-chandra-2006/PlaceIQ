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

    // Retrieve user and check update
    const updatedUser = await User.findById(mockUser._id);
    expect(updatedUser.latexResumeSource).toBe("LaTeX Document Text Content\n% saved LaTeX source code");
    expect(updatedUser.resumeUrl).toBe("http://mockurl.com/resume.pdf");
    expect(updatedUser.resumeText).toContain("LaTeX Document Text Content");
  });
});
