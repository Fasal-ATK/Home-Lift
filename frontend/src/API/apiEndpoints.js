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

    adminCustomerManagement: {
        list: '/admin/customers/manage/',
        detail: (id) => `/admin/customers/manage/${id}/`,
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
