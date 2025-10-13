// src/services/apiServices.js
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
        return response.data;
    },

    logout: async () => {
        const response = await api.post(apiEndpoints.auth.logout);
        return response.data;
    },

};

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

export const userService = {
    updateProfile: async (data) => {
        const response = await api.patch(apiEndpoints.user.updateProfile,data,);
        return response.data;
    },
};

export const notificationService = {
    list: async () => {
        const response = await api.get(apiEndpoints.notification.list);
        return response.data;
    },
    markRead: async (id) => {
        const response = await api.post(apiEndpoints.notification.markRead(id));
        return response.data;
    },
};

export const providerService = {
    apply: async (formData) => {
      const response = await api.post(apiEndpoints.provider.apply, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    fetchDetails: async () => {
      const response = await api.get(apiEndpoints.provider.me);
      return response.data;
    },
     fetchApplicationStatus: () => api.get(apiEndpoints.provider.applicationStatus), 
  };
  

export const adminServiceManagementService = {
    // Categories
    getCategories: async () => {
        const response = await api.get(apiEndpoints.adminServiceManagement.listCategories);
        return response.data;
    },
    createCategory: async (data) => {
        const response = await api.post(apiEndpoints.adminServiceManagement.listCategories, data);
        return response.data;
    },
    updateCategory: async (id, data) => {
        const response = await api.patch(apiEndpoints.adminServiceManagement.categoryDetail(id), data);
        return response.data;
    },
    deleteCategory: async (id) => {
        const response = await api.delete(apiEndpoints.adminServiceManagement.categoryDetail(id));
        return response.data;
    },

// Services
    getServices: async () => {
        const response = await api.get(apiEndpoints.adminServiceManagement.listServices);
        return response.data;
    },
    createService: async (data) => {
        const response = await api.post(apiEndpoints.adminServiceManagement.listServices, data);
        return response.data;
    },
    updateService: async (id, data) => {
        const response = await api.patch(apiEndpoints.adminServiceManagement.serviceDetail(id), data);
        return response.data;
    },
    deleteService: async (id) => {
        const response = await api.delete(apiEndpoints.adminServiceManagement.serviceDetail(id));
        return response.data;
    },
};

export const adminCustomerManagementService = {
    getCustomers: async () => {
        const response = await api.get(apiEndpoints.adminCustomerManagement.list);
        return response.data;
    },
    manageCustomer: async (id, data) => {
        const response = await api.patch(apiEndpoints.adminCustomerManagement.detail(id), data);
        return response.data;
    },
};

export const adminProviderManagementService = {
  getProviders: async () => {
    const response = await api.get(apiEndpoints.adminProviderManagement.list);
    return response.data;
  },

  manageProvider: async (id, data) => {
    const response = await api.patch(
      apiEndpoints.adminProviderManagement.update(id),
      data
    );
    return response.data;
  },

  getApplications: async () => {
    const response = await api.get(
      apiEndpoints.adminProviderManagement.applicationList
    );
    return response.data;
  },

  updateApplicationStatus: async (id, data) => {
    // { status: "approved" } or { status: "rejected", rejection_reason: "..." }
    const response = await api.patch(
      apiEndpoints.adminProviderManagement.applicationDetail(id),
      data
    );
    return response.data;
  },

  // ✅ Explicit wrapper for approving an application
  approveApplication: async (id, extraData = {}) => {
    return await adminProviderManagementService.updateApplicationStatus(id, {
      status: "approved",
      ...extraData,
    });
  },

  // ✅ Explicit wrapper for rejecting an application
  rejectApplication: async (id, extraData = {}) => {
    return await adminProviderManagementService.updateApplicationStatus(id, {
      status: "rejected",
      rejection_reason: extraData.rejection_reason || "Rejected by admin",
    });
  },
};


