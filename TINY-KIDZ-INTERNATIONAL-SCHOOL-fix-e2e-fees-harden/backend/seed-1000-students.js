const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Student = require("./models/Student");
const Class = require("./models/Class");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

const firstNames = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Sai", "Ananya", "Diya", "Ishaan", 
  "Krishna", "Priya", "Rohan", "Saanvi", "Shaurya", "Anika", "Kavya",
  "Advait", "Ayaan", "Aryan", "Riya", "Myra", "Kiara", "Aadhya", "Sara",
  "Vihaan", "Arnav", "Atharv", "Reyansh", "Ira", "Navya", "Pari",
  "Dhruv", "Karthik", "Lakshmi", "Meera", "Nisha", "Pooja", "Rakesh",
  "Sanjay", "Tanya", "Uma", "Vijay", "Yash", "Zara", "Amit", "Bharat",
  "Chetan", "Deepak", "Esha", "Farhan", "Gaurav", "Harsh", "Indira",
  "Jaya", "Karan", "Lata", "Mohan", "Neha", "Omar", "Pradeep", "Qadir"
];

const lastNames = [
  "Sharma", "Verma", "Kumar", "Singh", "Patel", "Gupta", "Reddy", "Rao",
  "Nair", "Iyer", "Menon", "Joshi", "Desai", "Mehta", "Shah", "Kapoor",
  "Malhotra", "Chopra", "Khanna", "Agarwal", "Bansal", "Goel", "Arora",
  "Sethi", "Bhatia", "Sinha", "Jain", "Bajaj", "Mittal", "Singhal",
  "Ahluwalia", "Bose", "Chatterjee", "Das", "Dutta", "Roy", "Sen",
  "Bhattacharya", "Mukherjee", "Ganguly", "Trivedi", "Pandey", "Mishra"
];

const genders = ["Male", "Female"];
const parentalSupports = ["High", "Medium", "Low"];
const extracurriculars = ["Sports", "Music", "Dance", "Art", "Drama", "Debate", "Robotics", "Chess"];

const generateStudents = async () => {
  try {
    await connectDB();

    // Get all classes
    const classes = await Class.find({});
    if (classes.length === 0) {
      console.error("❌ No classes found. Please seed classes first.");
      process.exit(1);
    }

    console.log(`📚 Found ${classes.length} classes`);

    // Clear ALL existing students and users with student role
    console.log("🗑️  Clearing ALL existing student data...");
    
    // Delete all students first
    const deletedStudents = await Student.deleteMany({});
    console.log(`   Deleted ${deletedStudents.deletedCount} students`);
    
    // Delete all student users
    const deletedUsers = await User.deleteMany({ role: "student" });
    console.log(`   Deleted ${deletedUsers.deletedCount} student users`);
    
    console.log("✅ Cleared all existing students");

    console.log("👥 Creating 1000 students...");
    const studentsToCreate = [];
    const usersToCreate = [];

    for (let i = 1; i <= 1000; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      const email = `student${i}@tinykidz.com`;
      const password = await bcrypt.hash("student123", 10);
      const randomClass = classes[Math.floor(Math.random() * classes.length)];
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const parentalSupport = parentalSupports[Math.floor(Math.random() * parentalSupports.length)];
      const extracurricular = extracurriculars[Math.floor(Math.random() * extracurriculars.length)];

      usersToCreate.push({
        name: fullName,
        email: email,
        password: password,
        role: "student",
        isActive: true,
      });

      studentsToCreate.push({
        admissionNumber: `TK-${String(i).padStart(5, "0")}`,
        gender: gender,
        parentalSupport: parentalSupport,
        extracurricular: extracurricular,
        academicYear: "2024-25",
        classId: randomClass._id,
        isActive: true,
        rollNumber: Math.floor(Math.random() * 50) + 1,
        parentName: `Parent of ${fullName}`,
        parentPhone: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        address: `${Math.floor(Math.random() * 500) + 1}, ${lastName} Street, Mumbai, India`,
        dateOfBirth: new Date(2008 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      });

      if (i % 100 === 0) {
        console.log(`  ⏳ Prepared ${i}/1000 students...`);
      }
    }

    // Insert users in batches
    console.log("💾 Inserting users into database...");
    const insertedUsers = await User.insertMany(usersToCreate);
    console.log(`✅ Created ${insertedUsers.length} student user accounts`);

    // Link students to users
    console.log("🔗 Linking students to user accounts...");
    studentsToCreate.forEach((student, index) => {
      student.userId = insertedUsers[index]._id;
    });

    // Insert students in batches
    console.log("💾 Inserting students into database...");
    const insertedStudents = await Student.insertMany(studentsToCreate);
    console.log(`✅ Created ${insertedStudents.length} students`);

    // Verify the data
    const totalStudents = await Student.countDocuments({});
    const totalStudentUsers = await User.countDocuments({ role: "student" });

    console.log("\n✨ Seeding Complete!");
    console.log(`📊 Total students in database: ${totalStudents}`);
    console.log(`👤 Total student users: ${totalStudentUsers}`);
    console.log(`📚 Classes available: ${classes.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding students:", error);
    process.exit(1);
  }
};

generateStudents();
