import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  RadioGroup,
  FormControlLabel,
  Radio,
  Snackbar,
  Alert,
  CircularProgress,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import API from "../../services/authService";
import TeacherLayout from "../../components/TeacherLayout";

const TeacherAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});
  const [students, setStudents] = useState([]);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [markedData, setMarkedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Fetch teachers's classes
  useEffect(() => {
    const fetchTeacherProfile = async () => {
      try {
        const response = await API.get("/api/teachers/me");
        setClasses(response.data.data.classIds || []);
        if (response.data.data.classIds?.length > 0) {
          setSelectedClass(response.data.data.classIds[0]._id);
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

  // Check if attendance already marked and fetch students
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    const checkAttendance = async () => {
      setLoading(true);
      try {
        const dateStr = selectedDate.format("YYYY-MM-DD");

        // Check if already marked
        try {
          const marked = await API.get(
            `/api/attendance/class/${selectedClass}/date/${dateStr}`,
          );
          setAlreadyMarked(true);
          setMarkedData(marked.data.data);
          setStudents([]);
        } catch (error) {
          // Not marked yet, fetch all students
          setAlreadyMarked(false);
          setMarkedData(null);

          const studentsRes = await API.get(
            `/api/students?classId=${selectedClass}&limit=1000`,
          );
          setStudents(studentsRes.data.data || []);

          // Initialize attendance with all Present
          const initialAttendance = {};
          (studentsRes.data.data || []).forEach((student) => {
            initialAttendance[student._id] = "Present";
          });
          setAttendance(initialAttendance);
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Error fetching data",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAttendance();
  }, [selectedClass, selectedDate]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedDate) {
      setSnackbar({
        open: true,
        message: "Please select class and date",
        severity: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await API.post("/api/attendance", {
        classId: selectedClass,
        date: dateStr,
        records,
      });

      setSnackbar({
        open: true,
        message: "✓ Attendance marked successfully",
        severity: "success",
      });

      // Refresh to show marked state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to mark attendance",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TeacherLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
        >
          Mark Attendance
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Select Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  label="Select Class"
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : alreadyMarked ? (
          <Box>
            <Alert
              icon={<CheckCircleIcon fontSize="inherit" />}
              severity="success"
              sx={{ mb: 3 }}
            >
              Attendance already marked for{" "}
              <strong>{selectedDate.format("DD MMM YYYY")}</strong>
            </Alert>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#D32F2F" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Admission No
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Student Name
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {markedData?.records?.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        {record.studentId?.admissionNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        {record.studentId?.userId?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.status}
                          color={
                            record.status === "Present"
                              ? "success"
                              : record.status === "Late"
                                ? "warning"
                                : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Students: {students.length}
                </Typography>
              </CardContent>
            </Card>

            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: "#D32F2F" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Admission No
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Student Name
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>{student.userId?.name}</TableCell>
                      <TableCell>
                        <RadioGroup
                          row
                          value={attendance[student._id] || "Present"}
                          onChange={(e) =>
                            handleAttendanceChange(student._id, e.target.value)
                          }
                        >
                          <FormControlLabel
                            value="Present"
                            control={<Radio />}
                            label={
                              <span style={{ color: "#4CAF50" }}>
                                <strong>Present</strong>
                              </span>
                            }
                          />
                          <FormControlLabel
                            value="Absent"
                            control={<Radio />}
                            label={
                              <span style={{ color: "#D32F2F" }}>
                                <strong>Absent</strong>
                              </span>
                            }
                          />
                          <FormControlLabel
                            value="Late"
                            control={<Radio />}
                            label={
                              <span style={{ color: "#FF9800" }}>
                                <strong>Late</strong>
                              </span>
                            }
                          />
                        </RadioGroup>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#D32F2F",
                  color: "white",
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  "&:hover": { backgroundColor: "#B71C1C" },
                }}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Attendance"}
              </Button>
            </Box>
          </Box>
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
    </TeacherLayout>
  );
};

export default TeacherAttendance;
