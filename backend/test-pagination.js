const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    const User = require("./models/User");
    const adminUser = await User.findOne({ role: "admin" });

    if (!adminUser) {
      console.error("No admin user found");
      process.exit(1);
    }

    const testToken = jwt.sign(
      { id: adminUser._id.toString(), role: "admin" },
      process.env.JWT_SECRET || "tinykidzsecret",
    );

    // Wait a bit for server to be ready
    setTimeout(async () => {
      try {
        // Test first page
        const response1 = await axios.get(
          "http://localhost:5000/api/students?page=1&limit=25",
          {
            headers: { Authorization: `Bearer ${testToken}` },
          },
        );

        console.log("Page 1 Response:");
        console.log("  Status:", response1.status);
        console.log("  Students returned:", response1.data.data.length);
        console.log("  Total in DB:", response1.data.pagination.total);
        console.log("  Total pages:", response1.data.pagination.pages);
        console.log("  Current page:", response1.data.pagination.page);

        // Test second page
        const response2 = await axios.get(
          "http://localhost:5000/api/students?page=2&limit=25",
          {
            headers: { Authorization: `Bearer ${testToken}` },
          },
        );

        console.log("\nPage 2 Response:");
        console.log("  Status:", response2.status);
        console.log("  Students returned:", response2.data.data.length);
        console.log("  Current page:", response2.data.pagination.page);

        console.log("\n✅ API is working correctly with pagination!");
        process.exit(0);
      } catch (error) {
        console.error("❌ API Error:", error.message);
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
        }
        process.exit(1);
      }
    }, 2000);
  })
  .catch((err) => {
    console.error("❌ DB Error:", err.message);
    process.exit(1);
  });
