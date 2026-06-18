const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");
const Class = require("../../models/Class");
const Notice = require("../../models/Notice");
const Homework = require("../../models/Homework");
const Attendance = require("../../models/Attendance");
const Mark = require("../../models/Marks");
const FeeRecord = require("../../models/FeeRecord");

// @desc Get overall school statistics
// @access Private/Admin
exports.getOverview = async (req, res) => {
  try {
    // Fetch all counts simultaneously using Promise.all
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      noticesPosted,
      homeworkAssigned,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Class.countDocuments(),
      Notice.countDocuments(),
      Homework.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        noticesPosted,
        homeworkAssigned,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get attendance summary grouped by class
// @access Private/Admin
exports.getAttendanceSummary = async (req, res) => {
  try {
    // Aggregate attendance records by class
    const attendanceSummary = await Attendance.aggregate([
      {
        $group: {
          _id: "$classId",
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "_id",
          foreignField: "_id",
          as: "classInfo",
        },
      },
      {
        $unwind: {
          path: "$classInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          classId: "$_id",
          className: "$classInfo.name",
          grade: "$classInfo.grade",
          section: "$classInfo.section",
          totalRecords: 1,
          presentCount: 1,
          absentCount: 1,
          lateCount: 1,
          avgAttendance: {
            $cond: [
              { $gt: ["$totalRecords", 0] },
              {
                $multiply: [
                  { $divide: ["$presentCount", "$totalRecords"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $sort: { avgAttendance: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      count: attendanceSummary.length,
      data: attendanceSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get marks summary with grade distribution
// @access Private/Admin
exports.getMarksSummary = async (req, res) => {
  try {
    // Calculate grade distribution
    const gradeDistribution = await Mark.aggregate([
      {
        $addFields: {
          grade: {
            $switch: {
              branches: [
                { case: { $gte: ["$marksObtained", 90] }, then: "A+" },
                {
                  case: {
                    $and: [
                      { $gte: ["$marksObtained", 80] },
                      { $lt: ["$marksObtained", 90] },
                    ],
                  },
                  then: "A",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$marksObtained", 70] },
                      { $lt: ["$marksObtained", 80] },
                    ],
                  },
                  then: "B+",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$marksObtained", 60] },
                      { $lt: ["$marksObtained", 70] },
                    ],
                  },
                  then: "B",
                },
                { case: { $lt: ["$marksObtained", 60] }, then: "C" },
              ],
              default: "C",
            },
          },
        },
      },
      {
        $group: {
          _id: "$grade",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Average marks per subject
    const avgMarksPerSubject = await Mark.aggregate([
      {
        $lookup: {
          from: "subjects",
          localField: "subjectId",
          foreignField: "_id",
          as: "subject",
        },
      },
      {
        $unwind: {
          path: "$subject",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$subjectId",
          subjectName: { $first: "$subject.name" },
          averageMarks: { $avg: "$marksObtained" },
          totalStudents: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          subjectId: "$_id",
          subjectName: 1,
          averageMarks: { $round: ["$averageMarks", 2] },
          totalStudents: 1,
        },
      },
      {
        $sort: { averageMarks: -1 },
      },
    ]);

    // Average marks per class
    const avgMarksPerClass = await Mark.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "student.classId",
          foreignField: "_id",
          as: "class",
        },
      },
      {
        $unwind: {
          path: "$class",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: "$student.classId",
          className: { $first: "$class.name" },
          grade: { $first: "$class.grade" },
          section: { $first: "$class.section" },
          averageMarks: { $avg: "$marksObtained" },
          totalRecords: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          classId: "$_id",
          className: 1,
          grade: 1,
          section: 1,
          averageMarks: { $round: ["$averageMarks", 2] },
          totalRecords: 1,
        },
      },
      {
        $sort: { averageMarks: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        gradeDistribution,
        avgMarksPerSubject,
        avgMarksPerClass,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get fee collection summary
// @access Private/Admin
exports.getFeeSummary = async (req, res) => {
  try {
    const feeSummary = await FeeRecord.aggregate([
      {
        $group: {
          _id: null,
          totalFeeExpected: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "Paid"] }, 1, 0] },
          },
          partialCount: {
            $sum: { $cond: [{ $eq: ["$status", "Partial"] }, 1, 0] },
          },
          unpaidCount: {
            $sum: { $cond: [{ $eq: ["$status", "Unpaid"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalFeeExpected: 1,
          totalCollected: 1,
          totalDue: { $subtract: ["$totalFeeExpected", "$totalCollected"] },
          paidCount: 1,
          partialCount: 1,
          unpaidCount: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data:
        feeSummary.length > 0
          ? feeSummary[0]
          : {
              totalFeeExpected: 0,
              totalCollected: 0,
              totalDue: 0,
              paidCount: 0,
              partialCount: 0,
              unpaidCount: 0,
            },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Get top 10 students by average marks
// @access Private/Admin
exports.getTopStudents = async (req, res) => {
  try {
    const topStudents = await Mark.aggregate([
      {
        $group: {
          _id: "$studentId",
          averageMarks: { $avg: "$marksObtained" },
          totalSubjects: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      {
        $unwind: {
          path: "$student",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "student.userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "student.classId",
          foreignField: "_id",
          as: "class",
        },
      },
      {
        $unwind: {
          path: "$class",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          grade: {
            $switch: {
              branches: [
                { case: { $gte: ["$averageMarks", 90] }, then: "A+" },
                {
                  case: {
                    $and: [
                      { $gte: ["$averageMarks", 80] },
                      { $lt: ["$averageMarks", 90] },
                    ],
                  },
                  then: "A",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$averageMarks", 70] },
                      { $lt: ["$averageMarks", 80] },
                    ],
                  },
                  then: "B+",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$averageMarks", 60] },
                      { $lt: ["$averageMarks", 70] },
                    ],
                  },
                  then: "B",
                },
                { case: { $lt: ["$averageMarks", 60] }, then: "C" },
              ],
              default: "C",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          studentName: "$user.name",
          admissionNumber: "$student.admissionNumber",
          className: "$class.name",
          grade: "$class.grade",
          section: "$class.section",
          averageMarks: { $round: ["$averageMarks", 2] },
          gradeLevel: "$grade",
          totalSubjects: 1,
        },
      },
      {
        $sort: { averageMarks: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Get attendance percentage for top students
    const studentIds = topStudents.map((s) => s.studentId);
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          studentId: { $in: studentIds },
        },
      },
      {
        $group: {
          _id: "$studentId",
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          studentId: "$_id",
          attendancePercentage: {
            $cond: [
              { $gt: ["$totalDays", 0] },
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$presentDays", "$totalDays"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Merge attendance data with top students
    const attendanceMap = attendanceData.reduce((acc, curr) => {
      acc[curr.studentId.toString()] = curr.attendancePercentage;
      return acc;
    }, {});

    const topStudentsWithAttendance = topStudents.map((student) => ({
      ...student,
      attendancePercentage: attendanceMap[student.studentId.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: topStudentsWithAttendance.length,
      data: topStudentsWithAttendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
