const mongoose = require("mongoose");
require("dotenv").config();

const SUBJECTS_TO_SEED = [
  { name: "English", code: "ENG101" },
  { name: "Mathematics", code: "MATH101" },
  { name: "Science", code: "SCI101" },
  { name: "Hindi", code: "HIN101" },
  { name: "Computer", code: "COMP101" },
  { name: "Social Studies", code: "SST101" },
  { name: "Art", code: "ART101" },
  { name: "Physical Education", code: "PE101" },
];

const randomFromArray = (items) =>
  items[Math.floor(Math.random() * items.length)];

const seedSubjects = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const classes = await mongoose.connection
      .collection("classes")
      .find({}, { projection: { _id: 1 } })
      .toArray();

    if (!classes.length) {
      throw new Error("No classes found. Seed classes first.");
    }

    const teachers = await mongoose.connection
      .collection("teachers")
      .find({}, { projection: { _id: 1 } })
      .toArray();

    if (!teachers.length) {
      throw new Error("No teachers found. Seed teachers first.");
    }

    const existingSubjects = await mongoose.connection
      .collection("subjects")
      .find(
        {
          $or: [
            { code: { $in: SUBJECTS_TO_SEED.map((subject) => subject.code) } },
            { name: { $in: SUBJECTS_TO_SEED.map((subject) => subject.name) } },
          ],
        },
        { projection: { code: 1, name: 1 } },
      )
      .toArray();

    const existingCodes = new Set(
      existingSubjects.map((subject) => subject.code),
    );
    const existingNames = new Set(
      existingSubjects.map((subject) => subject.name),
    );

    const newSubjects = SUBJECTS_TO_SEED.filter(
      (subject) =>
        !existingCodes.has(subject.code) && !existingNames.has(subject.name),
    );

    if (newSubjects.length > 0) {
      const docs = newSubjects.map((subject) => ({
        ...subject,
        classId: randomFromArray(classes)._id,
        teacherId: randomFromArray(teachers)._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await mongoose.connection
        .collection("subjects")
        .insertMany(docs, { ordered: true });
    }

    console.log("✅ 8 subjects seeded");
    console.log(`🆕 Inserted: ${newSubjects.length}`);
    console.log(
      `⏭️ Skipped existing: ${SUBJECTS_TO_SEED.length - newSubjects.length}`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding subjects:", error.message);
    process.exit(1);
  }
};

seedSubjects();
