const mongoose = require("mongoose");

const examConfigSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    configs: [
      {
        examType: { type: String, required: true },
        totalMarks: { type: Number, required: true, default: 100, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

examConfigSchema.index({ classId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model("ExamConfig", examConfigSchema);
