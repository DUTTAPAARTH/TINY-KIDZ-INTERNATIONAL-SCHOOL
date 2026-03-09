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
  Typography,
  Chip,
  Grid,
  IconButton,
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

const getGradeColor = (percentage) => {
  if (percentage >= 90) return "success"; // A+
  if (percentage >= 80) return "info"; // A
  if (percentage >= 70) return "warning"; // B+
  if (percentage >= 60) return "default"; // B
  return "error"; // C
};

const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  return "C";
};

const TeacherMarks = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState({
    studentId: "",
    classId: "",
    subjectId: "",
    examType: "Unit Test",
    marksObtained: "",
    totalMarks: 100,
    academicYear: "2024-25",
    examDate: dayjs(),
  });

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/classes");
        const data = await response.json();
        setClasses(data.map((c) => ({ id: c._id, name: c.classCode })));
      } catch (err) {
        console.error("Error fetching classes:", err);
        setSnackbar({
          open: true,
          message: "Failed to load classes",
          severity: "error",
        });
      }
    };
    fetchClasses();
  }, []);

  // Fetch subjects when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/subjects?classId=${selectedClass}`,
        );
        const data = await response.json();
        setSubjects(data.map((s) => ({ id: s._id, name: s.subjectName })));
      } catch (err) {
        console.error("Error fetching subjects:", err);
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  // Fetch marks when class and subject are selected
  useEffect(() => {
    if (!selectedClass || !selectedSubject) {
      setMarks([]);
      return;
    }

    const fetchMarks = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/api/marks?classId=${selectedClass}&subjectId=${selectedSubject}`,
        );
        const data = await response.json();
        setMarks(data);
      } catch (err) {
        console.error("Error fetching marks:", err);
        setSnackbar({
          open: true,
          message: "Failed to load marks",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchMarks();
  }, [selectedClass, selectedSubject]);

  // Fetch students when class is selected
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/students?classId=${selectedClass}`,
        );
        const data = await response.json();
        setStudents(data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  const handleAddMark = () => {
    if (!selectedClass) {
      setSnackbar({
        open: true,
        message: "Please select a class first",
        severity: "warning",
      });
      return;
    }
    setEditingId(null);
    setFormData({
      studentId: "",
      classId: selectedClass,
      subjectId: selectedSubject,
      examType: "Unit Test",
      marksObtained: "",
      totalMarks: 100,
      academicYear: "2024-25",
      examDate: dayjs(),
    });
    setDialogOpen(true);
  };

  const handleEditMark = (row) => {
    setEditingId(row._id);
    setFormData({
      studentId: row.studentId._id,
      classId: row.classId._id,
      subjectId: row.subjectId._id,
      examType: row.examType,
      academicYear: row.academicYear,
      examDate: dayjs(row.examDate),
    });
    setDialogOpen(true);
  };

  const handleSaveMark = async () => {
    if (
      !formData.studentId ||
      !formData.examType ||
      formData.marksObtained === ""
    ) {
      setSnackbar({
        open: true,
        message: "Please fill all required fields",
        severity: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        studentId: formData.studentId,
        classId: formData.classId,
        subjectId: formData.subjectId,
        examType: formData.examType,
        marksObtained: parseFloat(formData.marksObtained),
        totalMarks: parseFloat(formData.totalMarks),
        academicYear: formData.academicYear,
        examDate: formData.examDate.toDate(),
      };

      if (editingId) {
        await fetch(`http://localhost:5000/api/marks/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSnackbar({
          open: true,
          message: "Marks updated successfully",
          severity: "success",
        });
      } else {
        await fetch("http://localhost:5000/api/marks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        setSnackbar({
          open: true,
          message: "Marks added successfully",
          severity: "success",
        });
      }

      setDialogOpen(false);
      // Refresh marks
      if (selectedClass && selectedSubject) {
        const response = await fetch(
          `http://localhost:5000/api/marks?classId=${selectedClass}&subjectId=${selectedSubject}`,
        );
        const data = await response.json();
        setMarks(data);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to save marks",
        severity: "error",
      });
      console.error("Error saving marks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMark = async (id) => {
    if (!window.confirm("Are you sure you want to delete this mark record?"))
      return;

    setLoading(true);
    try {
      await fetch(`http://localhost:5000/api/marks/${id}`, {
        method: "DELETE",
      });
      setSnackbar({
        open: true,
        message: "Mark deleted successfully",
        severity: "success",
      });
      if (selectedClass && selectedSubject) {
        const response = await fetch(
          `http://localhost:5000/api/marks?classId=${selectedClass}&subjectId=${selectedSubject}`,
        );
        const data = await response.json();
        setMarks(data);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete mark",
        severity: "error",
      });
      console.error("Error deleting mark:", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "studentName",
      headerName: "Student Name",
      flex: 1.2,
      valueGetter: (value, row) =>
        row.studentId?.firstName + " " + row.studentId?.lastName || "N/A",
    },
    {
      field: "admissionNo",
      headerName: "Admission No",
      flex: 0.9,
      valueGetter: (value, row) => row.studentId?.admissionNo || "N/A",
    },
    {
      field: "examType",
      headerName: "Exam Type",
      flex: 0.8,
    },
    {
      field: "marksObtained",
      headerName: "Marks",
      flex: 0.6,
      renderCell: (params) =>
        `${params.row.marksObtained}/${params.row.totalMarks}`,
    },
    {
      field: "percentage",
      headerName: "Percentage",
      flex: 0.7,
      renderCell: (params) => {
        const pct = (
          (params.row.marksObtained / params.row.totalMarks) *
          100
        ).toFixed(1);
        return `${pct}%`;
      },
    },
    {
      field: "grade",
      headerName: "Grade",
      flex: 0.5,
      renderCell: (params) => {
        const pct = (params.row.marksObtained / params.row.totalMarks) * 100;
        const grade = getGrade(pct);
        const color = getGradeColor(pct);
        return <Chip label={grade} color={color} size="small" />;
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 0.7,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => handleEditMark(params.row)}
            sx={{ color: "#D32F2F" }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteMark(params.row._id)}
            sx={{ color: "#D32F2F" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <TeacherLayout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
          <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "#D32F2F", mb: 2 }}
              >
                Manage Student Marks
              </Typography>
            </Box>

            <Paper sx={{ p: 3, mb: 3, bgcolor: "white", borderRadius: 2 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Select Class</InputLabel>
                    <Select
                      value={selectedClass}
                      label="Select Class"
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      {classes.map((cls) => (
                        <MenuItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!selectedClass}>
                    <InputLabel>Select Subject</InputLabel>
                    <Select
                      value={selectedSubject}
                      label="Select Subject"
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                      {subjects.map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                sx={{ bgcolor: "#D32F2F", color: "white", mb: 2 }}
                onClick={handleAddMark}
                disabled={!selectedClass || !selectedSubject}
              >
                Add New Mark
              </Button>

              <Box sx={{ height: 400, width: "100%" }}>
                <DataGrid
                  rows={marks}
                  columns={columns}
                  getRowId={(row) => row._id}
                  loading={loading}
                  disableSelectionOnClick
                  sx={{
                    "& .MuiDataGrid-columnHeaderTitle": { fontWeight: "bold" },
                    "& .MuiDataGrid-cell": { borderColor: "#e0e0e0" },
                  }}
                />
              </Box>
            </Paper>

            {/* Add/Edit Mark Dialog */}
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle
                sx={{ bgcolor: "#D32F2F", color: "white", fontWeight: "bold" }}
              >
                {editingId ? "Edit Mark" : "Add New Mark"}
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <TextField
                  select
                  label="Student"
                  fullWidth
                  margin="normal"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                >
                  {students.map((student) => (
                    <MenuItem key={student._id} value={student._id}>
                      {student.firstName} {student.lastName}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Exam Type"
                  select
                  fullWidth
                  margin="normal"
                  value={formData.examType}
                  onChange={(e) =>
                    setFormData({ ...formData, examType: e.target.value })
                  }
                >
                  {["Unit Test", "Mid Term", "Final", "Project"].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Marks Obtained"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={formData.marksObtained}
                  onChange={(e) =>
                    setFormData({ ...formData, marksObtained: e.target.value })
                  }
                />

                <TextField
                  label="Total Marks"
                  type="number"
                  fullWidth
                  margin="normal"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    setFormData({ ...formData, totalMarks: e.target.value })
                  }
                />

                <TextField
                  label="Academic Year"
                  fullWidth
                  margin="normal"
                  value={formData.academicYear}
                  onChange={(e) =>
                    setFormData({ ...formData, academicYear: e.target.value })
                  }
                />

                <DatePicker
                  label="Exam Date"
                  value={formData.examDate}
                  onChange={(date) =>
                    setFormData({ ...formData, examDate: date })
                  }
                  slotProps={{
                    textField: { fullWidth: true, margin: "normal" },
                  }}
                />
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleSaveMark}
                  variant="contained"
                  sx={{ bgcolor: "#D32F2F", color: "white" }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </Button>
              </DialogActions>
            </Dialog>

            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
              <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
          </Container>
        </Box>
      </LocalizationProvider>
    </TeacherLayout>
  );
};

export default TeacherMarks;
