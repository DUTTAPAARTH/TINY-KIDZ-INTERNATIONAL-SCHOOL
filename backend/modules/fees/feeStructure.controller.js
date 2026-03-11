const FeeStructure = require("../../models/FeeStructure");

const getAllStructures = async (req, res) => {
  try {
    const structures = await FeeStructure.find()
      .populate("classId", "className section")
      .sort({ classId: 1, academicYear: 1 });

    res.json(structures);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch fee structures",
      error: error.message,
    });
  }
};

const createStructure = async (req, res) => {
  try {
    const { classId, academicYear = "2024-25" } = req.body;

    if (!classId) {
      return res.status(400).json({ message: "Class is required" });
    }

    const existing = await FeeStructure.findOne({ classId, academicYear });
    if (existing) {
      return res
        .status(400)
        .json({
          message: "Fee structure already exists for this class and year",
        });
    }

    const created = await FeeStructure.create({ ...req.body, academicYear });
    const populated = await FeeStructure.findById(created._id).populate(
      "classId",
      "className section",
    );

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create fee structure",
      error: error.message,
    });
  }
};

const updateStructure = async (req, res) => {
  try {
    const updated = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    ).populate("classId", "className section");

    if (!updated) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update fee structure",
      error: error.message,
    });
  }
};

const deleteStructure = async (req, res) => {
  try {
    const deleted = await FeeStructure.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Fee structure not found" });
    }

    res.json({ message: "Fee structure deleted" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete fee structure",
      error: error.message,
    });
  }
};

module.exports = {
  getAllStructures,
  createStructure,
  updateStructure,
  deleteStructure,
};
