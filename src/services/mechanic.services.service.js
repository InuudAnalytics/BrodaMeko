import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const ISSUE_TYPES = ['flat_tires', 'battery_problem', 'brake_failure', 'engine_trouble'];

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

const parseNumber = (value, fieldName) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    buildServiceError(`${fieldName} must be a valid number.`);
  }

  return parsed;
};

const assertServiceId = (serviceId) => {
  const safeServiceId = String(serviceId || '').trim();

  if (!safeServiceId) {
    buildServiceError('serviceId is required.');
  }

  return safeServiceId;
};

export const addMechanicService = async ({ issue_type, min_price, max_price }) => {
  const safeIssueType = String(issue_type || '').trim();

  if (!safeIssueType) {
    buildServiceError('issue_type is required.');
  }

  const parsedMinPrice = parseNumber(min_price, 'min_price');
  const parsedMaxPrice = parseNumber(max_price, 'max_price');

  if (parsedMinPrice > parsedMaxPrice) {
    buildServiceError('min_price cannot be greater than max_price.');
  }

  const response = await api.post(ENDPOINTS.me.mechanic.addServices, {
    issue_type: safeIssueType,
    min_price: parsedMinPrice,
    max_price: parsedMaxPrice,
  });

  return normalizeResponse(response.data, 'Mechanic service added successfully.');
};

export const getMyMechanicServices = async () => {
  const response = await api.get(ENDPOINTS.me.mechanic.servicesList);
  return normalizeResponse(response.data, 'Mechanic services retrieved successfully.');
};

export const updateMechanicService = async (serviceId, { min_price, max_price } = {}) => {
  const safeServiceId = assertServiceId(serviceId);
  const payload = {};

  const hasMinPrice = min_price !== undefined;
  const hasMaxPrice = max_price !== undefined;

  if (!hasMinPrice && !hasMaxPrice) {
    buildServiceError('Provide at least one field to update: min_price or max_price.');
  }

  if (hasMinPrice) {
    payload.min_price = parseNumber(min_price, 'min_price');
  }

  if (hasMaxPrice) {
    payload.max_price = parseNumber(max_price, 'max_price');
  }

  if (payload.min_price !== undefined && payload.max_price !== undefined && payload.min_price > payload.max_price) {
    buildServiceError('min_price cannot be greater than max_price.');
  }

  const response = await api.patch(ENDPOINTS.me.mechanic.serviceUpdate(safeServiceId), payload);
  return normalizeResponse(response.data, 'Mechanic service updated successfully.');
};

export const deleteMechanicService = async (serviceId) => {
  const safeServiceId = assertServiceId(serviceId);
  const response = await api.delete(ENDPOINTS.me.mechanic.serviceDelete(safeServiceId));
  return normalizeResponse(response.data, 'Mechanic service deleted successfully.');
};

export default {
  ISSUE_TYPES,
  addMechanicService,
  getMyMechanicServices,
  updateMechanicService,
  deleteMechanicService,
};
