const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, ".env") });

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  
  // Count before
  const studentCount = await db.collection("students").countDocuments();
  const teacherCount = await db.collection("teachers").countDocuments();
  const userCount = await db.collection("users").countDocuments();
  console.log("BEFORE - Students:", studentCount, "Teachers:", teacherCount, "Users:", userCount);
  
  // Find a sample student to see structure
  const sample = await db.collection("students").findOne();
  console.log("Sample student keys:", Object.keys(sample || {}));
  
  // Delete students that have admissionNumber starting with "TK" (seeded from CSV)
  const delResult = await db.collection("students").deleteMany({ admissionNumber: /^TK/ });
  console.log("Deleted CSV students:", delResult.deletedCount);
  
  // Count after
  const afterCount = await db.collection("students").countDocuments();
  console.log("AFTER - Students:", afterCount);
  
  await mongoose.disconnect();
})();
