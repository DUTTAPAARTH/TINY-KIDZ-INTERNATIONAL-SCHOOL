const express = require("express");
const protect = require("../../middleware/auth");
const authorize = require("../../middleware/role");
const {
  getAllStructures,
  createStructure,
  updateStructure,
  deleteStructure,
} = require("./feeStructure.controller");
const {
  generateFeesForClass,
  generateFeesForSchool,
  generateFeesForClassRange,
  generateFeeForStudent,
  getStudentFeeRecords,
  getClassFeeRecords,
  updateOverdueStatus,
  cleanupZeroRecords,
  fixStatuses,
} = require("./feeRecord.controller");
const {
  getFeeSummary,
  getClassWiseReport,
  getQuarterWiseReport,
  getMonthlyCollection,
  getFeeTypeWiseReport,
  getDefaultersReport,
  exportFeeData,
  getDefaultersFull,
} = require("./reports.controller");
const {
  recordPayment,
  getPaymentHistory,
  getPaymentById,
  getTodayCollection,
  deletePayment,
  getDemandSlip,
  getReceipt,
  getStudentReceipts,
} = require("./payment.controller");

const router = express.Router();

// All routes are protected.
router.use(protect);

// Phase 1 - Fee Structure (Admin)
router.get("/structure", authorize("admin"), getAllStructures);
router.post("/structure", authorize("admin"), createStructure);
router.put("/structure/:id", authorize("admin"), updateStructure);
router.delete("/structure/:id", authorize("admin"), deleteStructure);

// Phase 2 - Generate Fee Records (Admin)
router.post("/generate/class", authorize("admin"), generateFeesForClass);
router.post("/generate/school", authorize("admin"), generateFeesForSchool);
router.post("/generate/range", authorize("admin"), generateFeesForClassRange);
router.post("/generate/student", authorize("admin"), generateFeeForStudent);
router.get("/", authorize("admin"), getClassFeeRecords);
router.get("/class/:classId", authorize("admin"), getClassFeeRecords);
router.get("/defaulters", authorize("admin"), getDefaultersFull);
router.put("/update-overdue", authorize("admin"), updateOverdueStatus);
router.delete("/cleanup", authorize("admin"), cleanupZeroRecords);
router.delete("/cleanup-zero-records", authorize("admin"), cleanupZeroRecords);
router.get("/fix-statuses", authorize("admin"), fixStatuses);

// Phase 5 - Reports and Analytics (Admin)
router.get("/reports/summary", authorize("admin"), getFeeSummary);
router.get("/reports/class-wise", authorize("admin"), getClassWiseReport);
router.get("/reports/quarter-wise", authorize("admin"), getQuarterWiseReport);
router.get("/reports/monthly", authorize("admin"), getMonthlyCollection);
router.get("/reports/feetype-wise", authorize("admin"), getFeeTypeWiseReport);
router.get("/reports/defaulters", authorize("admin"), getDefaultersReport);
router.get("/reports/export", authorize("admin"), exportFeeData);

// Phase 3 - Payment Recording
router.post("/payment", authorize("admin"), recordPayment);
router.get("/payment/today", authorize("admin"), getTodayCollection);
router.get("/payment/student/:id", getPaymentHistory);
router.get("/payment/:id", getPaymentById);
router.delete("/payment/:id", authorize("admin"), deletePayment);
router.get("/demand-slip/:studentId", getDemandSlip);
router.get("/receipt/student/:studentId", getStudentReceipts);
router.get("/receipt/:paymentId", getReceipt);

// Admin + Student own records (validated in controller)
router.get("/student/:studentId", getStudentFeeRecords);

module.exports = router;
