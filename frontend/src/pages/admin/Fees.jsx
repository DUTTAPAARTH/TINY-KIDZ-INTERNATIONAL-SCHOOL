import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
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
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { DataGrid } from "@mui/x-data-grid";
import AdminLayout from "../../components/AdminLayout";
import DemandSlip from "../../components/fees/DemandSlip";
import PaymentReceipt from "../../components/fees/PaymentReceipt";
import PrintDialog from "../../components/fees/PrintDialog";
import FeeReportsTab from "../../components/fees/FeeReportsTab";
import API from "../../services/authService";

const ACADEMIC_YEARS = ["2024-25", "2025-26"];
const FEE_TYPES = [
  "Tuition",
  "Admission",
  "Uniform",
  "Activity",
  "Transport",
  "Miscellaneous",
  "Fine",
];
const QUARTERS = ["Q1", "Q2", "Q3", "Q4", "Annual"];
const PAYMENT_METHODS = ["Cash", "UPI", "Cheque", "DD", "Bank Transfer"];

const formatCurrency = (amount = 0) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

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

const getDefaultDueDates = (academicYear = "2024-25") => {
  const startYear = Number((academicYear || "2024-25").split("-")[0]);
  return {
    q1DueDate: `${startYear}-04-10`,
    q2DueDate: `${startYear}-07-10`,
    q3DueDate: `${startYear}-10-10`,
    q4DueDate: `${startYear + 1}-01-10`,
  };
};

const emptyStructureForm = {
  classId: "",
  academicYear: "2024-25",
  tuitionFee: "",
  admissionFee: 0,
  uniformFee: 0,
  activityFee: 0,
  transportFee: 0,
  lateFeePerDay: 50,
  ...getDefaultDueDates("2024-25"),
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const AdminFees = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [yearFilter, setYearFilter] = useState("2024-25");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);

  const [structures, setStructures] = useState([]);
  const [loadingStructures, setLoadingStructures] = useState(false);

  const [structureDialogOpen, setStructureDialogOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [structureForm, setStructureForm] = useState(emptyStructureForm);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [rangeDialogOpen, setRangeDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [collectPaymentOpen, setCollectPaymentOpen] = useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = useState(false);
  const [demandSlipOpen, setDemandSlipOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [demandSlipLoading, setDemandSlipLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [demandSlipData, setDemandSlipData] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [defaulters, setDefaulters] = useState([]);
  const [loadingDefaulters, setLoadingDefaulters] = useState(false);
  const [defaulterSearch, setDefaulterSearch] = useState("");
  const [defaulterClassFilter, setDefaulterClassFilter] = useState("All");
  const [defaulterAmountFilter, setDefaulterAmountFilter] = useState("All");

  const [todayCollection, setTodayCollection] = useState({
    totalAmount: 0,
    count: 0,
    breakdown: {
      Cash: 0,
      UPI: 0,
      Cheque: 0,
      DD: 0,
      "Bank Transfer": 0,
    },
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "Cash",
    chequeNumber: "",
    bankName: "",
    transactionId: "",
    paymentDate: todayStr(),
    note: "",
  });

  const [classGenerateForm, setClassGenerateForm] = useState({
    classId: "",
    academicYear: "2024-25",
    feeTypes: ["Tuition"],
    quarter: "Q1",
    customAmount: "",
  });
  const [schoolGenerateForm, setSchoolGenerateForm] = useState({
    academicYear: "2024-25",
    feeTypes: ["Tuition"],
    quarter: "Q1",
    customAmount: "",
  });
  const [rangeGenerateForm, setRangeGenerateForm] = useState({
    fromClass: "1",
    toClass: "10",
    academicYear: "2024-25",
    feeTypes: ["Tuition"],
    quarter: "Q1",
    customAmount: "",
  });
  const [studentGenerateForm, setStudentGenerateForm] = useState({
    studentId: "",
    academicYear: "2024-25",
    feeType: "Miscellaneous",
    quarter: "",
    amount: "",
    dueDate: todayStr(),
    description: "",
  });

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordClassFilter, setRecordClassFilter] = useState("");
  const [recordAcademicYearFilter, setRecordAcademicYearFilter] = useState("2024-25");
  const [recordQuarterFilter, setRecordQuarterFilter] = useState("All");
  const [recordStatusFilter, setRecordStatusFilter] = useState("All");
  const [recordFeeTypeFilter, setRecordFeeTypeFilter] = useState("All");
  const [recordSearchFilter, setRecordSearchFilter] = useState("");

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const getClassLabel = (cls) => {
    if (!cls) return "N/A";
    return `${cls.className || "Class"}-${cls.section || "A"}`;
  };

  const fetchClasses = async () => {
    try {
      const res = await API.get("/classes");
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setClasses(list);
    } catch {
      showSnackbar("Failed to fetch classes", "error");
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await API.get("/students", { params: { limit: 2000 } });
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setStudents(list);
    } catch {
      showSnackbar("Failed to fetch students", "error");
    }
  };

  const fetchStructures = async () => {
    try {
      setLoadingStructures(true);
      const res = await API.get("/fees/structure");
      setStructures(Array.isArray(res.data) ? res.data : []);
    } catch {
      showSnackbar("Failed to fetch fee structures", "error");
    } finally {
      setLoadingStructures(false);
    }
  };

  const fetchRecords = async () => {
    if (!recordClassFilter) {
      setRecords([]);
      setLoadingRecords(false);
      return;
    }

    try {
      setLoadingRecords(true);
      const params = {};
      if (recordAcademicYearFilter !== "All") params.academicYear = recordAcademicYearFilter;
      if (recordQuarterFilter !== "All") params.quarter = recordQuarterFilter;
      if (recordStatusFilter !== "All") params.status = recordStatusFilter;
      if (recordFeeTypeFilter !== "All") params.feeType = recordFeeTypeFilter;
      if (recordSearchFilter.trim()) params.search = recordSearchFilter.trim();

      const endpoint =
        recordClassFilter === "all" ? "/fees" : `/fees/class/${recordClassFilter}`;
      const res = await API.get(endpoint, { params });
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch {
      showSnackbar("Failed to fetch fee records", "error");
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchTodayCollection = async () => {
    try {
      const res = await API.get("/fees/payment/today");
      setTodayCollection({
        totalAmount: Number(res.data?.totalAmount || 0),
        count: Number(res.data?.count || 0),
        breakdown: {
          Cash: Number(res.data?.breakdown?.Cash || 0),
          UPI: Number(res.data?.breakdown?.UPI || 0),
          Cheque: Number(res.data?.breakdown?.Cheque || 0),
          DD: Number(res.data?.breakdown?.DD || 0),
          "Bank Transfer": Number(res.data?.breakdown?.["Bank Transfer"] || 0),
        },
      });
    } catch {
      // Keep UI resilient even when collection endpoint has no data yet.
      setTodayCollection((prev) => prev);
    }
  };

  const fetchDefaulters = async () => {
    try {
      setLoadingDefaulters(true);
      const res = await API.get("/fees/defaulters");
      setDefaulters(Array.isArray(res.data) ? res.data : []);
    } catch {
      showSnackbar("Failed to fetch defaulters", "error");
    } finally {
      setLoadingDefaulters(false);
    }
  };

  const openCollectPayment = (record) => {
    setSelectedRecord(record);
    setPaymentForm({
      amount: "",
      method: "Cash",
      chequeNumber: "",
      bankName: "",
      transactionId: "",
      paymentDate: todayStr(),
      note: "",
    });
    setCollectPaymentOpen(true);
  };

  const openPaymentHistory = async (record) => {
    setSelectedRecord(record);
    setPaymentHistoryOpen(true);
    try {
      setHistoryLoading(true);
      const res = await API.get(`/fees/receipt/student/${record.studentId?._id}`);
      const rows = (Array.isArray(res.data) ? res.data : []).filter(
        (p) => String(p.feeRecordId?._id || p.feeRecordId) === String(record._id),
      );
      setHistoryRows(rows);
    } catch {
      showSnackbar("Failed to fetch payment history", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const openDemandSlip = async (studentId) => {
    try {
      setDemandSlipLoading(true);
      setDemandSlipOpen(true);
      const res = await API.get(`/fees/demand-slip/${studentId}`);
      setDemandSlipData(res.data);
    } catch (error) {
      setDemandSlipOpen(false);
      showSnackbar(error?.response?.data?.message || "Failed to fetch demand slip", "error");
    } finally {
      setDemandSlipLoading(false);
    }
  };

  const openReceipt = async (paymentId) => {
    try {
      setReceiptLoading(true);
      setReceiptOpen(true);
      const res = await API.get(`/fees/receipt/${paymentId}`);
      setReceiptData(res.data);
    } catch (error) {
      setReceiptOpen(false);
      showSnackbar(error?.response?.data?.message || "Failed to fetch receipt", "error");
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedRecord?._id) return;
    if (!paymentForm.amount || Number(paymentForm.amount) < 1) {
      showSnackbar("Enter a valid amount", "error");
      return;
    }

    const payload = {
      feeRecordId: selectedRecord._id,
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
      paymentDate: paymentForm.paymentDate,
      note: paymentForm.note,
      chequeNumber: paymentForm.chequeNumber || undefined,
      bankName: paymentForm.bankName || undefined,
      transactionId: paymentForm.transactionId || undefined,
    };

    try {
      const res = await API.post("/fees/payment", payload);
      showSnackbar(
        `Payment recorded - Receipt: ${res.data?.receiptNumber || "Generated"}`,
        "success",
      );
      setCollectPaymentOpen(false);
      await Promise.all([fetchRecords(), fetchTodayCollection()]);
    } catch (error) {
      showSnackbar(error?.response?.data?.message || "Failed to record payment", "error");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Delete this payment entry? This will reverse paid amount.")) return;
    try {
      await API.delete(`/fees/payment/${paymentId}`);
      showSnackbar("Payment deleted successfully", "success");
      if (selectedRecord) {
        await openPaymentHistory(selectedRecord);
      }
      await Promise.all([fetchRecords(), fetchTodayCollection(), fetchDefaulters()]);
    } catch (error) {
      showSnackbar(error?.response?.data?.message || "Failed to delete payment", "error");
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStudents();
    fetchStructures();
    fetchTodayCollection();
  }, []);

  useEffect(() => {
    if (currentTab === 2) fetchRecords();
  }, [
    currentTab,
    recordClassFilter,
    recordAcademicYearFilter,
    recordQuarterFilter,
    recordStatusFilter,
    recordFeeTypeFilter,
    recordSearchFilter,
  ]);

  useEffect(() => {
    if (currentTab === 3) fetchDefaulters();
  }, [currentTab]);

  const filteredStructures = useMemo(
    () => structures.filter((s) => s.academicYear === yearFilter),
    [structures, yearFilter],
  );

  const filteredDefaulters = useMemo(() => {
    const term = defaulterSearch.trim().toLowerCase();
    return defaulters.filter((item) => {
      const matchesSearch =
        !term ||
        item.studentName?.toLowerCase().includes(term) ||
        item.admissionNo?.toLowerCase().includes(term) ||
        item.parentName?.toLowerCase().includes(term) ||
        item.className?.toLowerCase().includes(term);
      const matchesClass = defaulterClassFilter === "All" || item.className === defaulterClassFilter;
      const matchesAmount =
        defaulterAmountFilter === "All" ||
        (defaulterAmountFilter === "1000+" && Number(item.totalDue || 0) >= 1000) ||
        (defaulterAmountFilter === "5000+" && Number(item.totalDue || 0) >= 5000) ||
        (defaulterAmountFilter === "10000+" && Number(item.totalDue || 0) >= 10000);
      return matchesSearch && matchesClass && matchesAmount;
    });
  }, [defaulters, defaulterSearch, defaulterClassFilter, defaulterAmountFilter]);

  const structureSummary = useMemo(() => {
    const tuition = Number(structureForm.tuitionFee || 0);
    const admission = Number(structureForm.admissionFee || 0);
    const uniform = Number(structureForm.uniformFee || 0);
    const activity = Number(structureForm.activityFee || 0);
    const transport = Number(structureForm.transportFee || 0);
    const totalAnnual = tuition + admission + uniform + activity + transport;
    return { tuition, admission, uniform, activity, transport, totalAnnual, quarterly: tuition / 4 };
  }, [structureForm]);

  const getStudentOptionLabel = (student) => {
    if (!student) return "";
    const name = student.userId?.name || student.name || "Student";
    const admission = student.admissionNumber || "-";
    return `${name} (${admission})`;
  };

  const generateCardSx = {
    border: "1px solid #F2C7C7",
    borderRadius: 2,
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#D32F2F",
      boxShadow: "0 8px 24px rgba(211, 47, 47, 0.12)",
      transform: "translateY(-2px)",
    },
  };

  const openActionButtonSx = {
    bgcolor: "#D32F2F",
    "&:hover": { bgcolor: "#B71C1C" },
    textTransform: "none",
    fontWeight: 700,
    px: 2,
    borderRadius: 1.5,
  };

  const openCreateStructureDialog = () => {
    setEditingStructure(null);
    setStructureForm({ ...emptyStructureForm, academicYear: yearFilter, ...getDefaultDueDates(yearFilter) });
    setStructureDialogOpen(true);
  };

  const openEditStructureDialog = (row) => {
    setEditingStructure(row);
    const defaults = getDefaultDueDates(row.academicYear || "2024-25");
    setStructureForm({
      classId: row.classId?._id || "",
      academicYear: row.academicYear || "2024-25",
      tuitionFee: row.tuitionFee ?? 0,
      admissionFee: row.admissionFee ?? 0,
      uniformFee: row.uniformFee ?? 0,
      activityFee: row.activityFee ?? 0,
      transportFee: row.transportFee ?? 0,
      lateFeePerDay: row.lateFeePerDay ?? 50,
      q1DueDate: row.q1DueDate ? String(row.q1DueDate).slice(0, 10) : defaults.q1DueDate,
      q2DueDate: row.q2DueDate ? String(row.q2DueDate).slice(0, 10) : defaults.q2DueDate,
      q3DueDate: row.q3DueDate ? String(row.q3DueDate).slice(0, 10) : defaults.q3DueDate,
      q4DueDate: row.q4DueDate ? String(row.q4DueDate).slice(0, 10) : defaults.q4DueDate,
    });
    setStructureDialogOpen(true);
  };

  const saveStructure = async () => {
    if (!structureForm.classId || !structureForm.academicYear || structureForm.tuitionFee === "") {
      showSnackbar("Class, academic year and tuition fee are required", "error");
      return;
    }

    const payload = {
      classId: structureForm.classId,
      academicYear: structureForm.academicYear,
      tuitionFee: Number(structureForm.tuitionFee || 0),
      admissionFee: Number(structureForm.admissionFee || 0),
      uniformFee: Number(structureForm.uniformFee || 0),
      activityFee: Number(structureForm.activityFee || 0),
      transportFee: Number(structureForm.transportFee || 0),
      lateFeePerDay: Number(structureForm.lateFeePerDay || 0),
      q1DueDate: structureForm.q1DueDate,
      q2DueDate: structureForm.q2DueDate,
      q3DueDate: structureForm.q3DueDate,
      q4DueDate: structureForm.q4DueDate,
    };

    try {
      if (editingStructure?._id) {
        await API.put(`/fees/structure/${editingStructure._id}`, payload);
        showSnackbar("Fee structure updated successfully");
      } else {
        await API.post("/fees/structure", payload);
        showSnackbar("Fee structure created successfully");
      }
      setStructureDialogOpen(false);
      fetchStructures();
    } catch (error) {
      showSnackbar(error?.response?.data?.message || "Failed to save fee structure", "error");
    }
  };

  const askDeleteStructure = (row) => {
    setDeleteTarget(row);
    setConfirmDeleteOpen(true);
  };

  const deleteStructure = async () => {
    if (!deleteTarget?._id) return;
    try {
      await API.delete(`/fees/structure/${deleteTarget._id}`);
      showSnackbar("Fee structure deleted successfully");
      setConfirmDeleteOpen(false);
      setDeleteTarget(null);
      fetchStructures();
    } catch {
      showSnackbar("Failed to delete fee structure", "error");
    }
  };

  const confirmAndGenerate = async ({ endpoint, payload, successMessage }) => {
    if (!window.confirm("Are you sure you want to generate fee records?")) return;
    try {
      const res = await API.post(endpoint, payload);
      const summary = res.data
        ? ` Created: ${res.data.created || 0}, Skipped: ${res.data.skipped || 0}`
        : "";
      showSnackbar(`${successMessage}.${summary}`);
      setClassDialogOpen(false);
      setSchoolDialogOpen(false);
      setRangeDialogOpen(false);
      setStudentDialogOpen(false);
      if (currentTab === 2) fetchRecords();
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const backendError = error?.response?.data?.error;
      showSnackbar(backendError ? `${backendMessage}: ${backendError}` : backendMessage || "Failed to generate fee records", "error");
    }
  };

  const runOverdueUpdate = async () => {
    try {
      const res = await API.put("/fees/update-overdue");
      showSnackbar(`Updated ${res.data?.updated || 0} overdue records`);
      fetchRecords();
    } catch {
      showSnackbar("Failed to update overdue records", "error");
    }
  };

  const rows = records.map((r) => {
    const studentName = r.studentId?.userId?.name || "N/A";
    const admissionNo = r.studentId?.admissionNumber || "-";
    const classLabel = getClassLabel(r.classId);
    const dueAmount = Number(r.totalAmount || 0) - Number(r.paidAmount || 0);

    return {
      ...r,
      id: r._id,
      studentName,
      admissionNo,
      classLabel,
      dueAmount,
      dueDateView: r.dueDate ? String(r.dueDate).slice(0, 10) : "-",
    };
  });

  const selectedDue = Math.max(
    0,
    Number(selectedRecord?.totalAmount || 0) - Number(selectedRecord?.paidAmount || 0),
  );
  const latePreview = getLateDetails({
    dueDate: selectedRecord?.dueDate,
    paymentDate: paymentForm.paymentDate,
    lateFeePerDay: selectedRecord?.lateFeePerDay || 50,
  });
  const totalPayable = selectedDue + latePreview.lateFeeAmount;

  const recordColumns = [
    { field: "studentName", headerName: "Student", width: 160 },
    { field: "admissionNo", headerName: "Adm No", width: 110 },
    { field: "classLabel", headerName: "Class", width: 90 },
    { field: "feeType", headerName: "Fee Type", width: 120 },
    { field: "quarter", headerName: "Quarter", width: 90, valueGetter: (_value, row) => row?.quarter || "-" },
    {
      field: "totalAmount",
      headerName: "Total ₹",
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: "paidAmount",
      headerName: "Paid ₹",
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: "dueAmount",
      headerName: "Due ₹",
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    { field: "status", headerName: "Status", width: 110 },
    { field: "dueDateView", headerName: "Due Date", width: 110 },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", py: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => openDemandSlip(params.row.studentId?._id)}
            sx={{ textTransform: "none", minWidth: 100, px: 1 }}
          >
            Demand Slip
          </Button>
          {Number(params.row?.dueAmount || 0) > 0 ? (
            <Button
              size="small"
              variant="contained"
              onClick={() => openCollectPayment(params.row)}
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none", minWidth: 100, px: 1 }}
            >
              Collect Payment
            </Button>
          ) : (
            <Chip
              label="✓ PAID"
              size="small"
              sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: "bold" }}
            />
          )}
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => openPaymentHistory(params.row)}
            sx={{ textTransform: "none", minWidth: 100, px: 1 }}
          >
            View Ledger
          </Button>
        </Box>
      ),
    },
  ];

  const defaulterColumns = [
    { field: "studentName", headerName: "Student", flex: 1.1, minWidth: 180 },
    { field: "admissionNo", headerName: "Admission No", minWidth: 130 },
    { field: "className", headerName: "Class", minWidth: 120 },
    { field: "parentName", headerName: "Parent", flex: 1, minWidth: 160 },
    { field: "parentPhone", headerName: "Phone", minWidth: 130 },
    {
      field: "quartersUnpaid",
      headerName: "Unpaid Quarters",
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row?.quartersUnpaid?.join(", ") || "-",
    },
    {
      field: "totalDue",
      headerName: "Total Due",
      minWidth: 130,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: "lastPaymentDate",
      headerName: "Last Payment",
      minWidth: 130,
      valueGetter: (_value, row) => (row?.lastPaymentDate ? String(row.lastPaymentDate).slice(0, 10) : "-"),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => openDemandSlip(params.row.studentId)}
          sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none" }}
        >
          Demand Slip
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: "#D32F2F" }}>
          Fee Management
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Tiny Kidz International School - Academic Year 2024-25
        </Typography>

        <Paper
          sx={{
            mb: 2,
            p: 2,
            border: "1px solid #F2C7C7",
            bgcolor: "#FFF5F5",
          }}
        >
          <Typography variant="subtitle2" sx={{ color: "#D32F2F", fontWeight: 700 }}>
            Today's Collection
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#D32F2F" }}>
            {formatCurrency(todayCollection.totalAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {todayCollection.count} payments
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Cash: {formatCurrency(todayCollection.breakdown.Cash)} | UPI: {formatCurrency(todayCollection.breakdown.UPI)} | Cheque: {formatCurrency(todayCollection.breakdown.Cheque)}
          </Typography>
        </Paper>

        <Paper sx={{ mb: 2 }}>
          <Tabs
            value={currentTab}
            onChange={(e, value) => setCurrentTab(value)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .Mui-selected": { color: "#D32F2F" },
              "& .MuiTabs-indicator": { bgcolor: "#D32F2F" },
            }}
          >
            <Tab label="Fee Structure" />
            <Tab label="Generate Fees" />
            <Tab label="View Records" />
            <Tab label="Defaulters" />
            <Tab label="Reports" />
          </Tabs>
        </Paper>

        {currentTab === 0 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F" }}>
                Fee Structure
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select value={yearFilter} label="Academic Year" onChange={(e) => setYearFilter(e.target.value)}>
                    {ACADEMIC_YEARS.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={openCreateStructureDialog} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
                  Set Fee Structure
                </Button>
              </Box>
            </Box>

            {loadingStructures ? (
              <Typography>Loading fee structures...</Typography>
            ) : filteredStructures.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" color="text.secondary">No fee structure defined yet</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Tuition</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Admission</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Uniform</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Activity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Transport</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Annual</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Quarterly</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Late/day</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStructures.map((row) => {
                    const totalAnnual =
                      Number(row.tuitionFee || 0) +
                      Number(row.admissionFee || 0) +
                      Number(row.uniformFee || 0) +
                      Number(row.activityFee || 0) +
                      Number(row.transportFee || 0);

                    return (
                      <TableRow key={row._id}>
                        <TableCell>{getClassLabel(row.classId)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.tuitionFee)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.admissionFee)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.uniformFee)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.activityFee)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.transportFee)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(totalAnnual)}</TableCell>
                        <TableCell align="right">{formatCurrency(Number(row.tuitionFee || 0) / 4)}</TableCell>
                        <TableCell align="right">{formatCurrency(row.lateFeePerDay)}</TableCell>
                        <TableCell align="center">
                          <IconButton color="primary" onClick={() => openEditStructureDialog(row)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton color="error" onClick={() => askDeleteStructure(row)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Paper>
        )}

        {currentTab === 1 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F", mb: 2 }}>
              Generate Fee Records
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={generateCardSx}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>Generate for One Class</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>Create fee records class-wise.</Typography>
                    <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => setClassDialogOpen(true)} sx={openActionButtonSx}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={generateCardSx}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>Generate for Whole School</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>Create records for every class with structure.</Typography>
                    <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => setSchoolDialogOpen(true)} sx={openActionButtonSx}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={generateCardSx}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>Generate for Class Range</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>Create records for class numbers range.</Typography>
                    <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => setRangeDialogOpen(true)} sx={openActionButtonSx}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={generateCardSx}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 1 }}>Generate for One Student</Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>Create custom fee record manually.</Typography>
                    <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={() => setStudentDialogOpen(true)} sx={openActionButtonSx}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        {currentTab === 2 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2, flexWrap: "wrap" }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F" }}>Fee Records</Typography>
              <Button variant="outlined" color="error" onClick={runOverdueUpdate}>Update Overdue Status</Button>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Class</InputLabel>
                <Select value={recordClassFilter} label="Class" onChange={(e) => setRecordClassFilter(e.target.value)}>
                  <MenuItem value="">Select Class</MenuItem>
                  <MenuItem value="all">All Classes</MenuItem>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>{getClassLabel(cls)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Academic Year</InputLabel>
                <Select value={recordAcademicYearFilter} label="Academic Year" onChange={(e) => setRecordAcademicYearFilter(e.target.value)}>
                  {ACADEMIC_YEARS.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Quarter</InputLabel>
                <Select value={recordQuarterFilter} label="Quarter" onChange={(e) => setRecordQuarterFilter(e.target.value)}>
                  <MenuItem value="All">All</MenuItem>
                  {QUARTERS.map((q) => (
                    <MenuItem key={q} value={q}>{q}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={recordStatusFilter} label="Status" onChange={(e) => setRecordStatusFilter(e.target.value)}>
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="DUE">DUE</MenuItem>
                  <MenuItem value="PARTIAL">PARTIAL</MenuItem>
                  <MenuItem value="PAID">PAID</MenuItem>
                  <MenuItem value="OVERDUE">OVERDUE</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Fee Type</InputLabel>
                <Select value={recordFeeTypeFilter} label="Fee Type" onChange={(e) => setRecordFeeTypeFilter(e.target.value)}>
                  <MenuItem value="All">All</MenuItem>
                  {FEE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                size="small"
                label="Search by name"
                value={recordSearchFilter}
                onChange={(e) => setRecordSearchFilter(e.target.value)}
                placeholder="Student name or admission no"
                sx={{ minWidth: 220 }}
              />
            </Box>

            {!recordClassFilter ? (
              <Box
                sx={{
                  height: 560,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px dashed #D7D7D7",
                  borderRadius: 1,
                  bgcolor: "#FAFAFA",
                }}
              >
                <Typography color="text.secondary">Select a class to view fee records</Typography>
              </Box>
            ) : (
              <Box sx={{ height: 560, width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={recordColumns}
                  getRowId={(row) => row._id}
                  loading={loadingRecords}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 20, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
                />
              </Box>
            )}
          </Paper>
        )}

        {currentTab === 3 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#D32F2F", mb: 2 }}>
              Defaulters
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                label="Search"
                value={defaulterSearch}
                onChange={(e) => setDefaulterSearch(e.target.value)}
                placeholder="Student, admission, parent, class"
                sx={{ minWidth: 260 }}
              />
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Class</InputLabel>
                <Select value={defaulterClassFilter} label="Class" onChange={(e) => setDefaulterClassFilter(e.target.value)}>
                  <MenuItem value="All">All</MenuItem>
                  {[...new Set(defaulters.map((item) => item.className).filter(Boolean))].map((className) => (
                    <MenuItem key={className} value={className}>{className}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>Due Filter</InputLabel>
                <Select value={defaulterAmountFilter} label="Due Filter" onChange={(e) => setDefaulterAmountFilter(e.target.value)}>
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="1000+">₹1,000+</MenuItem>
                  <MenuItem value="5000+">₹5,000+</MenuItem>
                  <MenuItem value="10000+">₹10,000+</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={filteredDefaulters.map((item) => ({ ...item, id: item.studentId }))}
                columns={defaulterColumns}
                loading={loadingDefaulters}
                disableRowSelectionOnClick
                pageSizeOptions={[10, 20, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              />
            </Box>
          </Paper>
        )}

        {currentTab === 4 && <FeeReportsTab />}

        <Dialog open={structureDialogOpen} onClose={() => setStructureDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>{editingStructure ? "Edit Fee Structure" : "Set Fee Structure"}</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select value={structureForm.classId} label="Class" onChange={(e) => setStructureForm((p) => ({ ...p, classId: e.target.value }))}>
                  {classes.map((cls) => (
                    <MenuItem key={cls._id} value={cls._id}>{getClassLabel(cls)}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={structureForm.academicYear}
                  label="Academic Year"
                  onChange={(e) => {
                    const year = e.target.value;
                    setStructureForm((p) => ({ ...p, academicYear: year, ...getDefaultDueDates(year) }));
                  }}
                >
                  {ACADEMIC_YEARS.map((year) => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider>Fee Heads</Divider>

              <TextField label="Tuition Fee" type="number" value={structureForm.tuitionFee} onChange={(e) => setStructureForm((p) => ({ ...p, tuitionFee: e.target.value }))} fullWidth />
              <TextField label="Admission Fee" type="number" value={structureForm.admissionFee} onChange={(e) => setStructureForm((p) => ({ ...p, admissionFee: e.target.value }))} fullWidth />
              <TextField label="Uniform Fee" type="number" value={structureForm.uniformFee} onChange={(e) => setStructureForm((p) => ({ ...p, uniformFee: e.target.value }))} fullWidth />
              <TextField label="Activity Fee" type="number" value={structureForm.activityFee} onChange={(e) => setStructureForm((p) => ({ ...p, activityFee: e.target.value }))} fullWidth />
              <TextField label="Transport Fee" type="number" value={structureForm.transportFee} onChange={(e) => setStructureForm((p) => ({ ...p, transportFee: e.target.value }))} fullWidth />
              <TextField label="Late Fee/Day" type="number" value={structureForm.lateFeePerDay} onChange={(e) => setStructureForm((p) => ({ ...p, lateFeePerDay: e.target.value }))} fullWidth />

              <Divider>Due Dates</Divider>

              <TextField label="Q1 Due Date" type="date" value={structureForm.q1DueDate} onChange={(e) => setStructureForm((p) => ({ ...p, q1DueDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Q2 Due Date" type="date" value={structureForm.q2DueDate} onChange={(e) => setStructureForm((p) => ({ ...p, q2DueDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Q3 Due Date" type="date" value={structureForm.q3DueDate} onChange={(e) => setStructureForm((p) => ({ ...p, q3DueDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Q4 Due Date" type="date" value={structureForm.q4DueDate} onChange={(e) => setStructureForm((p) => ({ ...p, q4DueDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />

              <Paper variant="outlined" sx={{ p: 2, bgcolor: "#FAFAFA" }}>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Fee Summary</Typography>
                <Typography>Tuition: {formatCurrency(structureSummary.tuition)}</Typography>
                <Typography>Admission: {formatCurrency(structureSummary.admission)}</Typography>
                <Typography>Uniform: {formatCurrency(structureSummary.uniform)}</Typography>
                <Typography>Activity: {formatCurrency(structureSummary.activity)}</Typography>
                <Typography>Transport: {formatCurrency(structureSummary.transport)}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography sx={{ fontWeight: 700 }}>Total Annual: {formatCurrency(structureSummary.totalAnnual)}</Typography>
                <Typography>Per Quarter: {formatCurrency(structureSummary.quarterly)}</Typography>
              </Paper>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStructureDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={saveStructure} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent><Typography>Are you sure you want to delete this fee structure?</Typography></DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={deleteStructure}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={classDialogOpen} onClose={() => setClassDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Fees for One Class</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select value={classGenerateForm.classId} label="Class" onChange={(e) => setClassGenerateForm((p) => ({ ...p, classId: e.target.value }))}>
                  {classes.map((cls) => <MenuItem key={cls._id} value={cls._id}>{getClassLabel(cls)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select value={classGenerateForm.academicYear} label="Academic Year" onChange={(e) => setClassGenerateForm((p) => ({ ...p, academicYear: e.target.value }))}>
                  {ACADEMIC_YEARS.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Fee Types</InputLabel>
                <Select
                  multiple
                  value={classGenerateForm.feeTypes}
                  label="Fee Types"
                  onChange={(e) => setClassGenerateForm((p) => ({ ...p, feeTypes: e.target.value }))}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {FEE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select value={classGenerateForm.quarter} label="Quarter" onChange={(e) => setClassGenerateForm((p) => ({ ...p, quarter: e.target.value }))}>
                  {QUARTERS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Custom Amount (Optional)"
                type="number"
                value={classGenerateForm.customAmount}
                onChange={(e) => setClassGenerateForm((p) => ({ ...p, customAmount: e.target.value }))}
                helperText="Overrides fee structure amount for everyone in this batch"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClassDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                confirmAndGenerate({
                  endpoint: "/fees/generate/class",
                  payload: {
                    ...classGenerateForm,
                    customAmount: classGenerateForm.customAmount === "" ? undefined : Number(classGenerateForm.customAmount),
                  },
                  successMessage: "Class fee generation completed",
                })
              }
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={schoolDialogOpen} onClose={() => setSchoolDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Fees for Whole School</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select value={schoolGenerateForm.academicYear} label="Academic Year" onChange={(e) => setSchoolGenerateForm((p) => ({ ...p, academicYear: e.target.value }))}>
                  {ACADEMIC_YEARS.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Fee Types</InputLabel>
                <Select
                  multiple
                  value={schoolGenerateForm.feeTypes}
                  label="Fee Types"
                  onChange={(e) => setSchoolGenerateForm((p) => ({ ...p, feeTypes: e.target.value }))}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {FEE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select value={schoolGenerateForm.quarter} label="Quarter" onChange={(e) => setSchoolGenerateForm((p) => ({ ...p, quarter: e.target.value }))}>
                  {QUARTERS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Custom Amount (Optional)"
                type="number"
                value={schoolGenerateForm.customAmount}
                onChange={(e) => setSchoolGenerateForm((p) => ({ ...p, customAmount: e.target.value }))}
                helperText="Overrides fee structure amount for every generated record"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSchoolDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                confirmAndGenerate({
                  endpoint: "/fees/generate/school",
                  payload: {
                    ...schoolGenerateForm,
                    customAmount: schoolGenerateForm.customAmount === "" ? undefined : Number(schoolGenerateForm.customAmount),
                  },
                  successMessage: "School-wide fee generation completed",
                })
              }
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={rangeDialogOpen} onClose={() => setRangeDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Fees for Class Range</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField label="From Class" type="number" value={rangeGenerateForm.fromClass} onChange={(e) => setRangeGenerateForm((p) => ({ ...p, fromClass: e.target.value }))} fullWidth />
              <TextField label="To Class" type="number" value={rangeGenerateForm.toClass} onChange={(e) => setRangeGenerateForm((p) => ({ ...p, toClass: e.target.value }))} fullWidth />
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select value={rangeGenerateForm.academicYear} label="Academic Year" onChange={(e) => setRangeGenerateForm((p) => ({ ...p, academicYear: e.target.value }))}>
                  {ACADEMIC_YEARS.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Fee Types</InputLabel>
                <Select
                  multiple
                  value={rangeGenerateForm.feeTypes}
                  label="Fee Types"
                  onChange={(e) => setRangeGenerateForm((p) => ({ ...p, feeTypes: e.target.value }))}
                  renderValue={(selected) => selected.join(", ")}
                >
                  {FEE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select value={rangeGenerateForm.quarter} label="Quarter" onChange={(e) => setRangeGenerateForm((p) => ({ ...p, quarter: e.target.value }))}>
                  {QUARTERS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField
                label="Custom Amount (Optional)"
                type="number"
                value={rangeGenerateForm.customAmount}
                onChange={(e) => setRangeGenerateForm((p) => ({ ...p, customAmount: e.target.value }))}
                helperText="Overrides fee structure amount for all selected classes"
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRangeDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() =>
                confirmAndGenerate({
                  endpoint: "/fees/generate/range",
                  payload: {
                    ...rangeGenerateForm,
                    fromClass: Number(rangeGenerateForm.fromClass),
                    toClass: Number(rangeGenerateForm.toClass),
                    customAmount: rangeGenerateForm.customAmount === "" ? undefined : Number(rangeGenerateForm.customAmount),
                  },
                  successMessage: "Class-range fee generation completed",
                })
              }
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={studentDialogOpen} onClose={() => setStudentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Generate Fee for One Student</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <Autocomplete
                options={students}
                value={students.find((s) => s._id === studentGenerateForm.studentId) || null}
                isOptionEqualToValue={(option, value) => option._id === value._id}
                getOptionLabel={getStudentOptionLabel}
                onChange={(_event, selected) =>
                  setStudentGenerateForm((prev) => ({
                    ...prev,
                    studentId: selected?._id || "",
                  }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Student"
                    placeholder="Type name or admission number"
                  />
                )}
              />
              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>
                <Select value={studentGenerateForm.academicYear} label="Academic Year" onChange={(e) => setStudentGenerateForm((p) => ({ ...p, academicYear: e.target.value }))}>
                  {ACADEMIC_YEARS.map((year) => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Fee Type</InputLabel>
                <Select value={studentGenerateForm.feeType} label="Fee Type" onChange={(e) => setStudentGenerateForm((p) => ({ ...p, feeType: e.target.value }))}>
                  {FEE_TYPES.map((type) => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Quarter (Optional)</InputLabel>
                <Select value={studentGenerateForm.quarter} label="Quarter (Optional)" onChange={(e) => setStudentGenerateForm((p) => ({ ...p, quarter: e.target.value }))}>
                  <MenuItem value="">None</MenuItem>
                  {QUARTERS.map((q) => <MenuItem key={q} value={q}>{q}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Amount" type="number" value={studentGenerateForm.amount} onChange={(e) => setStudentGenerateForm((p) => ({ ...p, amount: e.target.value }))} fullWidth />
              <TextField label="Due Date" type="date" value={studentGenerateForm.dueDate} onChange={(e) => setStudentGenerateForm((p) => ({ ...p, dueDate: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth />
              <TextField label="Description" value={studentGenerateForm.description} onChange={(e) => setStudentGenerateForm((p) => ({ ...p, description: e.target.value }))} fullWidth />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStudentDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={!studentGenerateForm.studentId}
              onClick={() =>
                confirmAndGenerate({
                  endpoint: "/fees/generate/student",
                  payload: {
                    ...studentGenerateForm,
                    amount: Number(studentGenerateForm.amount || 0),
                  },
                  successMessage: "Student fee record created",
                })
              }
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
            >
              Generate
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={collectPaymentOpen} onClose={() => setCollectPaymentOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <Paper sx={{ p: 2, bgcolor: "#F5F5F5", border: "1px solid #E0E0E0" }}>
                <Typography variant="body2"><strong>Student:</strong> {selectedRecord?.studentName || "-"}</Typography>
                <Typography variant="body2"><strong>Class:</strong> {selectedRecord?.classLabel || "-"}</Typography>
                <Typography variant="body2"><strong>Fee:</strong> {selectedRecord?.quarter ? `${selectedRecord?.quarter} ` : ""}{selectedRecord?.feeType} Fee</Typography>
                <Typography variant="body2"><strong>Total:</strong> {formatCurrency(selectedRecord?.totalAmount || 0)}</Typography>
                <Typography variant="body2"><strong>Paid:</strong> {formatCurrency(selectedRecord?.paidAmount || 0)}</Typography>
                <Typography variant="body2"><strong>Due:</strong> {formatCurrency(selectedDue)}</Typography>
                <Typography variant="body2"><strong>Due Date:</strong> {selectedRecord?.dueDateView || "-"}</Typography>

                {latePreview.lateDays > 0 && (
                  <Box sx={{ mt: 1.5, p: 1.25, bgcolor: "#FFF3E0", border: "1px solid #FFCC80", borderRadius: 1 }}>
                    <Typography variant="body2" sx={{ color: "#E65100", display: "flex", alignItems: "center", gap: 0.75 }}>
                      <WarningAmberRoundedIcon fontSize="small" /> Payment is {latePreview.lateDays} days late
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#E65100" }}>
                      Late Fee: {formatCurrency(latePreview.lateFeeAmount)} ({latePreview.lateDays} days x {formatCurrency(selectedRecord?.lateFeePerDay || 50)})
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
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                inputProps={{ min: 1, max: totalPayable }}
                helperText={`Total payable including late fee: ${formatCurrency(totalPayable)}`}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  label="Payment Method"
                  value={paymentForm.method}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
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

              {(paymentForm.method === "Cheque" || paymentForm.method === "DD") && (
                <>
                  <TextField
                    label="Cheque Number"
                    required
                    value={paymentForm.chequeNumber}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, chequeNumber: e.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label="Bank Name"
                    required
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, bankName: e.target.value }))}
                    fullWidth
                  />
                </>
              )}

              {(paymentForm.method === "UPI" || paymentForm.method === "Bank Transfer") && (
                <TextField
                  label="Transaction ID"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                  fullWidth
                />
              )}

              <TextField
                label="Payment Date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Note"
                placeholder="e.g. 1st installment, partial payment"
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, note: e.target.value }))}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCollectPaymentOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleRecordPayment}
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
            >
              Record Payment
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={paymentHistoryOpen} onClose={() => setPaymentHistoryOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>View Ledger</DialogTitle>
          <DialogContent>
            {historyLoading ? (
              <Typography sx={{ py: 3 }}>Loading payment history...</Typography>
            ) : historyRows.length === 0 ? (
              <Typography sx={{ py: 3 }} color="text.secondary">No payments recorded for this fee record.</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount ₹</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Receipt No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Late Fee ₹</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Note</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyRows.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{payment.paymentDate ? String(payment.paymentDate).slice(0, 10) : "-"}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={payment.method || "-"} color="error" variant="outlined" />
                      </TableCell>
                      <TableCell>{payment.receiptNumber || "-"}</TableCell>
                      <TableCell>{formatCurrency(payment.lateFeeAmount || 0)}</TableCell>
                      <TableCell>{payment.note || "-"}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => openReceipt(payment._id)}
                            sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none" }}
                          >
                            Print Receipt
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDeletePayment(payment._id)}
                            sx={{ textTransform: "none" }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentHistoryOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <PrintDialog open={demandSlipOpen} onClose={() => setDemandSlipOpen(false)} title="Demand Slip">
          {demandSlipLoading ? (
            <Box sx={{ p: 4 }}>
              <Typography>Loading demand slip...</Typography>
            </Box>
          ) : (
            <DemandSlip data={demandSlipData} />
          )}
        </PrintDialog>

        <PrintDialog open={receiptOpen} onClose={() => setReceiptOpen(false)} title="Payment Receipt">
          {receiptLoading ? (
            <Box sx={{ p: 4 }}>
              <Typography>Loading receipt...</Typography>
            </Box>
          ) : (
            <PaymentReceipt payment={receiptData} />
          )}
        </PrintDialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3500}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </AdminLayout>
  );
};

export default AdminFees;
