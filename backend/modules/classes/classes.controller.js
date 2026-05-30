const mongoose = require("mongoose");
const Class = require("../../models/Class");

const classPopulate = {
  path: "classTeacher",
  populate: {
    path: "userId",
    select: "name email",
  },
};

// GET /api/classes - Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find({ isActive: true })
      .populate(classPopulate)
      .sort({ className: 1, section: 1 });

    res.status(200).json({
      success: true,
      count: classes.length,
      data: classes,
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
      error: error.message,
    });
  }
};

// GET /api/classes/:id - Get single class
exports.getClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id).populate(classPopulate);

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    res.status(200).json({
      success: true,
      data: classData,
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch class",
      error: error.message,
    });
  }
};

// POST /api/classes - Create class
exports.createClass = async (req, res) => {
  try {
    const { className, section, academicYear, classTeacher } = req.body;

    if (!className || !section || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "className, section and academicYear are required",
      });
    }

    const newClass = await Class.create({
      className,
      section,
      academicYear,
      classTeacher: classTeacher || null,
      isActive: true,
    });

    // Sync with Teacher model
    if (classTeacher) {
      await mongoose.model("Teacher").findByIdAndUpdate(classTeacher, {
        $addToSet: { classIds: newClass._id }
      });
    }

    const populatedClass = await Class.findById(newClass._id).populate(
      classPopulate,
    );

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: populatedClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create class",
      error: error.message,
    });
  }
};

// PUT /api/classes/:id - Update class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { className, section, academicYear, classTeacher } = req.body;

    const classDoc = await Class.findById(id);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (className !== undefined) classDoc.className = className;
    if (section !== undefined) classDoc.section = section;
    if (academicYear !== undefined) classDoc.academicYear = academicYear;
    
    const oldTeacher = classDoc.classTeacher;
    if (classTeacher !== undefined) {
      classDoc.classTeacher = classTeacher || null;
      
      // Sync with Teacher model
      if (oldTeacher && oldTeacher.toString() !== (classTeacher || "")) {
        await mongoose.model("Teacher").findByIdAndUpdate(oldTeacher, {
          $pull: { classIds: id }
        });
      }
      if (classTeacher && (!oldTeacher || oldTeacher.toString() !== classTeacher)) {
        await mongoose.model("Teacher").findByIdAndUpdate(classTeacher, {
          $addToSet: { classIds: id }
        });
      }
    }

    await classDoc.save();

    const updatedClass = await Class.findById(id).populate(classPopulate);

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update class",
      error: error.message,
    });
  }
};

// DELETE /api/classes/:id - Soft delete class
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classDoc = await Class.findById(id);
    if (!classDoc) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    classDoc.isActive = false;
    await classDoc.save();

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete class",
      error: error.message,
    });
  }
};
