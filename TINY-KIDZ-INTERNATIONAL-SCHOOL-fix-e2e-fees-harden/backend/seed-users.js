const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config();

const testUsers = [
  {
    name: "Admin User",
    email: "admin@tinykidz.com",
    password: "admin123",
    role: "admin",
  },
  {
    name: "Teacher User",
    email: "teacher@tinykidz.com",
    password: "teacher123",
    role: "teacher",
  },
  {
    name: "Student User",
    email: "student@tinykidz.com",
    password: "student123",
    role: "student",
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing users (optional - remove if you want to keep existing data)
    await User.deleteMany({});
    console.log("🗑️  Cleared existing users");

    // Create test users
    for (const userData of testUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`✅ Created ${user.role}: ${user.email}`);
    }

    console.log("\n🎉 Database seeded successfully!");
    console.log("\nTest Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    testUsers.forEach((user) => {
      console.log(
        `${user.role.toUpperCase()}: ${user.email} / ${user.password}`,
      );
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedUsers();
