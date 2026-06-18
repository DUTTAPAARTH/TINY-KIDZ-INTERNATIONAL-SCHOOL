const mongoose = require("mongoose");
require("dotenv").config();

const seedTestStudents = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/test",
    );
    console.log("✅ Connected to MongoDB");

    const User = require("./models/User");
    const Student = require("./models/Student");
    const Class = require("./models/Class");

    // Get classes
    const classes = await Class.find({ isActive: true }).limit(10);
    if (classes.length === 0) {
      console.error("❌ No classes found. Seed classes first!");
      process.exit(1);
    }

    // Get or create test student user
    let studentUser = await User.findOne({ email: "student@tinykidz.com" });
    if (!studentUser) {
      console.error("❌ Test student user not found!");
      process.exit(1);
    }

    // Clear existing students
    await Student.deleteMany({});
    console.log("🗑️  Cleared existing students");

    // Create test students
    const testStudents = [];
    for (let i = 1; i <= 50; i++) {
      // Check if user already exists
      let newUser = await User.findOne({
        email: `teststudent${i}@tinykidz.com`,
      });

      // Create only if doesn't exist
      if (!newUser) {
        newUser = await User.create({
          name: `Test Student ${i}`,
          email: `teststudent${i}@tinykidz.com`,
          password: await require("bcryptjs").hash("student123", 10),
          role: "student",
          isActive: true,
        });
      }

      testStudents.push({
        userId: newUser._id,
        admissionNumber: `TK${String(i).padStart(4, "0")}`,
        gender: i % 2 === 0 ? "Female" : "Male",
        parentalSupport: ["High", "Medium", "Low"][
          Math.floor(Math.random() * 3)
        ],
        extracurricular: "Sports",
        academicYear: "2024-25",
        classId: classes[Math.floor(Math.random() * classes.length)]._id,
        isActive: true,
      });
    }

    await Student.insertMany(testStudents);
    console.log(`✅ Created ${testStudents.length} test students`);

    const totalStudents = await Student.countDocuments({});
    console.log(`\n📊 Total students in database: ${totalStudents}`);
    console.log("\n🎉 Seeding complete!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedTestStudents();
