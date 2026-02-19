export const BASE_URL = 'https://brodameko-server-50cv.onrender.com';
export const CHAT_WS_URL = 'wss://brodameko-server-50cv.onrender.com/api/v1/chat/ws';

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
    uploadAvatar: '/api/v1/auth/upload-avatar',
    verifyAddContact: '/api/v1/auth/verify/add-contact',
    devices: {
      register: '/api/v1/auth/devices/register',
    },
  },
  user: {
    me: '/api/v1/auth/me',
    uploadAvatar: '/api/v1/auth/upload-avatar',
  },
  me: {
    mechanic: {
      addServices: '/api/v1/me/mechanic/add-services',
      servicesList: '/api/v1/me/mechanic/services',
      serviceUpdate: (serviceId) => `/api/v1/me/mechanic/${encodeURIComponent(String(serviceId || ''))}`,
      serviceDelete: (serviceId) =>
        `/api/v1/me/mechanic/${encodeURIComponent(String(serviceId || ''))}/delete`,
      bankAdd: '/api/v1/me/mechanic/bank',
      bankVerify: '/api/v1/me/mechanic/bank/verify',
      bankDelete: (bankId) => `/api/v1/me/mechanic/bank/${encodeURIComponent(String(bankId || ''))}/delete`,
      bankSetPrimary: (bankId) => `/api/v1/me/mechanic/bank/${encodeURIComponent(String(bankId || ''))}/primary`,
      bankList: '/api/v1/me/mechanic/bank/list',
    },
  },
  jobs: {
    create: '/api/v1/jobs/create',
    carOwnerList: '/api/v1/jobs/car-owner',
    carOwnerDetails: (jobId) => `/api/v1/jobs/car-owner/${encodeURIComponent(String(jobId || ''))}`,
    carOwnerUpdate: (jobId) => `/api/v1/jobs/car-owner/${encodeURIComponent(String(jobId || ''))}/update`,
    delete: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}`,
    mechanicAssigned: '/api/v1/jobs/mechanic/assigned',
    mechanicAssignedDetails: (jobId) => `/api/v1/jobs/mechanic/assigned/${encodeURIComponent(String(jobId || ''))}`,
    updateStatus: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/status`,
    confirm: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/confirm`,
    mechanicsForJob: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/mechanics/for-job`,
  },
  wallet: {
    balance: '/api/v1/wallet/balance',
    topUp: '/api/v1/wallets/top-up',
    verifyPayment: '/api/v1/wallets/verify/payment',
  },
  chat: {
    jobPaymentInitiate: (jobId) => `/api/v1/chat/jobs/${encodeURIComponent(String(jobId || ''))}/payment/initiate`,
    createConversation: '/api/v1/chat/conversations/create',
    conversations: '/api/v1/chat/conversations',
    conversationMessages: (conversationId) =>
      `/api/v1/chat/conversations/${encodeURIComponent(String(conversationId || ''))}/messages`,
    uploadConversationImages: (conversationId) =>
      `/api/v1/chat/conversations/images/upload/${encodeURIComponent(String(conversationId || ''))}`,
    markConversationRead: (conversationId) =>
      `/api/v1/chat/conversations/${encodeURIComponent(String(conversationId || ''))}/read`,
    createQuotation: (conversationId) =>
      `/api/v1/chat/conversations/${encodeURIComponent(String(conversationId || ''))}/quotation`,
    respondToQuotation: (conversationId) =>
      `/api/v1/chat/conversations/${encodeURIComponent(String(conversationId || ''))}/quotation/respond`,
  },
  transactions: {
    list: '/api/v1/transactions/list',
    details: (reference) => `/api/v1/transactions/${encodeURIComponent(String(reference || ''))}`,
  },
  ws: {
    chat: CHAT_WS_URL,
  },
};

export default ENDPOINTS;
