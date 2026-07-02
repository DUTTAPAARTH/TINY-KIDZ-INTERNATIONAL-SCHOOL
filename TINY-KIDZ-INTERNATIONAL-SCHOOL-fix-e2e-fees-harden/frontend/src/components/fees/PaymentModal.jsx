import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const PAYMENT_METHODS = ["Cash", "UPI", "Cheque", "DD", "Bank Transfer"];
const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const todayStr = () => new Date().toISOString().slice(0, 10);

const getLateDetails = ({ dueDate, paymentDate, lateFeePerDay = 0 }) => {
  if (!dueDate || !paymentDate) return { lateDays: 0, lateFeeAmount: 0 };
  const due = new Date(dueDate);
  const paid = new Date(paymentDate);
  due.setHours(0, 0, 0, 0);
  paid.setHours(0, 0, 0, 0);
  const diffMs = paid.getTime() - due.getTime();
  if (diffMs <= 0) return { lateDays: 0, lateFeeAmount: 0 };
  const lateDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const lateFeeAmount = lateDays * Number(lateFeePerDay || 0);
  return { lateDays, lateFeeAmount };
};

const PaymentModal = ({ isOpen, fee, onClose, onPaymentAdded, loading }) => {
  const [form, setForm] = useState({
    amount: "",
    method: "Cash",
    chequeNumber: "",
    bankName: "",
    transactionId: "",
    paymentDate: todayStr(),
    note: "",
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        amount: "",
        method: "Cash",
        chequeNumber: "",
        bankName: "",
        transactionId: "",
        paymentDate: todayStr(),
        note: "",
      });
    }
  }, [isOpen]);

  const netAmount = Math.max(0, Number(fee?.netAmount || fee?.totalAmount || 0));
  const dueAmount = Math.max(0, netAmount - Number(fee?.paidAmount || 0));

  const latePreview = getLateDetails({
    dueDate: fee?.dueDate,
    paymentDate: form.paymentDate,
    lateFeePerDay: fee?.lateFeePerDay || 50,
  });

  const totalPayable = dueAmount + latePreview.lateFeeAmount;

  const remainingAfter = useMemo(() => {
    const amt = Number(form.amount || 0);
    return Math.max(0, totalPayable - amt);
  }, [form.amount, totalPayable]);

  const isInvalid =
    !form.amount ||
    Number(form.amount) < 1 ||
    Number(form.amount) > totalPayable;

  const handleSubmit = () => {
    if (isInvalid) return;
    onPaymentAdded({
      amount: Number(form.amount),
      method: form.method,
      paymentDate: form.paymentDate,
      note: form.note,
      chequeNumber: form.chequeNumber || undefined,
      bankName: form.bankName || undefined,
      transactionId: form.transactionId || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Collect Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <Paper sx={{ p: 2, bgcolor: "#F5F5F5", border: "1px solid #E0E0E0" }}>
            <Typography variant="body2"><strong>Student:</strong> {fee?.studentName || fee?.studentId?.userId?.name || "-"}</Typography>
            <Typography variant="body2"><strong>Fee:</strong> {fee?.feeType}{fee?.quarter ? ` (${fee.quarter})` : ""}</Typography>
            <Typography variant="body2"><strong>Total:</strong> {formatCurrency(netAmount)}{fee?.discountType && fee?.discountType !== "none" ? ` (after discount)` : ""}</Typography>
            <Typography variant="body2"><strong>Paid:</strong> {formatCurrency(fee?.paidAmount)}</Typography>
            <Typography variant="body2"><strong>Due:</strong> {formatCurrency(dueAmount)}</Typography>

            {latePreview.lateDays > 0 && (
              <Box sx={{ mt: 1.5, p: 1.25, bgcolor: "#FFF3E0", border: "1px solid #FFCC80", borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: "#E65100", display: "flex", alignItems: "center", gap: 0.75 }}>
                  <WarningAmberRoundedIcon fontSize="small" /> Payment is {latePreview.lateDays} days late
                </Typography>
                <Typography variant="body2" sx={{ color: "#E65100" }}>
                  Late Fee: {formatCurrency(latePreview.lateFeeAmount)} ({latePreview.lateDays} days x {formatCurrency(fee?.lateFeePerDay || 50)})
                </Typography>
                <Typography variant="body2" sx={{ color: "#E65100", fontWeight: 700 }}>
                  Total Payable: {formatCurrency(totalPayable)}
                </Typography>
              </Box>
            )}
          </Paper>

          <TextField
            label="Amount ₹"
            type="number"
            required
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            inputProps={{ min: 1, max: totalPayable }}
            helperText={
              form.amount
                ? `Balance after payment: ${formatCurrency(remainingAfter)}`
                : `Total payable: ${formatCurrency(totalPayable)}`
            }
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Payment Method</InputLabel>
            <Select
              label="Payment Method"
              value={form.method}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  method: e.target.value,
                  chequeNumber: "",
                  bankName: "",
                  transactionId: "",
                }))
              }
            >
              {PAYMENT_METHODS.map((method) => (
                <MenuItem key={method} value={method}>{method}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(form.method === "Cheque" || form.method === "DD") && (
            <>
              <TextField
                label="Cheque Number"
                required
                value={form.chequeNumber}
                onChange={(e) => setForm((p) => ({ ...p, chequeNumber: e.target.value }))}
                fullWidth
              />
              <TextField
                label="Bank Name"
                required
                value={form.bankName}
                onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                fullWidth
              />
            </>
          )}

          {(form.method === "UPI" || form.method === "Bank Transfer") && (
            <TextField
              label="Transaction ID"
              value={form.transactionId}
              onChange={(e) => setForm((p) => ({ ...p, transactionId: e.target.value }))}
              fullWidth
            />
          )}

          <TextField
            label="Payment Date"
            type="date"
            value={form.paymentDate}
            onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <TextField
            label="Note"
            placeholder="e.g. 1st installment, partial payment"
            value={form.note}
            onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={isInvalid || loading}
          onClick={handleSubmit}
          sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Record Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
