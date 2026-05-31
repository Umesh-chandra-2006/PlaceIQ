const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all students
    const students = await User.find({ role: "student" });
    console.log(`Found ${students.length} students total.`);

    let updatedCount = 0;
    for (const student of students) {
      if (student.department && (!student.branch || student.branch !== student.department)) {
        console.log(`Syncing branch for ${student.name} (${student.email}): ${student.branch} -> ${student.department}`);
        student.branch = student.department;
        await student.save();
        updatedCount++;
      }
    }

    console.log(`Successfully synced ${updatedCount} students.`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();
