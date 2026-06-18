const express = require("express");
const router = express.Router();
const teachersController = require("./teachers.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

// GET /api/teachers/me - Get logged-in teacher's own profile (Teacher only)
// This must come BEFORE /:id route to avoid conflicts
router.get("/me", protect, authorize("teacher"), teachersController.getMe);

// GET /api/teachers - Get all teachers (Admin only)
router.get("/", protect, authorize("admin"), teachersController.getAllTeachers);

// POST /api/teachers - Create teacher with User account (Admin only)
router.post("/", protect, authorize("admin"), teachersController.createTeacher);

// GET /api/teachers/:id - Get single teacher (Admin only)
router.get("/:id", protect, authorize("admin"), teachersController.getTeacher);

// PUT /api/teachers/:id - Update teacher (Admin only)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  teachersController.updateTeacher,
);

// DELETE /api/teachers/:id - Delete teacher and User account (Admin only)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  teachersController.deleteTeacher,
);

module.exports = router;
