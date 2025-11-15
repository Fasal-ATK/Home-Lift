// src/store/slices/provider/ProviderJobSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { providerJobService } from '../../../services/apiServices'; // adjust path

// Async thunks
export const fetchProviderJobs = createAsyncThunk(
  "providerJobs/fetchProviderJobs",
  async (_, { rejectWithValue }) => {
    try {
      const data = await providerJobService.getProviderJobs();
      return data; // assume API returns array
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to fetch jobs");
    }
  }
);

export const fetchPendingJobs = createAsyncThunk(
  "providerJobs/fetchPendingJobs",
  async (_, { rejectWithValue }) => {
    try {
      const data = await providerJobService.getPendingJobs();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to fetch pending jobs");
    }
  }
);

export const acceptJob = createAsyncThunk(
  "providerJobs/acceptJob",
  async (id, { rejectWithValue }) => {
    try {
      const data = await providerJobService.acceptJob(id);
      // return id so reducer can remove from list
      return { id, data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to accept job");
    }
  }
);

const initialState = {
  jobs: [],          // assigned/available jobs for provider (list endpoint)
  pending: [],       // pending jobs endpoint
  loading: false,
  pendingLoading: false,
  acceptLoading: false,
  error: null,
  acceptError: null,
};

const providerJobSlice = createSlice({
  name: "providerJobs",
  initialState,
  reducers: {
    // optional local actions
    clearProviderJobError(state) {
      state.error = null;
      state.acceptError = null;
    },
    // replace jobs (useful for optimistic updates)
    setJobs(state, action) {
      state.jobs = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProviderJobs
      .addCase(fetchProviderJobs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.jobs = action.payload || [];
      })
      .addCase(fetchProviderJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch provider jobs";
      })

      // fetchPendingJobs
      .addCase(fetchPendingJobs.pending, (state) => {
        state.pendingLoading = true;
      })
      .addCase(fetchPendingJobs.fulfilled, (state, action) => {
        state.pendingLoading = false;
        state.pending = action.payload || [];
      })
      .addCase(fetchPendingJobs.rejected, (state, action) => {
        state.pendingLoading = false;
        state.error = action.payload || "Failed to fetch pending jobs";
      })

      // acceptJob
      .addCase(acceptJob.pending, (state) => {
        state.acceptLoading = true;
        state.acceptError = null;
      })
      .addCase(acceptJob.fulfilled, (state, action) => {
        state.acceptLoading = false;
        const id = action.payload.id;
        // remove from jobs list if present
        state.jobs = state.jobs.filter((j) => Number(j.id) !== Number(id));
        // also remove from pending if present
        state.pending = state.pending.filter((j) => Number(j.id) !== Number(id));
      })
      .addCase(acceptJob.rejected, (state, action) => {
        state.acceptLoading = false;
        state.acceptError = action.payload || "Failed to accept job";
      });
  },
});

export const { clearProviderJobError, setJobs } = providerJobSlice.actions;
export default providerJobSlice.reducer;
