import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const toId = (value, fieldName) => {
  const safe = String(value || '').trim();
  if (!safe) {
    const error = new Error(`${fieldName} is required.`);
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  return safe;
};

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

export const uploadSellerStoreLogo = async (logoFile) => {
  const uri = String(logoFile?.uri || logoFile?.path || '').trim();
  if (!uri) {
    const error = new Error('logo file is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const formData = new FormData();
  formData.append('logo', {
    uri,
    name: String(logoFile?.fileName || logoFile?.name || 'store-logo.jpg'),
    type: String(logoFile?.type || 'image/jpeg'),
  });

  const response = await api.post(ENDPOINTS.marketplace.sellerStoreLogo, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const addSellerBank = async ({ account_name, account_number, bank_code, bank_name }) => {
  const response = await api.post(ENDPOINTS.me.spareParts.bankAdd, {
    account_name: String(account_name || '').trim(),
    account_number: String(account_number || '').trim(),
    bank_code: String(bank_code || '').trim(),
    bank_name: String(bank_name || '').trim(),
  });
  return response.data;
};

export const verifySellerBank = async ({ account_number, bank_name }) => {
  const response = await api.post(ENDPOINTS.me.spareParts.bankVerify, {
    account_number: String(account_number || '').trim(),
    bank_name: String(bank_name || '').trim(),
  });
  return response.data;
};

export const deleteSellerBank = async (bankId) => {
  const safeBankId = toId(bankId, 'bankId');
  const response = await api.delete(ENDPOINTS.me.spareParts.bankDelete(safeBankId));
  return response.data;
};

export const setPrimarySellerBank = async (bankId) => {
  const safeBankId = toId(bankId, 'bankId');
  const response = await api.patch(ENDPOINTS.me.spareParts.bankSetPrimary(safeBankId), {});
  return response.data;
};

export const createSellerPart = async ({ name, description, price, stock_quantity, category, condition, images }) => {
  const formData = new FormData();
  if (name) formData.append('name', String(name));
  if (description) formData.append('description', String(description));
  if (price !== undefined) formData.append('price', String(price));
  if (stock_quantity !== undefined) formData.append('stock_quantity', String(stock_quantity));
  if (category) formData.append('category', String(category));
  if (condition) formData.append('condition', String(condition));

  if (Array.isArray(images)) {
    images.forEach((img) => {
      const uri = String(img?.uri || img?.path || '').trim();
      if (uri) {
        formData.append('images', {
          uri,
          name: String(img?.fileName || img?.name || 'part.jpg'),
          type: String(img?.type || 'image/jpeg'),
        });
      }
    });
  }

  const response = await api.post(ENDPOINTS.marketplace.sellerParts, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getSellerParts = async () => {
  const response = await api.get(ENDPOINTS.marketplace.sellerPartsMe);
  return response.data;
};

export const updateSellerPart = async (partId, payload = {}) => {
  const safePartId = toId(partId, 'partId');
  const response = await api.patch(ENDPOINTS.marketplace.sellerPartDetails(safePartId), payload);
  return response.data;
};

export const deleteSellerPart = async (partId) => {
  const safePartId = toId(partId, 'partId');
  const response = await api.delete(ENDPOINTS.marketplace.sellerPartDetails(safePartId));
  return response.data;
};

export const deleteSellerPartImage = async (partId, publicId) => {
  const safePartId = toId(partId, 'partId');
  const safePublicId = String(publicId || '').trim();
  if (!safePublicId) {
    const error = new Error('public_id is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.delete(
    `${ENDPOINTS.marketplace.sellerPartDetails(safePartId)}/images?public_id=${encodeURIComponent(safePublicId)}`
  );
  return response.data;
};

export const addSellerPartImages = async (partId, images = []) => {
  const safePartId = toId(partId, 'partId');
  const formData = new FormData();
  images.forEach((img) => {
    const uri = String(img?.uri || img?.path || '').trim();
    if (uri) {
      formData.append('images', {
        uri,
        name: String(img?.fileName || img?.name || 'part.jpg'),
        type: String(img?.type || 'image/jpeg'),
      });
    }
  });

  const response = await api.post(ENDPOINTS.marketplace.sellerPartImages(safePartId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getSellerOrders = async () => {
  const response = await api.get(ENDPOINTS.marketplace.sellerOrders);
  return response.data;
};

export default {
  getSellerStore,
  createSellerStore,
  updateSellerStore,
  uploadSellerStoreBanner,
  uploadSellerStoreLogo,
  addSellerBank,
  verifySellerBank,
  deleteSellerBank,
  setPrimarySellerBank,
  createSellerPart,
  getSellerParts,
  updateSellerPart,
  deleteSellerPart,
  deleteSellerPartImage,
  addSellerPartImages,
  getSellerOrders,
};
