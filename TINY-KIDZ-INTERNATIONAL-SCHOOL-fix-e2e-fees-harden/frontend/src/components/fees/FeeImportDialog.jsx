import { useRef, useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Typography, Alert, CircularProgress,
} from "@mui/material";
import API from "../../services/authService";

const FeeImportDialog = ({ isOpen, onClose }) => {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file");
      return;
    }
    setError("");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await API.post("/fees/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to import fee records");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError("");
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 200);
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "#D32F2F" }}>Import Fee Records from CSV</DialogTitle>
      <DialogContent>
        {result ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity={result.created > 0 ? "success" : "warning"}>{result.message}</Alert>
            <Typography sx={{ mt: 1 }}>Created: {result.created}</Typography>
            <Typography>Skipped: {result.skipped}</Typography>
            {result.errors?.length > 0 && (
              <Box sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
                <Typography variant="body2" color="error">Errors ({result.errors.length}):</Typography>
                {result.errors.slice(0, 10).map((e, i) => (
                  <Typography key={i} variant="caption" display="block">{e.error}</Typography>
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a CSV file with columns: <strong>studentId, feeType, totalAmount, dueDate</strong>.
              Optional columns: quarter, description, academicYear, lateFeePerDay.
            </Typography>
            <Box sx={{ p: 2, bgcolor: "#FFF5F5", borderRadius: 1, border: "1px solid #F2C7C7", mb: 2 }}>
              <Typography variant="caption" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                studentId,feeType,totalAmount,dueDate,quarter,academicYear{`\n`}
                64a1b2c3...,Tuition,5000,2025-04-10,Q1,2025-26{`\n`}
                64a1b2c4...,Admission,2000,2025-04-10,,2025-26
              </Typography>
            </Box>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ width: "100%" }}
            />
            {file && <Typography variant="body2" sx={{ mt: 1 }}>Selected: {file.name}</Typography>}
          </Box>
        )}
      </DialogContent>
      {!result && (
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleUpload} disabled={loading || !file}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "Import"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default FeeImportDialog;
