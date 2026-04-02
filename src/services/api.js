import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config/endpoints';

export const TOKEN_STORAGE_KEY = '@brodameko/token';
let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = typeof handler === 'function' ? handler : null;
};

const pickErrorMessage = (payload) => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload?.errors) && payload.errors.length) {
    return payload.errors[0]?.message || payload.errors[0] || null;
  }

  return payload.message || payload.error || null;
};

const normalizeError = (error) => {
  const isTimeout = error?.code === 'ECONNABORTED' || String(error?.message || '').toLowerCase().includes('timeout');

  if (error?.response) {
    const payload = error.response.data;
    const statusCode = error.response.status;
    const isUnauthorized = statusCode === 401;
    const isPublicAuthRequest = Boolean(error?.config?.skipAuth);
    const skipUnauthorizedHandler = Boolean(error?.config?.skipUnauthorizedHandler);
    const serverMessage = pickErrorMessage(payload);
    if (isUnauthorized && !isPublicAuthRequest && !skipUnauthorizedHandler && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }

    return {
      message: isUnauthorized && !skipUnauthorizedHandler
        ? (isPublicAuthRequest
            ? serverMessage || 'Request failed'
            : 'Your session is unauthorized. Please sign in again.')
        : serverMessage || 'Request failed',
      statusCode,
      data: payload || null,
    };
  }

  if (error?.request) {
    return {
      message: isTimeout
        ? 'Request timed out. Please try again.'
        : 'Network error. Please check your connection.',
      statusCode: 0,
      data: null,
    };
  }

  return {
    message: error?.message || 'Unexpected error',
    statusCode: 0,
    data: null,
  };
};

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    if (config?.skipAuth) {
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
      return config;
    }

    const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(normalizeError(error))
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeError(error))
);

export default api;
