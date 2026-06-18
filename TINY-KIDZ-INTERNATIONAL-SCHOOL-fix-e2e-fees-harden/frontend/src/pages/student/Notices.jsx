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
import { getAuthHeaders } from "../../utils/authSession";

const menuItems = [
  {
    text: "Dashboard",
    icon: <NotificationsIcon />,
    path: "/student/dashboard",
  },
  { text: "Notices", icon: <NotificationsIcon />, path: "/student/notices" },
];

const StudentNotices = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState("/student/notices");
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
        headers: getAuthHeaders(),
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

  const getLeftBorderColor = (priority) => {
    switch (priority) {
      case "Urgent":
        return "#D32F2F";
      case "Important":
        return "#FF9800";
      case "Normal":
      default:
        return "#BDBDBD";
    }
  };

  const filteredNotices = notices.filter((notice) => {
    const priorityMatch =
      filterPriority === "All" || notice.priority === filterPriority;
    return priorityMatch;
  });

  // Sort so Urgent comes first, then Important, then Normal
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    const priorityOrder = { Urgent: 0, Important: 1, Normal: 2 };
    return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
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
            Stay updated with important announcements
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

        {/* Urgent Banner */}
        {sortedNotices.some((n) => n.priority === "Urgent") && (
          <Box
            sx={{
              backgroundColor: "#FFEBEE",
              border: "2px solid #D32F2F",
              borderRadius: 1,
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 4,
                height: 4,
                backgroundColor: "#D32F2F",
                borderRadius: "50%",
                animation: "pulse 1.5s infinite",
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0.5 },
                },
              }}
            />
            <Typography sx={{ color: "#D32F2F", fontWeight: 600, flex: 1 }}>
              ⚠️ You have{" "}
              {sortedNotices.filter((n) => n.priority === "Urgent").length}{" "}
              URGENT notice(s) that need your attention!
            </Typography>
          </Box>
        )}

        {/* Notices Grid */}
        <Grid container spacing={3}>
          {loading ? (
            <Typography sx={{ p: 3 }}>Loading notices...</Typography>
          ) : sortedNotices.length === 0 ? (
            <Typography sx={{ p: 3 }}>No notices found</Typography>
          ) : (
            sortedNotices.map((notice, index) => (
              <Grid item xs={12} sm={6} md={4} key={notice._id}>
                <Card
                  sx={{
                    height: "100%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    transition: "all 0.3s",
                    position: "relative",
                    borderLeft: `5px solid ${getLeftBorderColor(notice.priority)}`,
                    backgroundColor:
                      notice.priority === "Urgent"
                        ? "#FFEBEE"
                        : notice.priority === "Important"
                          ? "#FFF8E1"
                          : "#fff",
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
                        color:
                          notice.priority === "Urgent" ? "#D32F2F" : "#333333",
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
                          data-testid={`read-more-${index}`}
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
                        justifyContent: "flex-start",
                        pt: 1,
                        borderTop: "1px solid #EEEEEE",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#999999" }}>
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

export default StudentNotices;
