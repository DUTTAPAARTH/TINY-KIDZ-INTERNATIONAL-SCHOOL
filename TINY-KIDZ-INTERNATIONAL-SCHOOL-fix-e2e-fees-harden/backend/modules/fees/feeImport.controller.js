const multer = require("multer");
const path = require("path");
const { parse } = require("csv-parse/sync");
const FeeRecord = require("../../models/FeeRecord");
const Student = require("../../models/Student");
const Class = require("../../models/Class");
const mongoose = require("mongoose");

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === ".csv" || ext === ".xlsx" || ext === ".xls") {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are supported"), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file");

const importFeeRecords = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "File upload error" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    try {
      const content = req.file.buffer.toString("utf-8");
      const lines = content.split("\n").filter((l) => l.trim());
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV must have a header row and at least one data row" });
      }

      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
      if (!records.length) {
        return res.status(400).json({ message: "No data rows found in CSV" });
      }

      const requiredFields = ["studentId", "feeType", "totalAmount", "dueDate"];
      const header = Object.keys(records[0]);
      const missing = requiredFields.filter((f) => !header.includes(f));
      if (missing.length) {
        return res.status(400).json({ message: `Missing required columns: ${missing.join(", ")}. Required: ${requiredFields.join(", ")}` });
      }

      let created = 0;
      let skipped = 0;
      const errors = [];

      for (const row of records) {
        try {
          const studentId = row.studentId.trim();
          const feeType = row.feeType.trim();
          const totalAmount = Number(row.totalAmount);
          const dueDate = row.dueDate.trim();
          const quarter = row.quarter?.trim() || null;
          const description = row.description?.trim() || `${feeType} Fee`;
          const academicYear = row.academicYear?.trim() || req.body.academicYear || "2025-26";

          if (!mongoose.Types.ObjectId.isValid(studentId)) {
            errors.push({ row: JSON.stringify(row), error: "Invalid studentId" });
            skipped++;
            continue;
          }
          if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            errors.push({ row: JSON.stringify(row), error: "Invalid totalAmount" });
            skipped++;
            continue;
          }

          const student = await Student.findById(studentId).select("classId").lean();
          if (!student) {
            errors.push({ row: JSON.stringify(row), error: "Student not found" });
            skipped++;
            continue;
          }

          const existing = await FeeRecord.findOne({
            studentId, feeType, quarter: quarter || null, academicYear,
          });
          if (existing) {
            skipped++;
            continue;
          }

          const normalizedQuarter = quarter === "" ? null : quarter;

          await FeeRecord.create({
            studentId,
            classId: student.classId,
            academicYear,
            feeType,
            quarter: normalizedQuarter,
            description,
            totalAmount,
            dueDate: new Date(dueDate),
            lateFeePerDay: Number(row.lateFeePerDay || 50),
          });
          created++;
        } catch (rowErr) {
          errors.push({ row: JSON.stringify(row), error: rowErr.message });
          skipped++;
        }
      }

      return res.status(created ? 201 : 400).json({
        message: `Imported ${created} record(s), skipped ${skipped}`,
        created,
        skipped,
        errors: errors.length ? errors : undefined,
      });
    } catch (parseErr) {
      return res.status(400).json({ message: "Failed to parse CSV file. Ensure it is valid CSV with UTF-8 encoding.", error: parseErr.message });
    }
  });
};

module.exports = { importFeeRecords };
