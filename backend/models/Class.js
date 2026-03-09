const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      minlength: [1, "Class name cannot be empty"],
      maxlength: [50, "Class name cannot exceed 50 characters"],
    },
    section: {
      type: String,
      required: [true, "Section is required"],
      trim: true,
      uppercase: true,
      enum: {
        values: ["A", "B", "C", "D", "E", "F"],
        message: "Section must be one of: A, B, C, D, E, F",
      },
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [
        /^\d{4}-\d{2,4}$/,
        "Academic year must be in format YYYY-YY or YYYY-YYYY (e.g., 2024-25 or 2024-2025)",
      ],
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Unique compound index on className + section + academicYear
classSchema.index(
  { className: 1, section: 1, academicYear: 1 },
  {
    unique: true,
    name: "unique_class_section_year",
    sparse: true,
  },
);

// Index for finding classes by academic year
classSchema.index({ academicYear: 1 });

// Virtual: fullName - returns "Class 3 - A (2024-25)"
classSchema.virtual("fullName").get(function () {
  return `${this.className} - ${this.section} (${this.academicYear})`;
});

// Virtual: studentCount - returns number of students in the class
classSchema.virtual("studentCount").get(function () {
  return this.students ? this.students.length : 0;
});

// Static method: findByAcademicYear - returns all classes for a given academic year
classSchema.statics.findByAcademicYear = function (year) {
  return this.find({ academicYear: year })
    .populate("classTeacher", "name email")
    .populate("students", "name email")
    .populate("subjects", "name code");
};

// Static method: findActiveByAcademicYear - returns all active classes for a given academic year
classSchema.statics.findActiveByAcademicYear = function (year) {
  return this.find({ academicYear: year, isActive: true })
    .populate("classTeacher", "name email")
    .populate("students", "name email")
    .populate("subjects", "name code");
};

// Pre-save middleware to validate uniqueness before saving
classSchema.pre("save", async function () {
  // Only check if the class-specific fields are being modified
  if (
    !this.isNew &&
    !this.isModified("className") &&
    !this.isModified("section") &&
    !this.isModified("academicYear")
  ) {
    return;
  }

  const existingClass = await mongoose.models.Class.findOne({
    className: this.className,
    section: this.section,
    academicYear: this.academicYear,
    _id: { $ne: this._id }, // Exclude current document
  });

  if (existingClass) {
    throw new Error(
      `Class "${this.className} - ${this.section} (${this.academicYear})" already exists`,
    );
  }
});

// Pre-populate middleware disabled - uncomment if needed for frontend queries
// classSchema.pre(/^find/, function (next) {
//   if (this.options._recursed) {
//     return next();
//   }
//   if (this.getOptions().includeAll !== false) {
//     this.populate('classTeacher', 'name email phone')
//       .populate('students', 'name email enrollmentNumber')
//       .populate('subjects', 'name code');
//   }
//   next();
// });

// Instance method: add student to class
classSchema.methods.addStudent = function (studentId) {
  if (!this.students.includes(studentId)) {
    this.students.push(studentId);
  }
  return this.save();
};

// Instance method: remove student from class
classSchema.methods.removeStudent = function (studentId) {
  this.students = this.students.filter(
    (id) => id.toString() !== studentId.toString(),
  );
  return this.save();
};

// Instance method: add subject to class
classSchema.methods.addSubject = function (subjectId) {
  if (!this.subjects.includes(subjectId)) {
    this.subjects.push(subjectId);
  }
  return this.save();
};

// Instance method: remove subject from class
classSchema.methods.removeSubject = function (subjectId) {
  this.subjects = this.subjects.filter(
    (id) => id.toString() !== subjectId.toString(),
  );
  return this.save();
};

// Instance method: assign class teacher
classSchema.methods.assignClassTeacher = function (teacherId) {
  this.classTeacher = teacherId;
  return this.save();
};

// Instance method: remove class teacher
classSchema.methods.removeClassTeacher = function () {
  this.classTeacher = null;
  return this.save();
};

module.exports = mongoose.model("Class", classSchema);
