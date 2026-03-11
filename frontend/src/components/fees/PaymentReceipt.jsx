import { Box, Button, Typography } from "@mui/material";
import { numberToWords } from "../../utils/numberToWords";

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const getParentName = (student) => student?.parentName || student?.fatherName || student?.guardianName || "N/A";

const PaymentReceipt = ({ payment }) => {
  if (!payment) return null;

  const feeRecord = payment.feeRecordId || {};
  const student = payment.studentId || {};
  const classInfo = payment.classId || {};
  const totalPaid = Number(payment.amount || 0);
  const remainingBalance = Math.max(
    0,
    Number(feeRecord.totalAmount || 0) - Number(feeRecord.paidAmount || 0),
  );
  const isPaid = feeRecord.status === "PAID" || remainingBalance === 0;

  return (
    <Box
      className="print-container"
      sx={{
        width: "210mm",
        maxWidth: "100%",
        minHeight: "297mm",
        p: "15mm",
        mx: "auto",
        bgcolor: "#fff",
        color: "#111",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        position: "relative",
        "@media print": {
          width: "210mm",
          minHeight: "auto",
          p: "15mm",
        },
        "@media print and (color)": {
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
        },
      }}
    >
      <style>{`.paid-watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:80px;font-weight:bold;color:rgba(46,125,50,0.15);pointer-events:none;z-index:0;} @media print {.no-print{display:none !important;} body{margin:0;} .print-container{width:210mm;padding:15mm;}}`}</style>
      <Button className="no-print" onClick={() => window.print()} variant="contained" sx={{ mb: 2, bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
        Print Receipt
      </Button>

      <Box sx={{ border: "1px solid #000", position: "relative", overflow: "hidden" }}>
        {isPaid && <Box className="paid-watermark">PAID</Box>}

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "#D32F2F", color: "#fff" }}>
            <Box component="img" src="/logo.png" alt="School Logo" sx={{ height: 60, width: "auto", bgcolor: "#fff", borderRadius: 1, p: 0.5 }} />
            <Box>
              <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>TINY KIDZ INTERNATIONAL SCHOOL</Typography>
              <Typography sx={{ fontSize: 14 }}>Amritsar, Punjab, India</Typography>
            </Box>
          </Box>

          <Box sx={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", textAlign: "center", py: 1.5 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 700 }}>PAYMENT RECEIPT</Typography>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <Box sx={{ borderRight: "1px solid #000", borderBottom: "1px solid #000", p: 1.5 }}>
              <Typography><strong>Receipt No:</strong></Typography>
              <Typography>{payment.receiptNumber || "-"}</Typography>
            </Box>
            <Box sx={{ borderBottom: "1px solid #000", p: 1.5 }}>
              <Typography><strong>Date:</strong></Typography>
              <Typography>{formatDate(payment.paymentDate)}</Typography>
            </Box>
          </Box>

          <Box sx={{ borderBottom: "1px solid #000", p: 1.5 }}>
            <Typography><strong>Received From:</strong> {student.userId?.name || "Student"}</Typography>
            <Typography><strong>Admission No:</strong> {student.admissionNumber || "-"}</Typography>
            <Typography><strong>Class:</strong> {`${classInfo.className || "Class"}-${classInfo.section || "-"}`}</Typography>
            <Typography><strong>Parent Name:</strong> {getParentName(student)}</Typography>
          </Box>

          <Box sx={{ borderBottom: "1px solid #000", p: 1.5 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>Payment Details:</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <Typography><strong>Fee Type:</strong> {feeRecord.description || `${feeRecord.quarter ? `${feeRecord.quarter} ` : ""}${feeRecord.feeType || "Fee"}`}</Typography>
              <Typography><strong>Quarter:</strong> {feeRecord.quarter || "-"}</Typography>
              <Typography><strong>Amount Paid:</strong> {formatCurrency(payment.amount)}</Typography>
              <Typography><strong>Payment Mode:</strong> {payment.method || "-"}</Typography>
              <Typography><strong>Late Fee:</strong> {formatCurrency(payment.lateFeeAmount || 0)}</Typography>
              <Typography><strong>Total Paid:</strong> {formatCurrency(totalPaid)}</Typography>
            </Box>
          </Box>

          <Box sx={{ borderBottom: "1px solid #000", p: 1.5 }}>
            <Typography sx={{ fontWeight: 700 }}>Amount in Words:</Typography>
            <Typography>{numberToWords(totalPaid)}</Typography>
          </Box>

          <Box sx={{ borderBottom: "1px solid #000", p: 1.5 }}>
            <Typography sx={{ fontWeight: 700, color: isPaid ? "#2E7D32" : "#D32F2F" }}>
              Remaining Balance: {formatCurrency(remainingBalance)}
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Typography sx={{ mb: 4 }}>___________________</Typography>
            <Typography>Authorised Signatory</Typography>
            <Typography>Tiny Kidz International School</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PaymentReceipt;
