import api from '../API/apiConfig';
import apiEndpoints from '../API/apiEndpoints';

export const authService = {
    signup: async (userData) => {
        const response = await api.post(apiEndpoints.auth.signup, userData);
        return response.data;
    },
    login: async (userData) => {
        const response = await api.post(apiEndpoints.auth.login, userData);
        return response.data;
    },

    adminLogin: async (adminData) => {  
        const response = await api.post(apiEndpoints.adminAuth.login, adminData);
        console.log(response.data);
        return response.data;
    },

    logout: async () => {
        const response = await api.post(apiEndpoints.auth.logout);
        return response.data;
    },
    
}

export const otpService = {
    sendOtp: async (data) => {
      const response = await api.post(apiEndpoints.otp.sendOtp, data);
      return response.data;
    },
  
    verifyOtp: async (data) => {
      const response = await api.post(apiEndpoints.otp.verifyOtp, data);
      return response.data;
    },
  };

