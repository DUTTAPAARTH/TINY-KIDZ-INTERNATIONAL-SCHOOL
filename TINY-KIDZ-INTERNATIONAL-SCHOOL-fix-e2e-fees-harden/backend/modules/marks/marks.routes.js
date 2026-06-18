const express = require("express");
const router = express.Router();
const marksController = require("./marks.controller");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");

// Named routes MUST come before /:id
router.get("/examTypes", protect, marksController.getExamTypes);
router.get("/policy", protect, marksController.getGradingPolicy);
router.patch("/policy", protect, authorize("admin"), marksController.updateGradingPolicy);
router.get("/student/me", protect, authorize("student"), marksController.getMyMarks);
router.get("/student/:id", protect, marksController.getStudentMarks);
router.get("/class/:id", protect, authorize("teacher", "admin"), marksController.getClassMarks);
router.post("/entry", protect, authorize("teacher", "admin"), marksController.entryMarks);
router.post("/publish-exam", protect, authorize("teacher", "admin"), marksController.publishExam);
router.get("/assessment-matrix", protect, marksController.getAssessmentMatrix);
router.get("/exam-config", protect, marksController.getExamConfig);
router.put("/exam-config", protect, authorize("teacher", "admin"), marksController.saveExamConfig);
router.get("/subject/marks", protect, marksController.getSubjectMarks);
router.get("/subject/:subjectName", protect, marksController.getSubjectMarks);

// CRUD
router.post("/", protect, authorize("teacher", "admin"), marksController.addMarks);
router.get("/", protect, marksController.getMarks);
router.patch("/:id", protect, authorize("teacher", "admin"), marksController.updateMarks);
router.delete("/:id", protect, authorize("admin", "teacher"), marksController.deleteMarks);

module.exports = router;
