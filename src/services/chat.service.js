import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const buildServiceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  throw error;
};

const assertConversationId = (conversationId) => {
  const safeConversationId = String(conversationId || '').trim();

  if (!safeConversationId) {
    buildServiceError('conversationId is required.');
  }

  return safeConversationId;
};

const toFilePart = (file, index = 0) => {
  if (!file) {
    return null;
  }

  if (typeof file === 'string') {
    const uri = file.trim();

    if (!uri) {
      return null;
    }

    return {
      uri,
      name: `image_${index}.jpg`,
      type: 'image/jpeg',
    };
  }

  if (typeof file === 'object') {
    const uri = String(file.uri || file.path || '').trim();

    if (!uri) {
      return null;
    }

    return {
      uri,
      name: String(file.fileName || file.name || `image_${index}.jpg`),
      type: String(file.type || 'image/jpeg'),
    };
  }

  return null;
};

const buildMessagesEndpoint = (conversationId, { limit = 50, offset = 0 } = {}) => {
  const safeConversationId = assertConversationId(conversationId);
  const basePath = ENDPOINTS.chat.conversationMessages(safeConversationId);
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;

  return `${basePath}?limit=${encodeURIComponent(String(safeLimit))}&offset=${encodeURIComponent(String(safeOffset))}`;
};

export const startConversation = async ({ mechanic_id, job_id }) => {
  const payload = {};

  if (mechanic_id !== undefined) {
    payload.mechanic_id = mechanic_id;
  }

  if (job_id !== undefined) {
    payload.job_id = job_id;
  }

  if (!payload.mechanic_id || !payload.job_id) {
    buildServiceError('mechanic_id and job_id are required.');
  }

  const response = await api.post(ENDPOINTS.chat.createConversation, payload);
  return response.data;
};

export const getConversations = async () => {
  const response = await api.get(ENDPOINTS.chat.conversations);
  return response.data;
};

export const getMessages = async (conversationId, { limit = 50, offset = 0 } = {}) => {
  const endpoint = buildMessagesEndpoint(conversationId, { limit, offset });
  try {
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    if (statusCode !== 404) {
      throw error;
    }

    const fallbackEndpoint = endpoint.replace('/conversations/', '/conversation/');
    const response = await api.get(fallbackEndpoint);
    return response.data;
  }
};

export const markAsRead = async (conversationId) => {
  const safeConversationId = assertConversationId(conversationId);
  const endpoint = ENDPOINTS.chat.markConversationRead(safeConversationId);

  try {
    const response = await api.patch(endpoint);
    return response.data;
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    if (statusCode !== 404 && statusCode !== 405) {
      throw error;
    }

    const response = await api.post(endpoint, {});
    return response.data;
  }
};

export const uploadConversationImages = async (conversationId, images) => {
  const safeConversationId = assertConversationId(conversationId);
  const files = Array.isArray(images) ? images.slice(0, 5) : [];

  if (!files.length) {
    buildServiceError('At least one image is required.');
  }

  const formData = new FormData();

  files.forEach((image, index) => {
    const filePart = toFilePart(image, index);

    if (filePart) {
      formData.append('images', filePart);
    }
  });

  let response;
  try {
    response = await api.post(ENDPOINTS.chat.uploadConversationImages(safeConversationId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch (error) {
    const statusCode = Number(error?.statusCode || 0);
    if (statusCode !== 404) {
      throw error;
    }

    const fallbackEndpoint = `/api/v1/chat/conversation/${encodeURIComponent(String(safeConversationId || ''))}/images`;
    response = await api.post(fallbackEndpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  return response.data;
};

export const createQuotation = async (conversationId, { amount, job_id }) => {
  const safeConversationId = assertConversationId(conversationId);
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    buildServiceError('amount must be a positive number.');
  }

  const safeJobId = String(job_id || '').trim();
  if (!safeJobId) {
    buildServiceError('job_id is required.');
  }

  const response = await api.post(ENDPOINTS.chat.createQuotation(safeConversationId), {
    amount: numericAmount,
    job_id: safeJobId,
  });
  return response.data;
};

export const respondToQuotation = async (conversationId, { quotation_id, action }) => {
  const safeConversationId = assertConversationId(conversationId);
  const safeQuotationId = String(quotation_id || '').trim();
  const safeAction = String(action || '').trim().toLowerCase();

  if (!safeQuotationId) {
    buildServiceError('quotation_id is required.');
  }

  if (safeAction !== 'accept' && safeAction !== 'reject') {
    buildServiceError('action must be accept or reject.');
  }

  const response = await api.post(ENDPOINTS.chat.respondToQuotation(safeConversationId), {
    quotation_id: safeQuotationId,
    action: safeAction,
  });
  return response.data;
};

export const initiateJobPayment = async (jobId, { payment_method }) => {
  const safeJobId = String(jobId || '').trim();
  const safePaymentMethod = String(payment_method || '').trim().toLowerCase();

  if (!safeJobId) {
    buildServiceError('jobId is required.');
  }

  if (!['wallet', 'paystack', 'cash'].includes(safePaymentMethod)) {
    buildServiceError('payment_method must be wallet, paystack, or cash.');
  }

  const response = await api.post(ENDPOINTS.chat.jobPaymentInitiate(safeJobId), {
    payment_method: safePaymentMethod,
  });
  return response.data;
};

export default {
  startConversation,
  getConversations,
  getMessages,
  markAsRead,
  uploadConversationImages,
  createQuotation,
  respondToQuotation,
  initiateJobPayment,
};
