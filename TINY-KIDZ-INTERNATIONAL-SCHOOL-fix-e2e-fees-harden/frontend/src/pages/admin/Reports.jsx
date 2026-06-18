import { useState, useEffect } from "react";
import API_BASE from "../../utils/apiConfig";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Campaign as CampaignIcon,
  Book as BookIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout";
import { getAuthHeaders } from "../../utils/authSession";

const API_URL = API_BASE;

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Section 1: Overview data
  const [overview, setOverview] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    homeworkAssigned: 0,
    noticesPosted: 0,
    totalSubjects: 0,
  });

  // Section 2: Attendance data
  const [attendance, setAttendance] = useState([]);

  // Section 3: Marks data
  const [marks, setMarks] = useState({
    gradeDistribution: [],
    avgMarksPerSubject: [],
    avgMarksPerClass: [],
  });

  // Section 4: Fees data
  const [fees, setFees] = useState({
    totalFeeExpected: 0,
    totalCollected: 0,
    totalDue: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
  });

  // Section 5: Top students data
  const [topStudents, setTopStudents] = useState([]);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const config = {
        headers: getAuthHeaders(),
      };

      // Fetch all reports in parallel
      const [overviewRes, attendanceRes, marksRes, feesRes, topStudentsRes] =
        await Promise.all([
          axios.get(`${API_URL}/reports/overview`, config),
          axios.get(`${API_URL}/reports/attendance`, config),
          axios.get(`${API_URL}/reports/marks`, config),
          axios.get(`${API_URL}/reports/fees`, config),
          axios.get(`${API_URL}/reports/top-students`, config),
        ]);

      setOverview(overviewRes.data?.data || {});
      setAttendance(attendanceRes.data?.data || []);
      setMarks(
        marksRes.data?.data || {
          gradeDistribution: [],
          avgMarksPerSubject: [],
          avgMarksPerClass: [],
        },
      );
      setFees(
        feesRes.data?.data || {
          totalFeeExpected: 0,
          totalCollected: 0,
          totalDue: 0,
          paidCount: 0,
          partialCount: 0,
          unpaidCount: 0,
        },
      );
      setTopStudents(topStudentsRes.data?.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(err.response?.data?.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleExport = () => {
    window.print();
  };

  // Overview cards configuration
  const overviewCards = [
    {
      title: "Total Students",
      value: overview.totalStudents,
      color: "#2196F3",
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Total Teachers",
      value: overview.totalTeachers,
      color: "#9C27B0",
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Total Classes",
      value: overview.totalClasses,
      color: "#4CAF50",
      icon: <ClassIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Homework Assigned",
      value: overview.homeworkAssigned,
      color: "#FF9800",
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Notices Posted",
      value: overview.noticesPosted,
      color: "#D32F2F",
      icon: <CampaignIcon sx={{ fontSize: 40 }} />,
    },
    {
      title: "Total Subjects",
      value: overview.totalSubjects,
      color: "#00BCD4",
      icon: <BookIcon sx={{ fontSize: 40 }} />,
    },
  ];

  // Grade colors for pie chart
  const gradeColors = {
    "A+": "#4CAF50",
    A: "#2196F3",
    "B+": "#FF9800",
    B: "#FFC107",
    C: "#F44336",
  };

  // Prepare grade distribution data for pie chart
  const gradeDistributionData = (marks.gradeDistribution || []).map((item) => ({
    name: item._id,
    value: item.count,
    color: gradeColors[item._id] || "#999",
  }));

  // Prepare fee collection pie chart data
  const feeCollectionData = [
    { name: "Paid", value: fees.paidCount, color: "#4CAF50" },
    { name: "Partial", value: fees.partialCount, color: "#FF9800" },
    { name: "Unpaid", value: fees.unpaidCount, color: "#F44336" },
  ];

  // DataGrid columns for top students
  const topStudentsColumns = [
    {
      field: "rank",
      headerName: "Rank",
      width: 100,
      renderCell: (params) => {
        const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
        return (
          <Typography variant="body1" fontWeight="bold">
            {medals[params.value] || params.value}
          </Typography>
        );
      },
    },
    {
      field: "studentName",
      headerName: "Student Name",
      width: 200,
      flex: 1,
    },
    {
      field: "className",
      headerName: "Class",
      width: 150,
    },
    {
      field: "averageMarks",
      headerName: "Avg Marks",
      width: 120,
      renderCell: (params) => (
        <Typography fontWeight="bold">{params.value?.toFixed(2)}</Typography>
      ),
    },
    {
      field: "gradeLevel",
      headerName: "Grade",
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor: gradeColors[params.value] || "#999",
            color: "white",
            fontWeight: "bold",
          }}
        />
      ),
    },
    {
      field: "attendancePercentage",
      headerName: "Attendance %",
      width: 140,
      renderCell: (params) => (
        <Typography
          color={params.value >= 75 ? "success.main" : "error.main"}
          fontWeight="bold"
        >
          {params.value?.toFixed(1)}%
        </Typography>
      ),
    },
  ];

  // Add rank to top students data
  const topStudentsRows = (topStudents || []).map((student, index) => ({
    id: student.studentId || `student-${index + 1}`,
    rank: index + 1,
    studentName: student.studentName,
    className: student.className,
    averageMarks: student.averageMarks,
    gradeLevel: student.gradeLevel,
    attendancePercentage: student.attendancePercentage,
  }));

  // Custom bar color based on attendance percentage
  const getAttendanceBarColor = (percentage) => {
    return percentage >= 75 ? "#4CAF50" : "#F44336";
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="80vh"
        >
          <CircularProgress size={60} sx={{ color: "#D32F2F" }} />
        </Box>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Box p={3}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={fetchAllData}
            sx={{ mt: 2, bgcolor: "#D32F2F" }}
          >
            Retry
          </Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
        {/* Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              color="#D32F2F"
              gutterBottom
            >
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleString()}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
          >
            Export Report
          </Button>
        </Box>

        {/* Section 1: Overview Cards */}
        <Grid container spacing={2} mb={4}>
          {overviewCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Card
                elevation={3}
                sx={{
                  background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
                  color: "white",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Box sx={{ opacity: 0.9 }}>{card.icon}</Box>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {card.value}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {card.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Section 2: Attendance Chart */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#D32F2F">
            Attendance by Class
          </Typography>
          {attendance.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={attendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis
                  label={{
                    value: "Attendance %",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value) => `${value.toFixed(2)}%`}
                  contentStyle={{ borderRadius: 8 }}
                />
                <Legend />
                <Bar
                  dataKey="avgAttendance"
                  name="Attendance %"
                  fill="#4CAF50"
                  radius={[8, 8, 0, 0]}
                >
                  {attendance.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getAttendanceBarColor(entry.avgAttendance)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary" align="center" py={5}>
              No attendance data available
            </Typography>
          )}
        </Paper>

        {/* Section 3: Marks Distribution */}
        <Grid container spacing={3} mb={4}>
          {/* Grade Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" mb={3} color="#D32F2F">
                Grade Distribution
              </Typography>
              {gradeDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={gradeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gradeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" align="center" py={5}>
                  No grade data available
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Average Marks Per Subject */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
              <Typography variant="h6" fontWeight="bold" mb={3} color="#D32F2F">
                Average Marks per Subject
              </Typography>
              {marks.avgMarksPerSubject.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={marks.avgMarksPerSubject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="subjectName"
                      label={{
                        value: "Subject",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      label={{
                        value: "Avg Marks",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value) => value.toFixed(2)}
                      contentStyle={{ borderRadius: 8 }}
                    />
                    <Legend />
                    <Bar
                      dataKey="averageMarks"
                      name="Average Marks"
                      fill="#2196F3"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" align="center" py={5}>
                  No marks data available
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Section 4: Fee Collection Summary */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#D32F2F">
            Fee Collection Summary
          </Typography>

          {/* Fee Stats Cards */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#E3F2FD", height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Expected
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#2196F3">
                    ₹{fees.totalFeeExpected?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#E8F5E9", height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Collected
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#4CAF50">
                    ₹{fees.totalCollected?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: "#FFEBEE", height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Total Due
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#F44336">
                    ₹{fees.totalDue?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Fee Collection Pie Chart */}
          <Box display="flex" justifyContent="center">
            {feeCollectionData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={feeCollectionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) =>
                      `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={110}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feeCollectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" align="center" py={5}>
                No fee data available
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Section 5: Top 10 Students */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" mb={3} color="#D32F2F">
            Top 10 Students
          </Typography>
          <Box sx={{ height: 650, width: "100%" }}>
            <DataGrid
              rows={topStudentsRows}
              columns={topStudentsColumns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              disableSelectionOnClick
              sx={{
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "#D32F2F",
                  color: "white",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-row:hover": {
                  bgcolor: "#FFEBEE",
                },
              }}
            />
          </Box>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default Reports;

