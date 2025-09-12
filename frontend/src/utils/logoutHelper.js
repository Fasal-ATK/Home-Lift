// src/utils/logoutHelper.js
import { authService } from '../services/apiServices';
import { logout } from '../redux/slices/authSlice';
import store from '../redux/store/store';

export const performLogout = async (callBackend = true) => {
  try {
    if (callBackend) {
      await authService.logout(); // only if tokens are still valid
    }
  } catch (err) {
    console.warn("Backend logout failed or token already invalid:", err);
  } finally {
    // Always clear local state
    store.dispatch(logout());
    localStorage.removeItem('accessToken');
  }
};

export const redirectAfterLogout = (isAdmin = false) => {
  window.location.href = isAdmin ? '/admin/login' : '/login';
};
