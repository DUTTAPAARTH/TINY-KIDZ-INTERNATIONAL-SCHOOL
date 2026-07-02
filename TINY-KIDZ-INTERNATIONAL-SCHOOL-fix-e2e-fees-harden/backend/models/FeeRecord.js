const mongoose = require("mongoose");

const STATUS = {
  DUE: "DUE",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
  OVERDUE: "OVERDUE",
};

const feeRecordSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: "2024-25",
    },
    feeType: {
      type: String,
      enum: [
        "Tuition",
        "Admission",
        "Uniform",
        "Activity",
        "Transport",
        "Miscellaneous",
        "Fine",
      ],
      required: true,
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4", "Annual", null],
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.DUE,
    },
    lateFeePerDay: {
      type: Number,
      default: 50,
      min: 0,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ["none", "percentage", "fixed"],
      default: "none",
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountReason: {
      type: String,
      trim: true,
      default: "",
    },
    netAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

feeRecordSchema.virtual("dueAmount").get(function () {
  return Math.max(
    0,
    Number(this.netAmount || this.totalAmount || 0) - Number(this.paidAmount || 0),
  );
});

feeRecordSchema.virtual("discountAmount").get(function () {
  if (this.discountType === "percentage") {
    return Math.round(Number(this.totalAmount || 0) * Number(this.discountValue || 0) / 100);
  }
  if (this.discountType === "fixed") {
    return Number(this.discountValue || 0);
  }
  return 0;
});

feeRecordSchema.set("toJSON", { virtuals: true });
feeRecordSchema.set("toObject", { virtuals: true });

feeRecordSchema.index(
  { studentId: 1, feeType: 1, quarter: 1, academicYear: 1 },
  { unique: true },
);
feeRecordSchema.index({ classId: 1, academicYear: 1, dueDate: 1 });
feeRecordSchema.index({ classId: 1, status: 1, dueDate: 1 });
feeRecordSchema.index({ classId: 1, feeType: 1, dueDate: 1 });

feeRecordSchema.pre("save", function () {
  if (this.isModified("totalAmount") || this.isModified("discountType") || this.isModified("discountValue")) {
    if (this.discountType === "percentage") {
      this.netAmount = Math.round(Number(this.totalAmount || 0) * (100 - Number(this.discountValue || 0)) / 100);
    } else if (this.discountType === "fixed") {
      this.netAmount = Math.max(0, Number(this.totalAmount || 0) - Number(this.discountValue || 0));
    } else {
      this.netAmount = Number(this.totalAmount || 0);
    }
  }
  if (!this.netAmount) this.netAmount = Number(this.totalAmount || 0);

  const total = Number(this.netAmount || this.totalAmount || 0);
  const paid = Number(this.paidAmount || 0);
  const today = new Date();
  const due = this.dueDate ? new Date(this.dueDate) : null;

  if (total <= 0) {
    this.paidAmount = 0;
    this.status = STATUS.PAID;
  } else if (paid >= total) {
    this.paidAmount = total;
    this.status = STATUS.PAID;
  } else if (paid > 0 && paid < total) {
    this.status = STATUS.PARTIAL;
  } else if (paid === 0 && due && today > due) {
    this.status = STATUS.OVERDUE;
  } else {
    this.status = STATUS.DUE;
  }
});

module.exports = mongoose.model("FeeRecord", feeRecordSchema);
