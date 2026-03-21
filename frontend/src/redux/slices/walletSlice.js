import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService, payWithWallet as apiPayWithWallet, walletService } from '../../services/apiServices';

export const fetchWallet = createAsyncThunk(
    'wallet/fetchWallet',
    async (type = 'user', { rejectWithValue }) => {
        try {
            const data = await bookingService.getWallet(type);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const withdrawWalletThunk = createAsyncThunk(
    'wallet/withdrawWallet',
    async (amount, { rejectWithValue, dispatch }) => {
        try {
            const data = await walletService.withdrawFunds(amount);
            // Refresh wallet after withdrawal
            dispatch(fetchWallet('provider'));
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.detail || error.message);
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
        withdrawLoading: false,
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
            .addCase(withdrawWalletThunk.pending, (state) => {
                state.withdrawLoading = true;
                state.error = null;
            })
            .addCase(withdrawWalletThunk.fulfilled, (state) => {
                state.withdrawLoading = false;
            })
            .addCase(withdrawWalletThunk.rejected, (state, action) => {
                state.withdrawLoading = false;
                state.error = action.payload;
            })
            .addCase(payWithWalletThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(payWithWalletThunk.fulfilled, (state, action) => {
                state.loading = false;
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
