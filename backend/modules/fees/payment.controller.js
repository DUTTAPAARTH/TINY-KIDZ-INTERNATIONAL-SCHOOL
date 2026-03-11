const FeeRecord = require("../../models/FeeRecord");
const Payment = require("../../models/Payment");
const Student = require("../../models/Student");
const Class = require("../../models/Class");

const getStudentProfile = async (studentId) => {
  const student = await Student.findById(studentId)
    .populate("userId", "name")
    .lean();

  if (!student) {
    return null;
  }

  const classDoc = student.classId
    ? await Class.findById(student.classId).select("className section").lean()
    : null;

  return {
    student,
    classDoc,
    studentName: student.userId?.name || student.studentName || "Student",
    admissionNumber: student.admissionNumber || student.admissionNo || "-",
    parentName: student.parentName || student.fatherName || student.guardianName || "N/A",
    parentPhone: student.parentPhone || student.guardianPhone || student.phone || "N/A",
    className: classDoc?.className || "N/A",
    section: classDoc?.section || "-",
  };
};

const canAccessStudent = async (req, studentId) => {
  if (req.user?.role !== "student") {
    return true;
  }

  const ownStudent = await Student.findOne({ userId: req.user.id }).select("_id");
  return Boolean(ownStudent && String(ownStudent._id) === String(studentId));
};

const normalizeDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getLateFeeDetails = ({ paymentDate, dueDate, lateFeePerDay = 0 }) => {
  const pay = normalizeDay(paymentDate);
  const due = normalizeDay(dueDate);
  const diffMs = pay.getTime() - due.getTime();
  if (diffMs <= 0) return { lateDays: 0, lateFeeAmount: 0 };

  const lateDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const lateFeeAmount = lateDays * Number(lateFeePerDay || 0);
  return { lateDays, lateFeeAmount };
};

const getNextReceiptNumber = async (year) => {
  const prefix = `TKIS-${year}-`;
  const lastPayment = await Payment.findOne({
    receiptNumber: new RegExp(`^${prefix}`),
  })
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

const recordPayment = async (req, res) => {
  try {
    const {
      feeRecordId,
      amount,
      method,
      chequeNumber,
      bankName,
      transactionId,
      paymentDate,
      note,
    } = req.body;

    if (!feeRecordId || !amount || !method) {
      return res
        .status(400)
        .json({ message: "feeRecordId, amount and method are required" });
    }

    if (Number(amount) < 1) {
      return res
        .status(400)
        .json({ message: "Payment amount must be greater than zero" });
    }

    const feeRecord = await FeeRecord.findById(feeRecordId);
    if (!feeRecord)
      return res.status(404).json({ message: "Fee record not found" });

    if (["Cheque", "DD"].includes(method)) {
      if (!chequeNumber || !bankName) {
        return res
          .status(400)
          .json({ message: "Cheque/DD requires chequeNumber and bankName" });
      }
    }

    const effectivePaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    const { lateDays, lateFeeAmount } = getLateFeeDetails({
      paymentDate: effectivePaymentDate,
      dueDate: feeRecord.dueDate,
      lateFeePerDay: feeRecord.lateFeePerDay,
    });

    const totalDue =
      Number(feeRecord.totalAmount || 0) -
      Number(feeRecord.paidAmount || 0) +
      Number(lateFeeAmount || 0);

    if (Number(amount) > totalDue) {
      return res.status(400).json({ message: "Amount exceeds total due" });
    }

    const receiptYear = effectivePaymentDate.getFullYear();
    const receiptNumber = await getNextReceiptNumber(receiptYear);

    const payment = await Payment.create({
      feeRecordId: feeRecord._id,
      studentId: feeRecord.studentId,
      classId: feeRecord.classId,
      academicYear: feeRecord.academicYear,
      amount: Number(amount),
      method,
      receiptNumber,
      chequeNumber,
      bankName,
      transactionId,
      paymentDate: effectivePaymentDate,
      note,
      lateFeeAmount,
      lateDays,
      recordedBy: req.user?.id,
    });

    feeRecord.paidAmount = Number(feeRecord.paidAmount || 0) + Number(amount);
    feeRecord.lateFeeAmount = Number(lateFeeAmount || 0);

    if (feeRecord.paidAmount >= Number(feeRecord.totalAmount || 0)) {
      feeRecord.status = "PAID";
    } else if (feeRecord.paidAmount > 0) {
      feeRecord.status = "PARTIAL";
    } else if (new Date() > new Date(feeRecord.dueDate)) {
      feeRecord.status = "OVERDUE";
    } else {
      feeRecord.status = "DUE";
    }

    await feeRecord.save();

    return res.status(201).json({
      message: "Payment recorded successfully",
      receiptNumber,
      payment,
      lateFeeAmount,
      lateDays,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to record payment", error: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.params.id;

    if (req.user?.role === "student") {
      const ownStudent = await Student.findOne({ userId: req.user.id }).select(
        "_id",
      );
      if (!ownStudent || String(ownStudent._id) !== String(studentId)) {
        return res
          .status(403)
          .json({ message: "You can only view your own payment history" });
      }
    }

    const payments = await Payment.find({ studentId })
      .populate("feeRecordId", "feeType quarter description")
      .sort({ paymentDate: -1 });

    return res.json(payments);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch payment history", error: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("feeRecordId")
      .populate({
        path: "studentId",
        select: "admissionNumber userId",
        populate: { path: "userId", select: "name" },
      })
      .populate("classId", "className section")
      .populate("recordedBy", "name email role");

    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (req.user?.role === "student") {
      const ownStudent = await Student.findOne({ userId: req.user.id }).select(
        "_id",
      );
      if (!ownStudent || String(ownStudent._id) !== String(payment.studentId?._id || payment.studentId)) {
        return res
          .status(403)
          .json({ message: "You can only view your own payments" });
      }
    }

    return res.json(payment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch payment", error: error.message });
  }
};

const getTodayCollection = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const payments = await Payment.find({
      paymentDate: { $gte: start, $lt: end },
    }).select("amount method");

    const breakdown = {
      Cash: 0,
      UPI: 0,
      Cheque: 0,
      DD: 0,
      "Bank Transfer": 0,
    };

    let totalAmount = 0;
    for (const p of payments) {
      const amt = Number(p.amount || 0);
      totalAmount += amt;
      if (breakdown[p.method] !== undefined) breakdown[p.method] += amt;
    }

    return res.json({
      totalAmount,
      count: payments.length,
      breakdown,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch today's collection", error: error.message });
  }
};

const getDemandSlip = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!(await canAccessStudent(req, studentId))) {
      return res.status(403).json({ message: "You can only view your own demand slip" });
    }

    const profile = await getStudentProfile(studentId);
    if (!profile) {
      return res.status(404).json({ message: "Student not found" });
    }

    const feeRecords = await FeeRecord.find({
      studentId,
      status: { $ne: "PAID" },
    })
      .sort({ dueDate: 1, createdAt: 1 })
      .lean();

    const generatedAt = new Date();

    const items = feeRecords.map((record) => {
      const dueAmount = Math.max(
        0,
        Number(record.totalAmount || 0) - Number(record.paidAmount || 0),
      );
      const { lateDays, lateFeeAmount } = getLateFeeDetails({
        paymentDate: generatedAt,
        dueDate: record.dueDate,
        lateFeePerDay: record.lateFeePerDay,
      });

      return {
        ...record,
        dueAmount,
        lateDays,
        lateFeeAmount,
        totalPayable: dueAmount + lateFeeAmount,
      };
    });

    const totalDue = items.reduce((sum, item) => sum + Number(item.dueAmount || 0), 0);
    const totalLateFee = items.reduce((sum, item) => sum + Number(item.lateFeeAmount || 0), 0);
    const totalPayable = totalDue + totalLateFee;
    const nearestDueDate = items[0]?.dueDate || null;
    const academicYear = items[0]?.academicYear || profile.student.academicYear || "-";

    return res.json({
      student: {
        id: profile.student._id,
        name: profile.studentName,
        admissionNumber: profile.admissionNumber,
        parentName: profile.parentName,
        parentPhone: profile.parentPhone,
        className: profile.className,
        section: profile.section,
      },
      academicYear,
      generatedAt,
      nearestDueDate,
      lateFeePerDay: items[0]?.lateFeePerDay || 0,
      items,
      totals: {
        totalDue,
        totalLateFee,
        totalPayable,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch demand slip", error: error.message });
  }
};

const getReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate("feeRecordId")
      .populate({
        path: "studentId",
        select: "admissionNumber userId parentName parentPhone fatherName guardianName guardianPhone phone",
        populate: { path: "userId", select: "name" },
      })
      .populate("classId", "className section")
      .populate("recordedBy", "name email role");

    if (!payment) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (!(await canAccessStudent(req, payment.studentId?._id || payment.studentId))) {
      return res.status(403).json({ message: "You can only view your own receipts" });
    }

    return res.json(payment);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch receipt", error: error.message });
  }
};

const getStudentReceipts = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!(await canAccessStudent(req, studentId))) {
      return res.status(403).json({ message: "You can only view your own receipts" });
    }

    const payments = await Payment.find({ studentId })
      .populate("feeRecordId", "feeType quarter description totalAmount paidAmount status")
      .populate({
        path: "studentId",
        select: "admissionNumber userId parentName parentPhone fatherName guardianName guardianPhone phone",
        populate: { path: "userId", select: "name" },
      })
      .populate("classId", "className section")
      .populate("recordedBy", "name email role")
      .sort({ paymentDate: -1 });

    return res.json(payments);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to fetch student receipts", error: error.message });
  }
};

const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const feeRecord = await FeeRecord.findById(payment.feeRecordId);
    if (!feeRecord) {
      await Payment.findByIdAndDelete(id);
      return res.json({ message: "Payment deleted, fee record not found" });
    }

    feeRecord.paidAmount = Math.max(
      0,
      Number(feeRecord.paidAmount || 0) - Number(payment.amount || 0),
    );

    const dueDate = new Date(feeRecord.dueDate);
    if (feeRecord.paidAmount >= Number(feeRecord.totalAmount || 0)) {
      feeRecord.status = "PAID";
    } else if (feeRecord.paidAmount > 0) {
      feeRecord.status = "PARTIAL";
    } else if (new Date() > dueDate) {
      feeRecord.status = "OVERDUE";
    } else {
      feeRecord.status = "DUE";
    }

    await feeRecord.save();
    await Payment.findByIdAndDelete(id);

    return res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to delete payment", error: error.message });
  }
};

module.exports = {
  recordPayment,
  getPaymentHistory,
  getPaymentById,
  getTodayCollection,
  deletePayment,
  getDemandSlip,
  getReceipt,
  getStudentReceipts,
};
