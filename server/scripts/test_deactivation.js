const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");

const makeRequest = (options, payload = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body: JSON.parse(data || "{}") });
      });
    });
    req.on("error", (e) => reject(e));
    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
};

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const email = "rahul.kumar@anurag.edu.in";
    const student = await User.findOne({ email });
    if (!student) {
      console.error("Student not found!");
      process.exit(1);
    }

    // Save original status
    const originalIsActive = student.isActive;

    // 1. Set to inactive
    student.isActive = false;
    await student.save();
    console.log("Student deactivated.");

    // 2. Generate a token
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

    // 3. Test API Request with deactivated token
    console.log("Testing API request with deactivated token...");
    const apiRes = await makeRequest({
      hostname: "localhost",
      port: 5001,
      path: "/api/jobs",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    console.log("API Status:", apiRes.statusCode);
    console.log("API Response:", apiRes.body);

    if (apiRes.statusCode !== 401 || !apiRes.body.error?.includes("deactivated")) {
      throw new Error(`Deactivation block failed on API requests! Got status ${apiRes.statusCode}`);
    }
    console.log("SUCCESS: Deactivated token successfully blocked on API.");

    // 4. Test Login with deactivated account
    console.log("Testing Login with deactivated account...");
    const loginRes = await makeRequest({
      hostname: "localhost",
      port: 5001,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    }, {
      email: email,
      password: "student123" // seed default password
    });
    console.log("Login Status:", loginRes.statusCode);
    console.log("Login Response:", loginRes.body);

    if (loginRes.statusCode !== 403 || !loginRes.body.error?.includes("deactivated")) {
      throw new Error(`Deactivation block failed on Login! Got status ${loginRes.statusCode}`);
    }
    console.log("SUCCESS: Deactivated account successfully blocked on Login.");

    // Restore original status
    student.isActive = originalIsActive;
    await student.save();
    console.log("Student status restored to:", originalIsActive);

    console.log("\nALL DEACTIVATION TESTS PASSED!");
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
};

runTest();
