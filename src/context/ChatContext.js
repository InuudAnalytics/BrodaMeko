import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createQuotation,
  getConversations,
  getMessages,
  initiateJobPayment,
  markAsRead,
  respondToQuotation,
  startConversation,
  uploadConversationImages,
} from '../services/chat.service';
import { close, connect, send } from '../services/ws.service';
import { useAuth } from './AuthContext';

const ChatContext = createContext(undefined);

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 800;
const AUTH_CLOSE_CODES = new Set([1008, 4001, 4003, 4401, 4403]);

const getConversationId = (conversation) => {
  if (!conversation || typeof conversation !== 'object') {
    return '';
  }

  return String(
    conversation.id || conversation._id || conversation.conversation_id || conversation.conversationId || ''
  ).trim();
};

const extractConversations = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload.conversations)) {
    return payload.conversations;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

const extractMessages = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray(payload.messages)) {
    return payload.messages;
  }

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (Array.isArray(payload.results)) {
    return payload.results;
  }

  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  return [];
};

const normalizeApiMessage = (item, fallbackConversationId = '') => {
  const msgType = String(item?.msg_type || item?.message_type || item?.type || 'text').toLowerCase();
  const senderRole = String(item?.sender_role || item?.sender || item?.sender_type || item?.role || '').toLowerCase();

  return {
    id: String(item?.id || item?._id || item?.message_id || `msg-${Date.now()}`),
    conversation_id: String(
      item?.conversation_id || item?.conversationId || item?.conversation || fallbackConversationId || ''
    ).trim(),
    type: msgType,
    msg_type: msgType,
    text: String(item?.content || item?.message || item?.text || '').trim(),
    content: String(item?.content || item?.message || item?.text || '').trim(),
    sender: senderRole,
    sender_role: senderRole,
    is_read: Boolean(item?.is_read),
    created_at: item?.created_at || item?.createdAt || new Date().toISOString(),
    status: item?.status || 'sent',
  };
};

const normalizeIncomingMessage = (raw, fallbackConversationId) => {
  const payloadRoot = raw?.payload && typeof raw.payload === 'object' ? raw.payload : raw;
  const payload = payloadRoot?.message && typeof payloadRoot.message === 'object' ? payloadRoot.message : payloadRoot;
  const conversationId = String(
    payload?.conversation_id || payload?.conversationId || payload?.conversation || fallbackConversationId || ''
  ).trim();
  return normalizeApiMessage(payload, conversationId);
};

const isDuplicateMessage = (lastMessage, nextMessage) => {
  if (!lastMessage || !nextMessage) {
    return false;
  }

  const lastText = String(lastMessage?.text || lastMessage?.message || '').trim();
  const nextText = String(nextMessage?.text || nextMessage?.message || '').trim();
  const lastSender = String(lastMessage?.sender || lastMessage?.sender_type || '').trim().toLowerCase();
  const nextSender = String(nextMessage?.sender || nextMessage?.sender_type || '').trim().toLowerCase();

  if (!lastText || !nextText || lastText !== nextText || lastSender !== nextSender) {
    return false;
  }

  const lastTime = new Date(lastMessage?.created_at || lastMessage?.createdAt || 0).getTime();
  const nextTime = new Date(nextMessage?.created_at || nextMessage?.createdAt || 0).getTime();

  if (!Number.isFinite(lastTime) || !Number.isFinite(nextTime)) {
    return false;
  }

  return Math.abs(nextTime - lastTime) <= 1000;
};

export const ChatProvider = ({ children }) => {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messagesByConversationId, setMessagesByConversationId] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [wsStatus, setWsStatus] = useState('idle');
  const [error, setError] = useState(null);
  const messagesByConversationIdRef = useRef({});

  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const manualDisconnectRef = useRef(false);
  const activeConversationIdRef = useRef('');
  const socketReadyRef = useRef(false);

  useEffect(() => {
    messagesByConversationIdRef.current = messagesByConversationId;
  }, [messagesByConversationId]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const appendMessage = useCallback((conversationId, message) => {
    const safeConversationId = String(conversationId || '').trim();
    if (!safeConversationId || !message) {
      return;
    }

    setMessagesByConversationId((prev) => {
      const existing = prev[safeConversationId] || [];
      const last = existing[existing.length - 1];

      if (isDuplicateMessage(last, message)) {
        return prev;
      }

      return {
        ...prev,
        [safeConversationId]: [...existing, message],
      };
    });
  }, []);

  const disconnectChatSocket = useCallback(() => {
    manualDisconnectRef.current = true;
    socketReadyRef.current = false;
    clearReconnectTimer();
    close();
    setWsStatus('disconnected');
  }, [clearReconnectTimer]);

  const flushPendingMessages = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();
    if (!safeConversationId || !socketReadyRef.current) {
      return;
    }

    const currentMessages = messagesByConversationIdRef.current[safeConversationId] || [];
    const pending = currentMessages.filter(
      (item) =>
        String(item?.status || '').toLowerCase() === 'pending' &&
        String(item?.text || item?.message || '').trim()
    );

    if (!pending.length) {
      return;
    }

    const nowIso = new Date().toISOString();
    const sentIds = new Set();

    pending.forEach((item) => {
      const didSend = send({
        type: 'message',
        conversation_id: safeConversationId,
        content: String(item?.text || item?.message || '').trim(),
      });

      if (didSend) {
        sentIds.add(String(item?.id || ''));
      }
    });

    if (!sentIds.size) {
      return;
    }

    setMessagesByConversationId((prev) => {
      const nextConversationMessages = (prev[safeConversationId] || []).map((item) =>
        sentIds.has(String(item?.id || ''))
          ? { ...item, status: 'sent', created_at: nowIso }
          : item
      );

      return {
        ...prev,
        [safeConversationId]: nextConversationMessages,
      };
    });
  }, []);

  const connectChatSocket = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeToken = String(token || '').trim();

    if (!safeConversationId || !safeToken) {
      setWsStatus('error');
      return false;
    }

    if (
      activeConversationIdRef.current === safeConversationId &&
      (wsStatus === 'connected' || wsStatus === 'connecting')
    ) {
      return true;
    }

    if (activeConversationIdRef.current !== safeConversationId) {
      disconnectChatSocket();
    }

    manualDisconnectRef.current = false;
    activeConversationIdRef.current = safeConversationId;
    clearReconnectTimer();
    setWsStatus('connecting');

    connect(
      safeToken,
      (event) => {
        try {
          const parsed = JSON.parse(event?.data || '{}');
          const eventType = String(parsed?.type || '').toLowerCase();
          const normalized = normalizeIncomingMessage(parsed, safeConversationId);

          if (!normalized.conversation_id || normalized.conversation_id !== activeConversationIdRef.current) {
            return;
          }

          if (eventType === 'typing' || eventType === 'read' || eventType === 'error') {
            return;
          }

          appendMessage(normalized.conversation_id, normalized);
        } catch (parseError) {
          // Ignore malformed payloads
        }
      },
      () => {
        socketReadyRef.current = true;
        reconnectAttemptsRef.current = 0;
        setWsStatus('connected');
        flushPendingMessages(safeConversationId);
      },
      (event) => {
        socketReadyRef.current = false;
        setWsStatus('disconnected');

        if (manualDisconnectRef.current) {
          return;
        }

        const closeCode = Number(event?.code || 0);
        if (AUTH_CLOSE_CODES.has(closeCode)) {
          setWsStatus('error');
          setError('Chat authorization expired. Please sign in again.');
          return;
        }

        if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          setWsStatus('error');
          return;
        }

        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const delay = RECONNECT_BASE_DELAY_MS * (2 ** (attempt - 1));

        clearReconnectTimer();
        reconnectTimerRef.current = setTimeout(() => {
          if (!manualDisconnectRef.current && activeConversationIdRef.current) {
            connectChatSocket(activeConversationIdRef.current);
          }
        }, delay);
      },
      () => {
        setWsStatus('error');
      }
    );

    return true;
  }, [appendMessage, clearReconnectTimer, disconnectChatSocket, flushPendingMessages, token, wsStatus]);

  const clearActiveConversation = useCallback(() => {
    disconnectChatSocket();
    setActiveConversation(null);
    setMessagesByConversationId({});
    setConversations([]);
    activeConversationIdRef.current = '';
    reconnectAttemptsRef.current = 0;
  }, [disconnectChatSocket]);

  const handleJobStatusChange = useCallback((status) => {
    const normalized = String(status || '').trim().toLowerCase();

    if (normalized === 'completed' || normalized === 'cancelled' || normalized === 'canceled') {
      clearActiveConversation();
    }
  }, [clearActiveConversation]);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    setError(null);

    try {
      const response = await getConversations();
      setConversations(extractConversations(response?.data || response));
      return response;
    } catch (fetchError) {
      setError(fetchError?.message || 'Failed to load conversations.');
      return null;
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId, { limit = 50, offset = 0 } = {}) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId) {
      setError('Conversation ID is required.');
      return null;
    }

    setLoadingMessages(true);
    clearError();

    try {
      const response = await getMessages(safeConversationId, { limit, offset });
      const incomingMessages = extractMessages(response?.data).map((item) =>
        normalizeApiMessage(item, safeConversationId)
      );
      const orderedMessages = [...incomingMessages].reverse();

      setMessagesByConversationId((prev) => {
        const existing = prev[safeConversationId] || [];
        const next = Number(offset) > 0 ? [...orderedMessages, ...existing] : orderedMessages;

        return {
          ...prev,
          [safeConversationId]: next,
        };
      });

      return response;
    } catch (fetchError) {
      setError(fetchError?.message || 'Failed to load messages.');
      return null;
    } finally {
      setLoadingMessages(false);
    }
  }, [clearError]);

  const openConversation = useCallback(async (conversation) => {
    const conversationId = getConversationId(conversation);

    if (!conversationId) {
      setError('Could not open conversation right now.');
      return null;
    }

    setActiveConversation(conversation);
    activeConversationIdRef.current = conversationId;
    return fetchMessages(conversationId, { limit: 50, offset: 0 });
  }, [fetchMessages]);

  const markConversationRead = useCallback(async (conversationId) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId) {
      setError('Conversation ID is required.');
      return null;
    }

    clearError();

    try {
      const response = await markAsRead(safeConversationId);
      return response;
    } catch (markError) {
      setError(markError?.message || 'Failed to mark conversation as read.');
      return null;
    }
  }, [clearError]);

  const startNewConversation = useCallback(async ({ mechanic_id, job_id }) => {
    setError(null);

    try {
      const response = await startConversation({ mechanic_id, job_id });
      const conversation = response?.data?.conversation || response?.data || null;
      const conversationId = getConversationId(conversation);

      if (conversation && conversationId) {
        setConversations((prev) => {
          const exists = prev.some((item) => getConversationId(item) === conversationId);
          if (exists) {
            return prev;
          }
          return [conversation, ...prev];
        });
        setActiveConversation(conversation);
        activeConversationIdRef.current = conversationId;
        await fetchMessages(conversationId, { limit: 50, offset: 0 });
      } else {
        clearActiveConversation();
      }

      return response;
    } catch (startError) {
      setError(startError?.message || 'Failed to start conversation.');
      return null;
    }
  }, [clearActiveConversation, fetchMessages]);

  const sendQuotation = useCallback(async (conversationId, { amount, job_id }) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId) {
      setError('Conversation ID is required.');
      return null;
    }

    clearError();

    try {
      const response = await createQuotation(safeConversationId, { amount, job_id });
      return response;
    } catch (quotationError) {
      setError(quotationError?.message || 'Failed to send quotation.');
      return null;
    }
  }, [clearError]);

  const respondQuotation = useCallback(async (conversationId, { quotation_id, action }) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId) {
      setError('Conversation ID is required.');
      return null;
    }

    clearError();

    try {
      const response = await respondToQuotation(safeConversationId, { quotation_id, action });
      return response;
    } catch (responseError) {
      setError(responseError?.message || 'Failed to respond to quotation.');
      return null;
    }
  }, [clearError]);

  const initiatePaymentForJob = useCallback(async (jobId, paymentMethod) => {
    const safeJobId = String(jobId || '').trim();

    if (!safeJobId) {
      setError('Job ID is required.');
      return null;
    }

    clearError();

    try {
      const response = await initiateJobPayment(safeJobId, { payment_method: paymentMethod || 'wallet' });
      return response;
    } catch (paymentError) {
      setError(paymentError?.message || 'Failed to initiate payment.');
      return null;
    }
  }, [clearError]);

  const addMockTextMessage = useCallback((conversationId, text) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeText = String(text || '').trim();

    if (!safeConversationId || !safeText) {
      return;
    }

    setSendingMessage(true);
    clearError();

    appendMessage(safeConversationId, {
      id: `mock-text-${Date.now()}`,
      conversation_id: safeConversationId,
      type: 'text',
      text: safeText,
      mocked: true,
      sender: 'me',
      created_at: new Date().toISOString(),
      status: 'sent',
    });

    setSendingMessage(false);
  }, [appendMessage, clearError]);

  const addPendingSocketMessage = useCallback((conversationId, text) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeText = String(text || '').trim();

    if (!safeConversationId || !safeText) {
      return null;
    }

    const pendingId = `pending-${Date.now()}`;
    appendMessage(safeConversationId, {
      id: pendingId,
      conversation_id: safeConversationId,
      type: 'text',
      text: safeText,
      mocked: true,
      sender: 'me',
      created_at: new Date().toISOString(),
      status: 'pending',
    });
    return pendingId;
  }, [appendMessage]);

  const addLocalMessage = useCallback((conversationId, message) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId || !message) {
      return;
    }

    appendMessage(safeConversationId, {
      id: message.id || `local-${Date.now()}`,
      conversation_id: safeConversationId,
      created_at: message.created_at || new Date().toISOString(),
      ...message,
      status: message.status || 'local-only',
    });
  }, [appendMessage]);

  const sendSocketMessage = useCallback((conversationId, content, pendingMessageId) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeContent = String(content || '').trim();

    if (!safeConversationId || !safeContent) {
      return false;
    }

    if (!socketReadyRef.current || wsStatus !== 'connected') {
      return false;
    }

    const didSend = send({
      type: 'message',
      conversation_id: safeConversationId,
      content: safeContent,
    });

    if (!didSend) {
      return false;
    }

    if (pendingMessageId) {
      setMessagesByConversationId((prev) => {
        const current = prev[safeConversationId] || [];
        return {
          ...prev,
          [safeConversationId]: current.map((item) =>
            item.id === pendingMessageId
              ? { ...item, status: 'sent', created_at: new Date().toISOString() }
              : item
          ),
        };
      });
      return true;
    }
    return true;
  }, [wsStatus]);

  const sendTypingEvent = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId || !socketReadyRef.current || wsStatus !== 'connected') {
      return false;
    }

    return send({
      type: 'typing',
      conversation_id: safeConversationId,
    });
  }, [wsStatus]);

  const sendReadEvent = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId || !socketReadyRef.current || wsStatus !== 'connected') {
      return false;
    }

    return send({
      type: 'read',
      conversation_id: safeConversationId,
    });
  }, [wsStatus]);

  const retryPendingMessage = useCallback((conversationId, messageId) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeMessageId = String(messageId || '').trim();

    if (!safeConversationId || !safeMessageId) {
      return false;
    }

    const message = (messagesByConversationId[safeConversationId] || []).find(
      (item) => String(item?.id || '') === safeMessageId
    );

    if (!message) {
      return false;
    }

    return sendSocketMessage(safeConversationId, message.text || message.message || '', safeMessageId);
  }, [messagesByConversationId, sendSocketMessage]);

  const uploadImages = useCallback(async (conversationId, images) => {
    const safeConversationId = String(conversationId || '').trim();
    const files = Array.isArray(images) ? images.slice(0, 5) : [];

    if (!safeConversationId) {
      setError('Conversation ID is required.');
      return null;
    }

    if (!files.length) {
      setError('Please choose at least one image.');
      return null;
    }

    clearError();
    setUploadingImages(true);

    const placeholderBatchId = `mock-image-batch-${Date.now()}`;
    const placeholders = files.map((image, index) => ({
      id: `${placeholderBatchId}-${index}`,
      conversation_id: safeConversationId,
      type: 'image',
      uri: image?.uri || image?.path || String(image || ''),
      mocked: true,
      sender: 'me',
      created_at: new Date().toISOString(),
      status: 'uploading',
    }));

    setMessagesByConversationId((prev) => ({
      ...prev,
      [safeConversationId]: [...(prev[safeConversationId] || []), ...placeholders],
    }));

    try {
      const response = await uploadConversationImages(safeConversationId, files);

      setMessagesByConversationId((prev) => {
        const withoutPlaceholders = (prev[safeConversationId] || []).filter(
          (message) => !String(message?.id || '').startsWith(placeholderBatchId)
        );

        return {
          ...prev,
          [safeConversationId]: withoutPlaceholders,
        };
      });

      return response;
    } catch (uploadError) {
      setMessagesByConversationId((prev) => ({
        ...prev,
        [safeConversationId]: (prev[safeConversationId] || []).map((message) => {
          const isPlaceholder = String(message?.id || '').startsWith(placeholderBatchId);
          return isPlaceholder ? { ...message, status: 'upload-failed' } : message;
        }),
      }));

      setError(uploadError?.message || 'Failed to upload images.');
      return null;
    } finally {
      setUploadingImages(false);
    }
  }, [clearError]);

  useEffect(() => () => {
    clearReconnectTimer();
    close();
  }, [clearReconnectTimer]);

  const value = useMemo(
    () => ({
      conversations,
      activeConversation,
      messagesByConversationId,
      loadingConversations,
      loadingMessages,
      sendingMessage,
      uploadingImages,
      wsStatus,
      error,
      clearError,
      clearActiveConversation,
      handleJobStatusChange,
      fetchConversations,
      openConversation,
      fetchMessages,
      markConversationRead,
      startConversation: startNewConversation,
      sendQuotation,
      respondQuotation,
      initiatePaymentForJob,
      uploadImages,
      connectChatSocket,
      disconnectChatSocket,
      sendSocketMessage,
      sendTypingEvent,
      sendReadEvent,
      retryPendingMessage,
      addPendingSocketMessage,
      addMockTextMessage,
      addLocalMessage,
    }),
    [
      conversations,
      activeConversation,
      messagesByConversationId,
      loadingConversations,
      loadingMessages,
      sendingMessage,
      uploadingImages,
      wsStatus,
      error,
      clearError,
      clearActiveConversation,
      handleJobStatusChange,
      fetchConversations,
      openConversation,
      fetchMessages,
      markConversationRead,
      startNewConversation,
      sendQuotation,
      respondQuotation,
      initiatePaymentForJob,
      uploadImages,
      connectChatSocket,
      disconnectChatSocket,
      sendSocketMessage,
      sendTypingEvent,
      sendReadEvent,
      retryPendingMessage,
      addPendingSocketMessage,
      addMockTextMessage,
      addLocalMessage,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }

  return context;
};

export default ChatContext;
