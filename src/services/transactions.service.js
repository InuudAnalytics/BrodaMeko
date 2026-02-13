import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const normalizeResponse = (payload, fallbackMessage) => {
  const root = payload?.data || payload || {};
  const nestedData = root?.data !== undefined ? root.data : root;

  return {
    success: Boolean(root?.success ?? true),
    message: root?.message || fallbackMessage,
    data: nestedData,
  };
};

const assertReference = (reference) => {
  const safeReference = String(reference || '').trim();

  if (!safeReference) {
    const error = new Error('Transaction reference is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  return safeReference;
};

export const getTransactions = async () => {
  const response = await api.get(ENDPOINTS.transactions.list);
  return normalizeResponse(response.data, 'Transactions retrieved successfully.');
};

export const getTransactionDetails = async (reference) => {
  const safeReference = assertReference(reference);
  const response = await api.get(ENDPOINTS.transactions.details(safeReference));
  return normalizeResponse(response.data, 'Transaction details retrieved successfully.');
};

export default {
  getTransactions,
  getTransactionDetails,
};
