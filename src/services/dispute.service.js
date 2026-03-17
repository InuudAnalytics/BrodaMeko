import { ENDPOINTS } from '../config/endpoints';
import api from './api';
import { trackTelemetryEvent } from './telemetry.service';

const buildValidationError = (message, code = 'DISPUTE_VALIDATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  error.code = code;
  return error;
};

const normalizeServiceError = (error, fallbackMessage = 'Dispute request failed.') => {
  if (error?.code === 'DISPUTE_VALIDATION_ERROR') {
    return error;
  }

  const normalized = new Error(String(error?.message || fallbackMessage));
  normalized.statusCode = Number(error?.statusCode || error?.response?.status || 0);
  normalized.data = error?.data || error?.response?.data || null;
  normalized.code = 'DISPUTE_API_ERROR';
  return normalized;
};

const assertId = (value, label) => {
  const safeValue = String(value || '').trim();
  if (!safeValue) {
    throw buildValidationError(`${label} is required.`);
  }
  return safeValue;
};

const toFilePart = (file, index = 0) => {
  if (!file) {
    return null;
  }

  if (typeof file === 'string') {
    const uri = file.trim();
    if (!uri) {
      return null;
    }
    return {
      uri,
      name: `evidence_${index}.jpg`,
      type: 'image/jpeg',
    };
  }

  if (typeof file === 'object') {
    const uri = String(file.uri || file.path || '').trim();
    if (!uri) {
      return null;
    }
    return {
      uri,
      name: String(file.fileName || file.name || `evidence_${index}.jpg`),
      type: String(file.type || 'image/jpeg'),
    };
  }

  return null;
};

const buildDisputeFormData = ({ reason, evidence = [], order_item_id } = {}) => {
  const safeReason = String(reason || '').trim();
  if (!safeReason) {
    throw buildValidationError('reason is required.');
  }

  const formData = new FormData();
  formData.append('reason', safeReason);

  const safeOrderItemId = String(order_item_id || '').trim();
  if (safeOrderItemId) {
    formData.append('order_item_id', safeOrderItemId);
  }

  const files = Array.isArray(evidence) ? evidence.slice(0, 5) : [];
  files.forEach((item, index) => {
    const filePart = toFilePart(item, index);
    if (filePart) {
      formData.append('evidence', filePart);
    }
  });

  return formData;
};

const toPositiveInteger = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
};

export const fileJobDisputeV2 = async (jobId, { reason, evidence = [] } = {}) => {
  const safeJobId = assertId(jobId, 'jobId');
  const formData = buildDisputeFormData({ reason, evidence });
  try {
    const response = await api.post(ENDPOINTS.dispute.fileJob(safeJobId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    trackTelemetryEvent('dispute_job_submit_success', { job_id: safeJobId });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not file job dispute.');
    trackTelemetryEvent('dispute_job_submit_failed', {
      job_id: safeJobId,
      status_code: Number(normalizedError?.statusCode || 0),
    });
    throw normalizedError;
  }
};

export const fileOrderDispute = async (orderId, { reason, order_item_id, evidence = [] } = {}) => {
  const safeOrderId = assertId(orderId, 'orderId');
  const formData = buildDisputeFormData({ reason, order_item_id, evidence });
  try {
    const response = await api.post(ENDPOINTS.dispute.fileOrder(safeOrderId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    trackTelemetryEvent('dispute_order_submit_success', { order_id: safeOrderId });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not file order dispute.');
    trackTelemetryEvent('dispute_order_submit_failed', {
      order_id: safeOrderId,
      status_code: Number(normalizedError?.statusCode || 0),
    });
    throw normalizedError;
  }
};

export const getMyJobDisputes = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const response = await api.get(ENDPOINTS.dispute.myJobDisputes, {
      params: {
        page: toPositiveInteger(page, 1),
        limit: toPositiveInteger(limit, 20),
      },
    });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load job disputes.');
  }
};

export const getMyOrderDisputes = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const response = await api.get(ENDPOINTS.dispute.myOrderDisputes, {
      params: {
        page: toPositiveInteger(page, 1),
        limit: toPositiveInteger(limit, 20),
      },
    });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load order disputes.');
  }
};

export default {
  fileJobDisputeV2,
  fileOrderDispute,
  getMyJobDisputes,
  getMyOrderDisputes,
};
