// src/redux/slices/admin/providerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { adminProviderManagementService } from '../../../services/apiServices';

// Fetch providers
export const fetchProviders = createAsyncThunk(
  'providers/fetchProviders',
  async (_, { rejectWithValue }) => {
    try {
      return await adminProviderManagementService.getProviders();
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to fetch providers'); 
    }
  }
);

// Toggle provider status
export const toggleProviderStatus = createAsyncThunk(
  'providers/toggleStatus',
  async ({ id, is_active }, { rejectWithValue }) => {
    try {
      return await adminProviderManagementService.manageProvider(id, { is_active });
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Failed to update provider');
    }
  }
);

const providerSlice = createSlice({
  name: 'providers',
  initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProviders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviders.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchProviders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleProviderStatus.fulfilled, (state, action) => {
        const idx = state.list.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
      })
      .addCase(toggleProviderStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default providerSlice.reducer;
