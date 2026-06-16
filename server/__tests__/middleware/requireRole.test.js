const { requireRole, requirePaid } = require("../../middleware/requireRole");

describe("RequireRole Middleware Test", () => {
  it("should allow if user role matches allowed roles", () => {
    const req = { user: { role: "admin" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireRole("admin", "superadmin")(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("should forbid if user role does not match allowed roles", () => {
    const req = { user: { role: "student" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requireRole("admin", "superadmin")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Forbidden: Access denied for this role" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow if user has coordinator_paid subRole for requirePaid", () => {
    const req = { user: { subRole: "coordinator_paid" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requirePaid(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should forbid if user does not have coordinator_paid subRole for requirePaid", () => {
    const req = { user: { subRole: "coordinator_free" } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    requirePaid(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Upgrade to paid plan to access this feature" });
    expect(next).not.toHaveBeenCalled();
  });
});
