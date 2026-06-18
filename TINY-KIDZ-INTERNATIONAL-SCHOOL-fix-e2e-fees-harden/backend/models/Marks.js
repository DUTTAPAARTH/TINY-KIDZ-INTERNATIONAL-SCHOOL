const mongoose = require("mongoose");
require("./Subject");

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student ID is required"],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject ID is required"],
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Teacher ID is required"],
    },
    marksObtained: {
      type: Number,
      min: [0, "Marks cannot be negative"],
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: [1, "Total marks must be at least 1"],
    },
    percentage: {
      type: Number,
    },
    grade: {
      type: String,
      default: "F",
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      default: "Present",
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    examType: {
      type: String,
      required: [true, "Exam type is required"],
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [
        /^\d{4}-\d{2}$/,
        "Academic year must be in format YYYY-YY (e.g., 2024-25)",
      ],
    },
    examDate: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, "Remarks cannot exceed 500 characters"],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

marksSchema.index({ studentId: 1 });
marksSchema.index({ subjectId: 1 });
marksSchema.index({ classId: 1 });
marksSchema.index({ academicYear: 1 });
marksSchema.index(
  { studentId: 1, subjectId: 1, academicYear: 1, examType: 1 },
  { unique: true, name: "unique_student_subject_exam" }
);

marksSchema.virtual("effectivePercentage").get(function () {
  if (this.status === "Absent" || this.marksObtained === undefined || this.marksObtained === null) return null;
  return Number(((this.marksObtained / this.totalMarks) * 100).toFixed(2));
});

marksSchema.pre("save", function (next) {
  if (this.status === "Absent") {
    this.marksObtained = null;
    this.percentage = null;
    this.grade = "F";
  } else if (this.marksObtained !== undefined && this.marksObtained !== null && this.totalMarks) {
    this.percentage = Number(((this.marksObtained / this.totalMarks) * 100).toFixed(2));
  }
  next();
});

module.exports = mongoose.models.Marks || mongoose.model("Marks", marksSchema);
