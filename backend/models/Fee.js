const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  method: {
    type: String,
    enum: ["Cash", "Cheque", "Online"],
    default: "Cash",
  },
  note: {
    type: String,
    optional: true,
  },
});

const feeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: "2024-25",
    },
    totalFee: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Unpaid"],
      default: "Unpaid",
    },
    payments: [paymentSchema],
  },
  { timestamps: true },
);

// Virtual field for dueAmount
feeSchema.virtual("dueAmount").get(function () {
  return this.totalFee - this.paidAmount;
});

// Ensure virtuals are included in JSON
feeSchema.set("toJSON", { virtuals: true });

// Compound unique index on studentId and academicYear
feeSchema.index({ studentId: 1, academicYear: 1 }, { unique: true });

// Auto-calculate status before saving
feeSchema.pre("save", function (next) {
  if (this.paidAmount === 0) {
    this.status = "Unpaid";
  } else if (this.paidAmount >= this.totalFee) {
    this.status = "Paid";
    this.paidAmount = this.totalFee; // Ensure paidAmount doesn't exceed totalFee
  } else {
    this.status = "Partial";
  }
  next();
});

module.exports = mongoose.model("Fee", feeSchema);
