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

    const student = await User.findOne({ role: "student" });
    if (!student) {
      console.log("No student found!");
      process.exit(0);
    }
    console.log("STUDENT DETAILS:", {
      _id: student._id,
      name: student.name,
      email: student.email,
      branch: student.branch,
      department: student.department,
      cgpa: student.cgpa,
      year: student.year,
      activeBacklogs: student.activeBacklogs,
      backlogs: student.backlogs,
      tenthPercent: student.tenthPercent,
      twelfthPercent: student.twelfthPercent,
      placementStatus: student.placementStatus,
      isOnboarded: student.isOnboarded
    });

    const jobs = await Job.find({ collegeId: student.collegeId });
    console.log(`FOUND ${jobs.length} JOBS FOR COLLEGE`);
    for (const job of jobs) {
      console.log(`JOB: ${job.company} - ${job.title}`, {
        _id: job._id,
        status: job.status,
        deadline: job.deadline,
        eligibility: job.eligibility
      });
      
      // Test individual matching components
      const matchStatus = job.status === "active";
      const matchDeadline = new Date(job.deadline) >= new Date();
      
      const matchBranch = !job.eligibility.branches || job.eligibility.branches.length === 0 || job.eligibility.branches.includes(student.branch);
      const matchCgpa = job.eligibility.minCgpa === undefined || job.eligibility.minCgpa === null || student.cgpa >= job.eligibility.minCgpa;
      const matchBacklogs = job.eligibility.maxBacklogs === undefined || job.eligibility.maxBacklogs === null || student.backlogs <= job.eligibility.maxBacklogs;
      const matchActiveBacklogs = job.eligibility.maxActiveBacklogs === undefined || job.eligibility.maxActiveBacklogs === null || student.activeBacklogs <= job.eligibility.maxActiveBacklogs;
      const matchYear = !job.eligibility.batchYears || job.eligibility.batchYears.length === 0 || job.eligibility.batchYears.includes(student.year);
      
      console.log("MATCH RESULTS:", {
        matchStatus,
        matchDeadline,
        matchBranch,
        matchCgpa,
        matchBacklogs,
        matchActiveBacklogs,
        matchYear,
        isOverallMatch: matchStatus && matchDeadline && matchBranch && matchCgpa && matchBacklogs && matchActiveBacklogs && matchYear
      });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
