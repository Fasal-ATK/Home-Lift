// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userData = localStorage.getItem('user');
const access = localStorage.getItem('access');

const initialState = {
  user: userData ? JSON.parse(userData) : null,
  accessToken: access || null,
  isAuthenticated: !!access,
  isAdmin: userData ? JSON.parse(userData).is_staff : false,
  isProvider: userData ? JSON.parse(userData).is_provider : false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const { user, access } = action.payload;
      state.user = user;
      state.accessToken = access;
      state.isAuthenticated = true;
      state.isAdmin = user.is_staff;
      state.isProvider = user.is_provider;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('access', access);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isProvider = false;

      localStorage.removeItem('user');
      localStorage.removeItem('access');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
