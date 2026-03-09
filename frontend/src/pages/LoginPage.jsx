import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Container,
  Typography,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { loginUser, clearError } from "../redux/authSlice";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [showPassword, setShowPassword] = React.useState(false);

  const { isLoading, error, token, role } = useSelector((state) => state.auth);

  // Redirect based on role after successful login
  useEffect(() => {
    if (token && role) {
      const redirectPath = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
      }[role];

      if (redirectPath) {
        navigate(redirectPath);
      }
    }
  }, [token, role, navigate]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%)",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          sx={{
            padding: 4,
            boxShadow: "0 8px 32px rgba(211, 47, 47, 0.2)",
            borderRadius: 2,
          }}
        >
          {/* School Logo */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <img
              src="/logo.png"
              alt="School Logo"
              style={{
                maxWidth: "100px",
                height: "auto",
                marginBottom: 16,
              }}
            />
          </Box>

          {/* School Name */}
          <Typography
            variant="h4"
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              color: "#D32F2F",
              marginBottom: 1,
            }}
          >
            Tiny Kidz International School
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#999",
              marginBottom: 3,
              fontSize: "0.95rem",
            }}
          >
            Taking Small Steps Toward A Big Leap
          </Typography>

          {/* School Location */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#666",
              marginBottom: 3,
              fontSize: "0.9rem",
            }}
          >
            Amritsar, Punjab, India
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{ marginBottom: 2 }}
              onClose={() => dispatch(clearError())}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email Field */}
            <TextField
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              placeholder="Enter your email"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading}
            />

            {/* Password Field */}
            <TextField
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              placeholder="Enter your password"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                marginTop: 3,
                backgroundColor: "#D32F2F",
                color: "white",
                padding: "12px",
                fontSize: "1rem",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#B71C1C",
                },
                "&:disabled": {
                  backgroundColor: "#D32F2F",
                  opacity: 0.7,
                },
              }}
              disabled={isLoading}
            >
              {isLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: "white" }} />
                  <span>Logging In...</span>
                </Box>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Footer */}
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#999",
              marginTop: 3,
              fontSize: "0.85rem",
              borderTop: "1px solid #eee",
              paddingTop: 2,
            }}
          >
            © 2025 Tiny Kidz International School
          </Typography>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
