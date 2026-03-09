import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Autocomplete,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import API from "../../services/authService";
import AdminLayout from "../../components/AdminLayout";

const formatCurrency = (amount = 0) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

const getStatusColor = (status) => {
  if (status === "Paid") return "success";
  if (status === "Partial") return "warning";
  return "error";
};

const getDueAmount = (row) =>
  Number(row.totalFee || 0) - Number(row.paidAmount || 0);

const parseList = (responseData) => {
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.data)) return responseData.data;
  return [];
};

const getStudentName = (student) => {
  if (!student) return "N/A";
  if (student.userId?.name) return student.userId.name;
  if (student.firstName || student.lastName) {
    return `${student.firstName || ""} ${student.lastName || ""}`.trim();
  }
  return "N/A";
};

const getClassLabel = (classObj) => {
  if (!classObj) return "N/A";
  if (classObj.classCode) return classObj.classCode;
  if (classObj.className && classObj.section)
    return `${classObj.className}-${classObj.section}`;
  if (classObj.className) return classObj.className;
  return "N/A";
};

const AdminFees = () => {
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState({
    totalFeeCollected: 0,
    totalDue: 0,
    paidCount: 0,
    unpaidCount: 0,
    partialCount: 0,
  });

  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "Cash",
    date: dayjs(),
    note: "",
  });

  const [createForm, setCreateForm] = useState({
    student: null,
    academicYear: "2024-25",
    totalFee: "",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const fetchFees = async () => {
    setLoading(true);
    try {
      const [feesRes, summaryRes] = await Promise.all([
        API.get("/fees"),
        API.get("/fees/summary"),
      ]);

      setFees(parseList(feesRes.data));
      setSummary({
        totalFeeCollected: Number(summaryRes.data?.totalFeeCollected || 0),
        totalDue: Number(summaryRes.data?.totalDue || 0),
        paidCount: Number(summaryRes.data?.paidCount || 0),
        unpaidCount: Number(summaryRes.data?.unpaidCount || 0),
        partialCount: Number(summaryRes.data?.partialCount || 0),
      });
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to load fee data",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchClassesAndStudents = async () => {
    try {
      const [classRes, studentRes] = await Promise.all([
        API.get("/classes"),
        API.get("/students?page=1&limit=1000"),
      ]);

      setClasses(parseList(classRes.data));
      setStudents(parseList(studentRes.data));
    } catch (error) {
      showSnackbar("Failed to load classes or students", "error");
    }
  };

  useEffect(() => {
    fetchFees();
    fetchClassesAndStudents();
  }, []);

  const filteredRows = useMemo(() => {
    return fees
      .filter((fee) => {
        const classOk =
          classFilter === "All" || fee.studentId?.classId?._id === classFilter;

        const statusOk = statusFilter === "All" || fee.status === statusFilter;

        const name = getStudentName(fee.studentId).toLowerCase();
        const admissionNo = (
          fee.studentId?.admissionNumber || ""
        ).toLowerCase();
        const search = searchText.trim().toLowerCase();
        const searchOk =
          !search || name.includes(search) || admissionNo.includes(search);

        return classOk && statusOk && searchOk;
      })
      .map((fee) => ({
        ...fee,
        id: fee._id,
      }));
  }, [fees, classFilter, statusFilter, searchText]);

  const openPaymentDialog = (feeRow) => {
    setSelectedFee(feeRow);
    setPaymentForm({ amount: "", method: "Cash", date: dayjs(), note: "" });
    setPaymentDialogOpen(true);
    showSnackbar("Add payment form opened", "info");
  };

  const openHistoryDialog = (feeRow) => {
    setSelectedFee(feeRow);
    setHistoryDialogOpen(true);
    showSnackbar("Fee history opened", "info");
  };

  const handleAddPayment = async () => {
    if (!selectedFee) return;

    const dueAmount = getDueAmount(selectedFee);
    const amount = Number(paymentForm.amount);

    if (!amount || amount <= 0) {
      showSnackbar("Payment amount is required", "warning");
      return;
    }

    if (amount > dueAmount) {
      showSnackbar(
        "Payment amount cannot be greater than due amount",
        "warning",
      );
      return;
    }

    try {
      await API.put(`/fees/${selectedFee._id}`, {
        payment: {
          amount,
          method: paymentForm.method,
          date: paymentForm.date?.toDate?.() || new Date(),
          note: paymentForm.note,
        },
      });

      setPaymentDialogOpen(false);
      setSelectedFee(null);
      showSnackbar("Payment added successfully", "success");
      fetchFees();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to add payment",
        "error",
      );
    }
  };

  const handleCreateFeeRecord = async () => {
    if (!createForm.student || !createForm.totalFee) {
      showSnackbar("Student and Total Fee are required", "warning");
      return;
    }

    try {
      await API.post("/fees", {
        studentId: createForm.student._id,
        academicYear: createForm.academicYear,
        totalFee: Number(createForm.totalFee),
      });

      setCreateDialogOpen(false);
      setCreateForm({ student: null, academicYear: "2024-25", totalFee: "" });
      showSnackbar("Fee record created successfully", "success");
      fetchFees();
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to create fee record",
        "error",
      );
    }
  };

  const columns = [
    {
      field: "studentName",
      headerName: "Student Name",
      flex: 1.3,
      minWidth: 180,
      valueGetter: (_, row) => getStudentName(row.studentId),
    },
    {
      field: "admissionNo",
      headerName: "Admission No",
      flex: 0.9,
      minWidth: 130,
      valueGetter: (_, row) => row.studentId?.admissionNumber || "N/A",
    },
    {
      field: "class",
      headerName: "Class",
      flex: 0.8,
      minWidth: 100,
      valueGetter: (_, row) => getClassLabel(row.studentId?.classId),
    },
    {
      field: "totalFee",
      headerName: "Total Fee",
      flex: 0.9,
      minWidth: 130,
      valueGetter: (_, row) => formatCurrency(row.totalFee),
    },
    {
      field: "paidAmount",
      headerName: "Paid Amount",
      flex: 0.9,
      minWidth: 130,
      valueGetter: (_, row) => formatCurrency(row.paidAmount),
    },
    {
      field: "dueAmount",
      headerName: "Due Amount",
      flex: 0.9,
      minWidth: 130,
      renderCell: (params) => {
        const due = getDueAmount(params.row);
        return (
          <Typography
            sx={{
              color: due > 0 ? "#D32F2F" : "inherit",
              fontWeight: due > 0 ? 700 : 400,
            }}
          >
            {formatCurrency(due)}
          </Typography>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.row.status}
          color={getStatusColor(params.row.status)}
          size="small"
        />
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1.4,
      minWidth: 250,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            size="small"
            variant="contained"
            onClick={() => openPaymentDialog(params.row)}
            sx={{ bgcolor: "#2e7d32", "&:hover": { bgcolor: "#1b5e20" } }}
          >
            Add Payment
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => openHistoryDialog(params.row)}
            sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#0d47a1" } }}
          >
            View Details
          </Button>
        </Box>
      ),
    },
  ];

  const historyPayments = useMemo(() => {
    const list = selectedFee?.payments || [];
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [selectedFee]);

  return (
    <AdminLayout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Typography
            variant="h4"
            sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
          >
            Fee Management
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: "6px solid #2e7d32" }}>
                <CardContent>
                  <Typography variant="body2">Total Fee Collected</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#2e7d32", fontWeight: 700 }}
                  >
                    {formatCurrency(summary.totalFeeCollected)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: "6px solid #D32F2F" }}>
                <CardContent>
                  <Typography variant="body2">Total Due Amount</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#D32F2F", fontWeight: 700 }}
                  >
                    {formatCurrency(summary.totalDue)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: "6px solid #2e7d32" }}>
                <CardContent>
                  <Typography variant="body2">Fully Paid Students</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#2e7d32", fontWeight: 700 }}
                  >
                    {summary.paidCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderLeft: "6px solid #D32F2F" }}>
                <CardContent>
                  <Typography variant="body2">Unpaid Students</Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#D32F2F", fontWeight: 700 }}
                  >
                    {summary.unpaidCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select
                    value={classFilter}
                    label="Class"
                    onChange={(e) => setClassFilter(e.target.value)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {classes.map((cls) => (
                      <MenuItem key={cls._id} value={cls._id}>
                        {getClassLabel(cls)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Partial">Partial</MenuItem>
                    <MenuItem value="Unpaid">Unpaid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search by student name"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ bgcolor: "#D32F2F", height: 56 }}
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Fee
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                loading={loading}
                disableRowSelectionOnClick
                getRowId={(row) => row._id}
              />
            </Box>
          </Paper>

          <Dialog
            open={paymentDialogOpen}
            onClose={() => setPaymentDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: "#D32F2F", fontWeight: 700 }}>
              Add Payment
            </DialogTitle>
            <DialogContent>
              <TextField
                margin="normal"
                label="Amount"
                type="number"
                fullWidth
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
                inputProps={{
                  min: 1,
                  max: Math.max(0, getDueAmount(selectedFee || {})),
                }}
                helperText={`Max: ${formatCurrency(Math.max(0, getDueAmount(selectedFee || {})))}`}
                required
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Method</InputLabel>
                <Select
                  label="Method"
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      method: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                </Select>
              </FormControl>

              <DatePicker
                label="Date"
                value={paymentForm.date}
                onChange={(value) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    date: value || dayjs(),
                  }))
                }
                slotProps={{ textField: { margin: "normal", fullWidth: true } }}
              />

              <TextField
                margin="normal"
                label="Note"
                fullWidth
                multiline
                minRows={2}
                value={paymentForm.note}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ bgcolor: "#2e7d32" }}
                onClick={handleAddPayment}
              >
                Save Payment
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={historyDialogOpen}
            onClose={() => setHistoryDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ color: "#D32F2F", fontWeight: 700 }}>
              Fee History
            </DialogTitle>
            <DialogContent>
              {selectedFee && (
                <>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    {getStudentName(selectedFee.studentId)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ mb: 2, color: "text.secondary" }}
                  >
                    {getClassLabel(selectedFee.studentId?.classId)}
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 1.5 }}>
                        <Typography variant="caption">Total Fee</Typography>
                        <Typography sx={{ fontWeight: 700 }}>
                          {formatCurrency(selectedFee.totalFee)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 1.5 }}>
                        <Typography variant="caption">Paid</Typography>
                        <Typography sx={{ fontWeight: 700, color: "#2e7d32" }}>
                          {formatCurrency(selectedFee.paidAmount)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper sx={{ p: 1.5 }}>
                        <Typography variant="caption">Due</Typography>
                        <Typography sx={{ fontWeight: 700, color: "#D32F2F" }}>
                          {formatCurrency(getDueAmount(selectedFee))}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Note</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              No payments recorded yet
                            </TableCell>
                          </TableRow>
                        ) : (
                          historyPayments.map((payment, index) => (
                            <TableRow key={`${payment.date}-${index}`}>
                              <TableCell>
                                {dayjs(payment.date).format("DD/MM/YYYY")}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={payment.method}
                                  color="primary"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>{payment.note || "-"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: "#D32F2F", fontWeight: 700 }}>
              Create Fee Record
            </DialogTitle>
            <DialogContent>
              <Autocomplete
                options={students}
                value={createForm.student}
                onChange={(_, value) =>
                  setCreateForm((prev) => ({ ...prev, student: value }))
                }
                getOptionLabel={(option) =>
                  `${option.userId?.name || "N/A"} (${option.admissionNumber || "N/A"})`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="normal"
                    label="Student"
                    placeholder="Search student"
                  />
                )}
              />

              <TextField
                margin="normal"
                fullWidth
                label="Academic Year"
                value={createForm.academicYear}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
              />

              <TextField
                margin="normal"
                fullWidth
                label="Total Fee"
                type="number"
                value={createForm.totalFee}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    totalFee: e.target.value,
                  }))
                }
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                sx={{ bgcolor: "#D32F2F" }}
                onClick={handleCreateFeeRecord}
              >
                Create
              </Button>
            </DialogActions>
          </Dialog>

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
      </LocalizationProvider>
    </AdminLayout>
  );
};

export default AdminFees;
