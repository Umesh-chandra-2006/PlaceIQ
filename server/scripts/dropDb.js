require("dotenv").config();
const mongoose = require("mongoose");
const readline = require("readline");

if (process.env.NODE_ENV === "production") {
  console.error("CRITICAL WARNING: You cannot drop the database in a production environment!");
  process.exit(1);
}

const askConfirmation = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      "WARNING: This will drop the database at: " +
        process.env.MONGODB_URI +
        "\nAre you absolutely sure? Type 'DROP' to confirm: ",
      (answer) => {
        rl.close();
        resolve(answer.trim() === "DROP");
      }
    );
  });
};

const drop = async () => {
  try {
    const confirmed = await askConfirmation();
    if (!confirmed) {
      console.log("Database drop aborted.");
      process.exit(0);
    }

    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGODB_URI);
    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error dropping database:", err);
    process.exit(1);
  }
};

drop();
