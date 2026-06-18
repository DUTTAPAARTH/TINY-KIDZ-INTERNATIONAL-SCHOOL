require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./models/User");
const axios = require("axios");

const API_URL = "http://localhost:5000";

const testAPI = async () => {
  try {
    console.log("🔧 Testing API Endpoints...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Create test user
    console.log("📝 Creating test user...");
    const testUser = new User({
      name: "Admin User",
      email: "admin@tinykidz.com",
      password: "admin123",
      role: "admin",
    });
    await testUser.save();
    console.log("✅ Test user created\n");

    // TEST 1: POST /api/auth/login
    console.log("🔐 TEST 1: POST /api/auth/login");
    console.log(
      'Request: { email: "admin@tinykidz.com", password: "admin123" }',
    );
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: "admin@tinykidz.com",
      password: "admin123",
    });

    console.log("✅ Login successful!");
    console.log("Response:");
    console.log("  Success:", loginRes.data.success);
    console.log("  Token:", loginRes.data.token.substring(0, 50) + "...");
    console.log("  User:", loginRes.data.user);

    const token = loginRes.data.token;

    // TEST 2: GET /api/auth/me with token
    console.log("\n🛡️  TEST 2: GET /api/auth/me (Protected Route)");
    console.log(
      "Request Header: Authorization: Bearer " + token.substring(0, 30) + "...",
    );
    const meRes = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("✅ Protected route works!");
    console.log("Response:");
    console.log("  Success:", meRes.data.success);
    console.log("  User:", meRes.data.user);

    // TEST 3: Invalid token
    console.log("\n⚠️  TEST 3: GET /api/auth/me with invalid token");
    try {
      await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: "Bearer invalid_token_12345",
        },
      });
      console.log("❌ Should have been rejected");
    } catch (error) {
      console.log("✅ Correctly rejected invalid token");
      console.log("Status:", error.response.status);
      console.log("Message:", error.response.data.message);
    }

    // TEST 4: Missing token
    console.log("\n⚠️  TEST 4: GET /api/auth/me without token");
    try {
      await axios.get(`${API_URL}/api/auth/me`);
      console.log("❌ Should have been rejected");
    } catch (error) {
      console.log("✅ Correctly rejected missing token");
      console.log("Status:", error.response.status);
      console.log("Message:", error.response.data.message);
    }

    // TEST 5: Wrong password
    console.log("\n❌ TEST 5: POST /api/auth/login with wrong password");
    try {
      await axios.post(`${API_URL}/api/auth/login`, {
        email: "admin@tinykidz.com",
        password: "wrongpassword",
      });
      console.log("❌ Should have been rejected");
    } catch (error) {
      console.log("✅ Correctly rejected wrong password");
      console.log("Status:", error.response.status);
      console.log("Message:", error.response.data.message);
    }

    // Cleanup
    await User.deleteOne({ email: "admin@tinykidz.com" });
    console.log("\n🧹 Cleaned up test user");

    console.log("\n🎉 All API tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ API Test failed:", error.message);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    process.exit(1);
  }
};

testAPI();
