import axios from 'axios';
import apiEndpoints from './apiEndpoints';
import { performLogout, redirectAfterLogout } from '../utils/logoutHelper';
import store from '../redux/store/store';
import { startLoading, stopLoading } from '../redux/slices/loadingSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Attach access token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;


    // Handle 401 (Unauthorized / Session Timeout)
    if (error.response?.status === 401) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const refreshResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}${apiEndpoints.auth.refreshAccessToken}`,
            {},
            { withCredentials: true }
          );

          const newToken = refreshResponse.data.access;
          localStorage.setItem('accessToken', newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);

        } catch (refreshError) {
          // Refresh failed - terminal session timeout
          const userData = localStorage.getItem('user');
          const isAdmin = userData ? JSON.parse(userData).is_staff : false;
          await performLogout(false);
          redirectAfterLogout(isAdmin);
          return Promise.reject(refreshError);
        }
      } else {
        // Already retried and still 401 - terminal session timeout
        const userData = localStorage.getItem('user');
        const isAdmin = userData ? JSON.parse(userData).is_staff : false;
        await performLogout(false);
        redirectAfterLogout(isAdmin);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
