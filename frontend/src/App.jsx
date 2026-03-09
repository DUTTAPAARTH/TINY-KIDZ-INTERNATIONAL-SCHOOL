import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminMarks from "./pages/admin/Marks";
import AdminReports from "./pages/admin/Reports";
import AdminStudents from "./pages/admin/Students";
import AdminTeachers from "./pages/admin/Teachers";
import AdminClasses from "./pages/admin/Classes";
import AdminSubjects from "./pages/admin/Subjects";
import AdminAttendance from "./pages/admin/Attendance";
import AdminHomework from "./pages/admin/Homework";
import AdminFees from "./pages/admin/Fees";
import AdminNotices from "./pages/admin/Notices";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherMarks from "./pages/teacher/Marks";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherHomework from "./pages/teacher/Homework";
import TeacherNotices from "./pages/teacher/Notices";
import StudentDashboard from "./pages/student/Dashboard";
import StudentMarks from "./pages/student/Marks";
import StudentAttendance from "./pages/student/Attendance";
import StudentHomework from "./pages/student/Homework";
import StudentFees from "./pages/student/Fees";
import StudentNotices from "./pages/student/Notices";
import PrivateRoute from "./components/ProtectedRoute";

function App() {
  const { token, role } = useSelector((state) => state.auth);
  const isAuthenticated = Boolean(token && role);

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
        />

        {/* Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminReports />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/attendance"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminAttendance />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/homework"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminHomework />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/marks"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminMarks />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminStudents />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/teachers"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminTeachers />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/classes"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminClasses />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/subjects"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminSubjects />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/fees"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminFees />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/notices"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminNotices />
            </PrivateRoute>
          }
        />

        {/* Teacher Route */}
        <Route
          path="/teacher/dashboard"
          element={
            <PrivateRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/marks"
          element={
            <PrivateRoute allowedRoles={["teacher"]}>
              <TeacherMarks />
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/attendance"
          element={
            <PrivateRoute allowedRoles={["teacher"]}>
              <TeacherAttendance />
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/homework"
          element={
            <PrivateRoute allowedRoles={["teacher"]}>
              <TeacherHomework />
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher/notices"
          element={
            <PrivateRoute allowedRoles={["teacher"]}>
              <TeacherNotices />
            </PrivateRoute>
          }
        />

        {/* Student Route */}
        <Route
          path="/student/dashboard"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/student/marks"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentMarks />
            </PrivateRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentAttendance />
            </PrivateRoute>
          }
        />

        <Route
          path="/student/homework"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentHomework />
            </PrivateRoute>
          }
        />

        <Route
          path="/student/fees"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentFees />
            </PrivateRoute>
          }
        />

        <Route
          path="/student/notices"
          element={
            <PrivateRoute allowedRoles={["student"]}>
              <StudentNotices />
            </PrivateRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={`/${getDefaultRoute()}`} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Fallback Route */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

function getDefaultRoute() {
  const role = localStorage.getItem("role");
  const validRoles = ["admin", "teacher", "student"];
  return validRoles.includes(role) ? `${role}/dashboard` : "login";
}

export default App;
