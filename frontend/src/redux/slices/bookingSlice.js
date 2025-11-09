import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/apiServices';

// Async thunks
export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (_, { rejectWithValue }) => {
    try {
      const data = await bookingService.getBookings(); // expects response.data (array)
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
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

      const data = await bookingService.createBooking(transformedData); // expects response.data (could be {message,data} or booking)
      return data;
    } catch (error) {
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : error.response?.data)
        || error.message
        || 'Failed to create booking';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateBooking = createAsyncThunk(
  'booking/updateBooking',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBooking(id, data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchBookingDetails = createAsyncThunk(
  'booking/fetchBookingDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingDetails(id); // expects response.data (booking object)
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Helper: extract booking object from various backend shapes
const normalizeBooking = (payload) => {
  // payload could be:
  // - booking object
  // - { message, data: booking }
  // - maybe { data: booking } depending on earlier implementations
  if (!payload) return null;
  if (payload.data && (typeof payload.data === 'object')) return payload.data;
  return payload;
};

// Slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
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
        // action.payload expected to be an array of bookings (response.data)
        state.bookings = Array.isArray(action.payload) ? action.payload : (action.payload?.data ?? []);
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createBooking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        // backend might return { message, data } or raw booking object
        const created = normalizeBooking(action.payload) || action.payload;
        if (created) state.bookings.push(created);
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // updateBooking
      .addCase(updateBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        state.loading = false;
        const updated = normalizeBooking(action.payload) || action.payload;
        if (updated && updated.id) {
          const index = state.bookings.findIndex((b) => b.id === updated.id);
          if (index !== -1) state.bookings[index] = updated;
          // also update currentBooking if it's the same id
          if (state.currentBooking && (state.currentBooking.id === updated.id || state.currentBooking?.data?.id === updated.id)) {
            state.currentBooking = updated;
          }
        }
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchBookingDetails
      .addCase(fetchBookingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.loading = false;
        // action.payload expected to be booking object (response.data)
        state.currentBooking = normalizeBooking(action.payload) || action.payload;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
