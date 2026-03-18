import { ROUTES } from './constants';

const toSafeString = (value) => String(value || '').trim();

const parseObjectLike = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) {
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }
  return null;
};

const normalizeCallSignalType = (rawPayload = {}) =>
  toSafeString(rawPayload?.type || rawPayload?.event || rawPayload?.signal || rawPayload?.state).toLowerCase();

const normalizeCallState = (rawPayload = {}) =>
  toSafeString(rawPayload?.state || '').toLowerCase();

const buildContextLabel = (payload = {}) => {
  const contextType = toSafeString(payload?.context_type || payload?.context?.type).toLowerCase();
  const contextId = toSafeString(payload?.context_id || payload?.context?.id);
  if (!contextType || !contextId) {
    return '';
  }
  if (contextType === 'order') {
    return `Order #${contextId.slice(0, 8)}`;
  }
  if (contextType === 'job') {
    return `Job #${contextId.slice(0, 8)}`;
  }
  return `${contextType} #${contextId.slice(0, 8)}`;
};

export const buildCallNavigationTarget = (rawPayload = {}) => {
  const payloadRoot = parseObjectLike(rawPayload) || {};
  const nestedData = parseObjectLike(payloadRoot?.data) || {};
  const payload = { ...nestedData, ...payloadRoot };
  const fromUser = parseObjectLike(payload?.from_user) || {};
  const toUser = parseObjectLike(payload?.to_user) || {};
  const participants = parseObjectLike(payload?.participants) || {};
  const participantCaller = parseObjectLike(participants?.caller) || {};
  const participantCallee = parseObjectLike(participants?.callee) || {};

  const callId = toSafeString(payload?.call_id || payload?.callId || payload?.id);
  if (!callId) {
    return null;
  }

  const signalType = normalizeCallSignalType(payload);
  const state = normalizeCallState(payload);
  const callerName =
    toSafeString(
      fromUser?.full_name ||
      participantCaller?.full_name ||
      payload?.caller_name ||
      payload?.callerName ||
      ''
    ) || 'Contact';
  const calleeName =
    toSafeString(
      toUser?.full_name ||
      participantCallee?.full_name ||
      payload?.callee_name ||
      payload?.calleeName ||
      ''
    ) || 'Contact';
  const contextLabel = buildContextLabel(payload) || 'Incoming call';
  const contextType = toSafeString(payload?.context_type || payload?.context?.type).toLowerCase();
  const contextId = toSafeString(payload?.context_id || payload?.context?.id);

  if (signalType === 'call.incoming' || state === 'ringing') {
    return {
      routeName: ROUTES.CALL_INCOMING,
      params: {
        callId,
        callerName,
        contextLabel,
        contextType,
        contextId,
      },
    };
  }

  if (signalType === 'call.accepted' || state === 'accepted') {
    return {
      routeName: ROUTES.CALL_IN_PROGRESS,
      params: {
        callId,
        participantName: calleeName,
        contextLabel: contextLabel || 'Connected',
        contextType,
        contextId,
      },
    };
  }

  return null;
};

export default {
  buildCallNavigationTarget,
};
