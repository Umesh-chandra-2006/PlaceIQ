const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Job = require("../models/Job");
const Batch = require("../models/Batch");

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const student = await User.findOne({ email: "rahul.kumar@anurag.edu.in" });
    if (!student) {
      console.log("Student not found!");
      process.exit(0);
    }
    console.log("Student profile:", student.name, "Branch:", student.branch, "CGPA:", student.cgpa);

    const jobs = await Job.find({ collegeId: student.collegeId, status: "active" });
    console.log(`Found ${jobs.length} total active jobs.`);

    const studentBatches = await Batch.find({ studentIds: student._id }).select("_id");
    const batchIds = studentBatches.map(b => b._id);

    const isEligible = (student, job, batchIds) => {
      if (job.deadline && new Date(job.deadline) < new Date()) {
        return false;
      }
      const elig = job.eligibility || {};
      if (elig.minCgpa !== undefined && elig.minCgpa !== null && elig.minCgpa !== "N/A" && elig.minCgpa !== "") {
        const minCgpa = parseFloat(elig.minCgpa);
        if (!isNaN(minCgpa) && (student.cgpa || 0) < minCgpa) return false;
      }
      if (elig.maxBacklogs !== undefined && elig.maxBacklogs !== null && elig.maxBacklogs !== "N/A" && elig.maxBacklogs !== "") {
        const maxBacklogs = parseInt(elig.maxBacklogs);
        if (!isNaN(maxBacklogs) && (student.backlogs || 0) > maxBacklogs) return false;
      }
      if (elig.maxActiveBacklogs !== undefined && elig.maxActiveBacklogs !== null && elig.maxActiveBacklogs !== "N/A" && elig.maxActiveBacklogs !== "") {
        const maxActiveBacklogs = parseInt(elig.maxActiveBacklogs);
        if (!isNaN(maxActiveBacklogs) && (student.activeBacklogs || 0) > maxActiveBacklogs) return false;
      }
      if (elig.minTenthPercent !== undefined && elig.minTenthPercent !== null && elig.minTenthPercent !== "N/A" && elig.minTenthPercent !== "") {
        const minTenth = parseFloat(elig.minTenthPercent);
        if (!isNaN(minTenth) && (student.tenthPercent || 0) < minTenth) return false;
      }
      if (elig.minTwelfthPercent !== undefined && elig.minTwelfthPercent !== null && elig.minTwelfthPercent !== "N/A" && elig.minTwelfthPercent !== "") {
        const minTwelfth = parseFloat(elig.minTwelfthPercent);
        if (!isNaN(minTwelfth) && (student.twelfthPercent || 0) < minTwelfth) return false;
      }
      if (elig.batchYears && elig.batchYears.length > 0) {
        if (student.year && !elig.batchYears.includes(student.year)) return false;
      }
      if (elig.batchIds && elig.batchIds.length > 0) {
        const hasMatchingBatch = elig.batchIds.some(bid => batchIds.some(sid => sid.toString() === bid.toString()));
        if (!hasMatchingBatch) return false;
      }
      if (elig.placementStatus && elig.placementStatus.length > 0) {
        if (!elig.placementStatus.includes(student.placementStatus || "not_placed")) return false;
      }
      if (elig.sections && elig.sections.length > 0) {
        if (student.section && !elig.sections.includes(student.section)) return false;
      }
      if (elig.departments && elig.departments.length > 0) {
        if (student.department && !elig.departments.includes(student.department)) return false;
      }
      if (elig.branches && elig.branches.length > 0) {
        const studentBranch = (student.branch || "").toUpperCase();
        const jobBranches = elig.branches.map(b => (b || "").toUpperCase());

        const isMatched = jobBranches.some(jb => {
          if (jb === studentBranch) return true;
          if (["B.TECH", "M.TECH", "BE", "ME", "DEGREE", "ANY", "ALL", "GRADUATE", "ENGINEERING", "MCA", "BCA", "BSC", "MSC"].includes(jb)) return true;
          if (jb.includes(studentBranch) || studentBranch.includes(jb)) return true;
          if (studentBranch === "CSE" && (jb === "CS" || jb.includes("COMPUTER"))) return true;
          if (studentBranch === "ECE" && (jb === "EC" || jb.includes("ELECTRONIC"))) return true;
          if (studentBranch === "EEE" && (jb === "EE" || jb.includes("ELECTRICAL"))) return true;
          if (studentBranch === "MECH" && (jb === "ME" || jb.includes("MECHANICAL"))) return true;
          if (studentBranch === "CIVIL" && (jb === "CE" || jb.includes("CIVIL"))) return true;
          if (studentBranch === "IT" && (jb === "INFORMATION" || jb.includes("TECH"))) return true;
          return false;
        });

        if (!isMatched) return false;
      }
      return true;
    };

    const matching = jobs.filter(j => isEligible(student, j, batchIds));
    console.log(`Matching jobs for student: ${matching.length}`);
    for (const job of matching) {
      console.log(`- [MATCH] ${job.company} : ${job.title} (ID: ${job._id})`);
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

test();
