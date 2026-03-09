import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import API from "../../services/authService";
import AdminLayout from "../../components/AdminLayout";

const AdminHomework = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [homework, setHomework] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await API.get("/api/classes");
        setClasses(response.data.data || []);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load classes",
          severity: "error",
        });
      }
    };
    fetchClasses();
  }, []);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await API.get("/api/subjects");
        setSubjects(response.data.data || []);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load subjects",
          severity: "error",
        });
      }
    };
    fetchSubjects();
  }, []);

  // Fetch all homework with filters
  useEffect(() => {
    const fetchHomework = async () => {
      setLoading(true);
      try {
        // Fetch all homework from all classes
        const classResponse = await API.get("/api/classes");
        const allClasses = classResponse.data.data || [];
        let allHomework = [];

        for (const cls of allClasses) {
          try {
            const response = await API.get(`/api/homework/class/${cls._id}`);
            allHomework = [...allHomework, ...(response.data.data || [])];
          } catch (error) {
            // Silently continue if error fetching from a class
          }
        }

        // Apply filters
        let filtered = allHomework;

        if (selectedClass) {
          filtered = filtered.filter((hw) => hw.classId._id === selectedClass);
        }

        if (selectedSubject) {
          filtered = filtered.filter(
            (hw) => hw.subjectId._id === selectedSubject,
          );
        }

        if (selectedStatus !== "All") {
          const today = dayjs().startOf("day");
          if (selectedStatus === "Upcoming") {
            filtered = filtered.filter((hw) =>
              dayjs(hw.dueDate).isSameOrAfter(today),
            );
          } else if (selectedStatus === "Overdue") {
            filtered = filtered.filter((hw) =>
              dayjs(hw.dueDate).isBefore(today),
            );
          }
        }

        setHomework(
          filtered.map((hw, idx) => ({
            id: hw._id,
            ...hw,
            index: idx,
          })),
        );
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load homework",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchHomework();
  }, [selectedClass, selectedSubject, selectedStatus]);

  const getStatus = (dueDate) => {
    const due = dayjs(dueDate);
    const today = dayjs().startOf("day");
    if (due.isBefore(today)) return "Overdue";
    return "Upcoming";
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this homework?"))
      return;
    try {
      await API.delete(`/api/homework/${id}`);
      setSnackbar({
        open: true,
        message: "✓ Homework deleted successfully",
        severity: "success",
      });
      setHomework(homework.filter((hw) => hw.id !== id));
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Delete failed",
        severity: "error",
      });
    }
  };

  const columns = [
    {
      field: "subject",
      headerName: "Subject",
      flex: 1,
      minWidth: 120,
      renderCell: (params) => params.row.subjectId?.name || "N/A",
    },
    { field: "title", headerName: "Title", flex: 1, minWidth: 150 },
    {
      field: "class",
      headerName: "Class",
      flex: 1,
      minWidth: 100,
      renderCell: (params) => params.row.classId?.name || "N/A",
    },
    {
      field: "assignedBy",
      headerName: "Assigned By",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.row.assignedBy?.name || "N/A",
    },
    {
      field: "dueDate",
      headerName: "Due Date",
      width: 130,
      renderCell: (params) => dayjs(params.value).format("DD/MM/YYYY"),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => {
        const status = getStatus(params.row.dueDate);
        return (
          <Chip
            label={status}
            color={status === "Upcoming" ? "success" : "error"}
            size="small"
          />
        );
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          startIcon={<DeleteIcon />}
          variant="outlined"
          color="error"
          onClick={() => handleDelete(params.row.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
        >
          Homework Overview
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Filter by Class"
                >
                  <MenuItem value="">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  label="Filter by Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((subj) => (
                    <MenuItem key={subj._id} value={subj._id}>
                      {subj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Status</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="Filter by Status"
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Upcoming">Upcoming</MenuItem>
                  <MenuItem value="Overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                sx={{ borderColor: "#D32F2F", color: "#D32F2F", py: 1.5 }}
                onClick={() => {
                  setSelectedClass("");
                  setSelectedSubject("");
                  setSelectedStatus("All");
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={homework}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableSelectionOnClick
            />
          </Paper>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
};

export default AdminHomework;
