import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authAPI } from "../services/authService";
import {
  clearAuthSession,
  getAuthToken,
  getStoredAuthRole,
  getStoredAuthUser,
  setAuthRole,
  setAuthToken,
  setAuthUser,
} from "../utils/authSession";

const VALID_ROLES = ["admin", "teacher", "student"];

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(email, password);
      const { token, user } = response.data;
      setAuthToken(token);
      sessionStorage.setItem("lastEmail", email);

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
  user: getStoredAuthUser(),
  token: getAuthToken(),
  role: getStoredAuthRole(),
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
      clearAuthSession();
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
        if (!VALID_ROLES.includes(action.payload.role)) {
          state.role = null;
          setAuthRole(null);
          setAuthUser(null);
        } else {
          setAuthRole(action.payload.role);
          setAuthUser(action.payload.user);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        clearAuthSession();
        state.user = null;
        state.token = null;
        state.role = null;
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
