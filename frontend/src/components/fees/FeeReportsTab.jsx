import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CurrencyRupeeRoundedIcon from "@mui/icons-material/CurrencyRupeeRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { DataGrid } from "@mui/x-data-grid";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../../services/authService";
import { exportToCSV } from "../../utils/exportCSV";

const formatCurrency = (amount = 0) =>
  `\u20b9${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const formatCompactINR = (amount = 0) => {
  const value = Number(amount || 0);
  if (value >= 10000000) return `\u20b9${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `\u20b9${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `\u20b9${(value / 1000).toFixed(1)}K`;
  return `\u20b9${value.toFixed(0)}`;
};

const summaryCardsConfig = [
  { key: "totalExpected", label: "Total Expected", icon: AccountBalanceWalletRoundedIcon, bg: "#E3F2FD", color: "#1565C0" },
  { key: "totalCollected", label: "Total Collected", icon: PaymentsRoundedIcon, bg: "#E8F5E9", color: "#2E7D32" },
  { key: "totalDue", label: "Total Due", icon: CurrencyRupeeRoundedIcon, bg: "#FFEBEE", color: "#D32F2F" },
  { key: "todayCollection", label: "Today's Collection", icon: CalendarMonthRoundedIcon, bg: "#E0F2F1", color: "#00695C" },
  { key: "thisMonthCollection", label: "This Month", icon: CalendarMonthRoundedIcon, bg: "#F3E5F5", color: "#6A1B9A" },
  { key: "defaultersCount", label: "Defaulters Count", icon: WarningAmberRoundedIcon, bg: "#FFF3E0", color: "#EF6C00", isCount: true },
];

const pieColors = {
  Tuition: "#1976D2",
  Uniform: "#7B1FA2",
  Admission: "#2E7D32",
  Activity: "#EF6C00",
  Transport: "#00897B",
  Fine: "#D32F2F",
  Miscellaneous: "#757575",
};

const getProgressColor = (value) => {
  if (value >= 75) return "success";
  if (value >= 50) return "warning";
  return "error";
};

const FeeReportsTab = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [classWise, setClassWise] = useState([]);
  const [feeTypeWise, setFeeTypeWise] = useState([]);
  const [quarterWise, setQuarterWise] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [error, setError] = useState("");
  const [exportLoading, setExportLoading] = useState("");

  const [classFilter, setClassFilter] = useState("All");
  const [quarterFilter, setQuarterFilter] = useState("All");
  const [minDueFilter, setMinDueFilter] = useState("0");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, monthlyRes, classRes, feeTypeRes, quarterRes, defaultersRes] =
        await Promise.all([
          API.get("/fees/reports/summary"),
          API.get("/fees/reports/monthly"),
          API.get("/fees/reports/class-wise"),
          API.get("/fees/reports/feetype-wise"),
          API.get("/fees/reports/quarter-wise"),
          API.get("/fees/reports/defaulters"),
        ]);

      setSummary(summaryRes.data || {});
      setMonthly(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
      setClassWise(
        (Array.isArray(classRes.data) ? classRes.data : []).map((row) => ({
          ...row,
          classLabel: `${row.className || "Class"}-${row.section || "-"}`,
        })),
      );
      setFeeTypeWise(Array.isArray(feeTypeRes.data) ? feeTypeRes.data : []);
      setQuarterWise(Array.isArray(quarterRes.data) ? quarterRes.data : []);
      setDefaulters(Array.isArray(defaultersRes.data) ? defaultersRes.data : []);
    } catch (fetchError) {
      setError(fetchError?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredDefaulters = useMemo(() => {
    return defaulters
      .filter((row) => classFilter === "All" || row.className === classFilter)
      .filter((row) => {
        if (quarterFilter === "All") return true;
        return Array.isArray(row.dueRecords)
          ? row.dueRecords.some((r) => r.quarter === quarterFilter)
          : false;
      })
      .filter((row) => Number(row.totalDue || 0) >= Number(minDueFilter || 0))
      .map((row, index) => ({
        ...row,
        id: row.studentId || `${row.admissionNo}-${index}`,
        rank: index + 1,
      }));
  }, [defaulters, classFilter, quarterFilter, minDueFilter]);

  const quarterTotals = useMemo(() => {
    return quarterWise.reduce(
      (acc, row) => ({
        totalExpected: acc.totalExpected + Number(row.totalExpected || 0),
        totalCollected: acc.totalCollected + Number(row.totalCollected || 0),
        totalDue: acc.totalDue + Number(row.totalDue || 0),
      }),
      { totalExpected: 0, totalCollected: 0, totalDue: 0 },
    );
  }, [quarterWise]);

  const quarterTotalPercent =
    quarterTotals.totalExpected > 0
      ? (quarterTotals.totalCollected / quarterTotals.totalExpected) * 100
      : 0;

  const handleExport = async (type, filename) => {
    try {
      setExportLoading(type);
      const res = await API.get(`/fees/reports/export`, { params: { type } });
      exportToCSV(Array.isArray(res.data) ? res.data : [], filename);
    } catch {
      setError("Failed to export CSV");
    } finally {
      setExportLoading("");
    }
  };

  const defaulterColumns = [
    { field: "rank", headerName: "Rank", width: 80 },
    { field: "studentName", headerName: "Student Name", minWidth: 170, flex: 1 },
    { field: "admissionNo", headerName: "Admission No", width: 130 },
    { field: "className", headerName: "Class", width: 120 },
    {
      field: "parentPhone",
      headerName: "Parent Phone",
      width: 150,
      renderCell: (params) => (
        <a href={`tel:${params.value || ""}`} style={{ color: "#D32F2F", textDecoration: "none", fontWeight: 600 }}>
          {params.value || "-"}
        </a>
      ),
    },
    {
      field: "totalDue",
      headerName: "Total Due",
      width: 140,
      valueFormatter: (params) => formatCurrency(params.value),
      renderCell: (params) => (
        <Typography sx={{ color: "#D32F2F", fontWeight: 700 }}>
          {formatCurrency(params.value)}
        </Typography>
      ),
    },
    {
      field: "overdueAmount",
      headerName: "Overdue Amount",
      width: 150,
      valueFormatter: (params) => formatCurrency(params.value),
    },
    {
      field: "lastPaymentDate",
      headerName: "Last Payment",
      width: 140,
      valueGetter: (_value, row) =>
        row.lastPaymentDate ? String(row.lastPaymentDate).slice(0, 10) : "Never paid",
    },
    {
      field: "daysSinceLastPayment",
      headerName: "Days Overdue",
      width: 130,
      valueGetter: (_value, row) => row.daysSinceLastPayment ?? "-",
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {error ? <Alert severity="error">{error}</Alert> : null}

      <Grid container spacing={2}>
        {summaryCardsConfig.map((card) => {
          const Icon = card.icon;
          const value = summary?.[card.key] ?? 0;
          return (
            <Grid item xs={12} md={4} key={card.key}>
              <Card sx={{ background: card.bg, border: "1px solid #f4c3c3" }}>
                <CardContent>
                  {loading ? (
                    <Skeleton variant="rectangular" height={90} />
                  ) : (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" sx={{ color: "#555", fontWeight: 600 }}>
                          {card.label}
                        </Typography>
                        <Typography variant="h5" sx={{ color: card.color, fontWeight: 800 }}>
                          {card.isCount ? Number(value || 0) : formatCurrency(value)}
                        </Typography>
                        {card.key === "totalCollected" ? (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {summary?.trend === "up" ? (
                              <TrendingUpRoundedIcon sx={{ color: "#2E7D32", fontSize: 18 }} />
                            ) : (
                              <TrendingDownRoundedIcon sx={{ color: "#D32F2F", fontSize: 18 }} />
                            )}
                            <Typography variant="caption" sx={{ color: "#666" }}>
                              vs last month
                            </Typography>
                          </Stack>
                        ) : null}
                      </Box>
                      <Icon sx={{ fontSize: 36, color: card.color }} />
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            {loading ? (
              <Skeleton variant="circular" width={200} height={200} sx={{ mx: "auto" }} />
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", position: "relative" }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={190}
                  thickness={4}
                  sx={{ color: "#F1F1F1", position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)" }}
                />
                <CircularProgress
                  variant="determinate"
                  value={Number(summary?.collectionPercent || 0)}
                  size={190}
                  thickness={7}
                  color={getProgressColor(Number(summary?.collectionPercent || 0))}
                />
                <Box sx={{ position: "absolute", top: 65, textAlign: "center" }}>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "#D32F2F" }}>
                    {Number(summary?.collectionPercent || 0).toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    of annual target collected
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {loading ? (
              <Stack spacing={1}>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography sx={{ color: "#2E7D32", fontWeight: 700 }}>
                  PAID: {summary?.paidCount || 0} records
                </Typography>
                <Typography sx={{ color: "#ED6C02", fontWeight: 700 }}>
                  PARTIAL: {summary?.partialCount || 0} records
                </Typography>
                <Typography sx={{ color: "#1565C0", fontWeight: 700 }}>
                  DUE: {summary?.dueCount || 0} records
                </Typography>
                <Typography sx={{ color: "#D32F2F", fontWeight: 700 }}>
                  OVERDUE: {summary?.overdueCount || 0} records
                </Typography>
              </Stack>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F", mb: 2 }}>
          Monthly Collection Trend
        </Typography>
        <Box sx={{ height: 320 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={320} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatCompactINR} />
                <Tooltip
                  formatter={(value, _name, payload) => [
                    `${formatCurrency(value)} (${payload?.payload?.paymentCount || 0} payments)`,
                    payload?.payload?.month || "Month",
                  ]}
                />
                <Area type="monotone" dataKey="amount" stroke="#D32F2F" fill="#D32F2F" fillOpacity={0.3} strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={7}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F", mb: 2 }}>
              Class-wise Collection
            </Typography>
            <Box sx={{ height: 340 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={340} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classWise} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="classLabel"
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis tickFormatter={formatCompactINR} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="totalCollected" name="Collected" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalDue" name="Due" fill="#D32F2F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} lg={5}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F", mb: 2 }}>
              Fee Type Distribution
            </Typography>
            <Box sx={{ height: 290 }}>
              {loading ? (
                <Skeleton variant="rectangular" height={290} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeTypeWise}
                      dataKey="totalCollected"
                      nameKey="feeType"
                      innerRadius={55}
                      outerRadius={95}
                      label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {feeTypeWise.map((entry) => (
                        <Cell key={entry.feeType} fill={pieColors[entry.feeType] || "#9E9E9E"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Box>
            <Grid container spacing={1}>
              {feeTypeWise.map((row) => (
                <Grid item xs={6} key={row.feeType}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: pieColors[row.feeType] || "#9E9E9E" }} />
                    <Typography variant="caption">{row.feeType}</Typography>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F", mb: 2 }}>
          Quarter Wise Collection
        </Typography>
        {loading ? (
          <Skeleton variant="rectangular" height={260} />
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                <TableCell sx={{ fontWeight: 700 }}>Quarter</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Expected</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Collected</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Due</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Collection %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quarterWise.map((row, index) => (
                <TableRow key={row.quarter} sx={{ bgcolor: index % 2 ? "#FFF9F9" : "#FFFFFF" }}>
                  <TableCell>{row.quarter}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell align="right">{formatCurrency(row.totalExpected)}</TableCell>
                  <TableCell align="right">{formatCurrency(row.totalCollected)}</TableCell>
                  <TableCell align="right" sx={{ color: "#D32F2F", fontWeight: 700 }}>
                    {formatCurrency(row.totalDue)}
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 220 }}>
                    <LinearProgress
                      variant="determinate"
                      value={Number(row.collectionPercent || 0)}
                      color={getProgressColor(Number(row.collectionPercent || 0))}
                      sx={{ height: 10, borderRadius: 5, mb: 0.5 }}
                    />
                    <Typography variant="caption">{Number(row.collectionPercent || 0).toFixed(1)}%</Typography>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: "#FFEBEE" }}>
                <TableCell colSpan={2} sx={{ fontWeight: 800 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(quarterTotals.totalExpected)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>{formatCurrency(quarterTotals.totalCollected)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#D32F2F" }}>{formatCurrency(quarterTotals.totalDue)}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>{quarterTotalPercent.toFixed(1)}%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <WarningAmberRoundedIcon sx={{ color: "#EF6C00" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F" }}>
              Fee Defaulters
            </Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} className="no-print">
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Class</InputLabel>
              <Select value={classFilter} label="Class" onChange={(e) => setClassFilter(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                {[...new Set(defaulters.map((row) => row.className).filter(Boolean))].map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Quarter</InputLabel>
              <Select value={quarterFilter} label="Quarter" onChange={(e) => setQuarterFilter(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                <MenuItem value="Q1">Q1</MenuItem>
                <MenuItem value="Q2">Q2</MenuItem>
                <MenuItem value="Q3">Q3</MenuItem>
                <MenuItem value="Q4">Q4</MenuItem>
                <MenuItem value="Annual">Annual</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Min Due</InputLabel>
              <Select value={minDueFilter} label="Min Due" onChange={(e) => setMinDueFilter(e.target.value)}>
                <MenuItem value="0">\u20b90+</MenuItem>
                <MenuItem value="1000">\u20b91,000+</MenuItem>
                <MenuItem value="5000">\u20b95,000+</MenuItem>
                <MenuItem value="10000">\u20b910,000+</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
        <Box sx={{ height: 500 }}>
          {loading ? (
            <Skeleton variant="rectangular" height={500} />
          ) : (
            <DataGrid
              rows={filteredDefaulters}
              columns={defaulterColumns}
              disableRowSelectionOnClick
              pageSizeOptions={[10, 20, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              getRowClassName={(params) => (params.row.rank <= 3 ? "top-defaulter-row" : "")}
              sx={{
                "& .top-defaulter-row": {
                  backgroundColor: "#FFF3E0",
                },
              }}
            />
          )}
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5 }} className="no-print">
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            color="error"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={() => handleExport("summary", "fee_summary")}
            disabled={exportLoading === "summary"}
          >
            Export Summary CSV
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={() => handleExport("class-wise", "fee_class_wise")}
            disabled={exportLoading === "class-wise"}
          >
            Export Class-wise CSV
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={() => handleExport("defaulters", "fee_defaulters")}
            disabled={exportLoading === "defaulters"}
          >
            Export Defaulters CSV
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<FileDownloadRoundedIcon />}
            onClick={() => handleExport("payments", "fee_all_payments")}
            disabled={exportLoading === "payments"}
          >
            Export All Payments CSV
          </Button>
          <Button variant="contained" color="error" startIcon={<PrintRoundedIcon />} onClick={() => window.print()}>
            Print Report
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default FeeReportsTab;
