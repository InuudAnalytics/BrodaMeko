import { ENDPOINTS } from '../config/endpoints';
import api from './api';
import { trackTelemetryEvent } from './telemetry.service';

export const SUPPORT_TICKET_CATEGORIES = [
  'payment_issue',
  'job_dispute',
  'order_dispute',
  'account_issue',
  'technical',
  'other',
];

export const SUPPORT_TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const buildValidationError = (message, code = 'SUPPORT_VALIDATION_ERROR') => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  error.code = code;
  return error;
};

const normalizeServiceError = (error, fallbackMessage = 'Support request failed.') => {
  if (error?.code === 'SUPPORT_VALIDATION_ERROR') {
    return error;
  }

  const normalized = new Error(String(error?.message || fallbackMessage));
  normalized.statusCode = Number(error?.statusCode || error?.response?.status || 0);
  normalized.data = error?.data || error?.response?.data || null;
  normalized.code = 'SUPPORT_API_ERROR';
  return normalized;
};

const assertTicketId = (ticketId) => {
  const safeTicketId = String(ticketId || '').trim();
  if (!safeTicketId) {
    throw buildValidationError('ticketId is required.');
  }
  return safeTicketId;
};

const assertDisputeId = (disputeId) => {
  const safeDisputeId = String(disputeId || '').trim();
  if (!safeDisputeId) {
    throw buildValidationError('disputeId is required.');
  }
  return safeDisputeId;
};

const toPositiveInteger = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback;
  }
  return Math.floor(numeric);
};

const normalizeCategory = (category) => {
  const safeCategory = String(category || 'other').trim().toLowerCase() || 'other';
  if (!SUPPORT_TICKET_CATEGORIES.includes(safeCategory)) {
    throw buildValidationError(
      `category must be one of: ${SUPPORT_TICKET_CATEGORIES.join(', ')}`,
      'SUPPORT_VALIDATION_ERROR'
    );
  }
  return safeCategory;
};

const normalizePriority = (priority) => {
  const safePriority = String(priority || 'normal').trim().toLowerCase() || 'normal';
  if (!SUPPORT_TICKET_PRIORITIES.includes(safePriority)) {
    throw buildValidationError(
      `priority must be one of: ${SUPPORT_TICKET_PRIORITIES.join(', ')}`,
      'SUPPORT_VALIDATION_ERROR'
    );
  }
  return safePriority;
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
    throw buildValidationError('subject is required.');
  }

  const payload = {
    subject: safeSubject,
    category: normalizeCategory(category),
    priority: normalizePriority(priority),
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
    const normalizedError = normalizeServiceError(error, 'Could not create support ticket.');
    trackTelemetryEvent('support_ticket_create_failed', {
      has_job_dispute_id: Boolean(safeJobDisputeId),
      has_order_dispute_id: Boolean(safeOrderDisputeId),
      status_code: Number(normalizedError?.statusCode || 0),
    });
    throw normalizedError;
  }
};

export const getSupportTickets = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const response = await api.get(ENDPOINTS.support.tickets, {
      params: {
        page: toPositiveInteger(page, 1),
        limit: toPositiveInteger(limit, 20),
      },
    });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load support tickets.');
  }
};

export const getSupportTicket = async (ticketId) => {
  try {
    const safeTicketId = assertTicketId(ticketId);
    const response = await api.get(ENDPOINTS.support.ticketDetails(safeTicketId));
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load support ticket.');
  }
};

export const getSupportTicketMessages = async (ticketId, { limit = 50, offset = 0 } = {}) => {
  try {
    const safeTicketId = assertTicketId(ticketId);
    const safeOffset = Number.isFinite(Number(offset)) && Number(offset) >= 0 ? Math.floor(Number(offset)) : 0;
    const response = await api.get(ENDPOINTS.support.ticketMessages(safeTicketId), {
      params: {
        limit: toPositiveInteger(limit, 50),
        offset: safeOffset,
      },
    });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load support messages.');
  }
};

export const sendSupportTicketImages = async (ticketId, images = []) => {
  try {
    const safeTicketId = assertTicketId(ticketId);
    const files = Array.isArray(images) ? images.slice(0, 5) : [];
    if (!files.length) {
      throw buildValidationError('At least one image is required.');
    }

    const formData = new FormData();
    files.forEach((image, index) => {
      const filePart = toFilePart(image, index);
      if (filePart) {
        formData.append('images', filePart);
      }
    });

    if (!formData?._parts?.length && !formData?.__entries?.length) {
      // RN FormData does not expose entries consistently; this check is best-effort for tests/web env.
      // If runtime still carries no valid images, backend will reject and be normalized below.
    }

    const response = await api.post(ENDPOINTS.support.ticketImages(safeTicketId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not upload support image.');
  }
};

export const markSupportTicketRead = async (ticketId) => {
  try {
    const safeTicketId = assertTicketId(ticketId);
    const response = await api.patch(ENDPOINTS.support.ticketRead(safeTicketId), {});
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not mark support ticket as read.');
  }
};

export const getSupportDisputeTicket = async ({ disputeId, type = 'job' } = {}) => {
  try {
    const safeDisputeId = assertDisputeId(disputeId);
    const safeType = String(type || '').trim().toLowerCase() === 'order' ? 'order' : 'job';
    const response = await api.get(ENDPOINTS.support.disputeTicket, {
      params: {
        dispute_id: safeDisputeId,
        type: safeType,
      },
    });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not fetch linked dispute support ticket.');
  }
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
