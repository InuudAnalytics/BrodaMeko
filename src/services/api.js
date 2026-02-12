import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config/endpoints';

export const TOKEN_STORAGE_KEY = '@brodameko/token';

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
  if (error?.response) {
    const payload = error.response.data;

    return {
      message: pickErrorMessage(payload) || 'Request failed',
      status: error.response.status,
      data: payload || null,
    };
  }

  if (error?.request) {
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      data: null,
    };
  }

  return {
    message: error?.message || 'Unexpected error',
    status: 0,
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
