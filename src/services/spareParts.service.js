import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const getSparePartsAddresses = async () => {
  const response = await api.get(ENDPOINTS.me.spareParts.addressList);
  return response.data;
};

export const addSparePartsAddress = async (payload) => {
  const response = await api.post(ENDPOINTS.me.spareParts.addressAdd, payload);
  return response.data;
};

export const updateSparePartsAddress = async (addressId, payload) => {
  const safeId = String(addressId || '').trim();
  if (!safeId) {
    const error = new Error('addressId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.patch(ENDPOINTS.me.spareParts.addressUpdate(safeId), payload);
  return response.data;
};

export default {
  getSparePartsAddresses,
  addSparePartsAddress,
  updateSparePartsAddress,
};
