const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const collegeId = new mongoose.Types.ObjectId();

let mockUser = {
  _id: new mongoose.Types.ObjectId(),
  id: new mongoose.Types.ObjectId(),
  role: "coordinator",
  collegeId
};

// Mock the protect middleware
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

const batchesRouter = require("../../routes/batches");
const dbHelper = require("../../test-helpers/dbHelper");
const Batch = require("../../models/Batch");
const User = require("../../models/User");
const Job = require("../../models/Job");
const Application = require("../../models/Application");

const app = express();
app.use(express.json());
app.use("/api/batches", batchesRouter);

describe("Batches Routes Test", () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
    // Reset mockUser
    mockUser._id = new mongoose.Types.ObjectId();
    mockUser.id = mockUser._id;
    mockUser.role = "coordinator";
    mockUser.collegeId = collegeId;
  });

  // ──────────────────────────────────────────────
  // GET /api/batches - List batches
  // ──────────────────────────────────────────────
  describe("GET /", () => {
    it("should return paginated batches", async () => {
      await Batch.create({
        name: "Batch A",
        collegeId: mockUser.collegeId,
        year: 2024
      });
      await Batch.create({
        name: "Batch B",
        collegeId: mockUser.collegeId,
        year: 2025
      });

      const res = await request(app).get("/api/batches");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should return empty data when no batches exist", async () => {
      const res = await request(app).get("/api/batches");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it("should only return batches for the user's college", async () => {
      await Batch.create({
        name: "My Batch",
        collegeId: mockUser.collegeId
      });
      await Batch.create({
        name: "Other Batch",
        collegeId: new mongoose.Types.ObjectId()
      });

      const res = await request(app).get("/api/batches");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].name).toBe("My Batch");
    });

    it("should support pagination params", async () => {
      for (let i = 0; i < 5; i++) {
        await Batch.create({
          name: `Batch ${i}`,
          collegeId: mockUser.collegeId
        });
      }

      const res = await request(app).get("/api/batches?page=2&limit=2");

      expect(res.statusCode).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(2);
      expect(res.body.total).toBe(5);
      expect(res.body.pages).toBe(3);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/batches - Create batch
  // ──────────────────────────────────────────────
  describe("POST /", () => {
    it("should create a batch successfully", async () => {
      const res = await request(app)
        .post("/api/batches")
        .send({
          name: "CSE 2025",
          branch: "CSE",
          year: 2025,
          section: "A"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe("CSE 2025");
      expect(res.body.branch).toBe("CSE");
      expect(res.body.year).toBe(2025);
      expect(res.body.collegeId.toString()).toBe(mockUser.collegeId.toString());
    });

    it("should return 500 when batch name is missing (required field)", async () => {
      const res = await request(app)
        .post("/api/batches")
        .send({ year: 2025 });

      expect(res.statusCode).toBe(500);
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/batches/:id/students - List students
  // ──────────────────────────────────────────────
  describe("GET /:id/students", () => {
    it("should return paginated students in a batch", async () => {
      const student1 = await User.create({
        name: "Student 1",
        email: "s1@test.edu",
        passwordHash: "hash",
        role: "student",
        collegeId: mockUser.collegeId
      });
      const student2 = await User.create({
        name: "Student 2",
        email: "s2@test.edu",
        passwordHash: "hash",
        role: "student",
        collegeId: mockUser.collegeId
      });

      const batch = await Batch.create({
        name: "Students Batch",
        collegeId: mockUser.collegeId,
        studentIds: [student1._id, student2._id]
      });

      const res = await request(app).get(`/api/batches/${batch._id}/students`);

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it("should return 404 for non-existent batch", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/batches/${fakeId}/students`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Batch not found");
    });

    it("should not return batch from another college", async () => {
      const batch = await Batch.create({
        name: "Other College Batch",
        collegeId: new mongoose.Types.ObjectId()
      });

      const res = await request(app).get(`/api/batches/${batch._id}/students`);

      expect(res.statusCode).toBe(404);
    });

    it("should return empty when batch has no students", async () => {
      const batch = await Batch.create({
        name: "Empty Batch",
        collegeId: mockUser.collegeId,
        studentIds: []
      });

      const res = await request(app).get(`/api/batches/${batch._id}/students`);

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/batches/:id/students/single
  // ──────────────────────────────────────────────
  describe("POST /:id/students/single", () => {
    let batch;

    beforeEach(async () => {
      batch = await Batch.create({
        name: "Single Add Batch",
        collegeId: mockUser.collegeId,
        year: 2025,
        branch: "ECE",
        section: "B"
      });
    });

    it("should add a single student to the batch", async () => {
      const res = await request(app)
        .post(`/api/batches/${batch._id}/students/single`)
        .send({
          name: "New Student",
          email: "new@test.edu",
          rollNumber: "21001",
          branch: "CSE",
          cgpa: 8.5
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe("New Student");
      expect(res.body.email).toBe("new@test.edu");
      expect(res.body.role).toBe("student");
      expect(res.body.collegeId.toString()).toBe(mockUser.collegeId.toString());

      // Verify student was added to batch
      const updatedBatch = await Batch.findById(batch._id);
      expect(updatedBatch.studentIds.length).toBe(1);
      expect(updatedBatch.studentIds[0].toString()).toBe(res.body._id);
    });

    it("should return 400 when name is missing", async () => {
      const res = await request(app)
        .post(`/api/batches/${batch._id}/students/single`)
        .send({ email: "noname@test.edu" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Name and email are required");
    });

    it("should return 400 when email is missing", async () => {
      const res = await request(app)
        .post(`/api/batches/${batch._id}/students/single`)
        .send({ name: "No Email" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Name and email are required");
    });

    it("should return 404 for non-existent batch", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/batches/${fakeId}/students/single`)
        .send({ name: "Test", email: "test@test.edu" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Batch not found");
    });

    it("should return 400 for duplicate email", async () => {
      await User.create({
        name: "Existing Student",
        email: "existing@test.edu",
        passwordHash: "hash",
        role: "student",
        collegeId: mockUser.collegeId
      });

      const res = await request(app)
        .post(`/api/batches/${batch._id}/students/single`)
        .send({
          name: "Duplicate",
          email: "existing@test.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should inherit batch year/branch when student values not provided", async () => {
      const res = await request(app)
        .post(`/api/batches/${batch._id}/students/single`)
        .send({
          name: "Inherit Student",
          email: "inherit@test.edu"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.year).toBe(2025); // from batch
      expect(res.body.branch).toBe("ECE"); // from batch
      expect(res.body.section).toBe("B"); // from batch
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/batches/:id/students/:studentId
  // ──────────────────────────────────────────────
  describe("DELETE /:id/students/:studentId", () => {
    it("should remove a student from the batch", async () => {
      const student = await User.create({
        name: "Remove Me",
        email: "removeme@test.edu",
        passwordHash: "hash",
        role: "student",
        collegeId: mockUser.collegeId
      });

      const batch = await Batch.create({
        name: "Remove Batch",
        collegeId: mockUser.collegeId,
        studentIds: [student._id]
      });

      const res = await request(app)
        .delete(`/api/batches/${batch._id}/students/${student._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("Student removed");
      expect(res.body.studentIds).not.toContain(student._id.toString());
    });

    it("should cleanup pending applications when student is removed", async () => {
      const student = await User.create({
        name: "Cleanup Student",
        email: "cleanup@test.edu",
        passwordHash: "hash",
        role: "student",
        collegeId: mockUser.collegeId
      });

      const batch = await Batch.create({
        name: "Cleanup Batch",
        collegeId: mockUser.collegeId,
        studentIds: [student._id]
      });

      // Create a job that targets this batch
      const job = await Job.create({
        title: "Batch Job",
        company: "Batch Co",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id,
        eligibility: { batchIds: [batch._id] }
      });

      // Create an application in "applied" stage
      const application = await Application.create({
        studentId: student._id,
        jobId: job._id,
        collegeId: mockUser.collegeId,
        stage: "applied"
      });

      const res = await request(app)
        .delete(`/api/batches/${batch._id}/students/${student._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.modifiedApplicationsCount).toBe(1);

      // Verify application was updated
      const updatedApp = await Application.findById(application._id);
      expect(updatedApp.stage).toBe("rejected");
      expect(updatedApp.notes).toContain("Auto-cancelled");
    });

    it("should not cleanup applications in non-applied stages", async () => {
      const student = await User.create({
        name: "Interview Student",
        email: "interview@test.edu",
        passwordHash: "hash",
        role: "student",
        collegeId: mockUser.collegeId
      });

      const batch = await Batch.create({
        name: "Interview Batch",
        collegeId: mockUser.collegeId,
        studentIds: [student._id]
      });

      const job = await Job.create({
        title: "Interview Job",
        company: "Int Co",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id,
        eligibility: { batchIds: [batch._id] }
      });

      // Application in "interview" stage should NOT be touched
      await Application.create({
        studentId: student._id,
        jobId: job._id,
        collegeId: mockUser.collegeId,
        stage: "interview"
      });

      const res = await request(app)
        .delete(`/api/batches/${batch._id}/students/${student._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.modifiedApplicationsCount).toBe(0);
    });

    it("should return 404 for non-existent batch", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const studentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/batches/${fakeId}/students/${studentId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Batch not found");
    });
  });

  // ──────────────────────────────────────────────
  // Role enforcement
  // ──────────────────────────────────────────────
  describe("Role enforcement", () => {
    it("should reject student from listing batches", async () => {
      mockUser.role = "student";

      const res = await request(app).get("/api/batches");

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject student from creating a batch", async () => {
      mockUser.role = "student";

      const res = await request(app)
        .post("/api/batches")
        .send({ name: "Student Batch" });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject admin from creating a batch", async () => {
      mockUser.role = "admin";

      const res = await request(app)
        .post("/api/batches")
        .send({ name: "Admin Batch" });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });
  });
});
