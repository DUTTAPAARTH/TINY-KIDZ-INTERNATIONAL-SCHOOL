const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/Student");
const Marks = require("./models/Marks");

const CSV_PATH = path.join(
  __dirname,
  "demo-data",
  "student_performance_updated_1000.csv",
);
const BATCH_SIZE = 200;

const getHeaderIndex = (headers, possibleNames) => {
  const normalizedHeaders = headers.map((h) =>
    h.replace(/\s+/g, "").toLowerCase(),
  );
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(
      name.replace(/\s+/g, "").toLowerCase(),
    );
    if (index !== -1) {
      return index;
    }
  }
  return -1;
};

const randomMark = () => Math.floor(Math.random() * 31) + 65;

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

const clampMarks = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(0, Math.min(100, parsed));
};

const randomFromArray = (items) =>
  items[Math.floor(Math.random() * items.length)];

const seedMarksFull = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV file not found: ${CSV_PATH}`);
    }

    const csvRaw = fs.readFileSync(CSV_PATH, "utf-8").trim();
    const lines = csvRaw.split(/\r?\n/);

    if (lines.length < 2) {
      throw new Error("CSV has no data rows");
    }

    const headers = parseCsvLine(lines[0]);
    const studentIdIndex = getHeaderIndex(headers, ["StudentID"]);
    const previousGradeIndex = getHeaderIndex(headers, [
      "PreviousGrade",
      "Previous Grade",
    ]);
    const finalGradeIndex = getHeaderIndex(headers, [
      "FinalGrade",
      "Final Grade",
    ]);

    if (studentIdIndex === -1) {
      throw new Error("CSV must contain StudentID column");
    }

    const students = await Student.find(
      {},
      { _id: 1, admissionNumber: 1 },
    ).lean();
    const studentMap = new Map(
      students.map((student) => [student.admissionNumber, student._id]),
    );

    const subjects = await mongoose.connection
      .collection("subjects")
      .find({}, { projection: { _id: 1 } })
      .toArray();
    const teachers = await mongoose.connection
      .collection("teachers")
      .find({}, { projection: { _id: 1 } })
      .toArray();

    if (!subjects.length) {
      throw new Error("No subjects found in DB. Seed subjects first.");
    }

    if (!teachers.length) {
      throw new Error("No teachers found in DB. Seed teachers first.");
    }

    const marksDocs = [];

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const studentIdValue = row[studentIdIndex];

      if (!studentIdValue) {
        continue;
      }

      const admissionNumber = `TK${studentIdValue}`;
      const studentObjectId = studentMap.get(admissionNumber);

      if (!studentObjectId) {
        continue;
      }

      const rawPreviousGrade =
        previousGradeIndex !== -1 ? row[previousGradeIndex] : undefined;
      const rawFinalGrade =
        finalGradeIndex !== -1 ? row[finalGradeIndex] : undefined;

      let previousGrade = clampMarks(rawPreviousGrade);
      let finalGrade = clampMarks(rawFinalGrade);

      if (previousGrade === null) {
        previousGrade = randomMark();
      }

      if (finalGrade === null) {
        finalGrade = randomMark();
      }

      marksDocs.push({
        studentId: studentObjectId,
        subjectId: randomFromArray(subjects)._id,
        addedBy: randomFromArray(teachers)._id,
        marksObtained: previousGrade,
        totalMarks: 100,
        examType: "Mid Term",
        academicYear: "2024-25",
        examDate: new Date("2024-10-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      marksDocs.push({
        studentId: studentObjectId,
        subjectId: randomFromArray(subjects)._id,
        addedBy: randomFromArray(teachers)._id,
        marksObtained: finalGrade,
        totalMarks: 100,
        examType: "Final",
        academicYear: "2024-25",
        examDate: new Date("2025-01-20"),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (!marksDocs.length) {
      throw new Error(
        "No marks documents generated. Check CSV and student mapping.",
      );
    }

    for (let i = 0; i < marksDocs.length; i += BATCH_SIZE) {
      const batch = marksDocs.slice(i, i + BATCH_SIZE);
      await Marks.collection.insertMany(batch, { ordered: false });
    }

    console.log("✅ 2000 marks records seeded");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding full marks:", error.message);
    process.exit(1);
  }
};

seedMarksFull();
