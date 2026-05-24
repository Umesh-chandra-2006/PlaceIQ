/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Forbidden: Access denied for this role" });
  }
  next();
};

const requirePaid = (req, res, next) => {
  if (!req.user || req.user.subRole !== "coordinator_paid") {
    return res.status(403).json({ error: "Upgrade to paid plan to access this feature" });
  }
  next();
};

module.exports = { requireRole, requirePaid };
