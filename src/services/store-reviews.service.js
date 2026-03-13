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

export const replyToStoreReview = async (reviewId, { body } = {}) => {
  const safeReviewId = String(reviewId || '').trim();
  const safeBody = String(body || '').trim();

  if (!safeReviewId) {
    const error = new Error('reviewId is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!safeBody) {
    const error = new Error('reply body is required.');
    error.statusCode = 400;
    throw error;
  }

  const response = await api.post(ENDPOINTS.storeReviews.reply(safeReviewId), {
    body: safeBody,
  });
  return response.data;
};

export const getStoreReviewReplies = async (reviewId) => {
  const safeReviewId = String(reviewId || '').trim();
  if (!safeReviewId) {
    const error = new Error('reviewId is required.');
    error.statusCode = 400;
    throw error;
  }

  const response = await api.get(ENDPOINTS.storeReviews.replies(safeReviewId));
  return response.data;
};

export default {
  leaveStoreReview,
  getStoreReviews,
  replyToStoreReview,
  getStoreReviewReplies,
};
