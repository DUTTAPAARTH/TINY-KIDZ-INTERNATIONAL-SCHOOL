const FeeRecord = require("../../models/FeeRecord");

const applyDiscount = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { discountType, discountValue, discountReason } = req.body;

    if (!discountType || discountType === "none") {
      return res.status(400).json({ message: "Discount type is required (percentage or fixed)" });
    }
    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ message: "Discount value must be greater than zero" });
    }
    if (discountType === "percentage" && Number(discountValue) > 100) {
      return res.status(400).json({ message: "Percentage discount cannot exceed 100%" });
    }

    const feeRecord = await FeeRecord.findById(feeId);
    if (!feeRecord) return res.status(404).json({ message: "Fee record not found" });

    feeRecord.discountType = discountType;
    feeRecord.discountValue = Number(discountValue);
    feeRecord.discountReason = discountReason || "";
    await feeRecord.save();

    const populated = await FeeRecord.findById(feeId)
      .populate({ path: "studentId", select: "admissionNumber userId", populate: { path: "userId", select: "name" } })
      .populate("classId", "className section");

    return res.json({ message: "Discount applied successfully", feeRecord: populated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to apply discount", error: error.message });
  }
};

const removeDiscount = async (req, res) => {
  try {
    const { feeId } = req.params;
    const feeRecord = await FeeRecord.findById(feeId);
    if (!feeRecord) return res.status(404).json({ message: "Fee record not found" });

    feeRecord.discountType = "none";
    feeRecord.discountValue = 0;
    feeRecord.discountReason = "";
    await feeRecord.save();

    const populated = await FeeRecord.findById(feeId)
      .populate({ path: "studentId", select: "admissionNumber userId", populate: { path: "userId", select: "name" } })
      .populate("classId", "className section");

    return res.json({ message: "Discount removed successfully", feeRecord: populated });
  } catch (error) {
    return res.status(500).json({ message: "Failed to remove discount", error: error.message });
  }
};

module.exports = { applyDiscount, removeDiscount };
