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
  Button,
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
        const studentRes = await API.get("/students/me");
        setStudentInfo(studentRes.data.data);

        const attendanceRes = await API.get(
          `/attendance/student/${studentRes.data.data._id}`,
        );

        const records = attendanceRes.data.data.records || [];

        const monthYear = dayjs(selectedMonth, "YYYY-MM");
        const filtered = records.filter((record) => {
          const recordDate = dayjs(record.date);
          return recordDate.format("YYYY-MM") === monthYear.format("YYYY-MM");
        });

        setAttendanceRecords(
          filtered.sort((a, b) => dayjs(b.date) - dayjs(a.date)),
        );

        const totalDays = filtered.length;
        const presentDays = filtered.filter(
          (r) => r.status === "Present",
        ).length;
        const absentDays = filtered.filter(
          (r) => r.status === "Absent",
        ).length;
        const lateDays = filtered.filter((r) => r.status === "Late").length;
        const safeTotal = totalDays || 1;
        const percentage =
          totalDays > 0
            ? (((presentDays + lateDays) / safeTotal) * 100).toFixed(1)
            : 0;

        setStats({
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          percentage: parseFloat(percentage),
        });
      } catch (error) {
        console.error("Attendance fetch error:", error?.response?.data || error.message || error);
        setSnackbar({
          open: true,
          message: error?.response?.data?.message || error?.response?.data?.error || error.message || "Failed to load attendance data",
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

  const isThisMonth = selectedMonth === dayjs().format("YYYY-MM");
  const isLastMonth =
    selectedMonth === dayjs().subtract(1, "month").format("YYYY-MM");

  const daysNeededFor75 = (() => {
    if (stats.percentage >= 75 || stats.totalDays === 0) return 0;
    const target = Math.ceil(0.75 * (stats.totalDays + 1) - stats.presentDays - stats.lateDays);
    return target > 0 ? target : 0;
  })();

  const getStatIcon = (type) => {
    if (type === "present") return "✓";
    if (type === "absent") return "✗";
    if (type === "late") return "⏱";
    return "";
  };

  return (
    <StudentLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "#D32F2F" }}
          >
            My Attendance
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {studentInfo?.userId?.name} &middot; {studentInfo?.admissionNumber}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Month Selection — prominent */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", minWidth: 80 }}>
                  Month:
                </Typography>
                <FormControl sx={{ minWidth: 220 }} size="small">
                  <Select
                    data-testid="select-month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    displayEmpty
                  >
                    {getMonthOptions().map((month) => (
                      <MenuItem key={month.value} value={month.value}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant={isThisMonth ? "contained" : "outlined"}
                  size="small"
                  onClick={() => setSelectedMonth(dayjs().format("YYYY-MM"))}
                  sx={{
                    textTransform: "none",
                    borderRadius: 6,
                    minWidth: 100,
                  }}
                >
                  This Month
                </Button>
                <Button
                  variant={isLastMonth ? "contained" : "outlined"}
                  size="small"
                  onClick={() =>
                    setSelectedMonth(
                      dayjs().subtract(1, "month").format("YYYY-MM"),
                    )
                  }
                  sx={{
                    textTransform: "none",
                    borderRadius: 6,
                    minWidth: 100,
                  }}
                >
                  Last Month
                </Button>
              </Box>
            </Paper>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#f5f5f5" }}>
                  <CardContent sx={{ textAlign: "center", py: 2, px: 1 }}>
                    <Typography color="textSecondary" gutterBottom variant="small">
                      Total Days
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#333" }}
                    >
                      {stats.totalDays}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={100}
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#9e9e9e",
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#E8F5E9" }}>
                  <CardContent sx={{ textAlign: "center", py: 2, px: 1 }}>
                    <Typography color="textSecondary" gutterBottom variant="small">
                      Present
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#4CAF50" }}
                    >
                      {stats.presentDays}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.totalDays > 0
                          ? (stats.presentDays / stats.totalDays) * 100
                          : 0
                      }
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#c8e6c9",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#4CAF50",
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#FFEBEE" }}>
                  <CardContent sx={{ textAlign: "center", py: 2, px: 1 }}>
                    <Typography color="textSecondary" gutterBottom variant="small">
                      Absent
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#D32F2F" }}
                    >
                      {stats.absentDays}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.totalDays > 0
                          ? (stats.absentDays / stats.totalDays) * 100
                          : 0
                      }
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#ffcdd2",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#D32F2F",
                        },
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Card sx={{ backgroundColor: "#FFF3E0" }}>
                  <CardContent sx={{ textAlign: "center", py: 2, px: 1 }}>
                    <Typography color="textSecondary" gutterBottom variant="small">
                      Late
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#FF9800" }}
                    >
                      {stats.lateDays}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={
                        stats.totalDays > 0
                          ? (stats.lateDays / stats.totalDays) * 100
                          : 0
                      }
                      sx={{
                        mt: 1,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: "#ffe0b2",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#FF9800",
                        },
                      }}
                    />
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
                  <CardContent sx={{ textAlign: "center", py: 2, px: 1 }}>
                    <Typography color="textSecondary" gutterBottom variant="small">
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
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(stats.percentage, 100)}
                      sx={{
                        mt: 1,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            stats.percentage >= 75 ? "#4CAF50" : "#D32F2F",
                          borderRadius: 3,
                        },
                      }}
                    />
                    {stats.percentage < 75 && stats.totalDays >= 20 && (
                      <Typography
                        variant="caption"
                        sx={{ color: "#D32F2F", mt: 0.5, display: "block" }}
                      >
                        {daysNeededFor75} more day{daysNeededFor75 !== 1 ? "s" : ""} needed
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Attendance Progress Bar + Warning */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
                    Overall Attendance Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(stats.percentage, 100)}
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
              {stats.percentage < 75 && stats.totalDays >= 20 && (
                <Typography variant="body2" sx={{ mt: 1, color: "#D32F2F" }}>
                  Your attendance is below 75%.
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
                      Day
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Class
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceRecords.length > 0 ? (
                    attendanceRecords.map((record) => (
                      <TableRow
                        key={record._id}
                        hover
                        data-testid={`att-row-${record._id}`}
                      >
                        <TableCell>
                          {dayjs(record.date).format("DD MMM YYYY")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={dayjs(record.date).format("dddd")}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          {record.classId
                            ? `${record.classId.className || ""} ${record.classId.section || ""}`
                            : "—"}
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
                        colSpan={4}
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

            {/* Legend */}
            <Paper
              sx={{ mt: 2, p: 1.5, display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}
            >
              <Typography variant="caption" sx={{ fontWeight: "bold", color: "#666" }}>
                Status Legend:
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#4CAF50" }} />
                <Typography variant="caption">Present</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#D32F2F" }} />
                <Typography variant="caption">Absent</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: "#FF9800" }} />
                <Typography variant="caption">Late</Typography>
              </Box>
            </Paper>
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
