// src/utils/logoutHelper.js
import { authService } from '../services/apiServices';
import { logout } from '../redux/slices/authSlice';
import store from '../redux/store/store'; // make sure you export your store in store.js

export const performLogout = async (isAdmin = false) => {
  try {
    // Try backend logout (invalidates refresh token cookie)
    await authService.logout();
  } catch (err) {
    console.warn("Backend logout failed or token already invalid:", err);
  } finally {
    // Always clear client state
    store.dispatch(logout());
    window.location.href = isAdmin ? '/admin/login' : '/login';
  }
};
