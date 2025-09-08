import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { adminServiceManagementService } from "../../services/apiServices";

// ✅ Thunks (they only call the service layer)
export const fetchCategories = createAsyncThunk(
  "categories/fetchAll",
  async () => {
    return await adminServiceManagementService.getCategories();
  }
);

export const createCategory = createAsyncThunk(
  "categories/create",
  async (categoryData) => {
    return await adminServiceManagementService.createCategory(categoryData);
  }
);

export const updateCategory = createAsyncThunk(
  "categories/update",
  async ({ id, data }) => {
    return await adminServiceManagementService.updateCategory(id, data);
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/delete",
  async (id) => {
    await adminServiceManagementService.deleteCategory(id);
    return id; // return id so reducer can filter
  }
);

// ✅ Slice
const categorySlice = createSlice({
  name: "categories",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Create
      .addCase(createCategory.fulfilled, (state, action) => {
        state.list.push(action.payload);
      })

      // Update
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.list = state.list.map((item) =>
          item.id === action.payload.id ? action.payload : item
        );
      })

      // Delete
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.list = state.list.filter((item) => item.id !== action.payload);
      });
  },
});

export default categorySlice.reducer;
