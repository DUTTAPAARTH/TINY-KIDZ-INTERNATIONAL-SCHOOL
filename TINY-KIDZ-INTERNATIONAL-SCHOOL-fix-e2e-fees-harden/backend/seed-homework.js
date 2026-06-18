const mongoose = require("mongoose");
const Homework = require("./models/Homework");
require("dotenv").config();

const seedHomework = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get all data directly from collections
    const teachers = await mongoose.connection
      .collection("teachers")
      .find({})
      .toArray();
    const classes = await mongoose.connection
      .collection("classes")
      .find({})
      .toArray();
    const subjects = await mongoose.connection
      .collection("subjects")
      .find({})
      .toArray();

    if (
      teachers.length === 0 ||
      classes.length === 0 ||
      subjects.length === 0
    ) {
      console.log(
        "❌ No teachers, classes, or subjects found. Please seed those first.",
      );
      process.exit(1);
    }

    // Clear existing homework
    await Homework.deleteMany({});
    console.log("🗑️  Cleared existing homework");

    // Create homework assignments
    const homeworkData = [];
    const today = new Date();

    for (const classDoc of classes) {
      // Get teachers assigned to this class
      const classTeachers = teachers.filter((t) => {
        if (!t.classIds || !Array.isArray(t.classIds)) return false;
        return t.classIds.some(
          (cid) => cid.toString() === classDoc._id.toString(),
        );
      });

      if (classTeachers.length === 0) continue;

      // Get subjects for this class
      const classSubjects = subjects.filter(
        (s) => s.classId?.toString() === classDoc._id.toString(),
      );

      if (classSubjects.length === 0) continue;

      // Create 3-5 homework per class
      const homeworkCount = Math.floor(Math.random() * 3) + 3; // 3-5 homework

      for (let i = 0; i < homeworkCount; i++) {
        const randomTeacher =
          classTeachers[Math.floor(Math.random() * classTeachers.length)];
        const randomSubject =
          classSubjects[Math.floor(Math.random() * classSubjects.length)];

        // Random due date: 1-14 days from today
        const daysFromToday = Math.floor(Math.random() * 14) + 1;
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + daysFromToday);

        const homework = {
          classId: classDoc._id,
          subjectId: randomSubject._id,
          title: `${randomSubject.name} Assignment ${i + 1}`,
          description: `Complete the following exercises from chapter ${Math.floor(Math.random() * 20) + 1}. 
            Please submit your work by the due date. Show all your work and explain your reasoning.`,
          dueDate,
          assignedBy: randomTeacher.userId,
          attachmentLink:
            Math.random() > 0.5
              ? `https://example.com/homework/assignment-${i + 1}.pdf`
              : null,
        };

        homeworkData.push(homework);
      }
    }

    if (homeworkData.length === 0) {
      console.log(
        "❌ No homework could be created. Check class and teacher assignments.",
      );
      process.exit(1);
    }

    await Homework.insertMany(homeworkData);
    console.log(`✅ ${homeworkData.length} homework assignments seeded`);

    console.log("\n🎉 Homework seeding completed successfully!");
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Total Classes: ${classes.length}`);
    console.log(`Total Teachers: ${teachers.length}`);
    console.log(`Total Subjects: ${subjects.length}`);
    console.log(`Total Homework Created: ${homeworkData.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding homework:", error.message);
    process.exit(1);
  }
};

seedHomework();
