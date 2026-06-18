const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require("./models/User");
    const Class = require("./models/Class");
    const Student = require("./models/Student");

    const total = await Student.countDocuments({});
    const totalUsers = await User.countDocuments({ role: "student" });

    console.log("📊 MongoDB Atlas Database Status:");
    console.log("================================");
    console.log("Total Students:", total);
    console.log("Total Student Users:", totalUsers);
    console.log("Database:", "MongoDB Atlas Cloud");
    console.log("================================");

    if (total === 1000) {
      console.log("✅ Confirmed: 1000 students in database");
    } else if (total > 0) {
      console.log(`⚠️  Found ${total} students (expected 1000)`);
    } else {
      console.log("❌ No students found");
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
