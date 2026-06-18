require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const User = require("./models/User");
const Student = require("./models/Student");
const ClassModel = require("./models/Class");

const ACADEMIC_YEAR = "2025-26";
const DEFAULT_PASSWORD = "TinyKidz@123";
const DATA_FOLDER =
  "C:\\Users\\PAARTH DUTTA\\Downloads\\TINY-KIDZ-INTERNATIONAL-SCHOOL-fix-e2e-fees-harden\\TINY-KIDZ-INTERNATIONAL-SCHOOL-fix-e2e-fees-harden\\school data\\";

const classMap = {
  Nursery: "Nursery",
  LKG: "LKG",
  "L.K.G": "LKG",
  UKG: "UKG",
  "U.K.G": "UKG",
  "1st": "Class 1",
  "1": "Class 1",
  I: "Class 1",
  "2nd": "Class 2",
  "2": "Class 2",
  II: "Class 2",
  "3rd": "Class 3",
  "3": "Class 3",
  III: "Class 3",
  "4th": "Class 4",
  "4": "Class 4",
  IV: "Class 4",
  "5th": "Class 5",
  "5": "Class 5",
  V: "Class 5",
  "6th": "Class 6",
  "6": "Class 6",
  VI: "Class 6",
  "7th": "Class 7",
  "7": "Class 7",
  VII: "Class 7",
  "8th": "Class 8",
  "8": "Class 8",
  VIII: "Class 8",
};

const normalizeAdmissionNumber = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const normalizeAdmissionKey = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

const cleanForEmail = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const buildUniqueStudentEmail = async (baseLocalPart, fallbackIndex) => {
  const safeBase = cleanForEmail(baseLocalPart) || `student${fallbackIndex + 1}`;
  let attempt = 0;

  while (attempt < 20) {
    const suffix = attempt === 0 ? "" : String(attempt + 1);
    const email = `${safeBase}${suffix}@tinykidz.com`;
    const exists = await User.findOne({ email }).select("_id").lean();
    if (!exists) return email;
    attempt += 1;
  }

  return `${safeBase}${Date.now()}@tinykidz.com`;
};

const normalizeSection = (value) => {
  const section = String(value || "A").trim().toUpperCase();
  return section || "A";
};

const normalizeGender = (value) => {
  const g = String(value || "").trim().toLowerCase();
  if (g.startsWith("m")) return "Male";
  if (g.startsWith("f")) return "Female";
  return "Other";
};

const normalizeClassName = (value) => {
  const raw = String(value || "").trim();
  if (classMap[raw]) return classMap[raw];
  return raw;
};

const keyify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getValue = (row, candidateKeys) => {
  const entries = Object.entries(row || {});
  for (const key of candidateKeys) {
    const wanted = keyify(key);
    const found = entries.find(([k]) => keyify(k) === wanted);
    if (found && found[1] !== undefined && found[1] !== null && String(found[1]).trim() !== "") {
      return found[1];
    }
  }
  return "";
};

const toStudentShape = (raw) => {
  const admissionNumber = normalizeAdmissionNumber(
    getValue(raw, ["admissionNumber", "admissionNo", "admNo", "admission no", "admission number"]),
  );

  return {
    name: String(getValue(raw, ["name", "studentName", "student name"]) || "").trim(),
    fatherName: String(getValue(raw, ["fatherName", "father name", "parentName", "parent name"]) || "").trim(),
    motherName: String(getValue(raw, ["motherName", "mother name"]) || "").trim(),
    gender: normalizeGender(getValue(raw, ["gender", "sex"])),
    className: normalizeClassName(getValue(raw, ["className", "class", "grade"])),
    section: normalizeSection(getValue(raw, ["section", "sec"])),
    admissionNumber,
    contactNo: String(getValue(raw, ["contactNo", "contact", "phone", "mobile"]) || "").trim(),
    email: String(getValue(raw, ["email", "mail"]) || "").trim(),
  };
};

function readStudentsFromJson(dataFolder) {
  const jsonFiles = fs.readdirSync(dataFolder).filter((f) => f.toLowerCase().endsWith(".json"));
  const rows = [];

  for (const file of jsonFiles) {
    const fullPath = path.join(dataFolder, file);
    const raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    if (Array.isArray(raw)) {
      rows.push(...raw);
    } else if (Array.isArray(raw.students)) {
      rows.push(...raw.students);
    }
  }

  return { rows, jsonFiles };
}

function readStudentsFromXls(dataFolder) {
  const xlsFiles = fs
    .readdirSync(dataFolder)
    .filter((f) => /\.(xls|xlsx)$/i.test(f));

  const rows = [];
  for (const file of xlsFiles) {
    const workbook = XLSX.readFile(path.join(dataFolder, file));

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (raw.length < 2) continue;

      let headerRowIndex = -1;
      let headers = [];
      for (let i = 0; i < Math.min(raw.length, 20); i += 1) {
        const rowArr = raw[i] || [];
        const foundName = rowArr.some((c) => /^name$/i.test(String(c).trim()));
        if (foundName) {
          headerRowIndex = i;
          headers = rowArr.map((h) => String(h).trim());
          break;
        }
      }

      if (headerRowIndex === -1) continue;

      for (let i = headerRowIndex + 1; i < raw.length; i += 1) {
        const rowArr = raw[i];
        if (!rowArr || rowArr.every((c) => String(c).trim() === "")) continue;

        const row = {};
        for (let c = 0; c < headers.length; c += 1) {
          row[headers[c]] = rowArr[c] !== undefined ? rowArr[c] : "";
        }
        rows.push(row);
      }
    }
  }

  return { rows, xlsFiles };
}

async function seedStudents() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Missing MONGODB_URI/MONGO_URI in environment");
  }

  await mongoose.connect(mongoUri);

  const { rows: jsonRows, jsonFiles } = readStudentsFromJson(DATA_FOLDER);
  const { rows: xlsRows, xlsFiles } = readStudentsFromXls(DATA_FOLDER);

  console.log("JSON files:", jsonFiles);
  console.log("XLS files:", xlsFiles);
  console.log("Total students from JSON files:", jsonRows.length);
  console.log("Total raw rows from XLS files:", xlsRows.length);

  const allStudentsRaw = [...jsonRows, ...xlsRows].map(toStudentShape);

  const dedupMap = new Map();
  for (const student of allStudentsRaw) {
    if (!student.admissionNumber || !student.name || !student.className) continue;
    const admissionKey = normalizeAdmissionKey(student.admissionNumber);
    if (!dedupMap.has(admissionKey)) {
      dedupMap.set(admissionKey, student);
    }
  }

  const allStudents = Array.from(dedupMap.values());
  console.log("Total students after combine + dedup:", allStudents.length);

  await Student.deleteMany({});
  await ClassModel.updateMany({}, { $set: { students: [] } });

  const classes = await ClassModel.find({ academicYear: ACADEMIC_YEAR })
    .select("_id className section students")
    .lean();

  const classMapByKey = new Map(
    classes.map((c) => [`${c.className}|${c.section}`, c]),
  );

  const existingStudents = await Student.find({}).select("admissionNumber").lean();
  const existingAdmission = new Set(existingStudents.map((s) => normalizeAdmissionKey(s.admissionNumber)));

  const usersToCreate = [];
  const studentsToCreate = [];
  let skipped = 0;

  for (let i = 0; i < allStudents.length; i += 1) {
    const row = allStudents[i];

    if (existingAdmission.has(normalizeAdmissionKey(row.admissionNumber))) {
      skipped += 1;
      continue;
    }

    const classKey = `${row.className}|${row.section}`;
    let classDoc = classMapByKey.get(classKey);
    if (!classDoc) classDoc = classMapByKey.get(`${row.className}|A`);
    if (!classDoc) {
      skipped += 1;
      continue;
    }

    const email = await buildUniqueStudentEmail(row.admissionNumber, i);
    usersToCreate.push({
      name: row.name,
      email,
      password: DEFAULT_PASSWORD,
      role: "student",
    });
    studentsToCreate.push({
      admissionNumber: row.admissionNumber,
      gender: row.gender,
      academicYear: ACADEMIC_YEAR,
      classId: classDoc._id,
      isActive: true,
    });
    existingAdmission.add(normalizeAdmissionKey(row.admissionNumber));
  }

  const insertedUsers = await User.insertMany(usersToCreate, { ordered: false });
  const userIds = insertedUsers.map((user) => user._id);

  const insertedStudents = await Student.insertMany(
    studentsToCreate.map((student, index) => ({
      userId: userIds[index],
      admissionNumber: student.admissionNumber,
      gender: student.gender,
      academicYear: student.academicYear,
      classId: student.classId,
      isActive: true,
    })),
    { ordered: false },
  );

  await Promise.all(
    insertedStudents.map((student) =>
      ClassModel.updateOne({ _id: student.classId }, { $addToSet: { students: student._id } }),
    ),
  );

  console.log(`Students created: ${insertedStudents.length}`);
  console.log(`Students skipped: ${skipped}`);

  await mongoose.disconnect();
}

seedStudents().catch(async (error) => {
  console.error("seed-real-students failed:", error.message);
  try {
    await mongoose.disconnect();
  } catch (_e) {
    // ignore
  }
  process.exit(1);
});
