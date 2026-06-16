const paginate = require("../../middleware/paginate");

describe("Paginate Middleware Test", () => {
  it("should set default pagination values", () => {
    const req = { query: {} };
    const res = {};
    const next = jest.fn();

    paginate()(req, res, next);

    expect(req.pagination).toBeDefined();
    expect(req.pagination.page).toBe(1);
    expect(req.pagination.limit).toBe(20);
    expect(req.pagination.skip).toBe(0);
    expect(next).toHaveBeenCalled();
  });

  it("should use custom page and limit query params", () => {
    const req = { query: { page: "3", limit: "15" } };
    const res = {};
    const next = jest.fn();

    paginate()(req, res, next);

    expect(req.pagination.page).toBe(3);
    expect(req.pagination.limit).toBe(15);
    expect(req.pagination.skip).toBe(30);
    expect(next).toHaveBeenCalled();
  });

  it("should cap limit at max limit", () => {
    const req = { query: { limit: "150" } };
    const res = {};
    const next = jest.fn();

    paginate()(req, res, next);

    expect(req.pagination.limit).toBe(100); // MAX_LIMIT is 100
    expect(next).toHaveBeenCalled();
  });

  it("should handle negative or invalid parameters gracefully", () => {
    const req = { query: { page: "-5", limit: "abc" } };
    const res = {};
    const next = jest.fn();

    paginate()(req, res, next);

    expect(req.pagination.page).toBe(1);
    expect(req.pagination.limit).toBe(20); // fallback to default limit
    expect(req.pagination.skip).toBe(0);
    expect(next).toHaveBeenCalled();
  });
});
