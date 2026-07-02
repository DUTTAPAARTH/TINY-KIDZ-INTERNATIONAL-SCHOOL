import { useState } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, TextField, Typography, Alert,
} from "@mui/material";
import API from "../../services/authService";

const FeeDiscountDialog = ({ isOpen, onClose, feeRecord, onApplied }) => {
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasDiscount = feeRecord?.discountType && feeRecord?.discountType !== "none";

  const handleApply = async () => {
    if (!discountValue || Number(discountValue) <= 0) {
      setError("Discount value must be greater than 0");
      return;
    }
    if (discountType === "percentage" && Number(discountValue) > 100) {
      setError("Percentage cannot exceed 100%");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.put(`/fees/${feeRecord._id}/discount`, { discountType, discountValue: Number(discountValue), discountReason });
      onApplied();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to apply discount");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await API.delete(`/fees/${feeRecord._id}/discount`);
      onApplied();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to remove discount");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = Number(feeRecord?.totalAmount || 0);
  const discountAmt = discountType === "percentage"
    ? Math.round(totalAmount * Number(discountValue || 0) / 100)
    : discountType === "fixed"
      ? Math.min(Number(discountValue || 0), totalAmount)
      : 0;
  const netAmount = Math.max(0, totalAmount - discountAmt);

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "#D32F2F" }}>
        {hasDiscount ? "Edit / Remove Discount" : "Apply Discount"}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" sx={{ mb: 2 }}>
          Fee Amount: <strong>₹{totalAmount.toLocaleString("en-IN")}</strong>
          {hasDiscount && <> | Current: {feeRecord.discountType === "percentage" ? `${feeRecord.discountValue}%` : `₹${feeRecord.discountValue}`} {feeRecord.discountReason && `(${feeRecord.discountReason})`}</>}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Discount Type</InputLabel>
            <Select value={discountType} label="Discount Type" onChange={(e) => setDiscountType(e.target.value)}>
              <MenuItem value="percentage">Percentage (%)</MenuItem>
              <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label={discountType === "percentage" ? "Discount %" : "Discount Amount ₹"}
            type="number" value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            inputProps={{ min: 1, max: discountType === "percentage" ? 100 : totalAmount }}
            fullWidth
          />

          <TextField label="Reason (Optional)" value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}
            placeholder="e.g. Sibling discount, Merit scholarship" fullWidth />

          {Number(discountValue) > 0 && (
            <Box sx={{ p: 2, bgcolor: "#FFF5F5", borderRadius: 1, border: "1px solid #F2C7C7" }}>
              <Typography variant="body2">Original: ₹{totalAmount.toLocaleString("en-IN")}</Typography>
              <Typography variant="body2" sx={{ color: "#D32F2F" }}>Discount: -₹{discountAmt.toLocaleString("en-IN")}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Net Amount: ₹{netAmount.toLocaleString("en-IN")}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {hasDiscount && (
          <Button color="error" onClick={handleRemove} disabled={loading}>Remove Discount</Button>
        )}
        <Button variant="contained" onClick={handleApply} disabled={loading || !discountValue}
          sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
          {loading ? "Saving..." : hasDiscount ? "Update Discount" : "Apply Discount"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeeDiscountDialog;
