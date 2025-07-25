const apiEndpoints = {
    auth: {
        signup: '/user/register/',
        login: '/user/login/',
        logout: '/user/logout/',
        refreshToken: '/user/token/refresh/',
    },

    adminAuth: {
        login: '/admin/login/',
    },

    otp: {
        sendOtp: '/user/send-otp/',
        verifyOtp: '/user/verify-otp/',
    },

    adminDashboard: {

    }
}

export default apiEndpoints