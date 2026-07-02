import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import API from "../services/authService";

export const fetchPaymentLedger = createAsyncThunk(
  "feePayments/fetchLedger",
  async (feeId, { rejectWithValue }) => {
    try {
      const res = await API.get(`/fees/payment/${feeId}/ledger`);
      return { feeId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch ledger");
    }
  },
);

export const addPayment = createAsyncThunk(
  "feePayments/add",
  async ({ feeId, paymentData }, { rejectWithValue }) => {
    try {
      const res = await API.post("/fees/payment", { feeRecordId: feeId, ...paymentData });
      return { feeId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to record payment");
    }
  },
);

export const updatePayment = createAsyncThunk(
  "feePayments/update",
  async ({ feeId, paymentId, paymentData }, { rejectWithValue }) => {
    try {
      const res = await API.patch(`/fees/payment/${feeId}/${paymentId}`, paymentData);
      return { feeId, data: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update payment");
    }
  },
);

export const deletePayment = createAsyncThunk(
  "feePayments/delete",
  async ({ feeId, paymentId }, { rejectWithValue }) => {
    try {
      await API.delete(`/fees/payment/${paymentId}`);
      return { feeId, paymentId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete payment");
    }
  },
);

const initialState = {
  byFeeId: {},
  feeSummary: {},
  loading: false,
  error: null,
};

const feePaymentsSlice = createSlice({
  name: "feePayments",
  initialState,
  reducers: {
    clearLedger: (state) => {
      state.byFeeId = {};
      state.feeSummary = {};
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentLedger.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentLedger.fulfilled, (state, action) => {
        state.loading = false;
        const { feeId, data } = action.payload;
        state.byFeeId[feeId] = data.payments || [];
        state.feeSummary[feeId] = data.fee_summary || {};
      })
      .addCase(fetchPaymentLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(addPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPayment.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(addPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(updatePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deletePayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePayment.fulfilled, (state, action) => {
        state.loading = false;
        const { feeId, paymentId } = action.payload;
        if (state.byFeeId[feeId]) {
          state.byFeeId[feeId] = state.byFeeId[feeId].filter((p) => p._id !== paymentId);
        }
      })
      .addCase(deletePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearLedger, clearError } = feePaymentsSlice.actions;
export default feePaymentsSlice.reducer;
