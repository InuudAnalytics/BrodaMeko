import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const ISSUE_TYPES = ['flat_tires', 'battery_problem', 'brake_failure', 'engine_trouble'];

const toNumber = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    const error = new Error(`${fieldName} must be a number.`);
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  return parsed;
};

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

export const addMechanicService = async ({ issue_type, min_price, max_price }) => {
  const safeIssueType = String(issue_type || '').trim();
  const minPrice = toNumber(min_price, 'min_price');
  const maxPrice = toNumber(max_price, 'max_price');

  if (!safeIssueType) {
    const error = new Error('issue_type is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  if (minPrice > maxPrice) {
    const error = new Error('min_price cannot be greater than max_price.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.post(ENDPOINTS.me.mechanic.addServices, {
    issue_type: safeIssueType,
    min_price: minPrice,
    max_price: maxPrice,
  });

  return response.data;
};

export const getMyMechanicServices = async () => {
  const response = await api.get(ENDPOINTS.me.mechanic.servicesList);
  return response.data;
};

export const updateMechanicService = async (serviceId, { min_price, max_price } = {}) => {
  const safeServiceId = toId(serviceId, 'serviceId');
  const payload = {};

  if (min_price !== undefined) {
    payload.min_price = toNumber(min_price, 'min_price');
  }

  if (max_price !== undefined) {
    payload.max_price = toNumber(max_price, 'max_price');
  }

  if (!Object.keys(payload).length) {
    const error = new Error('At least one of min_price or max_price is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  if (payload.min_price !== undefined && payload.max_price !== undefined && payload.min_price > payload.max_price) {
    const error = new Error('min_price cannot be greater than max_price.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.patch(ENDPOINTS.me.mechanic.serviceUpdate(safeServiceId), payload);
  return response.data;
};

export const deleteMechanicService = async (serviceId) => {
  const safeServiceId = toId(serviceId, 'serviceId');
  const response = await api.delete(ENDPOINTS.me.mechanic.serviceDelete(safeServiceId));
  return response.data;
};

export const addMechanicBank = async ({ account_name, account_number, bank_code, bank_name }) => {
  const response = await api.post(ENDPOINTS.me.mechanic.bankAdd, {
    account_name: String(account_name || '').trim(),
    account_number: String(account_number || '').trim(),
    bank_code: String(bank_code || '').trim(),
    bank_name: String(bank_name || '').trim(),
  });
  return response.data;
};

export const verifyMechanicBank = async ({ account_number, bank_name }) => {
  const response = await api.post(ENDPOINTS.me.mechanic.bankVerify, {
    account_number: String(account_number || '').trim(),
    bank_name: String(bank_name || '').trim(),
  });
  return response.data;
};

export const deleteMechanicBank = async (bankId) => {
  const safeBankId = toId(bankId, 'bankId');
  const response = await api.delete(ENDPOINTS.me.mechanic.bankDelete(safeBankId));
  return response.data;
};

export const setPrimaryMechanicBank = async (bankId) => {
  const safeBankId = toId(bankId, 'bankId');
  const response = await api.post(ENDPOINTS.me.mechanic.bankSetPrimary(safeBankId), {});
  return response.data;
};

export const getMechanicBankList = async () => {
  const response = await api.get(ENDPOINTS.me.mechanic.bankList);
  return response.data;
};

export default {
  ISSUE_TYPES,
  addMechanicService,
  getMyMechanicServices,
  updateMechanicService,
  deleteMechanicService,
  addMechanicBank,
  verifyMechanicBank,
  deleteMechanicBank,
  setPrimaryMechanicBank,
  getMechanicBankList,
};
