import axios from 'axios';
import apiEndpoints from './apiEndpoints';
import { performLogout } from '../utils/logoutHelper'; // 🔹 added

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Enables sending cookies
});

// Attach access token to all requests
api.interceptors.request.use(
  (config) => {
    const access_token = localStorage.getItem('accessToken');
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token & retry original request if access token expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}${apiEndpoints.auth.refreshAccessToken}`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.access;
        localStorage.setItem('accessToken', newAccessToken);
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // 🔹 changed: trigger full logout instead of only removing token
        await performLogout(); 
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
