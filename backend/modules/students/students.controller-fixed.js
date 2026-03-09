const Student = require("../../models/Student");
const User = require("../../models/User");
const bcrypt = require("bcryptjs");

// GET /api/students - Get all students (Admin only, paginated, searchable)
exports.getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const classId = req.query.classId || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder || "desc";

    // Build search query
    const query = {};
    
    // Add search filter
    if (search) {
      query.$or = [{ admissionNumber: { $regex: search, $options: "i" } }];
    }
    
    // Add class filter
    if (classId) {
      query.classId = classId;
    }

    // Build sort object
    const sortObject = {};
    if (sortBy === "name") {
      sortObject["userId.name"] = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "class") {
      sortObject["classId.className"] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Get students with pagination
    const students = await Student.find(query)
      .populate({
        path: "userId",
        select: "name email",
        model: "User",
      })
      .populate("classId", "className section")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort(sortObject);

    // Get total count for pagination
    const total = await Student.countDocuments(query);

    res.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAllStudents error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/students - Create student with User account (Admin only)
exports.createStudent = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      admissionNumber,
      gender,
      parentalSupport,
      extracurricular,
      academicYear,
      classId,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !admissionNumber ||
      !gender ||
      !academicYear ||
      !classId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, email, password, admissionNumber, gender, academicYear, classId",
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

    // Check if admission number already exists
    const existingStudent = await Student.findOne({ admissionNumber });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Admission number already exists",
      });
    }

    // Create User first
    const newUser = new User({
      name,
      email,
      password, // Will be hashed by pre-save hook
      role: "student",
      isActive: true,
    });

    await newUser.save();

    // Create Student document
    const newStudent = new Student({
      userId: newUser._id,
      admissionNumber,
      gender,
      parentalSupport: parentalSupport || "Medium",
      extracurricular,
      academicYear,
      classId,
      isActive: true,
    });

    await newStudent.save();

    // Populate and return
    const populatedStudent = await Student.findById(newStudent._id)
      .populate("userId", "name email isActive -password")
      .populate("classId", "className section");

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: populatedStudent,
    });
  } catch (error) {
    console.error("Error creating student:", error);

    // If student creation fails after user creation, we should clean up
    // This is a basic implementation - you might want to use transactions

    res.status(500).json({
      success: false,
      message: "Failed to create student",
      error: error.message,
    });
  }
};

// GET /api/students/:id - Get single student (Admin + Teacher)
exports.getStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate("userId", "name email isActive -password")
      .populate("classId", "className section");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
      error: error.message,
    });
  }
};

// PUT /api/students/:id - Update student (Admin only)
exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      admissionNumber,
      gender,
      parentalSupport,
      extracurricular,
      academicYear,
      classId,
      isActive,
    } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
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
          _id: { $ne: student.userId },
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

      await User.findByIdAndUpdate(student.userId, userUpdate);
    }

    // Update Student fields
    if (admissionNumber) {
      // Check if admission number is already taken
      const existingStudent = await Student.findOne({
        admissionNumber,
        _id: { $ne: id },
      });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Admission number already exists",
        });
      }
      student.admissionNumber = admissionNumber;
    }
    if (gender) student.gender = gender;
    if (parentalSupport) student.parentalSupport = parentalSupport;
    if (extracurricular !== undefined)
      student.extracurricular = extracurricular;
    if (academicYear) student.academicYear = academicYear;
    if (classId) student.classId = classId;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    // Return updated student
    const updatedStudent = await Student.findById(id)
      .populate("userId", "name email isActive -password")
      .populate("classId", "className section");

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update student",
      error: error.message,
    });
  }
};

// DELETE /api/students/:id - Delete student and User account (Admin only)
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const userId = student.userId;

    // Delete Student document
    await Student.findByIdAndDelete(id);

    // Delete User document
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Student and associated user account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete student",
      error: error.message,
    });
  }
};

// GET /api/students/me - Get logged-in student's own profile (Student only)
exports.getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const student = await Student.findOne({ userId: req.user._id })
      .populate("userId", "name email isActive -password")
      .populate("classId", "className section");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
      error: error.message,
    });
  }
};
