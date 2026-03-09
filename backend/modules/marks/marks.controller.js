const Marks = require("./marks.model");

// POST - Add marks (Teacher/Admin only)
exports.addMarks = async (req, res) => {
  try {
    const {
      studentId,
      subjectId,
      marksObtained,
      totalMarks,
      examType,
      academicYear,
      examDate,
    } = req.body;

    // Validation
    if (!studentId || !subjectId || marksObtained === undefined || !examDate) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: studentId, subjectId, marksObtained, examDate",
      });
    }

    // Check if marks already exist for this student-subject-exam combo
    const existingMarks = await Marks.findOne({
      studentId,
      subjectId,
      examType: examType || "Unit Test",
      academicYear: academicYear || "2024-25",
    });

    if (existingMarks) {
      return res.status(400).json({
        success: false,
        message:
          "Marks entry already exists for this student-subject-exam combination",
      });
    }

    const newMarks = new Marks({
      studentId,
      subjectId,
      addedBy: req.user._id,
      marksObtained,
      totalMarks: totalMarks || 100,
      examType: examType || "Unit Test",
      academicYear: academicYear || "2024-25",
      examDate,
    });

    // Validate marks don't exceed total
    if (newMarks.marksObtained > newMarks.totalMarks) {
      return res.status(400).json({
        success: false,
        message: `Marks obtained (${newMarks.marksObtained}) cannot exceed total marks (${newMarks.totalMarks})`,
      });
    }

    await newMarks.save();

    // Populate and return
    await newMarks.populate("studentId", "name enrollmentNumber");
    await newMarks.populate("subjectId", "name code");
    await newMarks.populate("addedBy", "name email");

    res.status(201).json({
      success: true,
      message: "Marks added successfully",
      data: newMarks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding marks",
      error: error.message,
    });
  }
};

// GET - Get all marks for a student, grouped by subject and examType
exports.getStudentMarks = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const { academicYear } = req.query;

    // Build filter
    const filter = { studentId };
    if (academicYear) {
      filter.academicYear = academicYear;
    }

    // Fetch marks with population
    const marks = await Marks.find(filter)
      .populate("studentId", "name enrollmentNumber email")
      .populate("subjectId", "name code")
      .populate("addedBy", "name email")
      .sort({ examDate: -1 });

    if (marks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No marks found for this student",
      });
    }

    // Group by subject and examType
    const groupedMarks = {};
    marks.forEach((mark) => {
      const subjectName = mark.subjectId.name;
      const examType = mark.examType;

      if (!groupedMarks[subjectName]) {
        groupedMarks[subjectName] = {};
      }

      if (!groupedMarks[subjectName][examType]) {
        groupedMarks[subjectName][examType] = [];
      }

      groupedMarks[subjectName][examType].push({
        _id: mark._id,
        marksObtained: mark.marksObtained,
        totalMarks: mark.totalMarks,
        percentage: mark.percentage,
        grade: mark.grade,
        examDate: mark.examDate,
        addedBy: mark.addedBy,
      });
    });

    res.status(200).json({
      success: true,
      message: `Retrieved ${marks.length} marks for student`,
      studentInfo: {
        _id: marks[0].studentId._id,
        name: marks[0].studentId.name,
        enrollmentNumber: marks[0].studentId.enrollmentNumber,
      },
      marksGrouped: groupedMarks,
      totalRecords: marks.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching student marks",
      error: error.message,
    });
  }
};

// GET - Get all marks for a class (requires classId via query)
exports.getClassMarks = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { academicYear, subjectId, examType } = req.query;

    // Build filter - Note: requires classId mapping from Student collection
    // This is a simplified version - in production, fetch students by classId first
    const filter = {};

    if (academicYear) {
      filter.academicYear = academicYear;
    }

    if (subjectId) {
      filter.subjectId = subjectId;
    }

    if (examType) {
      filter.examType = examType;
    }

    // Fetch marks
    const marks = await Marks.find(filter)
      .populate("studentId", "name enrollmentNumber email")
      .populate("subjectId", "name code")
      .populate("addedBy", "name email")
      .sort({ studentId: 1, subjectId: 1, examDate: -1 });

    if (marks.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No marks found for this class",
      });
    }

    // Calculate class statistics
    const statistics = {
      totalRecords: marks.length,
      averageMarks: (
        marks.reduce((sum, m) => sum + m.marksObtained, 0) / marks.length
      ).toFixed(2),
      highestMarks: Math.max(...marks.map((m) => m.marksObtained)),
      lowestMarks: Math.min(...marks.map((m) => m.marksObtained)),
    };

    res.status(200).json({
      success: true,
      message: `Retrieved ${marks.length} marks for class`,
      classId,
      statistics,
      marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching class marks",
      error: error.message,
    });
  }
};

// PUT - Update marks entry (Teacher/Admin only)
exports.updateMarks = async (req, res) => {
  try {
    const { id: marksId } = req.params;
    const { marksObtained, totalMarks, examType, examDate } = req.body;

    // Find marks
    const marks = await Marks.findById(marksId);

    if (!marks) {
      return res.status(404).json({
        success: false,
        message: "Marks entry not found",
      });
    }

    // Check authorization - only original teacher or admin can update
    if (
      marks.addedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this marks entry",
      });
    }

    // Update fields
    if (marksObtained !== undefined) {
      if (
        marksObtained < 0 ||
        marksObtained > (totalMarks || marks.totalMarks)
      ) {
        return res.status(400).json({
          success: false,
          message: `Marks obtained must be between 0 and ${totalMarks || marks.totalMarks}`,
        });
      }
      marks.marksObtained = marksObtained;
    }

    if (totalMarks !== undefined) marks.totalMarks = totalMarks;
    if (examType !== undefined) marks.examType = examType;
    if (examDate !== undefined) marks.examDate = examDate;

    await marks.save();

    // Populate and return
    await marks.populate("studentId", "name enrollmentNumber");
    await marks.populate("subjectId", "name code");
    await marks.populate("addedBy", "name email");

    res.status(200).json({
      success: true,
      message: "Marks updated successfully",
      data: marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating marks",
      error: error.message,
    });
  }
};

// DELETE - Delete marks entry (Admin only)
exports.deleteMarks = async (req, res) => {
  try {
    const { id: marksId } = req.params;

    // Find marks
    const marks = await Marks.findById(marksId);

    if (!marks) {
      return res.status(404).json({
        success: false,
        message: "Marks entry not found",
      });
    }

    // Delete
    await Marks.findByIdAndDelete(marksId);

    res.status(200).json({
      success: true,
      message: "Marks entry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting marks",
      error: error.message,
    });
  }
};

// GET - Get marks for a specific subject/class combination
exports.getSubjectMarks = async (req, res) => {
  try {
    const { academicYear = "2024-25", examType } = req.query;

    const filter = { academicYear };
    if (examType) filter.examType = examType;

    const marks = await Marks.find(filter)
      .populate("studentId", "name enrollmentNumber")
      .populate("subjectId", "name code")
      .populate("addedBy", "name")
      .sort({ subjectId: 1, marksObtained: -1 });

    res.status(200).json({
      success: true,
      message: `Retrieved ${marks.length} marks records`,
      data: marks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching subject marks",
      error: error.message,
    });
  }
};
