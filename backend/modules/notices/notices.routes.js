const express = require("express");
const {
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
} = require("./notices.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

const router = express.Router();

// Get all notices (filtered by role) - all authenticated users
router.get("/", protect, getNotices);

// Create notice - admin only
router.post("/", protect, authorize("admin"), createNotice);

// Update notice - admin only
router.put("/:id", protect, authorize("admin"), updateNotice);

// Delete notice - admin only
router.delete("/:id", protect, authorize("admin"), deleteNotice);

module.exports = router;
