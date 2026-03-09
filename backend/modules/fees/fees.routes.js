const express = require("express");
const router = express.Router();
const {
  getAllFees,
  createFee,
  getFeeByStudent,
  updateFee,
  deleteFee,
  getFeesSummary,
} = require("./fees.controller");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/role");
const Student = require("../../models/Student");

// Middleware to ensure user is authenticated
router.use(auth);

// GET all fees - Admin only
router.get("/", authorize("admin"), getAllFees);

// POST create fee record - Admin only
router.post("/", authorize("admin"), createFee);

// GET fee summary - Admin only
router.get("/summary", authorize("admin"), getFeesSummary);

// GET fee for specific student - Admin + Student (own record only)
router.get(
  "/student/:studentId",
  authorize("admin", "student"),
  async (req, res, next) => {
    try {
      if (req.user.role === "admin") return next();

      const student = await Student.findOne({ userId: req.user.id }).select(
        "_id",
      );
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      if (student._id.toString() !== req.params.studentId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Failed to validate student access" });
    }
  },
  getFeeByStudent,
);

// PUT update fee - Admin only
router.put("/:id", authorize("admin"), updateFee);

// DELETE fee - Admin only
router.delete("/:id", authorize("admin"), deleteFee);

module.exports = router;
