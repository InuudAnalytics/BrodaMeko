import { ENDPOINTS } from '../config/endpoints';
import api from './api';
import { trackTelemetryEvent } from './telemetry.service';

const buildValidationError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.data = null;
  error.code = 'CALLS_VALIDATION_ERROR';
  return error;
};

const normalizeServiceError = (error, fallbackMessage = 'Call request failed.') => {
  if (error?.code === 'CALLS_VALIDATION_ERROR') {
    return error;
  }
  const normalized = new Error(String(error?.message || fallbackMessage));
  normalized.statusCode = Number(error?.statusCode || error?.response?.status || 0);
  normalized.data = error?.data || error?.response?.data || null;
  normalized.code = 'CALLS_API_ERROR';
  return normalized;
};

const assertId = (value, label) => {
  const safeValue = String(value || '').trim();
  if (!safeValue) {
    throw buildValidationError(`${label} is required.`);
  }
  return safeValue;
};

export const startCall = async ({ context_type, context_id, callee_id, client_call_id } = {}) => {
  const safeContextType = String(context_type || '').trim().toLowerCase();
  if (!['order', 'job'].includes(safeContextType)) {
    throw buildValidationError("context_type must be 'order' or 'job'.");
  }

  const payload = {
    context_type: safeContextType,
    context_id: assertId(context_id, 'context_id'),
    callee_id: assertId(callee_id, 'callee_id'),
  };

  const safeClientCallId = String(client_call_id || '').trim();
  if (safeClientCallId) {
    payload.client_call_id = safeClientCallId;
  }

  trackTelemetryEvent('call_start_emitted', {
    context_type: safeContextType,
    context_id: payload.context_id,
    callee_id: payload.callee_id,
  });

  try {
    const response = await api.post(ENDPOINTS.calls.start, payload);
    trackTelemetryEvent('call_start_success', {
      context_type: safeContextType,
      context_id: payload.context_id,
      callee_id: payload.callee_id,
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not start call.');
    trackTelemetryEvent('call_start_failed', {
      context_type: safeContextType,
      context_id: payload.context_id,
      callee_id: payload.callee_id,
      status_code: Number(normalizedError?.statusCode || 0),
      message: normalizedError?.message || '',
    });
    throw normalizedError;
  }
};

export const getCallToken = async ({ call_id } = {}) => {
  try {
    const response = await api.post(ENDPOINTS.calls.token, {
      call_id: assertId(call_id, 'call_id'),
    });
    trackTelemetryEvent('call_token_success', {
      call_id: assertId(call_id, 'call_id'),
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not generate call token.');
    trackTelemetryEvent('call_token_failed', {
      call_id: String(call_id || ''),
      status_code: Number(normalizedError?.statusCode || 0),
      message: normalizedError?.message || '',
    });
    throw normalizedError;
  }
};

export const acceptCall = async (callId) => {
  try {
    const safeCallId = assertId(callId, 'callId');
    const response = await api.post(ENDPOINTS.calls.accept(safeCallId), {});
    trackTelemetryEvent('call_accept_success', { call_id: safeCallId });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not accept call.');
    trackTelemetryEvent('call_accept_failed', {
      call_id: String(callId || ''),
      status_code: Number(normalizedError?.statusCode || 0),
      message: normalizedError?.message || '',
    });
    throw normalizedError;
  }
};

export const rejectCall = async (callId, { reason = 'declined' } = {}) => {
  try {
    const safeCallId = assertId(callId, 'callId');
    const response = await api.post(ENDPOINTS.calls.reject(safeCallId), {
      reason: String(reason || 'declined').trim() || 'declined',
    });
    trackTelemetryEvent('call_reject_success', {
      call_id: safeCallId,
      reason: String(reason || 'declined').trim() || 'declined',
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not reject call.');
    trackTelemetryEvent('call_reject_failed', {
      call_id: String(callId || ''),
      status_code: Number(normalizedError?.statusCode || 0),
      message: normalizedError?.message || '',
    });
    throw normalizedError;
  }
};

export const endCall = async ({ call_id, reason = 'hangup' } = {}) => {
  const safeReason = String(reason || 'hangup').trim().toLowerCase() || 'hangup';
  try {
    const response = await api.post(ENDPOINTS.calls.end, {
      call_id: assertId(call_id, 'call_id'),
      reason: safeReason,
    });
    trackTelemetryEvent('call_end_success', {
      call_id: assertId(call_id, 'call_id'),
      reason: safeReason,
    });
    return response.data;
  } catch (error) {
    const normalizedError = normalizeServiceError(error, 'Could not end call.');
    trackTelemetryEvent('call_end_failed', {
      call_id: String(call_id || ''),
      reason: safeReason,
      status_code: Number(normalizedError?.statusCode || 0),
      message: normalizedError?.message || '',
    });
    throw normalizedError;
  }
};

export const getCall = async (callId) => {
  try {
    const safeCallId = assertId(callId, 'callId');
    const response = await api.get(ENDPOINTS.calls.details(safeCallId));
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load call details.');
  }
};

export const getCallHistory = async ({ context_type, context_id, page = 1, limit = 20 } = {}) => {
  try {
    const params = {
      page: Number.isFinite(Number(page)) && Number(page) > 0 ? Math.floor(Number(page)) : 1,
      limit: Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.floor(Number(limit)) : 20,
    };
    const safeContextType = String(context_type || '').trim().toLowerCase();
    if (['order', 'job'].includes(safeContextType)) {
      params.context_type = safeContextType;
    }
    const safeContextId = String(context_id || '').trim();
    if (safeContextId) {
      params.context_id = safeContextId;
    }
    const response = await api.get(ENDPOINTS.calls.history, { params });
    return response.data;
  } catch (error) {
    throw normalizeServiceError(error, 'Could not load call history.');
  }
};

export const getActiveCallForContext = async ({ context_type, context_id } = {}) => {
  const history = await getCallHistory({
    context_type,
    context_id,
    page: 1,
    limit: 20,
  });
  const rows = Array.isArray(history?.data) ? history.data : [];
  return rows.find((row) => {
    const state = String(row?.state || '').trim().toLowerCase();
    return state === 'ringing' || state === 'accepted';
  }) || null;
};

export default {
  startCall,
  getCallToken,
  acceptCall,
  rejectCall,
  endCall,
  getCall,
  getCallHistory,
  getActiveCallForContext,
};
