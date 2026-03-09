const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher/Admin is required"],
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks cannot be negative"],
      max: [100, "Marks cannot exceed totalMarks"],
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
      min: [1, "Total marks must be at least 1"],
    },
    examType: {
      type: String,
      enum: {
        values: ["Unit Test", "Mid Term", "Final", "Project"],
        message:
          "Exam type must be one of: Unit Test, Mid Term, Final, Project",
      },
      default: "Unit Test",
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      default: "2024-25",
      trim: true,
      match: [
        /^\d{4}-\d{2}$/,
        "Academic year must be in format YYYY-YY (e.g., 2024-25)",
      ],
    },
    examDate: {
      type: Date,
      required: [true, "Exam date is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: percentage - (marksObtained/totalMarks)*100
marksSchema.virtual("percentage").get(function () {
  if (this.totalMarks === 0) return 0;
  return ((this.marksObtained / this.totalMarks) * 100).toFixed(2);
});

// Virtual: grade - A+ if ≥90, A if ≥80, B+ if ≥70, B if ≥60, C if below
marksSchema.virtual("grade").get(function () {
  const percentage = (this.marksObtained / this.totalMarks) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  return "C";
});

// Index for finding marks by student
marksSchema.index({ studentId: 1 });

// Index for finding marks by subject
marksSchema.index({ subjectId: 1 });

// Index for finding marks by academic year
marksSchema.index({ academicYear: 1 });

// Compound index for student and academic year
marksSchema.index({ studentId: 1, academicYear: 1 });

module.exports = mongoose.model("Marks", marksSchema);
