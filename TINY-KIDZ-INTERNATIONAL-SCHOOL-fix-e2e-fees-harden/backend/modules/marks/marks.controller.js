const mongoose = require("mongoose");
const Marks = require("./marks.model");
const GradingPolicy = require("../../models/GradingPolicy");
const ExamConfig = require("../../models/ExamConfig");
const Student = require("../../models/Student");
const User = require("../../models/User");
require("../../models/Subject");

const EXAM_TYPES = ["UT1", "UT2", "UT3", "UT4", "Mid Term", "Final Exam"];
const DEFAULT_TOTALS = { UT1: 50, UT2: 50, UT3: 75, UT4: 50, "Mid Term": 30, "Final Exam": 100 };

async function resolveSubject(subjectId) {
  if (mongoose.Types.ObjectId.isValid(subjectId)) return subjectId;
  const db = mongoose.connection.db;
  let subject = await db.collection("subjects").findOne({ name: { $regex: new RegExp("^" + subjectId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i") } });
  if (!subject) {
    const result = await db.collection("subjects").insertOne({ name: subjectId, code: subjectId.substring(0, 3).toUpperCase(), createdAt: new Date(), updatedAt: new Date() });
    subject = { _id: result.insertedId };
  }
  return subject._id;
}

async function getGradingPolicy() {
  let policy = await GradingPolicy.findOne();
  if (!policy) {
    policy = await GradingPolicy.create({});
  }
  return policy;
}

function calculateGrade(marks, totalMarks, policy) {
  const percentage = (marks / totalMarks) * 100;
  const scale = policy.gradingScale.sort((a, b) => b.minMarks - a.minMarks);
  for (const bracket of scale) {
    if (percentage >= bracket.minMarks && percentage <= bracket.maxMarks) {
      return bracket.grade;
    }
  }
  return "F";
}

function isPass(marks, totalMarks, policy) {
  const percentage = (marks / totalMarks) * 100;
  return percentage >= policy.passingMarks;
}

// POST /api/marks - Batch save marks (legacy, full records)
exports.addMarks = async (req, res) => {
  try {
    const { classId, subjectId, examType, examDate, academicYear, records } = req.body;
    if (!classId || !subjectId || !examType || !records) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const policy = await getGradingPolicy();
    const year = academicYear || "2024-25";
    let savedCount = 0;
    const errors = [];
    for (const record of records) {
      const status = record.status || "Present";
      if (status === "Absent") {
        const existing = await Marks.findOne({ studentId: record.studentId, subjectId, examType, academicYear: year });
        if (existing) {
          existing.status = "Absent";
          existing.marksObtained = null;
          existing.percentage = null;
          existing.grade = "F";
          if (record.remarks !== undefined) existing.remarks = record.remarks;
          existing.examDate = examDate;
          existing.classId = classId;
          await existing.save();
        } else {
          await Marks.create({ studentId: record.studentId, subjectId, classId, addedBy: req.user._id, marksObtained: null, status: "Absent", grade: "F", examType, academicYear: year, examDate, remarks: record.remarks || null });
        }
        savedCount++;
        continue;
      }
      if (record.marksObtained === null || record.marksObtained === undefined || record.marksObtained === "") continue;
      const marksNum = Number(record.marksObtained);
      const total = record.totalMarks || 100;
      if (isNaN(marksNum) || marksNum < 0 || marksNum > total) {
        errors.push({ studentId: record.studentId, message: `Marks must be between 0-${total}` });
        continue;
      }
      try {
        const existing = await Marks.findOne({ studentId: record.studentId, subjectId, examType, academicYear: year });
        if (existing) {
          existing.classId = classId;
          existing.marksObtained = marksNum;
          existing.totalMarks = total;
          existing.status = "Present";
          existing.grade = calculateGrade(marksNum, total, policy);
          existing.percentage = Number(((marksNum / total) * 100).toFixed(2));
          if (record.remarks !== undefined) existing.remarks = record.remarks;
          existing.examDate = examDate;
          await existing.save();
        } else {
          await Marks.create({ studentId: record.studentId, subjectId, classId, addedBy: req.user._id, marksObtained: marksNum, totalMarks: total, status: "Present", grade: calculateGrade(marksNum, total, policy), examType, academicYear: year, examDate, remarks: record.remarks || null });
        }
        savedCount++;
      } catch (err) { errors.push({ studentId: record.studentId, message: err.message }); }
    }
    res.status(200).json({ success: true, savedCount, totalRecords: records.filter((r) => r.marksObtained !== null && r.marksObtained !== undefined && r.marksObtained !== "" && r.status !== "Absent").length, message: `Saved marks for ${savedCount} students`, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error saving marks", error: error.message });
  }
};

// POST /api/marks/entry - Single-exam entry (Phase 1)
exports.entryMarks = async (req, res) => {
  try {
    let { classId, subjectId, examType, maxMarks, records } = req.body;
    if (!classId || !subjectId || !examType || !records) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    subjectId = await resolveSubject(subjectId);
    const year = "2024-25";
    const policy = await getGradingPolicy();
    let savedCount = 0;
    const errors = [];
    for (const record of records) {
      if (record.status === "Absent") {
        await Marks.findOneAndUpdate(
          { studentId: record.studentId, subjectId, examType, academicYear: year },
          { $set: { classId, subjectId, examType, academicYear: year, addedBy: req.user._id, status: "Absent", marksObtained: null, totalMarks: maxMarks, percentage: null, grade: "F", remarks: record.remarks || null } },
          { upsert: true, new: true }
        );
        savedCount++;
        continue;
      }
      const marksNum = Number(record.marksObtained);
      if (isNaN(marksNum) || marksNum < 0) {
        errors.push({ studentId: record.studentId, message: "Invalid marks" });
        continue;
      }
      if (marksNum > maxMarks) {
        errors.push({ studentId: record.studentId, message: `Marks cannot exceed ${maxMarks}` });
        continue;
      }
      const grade = calculateGrade(marksNum, maxMarks, policy);
      await Marks.findOneAndUpdate(
        { studentId: record.studentId, subjectId, examType, academicYear: year },
        { $set: { classId, subjectId, examType, academicYear: year, addedBy: req.user._id, status: "Present", marksObtained: marksNum, totalMarks: maxMarks, percentage: Number(((marksNum / maxMarks) * 100).toFixed(2)), grade, remarks: record.remarks || null } },
        { upsert: true, new: true }
      );
      savedCount++;
    }
    res.json({ success: true, savedCount, errors: errors.length > 0 ? errors : undefined, message: `Saved ${savedCount} entries` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/marks - Get marks with filters (for teacher/admin grid)
exports.getMarks = async (req, res) => {
  try {
    let { classId, subjectId, examType, dateFrom, dateTo } = req.query;

    const filter = {};

    if (subjectId) {
      subjectId = await resolveSubject(subjectId);
      filter.subjectId = subjectId;
    }
    if (examType) filter.examType = examType;
    if (dateFrom || dateTo) {
      filter.examDate = {};
      if (dateFrom) filter.examDate.$gte = new Date(dateFrom);
      if (dateTo) filter.examDate.$lte = new Date(dateTo);
    }

    // If classId is provided, find students in class first
    let studentIds = null;
    if (classId) {
      const students = await Student.find({ classId }).select("_id");
      studentIds = students.map((s) => s._id);
      if (studentIds.length === 0) {
        return res.status(200).json({
          success: true,
          message: "No students found in this class",
          marks: [],
          students: [],
        });
      }
      filter.studentId = { $in: studentIds };
    }

    const marks = await Marks.find(filter)
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .populate("subjectId", "name code")
      .populate("addedBy", "name")
      .sort({ "studentId.userId.name": 1 });

    // Get all students in class for the "show all 36" feature
    let allStudents = [];
    if (classId) {
      allStudents = await Student.find({ classId })
        .populate("userId", "name email")
        .select("admissionNumber");
    }

    res.status(200).json({
      success: true,
      message: `Retrieved ${marks.length} marks records`,
      marks,
      students: allStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching marks",
      error: error.message,
    });
  }
};

// GET /api/marks/student/me - Get logged-in student's marks
exports.getMyMarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const student = await Student.findOne({ userId: user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student profile not found" });
    }

    const marks = await Marks.find({ studentId: student._id })
      .populate("subjectId", "name code")
      .populate("addedBy", "name")
      .sort({ examDate: -1 });

    const policy = await getGradingPolicy();
    const totalExams = marks.length;
    const passCount = marks.filter((m) => isPass(m.marksObtained, m.totalMarks, policy)).length;
    const failCount = totalExams - passCount;
    const avgMarks = totalExams > 0
      ? marks.reduce((sum, m) => sum + (m.marksObtained / m.totalMarks) * 100, 0) / totalExams
      : 0;

    res.status(200).json({
      success: true,
      myMarks: marks,
      summary: {
        totalExams,
        averageMarks: Number(avgMarks.toFixed(2)),
        passCount,
        failCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student marks",
      error: error.message,
    });
  }
};

// GET /api/marks/student/:id - Get marks for a specific student
exports.getStudentMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const marks = await Marks.find({ studentId: id })
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .populate("subjectId", "name code")
      .populate("addedBy", "name")
      .sort({ examDate: -1 });

    res.status(200).json({
      success: true,
      marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student marks",
      error: error.message,
    });
  }
};

// GET /api/marks/class/:id - Get marks for a class
exports.getClassMarks = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { academicYear, subjectId, examType } = req.query;

    const students = await Student.find({ classId }).select("_id");
    const studentIds = students.map((s) => s._id);
    if (studentIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No students found in this class",
        marks: [],
        statistics: { totalRecords: 0, averageMarks: 0, highestMarks: 0, lowestMarks: 0 },
      });
    }

    const filter = { studentId: { $in: studentIds } };
    if (academicYear) filter.academicYear = academicYear;
    if (subjectId) filter.subjectId = subjectId;
    if (examType) filter.examType = examType;

    const marks = await Marks.find(filter)
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .populate("subjectId", "name code")
      .populate("addedBy", "name")
      .sort({ "studentId.userId.name": 1 });

    const validMarks = marks.filter((m) => m.marksObtained !== undefined);
    const statistics = {
      totalRecords: marks.length,
      averageMarks: validMarks.length > 0
        ? Number((validMarks.reduce((sum, m) => sum + m.marksObtained, 0) / validMarks.length).toFixed(2))
        : 0,
      highestMarks: validMarks.length > 0 ? Math.max(...validMarks.map((m) => m.marksObtained)) : 0,
      lowestMarks: validMarks.length > 0 ? Math.min(...validMarks.map((m) => m.marksObtained)) : 0,
    };

    res.status(200).json({
      success: true,
      message: `Retrieved ${marks.length} marks for class`,
      classId,
      statistics,
      marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching class marks",
      error: error.message,
    });
  }
};

// PATCH /api/marks/:id - Update single mark entry
exports.updateMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { marksObtained, totalMarks, status, remarks } = req.body;

    const existing = await Marks.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Marks entry not found" });
    }

    if (existing.isPublished && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Marks are published and locked" });
    }

    if (status === "Absent") {
      existing.status = "Absent";
      existing.marksObtained = null;
      existing.percentage = null;
      existing.grade = "F";
      if (remarks !== undefined) existing.remarks = remarks;
      await existing.save();
      return res.json({ success: true, message: "Marked as Absent", data: existing });
    }

    if (marksObtained !== undefined) {
      const finalTotal = totalMarks || existing.totalMarks;
      if (marksObtained < 0 || marksObtained > finalTotal) {
        return res.status(400).json({ success: false, message: `Marks must be between 0-${finalTotal}` });
      }
      existing.marksObtained = marksObtained;
      existing.totalMarks = finalTotal;
      existing.status = "Present";
    }
    if (remarks !== undefined) existing.remarks = remarks;

    await existing.save();
    res.json({ success: true, message: "Marks updated", data: existing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/marks/:id - Delete marks entry
exports.deleteMarks = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Marks.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Marks entry not found" });
    }

    if (req.user.role !== "admin" && existing.addedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this entry" });
    }

    await Marks.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Marks entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting marks",
      error: error.message,
    });
  }
};

// POST /api/marks/publish-exam - Publish all marks for an exam type
exports.publishExam = async (req, res) => {
  try {
    let { classId, subjectId, examType } = req.body;
    if (!classId || !subjectId || !examType) {
      return res.status(400).json({ success: false, message: "Missing classId, subjectId, examType" });
    }
    subjectId = await resolveSubject(subjectId);
    const year = "2024-25";
    const blanks = await Marks.countDocuments({ classId, subjectId, examType, academicYear: year, marksObtained: null, status: "Present" });
    if (blanks > 0) {
      return res.status(400).json({ success: false, message: `${blanks} student(s) have no marks yet. Mark all before publishing.` });
    }
    const result = await Marks.updateMany(
      { classId, subjectId, examType, academicYear: year },
      { $set: { isPublished: true } }
    );
    res.json({ success: true, message: `Published ${result.modifiedCount} marks for ${examType}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/marks/assessment-matrix?classId=X&subjectId=Y - All marks + config for Phase 2
exports.getAssessmentMatrix = async (req, res) => {
  try {
    let { classId, subjectId } = req.query;
    if (!classId || !subjectId) {
      return res.status(400).json({ success: false, message: "Missing classId or subjectId" });
    }
    subjectId = await resolveSubject(subjectId);
    const year = "2024-25";
    const students = await Student.find({ classId }).populate("userId", "name email").select("admissionNumber");
    const marks = await Marks.find({ classId, subjectId, academicYear: year })
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .sort({ "studentId.userId.name": 1 });
    let examConfig = await ExamConfig.findOne({ classId, subjectId });
    let totals = { ...DEFAULT_TOTALS };
    if (examConfig) {
      examConfig.configs.forEach((c) => { totals[c.examType] = c.totalMarks; });
    }
    res.json({ success: true, students, marks, examTotals: totals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/marks/examTypes - Get list of exam types
exports.getExamTypes = async (req, res) => {
  res.status(200).json({ success: true, examTypes: EXAM_TYPES });
};

// GET /api/marks/policy - Get grading policy
exports.getGradingPolicy = async (req, res) => {
  try {
    const policy = await getGradingPolicy();
    res.status(200).json({ success: true, data: policy });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching grading policy",
      error: error.message,
    });
  }
};

// PATCH /api/marks/policy - Update grading policy (admin only)
exports.updateGradingPolicy = async (req, res) => {
  try {
    const { gradingScale, passingMarks } = req.body;

    let policy = await GradingPolicy.findOne();
    if (!policy) {
      policy = new GradingPolicy();
    }

    if (gradingScale) policy.gradingScale = gradingScale;
    if (passingMarks !== undefined) policy.passingMarks = passingMarks;

    await policy.save();

    res.status(200).json({
      success: true,
      message: "Grading policy updated successfully",
      data: policy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating grading policy",
      error: error.message,
    });
  }
};

// GET /api/marks/exam-config?classId=X&subjectId=Y - Get exam config
exports.getExamConfig = async (req, res) => {
  try {
    let { classId, subjectId } = req.query;
    if (classId && subjectId) subjectId = await resolveSubject(subjectId);
    let config = null;
    if (classId && subjectId) {
      config = await ExamConfig.findOne({ classId, subjectId });
    }
    if (!config) {
      const totals = { ...DEFAULT_TOTALS };
      return res.json({ success: true, data: totals, fromDefault: true });
    }
    const result = {};
    config.configs.forEach((c) => { result[c.examType] = c.totalMarks; });
    res.json({ success: true, data: result, fromDefault: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/marks/exam-config - Save exam config
exports.saveExamConfig = async (req, res) => {
  try {
    let { classId, subjectId, configs } = req.body;
    if (!classId || !subjectId || !configs) {
      return res.status(400).json({ success: false, message: "Missing classId, subjectId, or configs" });
    }
    subjectId = await resolveSubject(subjectId);
    const data = await ExamConfig.findOneAndUpdate(
      { classId, subjectId },
      { classId, subjectId, configs },
      { upsert: true, new: true }
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/marks/subject/:subjectName - Get marks by subject for student
exports.getSubjectMarks = async (req, res) => {
  try {
    const { subjectName } = req.params;
    const { academicYear = "2024-25" } = req.query;

    // First find subject by name
    const db = require("mongoose").connection.db;
    const subject = await db.collection("subjects").findOne({ name: { $regex: new RegExp("^" + subjectName + "$", "i") } });

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    const marks = await Marks.find({ subjectId: subject._id, academicYear })
      .populate({ path: "studentId", populate: { path: "userId", select: "name" } })
      .populate("subjectId", "name code")
      .populate("addedBy", "name")
      .sort({ marksObtained: -1 });

    res.status(200).json({
      success: true,
      data: marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subject marks",
      error: error.message,
    });
  }
};
