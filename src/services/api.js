import axios from 'axios';
import { BASE_URL } from '../config/endpoints';

const getAuthToken = async () => {
  // Stub token getter for now. Replace with AsyncStorage/SecureStore lookup later.
  return null;
};

const normalizeError = (error) => {
  if (error?.response) {
    return {
      message: error.response.data?.message || 'Request failed',
      status: error.response.status,
      data: error.response.data || null,
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
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();

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
