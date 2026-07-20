// logoutHelper.js
import { authService } from '../services/apiServices';
import store from '../redux/store/store';
import { logout } from '../redux/slices/authSlice';

export const performLogout = async (callBackend = true) => {
  try {
    if (callBackend) {
      await authService.logout(); // only if still authorized
    }
  } catch {
    // Backend logout failed or token already invalid — clear local state anyway
  } finally {
    store.dispatch(logout());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};

export const redirectAfterLogout = (isAdmin = false) => {
  const isCurrentlyAdminPath = window.location.pathname.startsWith('/admin');
  if (isAdmin || isCurrentlyAdminPath) {
    window.location.href = '/admin/login';
  } else {
    window.location.href = '/login';
  }
};
