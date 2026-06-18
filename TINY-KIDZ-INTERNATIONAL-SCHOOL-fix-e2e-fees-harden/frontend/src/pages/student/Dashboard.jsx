import { useState, useEffect } from "react";

import API_BASE from "../../utils/apiConfig";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
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
  LinearProgress,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EventAvailable as AttendanceIcon,
  Assignment as HomeworkIcon,
  Grade as MarksIcon,
  Payment as FeesIcon,
  Campaign as CampaignIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  PendingActions as PendingActionsIcon,
  CreditCard as CreditCardIcon,
  EventNote as EventNoteIcon,
} from "@mui/icons-material";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "axios";
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

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState("/student/dashboard");
  const [stats, setStats] = useState({
    attendancePercentage: 85,
    pendingHomework: 3,
    feeDueAmount: 5000,
    upcomingExams: 4,
  });
  const [recentNotices, setRecentNotices] = useState([]);
  const [recentHomework, setRecentHomework] = useState([]);
  const [feeData, setFeeData] = useState({
    paidAmount: 0,
    dueAmount: 0,
  });

  useEffect(() => {
    // Fetch student dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls when backend endpoints are ready
// const studentData = await axios.get(`${API_BASE}/students/me`);
                    // const attendanceData = await axios.get(`${API_BASE}/attendance/student/:id`);
      // setStats({
      //   attendancePercentage: attendanceData.data.percentage,
      //   pendingHomework: studentData.data.pendingHomework,
      //   feeDueAmount: studentData.data.feeDue,
      //   upcomingExams: studentData.data.upcomingExams,
      // });

      // Dummy data for now
      setStats({
        attendancePercentage: 85,
        pendingHomework: 3,
        feeDueAmount: 5000,
        upcomingExams: 4,
      });

      setRecentNotices([
        {
          id: 1,
          title: "Annual Function Announcement",
          date: "2026-03-04",
        },
        {
          id: 2,
          title: "Parent-Teacher Meeting Schedule",
          date: "2026-03-03",
        },
        {
          id: 3,
          title: "Mid-Term Examination Notice",
          date: "2026-03-01",
        },
      ]);

      // Fetch latest notices
      try {
        const noticesResponse = await axios.get(
          `${API_BASE}/notices`,
          {
            headers: getAuthHeaders(),
          },
        );
        const notices = noticesResponse.data.data || [];
        setRecentNotices(notices.slice(0, 3)); // Get latest 3
      } catch (error) {
        console.error("Error fetching notices:", error);
        // Use dummy data if fetch fails
      }

      setRecentHomework([
        {
          id: 1,
          subject: "Mathematics",
          title: "Chapter 5 Exercises",
          dueDate: "2026-03-07",
          status: "pending",
        },
        {
          id: 2,
          subject: "Science",
          title: "Lab Report Submission",
          dueDate: "2026-03-08",
          status: "pending",
        },
        {
          id: 3,
          subject: "English",
          title: "Essay Writing",
          dueDate: "2026-03-10",
          status: "submitted",
        },
      ]);

      // Fetch student fees data
      try {
        const studentResponse = await axios.get(
          `${API_BASE}/students/me`,
          {
            headers: getAuthHeaders(),
          },
        );
        const studentId = studentResponse.data._id;

        const feesResponse = await axios.get(
          `${API_BASE}/fees/student/${studentId}`,
          {
            headers: getAuthHeaders(),
          },
        );

        if (feesResponse.data && feesResponse.data.length > 0) {
          const fee = feesResponse.data[0];
          setFeeData({
            paidAmount: fee.paidAmount || 0,
            dueAmount: fee.dueAmount || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching fees data:", error);
        // Fallback to dummy data
        setFeeData({
          paidAmount: 15000,
          dueAmount: 5000,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleMenuClick = (path) => {
    setActivePath(path);
    navigate(path);
  };

  const statCards = [
    {
      title: "Attendance",
      value: `${stats.attendancePercentage}%`,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
      showProgress: true,
      progress: stats.attendancePercentage,
    },
    {
      title: "Pending Homework",
      value: stats.pendingHomework,
      icon: <PendingActionsIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
    {
      title: "Fee Due Amount",
      value: `₹${stats.feeDueAmount}`,
      icon: <CreditCardIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
    {
      title: "Upcoming Exams",
      value: stats.upcomingExams,
      icon: <EventNoteIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
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
        }}
      >
        <Toolbar />

        {/* Welcome Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#333333" }}>
            Student Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: "#666666", mt: 0.5 }}>
            Welcome! Here's your academic progress and important information.
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
                  <Typography variant="body2" sx={{ color: "#666666", mb: 1 }}>
                    {card.title}
                  </Typography>
                  {card.showProgress && (
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={card.progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#E0E0E0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#D32F2F",
                          },
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Recent Notices and Recent Homework */}
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
                  onClick={() => handleMenuClick("/student/notices")}
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

          {/* Recent Homework */}
          <Grid item xs={12} md={6}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <HomeworkIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Homework
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {recentHomework.map((homework, index) => (
                    <Box key={homework.id}>
                      <ListItem sx={{ px: 0, py: 1.5 }}>
                        <ListItemText
                          primary={
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 600, color: "#333333" }}
                              >
                                {homework.title}
                              </Typography>
                              {homework.status === "submitted" && (
                                <Box
                                  sx={{
                                    backgroundColor: "#C8E6C9",
                                    color: "#2E7D32",
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: "0.7rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Submitted
                                </Box>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ color: "#666666", fontSize: "0.875rem" }}
                              >
                                {homework.subject}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "#999999",
                                  fontSize: "0.875rem",
                                  mt: 0.5,
                                }}
                              >
                                Due:{" "}
                                {new Date(homework.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentHomework.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
                <Button
                  fullWidth
                  variant="outlined"
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
                  View All Homework
                </Button>
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
                  <CreditCardIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Your Fees
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
                        Paid
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#2E7D32" }}
                      >
                        ₹{feeData.paidAmount.toLocaleString("en-IN")}
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
                        Due
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{ fontWeight: 700, color: "#D32F2F" }}
                      >
                        ₹{feeData.dueAmount.toLocaleString("en-IN")}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<CreditCardIcon />}
                  onClick={() => handleMenuClick("/student/fees")}
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
                  View Fees
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default StudentDashboard;

