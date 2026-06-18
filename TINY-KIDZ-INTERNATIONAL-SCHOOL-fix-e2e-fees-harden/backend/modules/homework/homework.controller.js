const Homework = require("../../models/Homework");
const Teacher = require("../../models/Teacher");

/**
 * Get all homework for a class
 * Sorted by due date ascending, populate subject and teacher info
 */
const getByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const homework = await Homework.find({ classId })
      .populate("assignedBy", "name email")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: homework,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Create new homework
 * Verify teacher teaches in this class
 */
const createHomework = async (req, res) => {
  try {
    const { classId, subject, title, description, dueDate, attachmentLink } = req.body;
    const teacherId = req.user.id;

    // Validate required fields
    if (!classId || !subject || !title || !description || !dueDate) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: classId, subject, title, description, dueDate",
      });
    }

    // Verify teacher is assigned to this class
    const teacher = await Teacher.findOne({ userId: teacherId });
    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    const isAssigned = teacher.classIds.some((id) => id.toString() === classId);
    if (!isAssigned) {
      return res.status(403).json({
        success: false,
        message: "You are not assigned to this class",
      });
    }

    // Create homework
    const homework = await Homework.create({
      classId,
      subject,
      title,
      description,
      dueDate,
      attachmentLink,
      assignedBy: teacherId,
    });

    await homework.populate("assignedBy", "name email");

    res.status(201).json({
      success: true,
      data: homework,
      message: "Homework assigned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update homework
 * Verify teacher assigned this homework
 */
const updateHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, subject, attachmentLink } = req.body;
    const teacherId = req.user.id;

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({
        success: false,
        message: "Homework not found",
      });
    }

    if (homework.assignedBy.toString() !== teacherId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit homework you assigned",
      });
    }

    if (title) homework.title = title;
    if (description) homework.description = description;
    if (dueDate) homework.dueDate = dueDate;
    if (subject) homework.subject = subject;
    if (attachmentLink !== undefined) homework.attachmentLink = attachmentLink;

    await homework.save();

    await homework.populate("assignedBy", "name email");

    res.status(200).json({
      success: true,
      data: homework,
      message: "Homework updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete homework
 * Admin can delete any, teacher can only delete their own
 */
const deleteHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const homework = await Homework.findById(id);
    if (!homework) {
      return res.status(404).json({
        success: false,
        message: "Homework not found",
      });
    }

    // Authorization check
    if (role !== "admin" && homework.assignedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete homework you assigned",
      });
    }

    await Homework.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Homework deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get upcoming homework for a class
 * Filter where dueDate >= today
 */
const getUpcoming = async (req, res) => {
  try {
    const { classId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const homework = await Homework.find({
      classId,
      dueDate: { $gte: today },
    })
      .populate("assignedBy", "name email")
      .sort({ dueDate: 1 });

    res.status(200).json({
      success: true,
      data: homework,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all homework (with optional filters)
 * Query: ?assignedBy=me&classId=xxx
 */
const getAllHomework = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.assignedBy === "me") filter.assignedBy = req.user.id;

    const homework = await Homework.find(filter)
      .populate("assignedBy", "name email")
      .sort({ dueDate: 1 });

    res.status(200).json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getByClass,
  getAllHomework,
  createHomework,
  updateHomework,
  deleteHomework,
  getUpcoming,
};
