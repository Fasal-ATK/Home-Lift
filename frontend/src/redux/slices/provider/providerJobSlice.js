// src/redux/slices/provider/providerJobSlice.js
import { createSlice, createAsyncThunk, createEntityAdapter } from "@reduxjs/toolkit";
import { providerJobService, bookingService } from "../../../services/apiServices";

const jobsAdapter = createEntityAdapter({
  selectId: (job) => Number(job.id),
  sortComparer: (a, b) => {
    if (a.created_at && b.created_at) return b.created_at.localeCompare(a.created_at);
    return 0;
  },
});

const initialState = jobsAdapter.getInitialState({
  loading: false,
  pendingLoading: false,
  myAppointmentsLoading: false,
  myAppointments: [], // Store assigned bookings here
  error: null,
  acceptError: null,
  acceptingIds: [], // per-job accept in-progress
});

/* Thunks */
export const fetchMyAppointments = createAsyncThunk(
  "providerJobs/fetchMyAppointments",
  async (_, { rejectWithValue }) => {
    try {
      const data = await providerJobService.getMyAppointments();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to fetch my appointments");
    }
  }
); export const fetchProviderJobs = createAsyncThunk(
  "providerJobs/fetchProviderJobs",
  async (_, { rejectWithValue }) => {
    try {
      const data = await providerJobService.getProviderJobs();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to fetch provider jobs");
    }
  }
);



// Uses bookingService.getBookingDetails (apiServices unchanged)
export const fetchJobDetail = createAsyncThunk(
  "providerJobs/fetchJobDetail",
  async (id, { rejectWithValue }) => {
    try {
      const data = await bookingService.getBookingDetails(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to fetch job detail");
    }
  }
);

export const acceptJob = createAsyncThunk(
  "providerJobs/acceptJob",
  async (id, { rejectWithValue }) => {
    try {
      const data = await providerJobService.acceptJob(id);
      return { id, data };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to accept job");
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  "providerJobs/updateBookingStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const data = await providerJobService.updateBookingStatus(id, status);
      return data; // This is the object with {message, data}
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message || "Failed to update status");
    }
  }
);

const slice = createSlice({
  name: "providerJobs",
  initialState,
  reducers: {
    clearProviderJobError(state) {
      state.error = null;
      state.acceptError = null;
    },
    setJobs(state, action) {
      jobsAdapter.setAll(state, action.payload || []);
    },
    removeJobById(state, action) {
      const id = Number(action.payload);
      jobsAdapter.removeOne(state, id);
      state.acceptingIds = state.acceptingIds.filter((x) => Number(x) !== id);
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
        jobsAdapter.setAll(state, action.payload || []);
      })
      .addCase(fetchProviderJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch provider jobs";
      })



      // fetchJobDetail
      .addCase(fetchJobDetail.pending, (state) => {
        // could track id-specific loading if you want
      })
      .addCase(fetchJobDetail.fulfilled, (state, action) => {
        jobsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchJobDetail.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch job detail";
      })

      // acceptJob: per-id tracking and removal on success
      .addCase(acceptJob.pending, (state, action) => {
        const id = Number(action.meta.arg);
        if (!state.acceptingIds.includes(id)) state.acceptingIds.push(id);
        state.acceptError = null;
      })
      .addCase(acceptJob.fulfilled, (state, action) => {
        const id = Number(action.payload.id);
        jobsAdapter.removeOne(state, id);
        state.acceptingIds = state.acceptingIds.filter((x) => Number(x) !== id);
        // Add to myAppointments
        if (action.payload.data) {
          state.myAppointments = [action.payload.data, ...state.myAppointments];
        }
      })
      .addCase(acceptJob.rejected, (state, action) => {
        const id = Number(action.meta.arg);
        state.acceptError = action.payload || "Failed to accept job";
        state.acceptingIds = state.acceptingIds.filter((x) => Number(x) !== id);
      })

      // fetchMyAppointments
      .addCase(fetchMyAppointments.pending, (state) => {
        state.myAppointmentsLoading = true;
      })
      .addCase(fetchMyAppointments.fulfilled, (state, action) => {
        state.myAppointmentsLoading = false;
        state.myAppointments = action.payload || [];
      })
      .addCase(fetchMyAppointments.rejected, (state, action) => {
        state.myAppointmentsLoading = false;
        state.error = action.payload || "Failed to fetch my appointments";
      })

      // updateBookingStatus
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const updatedBooking = action.payload.data;
        if (updatedBooking) {
          // Update entity adapter
          jobsAdapter.upsertOne(state, updatedBooking);
          // Update myAppointments list
          state.myAppointments = state.myAppointments.map(b =>
            Number(b.id) === Number(updatedBooking.id) ? updatedBooking : b
          );
        }
      });
  },
});

export const { clearProviderJobError, setJobs, removeJobById } = slice.actions;

// adapter selectors
export const jobsSelectors = jobsAdapter.getSelectors((state) => state.providerJobs);

export const selectProviderLoading = (state) => state.providerJobs.loading || state.providerJobs.pendingLoading || state.providerJobs.myAppointmentsLoading;
export const selectAcceptingIds = (state) => state.providerJobs.acceptingIds;
export const selectProviderError = (state) => state.providerJobs.error;
export const selectMyAppointments = (state) => state.providerJobs.myAppointments;

export default slice.reducer;
