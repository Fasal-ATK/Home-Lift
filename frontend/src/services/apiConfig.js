// src/API/api.js
import axios from 'axios';

const api = axios.create({
    baseUrl: import.meta.env.VITE_API_URL,
    withCredentials: true 
});

api.interceptors.request.use((config) => {  
    const token = localStorage.getItem('access');
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default api;
