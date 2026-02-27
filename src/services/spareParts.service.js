import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const getSellerStore = async () => {
  const response = await api.get(ENDPOINTS.marketplace.sellerStoreMe);
  return response.data;
};

export const createSellerStore = async (payload) => {
  const response = await api.post(ENDPOINTS.marketplace.sellerStore, payload);
  return response.data;
};

export const updateSellerStore = async (payload) => {
  const response = await api.patch(ENDPOINTS.marketplace.sellerStore, payload);
  return response.data;
};

export const uploadSellerStoreBanner = async (bannerFile) => {
  const uri = String(bannerFile?.uri || bannerFile?.path || '').trim();
  if (!uri) {
    const error = new Error('banner file is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const formData = new FormData();
  formData.append('banner', {
    uri,
    name: String(bannerFile?.fileName || bannerFile?.name || 'store-banner.jpg'),
    type: String(bannerFile?.type || 'image/jpeg'),
  });

  const response = await api.post(ENDPOINTS.marketplace.sellerStoreBanner, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export default {
  getSellerStore,
  createSellerStore,
  updateSellerStore,
  uploadSellerStoreBanner,
};
