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

    const studentBatches = await Batch.find({ studentIds: student._id }).select("_id");
    const batchIds = studentBatches.map(b => b._id);

    const query = {
      collegeId: student.collegeId,
      status: "active",
      deadline: { $gte: new Date() },
      $and: [
        {
          $or: [
            { "eligibility.branches": { $size: 0 } },
            { "eligibility.branches": { $exists: false } },
            { "eligibility.branches": null },
            { "eligibility.branches": { $in: [student.branch] } }
          ]
        },
        {
          $or: [
            { "eligibility.minCgpa": { $exists: false } },
            { "eligibility.minCgpa": null },
            { "eligibility.minCgpa": { $lte: student.cgpa } }
          ]
        },
        {
          $or: [
            { "eligibility.maxBacklogs": { $exists: false } },
            { "eligibility.maxBacklogs": null },
            { "eligibility.maxBacklogs": { $gte: student.backlogs || 0 } }
          ]
        },
        {
          $or: [
            { "eligibility.maxActiveBacklogs": { $exists: false } },
            { "eligibility.maxActiveBacklogs": null },
            { "eligibility.maxActiveBacklogs": { $gte: student.activeBacklogs || 0 } }
          ]
        },
        {
          $or: [
            { "eligibility.minTenthPercent": { $exists: false } },
            { "eligibility.minTenthPercent": null },
            { "eligibility.minTenthPercent": { $lte: student.tenthPercent || 0 } }
          ]
        },
        {
          $or: [
            { "eligibility.minTwelfthPercent": { $exists: false } },
            { "eligibility.minTwelfthPercent": null },
            { "eligibility.minTwelfthPercent": { $lte: student.twelfthPercent || 0 } }
          ]
        },
        {
          $or: [
            { "eligibility.batchYears": { $size: 0 } },
            { "eligibility.batchYears": { $exists: false } },
            { "eligibility.batchYears": null },
            { "eligibility.batchYears": { $in: [student.year] } }
          ]
        },
        {
          $or: [
            { "eligibility.departments": { $size: 0 } },
            { "eligibility.departments": { $exists: false } },
            { "eligibility.departments": null },
            { "eligibility.departments": { $in: [student.department] } }
          ]
        },
        {
          $or: [
            { "eligibility.sections": { $size: 0 } },
            { "eligibility.sections": { $exists: false } },
            { "eligibility.sections": null },
            { "eligibility.sections": { $in: [student.section] } }
          ]
        },
        {
          $or: [
            { "eligibility.batchIds": { $size: 0 } },
            { "eligibility.batchIds": { $exists: false } },
            { "eligibility.batchIds": null },
            { "eligibility.batchIds": { $in: batchIds } }
          ]
        },
        {
          $or: [
            { "eligibility.placementStatus": { $size: 0 } },
            { "eligibility.placementStatus": { $exists: false } },
            { "eligibility.placementStatus": null },
            { "eligibility.placementStatus": { $in: [student.placementStatus || "not_placed"] } }
          ]
        }
      ]
    };

    const jobs = await Job.find(query);
    console.log(`FOUND ${jobs.length} MATCHING JOBS:`);
    console.log(jobs);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
