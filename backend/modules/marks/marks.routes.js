const express = require("express");
const router = express.Router();
const marksController = require("./marks.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

// POST - Add marks (Teacher/Admin only)
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  marksController.addMarks,
);

// GET - Get all marks for a student (All authenticated roles)
router.get("/student/:id", protect, marksController.getStudentMarks);

// GET - Get all marks for a class (Teacher/Admin only)
router.get(
  "/class/:id",
  protect,
  authorize("teacher", "admin"),
  marksController.getClassMarks,
);

// GET - Get subject marks (All authenticated roles)
router.get("/subject/marks", protect, marksController.getSubjectMarks);

// PUT - Update marks entry (Teacher/Admin only)
router.put(
  "/:id",
  protect,
  authorize("teacher", "admin"),
  marksController.updateMarks,
);

// DELETE - Delete marks entry (Admin only)
router.delete("/:id", protect, authorize("admin"), marksController.deleteMarks);

module.exports = router;
