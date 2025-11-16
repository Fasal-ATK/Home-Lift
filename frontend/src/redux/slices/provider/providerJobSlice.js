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

// acceptJob expects an id (number/string)
export const acceptJob = createAsyncThunk(
  "providerJobs/acceptJob",
  async (id, { rejectWithValue }) => {
    try {
      const data = await providerJobService.acceptJob(id);
      // return id so reducer can remove from list; include server data if any
      return { id, data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to accept job");
    }
  }
);

const initialState = {
  jobs: [],                 // assigned/available jobs for provider (list endpoint)
  pending: [],              // pending jobs endpoint
  loading: false,
  pendingLoading: false,
  acceptLoading: false,     // global accept loading (kept for compatibility)
  acceptingIds: [],         // per-job accept in-progress (array of ids)
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
    // optional: remove a job locally by id
    removeJobById(state, action) {
      const id = action.payload;
      state.jobs = state.jobs.filter((j) => Number(j.id) !== Number(id));
      state.pending = state.pending.filter((j) => Number(j.id) !== Number(id));
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

      // acceptJob (per-job tracking)
      .addCase(acceptJob.pending, (state, action) => {
        state.acceptLoading = true;
        state.acceptError = null;
        const id = action.meta.arg;
        // add to acceptingIds if not already present
        if (!state.acceptingIds.includes(id)) state.acceptingIds.push(id);
      })
      .addCase(acceptJob.fulfilled, (state, action) => {
        state.acceptLoading = false;
        const id = action.payload.id;
        // remove accepted job from lists
        state.jobs = state.jobs.filter((j) => Number(j.id) !== Number(id));
        state.pending = state.pending.filter((j) => Number(j.id) !== Number(id));
        // remove id from acceptingIds
        state.acceptingIds = state.acceptingIds.filter((x) => Number(x) !== Number(id));
      })
      .addCase(acceptJob.rejected, (state, action) => {
        state.acceptLoading = false;
        state.acceptError = action.payload || "Failed to accept job";
        const id = action.meta.arg;
        // ensure id removed from acceptingIds on failure
        state.acceptingIds = state.acceptingIds.filter((x) => Number(x) !== Number(id));
      });
  },
});

export const { clearProviderJobError, setJobs, removeJobById } = providerJobSlice.actions;

// Selectors (helpful)
export const selectProviderJobs = (state) => state.providerJobs.jobs;
export const selectProviderPending = (state) => state.providerJobs.pending;
export const selectProviderLoading = (state) => state.providerJobs.loading || state.providerJobs.pendingLoading;
export const selectAcceptingIds = (state) => state.providerJobs.acceptingIds;
export const selectAcceptLoading = (state) => state.providerJobs.acceptLoading;
export const selectProviderJobError = (state) => state.providerJobs.error;

export default providerJobSlice.reducer;
