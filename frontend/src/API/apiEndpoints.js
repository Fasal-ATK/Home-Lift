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
        applicationList: '/admin/providers/applications/',              // GET all applications
        applicationDetail: (id) => `/admin/providers/applications/${id}/`, // GET, PATCH single application
        approveApplication: (id) => `/admin/providers/applications/${id}/approve/`, // POST to approve
        rejectApplication: (id) => `/admin/providers/applications/${id}/reject/`,   // POST to reject
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
        me: '/provider/me/',
      },
      

};

export default apiEndpoints;
