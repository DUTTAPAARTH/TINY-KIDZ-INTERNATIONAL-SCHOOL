const Fee = require("../../models/Fee");
const Student = require("../../models/Student");

const studentPopulate = {
  path: "studentId",
  select: "admissionNumber classId userId",
  populate: [
    {
      path: "userId",
      select: "name email",
    },
    {
      path: "classId",
      select: "className section classCode",
    },
  ],
};

// Get all fees with student details (Admin only)
const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate(studentPopulate)
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (err) {
    console.error("Error fetching fees:", err);
    res.status(500).json({ message: "Failed to fetch fees" });
  }
};

// Create a new fee record (Admin only)
const createFee = async (req, res) => {
  const { studentId, academicYear, totalFee } = req.body;

  try {
    // Validate required fields
    if (!studentId || !totalFee) {
      return res
        .status(400)
        .json({ message: "Student ID and Total Fee are required" });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check for duplicate fee record for same student and academic year
    const existingFee = await Fee.findOne({
      studentId,
      academicYear: academicYear || "2024-25",
    });

    if (existingFee) {
      return res.status(400).json({
        message: `Fee record already exists for this student in ${academicYear || "2024-25"}`,
      });
    }

    // Create new fee record
    const newFee = new Fee({
      studentId,
      academicYear: academicYear || "2024-25",
      totalFee,
      paidAmount: 0,
      status: "Unpaid",
      payments: [],
    });

    await newFee.save();

    // Populate student details before sending response
    await newFee.populate({
      path: "studentId",
      select: "admissionNumber classId userId",
      populate: [
        {
          path: "userId",
          select: "name email",
        },
        {
          path: "classId",
          select: "className section classCode",
        },
      ],
    });

    res.status(201).json(newFee);
  } catch (err) {
    console.error("Error creating fee record:", err);
    res.status(500).json({ message: "Failed to create fee record" });
  }
};

// Get fee record for a specific student (Admin + Student's own record)
const getFeeByStudent = async (req, res) => {
  const { studentId } = req.params;

  try {
    // Check if student is accessing their own record or is admin
    if (req.user.role === "student" && req.user.id !== studentId) {
      return res
        .status(403)
        .json({ message: "You can only access your own fee record" });
    }

    const fees = await Fee.find({ studentId })
      .populate(studentPopulate)
      .sort({ academicYear: -1 });

    if (!fees || fees.length === 0) {
      return res
        .status(404)
        .json({ message: "No fee records found for this student" });
    }

    res.json(fees);
  } catch (err) {
    console.error("Error fetching student fees:", err);
    res.status(500).json({ message: "Failed to fetch student fees" });
  }
};

// Add payment to fee record or update fee details (Admin only)
const updateFee = async (req, res) => {
  const { id } = req.params;
  const { payment, totalFee } = req.body;

  try {
    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    // If adding a payment
    if (payment) {
      const { amount, method, note, date } = payment;

      if (!amount || amount <= 0) {
        return res
          .status(400)
          .json({ message: "Payment amount is required and must be positive" });
      }

      fee.payments.push({
        amount,
        method: method || "Cash",
        note,
        date: date ? new Date(date) : new Date(),
      });

      // Recalculate paidAmount as sum of all payments
      fee.paidAmount = fee.payments.reduce((sum, p) => sum + p.amount, 0);

      // Status is auto-calculated in pre-save middleware
      await fee.save();

      res.json(fee);
    }
    // If updating fee details
    else if (totalFee !== undefined) {
      fee.totalFee = totalFee;
      // Status is auto-calculated in pre-save middleware
      await fee.save();

      res.json(fee);
    } else {
      res
        .status(400)
        .json({ message: "Either payment or totalFee update is required" });
    }
  } catch (err) {
    console.error("Error updating fee:", err);
    res.status(500).json({ message: "Failed to update fee record" });
  }
};

// Delete fee record (Admin only)
const deleteFee = async (req, res) => {
  const { id } = req.params;

  try {
    const fee = await Fee.findByIdAndDelete(id);
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    res.json({ message: "Fee record deleted successfully" });
  } catch (err) {
    console.error("Error deleting fee:", err);
    res.status(500).json({ message: "Failed to delete fee record" });
  }
};

// Get overall fee collection summary (Admin only)
const getFeesSummary = async (req, res) => {
  try {
    const fees = await Fee.find().populate({
      path: "studentId",
      select: "firstName lastName",
    });

    const summary = {
      totalStudents: fees.length,
      totalFeeCollected: 0,
      totalDue: 0,
      paidCount: 0,
      partialCount: 0,
      unpaidCount: 0,
      paymentMethods: {
        cash: 0,
        cheque: 0,
        online: 0,
      },
    };

    fees.forEach((fee) => {
      summary.totalFeeCollected += fee.paidAmount;
      summary.totalDue += fee.dueAmount;

      if (fee.status === "Paid") {
        summary.paidCount++;
      } else if (fee.status === "Partial") {
        summary.partialCount++;
      } else {
        summary.unpaidCount++;
      }

      // Count payment methods
      fee.payments.forEach((payment) => {
        if (payment.method === "Cash") {
          summary.paymentMethods.cash += payment.amount;
        } else if (payment.method === "Cheque") {
          summary.paymentMethods.cheque += payment.amount;
        } else if (payment.method === "Online") {
          summary.paymentMethods.online += payment.amount;
        }
      });
    });

    res.json(summary);
  } catch (err) {
    console.error("Error fetching fee summary:", err);
    res.status(500).json({ message: "Failed to fetch fee summary" });
  }
};

module.exports = {
  getAllFees,
  createFee,
  getFeeByStudent,
  updateFee,
  deleteFee,
  getFeesSummary,
};
