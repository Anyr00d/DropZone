import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  event: { type: String, required: true },
  fileId: { type: String, required: true },
  user: { type: String },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed },
});

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
