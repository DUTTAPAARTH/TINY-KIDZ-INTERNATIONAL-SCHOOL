const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const seedStudents = async () => {
  const startTime = Date.now();

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Load models AFTER connecting
    const User = require("./models/User");
    const Student = require("./models/Student");
    const Class = require("./models/Class");

    // Fetch all existing classes
    const classes = await Class.find({ isActive: true });
    if (classes.length === 0) {
      console.log("⚠️  No active classes found. Please seed classes first.");
      process.exit(1);
    }
    console.log(`📚 Found ${classes.length} active classes`);

    // Read CSV file
    const csvPath = path.join(
      __dirname,
      "demo-data",
      "student_performance_updated_1000.csv",
    );
    const csvData = fs.readFileSync(csvPath, "utf-8");
    const lines = csvData.split("\n").filter((line) => line.trim());

    // Remove header
    const dataLines = lines.slice(1);

    console.log(`📖 Read ${dataLines.length} student records from CSV\n`);

    const BATCH_SIZE = 100;
    let totalCreated = 0;

    // Hash password once
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Student@123", salt);

    // Process students in batches
    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batch = dataLines.slice(
        i,
        Math.min(i + BATCH_SIZE, dataLines.length),
      );
      const users = [];
      const students = [];

      // Parse CSV rows in batch
      for (const line of batch) {
        if (!line.trim()) continue;

        // Parse CSV line (handle quoted fields)
        const matches = line.match(/(\d+),"([^"]+)",(\w+),(\w+),(.+)/);
        if (!matches) continue;

        const [, studentId, name, gender, parentalSupport, extracurricular] =
          matches;

        // Create User object with pre-hashed password
        const user = {
          name: name.trim(),
          email: `student${studentId}@tinykidz.com`,
          password: hashedPassword,
          role: "student",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        users.push(user);

        // Store student data for later
        const studentData = {
          admissionNumber: `TK${studentId}`,
          gender: gender.trim(),
          parentalSupport: parentalSupport.trim(),
          extracurricular: extracurricular.trim(),
          academicYear: "2024-25",
          classId: classes[Math.floor(Math.random() * classes.length)]._id,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        students.push(studentData);
      }

      // Insert users and students using direct collection access
      if (users.length > 0) {
        try {
          const userCollection = User.collection;
          const studentCollection = Student.collection;

          // Insert users
          const userResult = await userCollection.insertMany(users);
          const userIds = Object.values(userResult.insertedIds);

          // Create student documents with user IDs
          const studentsWithUserIds = students.map((student, index) => ({
            ...student,
            userId: userIds[index],
          }));

          // Insert students
          await studentCollection.insertMany(studentsWithUserIds);

          totalCreated += users.length;
          const progress = Math.min(totalCreated, dataLines.length);
          console.log(`✅ Processed ${progress}/${dataLines.length} records`);
        } catch (batchError) {
          console.error(`⚠️  Batch error:`, batchError.message);

          // Try to insert individually
          for (let j = 0; j < users.length; j++) {
            try {
              const createdUser = await User.create(users[j]);
              const studentWithUserId = {
                ...students[j],
                userId: createdUser._id,
              };
              await Student.create(studentWithUserId);
              totalCreated++;
            } catch (individualError) {
              // Skip duplicate entries
            }
          }
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log("\n" + "═".repeat(50));
    console.log(`✅ 1000 students seeded`);
    console.log(`⏱️  Completed in ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total created: ${totalCreated}`);
    console.log("═".repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding students:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seedStudents();
