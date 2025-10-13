const apiEndpoints = {
    auth: {
        signup: '/user/register/',
        login: '/user/login/',
        logout: '/user/logout/',
        refreshAccessToken: '/user/token/refresh/',
        googleLogin: '/user/google-auth/',
    },

    adminAuth: {
        login: '/admin/login/',
    },

    otp: {
        sendOtp: '/user/send-otp/',
        verifyOtp: '/user/verify-otp/',
    },

    user: {
        updateProfile : '/user/profile/update/'
    },

    notification:{
        list: 'user/notifications/',
        markRead: (id) => `user/notifications/${id}/read/`,
    },

    adminDashboard: {},

    adminCustomerManagement: {
        list: '/admin/customers/manage/',
        detail: (id) => `/admin/customers/manage/${id}/`,
    },

    adminProviderManagement: {
        list: '/admin/providers/list',
        update: (id) => `/admin/providers/update/${id}/`,

        // Applications
        applicationList: '/admin/providers/applications/',
        applicationDetail: (id) => `/admin/providers/update-applications/${id}/`, // PATCH for approve/reject
    },

    
    adminServiceManagement: {
        listCategories: '/admin/services/categories/',
        categoryDetail: (id) => `/admin/services/categories/${id}/`,
        createCategory: '/admin/services/categories/',   // POST
    
        listServices: '/admin/services/services/',
        serviceDetail: (id) => `/admin/services/services/${id}/`,
        createService: '/admin/services/services/',     // POST
    },

    provider: {
        apply: '/provider/apply/',
        applicationStatus: '/provider/status/',
        me: '/provider/me/',
      },
      

};

export default apiEndpoints;
