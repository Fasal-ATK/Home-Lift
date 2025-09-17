// src/redux/slices/admin/applicationsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminProviderManagementService } from "../../../services/apiServices";

// -----------------------------
// Thunks
// -----------------------------

// Fetch all applications
export const fetchApplications = createAsyncThunk(
  "applications/fetchApplications",
  async (_, { rejectWithValue }) => {
    try {
      return await adminProviderManagementService.getApplications();
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch applications");
    }
  }
);

// Approve application
export const approveApplication = createAsyncThunk(
  "applications/approveApplication",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await adminProviderManagementService.approveApplication(id, data);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to approve application");
    }
  }
);

// Reject application
export const rejectApplication = createAsyncThunk(
  "applications/rejectApplication",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await adminProviderManagementService.rejectApplication(id, data);
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to reject application");
    }
  }
);

// -----------------------------
// Slice
// -----------------------------
const applicationSlice = createSlice({
  name: "applications",
  initialState: {
    list: [],
    loading: false,
    actionLoading: false, // 👈 separate loader for approve/reject
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // -----------------------------
      // Fetch Applications
      // -----------------------------
      .addCase(fetchApplications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // -----------------------------
      // Approve Application
      // -----------------------------
      .addCase(approveApplication.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(approveApplication.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.list.findIndex((app) => app.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      })
      .addCase(approveApplication.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })

      // -----------------------------
      // Reject Application
      // -----------------------------
      .addCase(rejectApplication.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(rejectApplication.fulfilled, (state, action) => {
        state.actionLoading = false;
        const idx = state.list.findIndex((app) => app.id === action.payload.id);
        if (idx !== -1) {
          state.list[idx] = action.payload;
        }
      })
      .addCase(rejectApplication.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export default applicationSlice.reducer;
