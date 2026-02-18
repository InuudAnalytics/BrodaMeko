import { CHAT_WS_URL } from '../config/endpoints';

let socketRef = null;

const withToken = (baseUrl, token) => {
  const safeToken = String(token || '').trim();
  if (!safeToken) {
    return baseUrl;
  }

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(safeToken)}`;
};

export const connectChatWebSocket = ({ token, onMessage, onOpen, onClose, onError } = {}) => {
  const url = withToken(CHAT_WS_URL, token);
  const socket = new WebSocket(url);
  socketRef = socket;

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

export const sendMessage = ({ type = 'message', conversation_id, content }) => {
  if (!socketRef || socketRef.readyState !== WebSocket.OPEN) {
    return false;
  }

  const payload = {
    type,
    conversation_id: String(conversation_id || '').trim(),
    content: String(content || ''),
  };

  socketRef.send(JSON.stringify(payload));
  return true;
};

export const closeChatWebSocket = () => {
  if (socketRef) {
    socketRef.close();
    socketRef = null;
  }
};

export default {
  connectChatWebSocket,
  sendMessage,
  closeChatWebSocket,
};
