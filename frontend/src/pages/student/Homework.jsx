import { useState, useEffect } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Chip,
  Typography,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Grid,
} from "@mui/material";
import dayjs from "dayjs";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import API from "../../services/authService";
import StudentLayout from "../../components/StudentLayout";

const StudentHomework = () => {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [studentClass, setStudentClass] = useState(null);

  useEffect(() => {
    const fetchStudentHomework = async () => {
      try {
        // Get student's profile to find their class
        const studentRes = await API.get("/api/students/me");
        const studentData = studentRes.data.data;
        setStudentClass(studentData.classId);

        // Fetch all homework for the student's class
        const homeworkRes = await API.get(
          `/api/homework/class/${studentData.classId._id}`,
        );
        setHomework(homeworkRes.data.data || []);
      } catch (error) {
        console.error("Failed to load homework:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentHomework();
  }, []);

  const getStatus = (dueDate) => {
    const due = dayjs(dueDate);
    const today = dayjs().startOf("day");
    if (due.isBefore(today)) return "Overdue";
    return "Upcoming";
  };

  const upcomingHomework = homework.filter((hw) => {
    const due = dayjs(hw.dueDate);
    const today = dayjs().startOf("day");
    return due.isSameOrAfter(today);
  });

  const displayedHomework = tabValue === 0 ? upcomingHomework : homework;

  const HomeworkCard = ({ hw }) => {
    const status = getStatus(hw.dueDate);
    const borderColor = status === "Upcoming" ? "#4CAF50" : "#D32F2F";

    return (
      <Card
        sx={{
          mb: 2,
          borderLeft: `4px solid ${borderColor}`,
          "&:hover": { boxShadow: 3 },
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Chip
              label={hw.subjectId?.name || "Subject"}
              sx={{
                backgroundColor: "#D32F2F",
                color: "white",
                fontWeight: "bold",
              }}
            />
            <Chip
              label={status}
              color={status === "Upcoming" ? "success" : "error"}
              size="small"
            />
          </Box>

          <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
            {hw.title}
          </Typography>

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mb: 2, minHeight: 40 }}
          >
            {hw.description}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <CalendarTodayIcon sx={{ fontSize: 18, color: "#D32F2F" }} />
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              Due: {dayjs(hw.dueDate).format("DD MMM YYYY")}
            </Typography>
          </Box>

          {hw.attachmentLink && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNewIcon />}
              sx={{
                borderColor: "#D32F2F",
                color: "#D32F2F",
                "&:hover": {
                  backgroundColor: "#FFEBEE",
                  borderColor: "#D32F2F",
                },
              }}
              onClick={() => window.open(hw.attachmentLink, "_blank")}
            >
              Open Attachment
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <StudentLayout>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography
          variant="h4"
          sx={{ mb: 3, fontWeight: "bold", color: "#D32F2F" }}
        >
          My Homework
        </Typography>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{
                  "& .MuiTab-root": {
                    color: "#999",
                    fontWeight: "bold",
                    "&.Mui-selected": {
                      color: "#D32F2F",
                    },
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#D32F2F",
                  },
                }}
              >
                <Tab label={`Upcoming (${upcomingHomework.length})`} />
                <Tab label={`All Homework (${homework.length})`} />
              </Tabs>
            </Box>

            {displayedHomework.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: 6,
                  backgroundColor: "#f5f5f5",
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" color="textSecondary">
                  No homework assigned
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={0}>
                {displayedHomework.map((hw) => (
                  <Grid item xs={12} key={hw._id}>
                    <HomeworkCard hw={hw} />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}
      </Container>
    </StudentLayout>
  );
};

export default StudentHomework;
