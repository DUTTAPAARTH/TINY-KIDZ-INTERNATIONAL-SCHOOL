const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    try {
      const User = require("./models/User");
      const adminUser = await User.findOne({ role: "admin" });

      if (!adminUser) {
        console.error("❌ No admin user found");
        process.exit(1);
      }

      console.log("✓ Found admin user:", adminUser._id);

      const testToken = jwt.sign(
        { id: adminUser._id.toString(), role: "admin" },
        process.env.JWT_SECRET || "tinykidzsecret",
      );

      console.log("✓ Test token created");

      // Wait for backend to be ready
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Make the API request
      try {
        const response = await axios.get(
          "http://localhost:5000/api/students?page=1&limit=10&search=",
          {
            headers: { Authorization: `Bearer ${testToken}` },
          },
        );
        console.log("✓ Success!");
        console.log(JSON.stringify(response.data, null, 2));
        process.exit(0);
      } catch (error) {
        console.error("❌ API Error:");
        console.error("Status:", error.response?.status);
        console.error("Message:", error.response?.data?.message);
        console.error("Data:", JSON.stringify(error.response?.data, null, 2));
        console.error("\nFull error:", error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error("❌ Error:", error.message);
      console.error(error.stack);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("❌ DB Connection error:", err.message);
    process.exit(1);
  });
