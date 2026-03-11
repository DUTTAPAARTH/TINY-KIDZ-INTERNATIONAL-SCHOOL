const mongoose = require("mongoose");

const currentYearDefaults = () => {
  const now = new Date();
  const year = now.getFullYear();
  return {
    q1DueDate: new Date(year, 3, 10),
    q2DueDate: new Date(year, 6, 10),
    q3DueDate: new Date(year, 9, 10),
    q4DueDate: new Date(year + 1, 0, 10),
  };
};

const feeStructureSchema = new mongoose.Schema(
  {
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
    tuitionFee: {
      type: Number,
      required: true,
      min: 0,
    },
    admissionFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniformFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    activityFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    transportFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeePerDay: {
      type: Number,
      default: 50,
      min: 0,
    },
    q1DueDate: {
      type: Date,
      default: () => currentYearDefaults().q1DueDate,
    },
    q2DueDate: {
      type: Date,
      default: () => currentYearDefaults().q2DueDate,
    },
    q3DueDate: {
      type: Date,
      default: () => currentYearDefaults().q3DueDate,
    },
    q4DueDate: {
      type: Date,
      default: () => currentYearDefaults().q4DueDate,
    },
  },
  { timestamps: true },
);

feeStructureSchema.index({ classId: 1, academicYear: 1 }, { unique: true });

feeStructureSchema.virtual("totalAnnualFee").get(function () {
  return (
    Number(this.tuitionFee || 0) +
    Number(this.admissionFee || 0) +
    Number(this.uniformFee || 0) +
    Number(this.activityFee || 0) +
    Number(this.transportFee || 0)
  );
});

feeStructureSchema.virtual("quarterlyTuition").get(function () {
  return Number(this.tuitionFee || 0) / 4;
});

feeStructureSchema.set("toJSON", { virtuals: true });
feeStructureSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
