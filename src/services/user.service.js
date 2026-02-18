import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const buildFilePart = (file, fallbackName) => {
  const uri = String(file?.uri || file?.path || '').trim();

  if (!uri) {
    const error = new Error('file uri is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  return {
    uri,
    name: String(file?.fileName || file?.name || fallbackName),
    type: String(file?.type || 'image/jpeg'),
  };
};

export const getMyProfile = async () => {
  const response = await api.get(ENDPOINTS.user.me);
  return response.data;
};

export const uploadAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar', buildFilePart(avatarFile, 'avatar.jpg'));

  const response = await api.post(ENDPOINTS.user.uploadAvatar, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return response.data;
};

export default {
  getMyProfile,
  uploadAvatar,
};
