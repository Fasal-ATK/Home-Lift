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

    resetPassword: async (data) => {
        const response = await api.post(apiEndpoints.auth.resetPassword, data);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await api.post(apiEndpoints.auth.changePassword, data);
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
        const response = await api.patch(apiEndpoints.user.updateProfile, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    fetchProfile: async () => {
        const response = await api.get(apiEndpoints.user.updateProfile);
        return response.data;
    },

    // Addresses
    listAddresses: async () => {
        const response = await api.get(apiEndpoints.user.addresses);
        return response.data;
    },
    createAddress: async (data) => {
        const response = await api.post(apiEndpoints.user.addresses, data);
        return response.data;
    },
    updateAddress: async (id, data) => {
        const response = await api.patch(apiEndpoints.user.addressDetail(id), data);
        return response.data;
    },
    deleteAddress: async (id) => {
        const response = await api.delete(apiEndpoints.user.addressDetail(id));
        return response.data;
    },

};

export const bookingService = {
    createBooking: async (data) => {
        const response = await api.post(apiEndpoints.user.booking, data);
        return response.data;
    },

    getBookings: async (params = {}) => {
        const response = await api.get(apiEndpoints.user.booking, { params });
        return response.data;
    },

    getBookingDetails: async (id) => {
        const response = await api.get(apiEndpoints.user.updateBooking(id));
        return response.data;
    },

    cancelBooking: async (id, data) => {
        const response = await api.delete(apiEndpoints.user.updateBooking(id), data);
        return response.data;
    },

    downloadInvoice: async (id) => {
        const response = await api.get(apiEndpoints.user.downloadInvoice(id), {
            responseType: 'blob', // Important for PDF download
        });
        return response.data;
    },

    getWallet: async () => {
        const response = await api.get(apiEndpoints.user.wallet);
        return response.data;
    },
};


export const providerJobService = {
    getProviderJobs: async (params = {}) => {
        const response = await api.get(apiEndpoints.provider.jobs.list, { params });
        return response.data;
    },



    getMyAppointments: async () => {
        const response = await api.get(apiEndpoints.provider.jobs.myAppointments);
        return response.data;
    },



    acceptJob: async (id) => {
        const response = await api.post(apiEndpoints.provider.jobs.accept(id));
        return response.data;
    },

    updateBookingStatus: async (id, status) => {
        const response = await api.patch(apiEndpoints.provider.jobs.updateStatus(id), { status });
        return response.data;
    },
};


export const notificationService = {
    list: async (params = {}) => {
        const response = await api.get(apiEndpoints.notification.list, { params });
        return response.data;
    },
    markRead: async (id) => {
        const response = await api.patch(apiEndpoints.notification.markRead(id));
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
    getCategories: async (params = {}) => {
        const response = await api.get(apiEndpoints.adminServiceManagement.listCategories, { params });
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
    getServices: async (params = {}) => {
        const response = await api.get(apiEndpoints.adminServiceManagement.listServices, { params });
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
    getCustomers: async (params = {}) => {
        const response = await api.get(apiEndpoints.adminCustomerManagement.list, { params });
        return response.data;
    },
    manageCustomer: async (id, data) => {
        const response = await api.patch(apiEndpoints.adminCustomerManagement.detail(id), data);
        return response.data;
    },
};

export const adminProviderManagementService = {
    getProviders: async (params = {}) => {
        const response = await api.get(apiEndpoints.adminProviderManagement.list, { params });
        return response.data;
    },

    manageProvider: async (id, data) => {
        const response = await api.patch(
            apiEndpoints.adminProviderManagement.update(id),
            data
        );
        return response.data;
    },

    getApplications: async (params = {}) => {
        const response = await api.get(
            apiEndpoints.adminProviderManagement.applicationList,
            { params }
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

export const adminBookingManagementService = {
    getBookings: async (params = {}) => {
        const response = await api.get(apiEndpoints.adminBookingManagement.list, { params });
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.patch(apiEndpoints.adminBookingManagement.updateStatus(id), { status });
        return response.data;
    },
};

export const offersService = {
    getOffers: async (params = {}) => {
        const response = await api.get(apiEndpoints.offers.list, { params });
        return response.data;
    },
    createOffer: async (data) => {
        const response = await api.post(apiEndpoints.offers.list, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    updateOffer: async (id, data) => {
        const response = await api.patch(apiEndpoints.offers.detail(id), data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
    deleteOffer: async (id) => {
        const response = await api.delete(apiEndpoints.offers.detail(id));
        return response.data;
    },
};

export const createPaymentIntent = async (booking_id, payment_type = "advance") => {
    const res = await api.post(apiEndpoints.payment.createPaymentIntent, {
        booking_id,
        payment_type,
    });
    return res.data.client_secret;
};

export const payWithWallet = async (booking_id) => {
    const res = await api.post(apiEndpoints.payment.walletPay, {
        booking_id,
    });
    return res.data;
};
