import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Toolbar,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { logout } from "../../redux/authSlice";
import { useDispatch } from "react-redux";
import axios from "axios";

const menuItems = [
  {
    text: "Dashboard",
    icon: <NotificationsIcon />,
    path: "/teacher/dashboard",
  },
  { text: "Notices", icon: <NotificationsIcon />, path: "/teacher/notices" },
];

const TeacherNotices = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState("/teacher/notices");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [filterPriority, setFilterPriority] = useState("All");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/api/notices", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setNotices(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (path) => {
    setActivePath(path);
    navigate(path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent":
        return "#D32F2F";
      case "Important":
        return "#FF9800";
      case "Normal":
      default:
        return "#9E9E9E";
    }
  };

  const getAudienceColor = (audience) => {
    switch (audience) {
      case "Teachers":
        return "#9C27B0";
      case "Students":
        return "#4CAF50";
      case "All":
      default:
        return "#2196F3";
    }
  };

  const filteredNotices = notices.filter((notice) => {
    const priorityMatch =
      filterPriority === "All" || notice.priority === filterPriority;
    return priorityMatch;
  });

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

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: "#333333" }}>
            Notice Board
          </Typography>
          <Typography variant="body2" sx={{ color: "#666666", mt: 0.5 }}>
            Read announcements and important notices
          </Typography>
        </Box>

        {/* Filter */}
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Priority</InputLabel>
            <Select
              value={filterPriority}
              label="Filter by Priority"
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Important">Important</MenuItem>
              <MenuItem value="Urgent">Urgent</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Notices Grid */}
        <Grid container spacing={3}>
          {loading ? (
            <Typography sx={{ p: 3 }}>Loading notices...</Typography>
          ) : filteredNotices.length === 0 ? (
            <Typography sx={{ p: 3 }}>No notices found</Typography>
          ) : (
            filteredNotices.map((notice, index) => (
              <Grid item xs={12} sm={6} md={4} key={notice._id}>
                <Card
                  sx={{
                    height: "100%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "all 0.3s",
                    position: "relative",
                    "&:hover": {
                      boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  {/* Priority Badge */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: getPriorityColor(notice.priority),
                      color: "#fff",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      zIndex: 1,
                    }}
                  >
                    {notice.priority}
                  </Box>

                  <CardContent>
                    {/* Audience Chip */}
                    <Box sx={{ mb: 1.5 }}>
                      <Chip
                        label={notice.audience}
                        size="small"
                        sx={{
                          backgroundColor: getAudienceColor(notice.audience),
                          color: "#fff",
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#333333",
                        mb: 1,
                      }}
                    >
                      {notice.title}
                    </Typography>

                    {/* Content */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#666666",
                        mb: 2,
                        lineHeight: 1.6,
                      }}
                    >
                      {expandedIndex === index
                        ? notice.content
                        : notice.content.length > 100
                          ? notice.content.substring(0, 100) + "..."
                          : notice.content}
                      {notice.content.length > 100 && (
                        <Button
                          size="small"
                          onClick={() =>
                            setExpandedIndex(
                              expandedIndex === index ? null : index,
                            )
                          }
                          sx={{
                            textTransform: "none",
                            color: "#D32F2F",
                            fontWeight: 600,
                            ml: 0.5,
                          }}
                        >
                          {expandedIndex === index ? "Show less" : "Read more"}
                        </Button>
                      )}
                    </Typography>

                    {/* Footer */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pt: 1,
                        borderTop: "1px solid #EEEEEE",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#999999" }}>
                        <strong>Posted by Admin</strong>
                        {" • "}
                        {new Date(notice.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          },
                        )}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default TeacherNotices;
