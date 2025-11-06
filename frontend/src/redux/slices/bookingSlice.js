import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/apiServices';

// Async thunks
export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (_, { rejectWithValue }) => {
    try {
      const data = await bookingService.getBookings();
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
      // Transform booking_time from "HH:MM-HH:MM" to "HH:MM:SS" format for Django
      const transformedData = { ...bookingData };
      if (transformedData.booking_time && transformedData.booking_time.includes('-')) {
        // Extract start time from range (e.g., "08:00-10:00" -> "08:00:00")
        const startTime = transformedData.booking_time.split('-')[0].trim();
        transformedData.booking_time = `${startTime}:00`; // Add seconds for Django TimeField
      } else if (transformedData.booking_time && transformedData.booking_time.match(/^\d{2}:\d{2}$/)) {
        // Handle case where time is "HH:MM" format (needs seconds)
        transformedData.booking_time = `${transformedData.booking_time}:00`;
      }
      
      // Remove advance from the payload - backend calculates it
      delete transformedData.advance;
      
      // Ensure address is an integer if it's a string
      if (transformedData.address && typeof transformedData.address === 'string') {
        transformedData.address = parseInt(transformedData.address, 10);
      }
      
      // Ensure service is an integer if it's a string
      if (transformedData.service && typeof transformedData.service === 'string') {
        transformedData.service = parseInt(transformedData.service, 10);
      }
      
      const data = await bookingService.createBooking(transformedData);
      return data;
    } catch (error) {
      // Better error handling - extract meaningful error message
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
      const response = await bookingService.getBookingDetails(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

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
        state.bookings = action.payload;
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
        state.bookings.push(action.payload.data); // backend returns {message, data}
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
        const index = state.bookings.findIndex(
          (b) => b.id === action.payload.data.id
        );
        if (index !== -1) state.bookings[index] = action.payload.data;
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
        state.currentBooking = action.payload.data;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentBooking, clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
