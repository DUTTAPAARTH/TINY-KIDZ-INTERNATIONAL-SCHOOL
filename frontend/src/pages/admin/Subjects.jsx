import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Toolbar, Typography, Container } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  MenuBook as SubjectsIcon,
  EventAvailable as AttendanceIcon,
  Assignment as HomeworkIcon,
  Grade as MarksIcon,
  Payment as FeesIcon,
  Campaign as CampaignIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Students", icon: <PeopleIcon />, path: "/admin/students" },
  { text: "Teachers", icon: <SchoolIcon />, path: "/admin/teachers" },
  { text: "Classes", icon: <ClassIcon />, path: "/admin/classes" },
  { text: "Subjects", icon: <SubjectsIcon />, path: "/admin/subjects" },
  { text: "Attendance", icon: <AttendanceIcon />, path: "/admin/attendance" },
  { text: "Homework", icon: <HomeworkIcon />, path: "/admin/homework" },
  { text: "Marks", icon: <MarksIcon />, path: "/admin/marks" },
  { text: "Fees", icon: <FeesIcon />, path: "/admin/fees" },
  { text: "Notices", icon: <CampaignIcon />, path: "/admin/notices" },
  { text: "Reports", icon: <BarChartIcon />, path: "/admin/reports" },
];

const Subjects = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate("/login");
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar
        schoolName="Tiny Kidz International School"
        onLogout={handleLogout}
      />
      <Sidebar
        menuItems={menuItems}
        activePath={activePath}
        onMenuClick={handleMenuClick}
      />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
          marginTop: "64px",
        }}
      >
        <Toolbar />
        <Container maxWidth="xl">
          <Typography
            variant="h4"
            sx={{ fontWeight: 600, color: "#D32F2F", mb: 3 }}
          >
            Subjects Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Subjects management functionality coming soon...
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Subjects;
