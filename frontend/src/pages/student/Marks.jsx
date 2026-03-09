import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  Snackbar,
  Alert,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import StudentLayout from "../../components/StudentLayout";

const getGradeColor = (percentage) => {
  if (percentage >= 80) return "#4caf50";
  if (percentage >= 60) return "#ff9800";
  return "#f44336";
};

const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  return "C";
};

const StudentMarks = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [selectedTab, setSelectedTab] = useState(0);
  const [stats, setStats] = useState({
    overallAverage: 0,
    bestSubject: "N/A",
    totalExams: 0,
  });

  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    if (studentId) {
      fetchStudentMarks();
    }
  }, [studentId]);

  const fetchStudentMarks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/marks?studentId=${studentId}`,
      );
      const data = await response.json();
      setMarks(data);
      calculateStats(data);
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

  const calculateStats = (marksData) => {
    if (marksData.length === 0) {
      setStats({ overallAverage: 0, bestSubject: "N/A", totalExams: 0 });
      return;
    }

    const percentages = marksData.map(
      (mark) => (mark.marksObtained / mark.totalMarks) * 100,
    );
    const overallAverage = (
      percentages.reduce((sum, value) => sum + value, 0) / percentages.length
    ).toFixed(2);

    const subjectAverages = {};
    marksData.forEach((mark) => {
      const subject = mark.subjectId?.subjectName || "N/A";
      if (!subjectAverages[subject]) {
        subjectAverages[subject] = { total: 0, count: 0 };
      }
      const percentage = (mark.marksObtained / mark.totalMarks) * 100;
      subjectAverages[subject].total += percentage;
      subjectAverages[subject].count += 1;
    });

    let bestSubject = "N/A";
    let bestAverage = -1;
    Object.keys(subjectAverages).forEach((subject) => {
      const avg =
        subjectAverages[subject].total / subjectAverages[subject].count;
      if (avg > bestAverage) {
        bestAverage = avg;
        bestSubject = subject;
      }
    });

    setStats({
      overallAverage,
      bestSubject,
      totalExams: marksData.length,
    });
  };

  const examTypes = ["Unit Test", "Mid Term", "Final", "Project"];
  const getFilteredMarks = (tabIndex) => {
    if (tabIndex === 0) return marks;
    return marks.filter((mark) => mark.examType === examTypes[tabIndex - 1]);
  };

  const filteredMarks = getFilteredMarks(selectedTab);

  return (
    <StudentLayout>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#D32F2F", mb: 2 }}
            >
              My Marks
            </Typography>
          </Box>

          {!loading && marks.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: "white" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Overall Average
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: "#D32F2F", fontWeight: "bold" }}
                    >
                      {stats.overallAverage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: "white" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Best Subject
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: "#4caf50", fontWeight: "bold" }}
                    >
                      {stats.bestSubject}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card sx={{ bgcolor: "white" }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Exams
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: "#2196f3", fontWeight: "bold" }}
                    >
                      {stats.totalExams}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {marks.length > 0 && (
            <Paper sx={{ bgcolor: "white", mb: 3 }}>
              <Tabs
                value={selectedTab}
                onChange={(e, value) => setSelectedTab(value)}
                sx={{ borderBottom: "1px solid #e0e0e0" }}
              >
                <Tab label="All" />
                <Tab label="Unit Test" />
                <Tab label="Mid Term" />
                <Tab label="Final" />
                <Tab label="Project" />
              </Tabs>
            </Paper>
          )}

          <Paper sx={{ p: 3, bgcolor: "white", borderRadius: 2 }}>
            {loading ? (
              <Typography sx={{ textAlign: "center", py: 4 }}>
                Loading marks...
              </Typography>
            ) : filteredMarks.length === 0 ? (
              <Typography
                sx={{ textAlign: "center", py: 4, color: "textSecondary" }}
              >
                No marks available in this category
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", color: "#D32F2F" }}>
                        Subject
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold", color: "#D32F2F" }}>
                        Exam Type
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "#D32F2F" }}
                      >
                        Marks
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "#D32F2F" }}
                      >
                        Percentage
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: "bold", color: "#D32F2F" }}
                      >
                        Grade
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMarks.map((mark) => {
                      const percentage = (
                        (mark.marksObtained / mark.totalMarks) *
                        100
                      ).toFixed(1);
                      const grade = getGrade(percentage);
                      const bgColor = getGradeColor(percentage);

                      return (
                        <TableRow
                          key={mark._id}
                          sx={{
                            bgcolor:
                              bgColor === "#4caf50"
                                ? "#f1f8e9"
                                : bgColor === "#ff9800"
                                  ? "#fff8e1"
                                  : "#ffebee",
                          }}
                        >
                          <TableCell>
                            {mark.subjectId?.subjectName || "N/A"}
                          </TableCell>
                          <TableCell>{mark.examType}</TableCell>
                          <TableCell align="right">
                            {mark.marksObtained}/{mark.totalMarks}
                          </TableCell>
                          <TableCell align="right">
                            <Typography
                              sx={{ fontWeight: "bold", color: bgColor }}
                            >
                              {percentage}%
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              sx={{
                                fontWeight: "bold",
                                bgcolor: bgColor,
                                color: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                display: "inline-block",
                              }}
                            >
                              {grade}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
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
      </Box>
    </StudentLayout>
  );
};

export default StudentMarks;
