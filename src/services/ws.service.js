import { CHAT_WS_URL } from '../config/endpoints';

let socketRef = null;
let socketUrlRef = '';

const buildUrl = (token) => {
  const safeToken = String(token || '').trim();
  if (!safeToken) {
    return CHAT_WS_URL;
  }

  const separator = CHAT_WS_URL.includes('?') ? '&' : '?';
  return `${CHAT_WS_URL}${separator}token=${encodeURIComponent(safeToken)}`;
};

export const connect = (token, onMessage, onOpen, onClose, onError) => {
  const safeToken = String(token || '').trim();
  const url = buildUrl(safeToken);

  if (
    socketRef &&
    socketUrlRef === url &&
    (socketRef.readyState === WebSocket.OPEN || socketRef.readyState === WebSocket.CONNECTING)
  ) {
    return socketRef;
  }

  if (socketRef) {
    try {
      socketRef.onopen = null;
      socketRef.onmessage = null;
      socketRef.onclose = null;
      socketRef.onerror = null;
      socketRef.close();
    } catch (error) {
      // no-op
    }
    socketRef = null;
    socketUrlRef = '';
  }

  const socket = new WebSocket(url, [], {
    headers: {
      Authorization: `Bearer ${safeToken}`,
    },
  });

  socketRef = socket;
  socketUrlRef = url;

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

export const send = (payload) => {
  if (!socketRef || socketRef.readyState !== WebSocket.OPEN) {
    return false;
  }

  socketRef.send(JSON.stringify(payload));
  return true;
};

export const close = () => {
  if (!socketRef) {
    return;
  }

  try {
    socketRef.onopen = null;
    socketRef.onmessage = null;
    socketRef.onclose = null;
    socketRef.onerror = null;
    socketRef.close();
  } catch (error) {
    // no-op
  } finally {
    socketRef = null;
    socketUrlRef = '';
  }
};

// Backward-compatible aliases
export const connectChatWebSocket = ({ token, onMessage, onOpen, onClose, onError } = {}) =>
  connect(token, onMessage, onOpen, onClose, onError);

export const sendMessage = (payload) => send(payload);

export const closeChatWebSocket = () => close();

export default {
  connect,
  send,
  close,
  connectChatWebSocket,
  sendMessage,
  closeChatWebSocket,
};
