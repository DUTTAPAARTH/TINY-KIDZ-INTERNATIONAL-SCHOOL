const mongoose = require("mongoose");
require("dotenv").config();

const Marks = require("./models/Marks");

const verifyMarks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // Count total marks
    const totalMarks = await Marks.countDocuments();
    console.log(`\n📊 Total marks in database: ${totalMarks}`);

    // Get sample of marks
    const sampleMarks = await Marks.find().limit(5);
    console.log("\n📋 Sample marks records:");
    sampleMarks.forEach((mark, index) => {
      console.log(
        `   ${index + 1}. Marks: ${mark.marksObtained}/${mark.totalMarks} | Grade: ${mark.grade} | Exam: ${mark.examType} | Year: ${mark.academicYear}`,
      );
    });

    // Get statistics
    const marksStats = await Marks.aggregate([
      {
        $group: {
          _id: null,
          averageMarks: { $avg: "$marksObtained" },
          minMarks: { $min: "$marksObtained" },
          maxMarks: { $max: "$marksObtained" },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    if (marksStats.length > 0) {
      const stats = marksStats[0];
      console.log("\n📈 Marks Statistics:");
      console.log(`   Total Records: ${stats.totalRecords}`);
      console.log(`   Average Marks: ${stats.averageMarks.toFixed(2)}/100`);
      console.log(`   Minimum Marks: ${stats.minMarks}`);
      console.log(`   Maximum Marks: ${stats.maxMarks}`);
    }

    // Get grade distribution
    const gradeDistribution = await Marks.aggregate([
      {
        $group: {
          _id: "$grade",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    console.log("\n🎯 Grade Distribution:");
    gradeDistribution.forEach((grade) => {
      const percentage = ((grade.count / totalMarks) * 100).toFixed(2);
      console.log(
        `   ${grade._id || "N/A"}: ${grade.count} records (${percentage}%)`,
      );
    });

    console.log("\n✅ Verification complete!");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error verifying marks:", error.message);
    process.exit(1);
  }
};

verifyMarks();
