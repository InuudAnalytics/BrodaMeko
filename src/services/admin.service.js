import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const PUBLIC_AUTH_CONFIG = { skipAuth: true };

const normalizeParams = (params = {}) => {
  const next = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    const safe = String(value).trim();
    if (!safe) {
      return;
    }

    next[key] = safe;
  });

  return next;
};

export const adminLogin = async ({ email, password }) => {
  const response = await api.post(
    ENDPOINTS.admin.auth.login,
    {
      email: String(email || '').trim(),
      password: String(password || ''),
    },
    PUBLIC_AUTH_CONFIG
  );

  return response.data;
};

export const adminLogout = async () => {
  const response = await api.post(ENDPOINTS.admin.auth.logout, {});
  return response.data;
};

export const getAdminMe = async () => {
  const response = await api.get(ENDPOINTS.admin.auth.me);
  return response.data;
};

export const updateAdminPassword = async ({ current_password, new_password }) => {
  const response = await api.patch(ENDPOINTS.admin.auth.updatePassword, {
    current_password: String(current_password || ''),
    new_password: String(new_password || ''),
  });

  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await api.get(ENDPOINTS.admin.dashboard);
  return response.data;
};

export const getAdminAuditLogs = async (params = {}) => {
  const response = await api.get(ENDPOINTS.admin.auditLogs, {
    params: normalizeParams(params),
  });
  return response.data;
};

export const getAdminSettings = async () => {
  const response = await api.get(ENDPOINTS.admin.settings);
  return response.data;
};

export const updateAdminSetting = async (settingKey, value) => {
  const safeSettingKey = String(settingKey || '').trim();

  if (!safeSettingKey) {
    const error = new Error('settingKey is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.patch(ENDPOINTS.admin.updateSetting(safeSettingKey), { value });
  return response.data;
};

export const getAdminJobs = async (params = {}) => {
  const response = await api.get(ENDPOINTS.admin.jobs, {
    params: normalizeParams(params),
  });
  return response.data;
};

export default {
  adminLogin,
  adminLogout,
  getAdminMe,
  updateAdminPassword,
  getAdminDashboard,
  getAdminAuditLogs,
  getAdminSettings,
  updateAdminSetting,
  getAdminJobs,
};
