// src/API/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true 
});

api.interceptors.request.use(
    (config) => {
      const access_token = localStorage.getItem('access_token');
      if (access_token) {
        config.headers.Authorization = `Bearer ${access_token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );


api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response.status === 401) {
            localStorage.removeItem('access_token');
        }
    }
)

export default api;