import { authService } from '../services/apiServices';
import store from '../redux/store/store';
import { logout } from '../redux/slices/authSlice';

export const performLogout = async () => {
  try {
    await authService.logout(); 
  } catch (err) {
    console.warn("Backend logout failed or token already invalid:", err);
  } finally {
    store.dispatch(logout());
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};

export const redirectAfterLogout = (isAdmin = false) => {
  window.location.href = isAdmin ? '/admin/login' : '/login';
};
