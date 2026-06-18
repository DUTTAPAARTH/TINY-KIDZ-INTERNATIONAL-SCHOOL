const mongoose = require("mongoose");

const gradingScaleSchema = new mongoose.Schema(
  {
    minMarks: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    grade: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const gradingPolicySchema = new mongoose.Schema(
  {
    gradingScale: {
      type: [gradingScaleSchema],
      default: [
        { minMarks: 90, maxMarks: 100, grade: "A", description: "Excellent" },
        { minMarks: 80, maxMarks: 89, grade: "B", description: "Good" },
        { minMarks: 70, maxMarks: 79, grade: "C", description: "Satisfactory" },
        { minMarks: 60, maxMarks: 69, grade: "D", description: "Needs Improvement" },
        { minMarks: 0, maxMarks: 59, grade: "F", description: "Fail" },
      ],
    },
    passingMarks: {
      type: Number,
      default: 35,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GradingPolicy", gradingPolicySchema);
