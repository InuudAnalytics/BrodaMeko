// Placeholder base URL. Replace with your real backend host when available.
export const BASE_URL = 'https://api.example.com';

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    requestOtp: '/auth/request-otp',
    verifyOtp: '/auth/verify-otp',
  },
  providers: {
    nearby: '/providers/nearby',
  },
  bookings: {
    create: '/bookings/create',
    status: '/bookings/status',
    accept: '/bookings/accept',
    complete: '/bookings/complete',
  },
  wallet: {
    balance: '/wallet/balance',
    fund: '/wallet/fund',
    pay: '/wallet/pay',
    transactions: '/wallet/transactions',
  },
  chat: {
    threads: '/chat/threads',
    messages: '/chat/messages',
  },
};

export default ENDPOINTS;
