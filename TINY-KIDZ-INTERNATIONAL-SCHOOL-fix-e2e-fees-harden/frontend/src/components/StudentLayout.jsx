import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EventAvailable as AttendanceIcon,
  Assignment as HomeworkIcon,
  Grade as MarksIcon,
  Payment as FeesIcon,
  Campaign as CampaignIcon,
} from "@mui/icons-material";
import { logout } from "../redux/authSlice";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/student/dashboard" },
  { text: "Attendance", icon: <AttendanceIcon />, path: "/student/attendance" },
  { text: "Homework", icon: <HomeworkIcon />, path: "/student/homework" },
  { text: "Marks", icon: <MarksIcon />, path: "/student/marks" },
  { text: "Fees", icon: <FeesIcon />, path: "/student/fees" },
  { text: "Notices", icon: <CampaignIcon />, path: "/student/notices" },
];

const StudentLayout = ({ children }) => {
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

export default StudentLayout;
