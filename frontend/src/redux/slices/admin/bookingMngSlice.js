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

const adminBookingSlice = createSlice({
    name: 'adminBookings',
    initialState: {
        bookings: [],
        totalCount: 0,
        loading: false,
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
            });
    },
});

export const { clearAdminError } = adminBookingSlice.actions;

export const selectTotalAdminBookingsCount = (state) => state.adminBookings.totalCount;

export default adminBookingSlice.reducer;
