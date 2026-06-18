import { useState, useEffect } from "react";
import API_BASE from "../../utils/apiConfig";
import {
  Box, Container, Paper, Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Snackbar, Alert, Typography, Chip, IconButton,
  Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminLayout from "../../components/AdminLayout";
import { marksAPI } from "../../services/marksService";

const EXAM_TYPES = ["UT1", "UT2", "UT3", "UT4", "Mid Term", "Final Exam"];

const AdminMarks = () => {
  const [marks, setMarks] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [subjects, setSubjects] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, markId: null });

  useEffect(() => {
    fetchClasses();
    fetchAllMarks();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await marksAPI.getMarks();
      const clsRes = await fetch("API_BASE + "/classes", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const clsData = await clsRes.json();
      if (clsData.success) {
        setClasses(clsData.data);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  };

  const fetchAllMarks = async (filters = {}) => {
    setLoading(true);
    try {
      const res = await marksAPI.getMarks(filters);
      setMarks(res.data?.marks || []);
      if (res.data?.students) {
        const uniqueSubjects = [...new Set((res.data.marks || []).map((m) => m.subjectId?.name).filter(Boolean))];
        setSubjects(uniqueSubjects.map((s) => ({ id: s, name: s })));
      }
    } catch (err) {
      console.error("Failed to load marks:", err);
      setSnackbar({ open: true, message: "Failed to load marks", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    const filters = {};
    if (classFilter) filters.classId = classFilter;
    if (examTypeFilter) filters.examType = examTypeFilter;
    fetchAllMarks(filters);
  };

  const handleDeleteMark = async () => {
    if (!deleteDialog.markId) return;
    try {
      await marksAPI.deleteMarks(deleteDialog.markId);
      setSnackbar({ open: true, message: "Mark deleted successfully", severity: "success" });
      setDeleteDialog({ open: false, markId: null });
      handleApplyFilters();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete mark", severity: "error" });
    }
  };

  const renderReportSummary = () => {
    const validMarks = marks.filter((m) => m.marksObtained !== undefined);
    if (validMarks.length === 0) return null;

    const avg = (validMarks.reduce((s, m) => s + m.marksObtained, 0) / validMarks.length).toFixed(1);
    const highest = Math.max(...validMarks.map((m) => m.marksObtained));
    const lowest = Math.min(...validMarks.map((m) => m.marksObtained));
    const passCount = validMarks.filter((m) => m.marksObtained >= 35).length;
    const failCount = validMarks.length - passCount;
    const passRate = ((passCount / validMarks.length) * 100).toFixed(1);

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}>
            <Typography variant="h6" sx={{ color: "#1565c0", fontWeight: "bold" }}>{avg}</Typography>
            <Typography variant="caption">Class Avg</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e9" }}>
            <Typography variant="h6" sx={{ color: "#2e7d32", fontWeight: "bold" }}>{highest}</Typography>
            <Typography variant="caption">Highest</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#ffebee" }}>
            <Typography variant="h6" sx={{ color: "#c62828", fontWeight: "bold" }}>{lowest}</Typography>
            <Typography variant="caption">Lowest</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#f3e5f5" }}>
            <Typography variant="h6" sx={{ color: "#7b1fa2", fontWeight: "bold" }}>{passRate}%</Typography>
            <Typography variant="caption">Pass Rate ({passCount}/{validMarks.length})</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Paper sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
            <Typography variant="h6" sx={{ color: "#e65100", fontWeight: "bold" }}>{failCount}</Typography>
            <Typography variant="caption">Failed</Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const getStudentName = (mark) => {
    if (mark.studentId?.userId?.name) return mark.studentId.userId.name;
    return mark.studentId?.name || "N/A";
  };

  const getClassName = (mark) => {
    if (mark.studentId?.classId) {
      return `${mark.studentId.classId?.className || ""} ${mark.studentId.classId?.section || ""}`.trim();
    }
    return "N/A";
  };

  return (
    <AdminLayout>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#D32F2F", mb: 3 }}>
            Marks Management (Admin)
          </Typography>

          <Paper sx={{ p: 3, mb: 3, bgcolor: "white", borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Class</InputLabel>
                  <Select value={classFilter} label="Class" onChange={(e) => setClassFilter(e.target.value)}>
                    <MenuItem value="">All Classes</MenuItem>
                    {classes.map((c) => (
                      <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Exam Type</InputLabel>
                  <Select value={examTypeFilter} label="Exam Type" onChange={(e) => setExamTypeFilter(e.target.value)}>
                    <MenuItem value="">All Types</MenuItem>
                    {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button variant="contained" startIcon={<FilterListIcon />} onClick={handleApplyFilters}
                  sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#C62828" } }}>
                  Apply Filters
                </Button>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => { setClassFilter(""); setExamTypeFilter(""); fetchAllMarks(); }}
                  sx={{ color: "#D32F2F", borderColor: "#D32F2F" }}>
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {renderReportSummary()}

          <Paper sx={{ bgcolor: "white", borderRadius: 2, overflow: "hidden" }}>
            {loading ? (
              <Typography sx={{ textAlign: "center", py: 4 }}>Loading...</Typography>
            ) : marks.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                No marks found. Select filters and apply.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#D32F2F" }}>
                    <TableRow>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>#</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Student</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Class</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Subject</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Exam Type</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Marks</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Grade</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Entered By</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Date</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {marks.map((mark, idx) => {
                      const pct = mark.percentage || Number(((mark.marksObtained / mark.totalMarks) * 100).toFixed(1));
                      const isPass = pct >= 35;
                      return (
                        <TableRow key={mark._id} sx={{
                          bgcolor: isPass ? "white" : "#ffebee",
                          "&:hover": { bgcolor: "#fce4ec" },
                        }}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{getStudentName(mark)}</TableCell>
                          <TableCell>{getClassName(mark)}</TableCell>
                          <TableCell>{mark.subjectId?.name || "N/A"}</TableCell>
                          <TableCell>{mark.examType}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: "bold", color: isPass ? "#2e7d32" : "#c62828" }}>
                              {mark.marksObtained}/{mark.totalMarks}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={mark.grade || "F"} size="small"
                              sx={{ bgcolor: isPass ? "#4caf50" : "#f44336", color: "white", fontWeight: "bold" }} />
                          </TableCell>
                          <TableCell>{mark.addedBy?.name || "N/A"}</TableCell>
                          <TableCell>{new Date(mark.examDate).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <IconButton size="small" onClick={() => setDeleteDialog({ open: true, markId: mark._id })}
                              sx={{ color: "#D32F2F" }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box sx={{ p: 2, borderTop: "1px solid #e0e0e0" }}>
              <Typography variant="body2" color="text.secondary">
                Total records: {marks.length}
              </Typography>
            </Box>
          </Paper>

          <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, markId: null })}>
            <DialogTitle sx={{ color: "#D32F2F" }}>Confirm Delete</DialogTitle>
            <DialogContent>
              <Typography>Are you sure you want to delete this mark entry?</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog({ open: false, markId: null })}>Cancel</Button>
              <Button onClick={handleDeleteMark} variant="contained" sx={{ bgcolor: "#D32F2F" }}>Delete</Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snackbar.open} autoHideDuration={4000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default AdminMarks;

