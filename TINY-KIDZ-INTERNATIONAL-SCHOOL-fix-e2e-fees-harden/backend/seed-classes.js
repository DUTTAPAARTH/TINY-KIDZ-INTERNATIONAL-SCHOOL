const mongoose = require("mongoose");
const Class = require("./models/Class");
require("dotenv").config();

const ACADEMIC_YEAR = "2025-26";
const SECTIONS = ["A", "B", "C"];

const gradeNames = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
];

const seedClasses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Class.deleteMany({});
    console.log("Cleared existing classes");

    const classes = [];
    for (const grade of gradeNames) {
      for (const section of SECTIONS) {
        classes.push({
          className: grade,
          section,
          academicYear: ACADEMIC_YEAR,
          isActive: true,
        });
      }
    }

    const createdClasses = await Class.insertMany(classes);
    console.log(`Created ${createdClasses.length} classes`);

    createdClasses.forEach((cls) => {
      console.log(`  ${cls.className}-${cls.section} (${cls.academicYear})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error seeding classes:", error.message);
    process.exit(1);
  }
};

seedClasses();
