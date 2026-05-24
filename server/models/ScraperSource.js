const mongoose = require("mongoose");

const scraperSourceSchema = new mongoose.Schema({
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", required: true },
  url: { type: String, required: true },
  label: String,
  isActive: { type: Boolean, default: true },
  lastScrapedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ScraperSource", scraperSourceSchema);
