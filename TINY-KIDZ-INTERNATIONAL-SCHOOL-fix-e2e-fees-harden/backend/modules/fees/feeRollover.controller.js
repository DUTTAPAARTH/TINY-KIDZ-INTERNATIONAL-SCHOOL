const FeeStructure = require("../../models/FeeStructure");
const Class = require("../../models/Class");

const rolloverStructures = async (req, res) => {
  try {
    const { fromYear, toYear } = req.body;

    if (!fromYear || !toYear) {
      return res.status(400).json({ message: "fromYear and toYear are required (e.g. 2024-25, 2025-26)" });
    }
    if (fromYear === toYear) {
      return res.status(400).json({ message: "Source and target year must be different" });
    }

    const sourceStructures = await FeeStructure.find({ academicYear: fromYear }).lean();
    if (!sourceStructures.length) {
      return res.status(404).json({ message: `No fee structures found for academic year ${fromYear}` });
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const src of sourceStructures) {
      const existing = await FeeStructure.findOne({ classId: src.classId, academicYear: toYear });
      if (existing) {
        skipped++;
        continue;
      }

      try {
        await FeeStructure.create({
          classId: src.classId,
          academicYear: toYear,
          tuitionFee: Number(src.tuitionFee || 0),
          admissionFee: Number(src.admissionFee || 0),
          uniformFee: Number(src.uniformFee || 0),
          activityFee: Number(src.activityFee || 0),
          transportFee: Number(src.transportFee || 0),
          lateFeePerDay: Number(src.lateFeePerDay || 50),
          q1Amount: Math.round(Number(src.tuitionFee || 0) / 4),
          q2Amount: Math.round(Number(src.tuitionFee || 0) / 4),
          q3Amount: Math.round(Number(src.tuitionFee || 0) / 4),
          q4Amount: Math.round(Number(src.tuitionFee || 0) / 4),
          q1DueDate: src.q1DueDate,
          q2DueDate: src.q2DueDate,
          q3DueDate: src.q3DueDate,
          q4DueDate: src.q4DueDate,
        });
        created++;
      } catch (err) {
        const cls = await Class.findById(src.classId).select("className section").lean();
        errors.push({ class: cls ? `${cls.className}-${cls.section}` : String(src.classId), error: err.message });
      }
    }

    const classCount = sourceStructures.length;
    return res.status(created ? 201 : 200).json({
      message: `Rollover complete: ${created} created, ${skipped} skipped from ${classCount} source structures`,
      created,
      skipped,
      total: classCount,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to rollover fee structures", error: error.message });
  }
};

module.exports = { rolloverStructures };
