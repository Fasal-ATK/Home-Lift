import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminBookingManagementService } from '../../../services/apiServices';

// Thunks
export const fetchAdminBookings = createAsyncThunk(
    'adminBookings/fetchAdminBookings',
    async (params = {}, { rejectWithValue }) => {
        try {
            const data = await adminBookingManagementService.getBookings(params);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to fetch bookings');
        }
    }
);

export const updateBookingStatusAdmin = createAsyncThunk(
    'adminBookings/updateBookingStatusAdmin',
    async ({ id, status }, { rejectWithValue }) => {
        try {
            // Reusing providerJobService.updateBookingStatus as it points to the same logic
            // Or we could move it to a more generic service
            const data = await adminBookingManagementService.updateStatus(id, status);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to update status');
        }
    }
);

const adminBookingSlice = createSlice({
    name: 'adminBookings',
    initialState: {
        bookings: [],
        totalCount: 0,
        loading: false,
        actionLoading: false,
        error: null,
    },
    reducers: {
        clearAdminError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminBookings.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.bookings = []; // Clear current list to avoid stale data on page change
            })
            .addCase(fetchAdminBookings.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload;
                if (payload.results) {
                    state.bookings = payload.results;
                    state.totalCount = payload.count;
                } else if (Array.isArray(payload)) {
                    state.bookings = payload;
                    state.totalCount = payload.length;
                } else {
                    state.bookings = payload || [];
                    state.totalCount = 0;
                }
            })
            .addCase(fetchAdminBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(updateBookingStatusAdmin.pending, (state) => {
                state.actionLoading = true;
            })
            .addCase(updateBookingStatusAdmin.fulfilled, (state, action) => {
                state.actionLoading = false;
                const idx = state.bookings.findIndex(b => b.id === action.payload.id);
                if (idx !== -1) {
                    state.bookings[idx] = action.payload;
                }
            })
            .addCase(updateBookingStatusAdmin.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload;
            });
    },
});

export const { clearAdminError } = adminBookingSlice.actions;

export const selectTotalAdminBookingsCount = (state) => state.adminBookings.totalCount;

export default adminBookingSlice.reducer;
