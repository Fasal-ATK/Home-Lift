import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { providerService, userService } from '../../../services/apiServices';

// ------------------- Thunks ------------------- //

// Apply for provider role
export const applyProvider = createAsyncThunk(
  'user/applyProvider',
  async (applicationData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      formData.append('id_doc', applicationData.id_doc);

      const servicesPayload = applicationData.services.map((s, index) => {
        return {
          service: s.service_id,
          doc_field: s.doc ? `service_doc_${index}` : null,
        };
      });

      formData.append('services', JSON.stringify(servicesPayload));

      applicationData.services.forEach((s, index) => {
        if (s.doc) {
          formData.append(`service_doc_${index}`, s.doc);
        }
      });

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

// Fetch provider application status
export const fetchProviderApplicationStatus = createAsyncThunk(
  'user/fetchProviderApplicationStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await providerService.fetchApplicationStatus();
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ Update user profile
export const updateUser = createAsyncThunk(
  'user/updateUser',
  async (data, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(data);
      return response; // { user: {...} }
    } catch (err) {
      console.error('❌ Update user error:', err);
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// ------------------- Slice ------------------- //
const userSlice = createSlice({
  name: 'user',
  initialState: {
    providerData: null,
    loading: false,
    error: null,
    providerApplicationStatus: null,
    rejectionReason: null,
  },
  reducers: {
    clearUserState: (state) => {
      state.providerData = null;
      state.loading = false;
      state.error = null;
      state.providerApplicationStatus = null;
      state.rejectionReason = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Apply Provider
      .addCase(applyProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyProvider.fulfilled, (state) => {
        state.loading = false;
        state.providerApplicationStatus = 'pending';
      })
      .addCase(applyProvider.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Provider Details
      .addCase(fetchProviderDetails.fulfilled, (state, action) => {
        state.providerData = action.payload;
        state.providerApplicationStatus = 'approved';
      })
      .addCase(fetchProviderDetails.rejected, (state) => {
        state.providerData = null;
        state.providerApplicationStatus = null;
      })

      // Fetch Provider Application Status
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
      })

      // ✅ Update User
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.loading = false;
        // optional: you could store updated user in slice if needed
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
