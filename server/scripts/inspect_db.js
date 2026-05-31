const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Job = require("../models/Job");
const College = require("../models/College");

const inspect = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/placeiq";
    console.log("Connecting to:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const colleges = await College.find({});
    console.log(`\nColleges (${colleges.length}):`);
    colleges.forEach(c => console.log(`  - Name: ${c.name}, ID: ${c._id}`));

    const users = await User.find({});
    console.log(`\nUsers (${users.length}):`);
    users.forEach(u => console.log(`  - Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, CollegeId: ${u.collegeId}`));

    const jobs = await Job.find({});
    console.log(`\nJobs (${jobs.length}):`);
    jobs.forEach(j => console.log(`  - Title: ${j.title}, Company: ${j.company}, Status: ${j.status}, CollegeId: ${j.collegeId}, Deadline: ${j.deadline}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspect();
