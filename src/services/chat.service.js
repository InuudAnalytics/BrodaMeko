import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const normalizeResponse = (payload, fallbackMessage) => {
  const root = payload?.data || payload || {};
  const nestedData = root?.data !== undefined ? root.data : root;

  return {
    success: Boolean(root?.success ?? true),
    message: root?.message || fallbackMessage,
    data: nestedData,
  };
};

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
  const rawBase = ENDPOINTS.chat.conversationMessages(safeConversationId);
  const basePath = rawBase.split('?')[0];
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
  return normalizeResponse(response.data, 'Conversation started successfully.');
};

export const getConversations = async () => {
  const response = await api.get(ENDPOINTS.chat.conversations);
  return normalizeResponse(response.data, 'Conversations retrieved successfully.');
};

export const getMessages = async (conversationId, { limit = 50, offset = 0 } = {}) => {
  const endpoint = buildMessagesEndpoint(conversationId, { limit, offset });
  const response = await api.get(endpoint);
  return normalizeResponse(response.data, 'Messages retrieved successfully.');
};

export const markAsRead = async (conversationId) => {
  const safeConversationId = assertConversationId(conversationId);
  const response = await api.post(ENDPOINTS.chat.markConversationRead(safeConversationId), {});
  return normalizeResponse(response.data, 'Conversation marked as read.');
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

  const response = await api.post(ENDPOINTS.chat.uploadConversationImages(safeConversationId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return normalizeResponse(response.data, 'Images uploaded successfully.');
};

export default {
  startConversation,
  getConversations,
  getMessages,
  markAsRead,
  uploadConversationImages,
};
