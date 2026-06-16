const { enforceOnboarding } = require("../../middleware/onboarded");

describe("Onboarded Middleware Test", () => {
  it("should block non-onboarded student", () => {
    const req = { user: { role: "student", isOnboarded: false } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    enforceOnboarding(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Onboarding required. Please complete your profile onboarding before performing this action."
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should allow onboarded student", () => {
    const req = { user: { role: "student", isOnboarded: true } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    enforceOnboarding(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should allow non-student roles even if not onboarded", () => {
    const req = { user: { role: "coordinator", isOnboarded: false } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    enforceOnboarding(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
