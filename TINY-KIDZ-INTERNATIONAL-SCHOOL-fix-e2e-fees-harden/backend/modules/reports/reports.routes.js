const express = require("express");
const {
  getOverview,
  getAttendanceSummary,
  getMarksSummary,
  getFeeSummary,
  getTopStudents,
} = require("./reports.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

const router = express.Router();

// All routes require admin authentication
router.get("/overview", protect, authorize("admin"), getOverview);
router.get("/attendance", protect, authorize("admin"), getAttendanceSummary);
router.get("/marks", protect, authorize("admin"), getMarksSummary);
router.get("/fees", protect, authorize("admin"), getFeeSummary);
router.get("/top-students", protect, authorize("admin"), getTopStudents);

module.exports = router;
