import { ENDPOINTS } from '../config/endpoints';
import api from './api';
import { trackTelemetryEvent } from './telemetry.service';

const buildServiceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  throw error;
};

const assertId = (value, label) => {
  const safeValue = String(value || '').trim();
  if (!safeValue) {
    buildServiceError(`${label} is required.`);
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
    buildServiceError('reason is required.');
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
    trackTelemetryEvent('dispute_job_submit_failed', {
      job_id: safeJobId,
      status_code: Number(error?.statusCode || error?.response?.status || 0),
    });
    throw error;
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
    trackTelemetryEvent('dispute_order_submit_failed', {
      order_id: safeOrderId,
      status_code: Number(error?.statusCode || error?.response?.status || 0),
    });
    throw error;
  }
};

export const getMyJobDisputes = async ({ page = 1, limit = 20 } = {}) => {
  const response = await api.get(ENDPOINTS.dispute.myJobDisputes, {
    params: {
      page: Number.isFinite(Number(page)) ? Number(page) : 1,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : 20,
    },
  });
  return response.data;
};

export const getMyOrderDisputes = async ({ page = 1, limit = 20 } = {}) => {
  const response = await api.get(ENDPOINTS.dispute.myOrderDisputes, {
    params: {
      page: Number.isFinite(Number(page)) ? Number(page) : 1,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : 20,
    },
  });
  return response.data;
};

export default {
  fileJobDisputeV2,
  fileOrderDispute,
  getMyJobDisputes,
  getMyOrderDisputes,
};
