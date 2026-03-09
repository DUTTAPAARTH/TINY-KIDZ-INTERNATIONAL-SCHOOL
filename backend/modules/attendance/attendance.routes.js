const express = require("express");
const router = express.Router();
const attendanceController = require("./attendance.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

// POST /api/attendance - Mark attendance for a class (Teacher only)
router.post(
  "/",
  protect,
  authorize("teacher"),
  attendanceController.markAttendance,
);

// GET /api/attendance/class/:classId - Get attendance for a class (Admin + Teacher)
router.get(
  "/class/:classId",
  protect,
  authorize("admin", "teacher"),
  attendanceController.getByClass,
);

// GET /api/attendance/class/:classId/date/:date - Get attendance for specific date
router.get(
  "/class/:classId/date/:date",
  protect,
  authorize("admin", "teacher"),
  attendanceController.getByClassAndDate,
);

// GET /api/attendance/student/:studentId - Get student's attendance records
router.get(
  "/student/:studentId",
  protect,
  authorize("admin", "student"),
  attendanceController.getByStudent,
);

// GET /api/attendance/summary/:classId - Get attendance summary stats
router.get(
  "/summary/:classId",
  protect,
  authorize("admin", "teacher"),
  attendanceController.getSummary,
);

module.exports = router;
