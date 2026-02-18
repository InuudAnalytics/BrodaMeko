import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const listFallbacks = [
  ENDPOINTS.transactions.list,
  '/api/v1/transactions',
  '/api/v1/wallets/transactions',
  '/api/v1/wallet/transactions',
];

const detailsFallbacks = (reference) => [
  ENDPOINTS.transactions.details(reference),
  `/api/v1/transactions/details/${encodeURIComponent(String(reference || ''))}`,
  `/api/v1/wallets/transactions/${encodeURIComponent(String(reference || ''))}`,
  `/api/v1/wallet/transactions/${encodeURIComponent(String(reference || ''))}`,
];

const getStatusCode = (error) => Number(error?.response?.status || error?.statusCode || 0);

const tryGet = async (urls) => {
  let lastError = null;

  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];

    try {
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      lastError = error;
      const statusCode = getStatusCode(error);

      // Try next fallback route only for 404-like route misses.
      if (statusCode !== 404) {
        throw error;
      }
    }
  }

  throw lastError;
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
  return tryGet(listFallbacks);
};

export const getTransactionDetails = async (reference) => {
  const safeReference = assertReference(reference);
  return tryGet(detailsFallbacks(safeReference));
};

export default {
  getTransactions,
  getTransactionDetails,
};
