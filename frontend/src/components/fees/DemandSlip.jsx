import { Box, Button, Typography } from "@mui/material";
import { numberToWords } from "../../utils/numberToWords";

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (value, withTime = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const cellSx = {
  border: "1px solid #000",
  p: 1,
  fontSize: 14,
};

const DemandSlip = ({ data }) => {
  if (!data) return null;

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
      <style>{`@media print {.no-print{display:none !important;} body{margin:0;} .print-container{width:210mm;padding:15mm;}}`}</style>
      <Button className="no-print" onClick={() => window.print()} variant="contained" sx={{ mb: 2, bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
        Print Demand Slip
      </Button>

      <Box sx={{ border: "1px solid #000", position: "relative" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, bgcolor: "#D32F2F", color: "#fff" }}>
          <Box component="img" src="/logo.png" alt="School Logo" sx={{ height: 60, width: "auto", bgcolor: "#fff", borderRadius: 1, p: 0.5 }} />
          <Box>
            <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>TINY KIDZ INTERNATIONAL SCHOOL</Typography>
            <Typography sx={{ fontSize: 14 }}>Amritsar, Punjab, India</Typography>
            <Typography sx={{ fontSize: 13 }}>Phone: XXXXX | Email: XXXXX</Typography>
          </Box>
        </Box>

        <Box sx={{ borderTop: "1px solid #000", borderBottom: "1px solid #000", textAlign: "center", py: 1.5 }}>
          <Typography sx={{ fontSize: 24, fontWeight: 700 }}>FEE DEMAND SLIP</Typography>
          <Typography sx={{ fontSize: 14 }}>Academic Year: {data.academicYear || "-"}</Typography>
          <Typography sx={{ fontSize: 14 }}>Generated on: {formatDate(data.generatedAt, true)}</Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <Box sx={cellSx}><strong>Student Name:</strong> {data.student?.name || "-"}</Box>
          <Box sx={cellSx}><strong>Admission No:</strong> {data.student?.admissionNumber || "-"}</Box>
          <Box sx={cellSx}><strong>Class:</strong> {`${data.student?.className || "-"}-${data.student?.section || "-"}`}</Box>
          <Box sx={cellSx}><strong>Parent Name:</strong> {data.student?.parentName || "N/A"}</Box>
          <Box sx={{ ...cellSx, gridColumn: "1 / span 2" }}><strong>Parent Phone:</strong> {data.student?.parentPhone || "N/A"}</Box>
        </Box>

        <Box sx={{ borderTop: "1px solid #000", p: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>PENDING FEE DETAILS:</Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr 1fr" }}>
          {["Fee Type", "Quarter", "Due Date", "Amount Due ₹", "Late Fee ₹"].map((header) => (
            <Box key={header} sx={{ ...cellSx, fontWeight: 700, bgcolor: "#F5F5F5" }}>{header}</Box>
          ))}
          {data.items?.map((item) => (
            <>
              <Box key={`${item._id}-type`} sx={cellSx}>{item.feeType}</Box>
              <Box key={`${item._id}-quarter`} sx={cellSx}>{item.quarter || "-"}</Box>
              <Box key={`${item._id}-due`} sx={cellSx}>{formatDate(item.dueDate)}</Box>
              <Box key={`${item._id}-amount`} sx={cellSx}>{formatCurrency(item.dueAmount)}</Box>
              <Box key={`${item._id}-late`} sx={cellSx}>{formatCurrency(item.lateFeeAmount)}</Box>
            </>
          ))}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #000" }}>
          <Box sx={{ width: 280 }}>
            <Box sx={{ ...cellSx, display: "flex", justifyContent: "space-between" }}><strong>Total Due:</strong><span>{formatCurrency(data.totals?.totalDue)}</span></Box>
            <Box sx={{ ...cellSx, display: "flex", justifyContent: "space-between" }}><strong>Late Fee:</strong><span>{formatCurrency(data.totals?.totalLateFee)}</span></Box>
            <Box sx={{ ...cellSx, display: "flex", justifyContent: "space-between", color: "#D32F2F", fontWeight: 700, fontSize: 18 }}><strong>TOTAL PAYABLE:</strong><span>{formatCurrency(data.totals?.totalPayable)}</span></Box>
          </Box>
        </Box>

        <Box sx={{ ...cellSx, borderTop: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>Amount in words:</Typography>
          <Typography>{numberToWords(data.totals?.totalPayable)}</Typography>
        </Box>

        <Box sx={{ ...cellSx, borderTop: 0 }}>
          <Typography>Please pay before {formatDate(data.nearestDueDate)}.</Typography>
          <Typography>Late fee of {formatCurrency(data.lateFeePerDay || 0)} per day will be charged after due date.</Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Typography sx={{ mb: 4 }}>___________________</Typography>
          <Typography>Authorised Signatory</Typography>
          <Typography>Tiny Kidz International School</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DemandSlip;
