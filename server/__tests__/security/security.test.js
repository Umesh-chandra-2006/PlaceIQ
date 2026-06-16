const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");

const { protect } = require("../../middleware/auth");
const { requireRole } = require("../../middleware/requireRole");
const dbHelper = require("../../test-helpers/dbHelper");
const User = require("../../models/User");

// Setup test app
const app = express();
app.use(express.json());
app.use(helmet());

// Test rate limiter
const testLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: "Too many requests." }
});

app.use("/api/test-limit", testLimiter, (req, res) => {
  res.json({ success: true });
});

// Test protected admin route
app.get("/api/test-admin", protect, requireRole("admin", "superadmin"), (req, res) => {
  res.json({ success: true });
});

describe("Security Integration Tests", () => {
  beforeAll(async () => {
    await dbHelper.connect();
    process.env.JWT_SECRET = "testsecret";
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
  });

  // 1. Requests without auth token get 401
  it("should return 401 Unauthorized for requests without auth token", async () => {
    const res = await request(app).get("/api/test-admin");
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Not authorized, no token");
  });

  // 2. Expired or invalid JWT tokens get 401
  it("should return 401 Unauthorized for requests with invalid token", async () => {
    const res = await request(app)
      .get("/api/test-admin")
      .set("Authorization", "Bearer invalidtoken123");
    
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Not authorized, token failed");
  });

  it("should return 401 Unauthorized for requests with expired token", async () => {
    const expiredToken = jwt.sign({ id: new mongoose.Types.ObjectId() }, process.env.JWT_SECRET, {
      expiresIn: "0s" // instantly expired
    });

    const res = await request(app)
      .get("/api/test-admin")
      .set("Authorization", `Bearer ${expiredToken}`);
    
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Not authorized, token failed");
  });

  // 3. Role enforcement: student token can't access admin routes (403)
  it("should return 403 Forbidden when a student attempts to access admin routes", async () => {
    const student = await User.create({
      name: "Student User",
      email: "student@test.edu",
      passwordHash: "hash",
      role: "student",
      isActive: true,
      isSetup: true
    });

    const studentToken = jwt.sign({ id: student._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/test-admin")
      .set("Authorization", `Bearer ${studentToken}`);
    
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toBe("Forbidden: Access denied for this role");
  });

  it("should allow admin token to access admin routes", async () => {
    const admin = await User.create({
      name: "Admin User",
      email: "admin@test.edu",
      passwordHash: "hash",
      role: "admin",
      isActive: true,
      isSetup: true
    });

    const adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .get("/api/test-admin")
      .set("Authorization", `Bearer ${adminToken}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // 4. Rate limiter behaves correctly (blocks after max limit)
  it("should block requests after exceeding the rate limit", async () => {
    // 3 requests allowed
    await request(app).get("/api/test-limit");
    await request(app).get("/api/test-limit");
    await request(app).get("/api/test-limit");

    // 4th request should be blocked
    const res = await request(app).get("/api/test-limit");
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe("Too many requests.");
  });

  // 5. Helmet security headers exist
  it("should include standard security headers via helmet", async () => {
    const res = await request(app).get("/api/test-limit");
    expect(res.headers["x-dns-prefetch-control"]).toBe("off");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });
});
