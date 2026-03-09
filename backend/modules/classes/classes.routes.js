const express = require("express");
const router = express.Router();
const classesController = require("./classes.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

// GET /api/classes - Get all classes (All authenticated users)
router.get("/", protect, classesController.getAllClasses);

// GET /api/classes/:id - Get single class (All authenticated users)
router.get("/:id", protect, classesController.getClass);

// POST /api/classes - Create class (Admin only)
router.post("/", protect, authorize("admin"), classesController.createClass);

// PUT /api/classes/:id - Update class (Admin only)
router.put("/:id", protect, authorize("admin"), classesController.updateClass);

// DELETE /api/classes/:id - Delete class (Admin only)
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  classesController.deleteClass,
);

module.exports = router;
