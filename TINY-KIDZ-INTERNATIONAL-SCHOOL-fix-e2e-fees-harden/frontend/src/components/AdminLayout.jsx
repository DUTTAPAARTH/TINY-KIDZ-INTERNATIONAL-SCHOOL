import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Toolbar } from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Payment as FeesIcon,
  Campaign as CampaignIcon,
  Assessment as ReportsIcon,
  Grade as MarksIcon,
} from "@mui/icons-material";
import { logout } from "../redux/authSlice";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Students", icon: <PeopleIcon />, path: "/admin/students" },
  { text: "Teachers", icon: <SchoolIcon />, path: "/admin/teachers" },
  { text: "Classes", icon: <ClassIcon />, path: "/admin/classes" },
  { text: "Fees", icon: <FeesIcon />, path: "/admin/fees" },
  { text: "Marks", icon: <MarksIcon />, path: "/admin/marks" },
  { text: "Notices", icon: <CampaignIcon />, path: "/admin/notices" },
  { text: "Reports", icon: <ReportsIcon />, path: "/admin/reports" },
];

const AdminLayout = ({ children }) => {
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          p: 3,
          mt: 8,
          overflow: "auto",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
