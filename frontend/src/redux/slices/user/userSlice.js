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
export const applyProvider = createAsyncThunk(
  'user/applyProvider',
  async (applicationData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Attach provider’s main ID document
      formData.append('id_doc', applicationData.id_doc);

      // Send services metadata as JSON
      const servicesPayload = applicationData.services.map((s, index) => {
        return {
          service: s.service_id,
          doc_field: s.doc ? `service_doc_${index}` : null, // store file field key reference
        };
      });

      formData.append('services', JSON.stringify(servicesPayload));

      // Append actual files with predictable keys
      applicationData.services.forEach((s, index) => {
        if (s.doc) {
          formData.append(`service_doc_${index}`, s.doc);
        }
      });

      // ✅ Send to API (multipart/form-data automatically handled by Axios)
      return await providerService.apply(formData);
    } catch (err) {
      console.error('❌ Apply provider error:', err);
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

export const fetchProviderApplicationStatus = createAsyncThunk(
  'user/fetchProviderApplicationStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await providerService.fetchApplicationStatus();
      // Only return the actual JSON data
      return response.data;  
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
    rejectionReason: null, // 🔹 add this
  },
  reducers: {
    clearUserState: (state) => {
      state.user = null;
      state.provider = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      state.providerApplicationStatus = null;
      state.rejectionReason = null;
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
        // state.providerApplicationStatus = 'pending';
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
      })

            // -------- Fetch Provider Application Status --------
      .addCase(fetchProviderApplicationStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProviderApplicationStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.providerApplicationStatus = action.payload.status;
        state.rejectionReason = action.payload.reason || null;
      })
      .addCase(fetchProviderApplicationStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.providerApplicationStatus = null;
        state.rejectionReason = null;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
