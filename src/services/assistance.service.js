import { ENDPOINTS } from '../config/endpoints';
import api from './api';

const normalizeList = (response) => {
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const normalizeRecord = (response) => response?.data?.data || response?.data || null;

export const fetchDiagnosticExperts = async (params = {}) => {
  const response = await api.get(ENDPOINTS.services.diagnosticExperts, { params });
  return normalizeList(response);
};

export const fetchDiagnosticExpertDetails = async (serviceId) => {
  const response = await api.get(ENDPOINTS.services.diagnosticExpertDetails(serviceId));
  return normalizeRecord(response);
};

export const fetchTowingServices = async (params = {}) => {
  const response = await api.get(ENDPOINTS.services.towingServices, { params });
  return normalizeList(response);
};

export const fetchTowingServiceDetails = async (serviceId) => {
  const response = await api.get(ENDPOINTS.services.towingServiceDetails(serviceId));
  return normalizeRecord(response);
};
