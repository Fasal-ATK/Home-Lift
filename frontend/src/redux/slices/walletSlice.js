import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from '../../services/apiServices';

export const fetchWallet = createAsyncThunk(
    'wallet/fetchWallet',
    async (_, { rejectWithValue }) => {
        try {
            const data = await bookingService.getWallet();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

const walletSlice = createSlice({
    name: 'wallet',
    initialState: {
        balance: 0,
        recentTransactions: [],
        loading: false,
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchWallet.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWallet.fulfilled, (state, action) => {
                state.loading = false;
                state.balance = action.payload.balance;
                state.recentTransactions = action.payload.recent_transactions;
            })
            .addCase(fetchWallet.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default walletSlice.reducer;
