const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

let mockUser = {
  _id: new mongoose.Types.ObjectId(),
  role: "coordinator",
  collegeId: new mongoose.Types.ObjectId()
};

// Mock auth middleware
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

const analyticsRouter = require("../../routes/analytics");
const dbHelper = require("../../test-helpers/dbHelper");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Application = require("../../models/Application");
const cacheMiddleware = require("../../middleware/cache");

const app = express();
app.use(express.json());
app.use("/api/analytics", analyticsRouter);

describe("Analytics Routes Integration Tests", () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
    cacheMiddleware.clearCache(); // clear memory cache entirely
    mockUser.role = "coordinator"; // Reset role
  });

  it("should forbid student access to summary endpoint", async () => {
    mockUser.role = "student";
    const res = await request(app).get("/api/analytics/summary");
    expect(res.statusCode).toBe(403);
  });

  it("should return clean empty statistics for empty database", async () => {
    const res = await request(app).get("/api/analytics/summary");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      totalStudents: 0,
      placedStudents: 0,
      placementRate: 0,
      avgCTC: 0,
      highestCTC: 0,
      activeCompanies: 0,
      totalOffers: 0,
      hasOfferData: false
    });
  });

  it("should calculate correct summary and funnel aggregation metrics", async () => {
    const collegeId = mockUser.collegeId;

    // Create 4 students: 2 placed, 2 unplaced
    const student1 = await User.create({
      name: "S1",
      email: "s1@clg.com",
      passwordHash: "x",
      role: "student",
      collegeId,
      branch: "CSE",
      cgpa: 9.5,
      isPlaced: true,
      applicationCount: 3
    });

    const student2 = await User.create({
      name: "S2",
      email: "s2@clg.com",
      passwordHash: "x",
      role: "student",
      collegeId,
      branch: "CSE",
      cgpa: 8.2,
      isPlaced: true,
      applicationCount: 2
    });

    const student3 = await User.create({
      name: "S3",
      email: "s3@clg.com",
      passwordHash: "x",
      role: "student",
      collegeId,
      branch: "ECE",
      cgpa: 7.4,
      isPlaced: false,
      applicationCount: 1
    });

    const student4 = await User.create({
      name: "S4",
      email: "s4@clg.com",
      passwordHash: "x",
      role: "student",
      collegeId,
      branch: "ECE",
      cgpa: 5.8,
      isPlaced: false,
      applicationCount: 0
    });

    // Create Jobs for applications
    const job1 = await Job.create({
      collegeId,
      postedBy: mockUser._id,
      title: "Software Engineer",
      company: "Google",
      stipend: "10 LPA"
    });

    const job2 = await Job.create({
      collegeId,
      postedBy: mockUser._id,
      title: "UI Engineer",
      company: "Amazon",
      stipend: "12 LPA"
    });

    // Create Applications representing stages
    // Student 1: Offer stage (CTC: 12 Lakhs)
    await Application.create({
      jobId: job1._id,
      studentId: student1._id,
      collegeId,
      stage: "offer",
      stageHistory: [{ stage: "applied" }, { stage: "oa" }, { stage: "interview" }, { stage: "offer" }],
      offerDetails: { ctc: "12 Lakhs", status: "verified" }
    });

    // Student 2: Offer stage (CTC: 8.5 LPA)
    await Application.create({
      jobId: job2._id,
      studentId: student2._id,
      collegeId,
      stage: "offer",
      stageHistory: [{ stage: "applied" }, { stage: "oa" }, { stage: "offer" }],
      offerDetails: { ctc: "8.5 LPA", status: "verified" }
    });

    // Student 3: Interview stage
    await Application.create({
      jobId: job1._id,
      studentId: student3._id,
      collegeId,
      stage: "interview",
      stageHistory: [{ stage: "applied" }, { stage: "oa" }, { stage: "interview" }]
    });

    // Verify Summary Endpoint
    const summaryRes = await request(app).get("/api/analytics/summary");
    expect(summaryRes.statusCode).toBe(200);
    expect(summaryRes.body.totalStudents).toBe(4);
    expect(summaryRes.body.placedStudents).toBe(2);
    expect(summaryRes.body.placementRate).toBe(50);
    expect(summaryRes.body.totalOffers).toBe(2);
    expect(summaryRes.body.activeCompanies).toBe(2);
    expect(summaryRes.body.avgCTC).toBe(10.3); // (12 + 8.5) / 2 = 10.25 -> 10.3
    expect(summaryRes.body.highestCTC).toBe(12);

    // Verify Funnel Endpoint
    const funnelRes = await request(app).get("/api/analytics/funnel");
    expect(funnelRes.statusCode).toBe(200);
    const stages = funnelRes.body.stages;
    expect(stages.find(s => s.stage === "Applied").count).toBe(3);
    expect(stages.find(s => s.stage === "Assessment").count).toBe(3);
    expect(stages.find(s => s.stage === "Interview").count).toBe(3); // student1 + student2 + student3
    expect(stages.find(s => s.stage === "Offer").count).toBe(2); // student1 + student2
    expect(stages.find(s => s.stage === "Placed").count).toBe(2);
  });

  it("should preserve tenant boundary and ignore cross-college records", async () => {
    const collegeA = mockUser.collegeId;
    const collegeB = new mongoose.Types.ObjectId();

    // Student in college A
    await User.create({
      name: "CollA Student",
      email: "a@a.com",
      passwordHash: "x",
      role: "student",
      collegeId: collegeA,
      isPlaced: true
    });

    // Student in college B (should be ignored)
    await User.create({
      name: "CollB Student",
      email: "b@b.com",
      passwordHash: "x",
      role: "student",
      collegeId: collegeB,
      isPlaced: true
    });

    const res = await request(app).get("/api/analytics/summary");
    expect(res.statusCode).toBe(200);
    expect(res.body.totalStudents).toBe(1);
    expect(res.body.placedStudents).toBe(1);
  });
});
