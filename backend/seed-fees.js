const mongoose = require("mongoose");
require("dotenv").config();

const Fee = require("./models/Fee");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tinykidz")
  .then(() => console.log("📦 MongoDB connected for seeding"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

const seedFees = async () => {
  try {
    // Get Student model from mongoose connection
    let Student;
    try {
      Student = require("./models/Student");
    } catch (err) {
      // Try alternative Student lookup
      Student = mongoose.model("Student");
    }

    // Clear existing fees
    await Fee.deleteMany({});
    console.log("🗑️  Cleared existing fees");

    // Get all students using direct collection query
    const db = mongoose.connection;
    const studentCount = await db.collection("students").countDocuments();
    console.log(`📊 Total documents in students collection: ${studentCount}`);

    if (studentCount === 0) {
      console.log("❌ No students found in collection.");
      process.exit(0);
    }

    // Get students
    const students = await Student.find().limit(50);
    console.log(`📚 Found ${students.length} students in Student model`);

    if (students.length === 0) {
      // Try fetching from raw collection
      const rawStudents = await db
        .collection("students")
        .find({})
        .limit(50)
        .toArray();
      console.log(`📚 Found ${rawStudents.length} students in raw collection`);

      if (rawStudents.length === 0) {
        console.log("No students found. Please seed students first.");
        process.exit(0);
      }

      // Create fee records using raw student data
      const fees = rawStudents.map((student) => {
        const totalFee = 50000;
        const paidPercentage = Math.floor(Math.random() * 3);
        let paidAmount = 0;
        const payments = [];

        if (paidPercentage === 1) {
          paidAmount = Math.floor(totalFee * 0.33);
          payments.push({
            amount: paidAmount,
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            method: ["Cash", "Cheque", "Online"][Math.floor(Math.random() * 3)],
            note: "Partial payment",
          });
        } else if (paidPercentage === 2) {
          paidAmount = totalFee;
          payments.push({
            amount: totalFee,
            date: new Date(
              Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
            ),
            method: ["Cash", "Cheque", "Online"][Math.floor(Math.random() * 3)],
            note: "Full payment",
          });
        }

        return {
          studentId: student._id,
          academicYear: "2024-25",
          totalFee,
          paidAmount,
          payments,
        };
      });

      await Fee.insertMany(fees);
      console.log(`✅ ${fees.length} fee records created`);

      const summary = {
        totalFees: fees.length,
        totalCollected: fees.reduce((sum, f) => sum + f.paidAmount, 0),
        totalDue: fees.reduce((sum, f) => sum + (f.totalFee - f.paidAmount), 0),
        paid: fees.filter((f) => f.totalFee === f.paidAmount).length,
        partial: fees.filter(
          (f) => f.paidAmount > 0 && f.totalFee > f.paidAmount,
        ).length,
        unpaid: fees.filter((f) => f.paidAmount === 0).length,
      };

      console.log("\n📊 Fee Summary:");
      console.log(`   Total Fees: ${summary.totalFees}`);
      console.log(`   Total Collected: ₹${summary.totalCollected}`);
      console.log(`   Total Due: ₹${summary.totalDue}`);
      console.log(`   Paid: ${summary.paid}`);
      console.log(`   Partial: ${summary.partial}`);
      console.log(`   Unpaid: ${summary.unpaid}`);

      process.exit(0);
    }

    // Create fee records for each student
    const fees = students.map((student, index) => {
      const totalFee = 50000;
      const paidPercentage = Math.floor(Math.random() * 3);
      let paidAmount = 0;
      const payments = [];

      if (paidPercentage === 1) {
        paidAmount = Math.floor(totalFee * 0.33);
        payments.push({
          amount: paidAmount,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          method: ["Cash", "Cheque", "Online"][Math.floor(Math.random() * 3)],
          note: "Partial payment",
        });
      } else if (paidPercentage === 2) {
        paidAmount = totalFee;
        payments.push({
          amount: totalFee,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          method: ["Cash", "Cheque", "Online"][Math.floor(Math.random() * 3)],
          note: "Full payment",
        });
      }

      return {
        studentId: student._id,
        academicYear: "2024-25",
        totalFee,
        paidAmount,
        payments,
      };
    });

    // Insert all fees
    await Fee.insertMany(fees);
    console.log(`✅ ${fees.length} fee records created`);

    // Display summary
    const summary = {
      totalFees: fees.length,
      totalCollected: fees.reduce((sum, f) => sum + f.paidAmount, 0),
      totalDue: fees.reduce((sum, f) => sum + (f.totalFee - f.paidAmount), 0),
      paid: fees.filter((f) => f.totalFee === f.paidAmount).length,
      partial: fees.filter((f) => f.paidAmount > 0 && f.totalFee > f.paidAmount)
        .length,
      unpaid: fees.filter((f) => f.paidAmount === 0).length,
    };

    console.log("\n📊 Fee Summary:");
    console.log(`   Total Fees: ${summary.totalFees}`);
    console.log(`   Total Collected: ₹${summary.totalCollected}`);
    console.log(`   Total Due: ₹${summary.totalDue}`);
    console.log(`   Paid: ${summary.paid}`);
    console.log(`   Partial: ${summary.partial}`);
    console.log(`   Unpaid: ${summary.unpaid}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding fees:", error.message);
    process.exit(1);
  }
};

seedFees();
