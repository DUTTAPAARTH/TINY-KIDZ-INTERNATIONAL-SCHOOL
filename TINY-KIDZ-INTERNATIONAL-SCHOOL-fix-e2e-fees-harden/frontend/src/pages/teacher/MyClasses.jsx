import React, { useEffect, useState } from "react";
import API_BASE from "../../utils/apiConfig";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import TeacherLayout from "../../components/TeacherLayout";

const TeacherMyClasses = () => {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teacherName, setTeacherName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const api = axios.create({
      baseURL: API_BASE,
      headers: { Authorization: `Bearer ${token}` },
    });

    api
      .get("/teachers/me")
      .then((res) => {
        const data = res.data?.data || {};
        setTeacherName(data.userId?.name || "Teacher");

        const assigned = data.assignedClasses || data.classIds || [];
        setClasses(
          assigned.map((cls) => ({
            _id: cls._id || cls.id,
            className: cls.className || "",
            section: cls.section || "",
            academicYear: cls.academicYear || "—",
            studentCount: cls.studentCount ?? (cls.students?.length || 0),
          })),
        );
      })
      .catch((err) => {
        console.error("Error fetching classes:", err);
        setError("Failed to load your assigned classes.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  const getClassLabel = (cls) =>
    `${cls.className}${cls.section ? ` - ${cls.section}` : ""}`.trim() || "Unnamed class";

  return (
    <TeacherLayout>
      <Box sx={{ background: "#F5F5F5", minHeight: "100vh", p: 3 }}>
        <Typography variant="h4" sx={{ color: "#D32F2F", fontWeight: 800, mb: 1 }}>
          My Classes
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {teacherName ? `${teacherName} — ` : ""}
          {classes.length} assigned class{classes.length === 1 ? "" : "es"}
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={240}>
            <CircularProgress sx={{ color: "#D32F2F" }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : classes.length === 0 ? (
          <Box textAlign="center" color="#888" mt={8}>
            <Typography variant="h6" gutterBottom>
              No classes assigned yet
            </Typography>
            <Typography variant="body2">
              Contact the admin to assign classes to your profile.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {classes.map((cls) => (
              <Grid item xs={12} sm={6} md={4} key={cls._id}>
                <Card
                  sx={{
                    height: "100%",
                    borderTop: "4px solid #D32F2F",
                    boxShadow: "0 4px 24px rgba(13, 29, 41, 0.04)",
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: "#D32F2F" }}>
                      {getClassLabel(cls)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Academic Year: {cls.academicYear}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Students: {cls.studentCount}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ flexWrap: "wrap", gap: 1, px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{ bgcolor: "#D32F2F" }}
                      onClick={() => navigate(`/teacher/attendance?classId=${cls._id}`)}
                    >
                      Attendance
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "#D32F2F", color: "#D32F2F" }}
                      onClick={() => navigate("/teacher/marks")}
                    >
                      Marks
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "#D32F2F", color: "#D32F2F" }}
                      onClick={() => navigate("/teacher/homework")}
                    >
                      Homework
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </TeacherLayout>
  );
};

export default TeacherMyClasses;

