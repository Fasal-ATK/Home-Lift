import axios from 'axios';
import apiEndpoints from './apiEndpoints';
import { performLogout, redirectAfterLogout } from '../utils/logoutHelper';

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
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401
    if (error.response?.status === 401 && !originalRequest._retry) {
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
        // Check if the user was an admin before logout
        const userData = localStorage.getItem('user');
        const isAdmin = userData ? JSON.parse(userData).is_staff : false;

        // Don't call backend logout here because refresh is already invalid
        await performLogout(false);  // 🚀 skip backend API call
        redirectAfterLogout(isAdmin);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
