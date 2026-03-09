const Teacher = require("../../models/Teacher");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// GET /api/teachers - Get all teachers (Admin only)
exports.getAllTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const search = req.query.search || "";
    const classId = req.query.classId || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const matchStage = {};

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      matchStage.classIds = new mongoose.Types.ObjectId(classId);
    }

    const sortMap = {
      name: "userId.name",
      email: "userId.email",
      employeeId: "employeeId",
      phone: "phone",
      qualification: "qualification",
      createdAt: "createdAt",
    };

    const sortField = sortMap[sortBy] || "createdAt";

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userId",
        },
      },
      {
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "classes",
          localField: "classIds",
          foreignField: "_id",
          as: "classIds",
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { employeeId: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { qualification: { $regex: search, $options: "i" } },
            { "userId.name": { $regex: search, $options: "i" } },
            { "userId.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push({
      $project: {
        userId: {
          _id: "$userId._id",
          name: "$userId.name",
          email: "$userId.email",
          isActive: "$userId.isActive",
        },
        employeeId: 1,
        phone: 1,
        qualification: 1,
        classIds: {
          $map: {
            input: "$classIds",
            as: "cls",
            in: {
              _id: "$$cls._id",
              className: "$$cls.className",
              section: "$$cls.section",
            },
          },
        },
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    });

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { [sortField]: sortOrder } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
      },
    });

    const result = await Teacher.aggregate(pipeline);
    const total = result?.[0]?.metadata?.[0]?.total || 0;
    const teachers = result?.[0]?.data || [];

    res.status(200).json({
      success: true,
      data: teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 0,
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
      password, // Will be hashed by pre-save hook
      role: "teacher",
      isActive: true,
    });

    let savedUser;
    try {
      savedUser = await newUser.save();
    } catch (userError) {
      console.error("Error creating user:", userError);
      return res.status(500).json({
        success: false,
        message: "Failed to create user account",
        error: userError.message,
      });
    }

    // Create Teacher document
    const newTeacher = new Teacher({
      userId: savedUser._id,
      employeeId,
      phone,
      qualification,
      classIds: classIds || [],
      isActive: true,
    });

    try {
      await newTeacher.save();
    } catch (teacherError) {
      // Rollback: delete the user if teacher creation fails
      await User.findByIdAndDelete(savedUser._id);
      console.error("Error creating teacher:", teacherError);
      return res.status(500).json({
        success: false,
        message: "Failed to create teacher. User account rolled back.",
        error: teacherError.message,
      });
    }

    // Populate and return
    const populatedTeacher = await Teacher.findById(newTeacher._id)
      .populate("userId", "name email isActive -password")
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
      .populate("userId", "name email isActive -password")
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
      classIds,
      isActive,
    } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Update User fields if provided
    if (name || email || isActive !== undefined) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (email) {
        // Check if email is already taken by another user
        const existingUser = await User.findOne({
          email,
          _id: { $ne: teacher.userId },
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }
        userUpdate.email = email;
      }
      if (isActive !== undefined) userUpdate.isActive = isActive;

      await User.findByIdAndUpdate(teacher.userId, userUpdate);
    }

    // Update Teacher fields
    if (employeeId) {
      // Check if employee ID is already taken
      const existingTeacher = await Teacher.findOne({
        employeeId,
        _id: { $ne: id },
      });
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already exists",
        });
      }
      teacher.employeeId = employeeId;
    }
    if (phone) teacher.phone = phone;
    if (qualification) teacher.qualification = qualification;
    if (classIds !== undefined) teacher.classIds = classIds;
    if (isActive !== undefined) teacher.isActive = isActive;

    await teacher.save();

    // Return updated teacher
    const updatedTeacher = await Teacher.findById(id)
      .populate("userId", "name email isActive -password")
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
    // req.user is set by protect middleware
    const teacher = await Teacher.findOne({ userId: req.user._id })
      .populate("userId", "name email isActive -password")
      .populate("classIds", "className section");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher profile not found",
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
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher profile",
      error: error.message,
    });
  }
};
