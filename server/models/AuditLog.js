const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true }, // e.g. 'CREATE_JOB', 'STAGE_CHANGE', 'BULK_IMPORT', 'DELETE_JOB'
  target: { type: String, required: true }, // e.g. 'Job', 'Application', 'Batch'
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 } // TTL 90 days
});

// Index to optimize audit log cleanups and lookups
auditLogSchema.index({ collegeId: 1, createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
