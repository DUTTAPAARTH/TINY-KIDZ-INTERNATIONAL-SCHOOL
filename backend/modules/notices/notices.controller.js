const Notice = require("../../models/Notice");

// @desc Get all notices filtered by user role
// @access Private
exports.getNotices = async (req, res) => {
  try {
    let filter = {};

    // Role-based filtering
    if (req.user.role === "admin") {
      // Admin sees all notices
      filter = {};
    } else if (req.user.role === "teacher") {
      // Teachers see All or Teachers audience
      filter = {
        $or: [{ audience: "All" }, { audience: "Teachers" }],
      };
    } else if (req.user.role === "student") {
      // Students see All or Students audience
      filter = {
        $or: [{ audience: "All" }, { audience: "Students" }],
      };
    }

    const notices = await Notice.find(filter)
      .sort({ createdAt: -1 })
      .populate("postedBy", "name");

    res.status(200).json({
      success: true,
      count: notices.length,
      data: notices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Create a new notice (Admin only)
// @access Private/Admin
exports.createNotice = async (req, res) => {
  try {
    const { title, content, audience, priority } = req.body;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const notice = new Notice({
      title,
      content,
      audience: audience || "All",
      priority: priority || "Normal",
      postedBy: req.user.id,
    });

    await notice.save();
    await notice.populate("postedBy", "name");

    res.status(201).json({
      success: true,
      message: "Notice created successfully",
      data: notice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Update a notice (Admin only)
// @access Private/Admin
exports.updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, audience, priority } = req.body;

    let notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    // Update fields
    if (title) notice.title = title;
    if (content) notice.content = content;
    if (audience) notice.audience = audience;
    if (priority) notice.priority = priority;

    await notice.save();
    await notice.populate("postedBy", "name");

    res.status(200).json({
      success: true,
      message: "Notice updated successfully",
      data: notice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc Delete a notice (Admin only)
// @access Private/Admin
exports.deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      return res.status(404).json({
        success: false,
        message: "Notice not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
