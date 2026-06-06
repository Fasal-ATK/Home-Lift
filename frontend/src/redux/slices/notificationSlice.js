// redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from '../../services/apiServices';

// Fetch paginated notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (page = 1, { rejectWithValue }) => {
    try {
      const data = await notificationService.list({ page });
      return { ...data, page };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Mark notification as read
export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await notificationService.markRead(id);
      return { id };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Mark multiple as read
export const markNotificationsRead = createAsyncThunk(
  'notifications/markBulkRead',
  async (ids, { rejectWithValue }) => {
    try {
      await notificationService.bulkAction(ids, 'read');
      return { ids };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


// Delete multiple
export const deleteNotifications = createAsyncThunk(
  'notifications/deleteBulk',
  async (ids, { rejectWithValue }) => {
    try {
      await notificationService.bulkAction(ids, 'delete');
      return { ids };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    list: [],
    loading: false,
    hasMore: true,
    page: 1,
    unreadCount: 0,
    error: null,
  },
  reducers: {
    clearNotifications: (state) => {
      state.list = [];
      state.loading = false;
      state.hasMore = true;
      state.page = 1;
      state.unreadCount = 0;
      state.error = null;
    },
    // ✅ Handle real-time notification
    addNotification: (state, action) => {
      state.list.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        const { results, next, page, unread_count } = action.payload;
        
        if (unread_count !== undefined) {
          state.unreadCount = unread_count;
        }

        if (page === 1) {
          state.list = results;
        } else {
          // Filter out any duplicates if they exist
          const existingIds = new Set(state.list.map(n => n.id));
          const newResults = results.filter(n => !existingIds.has(n.id));
          state.list = [...state.list, ...newResults];
        }

        state.hasMore = !!next;
        state.page = page;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Mark as read
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notif = state.list.find((n) => n.id === action.payload.id);
        if (notif && !notif.is_read) {
          notif.is_read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark Multiple as Read
      .addCase(markNotificationsRead.fulfilled, (state, action) => {
        let countRead = 0;
        state.list.forEach((n) => {
          if (action.payload.ids.includes(n.id) && !n.is_read) {
            n.is_read = true;
            countRead += 1;
          }
        });
        state.unreadCount = Math.max(0, state.unreadCount - countRead);
      })
      // Bulk Delete
      .addCase(deleteNotifications.fulfilled, (state, action) => {
        state.list = state.list.filter(n => !action.payload.ids.includes(n.id));
      });
  },
});

export const { clearNotifications, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
