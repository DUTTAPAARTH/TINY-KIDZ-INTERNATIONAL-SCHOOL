import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import feePaymentsReducer from "./feePaymentsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    feePayments: feePaymentsReducer,
  },
});

export default store;
