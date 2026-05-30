import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, Snackbar, Alert, Typography, Grid, Paper, InputLabel, FormControl, CircularProgress, IconButton
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";

const SUBJECTS = [
  "English", "Hindi", "Math", "Science", "Social Studies", "Computer", "Punjabi", "Art", "PE"
];
const STATUS_OPTIONS = ["All", "Upcoming", "Due Today", "Overdue"];

import TeacherLayout from "../../components/TeacherLayout";
import { useSelector } from "react-redux";

function getStatusColor(daysLeft) {
  if (daysLeft < 0) return "#C62828"; // Overdue
  if (daysLeft === 0) return "#1976D2"; // Due today
  if (daysLeft <= 2) return "#FFA000"; // Due soon
  return "#388E3C"; // Upcoming
}

function getDueLabel(daysLeft) {
  if (daysLeft < 0) return `${-daysLeft} days overdue`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "Due tomorrow";
  if (daysLeft <= 2) return `${daysLeft} days left`;
  return `${daysLeft} days left`;
}

const TeacherHomework = () => {
  const { token } = useSelector((state) => state.auth);
  
  const api = axios.create({ 
    baseURL: "http://localhost:5000/api",
    headers: { Authorization: `Bearer ${token}` }
  });

  // --- State ---
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    classId: "",
    subject: "",
    title: "",
    description: "",
    dueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    attachmentLink: ""
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState({ total: 0, dueToday: 0, overdue: 0, upcoming: 0 });

  // --- Fetch Classes ---
  useEffect(() => {
    api.get("/teachers/me").then(res => {
      const clsList = res.data?.data?.assignedClasses || res.data?.data?.classIds || [];
      const formattedClasses = clsList.map(c => ({ _id: c._id || c.id, name: `${c.className || ''} ${c.section || ''}`.trim() || c.name }));
      setClasses(formattedClasses);
      if (formattedClasses.length > 0) {
        setSelectedClass(formattedClasses[0]._id || formattedClasses[0].id);
      }
    });
  }, []);


  // --- Fetch Homework ---
  useEffect(() => {
    setLoading(true);
    let url = `/homework?assignedBy=me`;
    if (selectedClass) url += `&classId=${selectedClass}`;
    api.get(url).then(res => {
      const hwData = res.data?.data || res.data || [];
      setHomework(Array.isArray(hwData) ? hwData : []);
      setLoading(false);
    });
  }, [selectedClass]);

  // --- Stats Calculation ---
  useEffect(() => {
    let total = homework.length;
    let dueToday = 0, overdue = 0, upcoming = 0;
    const today = dayjs().startOf('day');
    homework.forEach(hw => {
      const due = dayjs(hw.dueDate).startOf('day');
      const diff = due.diff(today, 'day');
      if (diff < 0) overdue++;
      else if (diff === 0) dueToday++;
      else upcoming++;
    });
    setStats({ total, dueToday, overdue, upcoming });
  }, [homework]);

  // --- Filtered Homework ---
  const filteredHomework = homework.filter(hw => {
    const due = dayjs(hw.dueDate).startOf('day');
    const today = dayjs().startOf('day');
    const daysLeft = due.diff(today, 'day');
    let statusMatch =
      statusFilter === "All" ||
      (statusFilter === "Upcoming" && daysLeft > 0) ||
      (statusFilter === "Due Today" && daysLeft === 0) ||
      (statusFilter === "Overdue" && daysLeft < 0);
    let searchMatch = hw.title.toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  // --- Handlers ---
  const openDialog = (hw = null) => {
    if (hw) {
      setEditId(hw._id);
      setForm({
        classId: hw.classId,
        subject: hw.subject,
        title: hw.title,
        description: hw.description,
        dueDate: dayjs(hw.dueDate).format('YYYY-MM-DD'),
        attachmentLink: hw.attachmentLink || ""
      });
    } else {
      setEditId(null);
      setForm({
        classId: "",
        subject: "",
        title: "",
        description: "",
        dueDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        attachmentLink: ""
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    // Validation
    if (!form.classId || !form.subject || !form.title || !form.dueDate) {
      setSnackbar({ open: true, message: "Please fill all required fields", severity: "error" });
      return;
    }
    if (form.title.length > 100) {
      setSnackbar({ open: true, message: "Title max 100 chars", severity: "error" });
      return;
    }
    if (dayjs(form.dueDate).isBefore(dayjs().startOf('day'))) {
      setSnackbar({ open: true, message: "Due date must be today or future", severity: "error" });
      return;
    }
    try {
      if (editId) {
        await api.put(`/homework/${editId}`, form);
        setSnackbar({ open: true, message: "Homework updated", severity: "success" });
      } else {
        await api.post("/homework", form);
        setSnackbar({ open: true, message: "Homework assigned", severity: "success" });
      }
      setDialogOpen(false);
      // Refresh
      let url = `/homework?assignedBy=me`;
      if (selectedClass) url += `&classId=${selectedClass}`;
      const res = await api.get(url);
      const hwData = res.data?.data || res.data || [];
      setHomework(Array.isArray(hwData) ? hwData : []);
    } catch (e) {
      setSnackbar({ open: true, message: "Error saving homework", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this homework?")) return;
    try {
      await api.delete(`/homework/${id}`);
      setSnackbar({ open: true, message: "Homework deleted", severity: "success" });
      setHomework(homework.filter(hw => hw._id !== id));
    } catch (e) {
      setSnackbar({ open: true, message: "Error deleting homework", severity: "error" });
    }
  };

  // --- Render ---
  return (
    <TeacherLayout>
      <Box sx={{ background: '#F5F5F5', minHeight: '100vh', p: 3 }}>
        {/* SECTION 1 — Page Header */}
      <Box mb={2}>
        <Typography variant="h4" sx={{ color: '#D32F2F', fontWeight: 800 }}>Homework Management</Typography>
        <Box display="flex" gap={4} mt={1}>
          <div>Total Assigned: {stats.total}</div>
          <div style={{ color: '#FFA000' }}>Due Today: {stats.dueToday}</div>
          <div style={{ color: '#C62828' }}>Overdue: {stats.overdue}</div>
          <div style={{ color: '#388E3C' }}>Upcoming: {stats.upcoming}</div>
        </Box>
      </Box>
      {/* SECTION 2 — Controls Bar */}
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Your Classes:</Typography>
        {classes.length === 0 ? (
          <Typography color="text.secondary">No classes assigned.</Typography>
        ) : (
          classes.map(cls => (
            <Button
              key={cls._id}
              variant={selectedClass === cls._id ? "contained" : "outlined"}
              onClick={() => setSelectedClass(cls._id)}
              sx={{
                borderRadius: 8,
                textTransform: 'none',
                bgcolor: selectedClass === cls._id ? "#D32F2F" : "transparent",
                color: selectedClass === cls._id ? "white" : "#D32F2F",
                borderColor: "#D32F2F"
              }}
            >
              {cls.name}
            </Button>
          ))
        )}
        <Box flex={1} />
        <FormControl sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
            {STATUS_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} sx={{ minWidth: 200 }} />
        <Box flex={1} />
        <Button variant="contained" sx={{ bgcolor: '#D32F2F', color: 'white' }} onClick={() => openDialog()}>+ Assign Homework</Button>
      </Box>
      {/* SECTION 3 — Homework Cards Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
      ) : filteredHomework.length === 0 ? (
        <Box textAlign="center" color="#888" mt={8}>
          <Typography variant="h6" gutterBottom>📝 No homework assigned yet</Typography>
          <div>Click "Assign Homework" to get started</div>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredHomework.map(hw => {
            const due = dayjs(hw.dueDate).startOf('day');
            const today = dayjs().startOf('day');
            const daysLeft = due.diff(today, 'day');
            const borderColor = getStatusColor(daysLeft);
            const dueLabel = getDueLabel(daysLeft);
            let dueLabelColor = borderColor;
            if (daysLeft < 0) dueLabelColor = '#C62828';
            else if (daysLeft === 0) dueLabelColor = '#1976D2';
            else if (daysLeft <= 2) dueLabelColor = '#FFA000';
            else dueLabelColor = '#388E3C';
            return (
              <Grid item xs={12} sm={6} md={4} key={hw._id}>
                <Paper elevation={3} sx={{ borderLeft: `8px solid ${borderColor}`, p: 2, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      📝 {hw.title}
                    </Typography>
                    <Box>
                      <IconButton size="small" onClick={() => openDialog(hw)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(hw._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.5}>{hw.className} | {hw.subject}</Typography>
                  <Box my={1} borderTop="1px solid #eee" />
                  <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-line' }}>{hw.description}</Typography>
                  <Box my={1} borderTop="1px solid #eee" />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <span style={{ color: '#888' }}>Assigned: {dayjs(hw.assignedDate).format('DD MMM YYYY')}</span>
                    <span style={{ color: dueLabelColor, fontWeight: daysLeft <= 0 ? 700 : 500 }}>{`Due: ${dayjs(hw.dueDate).format('DD MMM YYYY')}  •  ${dueLabel}`}</span>
                  </Box>
                  {hw.attachmentLink && <a href={hw.attachmentLink} target="_blank" rel="noopener noreferrer" style={{ color: '#1976D2', fontSize: 13, marginTop: 4 }}>Attachment</a>}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
      {/* SECTION 4 — Assign/Edit Homework Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#D32F2F', color: 'white', fontWeight: 700 }}>{editId ? 'Edit Homework' : 'Assign New Homework'}</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Class *</InputLabel>
            <Select name="classId" value={form.classId} label="Class *" onChange={handleFormChange}>
              {classes.map(cls => <MenuItem key={cls._id} value={cls._id}>{cls.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Subject *</InputLabel>
            <Select name="subject" value={form.subject} label="Subject *" onChange={handleFormChange}>
              {SUBJECTS.map(sub => <MenuItem key={sub} value={sub}>{sub}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField name="title" label="Title *" value={form.title} onChange={handleFormChange} fullWidth margin="normal" inputProps={{ maxLength: 100 }} required />
          <TextField name="description" label="Description" value={form.description} onChange={handleFormChange} fullWidth margin="normal" multiline rows={4} />
          <TextField name="dueDate" label="Due Date *" type="date" value={form.dueDate} onChange={handleFormChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} />
          <TextField name="attachmentLink" label="Attachment URL" value={form.attachmentLink} onChange={handleFormChange} fullWidth margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#D32F2F', color: 'white' }}>{editId ? 'Update' : 'Assign'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
      </Box>
    </TeacherLayout>
  );
};

export default TeacherHomework;
