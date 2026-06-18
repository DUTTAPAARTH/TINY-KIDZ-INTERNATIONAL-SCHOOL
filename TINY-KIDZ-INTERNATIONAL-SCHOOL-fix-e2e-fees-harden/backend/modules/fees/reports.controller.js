const FeeRecord = require("../../models/FeeRecord");
const Payment = require("../../models/Payment");
const Student = require("../../models/Student");
const Class = require("../../models/Class");
const mongoose = require("mongoose");

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const FEE_TYPES = [
  "Tuition",
  "Admission",
  "Uniform",
  "Activity",
  "Transport",
  "Fine",
  "Miscellaneous",
];

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getAcademicPeriod = (quarter, academicYear) => {
  const baseYear = Number(String(academicYear || "").slice(0, 4));
  const year = Number.isFinite(baseYear) ? baseYear : new Date().getFullYear();
  const nextYear = year + 1;
  const map = {
    Q1: `Apr - Jun ${year}`,
    Q2: `Jul - Sep ${year}`,
    Q3: `Oct - Dec ${year}`,
    Q4: `Jan - Mar ${nextYear}`,
  };
  return map[quarter] || "-";
};

const getFeeSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [recordSummary, totalStudents, defaultersByStudent, paymentBuckets] =
      await Promise.all([
        FeeRecord.aggregate([
          {
            $group: {
              _id: null,
              totalExpected: { $sum: "$totalAmount" },
              totalCollected: { $sum: "$paidAmount" },
              paidCount: {
                $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
              },
              partialCount: {
                $sum: { $cond: [{ $eq: ["$status", "PARTIAL"] }, 1, 0] },
              },
              dueCount: {
                $sum: { $cond: [{ $eq: ["$status", "DUE"] }, 1, 0] },
              },
              overdueCount: {
                $sum: { $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0] },
              },
            },
          },
        ]),
        Student.countDocuments({ isActive: true }),
        FeeRecord.distinct("studentId", { status: "OVERDUE" }),
        Payment.aggregate([
          {
            $group: {
              _id: null,
              todayCollection: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$paymentDate", todayStart] },
                        { $lt: ["$paymentDate", tomorrowStart] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              thisMonthCollection: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$paymentDate", thisMonthStart] },
                        { $lt: ["$paymentDate", nextMonthStart] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              lastMonthCollection: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$paymentDate", lastMonthStart] },
                        { $lt: ["$paymentDate", thisMonthStart] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    const summary =
      recordSummary[0] ||
      ({
        totalExpected: 0,
        totalCollected: 0,
        paidCount: 0,
        partialCount: 0,
        dueCount: 0,
        overdueCount: 0,
      });

    const buckets =
      paymentBuckets[0] ||
      ({ todayCollection: 0, thisMonthCollection: 0, lastMonthCollection: 0 });

    const totalExpected = Number(summary.totalExpected || 0);
    const totalCollected = Number(summary.totalCollected || 0);
    const totalDue = Math.max(0, totalExpected - totalCollected);
    const collectionPercent =
      totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

    res.json({
      totalExpected,
      totalCollected,
      totalDue,
      collectionPercent: Number(collectionPercent.toFixed(2)),
      todayCollection: Number(buckets.todayCollection || 0),
      thisMonthCollection: Number(buckets.thisMonthCollection || 0),
      lastMonthCollection: Number(buckets.lastMonthCollection || 0),
      trend:
        Number(buckets.thisMonthCollection || 0) >
        Number(buckets.lastMonthCollection || 0)
          ? "up"
          : "down",
      paidCount: Number(summary.paidCount || 0),
      partialCount: Number(summary.partialCount || 0),
      dueCount: Number(summary.dueCount || 0),
      overdueCount: Number(summary.overdueCount || 0),
      defaultersCount: defaultersByStudent.length,
      totalStudents,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch fee summary", error: error.message });
  }
};

const getClassWiseReport = async (req, res) => {
  try {
    const grouped = await FeeRecord.aggregate([
      {
        $group: {
          _id: "$classId",
          totalExpected: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          defaulters: {
            $addToSet: {
              $cond: [{ $eq: ["$status", "OVERDUE"] }, "$studentId", null],
            },
          },
        },
      },
    ]);

    const classIds = grouped.map((item) => item._id).filter(Boolean);
    const [classDocs, studentCounts] = await Promise.all([
      Class.find({ _id: { $in: classIds } }).select("className section").lean(),
      Student.aggregate([
        { $match: { classId: { $in: classIds }, isActive: true } },
        { $group: { _id: "$classId", totalStudents: { $sum: 1 } } },
      ]),
    ]);

    const classMap = new Map(classDocs.map((doc) => [String(doc._id), doc]));
    const studentMap = new Map(
      studentCounts.map((item) => [String(item._id), item.totalStudents]),
    );

    const response = grouped
      .map((item) => {
        const classDoc = classMap.get(String(item._id));
        const totalExpected = Number(item.totalExpected || 0);
        const totalCollected = Number(item.totalCollected || 0);
        const totalDue = Number(item.totalDue || 0);

        return {
          classId: item._id,
          className: classDoc?.className || "N/A",
          section: classDoc?.section || "-",
          totalStudents: Number(studentMap.get(String(item._id)) || 0),
          totalExpected,
          totalCollected,
          totalDue,
          collectionPercent:
            totalExpected > 0
              ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
              : 0,
          defaultersCount: (item.defaulters || []).filter(Boolean).length,
        };
      })
      .sort((a, b) => b.totalDue - a.totalDue);

    res.json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch class-wise report", error: error.message });
  }
};

const getQuarterWiseReport = async (req, res) => {
  try {
    const grouped = await FeeRecord.aggregate([
      { $match: { quarter: { $in: QUARTERS } } },
      {
        $group: {
          _id: "$quarter",
          totalExpected: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          recordCount: { $sum: 1 },
          years: { $addToSet: "$academicYear" },
        },
      },
    ]);

    const map = new Map(grouped.map((item) => [item._id, item]));
    const response = QUARTERS.map((quarter) => {
      const row = map.get(quarter) || {
        totalExpected: 0,
        totalCollected: 0,
        totalDue: 0,
        recordCount: 0,
        years: [],
      };

      const referenceYear = Array.isArray(row.years) && row.years.length > 0 ? row.years[0] : null;
      const totalExpected = Number(row.totalExpected || 0);
      const totalCollected = Number(row.totalCollected || 0);

      return {
        quarter,
        period: getAcademicPeriod(quarter, referenceYear),
        totalExpected,
        totalCollected,
        totalDue: Number(row.totalDue || 0),
        collectionPercent:
          totalExpected > 0
            ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
            : 0,
        recordCount: Number(row.recordCount || 0),
      };
    });

    res.json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch quarter-wise report", error: error.message });
  }
};

const getMonthlyCollection = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const grouped = await Payment.aggregate([
      { $match: { paymentDate: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { $month: "$paymentDate" },
          amount: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const map = new Map(grouped.map((row) => [row._id, row]));

    const response = monthNames.map((month, index) => {
      const monthNumber = index + 1;
      const row = map.get(monthNumber);
      return {
        month,
        monthNumber,
        amount: Number(row?.amount || 0),
        paymentCount: Number(row?.paymentCount || 0),
      };
    });

    res.json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch monthly collection", error: error.message });
  }
};

const getFeeTypeWiseReport = async (req, res) => {
  try {
    const grouped = await FeeRecord.aggregate([
      {
        $group: {
          _id: "$feeType",
          totalExpected: { $sum: "$totalAmount" },
          totalCollected: { $sum: "$paidAmount" },
          totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
        },
      },
    ]);

    const map = new Map(grouped.map((row) => [row._id, row]));
    const response = FEE_TYPES.map((feeType) => {
      const row = map.get(feeType);
      const totalExpected = Number(row?.totalExpected || 0);
      const totalCollected = Number(row?.totalCollected || 0);
      return {
        feeType,
        totalExpected,
        totalCollected,
        totalDue: Number(row?.totalDue || 0),
        collectionPercent:
          totalExpected > 0
            ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
            : 0,
      };
    });

    res.json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch fee type report", error: error.message });
  }
};

const getDefaultersReport = async (req, res) => {
  try {
    const feeRecords = await FeeRecord.find({ status: { $in: ["OVERDUE", "DUE"] } })
      .populate({
        path: "studentId",
        select:
          "admissionNumber parentPhone phone fatherPhone guardianPhone userId",
        populate: { path: "userId", select: "name" },
      })
      .populate("classId", "className section")
      .sort({ dueDate: 1 })
      .lean();

    const studentIds = [
      ...new Set(
        feeRecords
          .map((record) => String(record?.studentId?._id || ""))
          .filter(Boolean),
      ),
    ];

    const lastPaymentByStudent = await Payment.aggregate([
      {
        $match: {
          studentId: {
            $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      { $sort: { paymentDate: -1 } },
      {
        $group: {
          _id: "$studentId",
          lastPaymentDate: { $first: "$paymentDate" },
        },
      },
    ]);

    const paymentMap = new Map(
      lastPaymentByStudent.map((row) => [String(row._id), row.lastPaymentDate]),
    );

    const now = new Date();
    const grouped = new Map();

    feeRecords.forEach((record) => {
      if (!record.studentId?._id) return;
      const studentKey = String(record.studentId._id);
      const dueAmount = Math.max(
        0,
        Number(record.totalAmount || 0) - Number(record.paidAmount || 0),
      );
      if (dueAmount <= 0) return;

      if (!grouped.has(studentKey)) {
        const lastPaymentDate = paymentMap.get(studentKey) || null;
        grouped.set(studentKey, {
          studentId: studentKey,
          studentName: record.studentId.userId?.name || "Student",
          admissionNo: record.studentId.admissionNumber || "-",
          className: record.classId
            ? `${record.classId.className || "Class"}-${record.classId.section || "-"}`
            : "N/A",
          parentPhone:
            record.studentId.parentPhone ||
            record.studentId.fatherPhone ||
            record.studentId.guardianPhone ||
            record.studentId.phone ||
            "-",
          totalDue: 0,
          overdueAmount: 0,
          dueRecords: [],
          lastPaymentDate,
          daysSinceLastPayment: lastPaymentDate
            ? Math.floor((now - new Date(lastPaymentDate)) / (1000 * 60 * 60 * 24))
            : null,
        });
      }

      const item = grouped.get(studentKey);
      item.totalDue += dueAmount;
      if (record.status === "OVERDUE") {
        item.overdueAmount += dueAmount;
      }
      item.dueRecords.push({
        feeType: record.feeType,
        quarter: record.quarter || "-",
        academicYear: record.academicYear,
        dueDate: record.dueDate,
        totalAmount: Number(record.totalAmount || 0),
        paidAmount: Number(record.paidAmount || 0),
        dueAmount,
        status: record.status,
      });
    });

    const response = Array.from(grouped.values())
      .map((item) => ({
        ...item,
        totalDue: Number(item.totalDue.toFixed(2)),
        overdueAmount: Number(item.overdueAmount.toFixed(2)),
      }))
      .sort((a, b) => b.totalDue - a.totalDue);

    res.json(response);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch defaulters report", error: error.message });
  }
};

const exportFeeData = async (req, res) => {
  try {
    const { type = "summary" } = req.query;

    if (type === "summary") {
      const [summary] = await Promise.all([
        FeeRecord.aggregate([
          {
            $group: {
              _id: null,
              totalExpected: { $sum: "$totalAmount" },
              totalCollected: { $sum: "$paidAmount" },
              paidCount: {
                $sum: { $cond: [{ $eq: ["$status", "PAID"] }, 1, 0] },
              },
              partialCount: {
                $sum: { $cond: [{ $eq: ["$status", "PARTIAL"] }, 1, 0] },
              },
              dueCount: {
                $sum: { $cond: [{ $eq: ["$status", "DUE"] }, 1, 0] },
              },
              overdueCount: {
                $sum: { $cond: [{ $eq: ["$status", "OVERDUE"] }, 1, 0] },
              },
            },
          },
        ]),
      ]);
      const row = summary[0] || {};
      const totalExpected = Number(row.totalExpected || 0);
      const totalCollected = Number(row.totalCollected || 0);
      return res.json([
        {
          totalExpected,
          totalCollected,
          totalDue: Math.max(0, totalExpected - totalCollected),
          collectionPercent:
            totalExpected > 0
              ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
              : 0,
          paidCount: Number(row.paidCount || 0),
          partialCount: Number(row.partialCount || 0),
          dueCount: Number(row.dueCount || 0),
          overdueCount: Number(row.overdueCount || 0),
        },
      ]);
    }

    if (type === "class-wise") {
      const grouped = await FeeRecord.aggregate([
        {
          $group: {
            _id: "$classId",
            totalExpected: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          },
        },
      ]);
      const classIds = grouped.map((item) => item._id).filter(Boolean);
      const classDocs = await Class.find({ _id: { $in: classIds } })
        .select("className section")
        .lean();
      const classMap = new Map(classDocs.map((doc) => [String(doc._id), doc]));

      const data = grouped
        .map((item) => {
          const classDoc = classMap.get(String(item._id));
          const totalExpected = Number(item.totalExpected || 0);
          const totalCollected = Number(item.totalCollected || 0);
          return {
            className: classDoc?.className || "N/A",
            section: classDoc?.section || "-",
            totalExpected,
            totalCollected,
            totalDue: Number(item.totalDue || 0),
            collectionPercent:
              totalExpected > 0
                ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
                : 0,
          };
        })
        .sort((a, b) => b.totalDue - a.totalDue);

      return res.json(data);
    }

    if (type === "quarter-wise") {
      const grouped = await FeeRecord.aggregate([
        { $match: { quarter: { $in: QUARTERS } } },
        {
          $group: {
            _id: "$quarter",
            totalExpected: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
            totalDue: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } },
          },
        },
      ]);
      const map = new Map(grouped.map((item) => [item._id, item]));
      const data = QUARTERS.map((quarter) => {
        const row = map.get(quarter) || {};
        const totalExpected = Number(row.totalExpected || 0);
        const totalCollected = Number(row.totalCollected || 0);
        return {
          quarter,
          totalExpected,
          totalCollected,
          totalDue: Number(row.totalDue || 0),
          collectionPercent:
            totalExpected > 0
              ? Number(((totalCollected / totalExpected) * 100).toFixed(2))
              : 0,
        };
      });
      return res.json(data);
    }

    if (type === "defaulters") {
      const feeRecords = await FeeRecord.find({ status: { $in: ["DUE", "OVERDUE"] } })
        .populate({
          path: "studentId",
          select:
            "admissionNumber parentPhone phone fatherPhone guardianPhone userId",
          populate: { path: "userId", select: "name" },
        })
        .populate("classId", "className section")
        .lean();

      const grouped = new Map();
      feeRecords.forEach((record) => {
        if (!record.studentId?._id) return;
        const studentKey = String(record.studentId._id);
        const dueAmount = Math.max(
          0,
          Number(record.totalAmount || 0) - Number(record.paidAmount || 0),
        );
        if (!grouped.has(studentKey)) {
          grouped.set(studentKey, {
            studentName: record.studentId.userId?.name || "Student",
            admissionNo: record.studentId.admissionNumber || "-",
            className: record.classId
              ? `${record.classId.className || "Class"}-${record.classId.section || "-"}`
              : "N/A",
            parentPhone:
              record.studentId.parentPhone ||
              record.studentId.fatherPhone ||
              record.studentId.guardianPhone ||
              record.studentId.phone ||
              "-",
            totalDue: 0,
            overdueAmount: 0,
          });
        }
        const entry = grouped.get(studentKey);
        entry.totalDue += dueAmount;
        if (record.status === "OVERDUE") {
          entry.overdueAmount += dueAmount;
        }
      });
      const data = Array.from(grouped.values()).sort((a, b) => b.totalDue - a.totalDue);
      return res.json(data);
    }

    if (type === "payments") {
      const payments = await Payment.find({})
        .populate({ path: "studentId", select: "admissionNumber userId", populate: { path: "userId", select: "name" } })
        .populate("classId", "className section")
        .populate("feeRecordId", "feeType quarter")
        .sort({ paymentDate: -1 })
        .lean();
      const data = payments.map((payment) => ({
        paymentDate: payment.paymentDate,
        receiptNumber: payment.receiptNumber,
        studentName: payment.studentId?.userId?.name || "Student",
        admissionNo: payment.studentId?.admissionNumber || "-",
        className: payment.classId
          ? `${payment.classId.className || "Class"}-${payment.classId.section || "-"}`
          : "N/A",
        feeType: payment.feeRecordId?.feeType || "-",
        quarter: payment.feeRecordId?.quarter || "-",
        amount: Number(payment.amount || 0),
        method: payment.method,
        lateFeeAmount: Number(payment.lateFeeAmount || 0),
      }));
      return res.json(data);
    }

    return res.status(400).json({
      message:
        "Invalid export type. Use summary, class-wise, quarter-wise, defaulters, or payments.",
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to export report", error: error.message });
  }
};

module.exports = {
  getFeeSummary,
  getClassWiseReport,
  getQuarterWiseReport,
  getMonthlyCollection,
  getFeeTypeWiseReport,
  getDefaultersReport,
  exportFeeData,
  // Backward alias to avoid breaking existing /fees/defaulters consumers.
  getDefaultersFull: getDefaultersReport,
};
