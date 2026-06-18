import { useState, useEffect, useCallback } from "react";
import API_BASE from "../../utils/apiConfig";
import {
  Box, Container, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Grid,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import SettingsIcon from "@mui/icons-material/Settings";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import EditNoteIcon from "@mui/icons-material/EditNote";
import LockIcon from "@mui/icons-material/Lock";
import TeacherLayout from "../../components/TeacherLayout";
import { marksAPI } from "../../services/marksService";
import { getAuthHeaders } from "../../utils/authSession";

const EXAM_TYPES = ["UT1", "UT2", "UT3", "UT4", "Mid Term", "Final Exam"];
const HARDCODED_SUBJECTS = ["English", "Hindi", "Math", "Science", "Social Studies", "Computer", "Punjabi", "Art", "PE"];
const DEFAULT_TOTALS = { UT1: 50, UT2: 50, UT3: 75, UT4: 50, "Mid Term": 30, "Final Exam": 100 };

const GRADE_MAP = [
  { min: 90, grade: "A", label: "Excellent", color: "#4caf50" },
  { min: 75, grade: "B", label: "Good", color: "#2196f3" },
  { min: 60, grade: "C", label: "Satisfactory", color: "#ff9800" },
  { min: 40, grade: "D", label: "Needs Improvement", color: "#f44336" },
  { min: 0, grade: "F", label: "Fail", color: "#b71c1c" },
];

function calcGrade(pct) {
  if (pct === null || pct === undefined) return null;
  for (const g of GRADE_MAP) { if (pct >= g.min) return g; }
  return GRADE_MAP[GRADE_MAP.length - 1];
}

const TeacherMarks = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [phase, setPhase] = useState(1);
  const [selectedExamType, setSelectedExamType] = useState("");
  const [maxMarks, setMaxMarks] = useState(50);
  const [students, setStudents] = useState([]);
  const [marksInput, setMarksInput] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [matrixStudents, setMatrixStudents] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState({});
  const [examTotals, setExamTotals] = useState({ ...DEFAULT_TOTALS });
  const [configOpen, setConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({ ...DEFAULT_TOTALS });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch("API_BASE + "/teachers/me", { headers });
        const data = await res.json();
        const clsList = data.data?.assignedClasses || data.data?.classIds || [];
        const formatted = clsList.map((c) => ({ id: c._id || c.id, name: `${c.className || ""} ${c.section || ""}`.trim() || c.name }));
        setClasses(formatted);
      } catch (err) { console.error(err); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return; }
    (async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/classes/${selectedClass}`, { headers });
        const data = await res.json();
        if (data.success && data.data?.subjects?.length > 0) {
          const mapped = data.data.subjects.map((s) => ({ id: s._id || s, name: s.name || s }));
          const hasNames = mapped.some((s) => s.name?.length > 1);
          if (hasNames) setSubjects(mapped); else setSubjects(HARDCODED_SUBJECTS.map((n) => ({ id: n, name: n })));
        } else setSubjects(HARDCODED_SUBJECTS.map((n) => ({ id: n, name: n })));
      } catch { setSubjects(HARDCODED_SUBJECTS.map((n) => ({ id: n, name: n }))); }
    })();
  }, [selectedClass]);

  const loadEntryForm = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedExamType) return;
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE}/students?classId=${selectedClass}&limit=200`, { headers });
      const data = await res.json();
      const list = data.success ? (data.data || []) : [];
      setStudents(list);
      const marksRes = await marksAPI.getMarks({ classId: selectedClass, subjectId: selectedSubject, examType: selectedExamType });
      const existingMarks = marksRes.data?.marks || [];
      const mm = {};
      let detectedMax = maxMarks;
      list.forEach((s) => { mm[s._id] = { marks: "", status: "Present" }; });
      existingMarks.forEach((m) => {
        const sid = m.studentId?._id || m.studentId;
        if (mm[sid]) {
          mm[sid] = { marks: m.marksObtained !== null && m.marksObtained !== undefined ? String(m.marksObtained) : "", status: m.status || "Present" };
          if (m.totalMarks) detectedMax = m.totalMarks;
        }
      });
      setMarksInput(mm);
      setMaxMarks(detectedMax);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [selectedClass, selectedSubject, selectedExamType]);

  useEffect(() => { if (phase === 1 && selectedClass && selectedSubject && selectedExamType) loadEntryForm(); }, [phase, selectedClass, selectedSubject, selectedExamType]);

  const handleSaveEntry = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => {
        const entry = marksInput[s._id] || { marks: "", status: "Present" };
        return { studentId: s._id, marksObtained: entry.status === "Absent" ? null : (entry.marks === "" ? null : Number(entry.marks)), status: entry.status, totalMarks: maxMarks };
      });
      const payload = { classId: selectedClass, subjectId: selectedSubject, examType: selectedExamType, maxMarks, records };
      const res = await marksAPI.entryMarks(payload);
      setSnackbar({ open: true, message: res.data.message || "Saved", severity: "success" });
      await loadEntryForm();
    } catch (err) { setSnackbar({ open: true, message: err.response?.data?.message || "Error saving", severity: "error" }); }
    finally { setSaving(false); }
  };

  const loadMatrix = useCallback(async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    try {
      const res = await marksAPI.getAssessmentMatrix(selectedClass, selectedSubject);
      const d = res.data;
      if (!d.success) throw new Error(d.message);
      setMatrixStudents(d.students || []);
      setExamTotals(d.examTotals || { ...DEFAULT_TOTALS });
      setConfigForm(d.examTotals || { ...DEFAULT_TOTALS });
      const marks = d.marks || [];
      const matrix = {};
      (d.students || []).forEach((s) => { matrix[s._id] = {}; });
      marks.forEach((m) => {
        const sid = m.studentId?._id || m.studentId;
        if (matrix[sid]) matrix[sid][m.examType] = m;
      });
      setMarksMatrix(matrix);
      setPhase(2);
    } catch (err) { setSnackbar({ open: true, message: "Failed to load matrix", severity: "error" }); }
    finally { setLoading(false); }
  }, [selectedClass, selectedSubject]);

  const totalForExam = (et) => examTotals[et] || DEFAULT_TOTALS[et] || 100;

  const getOverallGrade = (sid) => {
    let totalPct = 0; let count = 0;
    for (const et of EXAM_TYPES) {
      const entry = marksMatrix[sid]?.[et];
      if (entry && entry.status !== "Absent" && entry.marksObtained !== null && entry.marksObtained !== undefined && entry.totalMarks) {
        totalPct += (entry.marksObtained / entry.totalMarks) * 100;
        count++;
      }
    }
    if (count === 0) return null;
    return calcGrade(totalPct / count);
  };

  const handleCellClick = (sid, et) => {
    const entry = marksMatrix[sid]?.[et];
    if (entry?.isPublished) return;
    setEditingCell({ studentId: sid, examType: et });
    setEditValue(entry?.marksObtained !== null && entry?.marksObtained !== undefined ? String(entry.marksObtained) : "");
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    const { studentId: sid, examType: et } = editingCell;
    const val = editValue === "" ? null : Number(editValue);
    const total = totalForExam(et);
    if (val !== null && (isNaN(val) || val < 0 || val > total)) {
      setSnackbar({ open: true, message: `Marks 0-${total}`, severity: "error" }); return;
    }
    try {
      const existing = marksMatrix[sid]?.[et];
      if (existing?._id) {
        await marksAPI.updateMarks(existing._id, { marksObtained: val, totalMarks: total, status: "Present" });
      } else {
        await marksAPI.entryMarks({ classId: selectedClass, subjectId: selectedSubject, examType: et, maxMarks: total, records: [{ studentId: sid, marksObtained: val, status: "Present" }] });
      }
      setMarksMatrix((prev) => ({ ...prev, [sid]: { ...prev[sid], [et]: { marksObtained: val, totalMarks: total, _id: existing?._id, status: "Present", isPublished: false } } }));
      setSnackbar({ open: true, message: "Saved", severity: "success" });
    } catch (err) { setSnackbar({ open: true, message: err.response?.data?.message || "Error", severity: "error" }); }
    setEditingCell(null);
  };

  const handleBulkPublish = async (et) => {
    if (!window.confirm(`Publish all ${et} marks? This will lock them.`)) return;
    setSaving(true);
    try {
      const res = await marksAPI.publishExam(selectedClass, selectedSubject, et);
      setSnackbar({ open: true, message: res.data.message, severity: "success" });
      await loadMatrix();
    } catch (err) { setSnackbar({ open: true, message: err.response?.data?.message || "Error publishing", severity: "error" }); }
    finally { setSaving(false); }
  };

  const handleSaveConfig = async () => {
    try {
      const configs = Object.entries(configForm).map(([et, tm]) => ({ examType: et, totalMarks: Number(tm) }));
      await marksAPI.saveExamConfig(selectedClass, selectedSubject, configs);
      setExamTotals({ ...configForm });
      setSnackbar({ open: true, message: "Exam totals saved", severity: "success" });
      setConfigOpen(false);
    } catch (err) { setSnackbar({ open: true, message: err.response?.data?.message || "Error", severity: "error" }); }
  };

  return (
    <TeacherLayout>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f5f5" }}>
        <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "#D32F2F", mb: 2 }}>
            {phase === 1 ? "Marks Entry" : "Assessment Matrix"}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Button variant={phase === 1 ? "contained" : "outlined"} size="small"
              startIcon={<EditNoteIcon />}
              onClick={() => { setPhase(1); setSelectedExamType(""); }}
              sx={{ textTransform: "none", borderRadius: 6 }}>
              Single Exam Entry
            </Button>
            <Button variant={phase === 2 ? "contained" : "outlined"} size="small"
              startIcon={<ViewModuleIcon />}
              disabled={!selectedClass || !selectedSubject}
              onClick={() => loadMatrix()}
              sx={{ textTransform: "none", borderRadius: 6 }}>
              Full Assessment Matrix
            </Button>
          </Box>

          <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={phase === 1 ? 3 : 4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Class</InputLabel>
                  <Select value={selectedClass} label="Select Class" onChange={(e) => { setSelectedClass(e.target.value); setSelectedSubject(""); }}>
                    {classes.length > 0 ? classes.map((cls) => (
                      <MenuItem key={cls.id} value={cls.id}>{cls.name}</MenuItem>
                    )) : <MenuItem disabled>No classes assigned</MenuItem>}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={phase === 1 ? 3 : 4}>
                <FormControl fullWidth size="small" disabled={!selectedClass}>
                  <InputLabel>Subject</InputLabel>
                  <Select value={selectedSubject} label="Subject" onChange={(e) => setSelectedSubject(e.target.value)}>
                    {subjects.map((sub) => (<MenuItem key={sub.id} value={sub.id}>{sub.name}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              {phase === 1 && (
                <>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth size="small" disabled={!selectedSubject}>
                      <InputLabel>Exam Type</InputLabel>
                      <Select value={selectedExamType} label="Exam Type" onChange={(e) => setSelectedExamType(e.target.value)}>
                        {EXAM_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField label="Max Marks" type="number" size="small" fullWidth
                      value={maxMarks} disabled={!selectedExamType}
                      onChange={(e) => setMaxMarks(Math.max(1, Number(e.target.value) || 1))}
                      inputProps={{ min: 1 }} />
                  </Grid>
                </>
              )}
              {phase === 2 && (
                <Grid item xs={12} sm={4}>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button variant="outlined" startIcon={<SettingsIcon />}
                      onClick={() => { setConfigForm({ ...examTotals }); setConfigOpen(true); }}
                      sx={{ color: "#D32F2F", borderColor: "#D32F2F" }}>Totals</Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadMatrix}
                      sx={{ color: "#D32F2F", borderColor: "#D32F2F" }}>Refresh</Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>

          {phase === 1 && !selectedExamType && (
            <Paper sx={{ p: 3, bgcolor: "#FFF8E1", borderRadius: 2, border: "1px solid #FFE082" }}>
              <Typography variant="subtitle2" sx={{ color: "#F57F17" }}>
                Select Class, Subject, and Exam Type to start entering marks.
              </Typography>
            </Paper>
          )}

          {phase === 1 && selectedExamType && (
            loading ? <Typography sx={{ textAlign: "center", py: 4 }}>Loading...</Typography> :
            students.length === 0 ? <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>No students found</Typography> :
            <>
              <Paper sx={{ p: 1.5, mb: 1, borderRadius: 1, bgcolor: "#fafafa", border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2">
                  <strong>{selectedExamType}</strong> &middot; Max Marks: <strong>{maxMarks}</strong>
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button size="small" variant="contained" startIcon={<SaveIcon />}
                    onClick={handleSaveEntry} disabled={saving}
                    sx={{ bgcolor: "#D32F2F" }}>{saving ? "Saving..." : "Save Marks"}</Button>
                  <Button size="small" variant="outlined" startIcon={<ViewModuleIcon />}
                    onClick={loadMatrix}
                    sx={{ color: "#D32F2F", borderColor: "#D32F2F" }}>Load Full Table</Button>
                </Box>
              </Paper>
              <Paper sx={{ borderRadius: 2, overflow: "auto" }}>
                <TableContainer sx={{ maxHeight: "calc(100vh - 350px)" }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#D32F2F" }}>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>#</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold", minWidth: 180 }}>Student Name</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Admission</TableCell>
                        <TableCell align="center" sx={{ color: "white", fontWeight: "bold", minWidth: 100 }}>Marks (0-{maxMarks})</TableCell>
                        <TableCell align="center" sx={{ color: "white", fontWeight: "bold", minWidth: 100 }}>Status</TableCell>
                        <TableCell sx={{ color: "white", fontWeight: "bold" }}>Grade</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {students.map((student, idx) => {
                        const sid = student._id;
                        const entry = marksInput[sid] || { marks: "", status: "Present" };
                        const isAbsent = entry.status === "Absent";
                        const name = student.userId?.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "N/A";
                        const marksNum = Number(entry.marks);
                        const gradeInfo = isAbsent ? null : (entry.marks !== "" && !isNaN(marksNum) ? calcGrade((marksNum / maxMarks) * 100) : null);
                        return (
                          <TableRow key={sid} hover sx={{ bgcolor: idx % 2 === 0 ? "white" : "#fafafa" }}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 500 }}>{name}</TableCell>
                            <TableCell>{student.admissionNumber || student.admissionNo || "N/A"}</TableCell>
                            <TableCell align="center">
                              <TextField type="number" size="small" disabled={isAbsent}
                                value={entry.marks} placeholder="—"
                                onChange={(e) => {
                                  let v = e.target.value;
                                  if (v !== "" && (Number(v) < 0 || Number(v) > maxMarks)) return;
                                  setMarksInput((p) => ({ ...p, [sid]: { ...p[sid], marks: v } }));
                                }}
                                inputProps={{ min: 0, max: maxMarks, step: 0.5, style: { textAlign: "center", width: 70 } }}
                                sx={{ "& .MuiInputBase-root": { fontSize: "0.85rem" }, opacity: isAbsent ? 0.4 : 1 }} />
                            </TableCell>
                            <TableCell align="center">
                              <Select size="small" value={entry.status}
                                onChange={(e) => setMarksInput((p) => ({ ...p, [sid]: { ...p[sid], status: e.target.value, marks: e.target.value === "Absent" ? "" : p[sid]?.marks } }))}
                                sx={{ fontSize: "0.8rem", minWidth: 90 }}>
                                <MenuItem value="Present">Present</MenuItem>
                                <MenuItem value="Absent">Absent</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {gradeInfo ? (
                                <Chip label={gradeInfo.grade} size="small"
                                  sx={{ bgcolor: gradeInfo.color, color: "white", fontWeight: "bold", minWidth: 36 }} />
                              ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </>
          )}

          {phase === 2 && (
            loading ? <Typography sx={{ textAlign: "center", py: 4 }}>Loading...</Typography> :
            matrixStudents.length === 0 ? (
              <Paper sx={{ p: 3, bgcolor: "#FFF8E1", borderRadius: 2, border: "1px solid #FFE082" }}>
                <Typography variant="subtitle2" sx={{ color: "#F57F17" }}>
                  Select Class and Subject, then click "Full Assessment Matrix".
                </Typography>
              </Paper>
            ) : (
              <>
                <Paper sx={{ p: 1, mb: 1, borderRadius: 1, bgcolor: "#fafafa", border: "1px solid #e0e0e0" }}>
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ fontWeight: "bold", color: "#666" }}>Max:</Typography>
                    {EXAM_TYPES.map((et) => (
                      <Chip key={et} size="small" label={`${et} (${totalForExam(et)})`}
                        variant="outlined" sx={{ fontWeight: 500, borderColor: "#D32F2F", color: "#D32F2F" }} />
                    ))}
                  </Box>
                </Paper>
                <Box sx={{ display: "flex", gap: 0.5, mb: 1, flexWrap: "wrap" }}>
                  {EXAM_TYPES.map((et) => (
                    <Button key={et} size="small" variant="outlined"
                      onClick={() => handleBulkPublish(et)} disabled={saving}
                      sx={{ color: "#2E7D32", borderColor: "#2E7D32", fontSize: "0.7rem", textTransform: "none" }}>
                      Publish {et}
                    </Button>
                  ))}
                </Box>
                <Paper sx={{ borderRadius: 2, overflow: "auto" }}>
                  <TableContainer sx={{ maxHeight: "calc(100vh - 350px)" }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#D32F2F" }}>
                          <TableCell sx={{ color: "white", fontWeight: "bold", position: "sticky", left: 0, bgcolor: "#D32F2F", zIndex: 2, minWidth: 40 }}>#</TableCell>
                          <TableCell sx={{ color: "white", fontWeight: "bold", position: "sticky", left: 40, bgcolor: "#D32F2F", zIndex: 2, minWidth: 170 }}>Student</TableCell>
                          <TableCell sx={{ color: "white", fontWeight: "bold", position: "sticky", left: 210, bgcolor: "#D32F2F", zIndex: 2, minWidth: 90 }}>Admission</TableCell>
                          {EXAM_TYPES.map((et) => (
                            <TableCell key={et} align="center" sx={{ color: "white", fontWeight: "bold", minWidth: 65, p: "6px 4px", fontSize: "0.75rem" }}>
                              {et}<br /><span style={{ fontSize: "0.6rem", fontWeight: 400 }}>/{totalForExam(et)}</span>
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{ color: "white", fontWeight: "bold", minWidth: 55, p: "6px 4px" }}>Grade</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {matrixStudents.map((student, idx) => {
                          const sid = student._id;
                          const gradeInfo = getOverallGrade(sid);
                          const name = student.userId?.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "N/A";
                          return (
                            <TableRow key={sid} hover sx={{ bgcolor: idx % 2 === 0 ? "white" : "#fafafa" }}>
                              <TableCell sx={{ position: "sticky", left: 0, bgcolor: idx % 2 === 0 ? "white" : "#fafafa", zIndex: 1 }}>{idx + 1}</TableCell>
                              <TableCell sx={{ fontWeight: 500, position: "sticky", left: 40, bgcolor: idx % 2 === 0 ? "white" : "#fafafa", zIndex: 1 }}>{name}</TableCell>
                              <TableCell sx={{ position: "sticky", left: 210, bgcolor: idx % 2 === 0 ? "white" : "#fafafa", zIndex: 1 }}>{student.admissionNumber || "—"}</TableCell>
                              {EXAM_TYPES.map((et) => {
                                const entry = marksMatrix[sid]?.[et];
                                const isEditing = editingCell?.studentId === sid && editingCell?.examType === et;
                                const hasMarks = entry?.marksObtained !== null && entry?.marksObtained !== undefined;
                                const isAbsent = entry?.status === "Absent";
                                const isLocked = entry?.isPublished;
                                const bg = isEditing ? "#FFF8E1" : isLocked ? "#f3e5f5" : isAbsent ? "#e0e0e0" : hasMarks ? "#E8F5E9" : "#fafafa";
                                return (
                                  <TableCell key={et} align="center"
                                    onClick={() => !isEditing && !isLocked && handleCellClick(sid, et)}
                                    sx={{ cursor: isLocked ? "default" : "pointer", bgcolor: bg, p: "4px 2px", minWidth: 65, "&:hover": !isEditing && !isLocked ? { bgcolor: "#FFEBEE" } : {} }}>
                                    {isEditing ? (
                                      <TextField autoFocus size="small" value={editValue} type="number"
                                        onChange={(e) => {
                                          let v = e.target.value;
                                          if (v !== "" && (Number(v) < 0 || Number(v) > totalForExam(et))) return;
                                          setEditValue(v);
                                        }}
                                        onBlur={handleCellSave} onKeyDown={(e) => { if (e.key === "Enter") handleCellSave(); if (e.key === "Escape") setEditingCell(null); }}
                                        inputProps={{ min: 0, max: totalForExam(et), style: { textAlign: "center", padding: "2px 4px", fontSize: "0.75rem" } }}
                                        sx={{ "& .MuiInputBase-root": { fontSize: "0.75rem" }, width: 55 }} />
                                    ) : (
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.3 }}>
                                        {isLocked && <LockIcon sx={{ fontSize: 9, color: "#9c27b0" }} />}
                                        <Typography variant="body2" sx={{
                                          fontWeight: hasMarks ? 600 : 400,
                                          color: isLocked ? "#9c27b0" : isAbsent ? "#bdbdbd" : hasMarks ? "#2E7D32" : "#bdbdbd",
                                          fontSize: "0.78rem",
                                        }}>
                                          {isAbsent ? "A" : hasMarks ? String(entry.marksObtained) : "—"}
                                        </Typography>
                                      </Box>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell align="center">
                                {gradeInfo ? (
                                  <Chip label={gradeInfo.grade} size="small"
                                    sx={{ bgcolor: gradeInfo.color, color: "white", fontWeight: "bold", minWidth: 32, fontSize: "0.7rem" }} />
                                ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
                {matrixStudents.length > 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "right" }}>
                    Total: {matrixStudents.length} students
                  </Typography>
                )}
              </>
            )
          )}

          <Dialog open={configOpen} onClose={() => setConfigOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: "#D32F2F", color: "white", fontWeight: 700 }}>Configure Exam Totals</DialogTitle>
            <DialogContent sx={{ mt: 1 }}>
              {EXAM_TYPES.map((et) => (
                <TextField key={et} label={`${et} - Total Marks`} type="number" fullWidth margin="dense"
                  value={configForm[et] || ""}
                  onChange={(e) => setConfigForm((p) => ({ ...p, [et]: e.target.value }))}
                  inputProps={{ min: 1, max: 500 }} />
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfigOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveConfig} variant="contained" sx={{ bgcolor: "#D32F2F", color: "white" }}>Save Totals</Button>
            </DialogActions>
          </Dialog>

          <Snackbar open={snackbar.open} autoHideDuration={3000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </Container>
      </Box>
    </TeacherLayout>
  );
};

export default TeacherMarks;

