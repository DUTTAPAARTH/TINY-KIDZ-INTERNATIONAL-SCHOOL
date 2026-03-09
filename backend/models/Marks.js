const mongoose = require("mongoose");

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
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: [true, "Teacher ID is required"],
    },
    marksObtained: {
      type: Number,
      required: [true, "Marks obtained is required"],
      min: [0, "Marks cannot be negative"],
      max: [100, "Marks cannot exceed 100"],
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: [1, "Total marks must be at least 1"],
    },
    percentage: {
      type: Number,
      default: function () {
        return ((this.marksObtained / this.totalMarks) * 100).toFixed(2);
      },
    },
    grade: {
      type: String,
      enum: {
        values: ["A+", "A", "B+", "B", "C+", "C", "D", "F"],
        message: "Grade must be one of: A+, A, B+, B, C+, C, D, F",
      },
      default: function () {
        const percentage = (this.marksObtained / this.totalMarks) * 100;
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 50) return "C+";
        if (percentage >= 40) return "C";
        if (percentage >= 30) return "D";
        return "F";
      },
    },
    examType: {
      type: String,
      enum: {
        values: ["Unit Test", "Mid-Term", "Final Exam", "Quiz", "Assignment"],
        message:
          "Exam type must be one of: Unit Test, Mid-Term, Final Exam, Quiz, Assignment",
      },
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
      required: [true, "Exam date is required"],
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
  },
);

// Index for finding marks by student
marksSchema.index({ studentId: 1 });

// Index for finding marks by subject
marksSchema.index({ subjectId: 1 });

// Index for finding marks by academic year
marksSchema.index({ academicYear: 1 });

// Compound index for unique marks per student-subject combo per academic year
marksSchema.index(
  { studentId: 1, subjectId: 1, academicYear: 1, examType: 1 },
  { unique: true, name: "unique_student_subject_exam" },
);

// Virtual: isPassed - returns true if student passed
marksSchema.virtual("isPassed").get(function () {
  const percentage = (this.marksObtained / this.totalMarks) * 100;
  return percentage >= 40; // Assuming 40% is passing grade
});

// Virtual: fullMarksInfo - returns formatted string
marksSchema.virtual("fullMarksInfo").get(function () {
  return `${this.marksObtained}/${this.totalMarks} (${this.percentage}%)`;
});

// Static method: findByStudent - get all marks for a student
marksSchema.statics.findByStudent = function (studentId) {
  return this.find({ studentId })
    .populate("subjectId", "name code")
    .populate("addedBy", "name email")
    .sort({ examDate: -1 });
};

// Static method: findByAcademicYear
marksSchema.statics.findByAcademicYear = function (year) {
  return this.find({ academicYear: year })
    .populate("studentId", "name enrollmentNumber")
    .populate("subjectId", "name code")
    .sort({ examDate: -1 });
};

// Static method: findAverageByStudent - get average marks for a student
marksSchema.statics.findAverageByStudent = function (studentId) {
  return this.aggregate([
    { $match: { studentId: mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: "$studentId",
        averageMarks: { $avg: "$marksObtained" },
        totalMarks: { $first: "$totalMarks" },
        examCount: { $sum: 1 },
      },
    },
  ]);
};

// Instance method: updateGrade - recalculate grade based on marks
marksSchema.methods.updateGrade = function () {
  const percentage = (this.marksObtained / this.totalMarks) * 100;
  if (percentage >= 90) this.grade = "A+";
  else if (percentage >= 80) this.grade = "A";
  else if (percentage >= 70) this.grade = "B+";
  else if (percentage >= 60) this.grade = "B";
  else if (percentage >= 50) this.grade = "C+";
  else if (percentage >= 40) this.grade = "C";
  else if (percentage >= 30) this.grade = "D";
  else this.grade = "F";

  return this.save();
};

module.exports = mongoose.models.Marks || mongoose.model("Marks", marksSchema);
