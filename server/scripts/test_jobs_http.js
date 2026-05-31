const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const http = require("http");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");

const testHttp = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const coord = await User.findOne({ email: "umesh@anurag.edu.in" });
    if (!coord) {
      console.log("Coordinator not found!");
      process.exit(1);
    }

    const token = jwt.sign({ id: coord._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    console.log("Generated Token:", token);

    // Call http://localhost:5001/api/jobs
    const options = {
      hostname: "localhost",
      port: 5001,
      path: "/api/jobs",
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log("Status Code:", res.statusCode);
        console.log("Response Body:", data);
        process.exit(0);
      });
    });

    req.on("error", (e) => {
      console.error(`Request error: ${e.message}`);
      process.exit(1);
    });

    req.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testHttp();
