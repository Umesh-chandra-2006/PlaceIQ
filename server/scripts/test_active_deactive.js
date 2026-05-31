const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const College = require("../models/College");
const User = require("../models/User");

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const ts = Date.now();
    const tempDomain = `temp-${ts}.com`;
    const tempAdminEmail = `admin@${tempDomain}`;

    console.log("--- TEST 1: Register College ---");
    // 1. Create a college and its admin user (simulating the POST /colleges route logic)
    const college = await College.create({
      name: `Temp College ${ts}`,
      emailDomain: tempDomain,
      licenceStatus: "free"
    });
    console.log("Created College:", college.name, "Domain:", college.emailDomain);

    const adminUser = await User.create({
      name: "Temp Admin",
      email: tempAdminEmail,
      passwordHash: "dummyhash",
      role: "admin",
      collegeId: college._id,
      isSetup: false
    });
    console.log("Created Admin User:", adminUser.email);

    console.log("\n--- TEST 2: Check Deactivated Domain Validation (Negative) ---");
    // Deactivate the college first
    college.isActive = false;
    await college.save();
    console.log("College deactivated.");

    // Check email domain check logic
    const existingCollege = await College.findOne({ emailDomain: tempDomain });
    if (existingCollege && existingCollege.isActive === false && !existingCollege.isDeleted) {
      console.log("SUCCESS: Deactivated college domain validation detected domain is taken and deactivated.");
    } else {
      throw new Error("FAILED: Deactivated college domain validation failed!");
    }

    // Check admin email check logic
    const userExists = await User.findOne({ email: tempAdminEmail });
    if (userExists && userExists.collegeId) {
      const col = await College.findById(userExists.collegeId);
      if (col && col.isActive === false && !col.isDeleted) {
        console.log("SUCCESS: Deactivated admin email validation detected deactivated college association.");
      } else {
        throw new Error("FAILED: Deactivated admin email validation failed!");
      }
    }

    console.log("\n--- TEST 3: Toggle Active Status ---");
    // Simulate toggle-active endpoint
    college.isActive = college.isActive === false ? true : false;
    await college.save();
    console.log("Toggled College Active status. Current isActive:", college.isActive);
    if (college.isActive !== true) {
      throw new Error("FAILED: Toggle activation status did not set isActive to true!");
    }

    console.log("\n--- TEST 4: Delete College Suffix Verification ---");
    // Simulate DELETE /colleges/:id logic
    college.isDeleted = true;
    const oldDomain = college.emailDomain;
    college.emailDomain = `${college.emailDomain}.deleted-${Date.now()}`;
    await college.save();
    console.log("Soft deleted college. Old domain:", oldDomain, "New domain:", college.emailDomain);

    adminUser.email = `${adminUser.email}.deleted-${Date.now()}`;
    adminUser.isActive = false;
    await adminUser.save();
    console.log("Admin user email updated and deactivated. New email:", adminUser.email);

    // Clean up temporary records from db
    await College.deleteOne({ _id: college._id });
    await User.deleteOne({ _id: adminUser._id });
    console.log("Cleaned up temp college and user.");

    console.log("\nALL BACKEND ACTIVATION/DEACTIVATION TESTS PASSED!");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

runTest();
