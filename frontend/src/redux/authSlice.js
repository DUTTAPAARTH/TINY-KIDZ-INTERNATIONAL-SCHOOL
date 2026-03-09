import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../services/authService";

const VALID_ROLES = ["admin", "teacher", "student"];

const getStoredRole = () => {
  const storedRole = localStorage.getItem("role");
  if (VALID_ROLES.includes(storedRole)) {
    return storedRole;
  }

  localStorage.removeItem("role");
  return null;
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;

      // Save token to localStorage
      localStorage.setItem("token", token);

      return {
        user,
        token,
        role: user.role,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

const initialState = {
  user: null,
  token: localStorage.getItem("token") || null,
  role: getStoredRole(),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.role;
        if (VALID_ROLES.includes(action.payload.role)) {
          localStorage.setItem("role", action.payload.role);
        } else {
          localStorage.removeItem("role");
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
