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
  const root = me && typeof me === 'object' ? me : {};
  const nestedData =
    root?.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? root.data
      : {};
  const nestedRootData =
    nestedData?.data &&
    typeof nestedData.data === 'object' &&
    !Array.isArray(nestedData.data)
      ? nestedData.data
      : {};

  const walletCandidates = [
    root?.wallet,
    nestedData?.wallet,
    nestedRootData?.wallet,
  ];
  const wallet =
    walletCandidates.find(
      candidate => candidate && typeof candidate === 'object' && !Array.isArray(candidate),
    ) || null;

  if (wallet) {
    return wallet;
  }

  // Wallet balance is sourced from /auth/me on current backend.
  return {
    balance: Number(
      root?.balance ||
        nestedData?.balance ||
        root?.available_balance ||
        nestedData?.available_balance ||
        root?.wallet_balance ||
        nestedData?.wallet_balance ||
        0,
    ),
    available_balance: Number(
      root?.available_balance ||
        nestedData?.available_balance ||
        root?.balance ||
        nestedData?.balance ||
        root?.wallet_balance ||
        nestedData?.wallet_balance ||
        0,
    ),
    currency: String(
      root?.currency ||
        nestedData?.currency ||
        root?.wallet_currency ||
        nestedData?.wallet_currency ||
        'NGN',
    ),
  };
};

export const requestWithdrawal = async (amount) => {
  const validAmount = validateTopUpAmount(amount);
  const response = await api.post(ENDPOINTS.wallet.withdrawRequest, { amount: validAmount });
  return response.data;
};

export const getWithdrawals = async () => {
  const response = await api.get(ENDPOINTS.wallet.withdrawals);
  return response.data;
};

export default {
  topUpWallet,
  verifyWalletPayment,
  validateTopUpAmount,
  getWalletBalance,
  requestWithdrawal,
  getWithdrawals,
};
