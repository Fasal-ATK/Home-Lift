// src/redux/slices/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const userData = localStorage.getItem('user');
const access_token = localStorage.getItem('access_token'); 

const initialState = {
  user: userData ? JSON.parse(userData) : null,
  accessToken: access_token || null,
  isAuthenticated: !!access_token,
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
      state.isAdmin = user.is_staff;
      state.isProvider = user.is_provider;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('access_token', access_token); 
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isProvider = false;

      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
