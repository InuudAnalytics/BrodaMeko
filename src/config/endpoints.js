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
    devices: {
      register: '/api/v1/auth/devices/register',
    },
  },
  me: {
    mechanic: {
      addServices: '/api/v1/me/mechanic/add-services',
      servicesList: '/api/v1/me/mechanic/services',
      serviceUpdate: (serviceId) => `/api/v1/me/mechanic/${encodeURIComponent(String(serviceId || ''))}`,
      serviceDelete: (serviceId) =>
        `/api/v1/me/mechanic/${encodeURIComponent(String(serviceId || ''))}/delete`,
    },
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
    topUp: '/api/v1/wallets/top-up',
    verifyPayment: (reference, trxref) =>
      `/api/v1/wallets/verify/payment?reference=${encodeURIComponent(String(reference || ''))}&trxref=${encodeURIComponent(String(trxref || ''))}`,
  },
  chat: {
    threads: '/api/v1/chat/threads',
    messages: '/api/v1/chat/messages',
  },
  transactions: {
    list: '/api/v1/transactions/list',
    details: (reference) => `/api/v1/transactions/${encodeURIComponent(String(reference || ''))}`,
  },
};

export default ENDPOINTS;
