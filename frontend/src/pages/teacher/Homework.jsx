import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Chip,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import API from "../../services/authService";
import TeacherLayout from "../../components/TeacherLayout";

const TeacherHomework = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [homework, setHomework] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    title: "",
    description: "",
    dueDate: dayjs(),
    attachmentLink: "",
  });

  // Fetch teacher's classes and subjects
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const response = await API.get("/api/teachers/me");
        const teacherClasses = response.data.data.classIds || [];
        setClasses(teacherClasses);
        if (teacherClasses.length > 0) {
          setSelectedClass(teacherClasses[0]._id);
          setFormData((prev) => ({ ...prev, classId: teacherClasses[0]._id }));
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load classes",
          severity: "error",
        });
      }
    };
    fetchTeacherProfile();
  }, []);

  // Fetch subjects based on selected class
  useEffect(() => {
    if (!selectedClass) return;
    const fetchSubjects = async () => {
      try {
        const response = await API.get("/api/subjects");
        const classSubjects = (response.data.data || []).filter(
          (s) => s.classId?.toString() === selectedClass,
        );
        setSubjects(classSubjects);
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load subjects",
          severity: "error",
        });
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  // Fetch homework for selected class
  useEffect(() => {
    if (!selectedClass) return;
    const fetchHomework = async () => {
      setLoading(true);
      try {
        const response = await API.get(`/api/homework/class/${selectedClass}`);
        const data = response.data.data || [];
        setHomework(
          data.map((hw, idx) => ({
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
  }, [selectedClass]);

  const getStatus = (dueDate) => {
    const due = dayjs(dueDate);
    const today = dayjs().startOf("day");
    if (due.isBefore(today)) return "Overdue";
    return "Upcoming";
  };

  const handleOpenDialog = (hw = null) => {
    if (hw) {
      setEditingId(hw._id);
      setFormData({
        classId: hw.classId._id,
        subjectId: hw.subjectId._id,
        title: hw.title,
        description: hw.description,
        dueDate: dayjs(hw.dueDate),
        attachmentLink: hw.attachmentLink || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        classId: selectedClass || "",
        subjectId: "",
        title: "",
        description: "",
        dueDate: dayjs(),
        attachmentLink: "",
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (
      !formData.classId ||
      !formData.subjectId ||
      !formData.title ||
      !formData.description ||
      !formData.dueDate
    ) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "error",
      });
      return;
    }

    // Validate due date is today or future
    if (formData.dueDate.isBefore(dayjs().startOf("day"))) {
      setSnackbar({
        open: true,
        message: "Due date must be today or in the future",
        severity: "error",
      });
      return;
    }

    try {
      const payload = {
        classId: formData.classId,
        subjectId: formData.subjectId,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate.toISOString(),
        attachmentLink: formData.attachmentLink,
      };

      if (editingId) {
        await API.put(`/api/homework/${editingId}`, payload);
        setSnackbar({
          open: true,
          message: "✓ Homework updated successfully",
          severity: "success",
        });
      } else {
        await API.post("/api/homework", payload);
        setSnackbar({
          open: true,
          message: "✓ Homework assigned successfully",
          severity: "success",
        });
      }

      handleCloseDialog();
      // Refresh homework list
      const response = await API.get(`/api/homework/class/${selectedClass}`);
      setHomework(response.data.data || []);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Operation failed",
        severity: "error",
      });
    }
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
      field: "description",
      headerName: "Description",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" noWrap>
          {params.row.description.substring(0, 50)}
          {params.row.description.length > 50 ? "..." : ""}
        </Typography>
      ),
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
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            variant="outlined"
            sx={{ color: "#D32F2F", borderColor: "#D32F2F" }}
            onClick={() => handleOpenDialog(params.row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            variant="outlined"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <TeacherLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#D32F2F" }}
          >
            Homework Management
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#D32F2F",
              color: "white",
              "&:hover": { backgroundColor: "#B71C1C" },
            }}
            onClick={() => handleOpenDialog()}
          >
            Assign Homework
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl fullWidth sx={{ maxWidth: 300 }}>
            <InputLabel>Select Class</InputLabel>
            <Select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  classId: e.target.value,
                  subjectId: "",
                }));
              }}
              label="Select Class"
            >
              {classes.map((cls) => (
                <MenuItem key={cls._id} value={cls._id}>
                  {cls.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
              sx={{
                "& .MuiDataGrid-row": {
                  backgroundColor: (params) =>
                    getStatus(params.row.dueDate) === "Overdue"
                      ? "#FFEBEE"
                      : "inherit",
                },
              }}
            />
          </Paper>
        )}

        {/* Assign/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle
            sx={{
              backgroundColor: "#D32F2F",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {editingId ? "Edit Homework" : "Assign Homework"}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={formData.classId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classId: e.target.value,
                      subjectId: "",
                    })
                  }
                  label="Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectId: e.target.value })
                  }
                  label="Subject"
                >
                  {subjects.map((subj) => (
                    <MenuItem key={subj._id} value={subj._id}>
                      {subj.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                fullWidth
                required
              />

              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                fullWidth
                required
                multiline
                rows={4}
              />

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={(date) =>
                    setFormData({ ...formData, dueDate: date })
                  }
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>

              <TextField
                label="Attachment Link (Optional)"
                value={formData.attachmentLink}
                onChange={(e) =>
                  setFormData({ ...formData, attachmentLink: e.target.value })
                }
                fullWidth
                placeholder="https://example.com/file"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{
                backgroundColor: "#D32F2F",
                color: "white",
                "&:hover": { backgroundColor: "#B71C1C" },
              }}
            >
              {editingId ? "Update" : "Assign"}
            </Button>
          </DialogActions>
        </Dialog>

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
    </TeacherLayout>
  );
};

export default TeacherHomework;
