/**
 * Database configuration and connection logic using Mongoose.
 * Connects to MongoDB using the URI provided in environment variables.
 */
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database initial connection error: ${error.message}`);
    console.log("Node server will stay alive and attempt reconnection.");
  }
};

module.exports = connectDB;
