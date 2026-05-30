const mongoose = require("mongoose");
const Teacher = require("../../models/Teacher");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

// GET /api/teachers - Get all teachers (Admin only)
exports.getAllTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const search = req.query.search || "";
    const classId = req.query.classId || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";

    const query = {};

    if (
      classId &&
      classId !== "all" &&
      mongoose.Types.ObjectId.isValid(classId)
    ) {
      query.classIds = mongoose.Types.ObjectId(classId);
    }

    if (search) {
      // Find matching users (by name or email) with teacher role
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
        role: "teacher",
      }).select("_id");

      const userIds = users.map((u) => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const teachers = await Teacher.find(query)
      .populate("userId", "name email isActive")
      .populate("classIds", "className section")
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await Teacher.countDocuments(query);

    res.status(200).json({
      success: true,
      data: teachers,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
      error: error.message,
    });
  }
};

// POST /api/teachers - Create teacher with User account (Admin only)
exports.createTeacher = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      employeeId,
      phone,
      qualification,
      designation,
      classIds,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !employeeId ||
      !phone ||
      !qualification
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, email, password, employeeId, phone, qualification",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check if employee ID already exists
    const existingTeacher = await Teacher.findOne({ employeeId });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    // Create User first
    const newUser = new User({
      name,
      email,
      password,
      role: "teacher",
      isActive: true,
    });

    const savedUser = await newUser.save();

    // Create Teacher document
    const newTeacher = new Teacher({
      userId: savedUser._id,
      employeeId,
      phone,
      qualification,
      designation: designation || "Teacher",
      classIds: classIds || [],
      isActive: true,
    });

    await newTeacher.save();

    // Sync with Class model
    if (classIds && classIds.length > 0) {
      await mongoose
        .model("Class")
        .updateMany(
          { _id: { $in: classIds } },
          { classTeacher: newTeacher._id },
        );
    }

    // Populate and return
    const populatedTeacher = await Teacher.findById(newTeacher._id)
      .populate("userId", "name email isActive")
      .populate("classIds", "className section");

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: populatedTeacher,
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create teacher",
      error: error.message,
    });
  }
};

// GET /api/teachers/:id - Get single teacher (Admin)
exports.getTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id)
      .populate("userId", "name email isActive")
      .populate("classIds", "className section");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Fetch subjects for this teacher
    const subjects = await mongoose.connection
      .collection("subjects")
      .find({ teacherId: teacher._id })
      .project({ name: 1, code: 1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: {
        ...teacher.toObject(),
        subjects,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
      error: error.message,
    });
  }
};

// PUT /api/teachers/:id - Update teacher (Admin only)
exports.updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      employeeId,
      phone,
      qualification,
      designation,
      classIds,
      assignedClasses,
      isActive,
    } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Update User fields
    if (name || email || isActive !== undefined) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (email) userUpdate.email = email;
      if (isActive !== undefined) userUpdate.isActive = isActive;
      await User.findByIdAndUpdate(teacher.userId, userUpdate);
    }

    // Update Teacher fields
    if (employeeId) teacher.employeeId = employeeId;
    if (phone) teacher.phone = phone;
    if (qualification) teacher.qualification = qualification;
    if (designation) teacher.designation = designation;
    if (isActive !== undefined) teacher.isActive = isActive;

    // Handle class assignment sync
    const newClassIds = assignedClasses || classIds;
    if (newClassIds !== undefined) {
      // 1. Remove this teacher from any class they were previously assigned to
      await mongoose
        .model("Class")
        .updateMany(
          { classTeacher: teacher._id },
          { $unset: { classTeacher: "" } },
        );

      teacher.classIds = newClassIds;

      // 2. Set this teacher as the class teacher for the newly assigned classes
      if (newClassIds.length > 0) {
        await mongoose
          .model("Class")
          .updateMany(
            { _id: { $in: newClassIds } },
            { classTeacher: teacher._id },
          );
      }
    }

    await teacher.save();

    const updatedTeacher = await Teacher.findById(id)
      .populate("userId", "name email isActive")
      .populate("classIds", "className section");

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: updatedTeacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher",
      error: error.message,
    });
  }
};

// DELETE /api/teachers/:id - Delete teacher and User account (Admin only)
exports.deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const userId = teacher.userId;

    // Delete Teacher document
    await Teacher.findByIdAndDelete(id);

    // Sync with Class model: Clear classTeacher for all classes of this teacher
    await mongoose
      .model("Class")
      .updateMany({ classTeacher: id }, { classTeacher: null });

    // Delete User document
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Teacher and associated user account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
      error: error.message,
    });
  }
};

// GET /api/teachers/me - Get logged-in teacher's own profile (Teacher only)
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const teacher = await Teacher.findOne({ userId })
      .populate("userId", "name email isActive")
      .populate({
        path: "classIds",
        select: "className section academicYear students",
        populate: {
          path: "students",
          select: "_id",
        },
      });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
      });
    }

    const teacherObj = teacher.toObject();
    // Alias classIds to assignedClasses for frontend compatibility as requested
    teacherObj.assignedClasses = (teacherObj.classIds || []).map((cls) => ({
      ...cls,
      studentCount: Array.isArray(cls.students) ? cls.students.length : 0,
    }));

    res.status(200).json({
      success: true,
      data: teacherObj,
    });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher profile",
      error: error.message,
    });
  }
};
