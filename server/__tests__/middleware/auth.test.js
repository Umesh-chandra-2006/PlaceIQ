const { protect } = require("../../middleware/auth");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const dbHelper = require("../../test-helpers/dbHelper");

describe("Auth Middleware Test", () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await dbHelper.connect();
    process.env.JWT_SECRET = "testsecret";
  });

  afterAll(async () => {
    await dbHelper.close();
  });

  beforeEach(async () => {
    await dbHelper.clear();
  });

  it("should block if no token is provided", async () => {
    const req = { headers: {} };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized, no token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should block if invalid token is provided", async () => {
    const req = { headers: { authorization: "Bearer invalidtoken" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Not authorized, token failed" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should authorize active user with valid token", async () => {
    const user = await User.create({
      name: "Test User",
      email: "test@gmail.com",
      role: "student",
      passwordHash: "hash",
      isActive: true,
      isSetup: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user._id.toString()).toBe(user._id.toString());
  });

  it("should block deactivated user", async () => {
    const user = await User.create({
      name: "Deactivated User",
      email: "test@gmail.com",
      role: "student",
      passwordHash: "hash",
      isActive: false,
      isSetup: true,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Your account has been deactivated. Please contact your administrator.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
