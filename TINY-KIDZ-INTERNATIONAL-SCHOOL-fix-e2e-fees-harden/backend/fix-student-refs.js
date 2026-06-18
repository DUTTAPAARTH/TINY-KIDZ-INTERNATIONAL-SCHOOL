const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");
dotenv.config({ path: path.join(__dirname, ".env") });

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  // Get all classes
  const classes = await db.collection("classes").find().toArray();
  console.log("Classes:", classes.length);
  
  // Get students with broken refs
  const students = await db.collection("students").find().toArray();
  console.log("Students to fix:", students.length);
  
  let fixed = 0;
  for (const student of students) {
    // Create a User document for this student
    const name = student.admissionNumber || "Student";
    const email = `student_${student.admissionNumber.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}@tinykidz.com`;
    
    const hashedPw = await bcrypt.hash("student123", 10);
    const userResult = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPw,
      role: "student",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Assign to first class (or a random one)
    const classId = classes[fixed % classes.length]._id;
    
    // Update the student's userId and classId
    await db.collection("students").updateOne(
      { _id: student._id },
      { $set: { userId: userResult.insertedId, classId } }
    );
    
    fixed++;
  }
  
  console.log("Fixed students:", fixed);
  
  // Verify
  const sample = await db.collection("students").findOne();
  const user = sample.userId ? await db.collection("users").findOne({ _id: sample.userId }) : null;
  const cls = sample.classId ? await db.collection("classes").findOne({ _id: sample.classId }) : null;
  console.log("Sample:", sample.admissionNumber, "User:", !!user, "Class:", cls ? `${cls.className}-${cls.section}` : "null");
  
  await mongoose.disconnect();
})();
