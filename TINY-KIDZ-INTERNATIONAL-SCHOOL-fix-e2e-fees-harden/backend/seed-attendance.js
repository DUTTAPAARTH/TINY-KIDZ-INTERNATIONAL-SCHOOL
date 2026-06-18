const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const Student = require("./models/Student");

const CSV_PATH = path.join(
  __dirname,
  "demo-data",
  "student_performance_updated_1000.csv",
);
const TOTAL_SCHOOL_DAYS = 30;

const getHeaderIndex = (headers, possibleNames) => {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(name.trim().toLowerCase());
    if (index !== -1) {
      return index;
    }
  }
  return -1;
};

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

const getLastSchoolDays = (count) => {
  const days = [];
  const cursor = new Date();

  while (days.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return days.reverse();
};

const getStatusForDay = (attendanceRate) => {
  const random = Math.random();

  if (random < attendanceRate) {
    const lateChance = Math.random();
    return lateChance < 0.05 ? "Late" : "Present";
  }

  return "Absent";
};

const seedAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV not found at ${CSV_PATH}`);
    }

    const csvRaw = fs.readFileSync(CSV_PATH, "utf-8").trim();
    const lines = csvRaw.split(/\r?\n/);

    if (lines.length < 2) {
      throw new Error("CSV has no data rows");
    }

    const headers = parseCsvLine(lines[0]);
    const studentIdIndex = getHeaderIndex(headers, ["StudentID"]);
    const attendancePercentIndex = getHeaderIndex(headers, ["Attendance (%)"]);

    if (studentIdIndex === -1) {
      throw new Error("CSV must include StudentID column");
    }

    if (attendancePercentIndex === -1) {
      console.log(
        "⚠️ Attendance (%) column missing, defaulting to 0.85 for all students",
      );
    }

    const students = await Student.find(
      {},
      { _id: 1, admissionNumber: 1, classId: 1 },
    ).lean();
    const studentByAdmission = new Map(
      students.map((student) => [student.admissionNumber, student]),
    );

    const last30SchoolDays = getLastSchoolDays(TOTAL_SCHOOL_DAYS);
    const groupedByClassDate = new Map();

    for (let i = 1; i < lines.length; i++) {
      const row = parseCsvLine(lines[i]);
      const rawStudentId = row[studentIdIndex];

      if (!rawStudentId) {
        continue;
      }

      const admissionNumber = `TK${rawStudentId}`;
      const studentDoc = studentByAdmission.get(admissionNumber);

      if (!studentDoc || !studentDoc.classId) {
        continue;
      }

      let attendanceRate = 0.85;
      if (attendancePercentIndex !== -1) {
        const parsedPercent = Number(row[attendancePercentIndex]);
        if (!Number.isNaN(parsedPercent)) {
          attendanceRate = Math.min(1, Math.max(0, parsedPercent / 100));
        }
      }

      for (const schoolDay of last30SchoolDays) {
        const normalizedDate = new Date(
          schoolDay.getFullYear(),
          schoolDay.getMonth(),
          schoolDay.getDate(),
        );

        const key = `${studentDoc.classId.toString()}|${normalizedDate.toISOString()}`;
        const status = getStatusForDay(attendanceRate);

        if (!groupedByClassDate.has(key)) {
          groupedByClassDate.set(key, {
            classId: studentDoc.classId,
            date: normalizedDate,
            records: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        groupedByClassDate.get(key).records.push({
          studentId: studentDoc._id,
          status,
        });
      }
    }

    const attendanceDocs = Array.from(groupedByClassDate.values());

    if (attendanceDocs.length === 0) {
      throw new Error(
        "No attendance documents generated. Check Student data and CSV mapping.",
      );
    }

    await mongoose.connection
      .collection("attendances")
      .insertMany(attendanceDocs);

    console.log("✅ Attendance seeded for 30 days");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding attendance:", error.message);
    process.exit(1);
  }
};

seedAttendance();
