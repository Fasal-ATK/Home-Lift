// redux/slices/bookingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/apiServices';

// Helper: extract booking object from various backend shapes
const normalizeBooking = (payload) => {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.results)) return payload.results;
    if (payload.data && typeof payload.data === 'object' && payload.data.id) return payload.data;
    if (payload.id) return payload;
  }
  return payload;
};

// Async thunks — bookingService returns response.data already
export const fetchBookings = createAsyncThunk(
  'bookings/fetchBookings',
  async (params, { rejectWithValue }) => {
    try {
      const data = await bookingService.getBookings(params); // data (already unwrapped)
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const transformedData = { ...bookingData };
      if (transformedData.booking_time && transformedData.booking_time.includes('-')) {
        const startTime = transformedData.booking_time.split('-')[0].trim();
        transformedData.booking_time = `${startTime}:00`;
      } else if (transformedData.booking_time && transformedData.booking_time.match(/^\d{2}:\d{2}$/)) {
        transformedData.booking_time = `${transformedData.booking_time}:00`;
      }
      delete transformedData.advance;
      if (transformedData.address && typeof transformedData.address === 'string') {
        transformedData.address = parseInt(transformedData.address, 10);
      }
      if (transformedData.service && typeof transformedData.service === 'string') {
        transformedData.service = parseInt(transformedData.service, 10);
      }

      const data = await bookingService.createBooking(transformedData); // data from service
      return data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : error.response?.data) ||
        error.message ||
        'Failed to create booking';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateBooking = createAsyncThunk(
  'bookings/updateBooking',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await bookingService.cancelBooking(id, data);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// NEW: cancelBooking — calls DELETE endpoint which performs soft-cancel (status -> "cancelled")
export const cancelBooking = createAsyncThunk(
  'bookings/cancelBooking',
  async ({ id, payload = {} } = {}, { rejectWithValue }) => {
    try {
      // bookingService.cancelBooking should call api.delete(endpoint)
      const res = await bookingService.cancelBooking(id, payload);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBookingDetails = createAsyncThunk(
  'bookings/fetchBookingDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await bookingService.getBookingDetails(id);
      return res;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice
const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    totalCount: 0, // NEW: for pagination
    currentBooking: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentBooking(state) {
      state.currentBooking = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.bookings = payload;
          state.totalCount = payload.length;
        } else if (payload && Array.isArray(payload.data)) {
          state.bookings = payload.data;
          state.totalCount = payload.total || payload.count || payload.data.length;
        } else if (payload && Array.isArray(payload.results)) {
          state.bookings = payload.results;
          state.totalCount = payload.count || payload.results.length;
        } else if (payload && typeof payload === 'object' && payload.id) {
          state.bookings = [payload, ...state.bookings];
          state.totalCount = state.bookings.length;
        } else {
          state.bookings = payload ?? [];
          state.totalCount = 0;
        }
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // createBooking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        const created = action.payload;
        if (!created) return;
        if (Array.isArray(created)) {
          state.bookings = [...created, ...state.bookings];
        } else if (created.data && Array.isArray(created.data)) {
          state.bookings = [...created.data, ...state.bookings];
        } else {
          const obj = created.data ?? created;
          if (Array.isArray(obj)) state.bookings = [...obj, ...state.bookings];
          else state.bookings.unshift(obj);
        }
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // updateBooking
      .addCase(updateBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const u = (updated && updated.data) ? updated.data : updated;
        if (u && u.id) {
          const index = state.bookings.findIndex((b) => String(b.id) === String(u.id));
          if (index !== -1) state.bookings[index] = u;
          else state.bookings.unshift(u);
          if (state.currentBooking) {
            const curId = state.currentBooking?.id ?? state.currentBooking?.data?.id;
            if (String(curId) === String(u.id)) state.currentBooking = u;
          }
        }
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // NEW: cancelBooking handlers
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        // backend might return the updated booking under various shapes
        const payload = action.payload;
        const bookingObj = (payload && payload.data) ? payload.data : payload;
        // try to extract normalized booking
        const b = normalizeBooking(bookingObj) ?? bookingObj;
        // if b is an array, update matching bookings; otherwise single
        if (Array.isArray(b)) {
          // update multiple bookings if returned (unlikely for delete), else replace all
          b.forEach((item) => {
            if (!item || !item.id) return;
            const idx = state.bookings.findIndex((x) => String(x.id) === String(item.id));
            if (idx !== -1) state.bookings[idx] = item;
            else state.bookings.unshift(item);
            if (state.currentBooking) {
              const curId = state.currentBooking?.id ?? state.currentBooking?.data?.id;
              if (String(curId) === String(item.id)) state.currentBooking = item;
            }
          });
        } else if (b && b.id) {
          const idx = state.bookings.findIndex((x) => String(x.id) === String(b.id));
          if (idx !== -1) state.bookings[idx] = b;
          else state.bookings.unshift(b);
          if (state.currentBooking) {
            const curId = state.currentBooking?.id ?? state.currentBooking?.data?.id;
            if (String(curId) === String(b.id)) state.currentBooking = b;
          }
        } else {
          // fallback: if server didn't return booking, attempt to mark by id from meta
          // (no-op here)
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      })

      // fetchBookingDetails
      .addCase(fetchBookingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error?.message;
      });
  },
});

export const { clearCurrentBooking, clearError } = bookingSlice.actions;

export const selectTotalBookingCount = (state) => state.bookings.totalCount;

export default bookingSlice.reducer;
