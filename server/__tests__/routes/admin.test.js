const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

const collegeId = new mongoose.Types.ObjectId();

let mockUser = {
  _id: new mongoose.Types.ObjectId(),
  id: new mongoose.Types.ObjectId(),
  role: "superadmin",
  collegeId
};

// Mock the protect middleware before requiring the router
jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = mockUser;
    next();
  }
}));

const adminRouter = require("../../routes/admin");
const dbHelper = require("../../test-helpers/dbHelper");
const College = require("../../models/College");
const User = require("../../models/User");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);

describe("Admin Routes Test", () => {
  beforeAll(async () => {
    await dbHelper.connect();
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
    // Reset mockUser to superadmin for each test
    mockUser._id = new mongoose.Types.ObjectId();
    mockUser.id = mockUser._id;
    mockUser.role = "superadmin";
    mockUser.collegeId = new mongoose.Types.ObjectId();
  });

  // ──────────────────────────────────────────────
  // POST /api/admin/colleges - Create college
  // ──────────────────────────────────────────────
  describe("POST /colleges", () => {
    it("should create a college and provision an admin user", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Test University",
          emailDomain: "testuni.edu",
          adminName: "Admin User",
          adminEmail: "admin@testuni.edu"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.college).toBeDefined();
      expect(res.body.college.name).toBe("Test University");
      expect(res.body.college.emailDomain).toBe("testuni.edu");
      expect(res.body.college.licenceStatus).toBe("free");
      expect(res.body.admin).toBeDefined();
      expect(res.body.admin.email).toBe("admin@testuni.edu");
      expect(res.body.setupLink).toBeDefined();
      expect(res.body.setupLink).toContain("setup-account");

      // Verify user was created in DB
      const adminUser = await User.findOne({ email: "admin@testuni.edu" });
      expect(adminUser).not.toBeNull();
      expect(adminUser.role).toBe("admin");
      expect(adminUser.isSetup).toBe(false);
      expect(adminUser.setupToken).toBeDefined();
    });

    it("should create a college with custom licence and quota", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Premium University",
          emailDomain: "premium.edu",
          adminName: "Admin",
          adminEmail: "admin@premium.edu",
          licenceStatus: "paid",
          aiReviewQuota: 10
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.college.licenceStatus).toBe("paid");
      expect(res.body.college.aiReviewQuota).toBe(10);
    });

    it("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({ name: "Incomplete College" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });

    it("should return 400 for missing adminName", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Test",
          emailDomain: "test.edu",
          adminEmail: "admin@test.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Missing required fields");
    });

    it("should return 400 for duplicate email domain", async () => {
      await College.create({
        name: "Existing College",
        emailDomain: "existing.edu"
      });

      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Another College",
          emailDomain: "existing.edu",
          adminName: "Admin",
          adminEmail: "admin@existing.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should return 400 when admin email doesn't match domain", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Mismatch College",
          emailDomain: "college.edu",
          adminName: "Admin",
          adminEmail: "admin@different.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Admin email must end with @college.edu");
    });

    it("should strip leading @ from emailDomain", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Strip Test",
          emailDomain: "@strip.edu",
          adminName: "Admin",
          adminEmail: "admin@strip.edu"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.college.emailDomain).toBe("strip.edu");
    });

    it("should return 400 if emailDomain contains @ inside (full email entered)", async () => {
      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Bad Domain",
          emailDomain: "user@domain.edu",
          adminName: "Admin",
          adminEmail: "admin@domain.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("plain domain");
    });

    it("should return 400 when admin email already exists", async () => {
      await User.create({
        name: "Existing User",
        email: "existing@newuni.edu",
        passwordHash: "hash",
        role: "admin",
        isSetup: true
      });

      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "New University",
          emailDomain: "newuni.edu",
          adminName: "Admin",
          adminEmail: "existing@newuni.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("A user with this admin email already exists");
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/colleges - List colleges
  // ──────────────────────────────────────────────
  describe("GET /colleges", () => {
    it("should return all non-deleted colleges with admin info", async () => {
      const college = await College.create({
        name: "Active College",
        emailDomain: "active.edu"
      });
      await User.create({
        name: "Admin",
        email: "admin@active.edu",
        passwordHash: "hash",
        role: "admin",
        collegeId: college._id,
        isSetup: true
      });

      // Create a soft-deleted college — should NOT appear
      await College.create({
        name: "Deleted College",
        emailDomain: "deleted.edu",
        isDeleted: true
      });

      const res = await request(app).get("/api/admin/colleges");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Active College");
      expect(res.body[0].adminEmail).toBe("admin@active.edu");
      expect(res.body[0].adminName).toBe("Admin");
    });

    it("should return empty array when no colleges exist", async () => {
      const res = await request(app).get("/api/admin/colleges");

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────
  // PUT /api/admin/colleges/:id/upgrade
  // ──────────────────────────────────────────────
  describe("PUT /colleges/:id/upgrade", () => {
    it("should upgrade licence status", async () => {
      const college = await College.create({
        name: "Free College",
        emailDomain: "free.edu",
        licenceStatus: "free"
      });

      const res = await request(app)
        .put(`/api/admin/colleges/${college._id}/upgrade`)
        .send({ licenceStatus: "paid" });

      expect(res.statusCode).toBe(200);
      expect(res.body.licenceStatus).toBe("paid");
    });

    it("should update aiReviewQuota", async () => {
      const college = await College.create({
        name: "Quota College",
        emailDomain: "quota.edu"
      });

      const res = await request(app)
        .put(`/api/admin/colleges/${college._id}/upgrade`)
        .send({ aiReviewQuota: 25 });

      expect(res.statusCode).toBe(200);
      expect(res.body.aiReviewQuota).toBe(25);
    });

    it("should update both licence and quota together", async () => {
      const college = await College.create({
        name: "Both College",
        emailDomain: "both.edu"
      });

      const res = await request(app)
        .put(`/api/admin/colleges/${college._id}/upgrade`)
        .send({ licenceStatus: "paid", aiReviewQuota: 50 });

      expect(res.statusCode).toBe(200);
      expect(res.body.licenceStatus).toBe("paid");
      expect(res.body.aiReviewQuota).toBe(50);
    });
  });

  // ──────────────────────────────────────────────
  // DELETE /api/admin/colleges/:id - Soft delete
  // ──────────────────────────────────────────────
  describe("DELETE /colleges/:id", () => {
    it("should soft delete a college and deactivate its users", async () => {
      const college = await College.create({
        name: "Delete Me",
        emailDomain: "deleteme.edu"
      });
      const user = await User.create({
        name: "College Admin",
        email: "admin@deleteme.edu",
        passwordHash: "hash",
        role: "admin",
        collegeId: college._id,
        isActive: true
      });

      const res = await request(app)
        .delete(`/api/admin/colleges/${college._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("soft deleted");
      expect(res.body.college.isDeleted).toBe(true);

      // Verify user was deactivated
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.isActive).toBe(false);
      expect(updatedUser.email).toContain(".deleted-");
    });

    it("should return 404 for non-existent college", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/admin/colleges/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("College not found");
    });
  });

  // ──────────────────────────────────────────────
  // POST /api/admin/coordinators
  // ──────────────────────────────────────────────
  describe("POST /coordinators", () => {
    let adminUser;
    let college;

    beforeEach(async () => {
      college = await College.create({
        name: "Coord College",
        emailDomain: "coord.edu",
        licenceStatus: "free"
      });
      adminUser = await User.create({
        name: "Admin",
        email: "admin@coord.edu",
        passwordHash: "hash",
        role: "admin",
        collegeId: college._id,
        isSetup: true
      });
      // Switch mockUser to admin role for coordinator routes
      mockUser._id = adminUser._id;
      mockUser.id = adminUser._id;
      mockUser.role = "admin";
      mockUser.collegeId = college._id;
    });

    it("should provision a coordinator successfully", async () => {
      const res = await request(app)
        .post("/api/admin/coordinators")
        .send({
          name: "Coordinator One",
          email: "coord1@coord.edu"
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.coordinator).toBeDefined();
      expect(res.body.coordinator.email).toBe("coord1@coord.edu");
      expect(res.body.coordinator.isSetup).toBe(false);
      expect(res.body.setupLink).toBeDefined();

      // Verify in DB
      const coordUser = await User.findOne({ email: "coord1@coord.edu" });
      expect(coordUser.role).toBe("coordinator");
      expect(coordUser.subRole).toBe("coordinator_free");
      expect(coordUser.collegeId.toString()).toBe(college._id.toString());
    });

    it("should assign coordinator_paid subRole for paid college", async () => {
      college.licenceStatus = "paid";
      await college.save();

      const res = await request(app)
        .post("/api/admin/coordinators")
        .send({
          name: "Paid Coordinator",
          email: "paid@coord.edu"
        });

      expect(res.statusCode).toBe(201);
      const coordUser = await User.findOne({ email: "paid@coord.edu" });
      expect(coordUser.subRole).toBe("coordinator_paid");
    });

    it("should return 400 for duplicate email", async () => {
      await User.create({
        name: "Existing Coord",
        email: "duplicate@coord.edu",
        passwordHash: "hash",
        role: "coordinator",
        collegeId: college._id
      });

      const res = await request(app)
        .post("/api/admin/coordinators")
        .send({
          name: "New Coord",
          email: "duplicate@coord.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("already exists");
    });

    it("should return 400 for wrong email domain", async () => {
      const res = await request(app)
        .post("/api/admin/coordinators")
        .send({
          name: "Wrong Domain",
          email: "coord@wrong.edu"
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("must end with @coord.edu");
    });

    it("should return 400 when name or email missing", async () => {
      const res = await request(app)
        .post("/api/admin/coordinators")
        .send({ name: "No Email" });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain("Name and email are required");
    });
  });

  // ──────────────────────────────────────────────
  // GET /api/admin/coordinators
  // ──────────────────────────────────────────────
  describe("GET /coordinators", () => {
    it("should list coordinators for admin's college", async () => {
      const college = await College.create({
        name: "List College",
        emailDomain: "list.edu"
      });
      const adminUser = await User.create({
        name: "Admin",
        email: "admin@list.edu",
        passwordHash: "hash",
        role: "admin",
        collegeId: college._id,
        isSetup: true
      });
      mockUser._id = adminUser._id;
      mockUser.id = adminUser._id;
      mockUser.role = "admin";
      mockUser.collegeId = college._id;

      await User.create({
        name: "Coord A",
        email: "coorda@list.edu",
        passwordHash: "hash",
        role: "coordinator",
        collegeId: college._id,
        isSetup: true
      });
      await User.create({
        name: "Coord B",
        email: "coordb@list.edu",
        passwordHash: "hash",
        role: "coordinator",
        collegeId: college._id,
        isSetup: false
      });

      const res = await request(app).get("/api/admin/coordinators");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });
  });

  // ──────────────────────────────────────────────
  // PUT /api/admin/college-settings
  // ──────────────────────────────────────────────
  describe("PUT /college-settings", () => {
    it("should update departments and cgpaScale", async () => {
      const college = await College.create({
        name: "Settings College",
        emailDomain: "settings.edu"
      });
      const adminUser = await User.create({
        name: "Admin",
        email: "admin@settings.edu",
        passwordHash: "hash",
        role: "admin",
        collegeId: college._id,
        isSetup: true
      });
      mockUser._id = adminUser._id;
      mockUser.id = adminUser._id;
      mockUser.role = "admin";
      mockUser.collegeId = college._id;

      const res = await request(app)
        .put("/api/admin/college-settings")
        .send({
          departments: ["CSE", "ECE", "AI"],
          cgpaScale: 5
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("College settings updated");
      expect(res.body.college.departments).toEqual(["CSE", "ECE", "AI"]);
      expect(res.body.college.cgpaScale).toBe(5);
    });

    it("should update only departments when cgpaScale is omitted", async () => {
      const college = await College.create({
        name: "Partial Settings",
        emailDomain: "partial.edu",
        cgpaScale: 10
      });
      const adminUser = await User.create({
        name: "Admin",
        email: "admin@partial.edu",
        passwordHash: "hash",
        role: "admin",
        collegeId: college._id,
        isSetup: true
      });
      mockUser._id = adminUser._id;
      mockUser.id = adminUser._id;
      mockUser.role = "admin";
      mockUser.collegeId = college._id;

      const res = await request(app)
        .put("/api/admin/college-settings")
        .send({ departments: ["IT", "MECH"] });

      expect(res.statusCode).toBe(200);
      expect(res.body.college.departments).toEqual(["IT", "MECH"]);
      expect(res.body.college.cgpaScale).toBe(10);
    });
  });

  // ──────────────────────────────────────────────
  // Role enforcement
  // ──────────────────────────────────────────────
  describe("Role enforcement", () => {
    it("should reject student from accessing college creation", async () => {
      mockUser.role = "student";

      const res = await request(app)
        .post("/api/admin/colleges")
        .send({
          name: "Hack College",
          emailDomain: "hack.edu",
          adminName: "Hacker",
          adminEmail: "hacker@hack.edu"
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject coordinator from accessing college listing", async () => {
      mockUser.role = "coordinator";

      const res = await request(app).get("/api/admin/colleges");

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject student from accessing coordinator provisioning", async () => {
      mockUser.role = "student";

      const res = await request(app)
        .post("/api/admin/coordinators")
        .send({ name: "Coord", email: "coord@test.edu" });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject coordinator from soft deleting a college", async () => {
      mockUser.role = "coordinator";
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .delete(`/api/admin/colleges/${fakeId}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });

    it("should reject student from updating college settings", async () => {
      mockUser.role = "student";

      const res = await request(app)
        .put("/api/admin/college-settings")
        .send({ departments: ["CSE"] });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain("Forbidden");
    });
  });
});
