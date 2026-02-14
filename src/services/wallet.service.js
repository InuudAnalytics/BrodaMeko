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

const buildServiceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  throw error;
};

export const validateTopUpAmount = (amount) => {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    buildServiceError('Amount must be a positive number.');
  }

  return parsedAmount;
};

export const topUpWallet = async (amount) => {
  const validAmount = validateTopUpAmount(amount);
  const response = await api.post(ENDPOINTS.wallet.topUp, { amount: validAmount });

  return normalizeResponse(response.data, 'Wallet top-up initialized.');
};

export const verifyWalletPayment = async (reference, trxref) => {
  const endpoint = ENDPOINTS.wallet.verifyPayment(reference, trxref);
  const response = await api.get(endpoint);

  return normalizeResponse(response.data, 'Wallet payment verification completed.');
};

export default {
  topUpWallet,
  verifyWalletPayment,
  validateTopUpAmount,
};
