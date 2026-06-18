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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Payment as FeesIcon,
  BarChart as ReportsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { logout } from "../../redux/authSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { getAuthHeaders } from "../../utils/authSession";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Students", icon: <PeopleIcon />, path: "/admin/students" },
  { text: "Teachers", icon: <SchoolIcon />, path: "/admin/teachers" },
  { text: "Classes", icon: <ClassIcon />, path: "/admin/classes" },
  { text: "Fees", icon: <FeesIcon />, path: "/admin/fees" },
  { text: "Notices", icon: <NotificationsIcon />, path: "/admin/notices" },
  { text: "Reports", icon: <ReportsIcon />, path: "/admin/reports" },
];

const AdminNotices = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePath, setActivePath] = useState("/admin/notices");
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "All",
    priority: "Normal",
  });
  const [filterAudience, setFilterAudience] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [expandedIndex, setExpandedIndex] = useState(null);

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
      showSnackbar(
        error.response?.data?.message || "Failed to fetch notices",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (notice = null) => {
    if (notice) {
      setEditingNotice(notice);
      setFormData({
        title: notice.title,
        content: notice.content,
        audience: notice.audience,
        priority: notice.priority,
      });
    } else {
      setEditingNotice(null);
      setFormData({
        title: "",
        content: "",
        audience: "All",
        priority: "Normal",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingNotice(null);
    setFormData({
      title: "",
      content: "",
      audience: "All",
      priority: "Normal",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveNotice = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showSnackbar("Title and content are required", "error");
      return;
    }

    try {
      if (editingNotice) {
        await axios.put(
          `http://localhost:5000/api/notices/${editingNotice._id}`,
          formData,
          {
            headers: getAuthHeaders(),
          },
        );
        showSnackbar("Notice updated successfully");
      } else {
        await axios.post("http://localhost:5000/api/notices", formData, {
          headers: getAuthHeaders(),
        });
        showSnackbar("Notice created successfully");
      }
      handleCloseDialog();
      fetchNotices();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to save notice",
        "error",
      );
    }
  };

  const handleDeleteNotice = async (id) => {
    if (window.confirm("Are you sure you want to delete this notice?")) {
      try {
        await axios.delete(`http://localhost:5000/api/notices/${id}`, {
          headers: getAuthHeaders(),
        });
        showSnackbar("Notice deleted successfully");
        fetchNotices();
      } catch (error) {
        showSnackbar(
          error.response?.data?.message || "Failed to delete notice",
          "error",
        );
      }
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
    const audienceMatch =
      filterAudience === "All" || notice.audience === filterAudience;
    const priorityMatch =
      filterPriority === "All" || notice.priority === filterPriority;
    return audienceMatch && priorityMatch;
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: "#333333" }}>
              Notice Board
            </Typography>
            <Typography variant="body2" sx={{ color: "#666666", mt: 0.5 }}>
              Manage and post notices for teachers and students
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: "#D32F2F",
              color: "#ffffff",
              px: 3,
              py: 1.2,
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#C62828" },
            }}
          >
            Post Notice
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Audience</InputLabel>
            <Select
              value={filterAudience}
              label="Filter by Audience"
              onChange={(e) => setFilterAudience(e.target.value)}
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Teachers">Teachers</MenuItem>
              <MenuItem value="Students">Students</MenuItem>
            </Select>
          </FormControl>

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
                        pr: 4,
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
                        {notice.postedBy?.name && `By ${notice.postedBy.name}`}
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

                      {/* Actions */}
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(notice)}
                          sx={{
                            color: "#2196F3",
                            "&:hover": { backgroundColor: "#E3F2FD" },
                          }}
                        >
                          <EditIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNotice(notice._id)}
                          sx={{
                            color: "#D32F2F",
                            "&:hover": { backgroundColor: "#FFEBEE" },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Post/Edit Notice Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: "#333333" }}>
          {editingNotice ? "Edit Notice" : "Post Notice"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            margin="normal"
            placeholder="Enter notice title"
          />
          <TextField
            fullWidth
            label="Content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            margin="normal"
            multiline
            rows={5}
            placeholder="Enter notice content"
          />
          <TextField
            fullWidth
            select
            label="Audience"
            name="audience"
            value={formData.audience}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Teachers">Teachers</MenuItem>
            <MenuItem value="Students">Students</MenuItem>
          </TextField>
          <TextField
            fullWidth
            select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            margin="normal"
          >
            <MenuItem value="Normal">Normal</MenuItem>
            <MenuItem value="Important">Important</MenuItem>
            <MenuItem value="Urgent">Urgent</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "#666666" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveNotice}
            variant="contained"
            sx={{
              backgroundColor: "#D32F2F",
              color: "#fff",
              "&:hover": { backgroundColor: "#C62828" },
            }}
          >
            {editingNotice ? "Update" : "Post"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminNotices;
