import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Alert,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Payment as FeesIcon,
  Campaign as CampaignIcon,
  BarChart as ReportsIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import API from "../../services/authService";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Students", icon: <PeopleIcon />, path: "/admin/students" },
  { text: "Teachers", icon: <SchoolIcon />, path: "/admin/teachers" },
  { text: "Classes", icon: <ClassIcon />, path: "/admin/classes" },
  { text: "Fees", icon: <FeesIcon />, path: "/admin/fees" },
  { text: "Notices", icon: <CampaignIcon />, path: "/admin/notices" },
  { text: "Reports", icon: <ReportsIcon />, path: "/admin/reports" },
];

const formatClassName = (className) => {
  if (!className) return "";
  return className.toLowerCase().startsWith("class")
    ? className
    : `Class ${className}`;
};

const Classes = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentClass, setCurrentClass] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const [formData, setFormData] = useState({
    className: "",
    section: "",
    academicYear: "2024-2025",
    classTeacher: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate("/login");
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await API.get("/classes");
      if (response.data.success) {
        setClasses(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      showSnackbar("Failed to fetch classes", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await API.get("/teachers", {
        params: { page: 1, limit: 1000 },
      });
      if (response.data.success) {
        setTeachers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showSnackbar("Failed to fetch teachers", "error");
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const handleAddClass = () => {
    setDialogMode("add");
    setCurrentClass(null);
    setFormData({
      className: "",
      section: "",
      academicYear: "2024-2025",
      classTeacher: "",
    });
    setOpenDialog(true);
  };

  const handleEditClass = (classRow) => {
    setDialogMode("edit");
    setCurrentClass(classRow);
    setFormData({
      className: classRow.className || "",
      section: classRow.section || "",
      academicYear: classRow.academicYear || "2024-25",
      classTeacher: classRow.classTeacher?._id || "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentClass(null);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitClass = async () => {
    try {
      if (!formData.className || !formData.section || !formData.academicYear) {
        showSnackbar("Please fill all required fields", "error");
        return;
      }

      const payload = {
        className: formData.className.trim(),
        section: formData.section.trim().toUpperCase(),
        academicYear: formData.academicYear.trim(),
        classTeacher: formData.classTeacher || null,
      };

      if (dialogMode === "add") {
        const response = await API.post("/classes", payload);
        if (response.data.success) {
          showSnackbar("Class created successfully", "success");
          fetchClasses();
          handleCloseDialog();
        }
      } else {
        const response = await API.put(`/classes/${currentClass._id}`, payload);
        if (response.data.success) {
          showSnackbar("Class updated successfully", "success");
          fetchClasses();
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error("Error saving class:", error);
      showSnackbar(
        error.response?.data?.message || "Failed to save class",
        "error",
      );
    }
  };

  const handleDeleteClick = (classRow) => {
    setClassToDelete(classRow);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setClassToDelete(null);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await API.delete(`/classes/${classToDelete._id}`);
      if (response.data.success) {
        showSnackbar("Class deleted successfully", "success");
        fetchClasses();
        handleCloseDeleteDialog();
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      showSnackbar(
        error.response?.data?.message || "Failed to delete class",
        "error",
      );
    }
  };

  const columns = [
    {
      field: "className",
      headerName: "Class Name",
      width: 140,
      valueGetter: (value, row) => formatClassName(row.className),
    },
    { field: "section", headerName: "Section", width: 100 },
    {
      field: "fullName",
      headerName: "Full Name",
      width: 180,
      valueGetter: (value, row) =>
        `${formatClassName(row.className)} - ${row.section || ""}`,
    },
    { field: "academicYear", headerName: "Academic Year", width: 130 },
    {
      field: "classTeacher",
      headerName: "Class Teacher",
      width: 200,
      valueGetter: (value, row) =>
        row.classTeacher?.userId?.name || "Not Assigned",
    },
    {
      field: "totalStudents",
      headerName: "Total Students",
      width: 130,
      valueGetter: (value, row) => row.students?.length || 0,
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditClass(params.row)}
            sx={{ mr: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            sx={{ color: "#D32F2F" }}
            onClick={() => handleDeleteClick(params.row)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
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
          <Box sx={{ mb: 4 }}>
            <Grid
              container
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 3 }}
            >
              <Grid item>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 600, color: "#D32F2F" }}
                >
                  Classes Management
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddClass}
                  sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
                >
                  Add Class
                </Button>
              </Grid>
            </Grid>

            <Card>
              <Box sx={{ height: 650, width: "100%" }}>
                <DataGrid
                  rows={classes}
                  columns={columns}
                  pageSizeOptions={[10, 25, 50, 100]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 25, page: 0 } },
                  }}
                  loading={loading}
                  disableRowSelectionOnClick
                  getRowId={(row) => row._id}
                  sx={{
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f5f5f5",
                      fontWeight: "bold",
                    },
                    "& .MuiDataGrid-row:hover": { backgroundColor: "#ffebee" },
                  }}
                />
              </Box>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* ── Add / Edit Dialog ── */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#D32F2F", color: "white", py: 2 }}>
          {dialogMode === "add" ? "Add New Class" : "Edit Class"}
        </DialogTitle>

        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Class Name */}
            <FormControl fullWidth required variant="outlined">
              <InputLabel>Class Name</InputLabel>
              <Select
                name="className"
                value={formData.className}
                onChange={handleFormChange}
                label="Class Name"
              >
                <MenuItem value="">Select Class</MenuItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <MenuItem key={i + 1} value={String(i + 1)}>
                    Class {i + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Section */}
            <FormControl fullWidth required variant="outlined">
              <InputLabel>Section</InputLabel>
              <Select
                name="section"
                value={formData.section}
                onChange={handleFormChange}
                label="Section"
              >
                <MenuItem value="">Select Section</MenuItem>
                {["A", "B", "C", "D"].map((sec) => (
                  <MenuItem key={sec} value={sec}>
                    Section {sec}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Academic Year */}
            <FormControl fullWidth required variant="outlined">
              <InputLabel>Academic Year</InputLabel>
              <Select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleFormChange}
                label="Academic Year"
              >
                {["2024-2025", "2025-2026", "2026-2027"].map((yr) => (
                  <MenuItem key={yr} value={yr}>
                    {yr}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Class Teacher */}
            <FormControl fullWidth variant="outlined">
              <InputLabel>Class Teacher (optional)</InputLabel>
              <Select
                name="classTeacher"
                value={formData.classTeacher}
                onChange={handleFormChange}
                label="Class Teacher (optional)"
              >
                <MenuItem value="">None</MenuItem>
                {teachers.map((teacher) => (
                  <MenuItem key={teacher._id} value={teacher._id}>
                    {teacher.userId?.name || teacher.employeeId}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Preview */}
            {formData.className && formData.section && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#FFF8F8",
                  borderRadius: 1,
                  border: "1px solid #FFCDD2",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" sx={{ color: "#999" }}>
                  Preview
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#D32F2F" }}
                >
                  Class {formData.className} - {formData.section} (
                  {formData.academicYear})
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitClass}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
          >
            {dialogMode === "add" ? "Add Class" : "Update Class"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>
              {classToDelete
                ? `${formatClassName(classToDelete.className)} - ${classToDelete.section}`
                : "this class"}
            </strong>
            ? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmDelete}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Classes;
