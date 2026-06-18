import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
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
  ThemeProvider,
  createTheme,
  alpha
} from "@mui/material";
import { Visibility, VisibilityOff, SchoolRounded, LockClock } from "@mui/icons-material";
import { loginUser, clearError } from "../redux/authSlice";
import { motion, AnimatePresence } from "framer-motion";

// Premium Custom Theme just for the Login Page to enforce correct fonts and palette
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: "#b91c1c", // High contrast Red (slate-900 compatible)
      dark: "#7f1d1d",
    },
    error: {
      main: "#dc2626",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
            },
            '&.Mui-focused': {
              backgroundColor: '#fff',
              boxShadow: '0 4px 20px rgba(185, 28, 28, 0.1)',
            }
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '12px',
          padding: '12px 24px',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(185, 28, 28, 0.25)',
            transform: 'translateY(-2px)'
          }
        }
      }
    }
  }
});

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const LoginPage = () => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [defaultEmail, setDefaultEmail] = useState("");

  useEffect(() => {
    const email = sessionStorage.getItem("lastEmail");
    if (email) {
      setDefaultEmail(email);
      setSessionEnded(true);
      sessionStorage.removeItem("lastEmail");
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (defaultEmail) setValue("email", defaultEmail);
  }, [defaultEmail, setValue]);

  const { isLoading, error, token, role } = useSelector((state) => state.auth);

  if (token) {
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    if (role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#fef2f2", // Very light red/pink bg
        }}
      >
        {/* Animated Background Shapes */}
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          sx={{
            position: "absolute",
            top: "-10%",
            left: "-10%",
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle, rgba(254,202,202,0.8) 0%, rgba(254,226,226,0) 70%)",
            borderRadius: "50%",
            filter: "blur(60px)",
            zIndex: 0,
          }}
        />
        <Box
          component={motion.div}
          animate={{ scale: [1, 1.2, 1], x: [0, 100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            position: "absolute",
            bottom: "-20%",
            right: "-10%",
            width: "60vw",
            height: "60vw",
            background: "radial-gradient(circle, rgba(252,165,165,0.6) 0%, rgba(254,226,226,0) 70%)",
            borderRadius: "50%",
            filter: "blur(80px)",
            zIndex: 0,
          }}
        />

        {/* Content Container */}
        <Container 
          maxWidth="lg" 
          sx={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            zIndex: 1,
            position: "relative"
          }}
        >
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            sx={{
              display: "flex",
              width: "100%",
              maxWidth: "1000px",
              minHeight: "600px",
              background: "rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderRadius: "24px",
              boxShadow: "0 24px 64px -12px rgba(185, 28, 28, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.4)",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              flexDirection: { xs: "column", md: "row" }
            }}
          >
            {/* Left Brand Panel */}
            <Box
              sx={{
                flex: { xs: "0 0 auto", md: "1 1 50%" },
                background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
                p: { xs: 4, md: 6 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "white",
                position: "relative"
              }}
            >
              <Box sx={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.1, backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\\"20\\\" height=\\\"20\\\" viewBox=\\\"0 0 20 20\\\" xmlns=\\\"http://www.w3.org/2000/svg\\\"%3E%3Cg fill=\\\"%23fff\\\" fill-opacity=\\\"1\\\" fill-rule=\\\"evenodd\\\"%3E%3Ccircle cx=\\\"3\\\" cy=\\\"3\\\" r=\\\"3\\\"/%3E%3Ccircle cx=\\\"13\\\" cy=\\\"13\\\" r=\\\"3\\\"/%3E%3C/g%3E%3C/svg%3E')", zIndex: 0 }} />
              
              <Box sx={{ zIndex: 1 }}>
                <MotionBox
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}
                >
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: "rgba(255,255,255,0.2)", 
                    borderRadius: "16px",
                    backdropFilter: "blur(10px)"
                  }}>
                    <SchoolRounded sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
                    Tiny Kidz
                  </Typography>
                </MotionBox>
                
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
                    Taking Small<br/>Steps Toward A<br/>Big Leap.
                  </Typography>
                  <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: "80%", lineHeight: 1.6, mt: 3 }}>
                    Welcome back to our digital campus. Sign in to access your classes, grades, and school management tools seamlessly.
                  </Typography>
                </MotionBox>
              </Box>

              <MotionBox
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                sx={{ zIndex: 1, mt: { xs: 4, md: 0 } }}
              >
                <Typography variant="body2" sx={{ opacity: 0.7, fontWeight: 500 }}>
                  Amritsar, Punjab, India
                </Typography>
              </MotionBox>
            </Box>

            {/* Right Form Panel */}
            <Box
              sx={{
                flex: { xs: "1 1 auto", md: "1 1 50%" },
                p: { xs: 4, md: 6, lg: 8 },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                bgcolor: "transparent"
              }}
            >
              <Typography variant="h4" sx={{ 
                fontWeight: 800, 
                color: "#0f172a", 
                mb: 1,
                letterSpacing: "-0.02em" 
              }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: "#475569", mb: 4 }}>
                {sessionEnded ? "Enter your password to pick up where you left off." : "Please enter your credentials to continue."}
              </Typography>

              <AnimatePresence>
                {sessionEnded && (
                  <MotionBox
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto", mb: 3 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                  >
                    <Alert
                      icon={<LockClock />}
                      severity="info"
                      sx={{ 
                        borderRadius: "12px",
                        bgcolor: "#eff6ff",
                        color: "#1e40af",
                        border: "1px solid #bfdbfe",
                        '& .MuiAlert-icon': { color: "#2563eb" }
                      }}
                    >
                      Your session ended for security. Just enter your password to continue.
                    </Alert>
                  </MotionBox>
                )}
                {error && (
                  <MotionBox
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto", mb: 3 }}
                    exit={{ opacity: 0, height: 0, mb: 0 }}
                  >
                    <Alert
                      severity="error"
                      onClose={() => dispatch(clearError())}
                      sx={{ 
                        borderRadius: "12px",
                        bgcolor: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        '& .MuiAlert-icon': { color: "#dc2626" }
                      }}
                    >
                      {error}
                    </Alert>
                  </MotionBox>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: "#334155", mb: 1, fontWeight: 600 }}>
                    Email Address
                  </Typography>
                  <TextField
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    type="email"
                    fullWidth
                    placeholder="Enter your email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isLoading}
                    sx={{ "& .MuiFormHelperText-root": { ml: 0, mt: 1 } }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ color: "#334155", fontWeight: 600 }}>
                      Password
                    </Typography>
                    <Typography 
                      variant="caption" 
                      component="button"
                      type="button"
                      sx={{ 
                        background: "none", 
                        border: "none", 
                        color: "#b91c1c", 
                        fontWeight: 600, 
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" }
                      }}
                    >
                      Forgot?
                    </Typography>
                  </Box>
                  <TextField
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    placeholder="Enter your password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    disabled={isLoading}
                    sx={{ "& .MuiFormHelperText-root": { ml: 0, mt: 1 } }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={isLoading}
                            sx={{ color: "#64748b" }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {isLoading ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CircularProgress size={20} sx={{ color: "rgba(255,255,255,0.7)" }} />
                      <span>Authenticating...</span>
                    </Box>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  color: "#94a3b8",
                  mt: 4,
                  fontWeight: 500
                }}
              >
                © 2026 Tiny Kidz International School
              </Typography>
            </Box>
          </MotionBox>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;
