import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const assertMechanicId = (mechanicId) => {
  const safeMechanicId = String(mechanicId || '').trim();

  if (!safeMechanicId) {
    const error = new Error('mechanicId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  return safeMechanicId;
};

export const leaveMechanicReview = async (mechanicId, { rating, comment } = {}) => {
  const safeMechanicId = assertMechanicId(mechanicId);
  const numericRating = Number(rating);
  const safeComment = String(comment || '').trim();

  if (!Number.isFinite(numericRating) || numericRating <= 0) {
    const error = new Error('rating must be a positive number.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.post(ENDPOINTS.mechanicReviews.leave(safeMechanicId), {
    rating: numericRating,
    comment: safeComment,
  });

  return response.data;
};

export const getMechanicReviews = async (mechanicId) => {
  const safeMechanicId = assertMechanicId(mechanicId);
  const response = await api.get(ENDPOINTS.mechanicReviews.list(safeMechanicId));
  return response.data;
};

export default {
  leaveMechanicReview,
  getMechanicReviews,
};
