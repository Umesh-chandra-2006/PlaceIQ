const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const collegeId = new mongoose.Types.ObjectId();

let mockUser = {
  _id: new mongoose.Types.ObjectId(),
  id: new mongoose.Types.ObjectId(),
  role: "coordinator",
  subRole: "coordinator_paid",
  collegeId
};

// Mock the protect middleware
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

// Mock external services that jobs.js imports (we don't want to call AI/scraper/broadcast)
jest.mock("../../services/summarise", () => ({
  summariseJD: jest.fn().mockResolvedValue(["Summary bullet 1"])
}));
jest.mock("../../services/scraper", () => ({
  scrapeUnstop: jest.fn().mockResolvedValue({})
}));
jest.mock("../../services/broadcast", () => ({
  broadcastJob: jest.fn().mockResolvedValue()
}));

const jobsRouter = require("../../routes/jobs");
const dbHelper = require("../../test-helpers/dbHelper");
const Job = require("../../models/Job");

const app = express();
app.use(express.json());
app.use("/api/jobs", jobsRouter);

describe("Jobs Routes Test", () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
    // Reset mockUser to coordinator
    mockUser._id = new mongoose.Types.ObjectId();
    mockUser.id = mockUser._id;
    mockUser.role = "coordinator";
    mockUser.subRole = "coordinator_paid";
    mockUser.collegeId = collegeId;
  });

  // ──────────────────────────────────────────────
  // GET /api/jobs - List jobs
  // ──────────────────────────────────────────────
  describe("GET /", () => {
    it("should return paginated jobs for coordinator", async () => {
      // Create some jobs
      for (let i = 0; i < 3; i++) {
        await Job.create({
          title: `Job ${i}`,
          company: `Company ${i}`,
          collegeId: mockUser.collegeId,
          postedBy: mockUser._id,
          status: "active"
        });
      }

      const res = await request(app).get("/api/jobs");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(20);
      expect(res.body.pages).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
    });

    it("should return correct pagination structure with custom params", async () => {
      for (let i = 0; i < 5; i++) {
        await Job.create({
          title: `Job ${i}`,
          company: `Company ${i}`,
          collegeId: mockUser.collegeId,
          postedBy: mockUser._id
        });
      }

      const res = await request(app).get("/api/jobs?page=2&limit=2");

      expect(res.statusCode).toBe(200);
      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(2);
      expect(res.body.total).toBe(5);
      expect(res.body.pages).toBe(3);
      expect(res.body.data.length).toBe(2);
    });

    it("should return empty data when no jobs exist", async () => {
      const res = await request(app).get("/api/jobs");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.data).toEqual([]);
    });

    it("should only return jobs for the user's college", async () => {
      const otherCollegeId = new mongoose.Types.ObjectId();

      await Job.create({
        title: "My College Job",
        company: "My Corp",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id
      });
      await Job.create({
        title: "Other College Job",
        company: "Other Corp",
        collegeId: otherCollegeId,
        postedBy: new mongoose.Types.ObjectId()
      });

      const res = await request(app).get("/api/jobs");

      expect(res.statusCode).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.data[0].title).toBe("My College Job");
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/jobs - Create job
  // ──────────────────────────────────────────────
  describe("POST /", () => {
    it("should create a job successfully", async () => {
      const res = await request(app)
        .post("/api/jobs")
        .send({
          title: "SDE Intern",
          company: "TechCorp",
          location: "Bangalore",
          description: "Build cool stuff",
          jobType: "internship",
          status: "active"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe("SDE Intern");
      expect(res.body.company).toBe("TechCorp");
      expect(res.body.collegeId.toString()).toBe(mockUser.collegeId.toString());
      expect(res.body.postedBy.toString()).toBe(mockUser._id.toString());
    });

    it("should return 500 when required fields are missing", async () => {
      // Job model requires title, company, collegeId, postedBy
      // collegeId and postedBy are set by the route, but title/company come from body
      const res = await request(app)
        .post("/api/jobs")
        .send({ description: "No title or company" });

      expect(res.statusCode).toBe(500);
    });

    it("should enforce free tier limit of 5 active jobs", async () => {
      mockUser.subRole = "coordinator_free";

      for (let i = 0; i < 5; i++) {
        await Job.create({
          title: `Active Job ${i}`,
          company: `Co ${i}`,
          collegeId: mockUser.collegeId,
          postedBy: mockUser._id,
          status: "active"
        });
      }

      const res = await request(app)
        .post("/api/jobs")
        .send({
          title: "Sixth Job",
          company: "Overflow",
          status: "active"
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Free tier limit");
    });

    it("should allow paid coordinator to exceed 5 active jobs", async () => {
      mockUser.subRole = "coordinator_paid";

      for (let i = 0; i < 5; i++) {
        await Job.create({
          title: `Active Job ${i}`,
          company: `Co ${i}`,
          collegeId: mockUser.collegeId,
          postedBy: mockUser._id,
          status: "active"
        });
      }

      const res = await request(app)
        .post("/api/jobs")
        .send({
          title: "Sixth Job Paid",
          company: "Premium Co"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.title).toBe("Sixth Job Paid");
    });
  });

  // ──────────────────────────────────────────────
  // PUT /api/jobs/:id - Update job
  // ──────────────────────────────────────────────
  describe("PUT /:id", () => {
    it("should update an existing job", async () => {
      const job = await Job.create({
        title: "Old Title",
        company: "Old Co",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id
      });

      const res = await request(app)
        .put(`/api/jobs/${job._id}`)
        .send({ title: "New Title", location: "Remote" });

      expect(res.statusCode).toBe(200);
      expect(res.body.title).toBe("New Title");
      expect(res.body.location).toBe("Remote");
    });

    it("should return 404 for non-existent job", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/jobs/${fakeId}`)
        .send({ title: "Ghost" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Job not found");
    });

    it("should not update a job from another college", async () => {
      const otherCollegeJob = await Job.create({
        title: "Other Job",
        company: "Other Co",
        collegeId: new mongoose.Types.ObjectId(),
        postedBy: new mongoose.Types.ObjectId()
      });

      const res = await request(app)
        .put(`/api/jobs/${otherCollegeJob._id}`)
        .send({ title: "Hacked Title" });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Job not found");
    });

    it("should sync stipend and ctc", async () => {
      const job = await Job.create({
        title: "Sync Job",
        company: "Sync Co",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id
      });

      const res = await request(app)
        .put(`/api/jobs/${job._id}`)
        .send({ stipend: "10 LPA" });

      expect(res.statusCode).toBe(200);
      expect(res.body.stipend).toBe("10 LPA");
      expect(res.body.ctc).toBe("10 LPA");
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/jobs/:id - Delete job
  // ──────────────────────────────────────────────
  describe("DELETE /:id", () => {
    it("should delete a job successfully", async () => {
      const job = await Job.create({
        title: "Delete Me",
        company: "Bye Co",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id
      });

      const res = await request(app).delete(`/api/jobs/${job._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe("Job deleted successfully");

      // Verify deleted from DB
      const deleted = await Job.findById(job._id);
      expect(deleted).toBeNull();
    });

    it("should return 404 for non-existent job", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/jobs/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Job not found");
    });

    it("should not delete a job from another college", async () => {
      const otherJob = await Job.create({
        title: "Protected Job",
        company: "Safe Co",
        collegeId: new mongoose.Types.ObjectId(),
        postedBy: new mongoose.Types.ObjectId()
      });

      const res = await request(app).delete(`/api/jobs/${otherJob._id}`);

      expect(res.statusCode).toBe(404);

      // Verify still exists
      const stillExists = await Job.findById(otherJob._id);
      expect(stillExists).not.toBeNull();
    });
  });

  // ──────────────────────────────────────────────
  // Role enforcement
  // ──────────────────────────────────────────────
  describe("Role enforcement", () => {
    it("should reject student from creating a job", async () => {
      mockUser.role = "student";

      const res = await request(app)
        .post("/api/jobs")
        .send({
          title: "Student Job",
          company: "Student Co"
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject student from updating a job", async () => {
      // Create job as coordinator first
      mockUser.role = "coordinator";
      const job = await Job.create({
        title: "Existing Job",
        company: "Existing Co",
        collegeId: mockUser.collegeId,
        postedBy: mockUser._id
      });

      // Switch to student
      mockUser.role = "student";

      const res = await request(app)
        .put(`/api/jobs/${job._id}`)
        .send({ title: "Hacked" });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject student from deleting a job", async () => {
      mockUser.role = "student";
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app).delete(`/api/jobs/${fakeId}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject admin from creating a job", async () => {
      mockUser.role = "admin";

      const res = await request(app)
        .post("/api/jobs")
        .send({
          title: "Admin Job",
          company: "Admin Co"
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });
  });
});
