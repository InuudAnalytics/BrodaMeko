const sanitizePayload = (payload = {}) => {
  const source = payload && typeof payload === 'object' ? payload : {};
  const out = {};
  Object.keys(source).forEach((key) => {
    const value = source[key];
    if (value === undefined) {
      return;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      out[key] = value;
      return;
    }
    try {
      out[key] = JSON.stringify(value);
    } catch {
      out[key] = '[unserializable]';
    }
  });
  return out;
};

export const trackTelemetryEvent = (eventName, payload = {}) => {
  const safeName = String(eventName || '').trim();
  if (!safeName) {
    return;
  }

  const record = {
    name: safeName,
    timestamp: new Date().toISOString(),
    payload: sanitizePayload(payload),
  };

  // TODO: Replace this sink with backend telemetry endpoint once available.
  // Keep non-throwing to avoid impacting user actions.
  console.log('[telemetry]', record);
};

export default {
  trackTelemetryEvent,
};
