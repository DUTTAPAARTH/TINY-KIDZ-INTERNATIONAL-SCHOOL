const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Teacher = require("./models/Teacher");
const Student = require("./models/Student");
const User = require("./models/User");
require("./models/Class");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();

    const teacherSample = await Teacher.find()
      .populate("userId", "name email role")
      .populate("classIds", "className section")
      .limit(5);

    const studentSample = await Student.find()
      .populate("userId", "name email role")
      .populate("classId", "className section")
      .limit(3);

    console.log("=== DATABASE CHECK ===");
    console.log("Teacher count:", teacherCount);
    console.log("Student count:", studentCount);

    console.log("\nSample Teachers (DB):");
    teacherSample.forEach((t, i) => {
      const classes =
        (t.classIds || [])
          .map((c) => `${c.className}-${c.section}`)
          .join(", ") || "None";
      console.log(
        `${i + 1}. ${t.userId?.name} | ${t.userId?.email} | Emp:${t.employeeId} | Classes:${classes}`,
      );
    });

    console.log("\nSample Students (DB):");
    studentSample.forEach((s, i) => {
      const cls = s.classId
        ? `${s.classId.className}-${s.classId.section}`
        : "N/A";
      console.log(
        `${i + 1}. ${s.userId?.name} | ${s.userId?.email} | Adm:${s.admissionNumber} | Class:${cls}`,
      );
    });

    const admin = await User.findOne({ role: "admin" });
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "tinykidzsecret",
    );

    const res = await axios.get(
      "http://localhost:5000/api/teachers?page=1&limit=5",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    console.log("\n=== API CHECK (/api/teachers) ===");
    console.log("Status:", res.status);
    console.log("Total teachers:", res.data.pagination?.total);
    console.log("Rows returned:", res.data.data?.length);

    console.log("\nSample Teachers (API):");
    (res.data.data || []).forEach((t, i) => {
      const classes =
        (t.classIds || [])
          .map((c) => `${c.className}-${c.section}`)
          .join(", ") || "None";
      console.log(
        `${i + 1}. ${t.userId?.name} | ${t.userId?.email} | Emp:${t.employeeId} | Classes:${classes}`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Check failed:", error.response?.status || error.message);
    if (error.response?.data) {
      console.error(error.response.data);
    }
    process.exit(1);
  }
})();
