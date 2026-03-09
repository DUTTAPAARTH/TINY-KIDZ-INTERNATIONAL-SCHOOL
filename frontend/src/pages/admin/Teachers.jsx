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
  Chip,
  OutlinedInput,
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

const Teachers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  // State management
  const [teachers, setTeachers] = useState([]);
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
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    phone: "",
    qualification: "",
    classIds: [],
  });

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const activeSort = sortModel[0] || {};
      const sortFieldMap = {
        name: "name",
        email: "email",
        employeeId: "employeeId",
        phone: "phone",
        qualification: "qualification",
      };

      const response = await API.get("/teachers", {
        params: {
          page: paginationModel.page + 1,
          limit: paginationModel.pageSize,
          search: searchQuery,
          classId: classFilter !== "all" ? classFilter : undefined,
          sortBy: sortFieldMap[activeSort.field] || "createdAt",
          sortOrder: activeSort.sort || "desc",
        },
      });

      if (response.data.success) {
        setTeachers(response.data.data || []);
        setTotalRows(response.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      showSnackbar("Failed to fetch teachers", "error");
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
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [
    paginationModel.page,
    paginationModel.pageSize,
    searchQuery,
    classFilter,
    sortModel,
  ]);

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

  // Handle search
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const handleClassFilterChange = (event) => {
    setClassFilter(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  const handlePaginationChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const handleSortModelChange = (newModel) => {
    setSortModel(newModel);
  };

  // Open add dialog
  const handleAddTeacher = () => {
    setDialogMode("add");
    setCurrentTeacher(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      phone: "",
      qualification: "",
      classIds: [],
    });
    setOpenDialog(true);
  };

  // Open edit dialog
  const handleEditTeacher = (teacher) => {
    setDialogMode("edit");
    setCurrentTeacher(teacher);
    setFormData({
      name: teacher.userId?.name || "",
      email: teacher.userId?.email || "",
      password: "",
      employeeId: teacher.employeeId || "",
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
      classIds: teacher.classIds?.map((c) => c._id) || [],
    });
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTeacher(null);
  };

  // Handle form change
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle class selection change
  const handleClassChange = (event) => {
    const { value } = event.target;
    setFormData((prev) => ({
      ...prev,
      classIds: typeof value === "string" ? value.split(",") : value,
    }));
  };

  // Submit form
  const handleSubmitForm = async () => {
    try {
      // Validation
      if (
        !formData.name ||
        !formData.email ||
        !formData.employeeId ||
        !formData.phone ||
        !formData.qualification
      ) {
        showSnackbar("Please fill all required fields", "error");
        return;
      }

      if (dialogMode === "add" && !formData.password) {
        showSnackbar("Password is required for new teachers", "error");
        return;
      }

      if (formData.phone && formData.phone.length !== 10) {
        showSnackbar("Phone must be 10 digits", "error");
        return;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        employeeId: formData.employeeId,
        phone: formData.phone,
        qualification: formData.qualification,
        classIds: formData.classIds,
      };

      if (dialogMode === "add") {
        payload.password = formData.password;
        const response = await API.post("/teachers", payload);
        if (response.data.success) {
          showSnackbar("Teacher created successfully", "success");
          fetchTeachers();
          handleCloseDialog();
        }
      } else {
        const response = await API.put(
          `/teachers/${currentTeacher._id}`,
          payload,
        );
        if (response.data.success) {
          showSnackbar("Teacher updated successfully", "success");
          fetchTeachers();
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showSnackbar(
        error.response?.data?.message || "Failed to save teacher",
        "error",
      );
    }
  };

  // Open delete confirmation
  const handleDeleteClick = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTeacherToDelete(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    try {
      const response = await API.delete(`/teachers/${teacherToDelete._id}`);
      if (response.data.success) {
        showSnackbar("Teacher deleted successfully", "success");
        fetchTeachers();
        handleCloseDeleteDialog();
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      showSnackbar(
        error.response?.data?.message || "Failed to delete teacher",
        "error",
      );
    }
  };

  // DataGrid columns
  const columns = [
    {
      field: "employeeId",
      headerName: "Employee ID",
      width: 130,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "name",
      headerName: "Name",
      width: 180,
      headerAlign: "left",
      align: "left",
      valueGetter: (value, row) => row.userId?.name || "N/A",
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      headerAlign: "left",
      align: "left",
      valueGetter: (value, row) => row.userId?.email || "N/A",
    },
    {
      field: "phone",
      headerName: "Phone",
      width: 130,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "qualification",
      headerName: "Qualification",
      width: 130,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "assignedClasses",
      headerName: "Assigned Classes",
      width: 250,
      headerAlign: "left",
      align: "left",
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {params.row.classIds?.length > 0 ? (
            params.row.classIds.map((cls) => (
              <Chip
                key={cls._id}
                label={`${cls.className}-${cls.section}`}
                size="small"
                sx={{
                  bgcolor: "#ffebee",
                  color: "#D32F2F",
                  fontWeight: 500,
                }}
              />
            ))
          ) : (
            <Typography variant="body2" color="textSecondary">
              No classes
            </Typography>
          )}
        </Box>
      ),
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
            onClick={() => handleEditTeacher(params.row)}
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
              Teacher Management
            </Typography>

            {/* Top Bar */}
            <Card sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={8} md={9}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by name or employee ID..."
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
                    <InputLabel sx={{ "&.Mui-focused": { color: "#D32F2F" } }}>
                      Class Filter
                    </InputLabel>
                    <Select
                      value={classFilter}
                      onChange={handleClassFilterChange}
                      label="Class Filter"
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
                <Grid item xs={12} sm={4} md={12} sx={{ textAlign: "right" }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddTeacher}
                    sx={{
                      bgcolor: "#D32F2F",
                      "&:hover": { bgcolor: "#B71C1C" },
                    }}
                  >
                    Add Teacher
                  </Button>
                </Grid>
              </Grid>
            </Card>

            {/* DataGrid */}
            <Card>
              <Box sx={{ height: 650, width: "100%" }}>
                <DataGrid
                  rows={teachers}
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
          {dialogMode === "add" ? "Add New Teacher" : "Edit Teacher"}
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
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
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
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                required
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleFormChange}
                required
                placeholder="e.g., B.Ed, M.Sc"
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
              <FormControl fullWidth>
                <InputLabel
                  id="classes-label"
                  sx={{ "&.Mui-focused": { color: "#D32F2F" } }}
                >
                  Assigned Classes
                </InputLabel>
                <Select
                  labelId="classes-label"
                  multiple
                  value={formData.classIds}
                  onChange={handleClassChange}
                  input={<OutlinedInput label="Assigned Classes" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const cls = classes.find((c) => c._id === value);
                        return (
                          <Chip
                            key={value}
                            label={
                              cls ? `${cls.className}-${cls.section}` : value
                            }
                            size="small"
                            sx={{
                              bgcolor: "#ffebee",
                              color: "#D32F2F",
                            }}
                          />
                        );
                      })}
                    </Box>
                  )}
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
            {dialogMode === "add" ? "Add Teacher" : "Update Teacher"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{teacherToDelete?.userId?.name}</strong>? This action cannot
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

export default Teachers;
