import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService, payWithWallet as apiPayWithWallet } from '../../services/apiServices';

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

export const payWithWalletThunk = createAsyncThunk(
    'wallet/payWithWallet',
    async ({ bookingId, paymentType = "advance" }, { rejectWithValue }) => {
        try {
            const data = await apiPayWithWallet(bookingId, paymentType);
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
            .addCase(payWithWalletThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(payWithWalletThunk.fulfilled, (state, action) => {
                state.loading = false;
                // Assuming action.payload contains the updated balance or we can fetch it again
                // For now, let's assume it returns something like { balance: ... } or just success
                if (action.payload.balance !== undefined) {
                    state.balance = action.payload.balance;
                }
            })
            .addCase(payWithWalletThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default walletSlice.reducer;
