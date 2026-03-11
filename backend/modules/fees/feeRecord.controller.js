const mongoose = require("mongoose");
const FeeRecord = require("../../models/FeeRecord");
const FeeStructure = require("../../models/FeeStructure");
const Student = require("../../models/Student");
const Class = require("../../models/Class");

const dueDateByQuarter = (structure, quarter) => {
  if (quarter === "Q1") return structure.q1DueDate;
  if (quarter === "Q2") return structure.q2DueDate;
  if (quarter === "Q3") return structure.q3DueDate;
  if (quarter === "Q4") return structure.q4DueDate;
  return structure.q1DueDate;
};

const amountByType = (structure, feeType, quarter) => {
  const feeTypeAmountMap = {
    Tuition:
      quarter === "Annual"
        ? Number(structure.tuitionFee || 0)
        : Number(structure.tuitionFee || 0) / 4,
    Admission: Number(structure.admissionFee || 0),
    Uniform: Number(structure.uniformFee || 0),
    Activity: Number(structure.activityFee || 0),
    Transport: Number(structure.transportFee || 0),
  };

  return Number(feeTypeAmountMap[feeType] || 0);
};

const buildDescription = (feeType, quarter) => {
  if (feeType === "Tuition" && quarter) return `${quarter} Tuition Fee`;
  if (feeType === "Tuition") return "Tuition Fee";
  return `${feeType} Fee`;
};

const parseClassNumber = (className = "") => {
  const match = String(className).match(/(\d+)/);
  return match ? Number(match[1]) : NaN;
};

const generateForClassCore = async ({
  classId,
  academicYear,
  feeTypes,
  quarter,
  customAmount,
  debugLogs = false,
}) => {
  const log = (...args) => {
    if (debugLogs) console.log(...args);
  };

  try {
    log("1. Starting fee generation...");
    log("2. Looking for fee structure for classId:", classId);

    const structure = await FeeStructure.findOne({ classId, academicYear })
      .lean()
      .maxTimeMS(10000);

    log("3. Fee structure found:", structure);

    if (!structure) {
      return {
        error: { status: 404, message: "Set fee structure for this class first" },
        created: 0,
        skipped: 0,
        total: 0,
      };
    }

    // Verify exact field names and values used for amount mapping.
    log("Fee Structure:", JSON.stringify(structure));

    const students = await Student.find({ classId, isActive: true })
      .select("_id classId")
      .lean()
      .maxTimeMS(10000);

    log("4. Students found:", students.length);

    if (!students || students.length === 0) {
      return {
        error: { status: 404, message: "No students found in this class" },
        created: 0,
        skipped: 0,
        total: 0,
      };
    }

    log("5. Creating records...");

    const studentIds = students.map((s) => s._id);
    const existingRecords = await FeeRecord.find({
      studentId: { $in: studentIds },
      academicYear,
      feeType: { $in: feeTypes },
    })
      .select("studentId feeType quarter")
      .lean()
      .maxTimeMS(10000);

    const existingKeySet = new Set(
      existingRecords.map(
        (r) => `${String(r.studentId)}|${r.feeType}|${r.quarter || "null"}`,
      ),
    );

    const records = [];
    let skipped = 0;

    for (const student of students) {
      for (const feeType of feeTypes) {
        const amount =
          customAmount !== undefined && customAmount !== null
            ? Number(customAmount)
            : amountByType(structure, feeType, quarter);

        // Skip zero or invalid mapped amounts to avoid broken fee records.
        if (!Number.isFinite(amount) || amount <= 0) {
          skipped += 1;
          continue;
        }

        const qValue = feeType === "Tuition" ? quarter || null : null;
        const key = `${String(student._id)}|${feeType}|${qValue || "null"}`;
        if (existingKeySet.has(key)) {
          skipped += 1;
          continue;
        }

        records.push({
          studentId: student._id,
          classId: student.classId,
          academicYear,
          feeType,
          quarter: qValue,
          description: buildDescription(feeType, quarter),
          totalAmount: amount,
          dueDate: dueDateByQuarter(structure, quarter),
          lateFeePerDay: Number(structure.lateFeePerDay || 50),
        });
      }
    }

    let created = 0;
    if (records.length) {
      try {
        const inserted = await FeeRecord.insertMany(records, { ordered: false });
        created = inserted.length;
      } catch (error) {
        console.error("insertMany failed:", error);
        if (error?.result?.result?.nInserted !== undefined) {
          created = error.result.result.nInserted;
        } else if (Array.isArray(error?.insertedDocs)) {
          created = error.insertedDocs.length;
        } else {
          created = Math.max(0, records.length - skipped);
        }
      }
    }

    log("6. Done. Created:", created, "Skipped:", skipped);

    return {
      created,
      skipped: skipped + Math.max(0, records.length - created),
      total: students.length * feeTypes.length,
    };
  } catch (error) {
    console.error("Generate fee error:", error);
    return {
      error: { status: 500, message: error.message },
      created: 0,
      skipped: 0,
      total: 0,
    };
  }
};

const generateFeesForClass = async (req, res) => {
  try {
    const {
      classId,
      academicYear = "2024-25",
      feeTypes = [],
      quarter = null,
      customAmount,
    } = req.body;

    if (!classId || !Array.isArray(feeTypes) || feeTypes.length === 0) {
      return res
        .status(400)
        .json({ message: "classId and feeTypes are required" });
    }

    if (
      customAmount !== undefined &&
      customAmount !== null &&
      customAmount !== "" &&
      Number(customAmount) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Custom amount must be greater than zero" });
    }

    const result = await generateForClassCore({
      classId,
      academicYear,
      feeTypes,
      quarter,
      customAmount,
      debugLogs: true,
    });

    if (result.error) {
      return res
        .status(result.error.status)
        .json({ message: result.error.message });
    }

    return res.status(201).json(result);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to generate fees for class",
        error: error.message,
      });
  }
};

const generateFeesForSchool = async (req, res) => {
  try {
    const {
      academicYear = "2024-25",
      feeTypes = [],
      quarter = null,
      customAmount,
    } = req.body;

    if (!Array.isArray(feeTypes) || feeTypes.length === 0) {
      return res.status(400).json({ message: "feeTypes is required" });
    }

    if (
      customAmount !== undefined &&
      customAmount !== null &&
      customAmount !== "" &&
      Number(customAmount) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Custom amount must be greater than zero" });
    }

    const structures = await FeeStructure.find({ academicYear }).select(
      "classId",
    );
    let created = 0;
    let skipped = 0;
    let total = 0;

    for (const structure of structures) {
      const result = await generateForClassCore({
        classId: structure.classId,
        academicYear,
        feeTypes,
        quarter,
        customAmount,
      });

      if (!result.error) {
        created += result.created;
        skipped += result.skipped;
        total += result.total;
      }
    }

    return res.status(201).json({ created, skipped, total });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to generate fees for school",
        error: error.message,
      });
  }
};

const generateFeesForClassRange = async (req, res) => {
  try {
    const {
      fromClass,
      toClass,
      academicYear = "2024-25",
      feeTypes = [],
      quarter = null,
      customAmount,
    } = req.body;

    if (
      !fromClass ||
      !toClass ||
      !Array.isArray(feeTypes) ||
      feeTypes.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "fromClass, toClass and feeTypes are required" });
    }

    if (
      customAmount !== undefined &&
      customAmount !== null &&
      customAmount !== "" &&
      Number(customAmount) <= 0
    ) {
      return res
        .status(400)
        .json({ message: "Custom amount must be greater than zero" });
    }

    const minClass = Number(fromClass);
    const maxClass = Number(toClass);

    const classes = await Class.find({ isActive: true }).select(
      "_id className",
    );
    const ranged = classes.filter((c) => {
      const n = parseClassNumber(c.className);
      return !Number.isNaN(n) && n >= minClass && n <= maxClass;
    });

    let created = 0;
    let skipped = 0;
    let total = 0;

    for (const cls of ranged) {
      const result = await generateForClassCore({
        classId: cls._id,
        academicYear,
        feeTypes,
        quarter,
        customAmount,
      });

      if (!result.error) {
        created += result.created;
        skipped += result.skipped;
        total += result.total;
      }
    }

    return res.status(201).json({ created, skipped, total });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to generate fees for class range",
        error: error.message,
      });
  }
};

const generateFeeForStudent = async (req, res) => {
  try {
    const {
      studentId,
      feeType,
      quarter = null,
      amount,
      dueDate,
      description,
      academicYear = "2024-25",
    } = req.body;

    if (
      !studentId ||
      !feeType ||
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !dueDate
    ) {
      return res
        .status(400)
        .json({
          message: "studentId, feeType, amount and dueDate are required",
        });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    const normalizedQuarter = quarter === "" ? null : quarter;

    const student = await Student.findById(studentId).select("_id classId");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const feeRecord = await FeeRecord.create({
      studentId: student._id,
      classId: student.classId,
      academicYear,
      feeType,
      quarter: normalizedQuarter,
      description: description || `${feeType} Fee`,
      totalAmount: Number(amount),
      dueDate: new Date(dueDate),
    });

    const populated = await FeeRecord.findById(feeRecord._id)
      .populate({
        path: "studentId",
        select: "admissionNumber userId",
        populate: { path: "userId", select: "name" },
      })
      .populate("classId", "className section");

    return res.status(201).json(populated);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message:
          "Fee record already exists for this student, fee type, quarter, and academic year",
        error: error.message,
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid fee record data",
        error: error.message,
      });
    }

    return res
      .status(500)
      .json({
        message: "Failed to generate fee for student",
        error: error.message,
      });
  }
};

const getStudentFeeRecords = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (req.user.role === "student") {
      const ownStudent = await Student.findOne({ userId: req.user.id }).select(
        "_id",
      );
      if (!ownStudent || String(ownStudent._id) !== String(studentId)) {
        return res
          .status(403)
          .json({ message: "You can only view your own fee records" });
      }
    }

    const records = await FeeRecord.find({ studentId })
      .populate("classId", "className section")
      .sort({ dueDate: 1 });

    return res.json(records);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to fetch student fee records",
        error: error.message,
      });
  }
};

const getClassFeeRecords = async (req, res) => {
  try {
    const { classId } = req.params;
    const { quarter, status, feeType, academicYear, search } = req.query;

    const filter = {};
    if (classId && classId !== "all") filter.classId = classId;
    if (quarter && quarter !== "All") filter.quarter = quarter;
    if (status && status !== "All") filter.status = status;
    if (feeType && feeType !== "All") filter.feeType = feeType;
    if (academicYear && academicYear !== "All") filter.academicYear = academicYear;

    const records = await FeeRecord.find(filter)
      .populate({
        path: "studentId",
        select: "admissionNumber userId",
        populate: { path: "userId", select: "name" },
      })
      .populate("classId", "className section")
      .sort({ dueDate: 1 });

    let finalRecords = records;
    if (search && String(search).trim()) {
      const term = String(search).trim().toLowerCase();
      finalRecords = records.filter((r) => {
        const name = String(r?.studentId?.userId?.name || "").toLowerCase();
        const admission = String(r?.studentId?.admissionNumber || "").toLowerCase();
        return name.includes(term) || admission.includes(term);
      });
    }

    return res.json(finalRecords);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to fetch class fee records",
        error: error.message,
      });
  }
};

const updateOverdueStatus = async (req, res) => {
  try {
    const today = new Date();

    const result = await FeeRecord.updateMany(
      { status: "DUE", paidAmount: 0, dueDate: { $lt: today } },
      { $set: { status: "OVERDUE" } },
    );

    return res.json({ updated: result.modifiedCount || 0 });
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Failed to update overdue status",
        error: error.message,
      });
  }
};

const cleanupZeroRecords = async (req, res) => {
  try {
    const result = await FeeRecord.deleteMany({ totalAmount: { $lte: 0 } });
    console.log("Deleted zero records:", result.deletedCount || 0);

    return res.json({
      deleted: result.deletedCount || 0,
      message: "Deleted all zero/invalid amount fee records",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to cleanup zero amount records",
      error: error.message,
    });
  }
};

const fixStatuses = async (req, res) => {
  try {
    const records = await FeeRecord.find({});
    let updated = 0;

    for (const record of records) {
      const prevStatus = record.status;
      const prevPaidAmount = Number(record.paidAmount || 0);

      await record.save();

      if (
        record.status !== prevStatus ||
        Number(record.paidAmount || 0) !== prevPaidAmount
      ) {
        updated += 1;
      }
    }

    return res.json({
      message: "Statuses fixed successfully",
      checked: records.length,
      updated,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fix statuses",
      error: error.message,
    });
  }
};

module.exports = {
  generateFeesForClass,
  generateFeesForSchool,
  generateFeesForClassRange,
  generateFeeForStudent,
  getStudentFeeRecords,
  getClassFeeRecords,
  updateOverdueStatus,
  cleanupZeroRecords,
  fixStatuses,
};
