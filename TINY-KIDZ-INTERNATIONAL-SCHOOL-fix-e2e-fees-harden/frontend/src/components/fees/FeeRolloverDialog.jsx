import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, Typography, Alert, CircularProgress,
} from "@mui/material";
import API from "../../services/authService";

const ACADEMIC_YEARS = Array.from({ length: 11 }, (_, i) => {
  const start = 2024 + i;
  return `${start}-${String(start + 1).slice(2)}`;
});

const FeeRolloverDialog = ({ isOpen, onClose, onComplete }) => {
  const [fromYear, setFromYear] = useState("2024-25");
  const [toYear, setToYear] = useState("2025-26");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleRollover = async () => {
    if (fromYear === toYear) {
      setError("Source and target year must be different");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/fees/structure/rollover", { fromYear, toYear });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to rollover structures");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => { setResult(null); setError(""); }, 200);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "#D32F2F" }}>Rollover Fee Structures</DialogTitle>
      <DialogContent>
        {result ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity={result.created > 0 ? "success" : "info"} sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            <Typography>Created: {result.created}</Typography>
            <Typography>Skipped (already exist): {result.skipped}</Typography>
            {result.errors?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="error">Errors:</Typography>
                {result.errors.map((e, i) => (
                  <Typography key={i} variant="caption" display="block">{e.class}: {e.error}</Typography>
                ))}
              </Box>
            )}
            {onComplete && (
              <Button variant="contained" onClick={() => { onComplete(); handleClose(); }} sx={{ mt: 2, bgcolor: "#D32F2F" }}>
                Done
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography variant="body2" color="text.secondary">
              Copy all fee structures from one academic year to another. Existing structures in the target year will be skipped.
            </Typography>
            <FormControl fullWidth>
              <InputLabel>From Year</InputLabel>
              <Select value={fromYear} label="From Year" onChange={(e) => setFromYear(e.target.value)}>
                {ACADEMIC_YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>To Year</InputLabel>
              <Select value={toYear} label="To Year" onChange={(e) => setToYear(e.target.value)}>
                {ACADEMIC_YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      {!result && (
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleRollover} disabled={loading}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "Rollover"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FeeRolloverDialog;
