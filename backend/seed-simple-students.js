const mongoose = require("mongoose");
require("dotenv").config();

const seedSimpleStudents = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    const Student = require("./models/Student");
    const Class = require("./models/Class");
    const User = require("./models/User");

    // Get existing users to link students to
    const existingUsers = await User.find({}).limit(100);
    const classesData = await Class.find({ isActive: true });

    if (classesData.length === 0) {
      console.error("❌ No classes found!");
      process.exit(1);
    }

    if (existingUsers.length === 0) {
      console.error("❌ No users found!");
      process.exit(1);
    }

    console.log(`📚 Found ${classesData.length} classes`);
    console.log(`👥 Found ${existingUsers.length} users`);

    // Clear students
    await Student.deleteMany({});

    // Create students
    const studentsToInsert = [];
    for (let i = 0; i < 50; i++) {
      studentsToInsert.push({
        userId: existingUsers[i % existingUsers.length]._id,
        admissionNumber: `TK-${String(i + 1).padStart(5, "0")}`,
        gender: i % 2 === 0 ? "Male" : "Female",
        parentalSupport: ["High", "Medium", "Low"][i % 3],
        extracurricular: "Sports, Music, Art"[i % 3],
        academicYear: "2024-25",
        classId: classesData[i % classesData.length]._id,
        isActive: true,
      });
    }

    const result = await Student.insertMany(studentsToInsert);
    console.log(`\n✅ Created ${result.length} students`);

    // Verify
    const count = await Student.countDocuments({});
    console.log(`📊 Total students: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

seedSimpleStudents();
