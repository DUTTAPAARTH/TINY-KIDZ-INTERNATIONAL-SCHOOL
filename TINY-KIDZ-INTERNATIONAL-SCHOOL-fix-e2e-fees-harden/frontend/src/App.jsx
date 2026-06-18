import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminReports from "./pages/admin/Reports";
import AdminStudents from "./pages/admin/Students";
import AdminTeachers from "./pages/admin/Teachers";
import AdminClasses from "./pages/admin/Classes";
import AdminFees from "./pages/admin/Fees";
import AdminMarks from "./pages/admin/Marks";
import AdminNotices from "./pages/admin/Notices";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherMyClasses from "./pages/teacher/MyClasses";
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
import StudentProfile from "./pages/student/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const { token, role } = useSelector((state) => state.auth);
  const isAuthenticated = Boolean(token && role);

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Route */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminTeachers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/fees"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminFees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/marks"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminMarks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/notices"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminNotices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/classes"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherMyClasses />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/marks"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherMarks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/attendance"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/homework"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherHomework />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/notices"
          element={
            <ProtectedRoute allowedRoles={["teacher"]}>
              <TeacherNotices />
            </ProtectedRoute>
          }
        />

        {/* Student Route */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/marks"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentMarks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/attendance"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentAttendance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/homework"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentHomework />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/fees"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentFees />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/notices"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentNotices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Fallback Route */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/login" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
