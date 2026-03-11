import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  AddCircle as AddCircleIcon,
  BarChart as BarChartIcon,
  Campaign as CampaignIcon,
  Class as ClassIcon,
  Dashboard as DashboardIcon,
  MenuBook as SubjectsIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { logout } from "../../redux/authSlice";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import API from "../../services/authService";

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/admin/dashboard" },
  { text: "Students", icon: <PeopleIcon />, path: "/admin/students" },
  { text: "Teachers", icon: <SchoolIcon />, path: "/admin/teachers" },
  { text: "Classes", icon: <ClassIcon />, path: "/admin/classes" },
  { text: "Subjects", icon: <SubjectsIcon />, path: "/admin/subjects" },
  { text: "Fees", icon: <PaymentIcon />, path: "/admin/fees" },
  { text: "Notices", icon: <CampaignIcon />, path: "/admin/notices" },
  { text: "Reports", icon: <BarChartIcon />, path: "/admin/reports" },
];

const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";

  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const activePath = location.pathname;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [overview, setOverview] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
  });

  const [feesSummary, setFeesSummary] = useState({
    totalFeeCollected: 0,
    totalDue: 0,
  });

  const [recentNotices, setRecentNotices] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          overviewResponse,
          feesResponse,
          noticesResponse,
          studentsResponse,
        ] = await Promise.all([
          API.get("/reports/overview"),
          API.get("/fees/summary"),
          API.get("/notices"),
          API.get("/students", { params: { page: 1, limit: 3 } }),
        ]);

        setOverview({
          totalStudents: overviewResponse?.data?.data?.totalStudents || 0,
          totalTeachers: overviewResponse?.data?.data?.totalTeachers || 0,
          totalClasses: overviewResponse?.data?.data?.totalClasses || 0,
        });

        setFeesSummary({
          totalFeeCollected: feesResponse?.data?.totalFeeCollected || 0,
          totalDue: feesResponse?.data?.totalDue || 0,
        });

        setRecentNotices((noticesResponse?.data?.data || []).slice(0, 3));
        setRecentStudents(studentsResponse?.data?.data || []);
      } catch (fetchError) {
        setError(
          fetchError?.response?.data?.message ||
            "Failed to load dashboard data",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.clear();
    navigate("/login");
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  const statCards = [
    {
      label: "Total Students",
      value: overview.totalStudents,
      icon: <PeopleIcon sx={{ color: "#1565C0", fontSize: 34 }} />,
    },
    {
      label: "Total Teachers",
      value: overview.totalTeachers,
      icon: <SchoolIcon sx={{ color: "#6A1B9A", fontSize: 34 }} />,
    },
    {
      label: "Total Classes",
      value: overview.totalClasses,
      icon: <ClassIcon sx={{ color: "#2E7D32", fontSize: 34 }} />,
    },
    {
      label: "Total Fee Collected",
      value: formatCurrency(feesSummary.totalFeeCollected),
      icon: <PaymentIcon sx={{ color: "#EF6C00", fontSize: 34 }} />,
    },
  ];

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#fafafa" }}
    >
      <Navbar onLogout={handleLogout} />

      <Sidebar
        menuItems={menuItems}
        activePath={activePath}
        onMenuClick={handleMenuClick}
      />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />

        <Typography
          variant="h4"
          sx={{ mb: 3, color: "#D32F2F", fontWeight: 700 }}
        >
          Admin Dashboard
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center" }}>
            <CircularProgress sx={{ color: "#D32F2F" }} />
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                mb: 3,
              }}
            >
              {statCards.map((card) => (
                <Card
                  key={card.label}
                  sx={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #f0f0f0",
                    borderRadius: 2,
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: 30,
                            fontWeight: 800,
                            color: "#222222",
                            lineHeight: 1.1,
                          }}
                        >
                          {card.value}
                        </Typography>
                        <Typography
                          sx={{ mt: 1, color: "#888888", fontWeight: 500 }}
                        >
                          {card.label}
                        </Typography>
                      </Box>
                      {card.icon}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <AddCircleIcon sx={{ color: "#D32F2F" }} />
                  <Typography
                    variant="h6"
                    sx={{ color: "#D32F2F", fontWeight: 700 }}
                  >
                    Quick Actions
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      lg: "repeat(5, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                  }}
                >
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/students")}
                  >
                    Add Student
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/teachers")}
                  >
                    Add Teacher
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/classes")}
                  >
                    Create Class
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/notices")}
                  >
                    Post Notice
                  </Button>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/reports")}
                  >
                    View Reports
                  </Button>
                </Box>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "5fr 4fr" },
                gap: 2,
                mb: 3,
              }}
            >
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <CampaignIcon sx={{ color: "#D32F2F" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#D32F2F", fontWeight: 700 }}
                    >
                      Recent Notices
                    </Typography>
                  </Box>

                  {recentNotices.length === 0 ? (
                    <Typography sx={{ color: "#8a8a8a" }}>
                      No notices available.
                    </Typography>
                  ) : (
                    recentNotices.map((notice, index) => (
                      <Box key={notice._id || `${notice.title}-${index}`}>
                        <Typography sx={{ fontWeight: 700, color: "#222222" }}>
                          {notice.title}
                        </Typography>
                        <Typography
                          sx={{ color: "#8a8a8a", fontSize: 14, mb: 1.5 }}
                        >
                          {formatDate(notice.createdAt)}
                        </Typography>
                        {index !== recentNotices.length - 1 && (
                          <Divider sx={{ mb: 1.5 }} />
                        )}
                      </Box>
                    ))
                  )}

                  <Button
                    variant="outlined"
                    sx={{ mt: 2, borderColor: "#D32F2F", color: "#D32F2F" }}
                    onClick={() => navigate("/admin/notices")}
                  >
                    View All Notices
                  </Button>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <PaymentIcon sx={{ color: "#D32F2F" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: "#D32F2F", fontWeight: 700 }}
                    >
                      Fees Overview
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#E8F5E9",
                        border: "1px solid #C8E6C9",
                      }}
                    >
                      <Typography
                        sx={{ color: "#2E7D32", fontWeight: 700, fontSize: 13 }}
                      >
                        Total Collected
                      </Typography>
                      <Typography
                        sx={{ color: "#2E7D32", fontWeight: 800, fontSize: 22 }}
                      >
                        {formatCurrency(feesSummary.totalFeeCollected)}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "#FFEBEE",
                        border: "1px solid #FFCDD2",
                      }}
                    >
                      <Typography
                        sx={{ color: "#C62828", fontWeight: 700, fontSize: 13 }}
                      >
                        Total Due
                      </Typography>
                      <Typography
                        sx={{ color: "#C62828", fontWeight: 800, fontSize: 22 }}
                      >
                        {formatCurrency(feesSummary.totalDue)}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/fees")}
                  >
                    Manage Fees
                  </Button>
                </CardContent>
              </Card>
            </Box>

            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <PeopleIcon sx={{ color: "#D32F2F" }} />
                  <Typography
                    variant="h6"
                    sx={{ color: "#D32F2F", fontWeight: 700 }}
                  >
                    Recently Added Students
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  {recentStudents.map((student) => {
                    const className =
                      student?.classId?.className || "Unassigned";
                    const section = student?.classId?.section || "";

                    return (
                      <Box
                        key={student._id}
                        sx={{
                          border: "1px solid #efefef",
                          borderRadius: 2,
                          p: 2,
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <Typography sx={{ fontWeight: 700, color: "#1f1f1f" }}>
                          {student?.userId?.name || "-"}
                        </Typography>
                        <Typography
                          sx={{
                            color: "#8a8a8a",
                            mt: 0.5,
                            mb: 1.5,
                            fontSize: 14,
                          }}
                        >
                          {student?.admissionNumber || "-"}
                        </Typography>
                        <Chip
                          size="small"
                          label={
                            section ? `${className} - ${section}` : className
                          }
                          sx={{
                            backgroundColor: "#FFEBEE",
                            color: "#C62828",
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#D32F2F",
                      "&:hover": { backgroundColor: "#B71C1C" },
                    }}
                    onClick={() => navigate("/admin/students")}
                  >
                    View All Students
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
