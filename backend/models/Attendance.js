const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        status: {
          type: String,
          enum: ["Present", "Absent", "Late"],
          required: true,
        },
      },
    ],
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Index for finding attendance by class and date
attendanceSchema.index({ classId: 1, date: 1 }, { unique: true });

// Index for finding attendance by class
attendanceSchema.index({ classId: 1 });

// Index for finding attendance by date
attendanceSchema.index({ date: 1 });

// Index for finding attendance by student
attendanceSchema.index({ "records.studentId": 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
