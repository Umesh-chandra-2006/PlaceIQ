require("dotenv").config();
const mongoose = require("mongoose");

const drop = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

drop();
