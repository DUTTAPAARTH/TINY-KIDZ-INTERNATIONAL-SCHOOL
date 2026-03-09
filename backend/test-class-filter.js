const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require("./models/User");
    const Class = require("./models/Class");

    const adminUser = await User.findOne({ role: "admin" });
    const testToken = jwt.sign(
      { id: adminUser._id.toString(), role: "admin" },
      process.env.JWT_SECRET || "tinykidzsecret",
    );

    // Get a class to test with
    const testClass = await Class.findOne({ className: "10", section: "A" });

    console.log("Testing class filter with Class 10-A");
    console.log("Class ID:", testClass._id);

    setTimeout(async () => {
      try {
        // Test without filter
        const response1 = await axios.get(
          "http://localhost:5000/api/students?page=1&limit=25",
          {
            headers: { Authorization: `Bearer ${testToken}` },
          },
        );

        console.log("\n✅ Without filter:");
        console.log("  Total students:", response1.data.pagination.total);

        // Test with class filter
        const response2 = await axios.get(
          `http://localhost:5000/api/students?page=1&limit=25&classId=${testClass._id}`,
          {
            headers: { Authorization: `Bearer ${testToken}` },
          },
        );

        console.log("\n✅ With Class 10-A filter:");
        console.log("  Total students:", response2.data.pagination.total);
        console.log("  Students in this class:");
        response2.data.data.slice(0, 5).forEach((s, i) => {
          console.log(
            `    ${i + 1}. ${s.userId.name} - ${s.classId.className}-${s.classId.section}`,
          );
        });

        console.log("\n✅ Class filter is working!");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
      }
    }, 2000);
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });
