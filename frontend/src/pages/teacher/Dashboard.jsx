import { useState, useEffect } from "react";
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
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  EventAvailable as AttendanceIcon,
  Assignment as HomeworkIcon,
  Grade as MarksIcon,
  Campaign as CampaignIcon,
  Class as ClassIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  EditNote as EditNoteIcon,
  AddCircle as AddCircleIcon,
} from "@mui/icons-material";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import axios from "axios";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/teacher/dashboard" },
  { text: "Attendance", icon: <AttendanceIcon />, path: "/teacher/attendance" },
  { text: "Homework", icon: <HomeworkIcon />, path: "/teacher/homework" },
  { text: "Marks", icon: <MarksIcon />, path: "/teacher/marks" },
  { text: "Notices", icon: <CampaignIcon />, path: "/teacher/notices" },
];

const TeacherDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState("/teacher/dashboard");
  const [stats, setStats] = useState({
    myClasses: 0,
    todayAttendanceMarked: false,
    homeworkAssigned: 0,
  });
  const [upcomingHomework, setUpcomingHomework] = useState([]);
  const [recentNotices, setRecentNotices] = useState([]);

  useEffect(() => {
    // Fetch teacher dashboard data
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls when backend endpoints are ready
      // const teacherData = await axios.get('http://localhost:5000/api/teachers/me');
      // const attendanceData = await axios.get('http://localhost:5000/api/attendance/today');
      // setStats({
      //   myClasses: teacherData.data.assignedClasses.length,
      //   todayAttendanceMarked: attendanceData.data.marked,
      //   homeworkAssigned: teacherData.data.homeworkCount,
      // });

      // Dummy data for now
      setStats({
        myClasses: 5,
        todayAttendanceMarked: true,
        homeworkAssigned: 12,
      });

      setUpcomingHomework([
        {
          id: 1,
          subject: "Mathematics",
          title: "Chapter 5 Exercises",
          class: "Class 8-A",
          dueDate: "2026-03-07",
        },
        {
          id: 2,
          subject: "Science",
          title: "Lab Report Submission",
          class: "Class 9-B",
          dueDate: "2026-03-08",
        },
        {
          id: 3,
          subject: "English",
          title: "Essay Writing",
          class: "Class 7-C",
          dueDate: "2026-03-10",
        },
        {
          id: 4,
          subject: "Mathematics",
          title: "Geometry Problems",
          class: "Class 10-A",
          dueDate: "2026-03-12",
        },
      ]);

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
        setRecentNotices([]);
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
      title: "My Classes",
      value: stats.myClasses,
      icon: <ClassIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendanceMarked ? "Marked" : "Pending",
      icon: stats.todayAttendanceMarked ? (
        <CheckCircleIcon sx={{ fontSize: 40 }} />
      ) : (
        <ScheduleIcon sx={{ fontSize: 40 }} />
      ),
      color: "#D32F2F",
      chip: stats.todayAttendanceMarked ? "✅" : "⏳",
    },
    {
      title: "Homework Assigned",
      value: stats.homeworkAssigned,
      icon: <HomeworkIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F",
    },
  ];

  const quickActions = [
    {
      label: "Mark Attendance",
      icon: <AttendanceIcon />,
      action: () => console.log("Mark Attendance"),
    },
    {
      label: "Add Homework",
      icon: <EditNoteIcon />,
      action: () => console.log("Add Homework"),
    },
    {
      label: "Add Marks",
      icon: <MarksIcon />,
      action: () => console.log("Add Marks"),
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
            Teacher Dashboard
          </Typography>
          <Typography variant="body1" sx={{ color: "#666666", mt: 0.5 }}>
            Welcome back! Manage your classes and assignments here.
          </Typography>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
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
                    {card.chip && (
                      <Chip
                        label={card.chip}
                        size="small"
                        sx={{
                          fontSize: "1rem",
                          fontWeight: 600,
                        }}
                      />
                    )}
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

        {/* Upcoming Homework and Quick Actions */}
        <Grid container spacing={3}>
          {/* Upcoming Homework Due */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "100%" }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <HomeworkIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Upcoming Homework Due
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {upcomingHomework.map((homework, index) => (
                    <Box key={homework.id}>
                      <ListItem sx={{ px: 0, py: 2 }}>
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
                              <Chip
                                label={homework.subject}
                                size="small"
                                sx={{
                                  backgroundColor: "#FFEBEE",
                                  color: "#D32F2F",
                                  fontWeight: 500,
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ color: "#666666", fontSize: "0.875rem" }}
                              >
                                {homework.class}
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
                      {index < upcomingHomework.length - 1 && <Divider />}
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

          {/* Quick Actions */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "100%" }}
            >
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
                    <Grid item xs={12} key={index}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={action.icon}
                        onClick={action.action}
                        sx={{
                          backgroundColor: "#D32F2F",
                          color: "#ffffff",
                          py: 1.5,
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
                        {action.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                {/* Additional Info Section */}
                <Box
                  sx={{
                    mt: 4,
                    p: 2,
                    backgroundColor: "#F5F5F5",
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: "#333333", mb: 1 }}
                  >
                    📌 Quick Tips
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666666",
                      fontSize: "0.875rem",
                      lineHeight: 1.6,
                    }}
                  >
                    • Mark attendance before 10:00 AM daily
                    <br />
                    • Review pending homework submissions
                    <br />• Update marks within 48 hours of assessment
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Notices Section */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Card sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <CampaignIcon sx={{ color: "#D32F2F", mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Latest Notices
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {recentNotices.length > 0 ? (
                    recentNotices.map((notice, index) => (
                      <Box key={notice._id}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemText
                            primary={notice.title}
                            secondary={new Date(
                              notice.createdAt,
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
                    ))
                  ) : (
                    <Typography sx={{ color: "#666666", py: 2 }}>
                      No notices at this time
                    </Typography>
                  )}
                </List>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleMenuClick("/teacher/notices")}
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
        </Grid>
      </Box>
    </Box>
  );
};

export default TeacherDashboard;
