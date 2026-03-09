import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
} from "@mui/material";
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
  PersonAdd as PersonAddIcon,
  PostAdd as PostAddIcon,
  AddCircle as AddCircleIcon,
  BarChart as BarChartIcon,
  Assessment as AssessmentIcon,
} from "@mui/icons-material";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

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

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    noticesPosted: 0,
  });
  const [recentNotices, setRecentNotices] = useState([]);
  const [feesData, setFeesData] = useState({
    totalCollected: 0,
    totalDue: 0,
  });

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Fetch overview stats from reports API
      try {
        const overviewResponse = await axios.get(
          "http://localhost:5000/api/reports/overview",
          config,
        );
        setStats({
          totalStudents: overviewResponse.data.totalStudents || 0,
          totalTeachers: overviewResponse.data.totalTeachers || 0,
          totalClasses: overviewResponse.data.totalClasses || 0,
          noticesPosted: overviewResponse.data.noticesPosted || 0,
        });
      } catch (error) {
        console.error("Error fetching overview stats:", error);
        // Keep default values
      }

      // Fetch latest notices
      try {
        const noticesResponse = await axios.get(
          "http://localhost:5000/api/notices",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        const notices = noticesResponse.data.data || [];
        setRecentNotices(notices.slice(0, 3)); // Get latest 3
      } catch (error) {
        console.error("Error fetching notices:", error);
        // Fallback to dummy data
        setRecentNotices([
          {
            _id: 1,
            title: "Annual Function Announcement",
            createdAt: "2026-03-04",
          },
          {
            _id: 2,
            title: "Parent-Teacher Meeting Schedule",
            createdAt: "2026-03-03",
          },
          {
            _id: 3,
            title: "Mid-Term Examination Notice",
            createdAt: "2026-03-01",
          },
        ]);
      }

      // Fetch fees summary
      try {
        const feesResponse = await axios.get(
          "http://localhost:5000/api/reports/fees",
          config,
        );
        setFeesData({
          totalCollected: feesResponse.data.totalCollected || 0,
          totalDue: feesResponse.data.totalDue || 0,
        });
      } catch (error) {
        console.error("Error fetching fees summary:", error);
        // Keep default values
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate("/login");
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
    {
      title: "Total Classes",
      value: stats.totalClasses,
      icon: <ClassIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
    {
      title: "Notices Posted",
      value: stats.noticesPosted,
      icon: <CampaignIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
  ];

  const quickActions = [
    {
      label: "Add Student",
      icon: <PersonAddIcon />,
      action: () => handleMenuClick("/admin/students"),
      color: "#D32F2F",
    },
    {
      label: "Add Teacher",
      icon: <SchoolIcon />,
      action: () => handleMenuClick("/admin/teachers"),
      color: "#D32F2F",
    },
    {
      label: "Post Notice",
      icon: <PostAddIcon />,
      action: () => handleMenuClick("/admin/notices"),
      color: "#D32F2F",
    },
    {
      label: "Create Class",
      icon: <AddCircleIcon />,
      action: () => handleMenuClick("/admin/classes"),
      color: "#D32F2F",
    },
    {
      label: "View Reports",
      icon: <AssessmentIcon />,
      action: () => handleMenuClick("/admin/reports"),
      color: "#1976D2",
    },
  ];

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

        {/* Welcome Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#333333" }}>
            Admin Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: "#666666", mt: 0.5 }}>
            Welcome back! Here's what's happening at Tiny Kidz International
            School.
          </Typography>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: "100%",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  transition: "all 0.3s",
                  "&:hover": {
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: "#FFEBEE",
                        borderRadius: 2,
                        p: 1.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: card.color,
                      }}
                    >
                      {card.icon}
                    </Box>
                  </Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 700, color: "#333333", mb: 0.5 }}
                  >
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666666" }}>
                    {card.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Notices and Quick Actions */}
        <Grid container spacing={3}>
          {/* Recent Notices */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CampaignIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Notices
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {recentNotices.map((notice, index) => (
                    <Box key={notice._id || notice.id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemText
                          primary={notice.title}
                          secondary={new Date(
                            notice.createdAt || notice.date,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          primaryTypographyProps={{
                            fontWeight: 500,
                            color: "#333333",
                          }}
                          secondaryTypographyProps={{
                            color: "#999999",
                            fontSize: "0.875rem",
                          }}
                        />
                      </ListItem>
                      {index < recentNotices.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleMenuClick("/admin/notices")}
                  sx={{
                    mt: 2,
                    borderColor: "#D32F2F",
                    color: "#D32F2F",
                    "&:hover": {
                      borderColor: "#C62828",
                      backgroundColor: "#FFEBEE",
                    },
                  }}
                >
                  View All Notices
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AddCircleIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Quick Actions
                  </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                  {quickActions.map((action, index) => (
                    <Grid item xs={12} sm={6} md={2.4} key={index}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={action.icon}
                        onClick={action.action}
                        sx={{
                          backgroundColor: action.color,
                          color: "#ffffff",
                          py: 1.5,
                          fontSize: "0.875rem",
                          textTransform: "none",
                          fontWeight: 500,
                          boxShadow: `0 2px 4px ${action.color === "#1976D2" ? "rgba(25, 118, 210, 0.3)" : "rgba(211, 47, 47, 0.3)"}`,
                          "&:hover": {
                            backgroundColor:
                              action.color === "#1976D2"
                                ? "#1565C0"
                                : "#C62828",
                            boxShadow: `0 4px 8px ${action.color === "#1976D2" ? "rgba(25, 118, 210, 0.4)" : "rgba(211, 47, 47, 0.4)"}`,
                          },
                        }}
                      >
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Fees Quick Access Card */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <FeesIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Fees Overview
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: "#E8F5E9",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#666666", mb: 0.5 }}
                      >
                        Total Collected
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#2E7D32" }}
                      >
                        ₹{feesData.totalCollected.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        p: 1.5,
                        backgroundColor: "#FFEBEE",
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: "#666666", mb: 0.5 }}
                      >
                        Total Due
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#D32F2F" }}
                      >
                        ₹{feesData.totalDue.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FeesIcon />}
                  onClick={() => handleMenuClick("/admin/fees")}
                  sx={{
                    backgroundColor: "#D32F2F",
                    color: "#ffffff",
                    py: 1.2,
                    fontSize: "0.875rem",
                    textTransform: "none",
                    fontWeight: 500,
                    boxShadow: "0 2px 4px rgba(211, 47, 47, 0.3)",
                    "&:hover": {
                      backgroundColor: "#C62828",
                      boxShadow: "0 4px 8px rgba(211, 47, 47, 0.4)",
                    },
                  }}
                >
                  Manage Fees
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
