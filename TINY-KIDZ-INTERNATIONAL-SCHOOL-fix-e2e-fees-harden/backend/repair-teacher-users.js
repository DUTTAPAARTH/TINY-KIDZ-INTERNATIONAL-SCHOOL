const mongoose = require("mongoose");
require("dotenv").config();

const Teacher = require("./models/Teacher");
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const teachers = await Teacher.find({}).sort({ employeeId: 1 });

    let repaired = 0;
    let alreadyValid = 0;

    for (let index = 0; index < teachers.length; index += 1) {
      const teacher = teachers[index];

      const existingLinkedUser = teacher.userId
        ? await User.findById(teacher.userId)
        : null;

      if (existingLinkedUser) {
        if (existingLinkedUser.role !== "teacher") {
          existingLinkedUser.role = "teacher";
          await existingLinkedUser.save();
        }
        alreadyValid += 1;
        continue;
      }

      const serial = String(index + 1).padStart(3, "0");
      const fallbackName = `Teacher ${teacher.employeeId || serial}`;
      const fallbackEmail = `teacher${serial}@tinykidz.com`;

      let emailToUse = fallbackEmail;
      let counter = 1;
      while (await User.findOne({ email: emailToUse })) {
        emailToUse = `teacher${serial}_${counter}@tinykidz.com`;
        counter += 1;
      }

      const newUser = await User.create({
        name: fallbackName,
        email: emailToUse,
        password: "teacher123",
        role: "teacher",
        isActive: true,
      });

      teacher.userId = newUser._id;
      await teacher.save();
      repaired += 1;
    }

    const teacherCount = await Teacher.countDocuments();
    const teacherUsers = await User.countDocuments({ role: "teacher" });

    console.log("Repair complete");
    console.log("Teachers total:", teacherCount);
    console.log("Teacher users total:", teacherUsers);
    console.log("Already valid links:", alreadyValid);
    console.log("Repaired links:", repaired);

    process.exit(0);
  } catch (error) {
    console.error("Repair failed:", error.message);
    process.exit(1);
  }
})();
