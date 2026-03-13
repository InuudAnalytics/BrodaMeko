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
    deleteUser: '/api/v1/auth/users/delete',
    uploadAvatar: '/api/v1/auth/upload-avatar',
    contactStatus: '/api/v1/auth/users/contact-status',
    recoveryEmail: '/api/v1/auth/users/recovery-email',
    recoveryEmailVerify: '/api/v1/auth/users/recovery-email/verify',
    recoveryEmailRemove: '/api/v1/auth/users/recovery-email/remove',
    verifyAddContact: '/api/v1/auth/verify/add-contact',
    verifyConfirmContact: '/api/v1/auth/verify/confirm-contact',
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
      serviceUpdate: (serviceId) => `/api/v1/me/mechanic/services/${encodeURIComponent(String(serviceId || ''))}`,
      serviceDelete: (serviceId) =>
        `/api/v1/me/mechanic/services/${encodeURIComponent(String(serviceId || ''))}`,
      addressList: '/api/v1/me/mechanic/address',
      addressAdd: '/api/v1/me/mechanic/address',
      addressUpdate: (addressId) =>
        `/api/v1/me/mechanic/address/${encodeURIComponent(String(addressId || ''))}`,
      addressDelete: (addressId) =>
        `/api/v1/me/mechanic/address/${encodeURIComponent(String(addressId || ''))}`,
      addressSetPrimary: (addressId) =>
        `/api/v1/me/mechanic/address/${encodeURIComponent(String(addressId || ''))}/primary`,
      bankAdd: '/api/v1/me/mechanic/bank',
      bankVerify: '/api/v1/me/mechanic/bank/verify',
      bankList: '/api/v1/me/mechanic/bank/list',
      bankGet: '/api/v1/me/mechanic/bank',
      bankDelete: (bankId) => `/api/v1/me/mechanic/bank/${encodeURIComponent(String(bankId || ''))}`,
      bankSetPrimary: (bankId) => `/api/v1/me/mechanic/bank/${encodeURIComponent(String(bankId || ''))}/primary`,
      earnings: '/api/v1/me/mechanic/earnings',
      onlineStatus: '/api/v1/me/mechanic/online-status',
    },
    carOwner: {
      bankAdd: '/api/v1/me/car-owner/bank',
      bankGet: '/api/v1/me/car-owner/bank',
      bankVerify: '/api/v1/me/car-owner/bank/verify',
      bankDelete: (bankId) => `/api/v1/me/car-owner/bank/${encodeURIComponent(String(bankId || ''))}/delete`,
      bankSetPrimary: (bankId) => `/api/v1/me/car-owner/bank/${encodeURIComponent(String(bankId || ''))}/primary`,
    },
    spareParts: {
      // Seller shop address is stored on seller_stores, managed via marketplace store endpoints.
      addressList: '/api/v1/marketplace/seller/store/me',
      addressAdd: '/api/v1/marketplace/seller/store',
      addressUpdate: () => '/api/v1/marketplace/seller/store',
      // Legacy aliases retained to avoid runtime breaks in older callers.
      addressListLegacy: '/api/v1/marketplace/seller/store/me',
      addressAddLegacy: '/api/v1/marketplace/seller/store',
      addressUpdateLegacy: () => '/api/v1/marketplace/seller/store',
      bankAdd: '/api/v1/seller/me/bank',
      bankGet: '/api/v1/seller/me/bank',
      bankVerify: '/api/v1/seller/me/bank/verify',
      bankDelete: (bankId) => `/api/v1/seller/me/bank/${encodeURIComponent(String(bankId || ''))}/delete`,
      bankSetPrimary: (bankId) => `/api/v1/seller/me/bank/${encodeURIComponent(String(bankId || ''))}/primary`,
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
    dispute: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/dispute`,
    mechanicsForJob: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/mechanics/for-job`,
    hire: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/hire`,
    requestRespond: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/request/respond`,
    requestStatus: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/request/status`,
    getConversation: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/get/conversation`,
    mechanicStats: (mechanicId) => `/api/v1/jobs/mechanics/${encodeURIComponent(String(mechanicId || ''))}/stats`,
    locationUpdate: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/location/update`,
    locationLatest: (jobId) => `/api/v1/jobs/${encodeURIComponent(String(jobId || ''))}/location/latest`,
  },
  mechanic: {
    jobRequests: '/api/v1/jobs/mechanic/job-requests',
  },
  notifications: {
    all: '/api/v1/notifications/all',
    markRead: (notificationId) =>
      `/api/v1/notifications/${encodeURIComponent(String(notificationId || ''))}/read`,
    markAllRead: '/api/v1/notifications/read-all',
    delete: (notificationId) => `/api/v1/notifications/${encodeURIComponent(String(notificationId || ''))}`,
  },
  wallet: {
    balance: '/api/v1/wallet/balance',
    topUp: '/api/v1/wallets/top-up',
    verifyPayment: '/api/v1/wallets/verify/payment',
    withdrawRequest: '/api/v1/wallets/request',
    withdrawals: '/api/v1/wallets/withdrawals',
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
  mechanicReviews: {
    leave: (mechanicId) =>
      `/api/v1/mechanic-reviews/${encodeURIComponent(String(mechanicId || ''))}/review`,
    list: (mechanicId) =>
      `/api/v1/mechanic-reviews/${encodeURIComponent(String(mechanicId || ''))}/reviews`,
    reply: (reviewId) =>
      `/api/v1/mechanic-reviews/${encodeURIComponent(String(reviewId || ''))}/reply`,
    replies: (reviewId) =>
      `/api/v1/mechanic-reviews/${encodeURIComponent(String(reviewId || ''))}/replies`,
  },
  storeReviews: {
    leave: (storeId) =>
      `/api/v1/store-reviews/${encodeURIComponent(String(storeId || ''))}/review`,
    list: (storeId) =>
      `/api/v1/store-reviews/${encodeURIComponent(String(storeId || ''))}/reviews`,
    reply: (reviewId) =>
      `/api/v1/store-reviews/${encodeURIComponent(String(reviewId || ''))}/reply`,
    replies: (reviewId) =>
      `/api/v1/store-reviews/${encodeURIComponent(String(reviewId || ''))}/replies`,
  },
  transactions: {
    list: '/api/v1/transactions/list',
    details: (reference) => `/api/v1/transactions/${encodeURIComponent(String(reference || ''))}`,
  },
  admin: {
    auth: {
      login: '/api/v1/admin/auth/login',
      logout: '/api/v1/admin/auth/logout',
      me: '/api/v1/admin/auth/me',
      updatePassword: '/api/v1/admin/auth/password',
    },
    dashboard: '/api/v1/admin/dashboard',
    auditLogs: '/api/v1/admin/audit-logs',
    settings: '/api/v1/admin/settings',
    updateSetting: (settingKey) =>
      `/api/v1/admin/settings/${encodeURIComponent(String(settingKey || ''))}`,
    jobs: '/api/v1/admin/jobs',
  },
  marketplace: {
    sellerStore: '/api/v1/marketplace/seller/store',
    sellerStoreMe: '/api/v1/marketplace/seller/store/me',
    sellerStoreLogo: '/api/v1/marketplace/seller/store/logo',
    sellerStoreBanner: '/api/v1/marketplace/seller/store/banner',
    sellerOrders: '/api/v1/marketplace/seller/orders',
    partsList: '/api/v1/marketplace/parts',
    storeDetails: (storeId) => `/api/v1/marketplace/stores/${encodeURIComponent(String(storeId || ''))}`,
    partDetails: (partId) => `/api/v1/marketplace/parts/${encodeURIComponent(String(partId || ''))}`,
    cart: '/api/v1/marketplace/cart',
    cartItems: '/api/v1/marketplace/cart/items',
    cartItem: (itemId) => `/api/v1/marketplace/cart/items/${encodeURIComponent(String(itemId || ''))}`,
    cartClear: '/api/v1/marketplace/cart/clear',
    orders: '/api/v1/marketplace/orders',
    orderDetails: (orderId) => `/api/v1/marketplace/orders/${encodeURIComponent(String(orderId || ''))}`,
    orderCancel: (orderId) => `/api/v1/marketplace/orders/${encodeURIComponent(String(orderId || ''))}/cancel`,
    orderConfirmItem: (orderId, itemId) =>
      `/api/v1/marketplace/orders/${encodeURIComponent(String(orderId || ''))}/items/${encodeURIComponent(
        String(itemId || '')
      )}/confirm`,
    orderReceivedItem: (orderId, itemId) =>
      `/api/v1/marketplace/orders/${encodeURIComponent(String(orderId || ''))}/items/${encodeURIComponent(
        String(itemId || '')
      )}/received`,
    orderPickupConfirm: (orderId) =>
      `/api/v1/marketplace/orders/${encodeURIComponent(String(orderId || ''))}/pickup-confirm`,
    checkout: '/api/v1/marketplace/orders/checkout',
    sellerParts: '/api/v1/marketplace/seller/parts',
    sellerPartsMe: '/api/v1/marketplace/seller/parts/me',
    sellerPartDetails: (partId) => `/api/v1/marketplace/seller/parts/${encodeURIComponent(String(partId || ''))}`,
    sellerPartImages: (partId) =>
      `/api/v1/marketplace/seller/parts/${encodeURIComponent(String(partId || ''))}/images`,
  },
  ws: {
    chat: CHAT_WS_URL,
  },
};

export default ENDPOINTS;
