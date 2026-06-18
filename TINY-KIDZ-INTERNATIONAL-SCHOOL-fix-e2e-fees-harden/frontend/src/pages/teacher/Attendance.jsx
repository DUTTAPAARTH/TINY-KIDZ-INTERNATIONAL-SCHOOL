import React, { useState, useEffect } from "react";
import API_BASE from "../../utils/apiConfig";
import {
  Box,
  Container,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import dayjs from "dayjs";
import TeacherLayout from "../../components/TeacherLayout";
import { useSelector } from "react-redux";

const TeacherAttendance = () => {
  const { token } = useSelector((state) => state.auth);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [submittedToday, setSubmittedToday] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const dateToday = dayjs().format("YYYY-MM-DD");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch("API_BASE + "/teachers/me", { headers });
        const data = await response.json();
        const clsList = data.data?.assignedClasses || data.data?.classIds || [];
        const formattedClasses = clsList.map((c) => ({ id: c._id || c.id, name: `${c.className || ''} ${c.section || ''}`.trim() || c.name }));
        setClasses(formattedClasses);
        if (formattedClasses.length > 0) {
          setSelectedClass(formattedClasses[0].id || formattedClasses[0]._id);
        }
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) {
        setStudents([]);
      setAttendanceRecords({});
      setSubmittedToday(false);
      setIsEditing(false);
      return;
    }

    const fetchStudentsAndAttendance = async () => {
      setLoading(true);
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const resStudents = await fetch(`${API_BASE}/students?classId=${selectedClass}&limit=1000`, { headers });
        const dataStudents = await resStudents.json();
        const stdList = dataStudents.data || dataStudents;
        setStudents(stdList);

        const resAttendance = await fetch(`${API_BASE}/attendance/class/${selectedClass}/date/${dateToday}`, { headers });
        
        let initialRecords = {};
        if (resAttendance.ok) {
          const dataAttendance = await resAttendance.json();
          if (dataAttendance.data && dataAttendance.data.records) {
            setSubmittedToday(true);
            setIsEditing(false);
            dataAttendance.data.records.forEach((r) => {
              // Ensure r.studentId is a string if populated or just an ID
              const sid = typeof r.studentId === "object" ? r.studentId._id : r.studentId;
              initialRecords[sid] = r.status;
            });
          }
        } else {
          setSubmittedToday(false);
          setIsEditing(false);
        }
        setAttendanceRecords(initialRecords);

      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentsAndAttendance();
  }, [selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status) => {
    const newRecords = {};
    students.forEach((s) => {
      newRecords[s._id] = status;
    });
    setAttendanceRecords(newRecords);
  };

  const handleReset = () => {
    setAttendanceRecords({});
  };

  const handleOpenDialog = () => {
    if (Object.keys(attendanceRecords).length !== students.length) {
      setSnackbar({ open: true, message: "Please mark attendance for all students.", severity: "warning" });
      return;
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const headers = { 
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      const records = Object.keys(attendanceRecords).map((studentId) => ({
        studentId,
        status: attendanceRecords[studentId],
      }));

      const payload = {
        classId: selectedClass,
        date: dateToday,
        records,
      };

      const response = await fetch("API_BASE + "/attendance", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSnackbar({ open: true, message: "Attendance saved successfully!", severity: "success" });
        setSubmittedToday(true);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        console.error("Attendance API error:", errorData);
        setSnackbar({ open: true, message: errorData.error || errorData.message || "Error saving attendance.", severity: "error" });
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to submit attendance.", severity: "error" });
    } finally {
      setLoading(false);
      setDialogOpen(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "Present") return "success.main";
    if (status === "Absent") return "error.main";
    if (status === "Late") return "warning.main";
    return "text.secondary";
  };

  return (
    <TeacherLayout>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f6f9ff" }}>
        <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a56db", mb: 2, fontFamily: 'Manrope, sans-serif' }}>
            Daily Attendance
          </Typography>

          {submittedToday && selectedClass && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Attendance for {dateToday} has already been submitted. You can edit it below if needed.
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mr: 2, alignSelf: 'center' }}>
                Your Classes:
              </Typography>
              {classes.length === 0 ? (
                <Typography color="text.secondary" sx={{ alignSelf: 'center' }}>No classes assigned.</Typography>
              ) : (
                classes.map((cls) => (
                  <Button
                    key={cls.id}
                    variant={selectedClass === cls.id ? "contained" : "outlined"}
                    onClick={() => setSelectedClass(cls.id)}
                    sx={{ 
                      borderRadius: 8, 
                      textTransform: 'none', 
                      bgcolor: selectedClass === cls.id ? "#1a56db" : "transparent",
                      color: selectedClass === cls.id ? "white" : "#1a56db",
                      borderColor: "#1a56db"
                    }}
                  >
                    {cls.name}
                  </Button>
                ))
              )}
            </Box>

            {submittedToday && !isEditing && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(true)}
                  sx={{ bgcolor: "#003fb1", color: "white", px: 4, py: 1.5, borderRadius: 2 }}
                >
                  Edit Attendance
                </Button>
              </Box>
            )}

            {(!submittedToday || isEditing) && selectedClass && students.length > 0 && (
              <>
                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                  <Button variant="outlined" onClick={() => handleMarkAll("Present")} sx={{ borderColor: "#1a56db", color: "#1a56db" }}>
                    Mark All Present
                  </Button>
                  <Button variant="text" onClick={handleReset} sx={{ color: "#737686" }}>
                    Reset
                  </Button>
                </Box>

                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Roll No</strong></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student) => {
                        const status = attendanceRecords[student._id] || "";
                        return (
                          <TableRow key={student._id}>
                            <TableCell>{student.admissionNumber || student.admissionNo || "N/A"}</TableCell>
                            <TableCell>{student.userId?.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "N/A"}</TableCell>
                            <TableCell>
                              <RadioGroup
                                row
                                value={status}
                                onChange={(e) => handleStatusChange(student._id, e.target.value)}
                              >
                                <FormControlLabel 
                                  value="Present" 
                                  control={<Radio sx={{ '&.Mui-checked': { color: 'success.main' } }} />} 
                                  label={<Typography sx={{ color: status === 'Present' ? 'success.main' : 'inherit' }}>Present</Typography>} 
                                />
                                <FormControlLabel 
                                  value="Absent" 
                                  control={<Radio sx={{ '&.Mui-checked': { color: 'error.main' } }} />} 
                                  label={<Typography sx={{ color: status === 'Absent' ? 'error.main' : 'inherit' }}>Absent</Typography>} 
                                />
                                <FormControlLabel 
                                  value="Late" 
                                  control={<Radio sx={{ '&.Mui-checked': { color: 'warning.main' } }} />} 
                                  label={<Typography sx={{ color: status === 'Late' ? 'warning.main' : 'inherit' }}>Late</Typography>} 
                                />
                              </RadioGroup>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    onClick={handleOpenDialog}
                    disabled={loading}
                    sx={{ bgcolor: "#003fb1", color: "white", px: 4, py: 1.5, borderRadius: 2 }}
                  >
                    Submit Attendance
                  </Button>
                </Box>
              </>
            )}
            
            {selectedClass && students.length === 0 && !loading && (
              <Typography sx={{ mt: 2 }}>No students found in this class.</Typography>
            )}
          </Paper>

          {/* Confirm Dialog */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold' }}>Confirm Submission</DialogTitle>
            <DialogContent>
              <Typography sx={{ mb: 2 }}>
                You are about to submit attendance for <strong>{classes.find(c => c.id === selectedClass)?.name}</strong> on <strong>{dateToday}</strong>.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.dark', flex: 1, textAlign: 'center' }}>
                  <Typography variant="h6">{Object.values(attendanceRecords).filter(s => s === "Present").length}</Typography>
                  <Typography>Present</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.dark', flex: 1, textAlign: 'center' }}>
                  <Typography variant="h6">{Object.values(attendanceRecords).filter(s => s === "Absent").length}</Typography>
                  <Typography>Absent</Typography>
                </Paper>
                <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.dark', flex: 1, textAlign: 'center' }}>
                  <Typography variant="h6">{Object.values(attendanceRecords).filter(s => s === "Late").length}</Typography>
                  <Typography>Late</Typography>
                </Paper>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDialogOpen(false)} sx={{ color: "#737686" }}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: "#003fb1", color: "white" }} disabled={loading}>
                {loading ? "Saving..." : "Confirm & Save"}
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </Container>
      </Box>
    </TeacherLayout>
  );
};

export default TeacherAttendance;

