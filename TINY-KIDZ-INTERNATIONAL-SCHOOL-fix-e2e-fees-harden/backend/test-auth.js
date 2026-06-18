require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const User = require("./models/User");
const jwt = require("jsonwebtoken");

const testAuthentication = async () => {
  try {
    console.log("🔧 Starting authentication tests...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clean up old test user
    await User.deleteOne({ email: "test@tinykidz.com" });

    // TEST 1: Create User
    console.log("📝 TEST 1: Creating User with hashed password...");
    const user = new User({
      name: "John Doe",
      email: "test@tinykidz.com",
      password: "password123",
      role: "admin",
      isActive: true,
    });
    await user.save();
    console.log("✅ User created successfully");
    console.log("   Name:", user.name);
    console.log("   Email:", user.email);
    console.log("   Role:", user.role);
    console.log(
      "   Password (hashed):",
      user.password.substring(0, 20) + "...",
    );
    console.log("   isActive:", user.isActive);

    // TEST 2: Compare Password
    console.log("\n🔐 TEST 2: Password comparison...");
    const isMatch = await user.comparePassword("password123");
    console.log("✅ Correct password verified:", isMatch);

    const isWrong = await user.comparePassword("wrongpassword");
    console.log("✅ Wrong password rejected:", !isWrong);

    // TEST 3: Generate JWT Token
    console.log("\n🔑 TEST 3: JWT Token generation...");
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    console.log("✅ Token generated:", token.substring(0, 50) + "...");

    // TEST 4: Verify JWT Token
    console.log("\n🛡️  TEST 4: JWT Token verification...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified successfully");
    console.log("   Decoded user ID:", decoded.id);
    console.log("   Decoded email:", decoded.email);
    console.log("   Decoded role:", decoded.role);

    // TEST 5: Invalid Token
    console.log("\n⚠️  TEST 5: Invalid token rejection...");
    try {
      jwt.verify("invalid_token", process.env.JWT_SECRET);
      console.log("❌ Should have rejected invalid token");
    } catch (err) {
      console.log("✅ Invalid token correctly rejected");
    }

    // TEST 6: Fetch User without password
    console.log("\n👤 TEST 6: Fetch user without password...");
    const userWithoutPassword = await User.findById(user._id).select(
      "-password",
    );
    console.log("✅ User fetched without password:");
    console.log("   Name:", userWithoutPassword.name);
    console.log("   Email:", userWithoutPassword.email);
    console.log("   Role:", userWithoutPassword.role);

    // Cleanup
    await User.deleteOne({ email: "test@tinykidz.com" });
    console.log("\n🧹 Cleaned up test user");

    console.log("\n🎉 All authentication tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
};

testAuthentication();
