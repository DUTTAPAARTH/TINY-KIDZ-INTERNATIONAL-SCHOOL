const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, "Notice content is required"],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Posted by user is required"],
    },
    audience: {
      type: String,
      enum: {
        values: ["All", "Teachers", "Students"],
        message: "Audience must be All, Teachers, or Students",
      },
      default: "All",
    },
    priority: {
      type: String,
      enum: {
        values: ["Normal", "Important", "Urgent"],
        message: "Priority must be Normal, Important, or Urgent",
      },
      default: "Normal",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

module.exports = mongoose.model("Notice", noticeSchema);
