import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminCustomerManagementService } from "../../services/apiServices";

// Thunks
export const fetchCustomers = createAsyncThunk(
  "adminCustomers/fetchCustomers",
  async () => {
    const data = await adminCustomerManagementService.getCustomers();
    return data;
  }
);

export const toggleCustomerActive = createAsyncThunk(
  "adminCustomers/toggleCustomerActive",
  async ({ id, is_active }) => {
    const data = await adminCustomerManagementService.manageCustomer(id, { is_active });
    return data;
  }
);

// Slice
const adminCustomerSlice = createSlice({
  name: "adminCustomers",
  initialState: {
    customers: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch customers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Toggle Active/Blocked
      .addCase(toggleCustomerActive.fulfilled, (state, action) => {
        state.customers = state.customers.map((c) =>
          c.id === action.payload.id ? action.payload : c
        );
      });
  },
});

export default adminCustomerSlice.reducer;
