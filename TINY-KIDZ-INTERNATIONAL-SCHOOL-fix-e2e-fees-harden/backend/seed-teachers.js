const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Teacher = require("./models/Teacher");
require("dotenv").config();

const TEACHERS_DATA = [
  {
    name: "Priya Sharma",
    email: "priya.sharma@tinykidz.com",
    employeeId: "TCH001",
    phone: "9876543201",
    qualification: "B.Ed",
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@tinykidz.com",
    employeeId: "TCH002",
    phone: "9876543202",
    qualification: "M.Sc",
  },
  {
    name: "Sunita Kaur",
    email: "sunita.kaur@tinykidz.com",
    employeeId: "TCH003",
    phone: "9876543203",
    qualification: "B.Ed",
  },
  {
    name: "Amit Sharma",
    email: "amit.sharma@tinykidz.com",
    employeeId: "TCH004",
    phone: "9876543204",
    qualification: "M.A",
  },
  {
    name: "Neha Gupta",
    email: "neha.gupta@tinykidz.com",
    employeeId: "TCH005",
    phone: "9876543205",
    qualification: "B.Ed",
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@tinykidz.com",
    employeeId: "TCH006",
    phone: "9876543206",
    qualification: "M.Ed",
  },
  {
    name: "Anjali Mehta",
    email: "anjali.mehta@tinykidz.com",
    employeeId: "TCH007",
    phone: "9876543207",
    qualification: "B.Sc",
  },
  {
    name: "Rajesh Kumar",
    email: "rajesh.kumar@tinykidz.com",
    employeeId: "TCH008",
    phone: "9876543208",
    qualification: "M.Ed",
  },
  {
    name: "Pooja Patel",
    email: "pooja.patel@tinykidz.com",
    employeeId: "TCH009",
    phone: "9876543209",
    qualification: "B.Ed",
  },
  {
    name: "Deepak Chauhan",
    email: "deepak.chauhan@tinykidz.com",
    employeeId: "TCH010",
    phone: "9876543210",
    qualification: "M.Sc",
  },
];

const randomFromArray = (items) =>
  items[Math.floor(Math.random() * items.length)];

const seedTeachers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all classes for random assignment
    const classes = await mongoose.connection
      .collection("classes")
      .find({ isActive: true }, { projection: { _id: 1 } })
      .toArray();

    if (classes.length === 0) {
      console.log("⚠️  No active classes found. Please seed classes first.");
      process.exit(1);
    }
    console.log(`📚 Found ${classes.length} active classes`);

    // Check which emails already exist
    const emails = TEACHERS_DATA.map((t) => t.email);
    const existingUsers = await User.find(
      { email: { $in: emails } },
      { email: 1 },
    );
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    let insertedCount = 0;
    let skippedCount = 0;

    // Hash password once
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Teacher@123", salt);

    for (const teacherData of TEACHERS_DATA) {
      // Skip if email already exists
      if (existingEmails.has(teacherData.email)) {
        skippedCount++;
        continue;
      }

      // Assign 2-3 random classes
      const numClasses = 2 + Math.floor(Math.random() * 2); // 2 or 3
      const assignedClassIds = [];
      const usedIndices = new Set();

      for (let i = 0; i < numClasses; i++) {
        let idx;
        do {
          idx = Math.floor(Math.random() * classes.length);
        } while (usedIndices.has(idx));
        usedIndices.add(idx);
        assignedClassIds.push(classes[idx]._id);
      }

      // Create User document directly in collection to bypass pre-save hook
      const userResult = await mongoose.connection
        .collection("users")
        .insertOne({
          name: teacherData.name,
          email: teacherData.email,
          password: hashedPassword, // Pre-hashed
          role: "teacher",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      // Create Teacher document
      await mongoose.connection.collection("teachers").insertOne({
        userId: userResult.insertedId,
        employeeId: teacherData.employeeId,
        phone: teacherData.phone,
        qualification: teacherData.qualification,
        classIds: assignedClassIds,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      insertedCount++;
    }

    console.log("✅ 10 teachers seeded");
    console.log(`🆕 Inserted: ${insertedCount}`);
    console.log(`⏭️ Skipped existing: ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding teachers:", error.message);
    process.exit(1);
  }
};

seedTeachers();
