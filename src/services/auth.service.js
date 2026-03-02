import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const PUBLIC_AUTH_CONFIG = { skipAuth: true };

const mapRoleToBackend = (role) => {
  const normalized = String(role || '').toUpperCase();

  if (normalized === 'MECH' || normalized === 'MECHANIC') {
    return 'mechanic';
  }

  if (normalized === 'ADMIN') {
    return 'admin';
  }

  if (normalized === 'SELLER' || normalized === 'SPARE_PARTS_SELLER' || normalized === 'SPARE_PARTS') {
    return 'seller';
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

  const response = await api.post(ENDPOINTS.auth.signup, payload, PUBLIC_AUTH_CONFIG);
  return response.data;
};

export const verifyOtp = async ({ otp }) => {
  const response = await api.post(ENDPOINTS.auth.verifyOtp, { otp }, PUBLIC_AUTH_CONFIG);
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

  const response = await api.post(ENDPOINTS.auth.resendOtp, payload, PUBLIC_AUTH_CONFIG);
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

  const response = await api.post(ENDPOINTS.auth.login, payload, PUBLIC_AUTH_CONFIG);
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

  const response = await api.post(ENDPOINTS.auth.forgotPassword, payload, PUBLIC_AUTH_CONFIG);
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

  const response = await api.patch(ENDPOINTS.auth.resetPassword, payload, PUBLIC_AUTH_CONFIG);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get(ENDPOINTS.auth.me);
  return response.data;
};

export const updatePassword = async ({ currentPassword, newPassword }) => {
  const response = await api.patch(ENDPOINTS.auth.updatePassword, {
    current_password: currentPassword,
    new_password: newPassword,
  });

  return response.data;
};

export const getContactStatus = async () => {
  const response = await api.get(ENDPOINTS.auth.contactStatus);
  return response.data;
};

export const deleteAccount = async ({ password }) => {
  const safePassword = String(password || '').trim();
  if (!safePassword) {
    const error = new Error('password is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.delete(ENDPOINTS.auth.deleteUser, {
    data: { password: safePassword },
  });
  return response.data;
};

export const uploadAvatar = async (avatarFile) => {
  const uri = String(avatarFile?.uri || avatarFile?.path || '').trim();

  if (!uri) {
    const error = new Error('avatar file is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const formData = new FormData();
  formData.append('avatar', {
    uri,
    name: String(avatarFile?.fileName || avatarFile?.name || 'avatar.jpg'),
    type: String(avatarFile?.type || 'image/jpeg'),
  });

  const response = await api.post(ENDPOINTS.auth.uploadAvatar, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export const verifyAddContact = async ({ email, phoneNumber }) => {
  const endpoint = ENDPOINTS.auth.verifyAddContact;
  const normalizedEmail = String(email || '').trim();
  const normalizedPhone = String(phoneNumber || '').trim();

  const payloads = [];

  if (normalizedEmail) {
    payloads.push({ email: normalizedEmail });
  }

  if (normalizedPhone) {
    payloads.push({ phone_number: normalizedPhone });
    payloads.push({ 'phone-number': normalizedPhone });
    payloads.push({ phoneNumber: normalizedPhone });
  }

  if (!payloads.length) {
    const error = new Error('email or phone number is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  let lastError = null;

  for (let index = 0; index < payloads.length; index += 1) {
    try {
      const response = await api.post(endpoint, payloads[index]);
      return response.data;
    } catch (requestError) {
      lastError = requestError;

      const statusCode = Number(requestError?.statusCode || 0);
      if (statusCode !== 404 && statusCode !== 400) {
        throw requestError;
      }
    }
  }

  throw lastError || new Error('Could not verify contact.');
};

export const verifyConfirmContact = async ({ otp }) => {
  const safeOtp = String(otp || '').trim();

  if (!safeOtp) {
    const error = new Error('otp is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.post(ENDPOINTS.auth.verifyConfirmContact, { otp: safeOtp });
  return response.data;
};

export const googleLogin = async ({ idToken, role }) => {
  const payload = {
    id_token: idToken,
    role: mapRoleToBackend(role),
  };

  // Assuming the backend has this endpoint. 
  // If not, it needs to be created on the backend.
  // Using a likely path based on other endpoints.
  const response = await api.post('/api/v1/auth/google', payload, PUBLIC_AUTH_CONFIG);
  return response.data;
};

export default {
  signup,
  verifyOtp,
  resendOtp,
  login,
  googleLogin,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updatePassword,
  getContactStatus,
  deleteAccount,
  uploadAvatar,
  verifyAddContact,
  verifyConfirmContact,
};
