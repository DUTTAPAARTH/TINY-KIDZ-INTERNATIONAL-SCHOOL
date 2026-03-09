import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Typography,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import API from "../../services/authService";
import StudentLayout from "../../components/StudentLayout";

const StudentAttendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [stats, setStats] = useState({
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    percentage: 0,
  });

  // Fetch student's attendance
  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        // Get student's own profile
        const studentRes = await API.get("/api/students/me");
        setStudentInfo(studentRes.data.data);

        // Get student's attendance records
        const attendanceRes = await API.get(
          `/api/attendance/student/${studentRes.data.data._id}`,
        );

        const records = attendanceRes.data.data.records || [];

        // Filter by selected month
        const monthYear = dayjs(selectedMonth, "YYYY-MM");
        const filtered = records.filter((record) => {
          const recordDate = dayjs(record.date);
          return recordDate.format("YYYY-MM") === monthYear.format("YYYY-MM");
        });

        setAttendanceRecords(
          filtered.sort((a, b) => dayjs(b.date) - dayjs(a.date)),
        );

        // Calculate stats from all records
        const totalDays = records.length;
        const presentDays = records.filter(
          (r) => r.status === "Present",
        ).length;
        const absentDays = records.filter((r) => r.status === "Absent").length;
        const lateDays = records.filter((r) => r.status === "Late").length;
        const percentage =
          totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

        setStats({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          percentage: parseFloat(percentage),
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Failed to load attendance data",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedMonth]);

  const getMonthOptions = () => {
    const months = [];
    const today = dayjs();
    for (let i = 0; i < 12; i++) {
      const month = today.subtract(i, "month");
      months.push({
        value: month.format("YYYY-MM"),
        label: month.format("MMMM YYYY"),
      });
    }
    return months;
  };

  return (
    <StudentLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
        >
          My Attendance
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header with Month Filter */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {studentInfo?.userId?.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Admission: {studentInfo?.admissionNumber}
                </Typography>
              </Box>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Select Month</InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Select Month"
                >
                  {getMonthOptions().map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#f5f5f5" }}>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="small"
                    >
                      Total Days
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#333" }}
                    >
                      {stats.totalDays}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#E8F5E9" }}>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="small"
                    >
                      Present
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#4CAF50" }}
                    >
                      {stats.presentDays}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#FFEBEE" }}>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="small"
                    >
                      Absent
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#D32F2F" }}
                    >
                      {stats.absentDays}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#FFF3E0" }}>
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="small"
                    >
                      Late
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#FF9800" }}
                    >
                      {stats.lateDays}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card
                  sx={{
                    backgroundColor:
                      stats.percentage >= 75 ? "#E8F5E9" : "#FFEBEE",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", py: 2 }}>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="small"
                    >
                      Attendance %
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: "bold",
                        color: stats.percentage >= 75 ? "#4CAF50" : "#D32F2F",
                      }}
                    >
                      {stats.percentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Attendance Progress Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: "bold" }}
                  >
                    Overall Attendance Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.percentage}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          stats.percentage >= 75 ? "#4CAF50" : "#D32F2F",
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    color: stats.percentage >= 75 ? "#4CAF50" : "#D32F2F",
                    minWidth: 60,
                    textAlign: "right",
                  }}
                >
                  {stats.percentage}%
                </Typography>
              </Box>
              {stats.percentage < 75 && (
                <Typography variant="body2" sx={{ mt: 1, color: "#D32F2F" }}>
                  ⚠️ Your attendance is below 75%.
                </Typography>
              )}
            </Paper>

            {/* Attendance Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead sx={{ backgroundColor: "#D32F2F" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <TableRow key={record._id} hover>
                        <TableCell>
                          {dayjs(record.date).format("DD MMM YYYY (dddd)")}
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={2}
                        sx={{ textAlign: "center", py: 3 }}
                      >
                        <Typography color="textSecondary">
                          No attendance records for the selected month
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
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
    </StudentLayout>
  );
};

export default StudentAttendance;
