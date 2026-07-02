import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, TextField, Typography,
  Checkbox, ListItemText, Divider, Alert, CircularProgress,
} from "@mui/material";
import API from "../../services/authService";

const FEE_TYPES = ["Tuition", "Admission", "Uniform", "Activity", "Transport", "Miscellaneous", "Fine"];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4", "Annual"];
const PAYMENT_METHODS = ["Cash", "UPI", "Cheque", "DD", "Bank Transfer"];

const BulkPaymentModal = ({ isOpen, onClose, onComplete, classes }) => {
  const [form, setForm] = useState({
    classId: "", academicYear: "2025-26", feeType: "Tuition",
    quarter: "Q1", amount: "", method: "Cash", paymentDate: new Date().toISOString().slice(0, 10),
    note: "", selectedStudents: [],
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const fetchStudents = async (classId) => {
    try {
      setLoading(true);
      const res = await API.get("/students", { params: { classId, limit: 200 } });
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setStudents(list);
      setForm((prev) => ({ ...prev, classId, selectedStudents: list.map((s) => s._id) }));
    } catch {
      setError("Failed to fetch students");
    } finally {
      setLoading(false);
    }
  };

  const toggleAll = (checked) => {
    setForm((prev) => ({ ...prev, selectedStudents: checked ? students.map((s) => s._id) : [] }));
  };

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(id)
        ? prev.selectedStudents.filter((sid) => sid !== id)
        : [...prev.selectedStudents, id],
    }));
  };

  const handleSubmit = async () => {
    if (!form.classId || !form.amount || Number(form.amount) < 1) {
      setError("Class and valid amount are required");
      return;
    }
    if (!form.selectedStudents.length) {
      setError("Select at least one student");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await API.post("/fees/payment/bulk", {
        classId: form.classId,
        academicYear: form.academicYear,
        feeType: form.feeType,
        quarter: form.quarter,
        amount: Number(form.amount),
        method: form.method,
        paymentDate: form.paymentDate,
        note: form.note,
        studentIds: form.selectedStudents,
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to process bulk payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setForm({ classId: "", academicYear: "2025-26", feeType: "Tuition", quarter: "Q1", amount: "", method: "Cash", paymentDate: new Date().toISOString().slice(0, 10), note: "", selectedStudents: [] });
      setResult(null);
      setError("");
      setStudents([]);
    }, 200);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "#D32F2F" }}>Bulk Payment Entry</DialogTitle>
      <DialogContent>
        {result ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity={result.count > 0 ? "success" : "warning"} sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            <Typography variant="h6">Total Collected: ₹{Number(result.totalAmount || 0).toLocaleString("en-IN")}</Typography>
            <Typography>Payments Created: {result.count}</Typography>
            {result.errors?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="error">{result.errors.length} error(s):</Typography>
                {result.errors.slice(0, 5).map((e, i) => (
                  <Typography key={i} variant="caption" display="block">{e.reason || e.error}</Typography>
                ))}
              </Box>
            )}
            <Box sx={{ mt: 2, maxHeight: 200, overflow: "auto" }}>
              {result.payments?.map((p) => (
                <Typography key={p._id} variant="caption" display="block">
                  Receipt: {p.receiptNumber} | ₹{Number(p.amount).toLocaleString("en-IN")}
                </Typography>
              ))}
            </Box>
            <Button variant="contained" onClick={() => { if (onComplete) onComplete(); handleClose(); }} sx={{ mt: 2, bgcolor: "#D32F2F" }}>Done</Button>
          </Box>
        ) : (
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select value={form.classId} label="Class" onChange={(e) => fetchStudents(e.target.value)}>
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>{cls.className}-{cls.section}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Academic Year</InputLabel>
              <Select value={form.academicYear} label="Academic Year" onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))}>
                {Array.from({ length: 11 }, (_, i) => `${2024 + i}-${String(2025 + i).slice(2)}`).map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Fee Type</InputLabel>
              <Select value={form.feeType} label="Fee Type" onChange={(e) => setForm((p) => ({ ...p, feeType: e.target.value }))}>
                {FEE_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Quarter</InputLabel>
              <Select value={form.quarter} label="Quarter" onChange={(e) => setForm((p) => ({ ...p, quarter: e.target.value }))}>
                {QUARTERS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Amount per record ₹" type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} helperText="Enter the amount each selected student will pay" fullWidth />

            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select value={form.method} label="Payment Method" onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}>
                {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Payment Date" type="date" value={form.paymentDate} onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />

            <TextField label="Note (Optional)" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} fullWidth />

            <Divider>Students</Divider>

            {loading ? (
              <Typography>Loading students...</Typography>
            ) : students.length > 0 ? (
              <Box sx={{ maxHeight: 200, overflow: "auto", border: "1px solid #ddd", borderRadius: 1, p: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <Checkbox
                    checked={form.selectedStudents.length === students.length}
                    indeterminate={form.selectedStudents.length > 0 && form.selectedStudents.length < students.length}
                    onChange={() => toggleAll(form.selectedStudents.length !== students.length)}
                  />
                  <Typography variant="body2" fontWeight={700}>Select All ({students.length} students)</Typography>
                </Box>
                {students.map((s) => (
                  <Box key={s._id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Checkbox
                      size="small"
                      checked={form.selectedStudents.includes(s._id)}
                      onChange={() => toggleStudent(s._id)}
                    />
                    <Typography variant="body2">{s.userId?.name || s.name || "Student"} ({s.admissionNumber || "-"})</Typography>
                  </Box>
                ))}
              </Box>
            ) : form.classId ? (
              <Typography color="text.secondary">Select a class to load students</Typography>
            ) : null}
          </Box>
        )}
      </DialogContent>
      {!result && (
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || !form.classId || !form.amount || !form.selectedStudents.length}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : "Record Payments"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default BulkPaymentModal;
