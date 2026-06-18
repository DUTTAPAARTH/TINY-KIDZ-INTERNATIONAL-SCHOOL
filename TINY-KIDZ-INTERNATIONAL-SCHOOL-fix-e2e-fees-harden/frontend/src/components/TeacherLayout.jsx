import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EventAvailable as AttendanceIcon,
  Assignment as HomeworkIcon,
  Grade as MarksIcon,
  Campaign as CampaignIcon,
  School as ClassesIcon,
  Person as ProfileIcon,
} from "@mui/icons-material";
import { logout } from "../redux/authSlice";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/teacher/dashboard" },
  { text: "My Classes", icon: <ClassesIcon />, path: "/teacher/classes" },
  { text: "Attendance", icon: <AttendanceIcon />, path: "/teacher/attendance" },
  { text: "Homework", icon: <HomeworkIcon />, path: "/teacher/homework" },
  { text: "Marks", icon: <MarksIcon />, path: "/teacher/marks" },
  { text: "Notices", icon: <CampaignIcon />, path: "/teacher/notices" },
  { text: "My Profile", icon: <ProfileIcon />, path: "/teacher/profile" },
];

const TeacherLayout = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
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
        activePath={location.pathname}
        onMenuClick={handleMenuClick}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default TeacherLayout;
