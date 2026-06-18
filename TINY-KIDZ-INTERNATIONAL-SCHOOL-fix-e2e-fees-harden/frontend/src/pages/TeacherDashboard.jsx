import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box, Button, Typography, Container } from "@mui/material";
import { logout } from "../redux/authSlice";

const TeacherDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ color: "#D32F2F" }}>
          Teacher Dashboard
        </Typography>
        <Button
          variant="contained"
          onClick={handleLogout}
          sx={{ backgroundColor: "#D32F2F" }}
        >
          Logout
        </Button>
      </Box>

      <Box sx={{ backgroundColor: "#f5f5f5", padding: 3, borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Welcome, {user?.name}!
        </Typography>
        <Typography>Email: {user?.email}</Typography>
        <Typography>Role: {user?.role}</Typography>
      </Box>
    </Container>
  );
};

export default TeacherDashboard;
