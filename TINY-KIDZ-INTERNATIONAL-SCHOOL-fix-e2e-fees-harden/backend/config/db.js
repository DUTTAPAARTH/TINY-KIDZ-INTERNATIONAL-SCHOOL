// Create a MongoDB connection using mongoose.
// Requirements:
// - read MONGO_URI from .env
// - create async connectDB function
// - log success when connected
// - exit process if connection fails

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
