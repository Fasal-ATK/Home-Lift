// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService, providerService } from '../../../services/apiServices';

// ------------------- Thunks ------------------- //

// Login user
export const loginUser = createAsyncThunk(
  'user/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authService.login({ email, password });
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'user/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Apply for provider role
// userSlice.js
export const applyProvider = createAsyncThunk(
  'user/applyProvider',
  async (applicationData, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('id_doc', applicationData.id_doc);
      formData.append('document_type', applicationData.document_type);

      applicationData.services.forEach((s, index) => {
        formData.append(`services[${index}][service_id]`, s.service_id);
        if (s.doc) formData.append(`services[${index}][doc]`, s.doc);
      });

      return await providerService.apply(formData); // must send as multipart
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// Fetch provider details
export const fetchProviderDetails = createAsyncThunk(
  'user/fetchProviderDetails',
  async (_, { rejectWithValue }) => {
    try {
      return await providerService.fetchDetails();
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ------------------- Slice ------------------- //
const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    provider: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    providerApplicationStatus: null, // pending, approved, rejected
  },
  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.provider = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.providerApplicationStatus = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // -------- Login --------
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.provider = action.payload.user.is_provider
          ? action.payload.provider_details
          : null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // -------- Logout --------
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.provider = null;
        state.isAuthenticated = false;
      })

      // -------- Apply Provider --------
      .addCase(applyProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.providerApplicationStatus = 'pending';
      })
      .addCase(applyProvider.fulfilled, (state) => {
        state.loading = false;
        state.providerApplicationStatus = 'pending';
      })
      .addCase(applyProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // -------- Fetch Provider Details --------
      .addCase(fetchProviderDetails.fulfilled, (state, action) => {
        state.provider = action.payload;
        if (state.user) state.user.is_provider = true;
        state.providerApplicationStatus = 'approved';
      })
      .addCase(fetchProviderDetails.rejected, (state) => {
        state.provider = null;
        if (state.user) state.user.is_provider = false;
        state.providerApplicationStatus = null;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
