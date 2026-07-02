import { useEffect, useMemo, useCallback, useState } from "react";
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
  CircularProgress,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { DataGrid } from "@mui/x-data-grid";
import AdminLayout from "../../components/AdminLayout";
import DemandSlip from "../../components/fees/DemandSlip";
import PaymentReceipt from "../../components/fees/PaymentReceipt";
import PrintDialog from "../../components/fees/PrintDialog";
import FeeReportsTab from "../../components/fees/FeeReportsTab";
import PaymentModal from "../../components/fees/PaymentModal";
import PaymentLedger from "../../components/fees/PaymentLedger";
import BulkPaymentModal from "../../components/fees/BulkPaymentModal";
import FeeDiscountDialog from "../../components/fees/FeeDiscountDialog";
import FeeRolloverDialog from "../../components/fees/FeeRolloverDialog";
import FeeImportDialog from "../../components/fees/FeeImportDialog";
import API from "../../services/authService";

const ACADEMIC_YEARS = Array.from({ length: 11 }, (_, i) => {
  const start = 2024 + i;
  const end = start + 1;
  return `${start}-${String(end).slice(2)}`;
});
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

const getDefaultDueDates = (academicYear = "2025-26") => {
  const startYear = Number((academicYear || "2025-26").split("-")[0]);
  return {
    q1DueDate: `${startYear}-04-10`,
    q2DueDate: `${startYear}-07-10`,
    q3DueDate: `${startYear}-10-10`,
    q4DueDate: `${startYear + 1}-01-10`,
  };
};

const emptyStructureForm = {
  classId: "",
  academicYear: "2025-26",
  tuitionFee: "",
  admissionFee: 0,
  uniformFee: 0,
  activityFee: 0,
  transportFee: 0,
  lateFeePerDay: 50,
  ...getDefaultDueDates("2025-26"),
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const AdminFees = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [yearFilter, setYearFilter] = useState("2025-26");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

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
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPaymentLoading, setEditPaymentLoading] = useState(false);
  const [bulkPaymentOpen, setBulkPaymentOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [discountTarget, setDiscountTarget] = useState(null);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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

  const [classGenerateForm, setClassGenerateForm] = useState({
    classId: "",
    academicYear: "2025-26",
    feeTypes: ["Tuition"],
    quarter: "Q1",
    customAmount: "",
  });
  const [schoolGenerateForm, setSchoolGenerateForm] = useState({
    academicYear: "2025-26",
    feeTypes: ["Tuition"],
    quarter: "Q1",
    customAmount: "",
  });
  const [rangeGenerateForm, setRangeGenerateForm] = useState({
    fromClass: "1",
    toClass: "10",
    academicYear: "2025-26",
    feeTypes: ["Tuition"],
    quarter: "Q1",
    customAmount: "",
  });
  const [studentGenerateForm, setStudentGenerateForm] = useState({
    studentId: "",
    academicYear: "2025-26",
    feeType: "Miscellaneous",
    quarter: "",
    amount: "",
    dueDate: todayStr(),
    description: "",
  });

  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [recordPage, setRecordPage] = useState(0);
  const [recordPageSize, setRecordPageSize] = useState(10);
  const [recordRowCount, setRecordRowCount] = useState(0);
  const [recordClassFilter, setRecordClassFilter] = useState("");
  const [recordAcademicYearFilter, setRecordAcademicYearFilter] = useState("2025-26");
  const [recordQuarterFilter, setRecordQuarterFilter] = useState("All");
  const [recordStatusFilter, setRecordStatusFilter] = useState("All");
  const [recordFeeTypeFilter, setRecordFeeTypeFilter] = useState("All");
  const [recordSearchFilter, setRecordSearchFilter] = useState("");
  const [debouncedRecordSearch, setDebouncedRecordSearch] = useState("");

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
    if (studentsLoaded) return;
    try {
      setLoadingStudents(true);
      const res = await API.get("/students", { params: { limit: 500 } });
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
      setStudents(list);
      setStudentsLoaded(true);
    } catch {
      showSnackbar("Failed to fetch students", "error");
    } finally {
      setLoadingStudents(false);
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
      setRecordRowCount(0);
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
      if (debouncedRecordSearch.trim()) params.search = debouncedRecordSearch.trim();
      params.page = recordPage + 1;
      params.limit = recordPageSize;

      const endpoint =
        recordClassFilter === "all" ? "/fees" : `/fees/class/${recordClassFilter}`;
      const res = await API.get(endpoint, { params });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
      setRecords(list);
      setRecordRowCount(Number(res.data?.pagination?.total || list.length || 0));
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
    setCollectPaymentOpen(true);
  };

  const openPaymentHistory = async (record) => {
    setSelectedRecord(record);
    setPaymentHistoryOpen(true);
    try {
      setHistoryLoading(true);
      const res = await API.get(`/fees/receipt/student/${record.studentId?._id}`, {
        params: { feeRecordId: record._id },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
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

  const handleEditPayment = async (paymentId, paymentData) => {
    if (!selectedRecord?._id) return;
    try {
      setEditPaymentLoading(true);
      const res = await API.patch(`/fees/payment/${selectedRecord._id}/${paymentId}`, paymentData);
      showSnackbar("Payment updated successfully", "success");
      setEditPaymentOpen(false);
      setEditingPayment(null);
      await openPaymentHistory(selectedRecord);
      await Promise.all([fetchRecords(), fetchTodayCollection()]);
    } catch (error) {
      showSnackbar(error?.response?.data?.message || "Failed to update payment", "error");
    } finally {
      setEditPaymentLoading(false);
    }
  };

  const handlePaymentAdded = async (paymentData) => {
    if (!selectedRecord?._id) return;
    const payload = {
      feeRecordId: selectedRecord._id,
      ...paymentData,
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

  const openEditPayment = (payment) => {
    setEditingPayment(payment);
    setEditPaymentOpen(true);
  };

  useEffect(() => {
    fetchClasses();
    fetchStructures();
    fetchTodayCollection();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedRecordSearch(recordSearchFilter);
    }, 350);

    return () => clearTimeout(handle);
  }, [recordSearchFilter]);

  useEffect(() => {
    setRecordPage(0);
  }, [
    recordClassFilter,
    recordAcademicYearFilter,
    recordQuarterFilter,
    recordStatusFilter,
    recordFeeTypeFilter,
    debouncedRecordSearch,
  ]);

  useEffect(() => {
    if (currentTab === 2) fetchRecords();
  }, [
    currentTab,
    recordClassFilter,
    recordAcademicYearFilter,
    recordQuarterFilter,
    recordStatusFilter,
    recordFeeTypeFilter,
    debouncedRecordSearch,
    recordPage,
    recordPageSize,
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
      const data = res.data || {};
      const summary = ` Created: ${data.created || 0}, Skipped: ${data.skipped || 0}`;

      let message = `${successMessage}.${summary}`;
      if (data.message) message = data.message + summary;
      if (data.errors?.length) {
        const errorList = data.errors.map((e) => `  ${e.class}: ${e.error}`).join("\n");
        message += `\nErrors:\n${errorList}`;
        showSnackbar(message, "warning");
      } else {
        showSnackbar(message, data.created > 0 ? "success" : "info");
      }
      setClassDialogOpen(false);
      setSchoolDialogOpen(false);
      setRangeDialogOpen(false);
      setStudentDialogOpen(false);
      if (currentTab === 2) fetchRecords();
    } catch (error) {
      const errData = error?.response?.data;
      let backendMessage = errData?.message || "Failed to generate fee records";
      if (errData?.errors?.length) {
        const errorList = errData.errors.map((e) => `  ${e.class}: ${e.error}`).join("\n");
        backendMessage += `\n${errorList}`;
      }
      showSnackbar(backendMessage, "error");
    }
  };

  const openStudentGenerateDialog = async () => {
    await fetchStudents();
    setStudentDialogOpen(true);
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

  const rows = useMemo(
    () =>
      records.map((r) => {
        const studentName = r.studentId?.userId?.name || "N/A";
        const admissionNo = r.studentId?.admissionNumber || "-";
        const classLabel = getClassLabel(r.classId);
        const netAmt = Number(r.netAmount || r.totalAmount || 0);
        const dueAmount = Math.max(0, netAmt - Number(r.paidAmount || 0));

        return {
          ...r,
          id: r._id,
          studentName,
          admissionNo,
          classLabel,
          netAmount: netAmt,
          dueAmount,
          dueDateView: r.dueDate ? String(r.dueDate).slice(0, 10) : "-",
        };
      }),
    [records],
  );

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
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: "discount",
      headerName: "Disc",
      width: 90,
      renderCell: (params) => {
        const r = params.row;
        if (r.discountType && r.discountType !== "none") {
          const ds = r.discountType === "percentage" ? `${r.discountValue}%` : `₹${r.discountValue}`;
          return <Chip label={ds} size="small" sx={{ bgcolor: "#E3F2FD", color: "#1565C0", fontWeight: "bold" }} />;
        }
        return <Typography variant="caption" color="text.disabled">—</Typography>;
      },
    },
    {
      field: "netAmount",
      headerName: "Net ₹",
      width: 100,
      valueFormatter: (value, row) => formatCurrency(row.netAmount || row.totalAmount),
    },
    {
      field: "paidAmount",
      headerName: "Paid ₹",
      width: 100,
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: "dueAmount",
      headerName: "Due ₹",
      width: 100,
      valueFormatter: (value) => formatCurrency(value),
    },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => {
        const status = params.value || "DUE";
        const map = {
          PAID: { bg: "#E8F5E9", color: "#2E7D32" },
          PARTIAL: { bg: "#FFF8E1", color: "#F57F17" },
          DUE: { bg: "#FFEBEE", color: "#C62828" },
          OVERDUE: { bg: "#FCE4EC", color: "#880E4F" },
        };
        const s = map[status] || map.DUE;
        return <Chip label={status} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: "bold" }} />;
      },
    },
    { field: "dueDateView", headerName: "Due Date", width: 110 },
    {
      field: "actions",
      headerName: "Actions",
      width: 280,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, py: 0.75, width: "100%" }}>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Button size="small" variant="outlined" color="error" onClick={() => openDemandSlip(params.row.studentId?._id)}
              sx={{ textTransform: "none", flex: 1, fontSize: 11 }}>Slip</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => openPaymentHistory(params.row)}
              sx={{ textTransform: "none", flex: 1, fontSize: 11 }}>Ledger</Button>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {Number(params.row?.dueAmount || 0) > 0 ? (
              <Button size="small" variant="contained" onClick={() => openCollectPayment(params.row)}
                sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none", flex: 1, fontSize: 11 }}>
                Pay
              </Button>
            ) : (
              <Chip label="✓ PAID" size="small" sx={{ bgcolor: "#E8F5E9", color: "#2E7D32", fontWeight: "bold", flex: 1 }} />
            )}
            <Button size="small" variant="outlined" color="info" onClick={() => { setDiscountTarget(params.row); setDiscountDialogOpen(true); }}
              sx={{ textTransform: "none", flex: 1, fontSize: 11, color: params.row.discountType && params.row.discountType !== "none" ? "#1565C0" : "#666", borderColor: params.row.discountType && params.row.discountType !== "none" ? "#90CAF9" : undefined }}>
              {params.row.discountType && params.row.discountType !== "none" ? "Edit Disc" : "Discount"}
            </Button>
          </Box>
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
      valueFormatter: (value) => formatCurrency(value),
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
          Tiny Kidz International School
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

        <Paper sx={{ mb: 2, p: 2, bgcolor: "#FAFAFA", border: "1px solid #E0E0E0" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#333" }}>
            Quick Start — New Academic Session
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Chip label="1. Set Fee Structure" size="small" color={currentTab === 0 ? "error" : "default"} variant={currentTab === 0 ? "filled" : "outlined"} />
            <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: "#999" }} />
            <Chip label="2. Generate Fee Records" size="small" color={currentTab === 1 ? "error" : "default"} variant={currentTab === 1 ? "filled" : "outlined"} />
            <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: "#999" }} />
            <Chip label="3. Collect Payments" size="small" color={currentTab === 2 ? "error" : "default"} variant={currentTab === 2 ? "filled" : "outlined"} />
            <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: "#999" }} />
            <Chip label="4. Track Defaulters" size="small" color={currentTab === 3 ? "error" : "default"} variant={currentTab === 3 ? "filled" : "outlined"} />
            <ArrowForwardRoundedIcon sx={{ fontSize: 14, color: "#999" }} />
            <Chip label="5. Reports" size="small" color={currentTab === 4 ? "error" : "default"} variant={currentTab === 4 ? "filled" : "outlined"} />
          </Box>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select value={yearFilter} label="Academic Year" onChange={(e) => setYearFilter(e.target.value)}>
                    {ACADEMIC_YEARS.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={openCreateStructureDialog} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none" }}>
                  + Set Structure
                </Button>
                <Button variant="outlined" color="error" onClick={() => setRolloverOpen(true)} sx={{ textTransform: "none" }}>
                  Rollover
                </Button>
                <Button variant="outlined" color="error" onClick={() => setImportOpen(true)} sx={{ textTransform: "none" }}>
                  Import CSV
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
                    <Button variant="contained" endIcon={<ArrowForwardRoundedIcon />} onClick={openStudentGenerateDialog} sx={openActionButtonSx}>
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: "#FFF5F5", borderRadius: 2, border: "1px solid #F2C7C7" }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F", mb: 1 }}>Quick Actions</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Already generated fee records? Skip to payment collection.</Typography>
              <Button variant="contained" onClick={() => setBulkPaymentOpen(true)} sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" }, textTransform: "none", mr: 2 }}>
                Bulk Payment Entry
              </Button>
            </Box>
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
                  rowHeight={112}
                  loading={loadingRecords}
                  disableRowSelectionOnClick
                  pageSizeOptions={[10, 20, 50]}
                  paginationMode="server"
                  rowCount={recordRowCount}
                  paginationModel={{ page: recordPage, pageSize: recordPageSize }}
                  onPaginationModelChange={(model) => {
                    setRecordPage(model.page);
                    setRecordPageSize(model.pageSize);
                  }}
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
              {loadingStudents && <Typography variant="body2">Loading students...</Typography>}
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

        <PaymentModal
          isOpen={collectPaymentOpen}
          fee={selectedRecord}
          onClose={() => setCollectPaymentOpen(false)}
          onPaymentAdded={handlePaymentAdded}
          loading={historyLoading}
        />

        <PaymentLedger
          isOpen={paymentHistoryOpen}
          feeSummary={{
            fee_id: selectedRecord?._id,
            fee_amount: selectedRecord?.totalAmount,
            total_paid: selectedRecord?.paidAmount,
            balance: Math.max(0, Number(selectedRecord?.totalAmount || 0) - Number(selectedRecord?.paidAmount || 0)),
            payment_status:
              Number(selectedRecord?.paidAmount || 0) >= Number(selectedRecord?.totalAmount || 0)
                ? "paid"
                : Number(selectedRecord?.paidAmount || 0) > 0
                  ? "partial"
                  : "unpaid",
            last_payment_date: historyRows[0]?.paymentDate || null,
          }}
          payments={historyRows}
          onClose={() => setPaymentHistoryOpen(false)}
          onEdit={(payment) => openEditPayment(payment)}
          onDelete={(paymentId) => handleDeletePayment(paymentId)}
          onAddMore={() => {
            setPaymentHistoryOpen(false);
            setCollectPaymentOpen(true);
          }}
          loading={historyLoading}
        />

        <Dialog open={editPaymentOpen} onClose={() => { setEditPaymentOpen(false); setEditingPayment(null); }} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Payment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Amount ₹"
                type="number"
                required
                value={editingPayment?.amount || ""}
                onChange={(e) => setEditingPayment((p) => p ? { ...p, amount: e.target.value } : null)}
                inputProps={{ min: 1 }}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  label="Payment Method"
                  value={editingPayment?.method || "Cash"}
                  onChange={(e) => setEditingPayment((p) => p ? { ...p, method: e.target.value } : null)}
                >
                  {PAYMENT_METHODS.map((method) => (
                    <MenuItem key={method} value={method}>{method}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Payment Date"
                type="date"
                value={editingPayment?.paymentDate ? String(editingPayment.paymentDate).slice(0, 10) : ""}
                onChange={(e) => setEditingPayment((p) => p ? { ...p, paymentDate: e.target.value } : null)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Note"
                value={editingPayment?.note || ""}
                onChange={(e) => setEditingPayment((p) => p ? { ...p, note: e.target.value } : null)}
                fullWidth
              />
              <TextField
                label="Reference Number"
                value={editingPayment?.receiptNumber || ""}
                onChange={(e) => setEditingPayment((p) => p ? { ...p, receiptNumber: e.target.value } : null)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setEditPaymentOpen(false); setEditingPayment(null); }}>Cancel</Button>
            <Button
              variant="contained"
              disabled={editPaymentLoading || !editingPayment?.amount || Number(editingPayment?.amount) < 1}
              onClick={() => {
                if (editingPayment) {
                  handleEditPayment(editingPayment._id, {
                    amount: Number(editingPayment.amount),
                    method: editingPayment.method,
                    paymentDate: editingPayment.paymentDate,
                    note: editingPayment.note,
                    referenceNumber: editingPayment.receiptNumber,
                  });
                }
              }}
              sx={{ bgcolor: "#D32F2F", "&:hover": { bgcolor: "#B71C1C" } }}
            >
              {editPaymentLoading ? <CircularProgress size={20} color="inherit" /> : "Update Payment"}
            </Button>
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

        <BulkPaymentModal
          isOpen={bulkPaymentOpen}
          onClose={() => setBulkPaymentOpen(false)}
          classes={classes}
          onComplete={() => { fetchRecords(); fetchTodayCollection(); }}
        />

        <FeeDiscountDialog
          isOpen={discountDialogOpen}
          onClose={() => { setDiscountDialogOpen(false); setDiscountTarget(null); }}
          feeRecord={discountTarget}
          onApplied={() => { fetchRecords(); }}
        />

        <FeeRolloverDialog
          isOpen={rolloverOpen}
          onClose={() => setRolloverOpen(false)}
          onComplete={() => fetchStructures()}
        />

        <FeeImportDialog
          isOpen={importOpen}
          onClose={() => setImportOpen(false)}
        />

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
