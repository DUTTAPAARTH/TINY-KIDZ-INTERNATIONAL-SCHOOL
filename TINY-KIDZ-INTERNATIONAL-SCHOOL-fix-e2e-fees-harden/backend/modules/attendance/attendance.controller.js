const mongoose = require("mongoose");
const Attendance = require("../../models/Attendance");
const Student = require("../../models/Student");
const Teacher = require("../../models/Teacher");

// POST /api/attendance - Mark attendance for a class (Teacher only)
exports.markAttendance = async (req, res) => {
  try {
    const { classId, date, records } = req.body;

    // Validate required fields
    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: classId, date, records array",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId format",
      });
    }

    // Verify teacher has this class assigned
    const teacher = await Teacher.findOne({
      userId: req.user._id,
      classIds: classId,
    });

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class",
      });
    }

    // Normalize date to UTC midnight
    const normalizedDate = new Date(date + "T00:00:00.000Z");

    // Validate each record's ObjectId and status
    for (const record of records) {
      if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
        return res.status(400).json({
          success: false,
          message: "Each record must have a valid studentId",
        });
      }
      if (!record.status || !["Present", "Absent", "Late"].includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be "Present", "Absent", or "Late"',
        });
      }
    }

    // Verify all students belong to this class
    const studentIds = records.map(function(r) { return r.studentId; });
    const validCount = await Student.countDocuments({
      _id: { $in: studentIds },
      classId: classId,
    });
    if (validCount !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some students are not enrolled in this class",
      });
    }

    // Atomic upsert to avoid race conditions
    const attendance = await Attendance.findOneAndUpdate(
      { classId, date: normalizedDate },
      {
        $set: {
          records,
          markedBy: req.user._id,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    await attendance.populate("classId", "className section");
    await attendance.populate("records.studentId", "userId admissionNumber");
    await attendance.populate("markedBy", "name email");

    const statusCode = attendance.__v === 0 ? 201 : 200;
    res.status(statusCode).json({
      success: true,
      message: "Attendance saved successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

// GET /api/attendance/class/:classId - Get attendance for a class (Admin + Teacher)
exports.getByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify if teacher, must have this class assigned
    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({
        userId: req.user._id,
        classIds: classId,
      });

      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this class",
        });
      }
    }

    const attendance = await Attendance.find({ classId })
      .populate("classId", "className section")
      .populate("records.studentId", "userId admissionNumber")
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

// GET /api/attendance/class/:classId/date/:date - Get attendance for specific date
exports.getByClassAndDate = async (req, res) => {
  try {
    const { classId, date } = req.params;

    // Verify if teacher, must have this class assigned
    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({
        userId: req.user._id,
        classIds: classId,
      });

      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this class",
        });
      }
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      classId,
      date: normalizedDate,
    })
      .populate("classId", "className section")
      .populate("records.studentId", "userId admissionNumber");

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "No attendance records found for this date",
      });
    }

    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

// GET /api/attendance/student/:studentId - Get student's attendance records
exports.getByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify if student, can only view own attendance
    if (req.user.role === "student") {
      const student = await Student.findById(studentId);
      if (!student || student.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own attendance",
        });
      }
    }

    // Find all attendance records containing this student
    const attendanceDocs = await Attendance.find({
      "records.studentId": studentId,
    })
      .populate("classId", "className section")
      .sort({ date: -1 });

    // Flatten: extract this student's status from each doc's nested records array
    const flattened = [];
    let totalDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;

    attendanceDocs.forEach((doc) => {
      const myRecord = doc.records.find(
        (r) => r.studentId.toString() === studentId,
      );
      if (myRecord) {
        totalDays++;
        if (myRecord.status === "Present") presentDays++;
        else if (myRecord.status === "Absent") absentDays++;
        else if (myRecord.status === "Late") lateDays++;

        flattened.push({
          _id: doc._id,
          date: doc.date,
          classId: doc.classId,
          status: myRecord.status,
        });
      }
    });

    const attendancePercentage =
      totalDays > 0
        ? Math.round(((presentDays + lateDays) / totalDays) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        records: flattened,
        summary: {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendancePercentage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

// GET /api/attendance/summary/:classId - Get attendance summary stats
exports.getSummary = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify if teacher, must have this class assigned
    if (req.user.role === "teacher") {
      const teacher = await Teacher.findOne({
        userId: req.user._id,
        classIds: classId,
      });

      if (!teacher) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to this class",
        });
      }
    }

    // Get all attendance for the class
    const attendanceRecords = await Attendance.find({ classId }).populate(
      "records.studentId",
    );

    if (attendanceRecords.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          averageAttendance: 0,
          bestAttendanceDay: null,
          worstAttendanceDay: null,
        },
      });
    }

    // Get all unique students in this class
    const studentSet = new Set();
    attendanceRecords.forEach((record) => {
      record.records.forEach((r) => {
        studentSet.add(r.studentId.toString());
      });
    });

    const totalStudents = studentSet.size;

    // Calculate average attendance percentage
    let totalAttendancePercentage = 0;
    const dayStats = [];

    attendanceRecords.forEach((record) => {
      const presentAndLate = record.records.filter(
        (r) => r.status === "Present" || r.status === "Late",
      ).length;
      const dayPercentage =
        record.records.length > 0
          ? Math.round((presentAndLate / record.records.length) * 100)
          : 0;

      totalAttendancePercentage += dayPercentage;
      dayStats.push({
        date: record.date,
        percentage: dayPercentage,
      });
    });

    const averageAttendance = Math.round(
      totalAttendancePercentage / attendanceRecords.length,
    );

    // Find best and worst attendance days
    const bestDay = dayStats.reduce((max, curr) =>
      curr.percentage > max.percentage ? curr : max,
    );
    const worstDay = dayStats.reduce((min, curr) =>
      curr.percentage < min.percentage ? curr : min,
    );

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        averageAttendance,
        bestAttendanceDay: {
          date: bestDay.date,
          percentage: bestDay.percentage,
        },
        worstAttendanceDay: {
          date: worstDay.date,
          percentage: worstDay.percentage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance summary",
      error: error.message,
    });
  }
};
