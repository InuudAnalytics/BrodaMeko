import { CHAT_WS_URL } from '../config/endpoints';

const socketsByScope = new Map();
const DEFAULT_SCOPE = 'default';

const buildUrl = (token) => {
  const safeToken = String(token || '').trim();
  if (!safeToken) {
    return CHAT_WS_URL;
  }

  const separator = CHAT_WS_URL.includes('?') ? '&' : '?';
  return `${CHAT_WS_URL}${separator}token=${encodeURIComponent(safeToken)}`;
};

const getSocketRecord = (scope) => {
  const safeScope = String(scope || DEFAULT_SCOPE).trim() || DEFAULT_SCOPE;
  return socketsByScope.get(safeScope) || null;
};

const setSocketRecord = (scope, record) => {
  const safeScope = String(scope || DEFAULT_SCOPE).trim() || DEFAULT_SCOPE;
  if (!record) {
    socketsByScope.delete(safeScope);
    return;
  }
  socketsByScope.set(safeScope, record);
};

export const connectScoped = (scope, token, onMessage, onOpen, onClose, onError) => {
  const safeToken = String(token || '').trim();
  const url = buildUrl(safeToken);
  const existingRecord = getSocketRecord(scope);
  const existingSocket = existingRecord?.socket || null;

  if (
    existingSocket &&
    existingRecord?.url === url &&
    (existingSocket.readyState === WebSocket.OPEN || existingSocket.readyState === WebSocket.CONNECTING)
  ) {
    return existingSocket;
  }

  if (existingSocket) {
    try {
      existingSocket.onopen = null;
      existingSocket.onmessage = null;
      existingSocket.onclose = null;
      existingSocket.onerror = null;
      existingSocket.close();
    } catch (error) {
      // no-op
    }
    setSocketRecord(scope, null);
  }

  const socket = new WebSocket(url, [], {
    headers: {
      Authorization: `Bearer ${safeToken}`,
    },
  });

  setSocketRecord(scope, { socket, url });

  socket.onopen = (event) => {
    if (typeof onOpen === 'function') {
      onOpen(event);
    }
  };

  socket.onmessage = (event) => {
    if (typeof onMessage === 'function') {
      onMessage(event);
    }
  };

  socket.onclose = (event) => {
    if (typeof onClose === 'function') {
      onClose(event);
    }
  };

  socket.onerror = (event) => {
    if (typeof onError === 'function') {
      onError(event);
    }
  };

  return socket;
};

export const connect = (token, onMessage, onOpen, onClose, onError) =>
  connectScoped(DEFAULT_SCOPE, token, onMessage, onOpen, onClose, onError);

export const sendScoped = (scope, payload) => {
  const record = getSocketRecord(scope);
  const socket = record?.socket || null;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  socket.send(JSON.stringify(payload));
  return true;
};

export const send = (payload) => sendScoped(DEFAULT_SCOPE, payload);

export const closeScoped = (scope) => {
  const record = getSocketRecord(scope);
  const socket = record?.socket || null;

  if (!socket) {
    return;
  }

  try {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.close();
  } catch (error) {
    // no-op
  } finally {
    setSocketRecord(scope, null);
  }
};

export const close = () => closeScoped(DEFAULT_SCOPE);

// Backward-compatible aliases
export const connectChatWebSocket = ({ token, onMessage, onOpen, onClose, onError } = {}) =>
  connect(token, onMessage, onOpen, onClose, onError);

export const sendMessage = (payload) => send(payload);

export const closeChatWebSocket = () => close();

export default {
  connect,
  connectScoped,
  send,
  sendScoped,
  close,
  closeScoped,
  connectChatWebSocket,
  sendMessage,
  closeChatWebSocket,
};
