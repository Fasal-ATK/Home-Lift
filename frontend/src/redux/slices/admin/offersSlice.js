import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { offersService } from '../../../services/apiServices';

export const fetchOffers = createAsyncThunk(
    'offers/fetchOffers',
    async (params = {}, { rejectWithValue }) => {
        try {
            return await offersService.getOffers(params);
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to fetch offers');
        }
    }
);

export const createOffer = createAsyncThunk(
    'offers/createOffer',
    async (offerData, { rejectWithValue }) => {
        try {
            return await offersService.createOffer(offerData);
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to create offer');
        }
    }
);

export const updateOffer = createAsyncThunk(
    'offers/updateOffer',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            return await offersService.updateOffer(id, data);
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to update offer');
        }
    }
);

export const deleteOffer = createAsyncThunk(
    'offers/deleteOffer',
    async (id, { rejectWithValue }) => {
        try {
            await offersService.deleteOffer(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Failed to delete offer');
        }
    }
);

const offersSlice = createSlice({
    name: 'offers',
    initialState: {
        list: [],
        totalCount: 0,
        loading: false,
        actionLoading: false,
        error: null,
    },
    reducers: {
        clearOfferError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOffers.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.list = [];
            })
            .addCase(fetchOffers.fulfilled, (state, action) => {
                state.loading = false;
                const payload = action.payload;
                if (payload.results) {
                    state.list = payload.results;
                    state.totalCount = payload.count;
                } else {
                    state.list = payload || [];
                    state.totalCount = state.list.length;
                }
            })
            .addCase(fetchOffers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Create
            .addCase(createOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.list = [action.payload, ...state.list];
                state.totalCount += 1;
            })
            // Update
            .addCase(updateOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.list = state.list.map((item) =>
                    item.id === action.payload.id ? action.payload : item
                );
            })
            // Delete
            .addCase(deleteOffer.fulfilled, (state, action) => {
                state.actionLoading = false;
                state.list = state.list.filter((item) => item.id !== action.payload);
                state.totalCount = Math.max(0, state.totalCount - 1);
            })
            .addMatcher(
                (action) => action.type.endsWith('/pending') && (action.type.includes('createOffer') || action.type.includes('updateOffer') || action.type.includes('deleteOffer')),
                (state) => {
                    state.actionLoading = true;
                }
            )
            .addMatcher(
                (action) => action.type.endsWith('/rejected') && (action.type.includes('createOffer') || action.type.includes('updateOffer') || action.type.includes('deleteOffer')),
                (state, action) => {
                    state.actionLoading = false;
                    state.error = action.payload;
                }
            );
    },
});

export const { clearOfferError } = offersSlice.actions;
export default offersSlice.reducer;
