import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/apiServices';

export const fetchPublicOffers = createAsyncThunk(
    'offers/fetchPublicOffers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await bookingService.getPublicOffers();
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch offers');
        }
    }
);

const offerSlice = createSlice({
    name: 'offers',
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPublicOffers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPublicOffers.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchPublicOffers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default offerSlice.reducer;
