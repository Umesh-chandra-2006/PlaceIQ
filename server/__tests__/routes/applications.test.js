const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

let mockUser = {
  _id: new mongoose.Types.ObjectId(),
  role: "coordinator",
  collegeId: new mongoose.Types.ObjectId()
};

// Mock the protect middleware before requiring applicationsRouter
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

const applicationsRouter = require("../../routes/applications");
const dbHelper = require("../../test-helpers/dbHelper");
const Application = require("../../models/Application");

const app = express();
app.use(express.json());
app.use("/api/applications", applicationsRouter);

describe("Applications Routes Test", () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
  });

  it("should handle expectedStage optimistic concurrency check", async () => {
    const studentId = new mongoose.Types.ObjectId();
    const jobId = new mongoose.Types.ObjectId();

    const application = await Application.create({
      jobId,
      studentId,
      collegeId: mockUser.collegeId,
      stage: "applied",
      resumeUrl: "http://example.com/resume.pdf"
    });

    const res = await request(app)
      .put(`/api/applications/${application._id}`)
      .send({
        stage: "interview",
        expectedStage: "interview" // conflict since current stage is 'applied'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.error).toContain("Conflict: Application stage was changed by another user");
  });

  it("should update stage if expectedStage matches current stage", async () => {
    const studentId = new mongoose.Types.ObjectId();
    const jobId = new mongoose.Types.ObjectId();

    const application = await Application.create({
      jobId,
      studentId,
      collegeId: mockUser.collegeId,
      stage: "applied",
      resumeUrl: "http://example.com/resume.pdf"
    });

    const res = await request(app)
      .put(`/api/applications/${application._id}`)
      .send({
        stage: "interview",
        expectedStage: "applied"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.stage).toBe("interview");
  });
});
