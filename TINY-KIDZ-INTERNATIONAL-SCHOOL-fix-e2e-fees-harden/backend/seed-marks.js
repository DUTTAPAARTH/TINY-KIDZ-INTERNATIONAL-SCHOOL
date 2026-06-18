const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Marks = require("./models/Marks");

const seedMarks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Read CSV file
    const csvPath = path.join(__dirname, "student_database.csv");
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    console.log(`📄 CSV file loaded: ${csvPath}`);

    // Parse CSV manually
    const lines = fileContent.split("\n").filter((line) => line.trim());
    const header = lines[0].split(",");
    console.log(`📊 Found ${lines.length - 1} data rows (excluding header)`);

    // Map header to indices
    const headerMap = {};
    header.forEach((col, index) => {
      headerMap[col.trim()] = index;
    });

    // Parse data rows
    const marksData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((val) => val.trim());

      // Skip empty rows
      if (values.filter((v) => v).length === 0) continue;

      const row = {
        MarkID: values[headerMap["MarkID"]],
        StudentID: values[headerMap["StudentID"]],
        SubjectID: values[headerMap["SubjectID"]],
        TeacherID: values[headerMap["TeacherID"]],
        MarkObtained: values[headerMap["MarkObtained"]],
        ExamDate: values[headerMap["ExamDate"]],
      };

      // Create marks object - use placeholder ObjectIds for now
      // In production, you'd map StudentID, SubjectID, TeacherID to actual MongoDB IDs
      const markRecord = {
        studentId: new mongoose.Types.ObjectId(),
        subjectId: new mongoose.Types.ObjectId(),
        addedBy: new mongoose.Types.ObjectId(),
        marksObtained: parseInt(row.MarkObtained, 10),
        totalMarks: 100,
        examType: "Unit Test",
        academicYear: "2024-25",
        examDate: new Date(row.ExamDate),
      };

      marksData.push(markRecord);
    }

    console.log(`\n📝 Parsed ${marksData.length} marks records`);

    // Insert all marks at once
    if (marksData.length > 0) {
      const insertedMarks = await Marks.insertMany(marksData);
      console.log(
        `\n✅ ${insertedMarks.length} marks inserted successfully into MongoDB`,
      );
      console.log(
        `\n📌 Note: StudentID, SubjectID, and TeacherID are using placeholder ObjectIds.`,
      );
      console.log(
        `   In production, map CSV IDs to actual MongoDB document IDs using a lookup table.`,
      );
    } else {
      console.warn("⚠️  No marks data to insert");
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding marks:", error.message);
    if (error.code === "ENOENT") {
      console.error(
        `\n📌 CSV file not found at: ${path.join(__dirname, "student_database.csv")}`,
      );
      console.error(
        "   Please ensure the student_database.csv file is in the backend folder.",
      );
    }
    process.exit(1);
  }
};

seedMarks();
