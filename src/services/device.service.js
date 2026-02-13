import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const normalizeSuccessData = (payload) => {
  if (payload && typeof payload === 'object' && payload.data !== undefined) {
    return payload.data;
  }

  return payload;
};

export const registerDevice = async ({ fcm_token, device_type }) => {
  const response = await api.post(ENDPOINTS.auth.devices.register, {
    fcm_token,
    device_type,
  });

  return normalizeSuccessData(response.data);
};

export default {
  registerDevice,
};
