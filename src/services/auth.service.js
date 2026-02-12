import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const mapRoleToBackend = (role) => {
  const normalized = String(role || '').toUpperCase();

  if (normalized === 'MECH' || normalized === 'MECHANIC') {
    return 'mechanic';
  }

  if (normalized === 'ADMIN') {
    return 'admin';
  }

  return 'car_owner';
};

export const signup = async ({ fullName, email, phoneNumber, password, role }) => {
  const payload = {
    full_name: fullName,
    password,
    role: mapRoleToBackend(role),
  };

  if (email) {
    payload.email = email;
  }

  if (phoneNumber) {
    payload.phone_number = phoneNumber;
  }

  const response = await api.post(ENDPOINTS.auth.signup, payload);
  return response.data;
};

export const verifyOtp = async ({ otp }) => {
  const response = await api.post(ENDPOINTS.auth.verifyOtp, { otp });
  return response.data;
};

export const resendOtp = async ({ email, phoneNumber }) => {
  const payload = {};

  if (email) {
    payload.email = email;
  }

  if (phoneNumber) {
    payload.phone_number = phoneNumber;
  }

  const response = await api.post(ENDPOINTS.auth.resendOtp, payload);
  return response.data;
};

export const login = async ({ email, phoneNumber, password }) => {
  const payload = { password };

  if (email) {
    payload.email = email;
  }

  if (phoneNumber) {
    payload.phone_number = phoneNumber;
  }

  const response = await api.post(ENDPOINTS.auth.login, payload);
  return response.data;
};

export const logout = async () => {
  const response = await api.post(ENDPOINTS.auth.logout, {});
  return response.data;
};

export const forgotPassword = async ({ email, phoneNumber }) => {
  const payload = {};

  if (email) {
    payload.email = email;
  }

  if (phoneNumber) {
    payload.phone_number = phoneNumber;
  }

  const response = await api.post(ENDPOINTS.auth.forgotPassword, payload);
  return response.data;
};

export const resetPassword = async ({ email, phoneNumber, otp, newPassword, confirmPassword }) => {
  const payload = {
    otp,
    new_password: newPassword,
    confirm_password: confirmPassword,
  };

  if (email) {
    payload.email = email;
  }

  if (phoneNumber) {
    payload.phone_number = phoneNumber;
  }

  const response = await api.post(ENDPOINTS.auth.resetPassword, payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get(ENDPOINTS.auth.me);
  return response.data;
};

export const updatePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.post(ENDPOINTS.auth.updatePassword, {
    current_password: currentPassword,
    new_password: newPassword,
  });

  return response.data;
};

export default {
  signup,
  verifyOtp,
  resendOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updatePassword,
};
