const mongoose = require("mongoose");
const Class = require("./models/Class");
require("dotenv").config();

const seedClasses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing classes (optional)
    await Class.deleteMany({});
    console.log("🗑️  Cleared existing classes");

    // Define classes
    const classes = [
      { className: "9", section: "A", academicYear: "2024-25", isActive: true },
      { className: "9", section: "B", academicYear: "2024-25", isActive: true },
      { className: "9", section: "C", academicYear: "2024-25", isActive: true },
      {
        className: "10",
        section: "A",
        academicYear: "2024-25",
        isActive: true,
      },
      {
        className: "10",
        section: "B",
        academicYear: "2024-25",
        isActive: true,
      },
      {
        className: "10",
        section: "C",
        academicYear: "2024-25",
        isActive: true,
      },
      {
        className: "11",
        section: "A",
        academicYear: "2024-25",
        isActive: true,
      },
      {
        className: "11",
        section: "B",
        academicYear: "2024-25",
        isActive: true,
      },
      {
        className: "12",
        section: "A",
        academicYear: "2024-25",
        isActive: true,
      },
      {
        className: "12",
        section: "B",
        academicYear: "2024-25",
        isActive: true,
      },
    ];

    // Create classes
    const createdClasses = await Class.insertMany(classes);
    console.log(`✅ Created ${createdClasses.length} classes`);

    console.log("\n📚 Classes Created:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    createdClasses.forEach((cls) => {
      console.log(
        `  Class ${cls.className}-${cls.section} (${cls.academicYear})`,
      );
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding classes:", error.message);
    process.exit(1);
  }
};

seedClasses();
