import { useState, useEffect } from "react";
import {
  Box, Container, Paper, Snackbar, Alert, Typography, Card, CardContent,
  Grid, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip,
} from "@mui/material";
import StudentLayout from "../../components/StudentLayout";
import { marksAPI } from "../../services/marksService";

const GRADE_COLORS = {
  A: "#4caf50", B: "#2196f3", C: "#ff9800", D: "#f44336", F: "#b71c1c",
};

const EXAM_TYPES = ["UT1", "UT2", "UT3", "UT4", "Mid Term", "Final Exam"];

const StudentMarks = () => {
  const [marksData, setMarksData] = useState({ myMarks: [], summary: { totalExams: 0, averageMarks: 0, passCount: 0, failCount: 0 } });
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const res = await marksAPI.getMyMarks();
      setMarksData(res.data);
    } catch (err) {
      console.error("Failed to load marks:", err);
      setSnackbar({ open: true, message: "Failed to load marks", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const marks = marksData.myMarks || [];
  const summary = marksData.summary || { totalExams: 0, averageMarks: 0, passCount: 0, failCount: 0 };

  const getFilteredMarks = (tabIndex) => {
    if (tabIndex === 0) return marks;
    const examType = EXAM_TYPES[tabIndex - 1];
    return marks.filter((m) => m.examType === examType);
  };

  const filteredMarks = getFilteredMarks(selectedTab);

  const getGradeFromPercentage = (pct) => {
    if (pct >= 90) return "A";
    if (pct >= 80) return "B";
    if (pct >= 70) return "C";
    if (pct >= 60) return "D";
    return "F";
  };

  return (
    <StudentLayout>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: "bold", color: "#D32F2F", mb: 2 }}>
              My Marks &amp; Performance
            </Typography>
          </Box>

          {!loading && marks.length > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: "white", borderRadius: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">Total Exams</Typography>
                    <Typography variant="h5" sx={{ color: "#D32F2F", fontWeight: "bold" }}>{summary.totalExams}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: "white", borderRadius: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">Overall Average</Typography>
                    <Typography variant="h5" sx={{ color: "#2196f3", fontWeight: "bold" }}>{summary.averageMarks}%</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: "white", borderRadius: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">Passed</Typography>
                    <Typography variant="h5" sx={{ color: "#4caf50", fontWeight: "bold" }}>{summary.passCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Card sx={{ bgcolor: "white", borderRadius: 2 }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">Failed</Typography>
                    <Typography variant="h5" sx={{ color: "#f44336", fontWeight: "bold" }}>{summary.failCount}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {marks.length > 0 && (
            <Paper sx={{ bgcolor: "white", mb: 3 }}>
              <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}
                sx={{ "& .MuiTab-root": { textTransform: "none", fontWeight: 500 },
                  "& .Mui-selected": { color: "#D32F2F !important" },
                  "& .MuiTabs-indicator": { bgcolor: "#D32F2F" } }}>
                <Tab label="All" />
                {EXAM_TYPES.map((t) => <Tab key={t} label={t} />)}
              </Tabs>
            </Paper>
          )}

          <Paper sx={{ p: 3, bgcolor: "white", borderRadius: 2 }}>
            {loading ? (
              <Typography sx={{ textAlign: "center", py: 4 }}>Loading marks...</Typography>
            ) : filteredMarks.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                {marks.length === 0 ? "No marks available yet" : "No marks in this category"}
              </Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold", color: "#D32F2F" }}>Subject</TableCell>
                      <TableCell sx={{ fontWeight: "bold", color: "#D32F2F" }}>Exam Type</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#D32F2F" }}>Marks</TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#D32F2F" }}>Percentage</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold", color: "#D32F2F" }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: "bold", color: "#D32F2F" }}>Remarks</TableCell>
                      <TableCell sx={{ fontWeight: "bold", color: "#D32F2F" }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMarks.map((mark) => {
                      const pct = Number(((mark.marksObtained / mark.totalMarks) * 100).toFixed(1));
                      const grade = mark.grade || getGradeFromPercentage(pct);
                      const color = GRADE_COLORS[grade] || "#999";

                      return (
                        <TableRow key={mark._id} sx={{
                          bgcolor: grade === "F" ? "#ffebee" : grade === "D" ? "#fff8e1" : "#f1f8e9",
                        }}>
                          <TableCell sx={{ fontWeight: 500 }}>{mark.subjectId?.name || "N/A"}</TableCell>
                          <TableCell>{mark.examType}</TableCell>
                          <TableCell align="right">{mark.marksObtained}/{mark.totalMarks}</TableCell>
                          <TableCell align="right">
                            <Typography sx={{ fontWeight: "bold", color }}>{pct}%</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={grade} size="small"
                              sx={{ bgcolor: color, color: "white", fontWeight: "bold", minWidth: 36 }} />
                          </TableCell>
                          <TableCell>{mark.remarks || "-"}</TableCell>
                          <TableCell>{new Date(mark.examDate).toLocaleDateString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Snackbar open={snackbar.open} autoHideDuration={4000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </Container>
      </Box>
    </StudentLayout>
  );
};

export default StudentMarks;
