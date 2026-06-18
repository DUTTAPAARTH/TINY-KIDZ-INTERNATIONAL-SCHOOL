import { useEffect, useState } from "react";
import API_BASE from "../../utils/apiConfig";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EventAvailable as AttendanceIcon,
  Assignment as HomeworkIcon,
  Grade as MarksIcon,
  Payment as FeesIcon,
  Campaign as CampaignIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import axios from "axios";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { getAuthHeaders } from "../../utils/authSession";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/student/dashboard" },
  { text: "Attendance", icon: <AttendanceIcon />, path: "/student/attendance" },
  { text: "Homework", icon: <HomeworkIcon />, path: "/student/homework" },
  { text: "Marks", icon: <MarksIcon />, path: "/student/marks" },
  { text: "Fees", icon: <FeesIcon />, path: "/student/fees" },
  { text: "Notices", icon: <CampaignIcon />, path: "/student/notices" },
  { text: "My Profile", icon: <PersonIcon />, path: "/student/profile" },
];

const StudentProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get(`${API_BASE}/students/me`, { headers: getAuthHeaders() })
      .then((res) => setProfile(res.data?.data || null))
      .catch((err) => {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const classLabel = profile?.classId
    ? `${profile.classId.className}${profile.classId.section ? ` - ${profile.classId.section}` : ""}`
    : "Not assigned";

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar schoolName="Tiny Kidz International School" onLogout={handleLogout} />
      <Sidebar
        menuItems={menuItems}
        activePath="/student/profile"
        onMenuClick={(path) => navigate(path)}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Toolbar />
        <Typography variant="h4" sx={{ color: "#D32F2F", fontWeight: 800, mb: 3 }}>
          My Profile
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" minHeight={200}>
            <CircularProgress sx={{ color: "#D32F2F" }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Personal Details
                  </Typography>
                  <Typography>Name: {profile?.userId?.name || "—"}</Typography>
                  <Typography>Email: {profile?.userId?.email || "—"}</Typography>
                  <Typography>Admission No: {profile?.admissionNumber || "—"}</Typography>
                  <Typography>Gender: {profile?.gender || "—"}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Academic Details
                  </Typography>
                  <Typography>Class: {classLabel}</Typography>
                  <Typography>Academic Year: {profile?.academicYear || "—"}</Typography>
                  <Typography>
                    Parental Support: {profile?.parentalSupport || "—"}
                  </Typography>
                  <Typography>
                    Status: {profile?.isActive ? "Active" : "Inactive"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default StudentProfile;

