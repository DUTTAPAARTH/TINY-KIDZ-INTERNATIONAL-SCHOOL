import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import StudentLayout from "../../components/StudentLayout";
import DemandSlip from "../../components/fees/DemandSlip";
import PaymentReceipt from "../../components/fees/PaymentReceipt";
import PrintDialog from "../../components/fees/PrintDialog";
import API from "../../services/authService";

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const StudentFees = () => {
  const [student, setStudent] = useState(null);
  const [feeRecords, setFeeRecords] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [demandSlipData, setDemandSlipData] = useState(null);
  const [demandSlipOpen, setDemandSlipOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentFees = async () => {
    try {
      setLoading(true);
      const studentRes = await API.get("/students/me");
      const studentData = studentRes.data?.data;
      setStudent(studentData || null);

      if (!studentData?._id) {
        setFeeRecords([]);
        setReceipts([]);
        setDemandSlipData(null);
        return;
      }

      const [feeRes, receiptRes, demandRes] = await Promise.all([
        API.get(`/fees/student/${studentData._id}`),
        API.get(`/fees/receipt/student/${studentData._id}`),
        API.get(`/fees/demand-slip/${studentData._id}`).catch(() => ({ data: null })),
      ]);

      setFeeRecords(Array.isArray(feeRes.data) ? feeRes.data : []);
      setReceipts(Array.isArray(receiptRes.data) ? receiptRes.data : []);
      setDemandSlipData(demandRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentFees();
  }, []);

  const dueRecords = useMemo(
    () => feeRecords.filter((record) => Number(record.dueAmount || 0) > 0),
    [feeRecords],
  );

  const totals = useMemo(
    () => ({
      total: feeRecords.reduce((sum, record) => sum + Number(record.totalAmount || 0), 0),
      paid: feeRecords.reduce((sum, record) => sum + Number(record.paidAmount || 0), 0),
      due: feeRecords.reduce((sum, record) => sum + Number(record.dueAmount || 0), 0),
    }),
    [feeRecords],
  );

  const handleOpenReceipt = async (paymentId) => {
    const res = await API.get(`/fees/receipt/${paymentId}`);
    setReceiptData(res.data);
    setReceiptOpen(true);
  };

  return (
    <StudentLayout>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#D32F2F", mb: 1 }}>
          My Fees
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          View pending dues, payment history, and printable receipts.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderTop: "4px solid #D32F2F" }}>
              <CardContent>
                <Typography color="text.secondary">Total Fees</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{formatCurrency(totals.total)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderTop: "4px solid #2E7D32" }}>
              <CardContent>
                <Typography color="text.secondary">Paid</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#2E7D32" }}>{formatCurrency(totals.paid)}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderTop: "4px solid #D32F2F" }}>
              <CardContent>
                <Typography color="text.secondary">Due</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F" }}>{formatCurrency(totals.due)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mb: 3, border: "1px solid #F2C7C7", bgcolor: "#FFF8F8" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Demand Slip</Typography>
              <Typography color="text.secondary">
                {student?.userId?.name ? `${student.userId.name} (${student.admissionNumber || "-"})` : "Student account"}
              </Typography>
              <Typography color="text.secondary">
                {dueRecords.length > 0
                  ? `${dueRecords.length} pending fee record(s) available for print`
                  : "No pending dues right now"}
              </Typography>
            </Box>
            {demandSlipData?.items?.length > 0 && (
              <Button variant="contained" onClick={() => setDemandSlipOpen(true)} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
                Download Demand Slip
              </Button>
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Pending Fee Records</Typography>
          {loading ? (
            <Typography>Loading fee records...</Typography>
          ) : dueRecords.length === 0 ? (
            <Typography color="text.secondary">No pending fees.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Fee Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Quarter</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dueRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.description || record.feeType}</TableCell>
                    <TableCell>{record.quarter || "-"}</TableCell>
                    <TableCell>{formatCurrency(record.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(record.paidAmount)}</TableCell>
                    <TableCell sx={{ color: "#D32F2F", fontWeight: 700 }}>{formatCurrency(record.dueAmount)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={record.status} color={record.status === "PAID" ? "success" : "error"} variant="outlined" />
                    </TableCell>
                    <TableCell>{record.dueDate ? String(record.dueDate).slice(0, 10) : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Payment History</Typography>
          {loading ? (
            <Typography>Loading receipts...</Typography>
          ) : receipts.length === 0 ? (
            <Typography color="text.secondary">No payments recorded yet.</Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Receipt</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {receipts.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "-"}</TableCell>
                    <TableCell>{payment.receiptNumber || "-"}</TableCell>
                    <TableCell>{payment.feeRecordId?.description || payment.feeRecordId?.feeType || "-"}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>{payment.method || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={payment.feeRecordId?.status || "-"}
                        color={payment.feeRecordId?.status === "PAID" ? "success" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="contained" onClick={() => handleOpenReceipt(payment._id)} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none" }}>
                        Print Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      </Container>

      <PrintDialog open={demandSlipOpen} onClose={() => setDemandSlipOpen(false)} title="Demand Slip">
        <DemandSlip data={demandSlipData} />
      </PrintDialog>

      <PrintDialog open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Payment Receipt">
        <PaymentReceipt payment={receiptData} />
      </PrintDialog>
    </StudentLayout>
  );
};

export default StudentFees;
