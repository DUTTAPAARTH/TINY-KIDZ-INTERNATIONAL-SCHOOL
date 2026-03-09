import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import DownloadIcon from "@mui/icons-material/Download";
import API from "../../services/authService";
import AdminLayout from "../../components/AdminLayout";

const AdminAttendance = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [startDate, setStartDate] = useState(dayjs().subtract(7, "days"));
  const [endDate, setEndDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [expandedRow, setExpandedRow] = useState(null);
  const [expandedDetails, setExpandedDetails] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await API.get("/api/classes");
        setClasses(response.data.data || []);
        if (response.data.data?.length > 0) {
          setSelectedClass(response.data.data[0]._id);
        }
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

  // Fetch attendance records
  useEffect(() => {
    if (!selectedClass) return;

    const fetchAttendance = async () => {
      setLoading(true);
      try {
        const response = await API.get(
          `/api/attendance/class/${selectedClass}`,
        );
        const records = response.data.data || [];

        // Filter by date range
        const filtered = records.filter((record) => {
          const recordDate = dayjs(record.date);
          return (
            recordDate.isSameOrAfter(startDate, "day") &&
            recordDate.isSameOrBefore(endDate, "day")
          );
        });

        // Calculate stats per row
        const processedData = filtered.map((record, index) => {
          const totalStudents = record.records?.length || 0;
          const present =
            record.records?.filter((r) => r.status === "Present").length || 0;
          const absent =
            record.records?.filter((r) => r.status === "Absent").length || 0;
          const late =
            record.records?.filter((r) => r.status === "Late").length || 0;
          const percentage =
            totalStudents > 0
              ? ((present / totalStudents) * 100).toFixed(1)
              : 0;

          return {
            id: record._id || index,
            date: dayjs(record.date).format("DD MMM YYYY"),
            className: record.classId?.name || "N/A",
            totalStudents,
            present,
            absent,
            late,
            percentage: `${percentage}%`,
            records: record.records,
            classId: record.classId?._id,
          };
        });

        setAttendanceData(processedData);
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
  }, [selectedClass, startDate, endDate]);

  const handleExpandRow = (row) => {
    setExpandedRow(row.id === expandedRow ? null : row.id);
    if (row.records) {
      setExpandedDetails(row.records);
    }
    setDialogOpen(row.id !== expandedRow);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setExpandedRow(null);
  };

  const handleExportCSV = () => {
    if (attendanceData.length === 0) {
      setSnackbar({
        open: true,
        message: "No data to export",
        severity: "warning",
      });
      return;
    }

    const headers = [
      "Date",
      "Class",
      "Total Students",
      "Present",
      "Absent",
      "Late",
      "Attendance %",
    ];
    const rows = attendanceData.map((row) => [
      row.date,
      row.className,
      row.totalStudents,
      row.present,
      row.absent,
      row.late,
      row.percentage,
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n",
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${dayjs().format("YYYY-MM-DD")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: "CSV exported successfully",
      severity: "success",
    });
  };

  const columns = [
    { field: "date", headerName: "Date", flex: 1, minWidth: 120 },
    { field: "className", headerName: "Class", flex: 1, minWidth: 100 },
    {
      field: "totalStudents",
      headerName: "Total Students",
      width: 130,
      type: "number",
    },
    {
      field: "present",
      headerName: "Present",
      width: 100,
      type: "number",
      renderCell: (params) => (
        <Chip label={params.value} color="success" size="small" />
      ),
    },
    {
      field: "absent",
      headerName: "Absent",
      width: 100,
      type: "number",
      renderCell: (params) => (
        <Chip label={params.value} color="error" size="small" />
      ),
    },
    {
      field: "late",
      headerName: "Late",
      width: 100,
      type: "number",
      renderCell: (params) => (
        <Chip label={params.value} color="warning" size="small" />
      ),
    },
    {
      field: "percentage",
      headerName: "Attendance %",
      width: 130,
      renderCell: (params) => (
        <Typography
          sx={{
            color: parseFloat(params.value) >= 75 ? "#4CAF50" : "#D32F2F",
            fontWeight: "bold",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "action",
      headerName: "Details",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          sx={{ color: "#D32F2F", borderColor: "#D32F2F" }}
          onClick={() => handleExpandRow(params.row)}
        >
          View
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
          Attendance Overview
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={startDate}
                  onChange={setStartDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="To Date"
                  value={endDate}
                  onChange={setEndDate}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{
                  backgroundColor: "#D32F2F",
                  color: "white",
                  py: 1.5,
                  "&:hover": { backgroundColor: "#B71C1C" },
                }}
                onClick={handleExportCSV}
              >
                Export CSV
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
              rows={attendanceData}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              disableSelectionOnClick
            />
          </Paper>
        )}

        {/* Detail Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ backgroundColor: "#D32F2F", color: "white" }}>
            Student Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Admission No
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Student Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expandedDetails.map((record, idx) => (
                    <TableRow key={idx}>
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
          </DialogContent>
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
    </AdminLayout>
  );
};

export default AdminAttendance;
