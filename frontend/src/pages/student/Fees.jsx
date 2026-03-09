import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  LinearProgress,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import API from "../../services/authService";
import StudentLayout from "../../components/StudentLayout";

const formatCurrency = (amount = 0) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const getStatusColor = (status) => {
  if (status === "Paid") return "success";
  if (status === "Partial") return "warning";
  return "error";
};

const StudentFees = () => {
  const [feeRecord, setFeeRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchOwnFee = async () => {
    setLoading(true);
    try {
      const meRes = await API.get("/students/me");
      const studentId = meRes.data?.data?._id;

      if (!studentId) {
        showSnackbar("Student profile not found", "error");
        setLoading(false);
        return;
      }

      const feeRes = await API.get(`/fees/student/${studentId}`);
      const list = Array.isArray(feeRes.data) ? feeRes.data : [];
      const latest = list[0] || null;
      setFeeRecord(latest);

      if (!latest) {
        showSnackbar("No fee record found", "info");
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to load fee details",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnFee();
  }, []);

  const summary = useMemo(() => {
    const total = Number(feeRecord?.totalFee || 0);
    const paid = Number(feeRecord?.paidAmount || 0);
    const due = Math.max(total - paid, 0);
    const percentage = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
    return { total, paid, due, percentage };
  }, [feeRecord]);

  const payments = useMemo(() => {
    const list = feeRecord?.payments || [];
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [feeRecord]);

  return (
    <StudentLayout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
        >
          My Fees
        </Typography>

        <Card sx={{ mb: 3, borderLeft: "6px solid #D32F2F" }}>
          <CardContent>
            {loading ? (
              <Typography>Loading fee details...</Typography>
            ) : !feeRecord ? (
              <Typography color="text.secondary">
                No fee record available yet
              </Typography>
            ) : (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 3,
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total Fee: {formatCurrency(summary.total)}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#2e7d32", fontWeight: 700 }}
                  >
                    Paid: {formatCurrency(summary.paid)}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#D32F2F", fontWeight: 700 }}
                  >
                    Due: {formatCurrency(summary.due)}
                  </Typography>
                  <Chip
                    label={feeRecord.status}
                    color={getStatusColor(feeRecord.status)}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={summary.percentage}
                  sx={{
                    height: 12,
                    borderRadius: 8,
                    bgcolor: "#fdecea",
                    "& .MuiLinearProgress-bar": { bgcolor: "#D32F2F" },
                  }}
                />
                <Typography
                  sx={{ mt: 1, fontSize: 13, color: "text.secondary" }}
                >
                  Payment Completion: {summary.percentage.toFixed(1)}%
                </Typography>
              </>
            )}
          </CardContent>
        </Card>

        <Paper sx={{ p: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: "#D32F2F", fontWeight: 700 }}
          >
            Payment History
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount (₹)</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Note</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No payments recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment, index) => (
                    <TableRow key={`${payment.date}-${index}`}>
                      <TableCell>
                        {dayjs(payment.date).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={payment.method}
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{payment.note || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </StudentLayout>
  );
};

export default StudentFees;
