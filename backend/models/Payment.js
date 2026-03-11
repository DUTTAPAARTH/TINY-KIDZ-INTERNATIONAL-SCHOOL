const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    feeRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeRecord",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      enum: ["Cash", "UPI", "Cheque", "DD", "Bank Transfer"],
      required: true,
      default: "Cash",
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      alias: "receiptNo",
    },
    chequeNumber: {
      type: String,
      trim: true,
      alias: "chequeNo",
    },
    bankName: {
      type: String,
      trim: true,
      alias: "bank",
    },
    transactionId: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      alias: "date",
    },
    note: {
      type: String,
      trim: true,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

paymentSchema.index({ feeRecordId: 1, paymentDate: -1 });
paymentSchema.index({ studentId: 1, paymentDate: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
