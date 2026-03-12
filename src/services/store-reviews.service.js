import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const leaveStoreReview = async (storeId, { rating, comment } = {}) => {
  const safeStoreId = String(storeId || '').trim();
  if (!safeStoreId) {
    const error = new Error('storeId is required.');
    error.statusCode = 400;
    throw error;
  }

  const payload = {
    rating: Number(rating || 0),
    comment: String(comment || '').trim(),
  };

  const response = await api.post(ENDPOINTS.storeReviews.leave(safeStoreId), payload);
  return response.data;
};

export const getStoreReviews = async (storeId) => {
  const safeStoreId = String(storeId || '').trim();
  if (!safeStoreId) {
    const error = new Error('storeId is required.');
    error.statusCode = 400;
    throw error;
  }
  const response = await api.get(ENDPOINTS.storeReviews.list(safeStoreId));
  return response.data;
};

export default {
  leaveStoreReview,
  getStoreReviews,
};
