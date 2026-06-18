const axios = require("axios");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/User");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const admin = await User.findOne({ role: "admin" });
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "tinykidzsecret",
    );
    const headers = { Authorization: `Bearer ${token}` };

    const create = await axios.post(
      "http://localhost:5000/api/classes",
      {
        className: "Class 99",
        section: "A",
        academicYear: "2024-25",
        classTeacher: null,
      },
      { headers },
    );

    const classId = create.data.data._id;

    const list = await axios.get("http://localhost:5000/api/classes", {
      headers,
    });

    const update = await axios.put(
      `http://localhost:5000/api/classes/${classId}`,
      {
        className: "Class 99",
        section: "B",
        academicYear: "2024-25",
        classTeacher: null,
      },
      { headers },
    );

    const del = await axios.delete(
      `http://localhost:5000/api/classes/${classId}`,
      {
        headers,
      },
    );

    console.log("create", create.status, create.data.success);
    console.log("list", list.status, list.data.count);
    console.log("update", update.status, update.data.success);
    console.log("delete", del.status, del.data.success);

    process.exit(0);
  } catch (error) {
    console.error(
      "err",
      error.response?.status,
      error.response?.data || error.message,
    );
    process.exit(1);
  }
})();
