const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      enum: ["English", "Hindi", "Math", "Science", "Social Studies", "Computer", "Punjabi", "Art", "PE"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attachmentLink: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Sort by dueDate ascending
homeworkSchema.index({ classId: 1, dueDate: 1 });

module.exports = mongoose.model("Homework", homeworkSchema);
