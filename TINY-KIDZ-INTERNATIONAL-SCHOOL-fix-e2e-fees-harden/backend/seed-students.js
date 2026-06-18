const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Student = require("./models/Student");
require("dotenv").config();

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const seedStudents = async () => {
  const startTime = Date.now();

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const classes = await mongoose.connection
      .collection("classes")
      .find({ isActive: true }, { projection: { _id: 1 } })
      .toArray();

    if (classes.length === 0) {
      console.log("⚠️  No active classes found. Please seed classes first.");
      process.exit(1);
    }
    console.log(`📚 Found ${classes.length} active classes`);

    const csvPath = path.join(
      __dirname,
      "demo-data",
      "student_performance_updated_1000.csv",
    );
    if (!fs.existsSync(csvPath)) {
      console.log(
        "⚠️  CSV file not found at demo-data/student_performance_updated_1000.csv",
      );
      process.exit(1);
    }

    const csvData = fs.readFileSync(csvPath, "utf-8");
    const lines = csvData.split(/\r?\n/).filter((line) => line.trim());

    const headers = parseCsvLine(lines[0]);
    const studentIdIndex = headers.indexOf("StudentID");
    const nameIndex = headers.indexOf("Name");
    const genderIndex = headers.indexOf("Gender");
    const parentalSupportIndex = headers.indexOf("ParentalSupport");
    const extracurricularIndex = headers.indexOf("ExtracurricularActivities");

    if (
      studentIdIndex === -1 ||
      nameIndex === -1 ||
      genderIndex === -1 ||
      parentalSupportIndex === -1 ||
      extracurricularIndex === -1
    ) {
      console.log("⚠️  CSV missing required columns.");
      process.exit(1);
    }

    const dataLines = lines.slice(1);

    console.log(`📖 Read ${dataLines.length} student records from CSV\n`);

    const BATCH_SIZE = 100;
    let inserted = 0;
    let skipped = 0;
    let processed = 0;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Student@123", salt);

    for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
      const batchLines = dataLines.slice(i, i + BATCH_SIZE);
      const batch = batchLines
        .map((line) => parseCsvLine(line))
        .map((row) => ({
          StudentID: row[studentIdIndex],
          Name: row[nameIndex],
          Gender: row[genderIndex],
          ParentalSupport: row[parentalSupportIndex],
          ExtracurricularActivities: row[extracurricularIndex],
        }))
        .filter((student) => student.StudentID && student.Name);

      if (batch.length === 0) {
        continue;
      }

      const batchEmails = batch.map(
        (student) => `student${student.StudentID}@tinykidz.com`,
      );

      const existingUsers = await User.find({ email: { $in: batchEmails } })
        .select("email")
        .lean();
      const existingEmails = new Set(existingUsers.map((user) => user.email));

      const newStudents = batch.filter(
        (student) =>
          !existingEmails.has(`student${student.StudentID}@tinykidz.com`),
      );

      const skippedInBatch = batch.length - newStudents.length;
      skipped += skippedInBatch;
      console.log(`⏭️  Skipped ${skippedInBatch} duplicates in this batch`);

      if (newStudents.length > 0) {
        const usersToInsert = newStudents.map((student) => ({
          name: student.Name.trim(),
          email: `student${student.StudentID}@tinykidz.com`,
          password: hashedPassword,
          role: "student",
          isActive: true,
        }));

        const insertedUsers = await User.collection.insertMany(usersToInsert, {
          ordered: true,
        });
        const userIds = Object.values(insertedUsers.insertedIds);

        const studentsToInsert = newStudents.map((student, index) => ({
          userId: userIds[index],
          admissionNumber: `TK${student.StudentID}`,
          gender: (student.Gender || "Other").trim(),
          parentalSupport: (student.ParentalSupport || "Medium").trim(),
          extracurricular: (student.ExtracurricularActivities || "None").trim(),
          academicYear: "2024-25",
          classId: classes[Math.floor(Math.random() * classes.length)]._id,
          isActive: true,
        }));

        await Student.collection.insertMany(studentsToInsert, {
          ordered: true,
        });
        inserted += newStudents.length;
      }

      processed += batch.length;
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log("\n" + "═".repeat(50));
    console.log(`✅ ${inserted} new students inserted`);
    console.log(`⏭️ ${skipped} duplicates skipped`);
    console.log(`📊 Total processed: ${processed}`);
    console.log(`⏱️  Completed in ${duration.toFixed(2)} seconds`);
    console.log("═".repeat(50));

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding students:", error.message);
    process.exit(1);
  }
};

seedStudents();
