/**
 * Company model schema for CRM and historical placement data.
 */
const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: "College", default: null },
  status: { type: String, enum: ["prospect", "confirmed", "on_campus", "closed"], default: "prospect" },
  expectedVisitDate: Date,
  publicData: {
    avgCtc: String,
    employeeRange: String,
    industry: String,
    glassdoorRating: Number
  },
  historicalData: [{
    cycleYear: Number,
    ctcOffered: String,
    offersCount: Number,
    studentsInterviewed: Number,
    interviewRounds: Number,
    branches: [String]
  }],
  contactPerson: String,
  contactEmail: String,
  contactPhone: String,
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Company", companySchema);
