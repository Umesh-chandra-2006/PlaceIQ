const express = require("express");
const request = require("supertest");
const authRouter = require("../../routes/auth");
const dbHelper = require("../../test-helpers/dbHelper");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
// Mock a simple middleware to set req.user since authRouter might use req.user for protected routes
app.use("/api/auth", authRouter);

describe("Auth Routes Test", () => {
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

  it("should successfully log in with valid credentials", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    await User.create({
      name: "Super Admin",
      email: "admin@gmail.com",
      passwordHash,
      role: "superadmin",
      isActive: true,
      isSetup: true,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@gmail.com", password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe("admin@gmail.com");
  });

  it("should reject login with invalid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@gmail.com", password: "wrong" });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("should successfully change password if current password matches", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "John Doe",
      email: "john@gmail.com",
      passwordHash,
      role: "student",
      isActive: true,
      isSetup: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "password123", newPassword: "newpassword" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Password updated successfully.");

    // Verify it updated
    const updatedUser = await User.findById(user._id);
    const isNewMatch = await bcrypt.compare("newpassword", updatedUser.passwordHash);
    expect(isNewMatch).toBe(true);
  });

  it("should reject change password if current password is wrong", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "John Doe",
      email: "john@gmail.com",
      passwordHash,
      role: "student",
      isActive: true,
      isSetup: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newpassword" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid current password.");
  });

  it("should generate token on forgot-password", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "John Doe",
      email: "john@gmail.com",
      passwordHash,
      role: "student",
      isActive: true,
      isSetup: true,
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "john@gmail.com" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("a reset link has been sent");

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.resetPasswordToken).toBeDefined();
    expect(updatedUser.resetPasswordExpires).toBeDefined();
  });

  it("should successfully reset password with valid token", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    const user = await User.create({
      name: "John Doe",
      email: "john@gmail.com",
      passwordHash,
      role: "student",
      isActive: true,
      isSetup: true,
      resetPasswordToken: "resettoken123",
      resetPasswordExpires: new Date(Date.now() + 3600000) // 1h in future
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "john@gmail.com", token: "resettoken123", password: "newpassword123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Password reset successfully");

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.resetPasswordToken).toBeUndefined();
    const isNewMatch = await bcrypt.compare("newpassword123", updatedUser.passwordHash);
    expect(isNewMatch).toBe(true);
  });

  it("should reject reset password with expired token", async () => {
    const passwordHash = await bcrypt.hash("password123", 10);
    await User.create({
      name: "John Doe",
      email: "john@gmail.com",
      passwordHash,
      role: "student",
      isActive: true,
      isSetup: true,
      resetPasswordToken: "resettoken123",
      resetPasswordExpires: new Date(Date.now() - 1000) // 1s in past
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: "john@gmail.com", token: "resettoken123", password: "newpassword123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid reset token or token has expired.");
  });
});
