// src/utils/logoutHelper.js
import { authService } from '../services/apiServices';
import store from '../redux/store/store';

export const performLogout = async (callBackend = true) => {
  try {
    if (callBackend) {
      await authService.logout(); 
    }
  } catch (err) {
    console.warn("Backend logout failed or token already invalid:", err);
  } finally {

    store.dispatch({ type: 'LOGOUT_RESET' });
    localStorage.removeItem('accessToken');
  }
};

export const redirectAfterLogout = (isAdmin = false) => {
  window.location.href = isAdmin ? '/admin/login' : '/login';
};
