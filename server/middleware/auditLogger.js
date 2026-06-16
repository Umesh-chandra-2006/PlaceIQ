const AuditLog = require("../models/AuditLog");

/**
 * Logs a coordinator or student mutation action to the database.
 */
const logAudit = async (req, action, target, targetId, details = {}) => {
  try {
    if (!req.user || !req.user.collegeId) {
      console.warn(`[AUDIT] Skip logging: No authenticated user or collegeId attached for action ${action}`);
      return;
    }
    await AuditLog.create({
      actor: req.user._id,
      action,
      target,
      targetId,
      details,
      collegeId: req.user.collegeId
    });
  } catch (error) {
    console.error("[AUDIT] Failed to write audit log:", error);
  }
};

module.exports = { logAudit };
