// src/API/apiEndpoints.js
const apiEndpoints = {
    auth: {
        signup: '/user/register/',
        login: '/user/login/',
        logout: '/user/logout/',
        refreshAccessToken: '/user/token/refresh/',
    },

    adminAuth: {
        login: '/admin/login/',
    },

    otp: {
        sendOtp: '/user/send-otp/',
        verifyOtp: '/user/verify-otp/',
    },

    adminDashboard: {},

    adminUserManagement: {
        list: '/admin/customers',
        block: '/admin/block/unblock-customer',
    },

    adminProviderManagement: {
        list: '/admin/providers',
    },
    
    adminServiceManagement: {
        // Category APIs
        listCategories: '/admin/services/categories/',
        categoryDetail: (id) => `/admin/services/categories/${id}/`,
        createCategory: '/admin/services/categories/',   // POST
    
        // Service APIs
        listServices: '/admin/services/services/',
        serviceDetail: (id) => `/admin/services/services/${id}/`,
        createService: '/admin/services/services/',     // POST
    }
    
};

export default apiEndpoints;
