import api from './api';
import { ENDPOINTS } from '../config/endpoints';
import { mockLogin, mockSignup } from './mockServer.js';

const USE_MOCK_SERVER = true;

export const login = async ({ email, password }) => {
  if (USE_MOCK_SERVER) {
    return mockLogin(email, password);
  }

  const response = await api.post(ENDPOINTS.auth.login, { email, password });
  return response.data;
};

export const signup = async (payload) => {
  if (USE_MOCK_SERVER) {
    return mockSignup(payload);
  }

  const response = await api.post(ENDPOINTS.auth.signup, payload);
  return response.data;
};

export default {
  login,
  signup,
};
