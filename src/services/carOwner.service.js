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

export const addCarOwnerBank = async ({ account_name, account_number, bank_code, bank_name }) => {
  const response = await api.post(ENDPOINTS.me.carOwner.bankAdd, {
    account_name: String(account_name || '').trim(),
    account_number: String(account_number || '').trim(),
    bank_code: String(bank_code || '').trim(),
    bank_name: String(bank_name || '').trim(),
  });
  return response.data;
};

export const getCarOwnerBankDetails = async () => {
  const response = await api.get(ENDPOINTS.me.carOwner.bankGet);
  return response.data;
};

export const verifyCarOwnerBank = async ({ account_number, bank_name }) => {
  const response = await api.post(ENDPOINTS.me.carOwner.bankVerify, {
    account_number: String(account_number || '').trim(),
    bank_name: String(bank_name || '').trim(),
  });
  return response.data;
};

export const deleteCarOwnerBank = async (bankId) => {
  const safeBankId = toId(bankId, 'bankId');
  const response = await api.delete(ENDPOINTS.me.carOwner.bankDelete(safeBankId));
  return response.data;
};

export const setPrimaryCarOwnerBank = async (bankId) => {
  const safeBankId = toId(bankId, 'bankId');
  const response = await api.patch(ENDPOINTS.me.carOwner.bankSetPrimary(safeBankId), {});
  return response.data;
};

export default {
  addCarOwnerBank,
  getCarOwnerBankDetails,
  verifyCarOwnerBank,
  deleteCarOwnerBank,
  setPrimaryCarOwnerBank,
};
