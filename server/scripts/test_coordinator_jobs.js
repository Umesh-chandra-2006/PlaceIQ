const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Job = require("../models/Job");

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const coord = await User.findOne({ email: "umesh@anurag.edu.in" });
    if (!coord) {
      console.log("Coordinator not found!");
      process.exit(1);
    }
    console.log("COORDINATOR:", {
      _id: coord._id,
      name: coord.name,
      collegeId: coord.collegeId,
      role: coord.role
    });

    // Run the equivalent logic of router.get("/")
    let query = { collegeId: coord.collegeId };
    console.log("Query:", query);

    const jobs = await Job.find(query).sort({ createdAt: -1 });
    console.log(`Found ${jobs.length} jobs for coordinator's query:`);
    jobs.forEach(j => {
      console.log(`- ${j.company} - ${j.title} (ID: ${j._id}) (CollegeId: ${j.collegeId})`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

test();
