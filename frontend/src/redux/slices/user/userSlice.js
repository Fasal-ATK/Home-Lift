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


// ------------------- Addresses Thunks ------------------- //
export const fetchAddresses = createAsyncThunk(
  'user/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const data = await userService.listAddresses();
      return Array.isArray(data) ? data : data?.results || [];
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createAddress = createAsyncThunk(
  'user/createAddress',
  async (payload, { rejectWithValue }) => {
    try {
      const created = await userService.createAddress(payload);
      return created;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  'user/updateAddress',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const updated = await userService.updateAddress(id, data);
      return updated;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'user/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      await userService.deleteAddress(id);
      return id;
    } catch (err) {
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
    // addresses
    addresses: [],
    addressesLoading: false,
    addressesError: null,
  },
  reducers: {
    clearUserState: (state) => {
      state.providerData = null;
      state.loading = false;
      state.error = null;
      state.providerApplicationStatus = null;
      state.rejectionReason = null;
      state.addresses = [];
      state.addressesLoading = false;
      state.addressesError = null;
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
      })

      // Addresses
      .addCase(fetchAddresses.pending, (state) => {
        state.addressesLoading = true;
        state.addressesError = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addressesLoading = false;
        state.addresses = action.payload;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.addressesLoading = false;
        state.addressesError = action.payload;
      })

      .addCase(createAddress.pending, (state) => {
        state.addressesLoading = true;
        state.addressesError = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.addressesLoading = false;
        // If created is default, unset default on others
        const created = action.payload;
        if (created?.is_default) {
          state.addresses = state.addresses.map((a) => ({ ...a, is_default: a.id === created.id }));
        }
        state.addresses.unshift(created);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.addressesLoading = false;
        state.addressesError = action.payload;
      })

      .addCase(updateAddress.pending, (state) => {
        state.addressesLoading = true;
        state.addressesError = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.addressesLoading = false;
        const updated = action.payload;
        state.addresses = state.addresses.map((a) => (a.id === updated.id ? updated : a));
        if (updated?.is_default) {
          state.addresses = state.addresses.map((a) => ({ ...a, is_default: a.id === updated.id }));
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.addressesLoading = false;
        state.addressesError = action.payload;
      })

      .addCase(deleteAddress.pending, (state) => {
        state.addressesLoading = true;
        state.addressesError = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addressesLoading = false;
        const id = action.payload;
        state.addresses = state.addresses.filter((a) => a.id !== id);
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.addressesLoading = false;
        state.addressesError = action.payload;
      });
  },
});

export const { clearUserState } = userSlice.actions;
export default userSlice.reducer;
