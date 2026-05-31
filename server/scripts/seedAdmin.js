/**
 * Clean & Seed script to reset data for PlaceIQ.
 * Deletes all documents and seeds a single Super Admin.
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const College = require("../models/College");
const Job = require("../models/Job");
const Company = require("../models/Company");
const PlacementCycle = require("../models/PlacementCycle");

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for clean seeding...");

    // Clear all collections
    console.log("Clearing all collections...");
    await College.deleteMany({});
    await User.deleteMany({});
    await Job.deleteMany({});
    await Company.deleteMany({});
    await PlacementCycle.deleteMany({});
    
    try {
      const Application = require("../models/Application");
      await Application.deleteMany({});
    } catch (e) {}

    try {
      const Batch = require("../models/Batch");
      await Batch.deleteMany({});
    } catch (e) {}

    try {
      const AtsScore = require("../models/AtsScore");
      await AtsScore.deleteMany({});
    } catch (e) {}

    console.log("All collections cleared.");

    // Seed Super Admin
    const salt = await bcrypt.genSalt(10);
    const password = process.env.SEED_ADMIN_PASSWORD || "password123";
    const passwordHash = await bcrypt.hash(password, salt);
    const email = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";

    await User.create({
      name: "Super System Admin",
      email: email,
      passwordHash: passwordHash,
      role: "superadmin",
      isSetup: true
    });

    console.log(`Seeding completed. Super Admin account created:`);
    console.log(`- Email: ${email}`);
    console.log(`- Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Clean Seeding Error:", error);
    process.exit(1);
  }
};

seed();
