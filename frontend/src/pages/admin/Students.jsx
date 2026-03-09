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
  TextField,
  Toolbar,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
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
  Assessment as ReportsIcon,
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
  { text: "Subjects", icon: <SubjectsIcon />, path: "/admin/subjects" },
  { text: "Attendance", icon: <AttendanceIcon />, path: "/admin/attendance" },
  { text: "Homework", icon: <HomeworkIcon />, path: "/admin/homework" },
  { text: "Marks", icon: <MarksIcon />, path: "/admin/marks" },
  { text: "Fees", icon: <FeesIcon />, path: "/admin/fees" },
  { text: "Notices", icon: <CampaignIcon />, path: "/admin/notices" },
  { text: "Reports", icon: <ReportsIcon />, path: "/admin/reports" },
];

const Students = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  // State management
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25,
  });
    const [sortModel, setSortModel] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // 'add' or 'edit'
  const [currentStudent, setCurrentStudent] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    admissionNumber: "",
    classId: "",
    rollNumber: "",
    dateOfBirth: "",
    parentName: "",
    parentPhone: "",
    address: "",
    gender: "Male",
    academicYear: "2024-25",
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        search: searchQuery,
      };
      
      // Add classId filter if not "all"
      if (classFilter && classFilter !== "all") {
        params.classId = classFilter;
      }
            // Add sorting if specified
            if (sortModel.length > 0) {
              params.sortBy = sortModel[0].field;
              params.sortOrder = sortModel[0].sort;
            }
      
      
      const response = await API.get("/students", { params });

      if (response.data.success) {
        setStudents(response.data.data);
        setTotalRows(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      showSnackbar("Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch classes
  const fetchClasses = async () => {
    try {
      const response = await API.get("/classes");
      if (response.data.success) {
        setClasses(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [paginationModel.page, paginationModel.pageSize, searchQuery, classFilter, sortModel]);

  useEffect(() => {
    fetchClasses();
  }, []);

  // Show snackbar
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Handle logout
  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // Handle menu navigation
  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Handle pagination change
  const handlePaginationChange = (newModel) => {
    setPaginationModel(newModel);
  };

  // Handle sort change
  const handleSortModelChange = (newModel) => {
    setSortModel(newModel);
  };

  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  // Handle class filter
  const handleClassFilterChange = (event) => {
    setClassFilter(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  // Open add dialog
  const handleAddStudent = () => {
    setDialogMode("add");
    setCurrentStudent(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      admissionNumber: "",
      classId: "",
      rollNumber: "",
      dateOfBirth: "",
      parentName: "",
      parentPhone: "",
      address: "",
      gender: "Male",
      academicYear: "2024-25",
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleEditStudent = (student) => {
    setDialogMode("edit");
    setCurrentStudent(student);
    setFormData({
      name: student.userId?.name || "",
      email: student.userId?.email || "",
      password: "", // Don't show password in edit mode
      admissionNumber: student.admissionNumber || "",
      classId: student.classId?._id || "",
      rollNumber: student.rollNumber || "",
      dateOfBirth: student.dateOfBirth || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      address: student.address || "",
      gender: student.gender || "Male",
      academicYear: student.academicYear || "2024-25",
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentStudent(null);
  };

  // Handle form change
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form
  const handleSubmitForm = async () => {
    try {
      // Validation
      if (
        !formData.name ||
        !formData.email ||
        !formData.admissionNumber ||
        !formData.classId
      ) {
        showSnackbar("Please fill all required fields", "error");
        return;
      }

      if (dialogMode === "add" && !formData.password) {
        showSnackbar("Password is required for new students", "error");
        return;
      }

      if (formData.parentPhone && formData.parentPhone.length !== 10) {
        showSnackbar("Parent phone must be 10 digits", "error");
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        admissionNumber: formData.admissionNumber,
        classId: formData.classId,
        gender: formData.gender,
        academicYear: formData.academicYear,
      };

      // Add optional fields if they exist
      if (formData.rollNumber) payload.rollNumber = formData.rollNumber;
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      if (formData.parentName) payload.parentName = formData.parentName;
      if (formData.parentPhone) payload.parentPhone = formData.parentPhone;
      if (formData.address) payload.address = formData.address;

      if (dialogMode === "add") {
        payload.password = formData.password;
        const response = await API.post("/students", payload);
        if (response.data.success) {
          showSnackbar("Student created successfully", "success");
          fetchStudents();
          handleCloseDialog();
        }
      } else {
        const response = await API.put(
          `/students/${currentStudent._id}`,
          payload,
        );
        if (response.data.success) {
          showSnackbar("Student updated successfully", "success");
          fetchStudents();
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showSnackbar(
        error.response?.data?.message || "Failed to save student",
        "error",
      );
    }
  };

  // Open delete confirmation
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      const response = await API.delete(`/students/${studentToDelete._id}`);
      if (response.data.success) {
        showSnackbar("Student deleted successfully", "success");
        fetchStudents();
        handleCloseDeleteDialog();
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      showSnackbar(
        error.response?.data?.message || "Failed to delete student",
        "error",
      );
    }
  };

  // DataGrid columns
  const columns = [
    {
      field: "admissionNumber",
      headerName: "Admission No ↕",
      width: 150,
      headerAlign: "left",
      align: "left",
      sortable: true,
    },
    {
      field: "name",
      headerName: "Name ↕",
      width: 200,
      headerAlign: "left",
      align: "left",
      sortable: true,
      valueGetter: (value, row) => row.userId?.name || "N/A",
    },
    {
      field: "class",
      headerName: "Class ↕",
      width: 120,
      headerAlign: "left",
      align: "left",
      sortable: true,
      valueGetter: (value, row) => {
        const classInfo = row.classId;
        if (!classInfo) return "N/A";
        return `${classInfo.className}-${classInfo.section}`;
      },
    },
    {
      field: "rollNumber",
      headerName: "Roll No ↕",
      width: 110,
      headerAlign: "left",
      align: "left",
      sortable: true,
      valueGetter: (value, row) => row.rollNumber || "-",
    },
    {
      field: "parentName",
      headerName: "Parent Name ↕",
      width: 200,
      headerAlign: "left",
      align: "left",
      sortable: true,
      valueGetter: (value, row) => row.parentName || "-",
    },
    {
      field: "parentPhone",
      headerName: "Parent Phone ↕",
      width: 150,
      headerAlign: "left",
      align: "left",
      sortable: true,
      valueGetter: (value, row) => row.parentPhone || "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      headerAlign: "center",
      align: "center",
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEditStudent(params.row)}
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
      <Navbar title="Admin" onLogout={handleLogout} />
      <Sidebar 
        menuItems={menuItems}
        activePath={activePath}
        onMenuClick={handleMenuClick}
      />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Toolbar />
        <Container maxWidth="xl">
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
            >
              Student Management
            </Typography>

            {/* Top Bar */}
            <Card sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or admission number..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "&.Mui-focused fieldset": {
                          borderColor: "#D32F2F",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Class Filter</InputLabel>
                    <Select
                      value={classFilter}
                      label="Class Filter"
                      onChange={handleClassFilterChange}
                      sx={{
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#D32F2F",
                        },
                      }}
                    >
                      <MenuItem value="all">All Classes</MenuItem>
                      {classes.map((cls) => (
                        <MenuItem key={cls._id} value={cls._id}>
                          Class {cls.className}-{cls.section}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={2} md={5} sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddStudent}
                    sx={{
                      bgcolor: "#D32F2F",
                      "&:hover": { bgcolor: "#B71C1C" },
                    }}
                  >
                    Add Student
                  </Button>
                </Grid>
              </Grid>
            </Card>

            {/* DataGrid */}
            <Card>
              <Box sx={{ height: 650, width: "100%" }}>
                <DataGrid
                  rows={students}
                  columns={columns}
                  paginationModel={paginationModel}
                  onPaginationModelChange={handlePaginationChange}
                                    sortModel={sortModel}
                                    onSortModelChange={handleSortModelChange}
                  pageSizeOptions={[10, 25, 50, 100]}
                  paginationMode="server"
                                    sortingMode="server"
                  rowCount={totalRows}
                  loading={loading}
                  disableRowSelectionOnClick
                  getRowId={(row) => row._id}
                  sx={{
                    "& .MuiDataGrid-columnHeaders": {
                      backgroundColor: "#f5f5f5",
                      fontWeight: "bold",
                      fontSize: "14px",
                    },
                    "& .MuiDataGrid-columnHeader": {
                      cursor: "pointer",
                      "&:hover": {
                        backgroundColor: "#e0e0e0",
                      },
                    },
                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontWeight: "600",
                    },
                    "& .MuiDataGrid-sortIcon": {
                      opacity: 1,
                      color: "#D32F2F",
                    },
                    "& .MuiDataGrid-row:hover": {
                      backgroundColor: "#ffebee",
                    },
                  }}
                />
              </Box>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#D32F2F", color: "white" }}>
          {dialogMode === "add" ? "Add New Student" : "Edit Student"}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            {dialogMode === "add" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  required
                  sx={{
                    "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                      borderColor: "#D32F2F",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#D32F2F",
                    },
                  }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={dialogMode === "add" ? 6 : 6}>
              <TextField
                fullWidth
                label="Admission Number"
                name="admissionNumber"
                value={formData.admissionNumber}
                onChange={handleFormChange}
                required
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel sx={{ "&.Mui-focused": { color: "#D32F2F" } }}>
                  Class
                </InputLabel>
                <Select
                  name="classId"
                  value={formData.classId}
                  label="Class"
                  onChange={handleFormChange}
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#D32F2F",
                    },
                  }}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      Class {cls.className}-{cls.section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Roll Number"
                name="rollNumber"
                type="number"
                value={formData.rollNumber}
                onChange={handleFormChange}
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleFormChange}
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ "&.Mui-focused": { color: "#D32F2F" } }}>
                  Gender
                </InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  label="Gender"
                  onChange={handleFormChange}
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#D32F2F",
                    },
                  }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Name"
                name="parentName"
                value={formData.parentName}
                onChange={handleFormChange}
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Parent Phone"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleFormChange}
                inputProps={{ maxLength: 10 }}
                helperText="10 digits"
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                multiline
                rows={3}
                sx={{
                  "& .MuiOutlinedInput-root.Mui-focused fieldset": {
                    borderColor: "#D32F2F",
                  },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#D32F2F",
                  },
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ color: "#666" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitForm}
            variant="contained"
            sx={{
              bgcolor: "#D32F2F",
              "&:hover": { bgcolor: "#B71C1C" },
            }}
          >
            {dialogMode === "add" ? "Add Student" : "Update Student"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{studentToDelete?.userId?.name}</strong>? This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} sx={{ color: "#666" }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            sx={{
              bgcolor: "#D32F2F",
              "&:hover": { bgcolor: "#B71C1C" },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Students;
