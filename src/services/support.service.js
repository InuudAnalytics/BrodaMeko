import { ENDPOINTS } from '../config/endpoints';
import api from './api';
import { trackTelemetryEvent } from './telemetry.service';

const buildServiceError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  throw error;
};

const assertTicketId = (ticketId) => {
  const safeTicketId = String(ticketId || '').trim();
  if (!safeTicketId) {
    buildServiceError('ticketId is required.');
  }
  return safeTicketId;
};

const assertDisputeId = (disputeId) => {
  const safeDisputeId = String(disputeId || '').trim();
  if (!safeDisputeId) {
    buildServiceError('disputeId is required.');
  }
  return safeDisputeId;
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
      name: `support_${index}.jpg`,
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
      name: String(file.fileName || file.name || `support_${index}.jpg`),
      type: String(file.type || 'image/jpeg'),
    };
  }

  return null;
};

export const createSupportTicket = async ({
  subject,
  category = 'other',
  priority = 'normal',
  job_dispute_id,
  order_dispute_id,
} = {}) => {
  const safeSubject = String(subject || '').trim();
  if (!safeSubject) {
    buildServiceError('subject is required.');
  }

  const payload = {
    subject: safeSubject,
    category: String(category || 'other').trim() || 'other',
    priority: String(priority || 'normal').trim() || 'normal',
  };

  const safeJobDisputeId = String(job_dispute_id || '').trim();
  const safeOrderDisputeId = String(order_dispute_id || '').trim();

  if (safeJobDisputeId) {
    payload.job_dispute_id = safeJobDisputeId;
  }
  if (safeOrderDisputeId) {
    payload.order_dispute_id = safeOrderDisputeId;
  }

  try {
    const response = await api.post(ENDPOINTS.support.tickets, payload);
    trackTelemetryEvent('support_ticket_create_success', {
      has_job_dispute_id: Boolean(safeJobDisputeId),
      has_order_dispute_id: Boolean(safeOrderDisputeId),
      category: payload.category,
      priority: payload.priority,
    });
    return response.data;
  } catch (error) {
    trackTelemetryEvent('support_ticket_create_failed', {
      has_job_dispute_id: Boolean(safeJobDisputeId),
      has_order_dispute_id: Boolean(safeOrderDisputeId),
      status_code: Number(error?.statusCode || error?.response?.status || 0),
    });
    throw error;
  }
};

export const getSupportTickets = async ({ page = 1, limit = 20 } = {}) => {
  const response = await api.get(ENDPOINTS.support.tickets, {
    params: {
      page: Number.isFinite(Number(page)) ? Number(page) : 1,
      limit: Number.isFinite(Number(limit)) ? Number(limit) : 20,
    },
  });
  return response.data;
};

export const getSupportTicket = async (ticketId) => {
  const safeTicketId = assertTicketId(ticketId);
  const response = await api.get(ENDPOINTS.support.ticketDetails(safeTicketId));
  return response.data;
};

export const getSupportTicketMessages = async (ticketId, { limit = 50, offset = 0 } = {}) => {
  const safeTicketId = assertTicketId(ticketId);
  const response = await api.get(ENDPOINTS.support.ticketMessages(safeTicketId), {
    params: {
      limit: Number.isFinite(Number(limit)) ? Number(limit) : 50,
      offset: Number.isFinite(Number(offset)) ? Number(offset) : 0,
    },
  });
  return response.data;
};

export const sendSupportTicketImages = async (ticketId, images = []) => {
  const safeTicketId = assertTicketId(ticketId);
  const files = Array.isArray(images) ? images.slice(0, 5) : [];
  if (!files.length) {
    buildServiceError('At least one image is required.');
  }

  const formData = new FormData();
  files.forEach((image, index) => {
    const filePart = toFilePart(image, index);
    if (filePart) {
      formData.append('images', filePart);
    }
  });

  const response = await api.post(ENDPOINTS.support.ticketImages(safeTicketId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const markSupportTicketRead = async (ticketId) => {
  const safeTicketId = assertTicketId(ticketId);
  const response = await api.patch(ENDPOINTS.support.ticketRead(safeTicketId), {});
  return response.data;
};

export const getSupportDisputeTicket = async ({ disputeId, type = 'job' } = {}) => {
  const safeDisputeId = assertDisputeId(disputeId);
  const safeType = String(type || '').trim().toLowerCase() === 'order' ? 'order' : 'job';
  const response = await api.get(ENDPOINTS.support.disputeTicket, {
    params: {
      dispute_id: safeDisputeId,
      type: safeType,
    },
  });
  return response.data;
};

export default {
  createSupportTicket,
  getSupportTickets,
  getSupportTicket,
  getSupportTicketMessages,
  sendSupportTicketImages,
  markSupportTicketRead,
  getSupportDisputeTicket,
};
