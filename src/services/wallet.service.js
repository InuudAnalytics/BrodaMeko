import { ENDPOINTS } from '../config/endpoints';
import api from './api';
import { getCurrentUser } from './auth.service';

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
  return response.data;
};

export const verifyWalletPayment = async (referenceInput, trxrefInput) => {
  const reference =
    typeof referenceInput === 'object'
      ? String(referenceInput?.reference || '').trim()
      : String(referenceInput || '').trim();
  const trxref =
    typeof referenceInput === 'object'
      ? String(referenceInput?.trxref || '').trim()
      : String(trxrefInput || '').trim();

  const response = await api.get(ENDPOINTS.wallet.verifyPayment, {
    params: {
      reference,
      trxref,
    },
  });
  return response.data;
};

export const getWalletBalance = async () => {
  const me = await getCurrentUser();
  const wallet =
    (me?.wallet && typeof me.wallet === 'object' ? me.wallet : null) ||
    (me?.data?.wallet && typeof me.data.wallet === 'object' ? me.data.wallet : null) ||
    null;

  if (wallet) {
    return wallet;
  }

  // Fallback for legacy backend shape/rollout windows.
  const response = await api.get(ENDPOINTS.wallet.balance);
  return response.data;
};

export default {
  topUpWallet,
  verifyWalletPayment,
  validateTopUpAmount,
  getWalletBalance,
};
