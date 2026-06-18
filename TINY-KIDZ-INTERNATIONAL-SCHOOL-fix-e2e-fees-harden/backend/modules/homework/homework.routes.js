const express = require("express");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");
const {
  getByClass,
  getAllHomework,
  createHomework,
  updateHomework,
  deleteHomework,
  getUpcoming,
} = require("./homework.controller");

const router = express.Router();

// GET /api/homework - Teacher: list homework (with ?assignedBy=me&classId=)
router.get("/", protect, authorize("teacher"), getAllHomework);

// GET /api/homework/class/:classId - Teacher+Student: get all homework for a class
router.get(
  "/class/:classId",
  protect,
  authorize("teacher", "student"),
  getByClass,
);

// GET /api/homework/upcoming/:classId - Teacher+Student: get upcoming homework
router.get(
  "/upcoming/:classId",
  protect,
  authorize("teacher", "student"),
  getUpcoming,
);

// POST /api/homework - Teacher: assign new homework
router.post("/", protect, authorize("teacher"), createHomework);

// PUT /api/homework/:id - Teacher: update homework
router.put("/:id", protect, authorize("teacher"), updateHomework);

// DELETE /api/homework/:id - Admin+Teacher: delete homework
router.delete("/:id", protect, authorize("admin", "teacher"), deleteHomework);

module.exports = router;
