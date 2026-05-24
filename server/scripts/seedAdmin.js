/**
 * Seed script to create initial data for PlaceIQ.
 * Creates one admin, one college, one coordinator (free), five students, and three job listings.
 * Idempotent on re-run.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const College = require("../models/College");
const Job = require("../models/Job");
const Company = require("../models/Company");
const PlacementCycle = require("../models/PlacementCycle");

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for seeding...");

    // 1. Create College
    let college = await College.findOne({ emailDomain: "anurag.edu.in" });
    if (!college) {
      college = await College.create({
        name: "PlaceIQ Engineering College",
        emailDomain: "anurag.edu.in",
        licenceStatus: "free"
      });
      console.log("College created.");
    }

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, salt);

    // 2. Create Admin
    const adminExists = await User.findOne({ email: process.env.SEED_ADMIN_EMAIL });
    if (!adminExists) {
      await User.create({
        name: "System Admin",
        email: process.env.SEED_ADMIN_EMAIL,
        passwordHash: defaultPassword,
        role: "admin"
      });
      console.log("Admin user created.");
    }

    // 3. Create Coordinator (Free Tier)
    let coordinator = await User.findOne({ email: "coordinator@anurag.edu.in" });
    if (!coordinator) {
      coordinator = await User.create({
        name: "John Coordinator",
        email: "coordinator@anurag.edu.in",
        passwordHash: defaultPassword,
        role: "coordinator",
        subRole: "coordinator_free",
        collegeId: college._id
      });
      college.coordinatorIds.push(coordinator._id);
      await college.save();
      console.log("Coordinator created.");
    }

    // 4. Create 5 Students
    const branches = ["CSE", "ECE", "MECH"];
    for (let i = 1; i <= 5; i++) {
      const email = `student${i}@anurag.edu.in`;
      const exists = await User.findOne({ email });
      if (!exists) {
        await User.create({
          name: `Student ${i}`,
          email,
          passwordHash: defaultPassword,
          role: "student",
          collegeId: college._id,
          branch: branches[i % 3],
          year: 4,
          cgpa: 7.5 + (i * 0.2),
          backlogs: 0
        });
      }
    }
    console.log("5 Students created.");

    // 5. Create 3 Job Listings
    const jobData = [
      { title: "Software Engineer", company: "TechCorp", ctc: "12 LPA", location: "Bangalore" },
      { title: "Data Analyst", company: "DataViz", ctc: "8 LPA", location: "Remote" },
      { title: "System Architect", company: "CloudScale", ctc: "18 LPA", location: "Hyderabad" }
    ];

    for (const data of jobData) {
      const exists = await Job.findOne({ title: data.title, company: data.company, collegeId: college._id });
      if (!exists) {
        await Job.create({
          ...data,
          collegeId: college._id,
          postedBy: coordinator._id,
          description: `Exciting opportunity at ${data.company} for ${data.title} role.`,
          status: "active",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          eligibility: {
            branches: ["CSE", "ECE"],
            minCgpa: 7.0,
            maxBacklogs: 0,
            batchYears: [4]
          }
        });
      }
    }
    console.log("3 Job listings created.");

    // 6. Create Placement Cycle
    const cycleExists = await PlacementCycle.findOne({ collegeId: college._id, academicYear: "2025-26" });
    if (!cycleExists) {
      await PlacementCycle.create({
        collegeId: college._id,
        academicYear: "2025-26",
        startDate: new Date("2025-06-01"),
        status: "active"
      });
      console.log("Placement cycle created.");
    }

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seed();
