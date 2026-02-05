import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminCustomerManagementService } from "../../services/apiServices";

// Thunks
// Thunks
export const fetchCustomers = createAsyncThunk(
  "adminCustomers/fetchCustomers",
  async (params = {}) => {
    // Note: service must support params!
    // Check adminCustomerManagementService.getCustomers
    const data = await adminCustomerManagementService.getCustomers(params);
    return data;
  }
);
// Wait, `createAsyncThunk` syntax:
// fetchCustomers = createAsyncThunk('type', async (arg, { rejectWithValue }) => ...)
// I pasted `const dispatch = async...` which is wrong.
// Correct:
// async (params = {}) => { ... }

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
    totalCount: 0,
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
        const payload = action.payload;
        if (payload.results) {
          state.customers = payload.results;
          state.totalCount = payload.count;
        } else if (Array.isArray(payload)) {
          state.customers = payload;
          state.totalCount = payload.length;
        } else {
          state.customers = payload || [];
          state.totalCount = 0;
        }
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

export const selectTotalCustomersCount = (state) => state.adminCustomers.totalCount;

export default adminCustomerSlice.reducer;
