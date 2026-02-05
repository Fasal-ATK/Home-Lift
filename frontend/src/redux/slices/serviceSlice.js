// src/
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminServiceManagementService } from "../../services/apiServices";

// ✅ Thunks
export const fetchServices = createAsyncThunk(
  "services/fetchAll",
  async (params = {}) => {
    return await adminServiceManagementService.getServices(params);
  }
);

export const createService = createAsyncThunk(
  "services/create",
  async (serviceData) => {
    return await adminServiceManagementService.createService(serviceData);
  }
);

export const updateService = createAsyncThunk(
  "services/update",
  async ({ id, data }) => {
    return await adminServiceManagementService.updateService(id, data);
  }
);

export const deleteService = createAsyncThunk(
  "services/delete",
  async (id) => {
    await adminServiceManagementService.deleteService(id);
    return id;
  }
);

// ✅ Slice
const serviceSlice = createSlice({
  name: "services",
  initialState: {
    list: [],
    totalCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        // Reverted to simple array
        state.list = action.payload || [];
        state.totalCount = state.list.length;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create
      .addCase(createService.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.totalCount += 1;
      })

      // Update
      .addCase(updateService.fulfilled, (state, action) => {
        state.list = state.list.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })

      // Delete
      .addCase(deleteService.fulfilled, (state, action) => {
        state.list = state.list.filter((item) => item.id !== action.payload);
        state.totalCount = Math.max(0, state.totalCount - 1);
      });
  },
});

export const selectTotalServicesCount = (state) => state.services.totalCount;

export default serviceSlice.reducer;
