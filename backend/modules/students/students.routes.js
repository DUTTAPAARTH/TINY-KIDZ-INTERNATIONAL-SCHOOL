const express = require("express");
const router = express.Router();
const studentsController = require("./students.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

// GET /api/students/me - Get logged-in student's own profile (Student only)
// This must come BEFORE /:id route to avoid conflicts
router.get("/me", protect, authorize("student"), studentsController.getMe);

// GET /api/students - Get all students (Admin + Teacher, paginated, searchable)
router.get(
  "/",
  protect,
  authorize("admin", "teacher"),
  studentsController.getAllStudents,
);

// POST /api/students - Create student with User account (Admin only)
router.post("/", protect, authorize("admin"), studentsController.createStudent);

// GET /api/students/:id - Get single student (Admin + Teacher)
router.get(
  "/:id",
  protect,
  authorize("admin", "teacher"),
  studentsController.getStudent,
);

// PUT /api/students/:id - Update student (Admin only)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  studentsController.updateStudent,
);

// DELETE /api/students/:id - Delete student and User account (Admin only)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  studentsController.deleteStudent,
);

module.exports = router;
