// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userData = localStorage.getItem('user');
const accessToken = localStorage.getItem('accessToken');

const initialState = {
  user: userData ? JSON.parse(userData) : null,
  accessToken: accessToken || null,
  isAuthenticated: !!accessToken,
  isAdmin: userData ? JSON.parse(userData).is_staff : false,
  isProvider: userData ? JSON.parse(userData).is_provider : false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, access_token } = action.payload;
      state.user = user;
      state.accessToken = access_token;
      state.isAuthenticated = true;
      state.isAdmin = user?.is_staff || false;
      state.isProvider = user?.is_provider || false;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', access_token);
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isProvider = false;

      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
    },

    setProvider: (state, action) => {
      state.isProvider = action.payload;
      if (state.user) {
        state.user.is_provider = action.payload;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },

    // ✅ New reducer to update user state
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
});

export const { loginSuccess, logout, setProvider, setUser } = authSlice.actions;
export default authSlice.reducer;
