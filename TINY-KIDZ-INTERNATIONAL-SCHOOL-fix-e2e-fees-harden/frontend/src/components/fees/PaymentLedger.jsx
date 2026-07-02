import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const statusColorMap = {
  unpaid: { bg: "#FFF3E0", color: "#E65100", label: "Unpaid" },
  partial: { bg: "#FFF8E1", color: "#F57F17", label: "Partial" },
  paid: { bg: "#E8F5E9", color: "#2E7D32", label: "Paid" },
};

const PaymentLedger = ({ isOpen, feeSummary, payments, onClose, onEdit, onDelete, onAddMore, loading }) => {
  const summary = feeSummary || {};
  const statusInfo = statusColorMap[summary.payment_status] || statusColorMap.unpaid;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Payment Ledger</DialogTitle>
      <DialogContent>
        {summary.fee_id && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: "#F5F5F5", border: "1px solid #E0E0E0" }}>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Fee Amount</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(summary.fee_amount)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Paid</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#2E7D32" }}>{formatCurrency(summary.total_paid)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Balance</Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: Number(summary.balance) > 0 ? "#D32F2F" : "#2E7D32" }}
                >
                  {formatCurrency(summary.balance)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <Chip
                  label={statusInfo.label}
                  size="small"
                  sx={{ bgcolor: statusInfo.bg, color: statusInfo.color, fontWeight: "bold", mt: 0.5 }}
                />
              </Box>
              {summary.last_payment_date && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Last Payment</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {String(summary.last_payment_date).slice(0, 10)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !payments || payments.length === 0 ? (
          <Typography sx={{ py: 3 }} color="text.secondary" align="center">
            No payments recorded yet.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Receipt No</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Recorded By</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "-"}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>
                    <Chip size="small" label={payment.method || "-"} color="error" variant="outlined" />
                  </TableCell>
                  <TableCell>{payment.receiptNumber || "-"}</TableCell>
                  <TableCell>{payment.recordedBy?.name || "-"}</TableCell>
                  <TableCell>{payment.note || "-"}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                      <Tooltip title="Edit payment">
                        <IconButton size="small" color="primary" onClick={() => onEdit(payment)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete payment">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm("Delete this payment? This will reverse the paid amount.")) {
                              onDelete(payment._id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        {Number(summary.balance) > 0 && (
          <Button
            variant="contained"
            onClick={onAddMore}
            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none" }}
          >
            Add Payment
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentLedger;
