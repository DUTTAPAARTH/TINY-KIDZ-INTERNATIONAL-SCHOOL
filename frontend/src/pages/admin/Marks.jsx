import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Typography,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DownloadIcon from "@mui/icons-material/Download";
import AdminLayout from "../../components/AdminLayout";

const getGradeColor = (percentage) => {
  if (percentage >= 90) return "#4caf50"; // Success - A+
  if (percentage >= 80) return "#2196f3"; // Info - A
  if (percentage >= 70) return "#ff9800"; // Warning - B+
  if (percentage >= 60) return "#757575"; // Default - B
  return "#f44336"; // Error - C
};

const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  return "C";
};

const AdminMarks = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Summary statistics
  const [stats, setStats] = useState({
    averagePercentage: 0,
    highestMarks: 0,
    lowestMarks: 0,
    totalRecords: 0,
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

  // Fetch marks and calculate stats
  useEffect(() => {
    if (!selectedClass) {
      setMarks([]);
      setStats({
        averagePercentage: 0,
        highestMarks: 0,
        lowestMarks: 0,
        totalRecords: 0,
      });
      return;
    }

    const fetchMarks = async () => {
      setLoading(true);
      try {
        let url = `http://localhost:5000/api/marks?classId=${selectedClass}`;
        if (selectedSubject) url += `&subjectId=${selectedSubject}`;
        if (selectedExamType) url += `&examType=${selectedExamType}`;

        const response = await fetch(url);
        const data = await response.json();
        setMarks(data);

        // Calculate statistics
        if (data.length > 0) {
          const percentages = data.map(
            (m) => (m.marksObtained / m.totalMarks) * 100,
          );
          const marks_values = data.map((m) => m.marksObtained);

          setStats({
            averagePercentage: (
              percentages.reduce((a, b) => a + b, 0) / percentages.length
            ).toFixed(2),
            highestMarks: Math.max(...marks_values),
            lowestMarks: Math.min(...marks_values),
            totalRecords: data.length,
          });
        } else {
          setStats({
            averagePercentage: 0,
            highestMarks: 0,
            lowestMarks: 0,
            totalRecords: 0,
          });
        }
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
  }, [selectedClass, selectedSubject, selectedExamType]);

  const handleExportCSV = () => {
    if (marks.length === 0) {
      setSnackbar({
        open: true,
        message: "No data to export",
        severity: "warning",
      });
      return;
    }

    const headers = [
      "Student Name",
      "Admission No",
      "Subject",
      "Exam Type",
      "Marks",
      "Percentage",
      "Grade",
      "Date",
    ];
    const rows = marks.map((m) => [
      `${m.studentId?.firstName} ${m.studentId?.lastName}`,
      m.studentId?.admissionNo,
      m.subjectId?.subjectName,
      m.examType,
      `${m.marksObtained}/${m.totalMarks}`,
      ((m.marksObtained / m.totalMarks) * 100).toFixed(2),
      getGrade((m.marksObtained / m.totalMarks) * 100),
      new Date(m.examDate).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marks_report_${selectedClass}_${selectedSubject || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: "CSV exported successfully",
      severity: "success",
    });
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
      field: "subject",
      headerName: "Subject",
      flex: 1,
      valueGetter: (value, row) => row.subjectId?.subjectName || "N/A",
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
        return (
          <Box
            sx={{
              bgcolor: color,
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "0.875rem",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {grade}
          </Box>
        );
      },
    },
    {
      field: "examDate",
      headerName: "Exam Date",
      flex: 0.8,
      renderCell: (params) =>
        new Date(params.row.examDate).toLocaleDateString(),
    },
  ];

  return (
    <AdminLayout>
      <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#D32F2F", mb: 2 }}
          >
            Marks Overview & Reports
          </Typography>
        </Box>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: "white", borderRadius: 2 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth disabled={!selectedClass}>
                <InputLabel>Select Subject</InputLabel>
                <Select
                  value={selectedSubject}
                  label="Select Subject"
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Exam Type"
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
              >
                <MenuItem value="">All Exam Types</MenuItem>
                {["Unit Test", "Mid Term", "Final", "Project"].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                sx={{ bgcolor: "#D32F2F", color: "white", height: "56px" }}
                onClick={handleExportCSV}
                startIcon={<DownloadIcon />}
                disabled={!selectedClass}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Summary Statistics */}
        {selectedClass && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "white" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Percentage
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "#D32F2F", fontWeight: "bold" }}
                  >
                    {stats.averagePercentage}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "white" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Highest Marks
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "#4caf50", fontWeight: "bold" }}
                  >
                    {stats.highestMarks}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "white" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Lowest Marks
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "#f44336", fontWeight: "bold" }}
                  >
                    {stats.lowestMarks}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "white" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Records
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{ color: "#2196f3", fontWeight: "bold" }}
                  >
                    {stats.totalRecords}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* DataGrid */}
        <Paper sx={{ p: 3, bgcolor: "white", borderRadius: 2 }}>
          <Box sx={{ height: 500, width: "100%" }}>
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

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
};

export default AdminMarks;
