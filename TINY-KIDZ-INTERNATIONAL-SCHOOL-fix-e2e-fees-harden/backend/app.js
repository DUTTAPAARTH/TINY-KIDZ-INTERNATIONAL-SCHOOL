const express = require("express");
const cors = require("cors");
const authRoutes = require("./modules/auth/auth.routes");
const marksRoutes = require("./modules/marks/marks.routes");
const studentsRoutes = require("./modules/students/students.routes");
const classesRoutes = require("./modules/classes/classes.routes");
const teachersRoutes = require("./modules/teachers/teachers.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const homeworkRoutes = require("./modules/homework/homework.routes");
const feesRoutes = require("./modules/fees/fees.routes");
const noticesRoutes = require("./modules/notices/notices.routes");
const reportsRoutes = require("./modules/reports/reports.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/students", studentsRoutes);
app.use("/api/classes", classesRoutes);
app.use("/api/teachers", teachersRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/homework", homeworkRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/reports", reportsRoutes);

app.get("/", (req, res) => {
  res.send("Tiny Kidz School API Running 🚀");
});

module.exports = app;
