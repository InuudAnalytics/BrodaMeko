export const BASE_URL = 'https://brodameko-server-50cv.onrender.com';

export const ENDPOINTS = {
  auth: {
    signup: '/api/v1/auth/signup',
    verifyOtp: '/api/v1/auth/verify-otp',
    resendOtp: '/api/v1/auth/resend-otp',
    login: '/api/v1/auth/login',
    logout: '/api/v1/auth/logout',
    forgotPassword: '/api/v1/auth/forgot-password',
    resetPassword: '/api/v1/auth/reset-password/reset',
    me: '/api/v1/auth/me',
    updatePassword: '/api/v1/auth/update-password',
  },
  providers: {
    nearby: '/api/v1/providers/nearby',
  },
  bookings: {
    create: '/api/v1/bookings/create',
    status: '/api/v1/bookings/status',
    accept: '/api/v1/bookings/accept',
    complete: '/api/v1/bookings/complete',
  },
  wallet: {
    balance: '/api/v1/wallet/balance',
    fund: '/api/v1/wallet/fund',
    pay: '/api/v1/wallet/pay',
    transactions: '/api/v1/wallet/transactions',
  },
  chat: {
    threads: '/api/v1/chat/threads',
    messages: '/api/v1/chat/messages',
  },
};

export default ENDPOINTS;
