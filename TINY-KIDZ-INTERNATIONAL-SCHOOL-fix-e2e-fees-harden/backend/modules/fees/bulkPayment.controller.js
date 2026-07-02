const FeeRecord = require("../../models/FeeRecord");
const Payment = require("../../models/Payment");
const Student = require("../../models/Student");
const Class = require("../../models/Class");

const getNextReceiptNumber = async (year) => {
  const prefix = `TKIS-${year}-`;
  const lastPayment = await Payment.findOne({ receiptNumber: new RegExp(`^${prefix}`) })
    .sort({ createdAt: -1 })
    .select("receiptNumber");
  let nextCounter = 1;
  if (lastPayment?.receiptNumber) {
    const parts = lastPayment.receiptNumber.split("-");
    const parsed = Number(parts[parts.length - 1]);
    if (!Number.isNaN(parsed)) nextCounter = parsed + 1;
  }
  return `${prefix}${String(nextCounter).padStart(4, "0")}`;
};

const recordBulkPayment = async (req, res) => {
  try {
    const { classId, academicYear, feeType, quarter, amount, method, paymentDate, note, studentIds } = req.body;

    if (!classId) return res.status(400).json({ message: "Class is required" });
    if (!amount || Number(amount) < 1) return res.status(400).json({ message: "Valid amount is required" });
    if (!method) return res.status(400).json({ message: "Payment method is required" });

    let targetStudents;
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      targetStudents = studentIds;
    } else {
      const students = await Student.find({ classId, isActive: true }).select("_id").lean();
      targetStudents = students.map((s) => s._id);
    }

    if (!targetStudents.length) {
      return res.status(404).json({ message: "No students found in this class" });
    }

    const filter = { studentId: { $in: targetStudents }, classId, academicYear };
    if (feeType) filter.feeType = feeType;
    if (quarter) filter.quarter = quarter;

    const feeRecords = await FeeRecord.find(filter).sort({ studentId: 1 });
    if (!feeRecords.length) {
      return res.status(404).json({ message: "No matching fee records found. Generate fee records first." });
    }

    const effectiveDate = paymentDate ? new Date(paymentDate) : new Date();
    const receiptYear = effectiveDate.getFullYear();
    let receiptNumber = await getNextReceiptNumber(receiptYear);
    const created = [];
    const errors = [];
    let counter = 0;

    for (const feeRecord of feeRecords) {
      try {
        const dueAmount = Number(feeRecord.netAmount || feeRecord.totalAmount || 0) - Number(feeRecord.paidAmount || 0);
        if (dueAmount <= 0) {
          errors.push({ studentId: feeRecord.studentId, reason: "Already fully paid", feeType: feeRecord.feeType, quarter: feeRecord.quarter });
          continue;
        }

        const payAmount = Math.min(Number(amount), dueAmount);

        const payment = await Payment.create({
          feeRecordId: feeRecord._id,
          studentId: feeRecord.studentId,
          classId: feeRecord.classId,
          academicYear,
          amount: payAmount,
          method,
          receiptNumber: receiptNumber,
          paymentDate: effectiveDate,
          note: note || `Bulk payment - ${feeRecord.feeType}${feeRecord.quarter ? " " + feeRecord.quarter : ""}`,
          recordedBy: req.user?.id,
        });

        feeRecord.paidAmount = Number(feeRecord.paidAmount || 0) + payAmount;
        await feeRecord.save();

        created.push(payment);
        receiptNumber = await getNextReceiptNumber(receiptYear + (++counter > 50 ? 1 : 0));
      } catch (err) {
        errors.push({ studentId: feeRecord.studentId, reason: err.message, feeType: feeRecord.feeType });
      }
    }

    const totalAmount = created.reduce((s, p) => s + Number(p.amount || 0), 0);

    return res.status(created.length ? 201 : 400).json({
      message: `Created ${created.length} payment(s)${errors.length ? `, ${errors.length} error(s)` : ""}`,
      totalAmount,
      count: created.length,
      errors: errors.length ? errors : undefined,
      payments: created.map((p) => ({
        _id: p._id,
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        studentId: p.studentId,
        feeRecordId: p.feeRecordId,
        method: p.method,
        paymentDate: p.paymentDate,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to record bulk payment", error: error.message });
  }
};

module.exports = { recordBulkPayment };
