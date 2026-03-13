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
import { CHAT_WS_URL } from '../config/endpoints';

const ChatContext = createContext(undefined);

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 800;
const AUTH_CLOSE_CODES = new Set([1008, 4001, 4003, 4401, 4403]);
const QUOTE_MESSAGE_TYPES = new Set([
  'price_quote',
  'quotation',
  'quote',
  'quotation_created',
  'quotation_sent',
  'quotation_received',
]);

const normalizeMessageType = (value) => {
  const raw = String(value || 'text').trim().toLowerCase();
  return QUOTE_MESSAGE_TYPES.has(raw) ? 'price_quote' : raw || 'text';
};

const normalizeQuotationDecision = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'accept' || raw === 'accepted') {
    return 'accepted';
  }
  if (raw === 'reject' || raw === 'decline' || raw === 'declined') {
    return 'declined';
  }
  return '';
};

const readSenderRole = (item) => {
  const direct = String(
    item?.sender_role || item?.sender_type || item?.role || item?.sender || ''
  )
    .trim()
    .toLowerCase();
  if (direct && direct !== '[object object]') {
    return direct;
  }

  const senderObj = item?.sender && typeof item.sender === 'object' ? item.sender : null;
  return String(
    senderObj?.role || senderObj?.type || senderObj?.sender_role || senderObj?.sender_type || ''
  )
    .trim()
    .toLowerCase();
};

const readQuotationPayload = (item) => {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const quoted =
    (item?.quotation && typeof item.quotation === 'object' && item.quotation) ||
    (item?.quote && typeof item.quote === 'object' && item.quote) ||
    (item?.quotation_data && typeof item.quotation_data === 'object' && item.quotation_data) ||
    null;

  return quoted;
};

const parseAmountFromText = (text) => {
  const raw = String(text || '').trim();
  if (!raw) {
    return 0;
  }

  const matched = raw.match(/(?:₦|NGN\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)/i);
  if (!matched?.[1]) {
    return 0;
  }

  const parsed = Number(String(matched[1]).replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

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
  const quotation = readQuotationPayload(item);
  const msgType = normalizeMessageType(
    item?.msg_type || item?.message_type || item?.type || quotation?.type || ''
  );
  const senderRole = readSenderRole(item);
  const contentText = String(
    item?.content ||
      item?.message ||
      item?.text ||
      quotation?.content ||
      quotation?.message ||
      quotation?.text ||
      ''
  ).trim();
  const rawAmountValue = Number(
    item?.amount ??
      item?.quotation_amount ??
      item?.quoted_amount ??
      item?.quote_amount ??
      item?.price ??
      quotation?.amount ??
      quotation?.quoted_amount ??
      quotation?.quote_amount ??
      quotation?.price ??
      0
  );
  const amountValue =
    Number.isFinite(rawAmountValue) && rawAmountValue > 0
      ? rawAmountValue
      : parseAmountFromText(contentText);
  const quotationId = String(
    item?.quotation_id ||
      item?.quote_id ||
      quotation?.quotation_id ||
      quotation?.quote_id ||
      quotation?.id ||
      quotation?._id ||
      ''
  ).trim();
  const safeConversationId = String(
    item?.conversation_id ||
      item?.conversationId ||
      item?.conversation ||
      quotation?.conversation_id ||
      quotation?.conversationId ||
      quotation?.conversation ||
      fallbackConversationId ||
      ''
  ).trim();

  return {
    id: String(item?.id || item?._id || item?.message_id || `msg-${Date.now()}`),
    conversation_id: safeConversationId,
    type: msgType,
    msg_type: msgType,
    text: contentText,
    content: contentText,
    sender: senderRole,
    sender_role: senderRole,
    amount: Number.isFinite(amountValue) ? amountValue : 0,
    quotation_id: quotationId || undefined,
    quotation_status:
      normalizeQuotationDecision(item?.quotation_status || quotation?.status || item?.status) || undefined,
    is_read: Boolean(item?.is_read),
    created_at: item?.created_at || item?.createdAt || new Date().toISOString(),
    status: item?.status || 'sent',
  };
};

const normalizeIncomingMessage = (raw, fallbackConversationId) => {
  const eventType = String(raw?.type || '').trim().toLowerCase();
  const payloadRoot = raw?.payload && typeof raw.payload === 'object' ? raw.payload : raw;
  const embeddedQuotation =
    payloadRoot?.quotation && typeof payloadRoot.quotation === 'object' ? payloadRoot.quotation : null;
  const messagePayload =
    payloadRoot?.message && typeof payloadRoot.message === 'object' ? payloadRoot.message : null;

  const payload = messagePayload || payloadRoot;
  const shouldUseQuotation =
    Boolean(embeddedQuotation) &&
    (eventType.includes('quotation') ||
      String(payload?.type || payload?.msg_type || '').trim().length === 0);

  const mergedPayload = shouldUseQuotation
    ? {
        ...payload,
        ...embeddedQuotation,
        quotation: embeddedQuotation,
        type: payload?.type || payload?.msg_type || embeddedQuotation?.type || 'price_quote',
        msg_type: payload?.msg_type || payload?.type || embeddedQuotation?.type || 'price_quote',
      }
    : payload;

  const conversationId = String(
    mergedPayload?.conversation_id ||
      mergedPayload?.conversationId ||
      mergedPayload?.conversation ||
      fallbackConversationId ||
      ''
  ).trim();
  return normalizeApiMessage(mergedPayload, conversationId);
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

const readMessageId = (item) =>
  String(item?.id || item?._id || item?.message_id || '').trim();

const readMessageQuotationId = (item) =>
  String(item?.quotation_id || item?.quote_id || '').trim();

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
  const [wsCloseInfo, setWsCloseInfo] = useState(null);
  const [wsErrorInfo, setWsErrorInfo] = useState(null);
  const [wsDebugInfo, setWsDebugInfo] = useState({ url: '', tokenLength: 0, state: 'idle' });
  const [latestJobRequestUpdate, setLatestJobRequestUpdate] = useState(null);
  const [latestJobStatusUpdate, setLatestJobStatusUpdate] = useState(null);
  const [carOwnerChatShortcut, setCarOwnerChatShortcutState] = useState(null);
  const [mechanicChatShortcut, setMechanicChatShortcutState] = useState(null);
  const [error, setError] = useState(null);
  const messagesByConversationIdRef = useRef({});

  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const connectTimeoutRef = useRef(null);
  const connectAttemptRef = useRef(0);
  const [wsEventInfo, setWsEventInfo] = useState('');
  const [wsDebugExtras, setWsDebugExtras] = useState({
    connecting: false,
    activeConversationId: '',
    attemptId: '',
  });
  const chatActiveRef = useRef(false);
  const connectingRef = useRef(false);
  const manualDisconnectRef = useRef(false);
  const activeConversationIdRef = useRef('');
  const socketReadyRef = useRef(false);
  // Mirrors wsStatus so connectChatSocket can read the current value without
  // adding wsStatus to its useCallback dependency array (which caused stale
  // closures and spurious reconnect loops).
  const wsStatusRef = useRef('idle');

  useEffect(() => {
    messagesByConversationIdRef.current = messagesByConversationId;
  }, [messagesByConversationId]);

  // Keep wsStatusRef in sync with wsStatus state.
  useEffect(() => {
    wsStatusRef.current = wsStatus;
  }, [wsStatus]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const clearConnectTimeout = useCallback(() => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current);
      connectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => () => clearConnectTimeout(), [clearConnectTimeout]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setCarOwnerChatShortcut = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const conversationId = String(payload?.conversationId || '').trim();
    const jobId = String(payload?.jobId || '').trim();
    if (!conversationId || !jobId) {
      return;
    }

    setCarOwnerChatShortcutState({
      conversationId,
      jobId,
      mechanicId: payload?.mechanicId || null,
      mechanic: payload?.mechanic || null,
      issueSummary: payload?.issueSummary || null,
      progressStatus: payload?.progressStatus || '',
    });
  }, []);

  const clearCarOwnerChatShortcut = useCallback(() => {
    setCarOwnerChatShortcutState(null);
  }, []);

  const setMechanicChatShortcut = useCallback((payload) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }

    const conversationId = String(payload?.conversationId || '').trim();
    const jobId = String(payload?.jobId || '').trim();
    if (!conversationId || !jobId) {
      return;
    }

    setMechanicChatShortcutState({
      conversationId,
      jobId,
      mechanicId: payload?.mechanicId || null,
      customer: payload?.customer || null,
      issueSummary: payload?.issueSummary || null,
      progressStatus: payload?.progressStatus || '',
    });
  }, []);

  const clearMechanicChatShortcut = useCallback(() => {
    setMechanicChatShortcutState(null);
  }, []);

  const appendMessage = useCallback((conversationId, message) => {
    const safeConversationId = String(conversationId || '').trim();
    if (!safeConversationId || !message) {
      return;
    }

    setMessagesByConversationId((prev) => {
      const existing = prev[safeConversationId] || [];
      const last = existing[existing.length - 1];
      const nextMessageId = readMessageId(message);
      const nextQuoteId = readMessageQuotationId(message);
      const nextType = normalizeMessageType(message?.type || message?.msg_type || '');

      if (nextMessageId) {
        const alreadyExistsById = existing.some(
          (item) => readMessageId(item) && readMessageId(item) === nextMessageId
        );
        if (alreadyExistsById) {
          return prev;
        }
      }

      if (nextQuoteId && nextType === 'price_quote') {
        const alreadyExistsByQuoteId = existing.some((item) => {
          const itemType = normalizeMessageType(item?.type || item?.msg_type || '');
          return itemType === 'price_quote' && readMessageQuotationId(item) === nextQuoteId;
        });
        if (alreadyExistsByQuoteId) {
          return prev;
        }
      }

      if (isDuplicateMessage(last, message)) {
        return prev;
      }

      return {
        ...prev,
        [safeConversationId]: [...existing, message],
      };
    });
  }, []);

  const disconnectChatSocket = useCallback((reason = '') => {
    manualDisconnectRef.current = true;
    socketReadyRef.current = false;
    clearReconnectTimer();
    clearConnectTimeout();
    close();
    setWsStatus('disconnected');
    setWsCloseInfo(null);
    setWsErrorInfo(null);
    setWsEventInfo(reason ? `disconnect:${reason}` : 'disconnect-called');
    setWsDebugInfo((prev) => ({ ...prev, state: 'closed' }));
    setWsDebugExtras((prev) => ({
      ...prev,
      connecting: false,
    }));
  }, [clearReconnectTimer, clearConnectTimeout]);

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

  const clearActiveConversation = useCallback((options = {}) => {
    const { force = false } = options;
    if (chatActiveRef.current && !force) {
      return;
    }
    disconnectChatSocket('clear-active');
    setActiveConversation(null);
    setMessagesByConversationId({});
    setConversations([]);
    setCarOwnerChatShortcutState(null);
    setMechanicChatShortcutState(null);
    activeConversationIdRef.current = '';
    reconnectAttemptsRef.current = 0;
  }, [disconnectChatSocket]);

  const handleJobStatusChange = useCallback(
    (status) => {
      const normalized = String(status || '').trim().toLowerCase();

      if (normalized === 'completed' || normalized === 'cancelled' || normalized === 'canceled') {
        clearActiveConversation();
        setCarOwnerChatShortcutState(null);
        setMechanicChatShortcutState(null);
      }
    },
    [clearActiveConversation]
  );

  const setChatActive = useCallback((isActive) => {
    chatActiveRef.current = Boolean(isActive);
  }, []);

  const connectChatSocket = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeToken = String(token || '').trim();
    const url = CHAT_WS_URL
      ? `${CHAT_WS_URL}${CHAT_WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(safeToken)}`
      : '';
    setWsDebugInfo({
      url,
      tokenLength: safeToken.length,
      state: 'connecting',
    });

    if (!safeConversationId || !safeToken) {
      setWsStatus('error');
      return false;
    }

    if (
      activeConversationIdRef.current === safeConversationId &&
      (wsStatusRef.current === 'connected' || wsStatusRef.current === 'connecting' || connectingRef.current)
    ) {
      return true;
    }

    if (activeConversationIdRef.current && activeConversationIdRef.current !== safeConversationId) {
      disconnectChatSocket('switch-conversation');
    }

    manualDisconnectRef.current = false;
    activeConversationIdRef.current = safeConversationId;
    clearReconnectTimer();
    clearConnectTimeout();
    setWsStatus('connecting');
    connectingRef.current = true;
    const attemptId = Date.now();
    connectAttemptRef.current = attemptId;
    setWsEventInfo('connect-called');
    setWsDebugExtras({
      connecting: true,
      activeConversationId: safeConversationId,
      attemptId: String(attemptId),
    });
    connectTimeoutRef.current = setTimeout(() => {
      if (connectingRef.current && connectAttemptRef.current === attemptId) {
        setWsStatus('error');
        setWsErrorInfo({ message: 'WebSocket handshake timeout' });
        setWsDebugInfo((prev) => ({ ...prev, state: 'timeout' }));
        setWsEventInfo('timeout');
        connectingRef.current = false;
        setWsDebugExtras((prev) => ({ ...prev, connecting: false }));
      }
    }, 6000);

    connect(
      safeToken,
      (event) => {
        try {
          const parsed = JSON.parse(event?.data || '{}');
          const eventType = String(parsed?.type || '').toLowerCase();
          const payload = parsed?.payload || {};

          if (eventType === 'job_request_updated') {
            setLatestJobRequestUpdate(payload);
            const requestStatus = String(payload?.status || payload?.new_status || '').trim().toLowerCase();
            if (requestStatus === 'cancelled' || requestStatus === 'canceled') {
              handleJobStatusChange(requestStatus);
            }
            return;
          }

          if (eventType === 'job_status_updated') {
            setLatestJobStatusUpdate(payload);
            handleJobStatusChange(payload?.new_status);
            return;
          }

          if (eventType === 'quotation_response') {
            const safeConversationIdForQuote = activeConversationIdRef.current || safeConversationId;
            const quotationId = String(
              payload?.quotation_id || payload?.quote_id || payload?.id || payload?._id || ''
            ).trim();
            const nextDecision = normalizeQuotationDecision(payload?.status || payload?.action);

            if (safeConversationIdForQuote && (quotationId || nextDecision)) {
              setMessagesByConversationId((prev) => {
                const current = prev[safeConversationIdForQuote] || [];
                const next = current.map((message) => {
                  const messageQuoteId = String(
                    message?.quotation_id || message?.quote_id || message?.id || message?._id || ''
                  ).trim();
                  const matches = quotationId && messageQuoteId && messageQuoteId === quotationId;
                  if (!matches) {
                    return message;
                  }
                  return {
                    ...message,
                    quotation_status: nextDecision || message?.quotation_status,
                  };
                });

                return {
                  ...prev,
                  [safeConversationIdForQuote]: next,
                };
              });
            }

            appendMessage(activeConversationIdRef.current || safeConversationId, {
              id: `quotation-response-${Date.now()}`,
              conversation_id: activeConversationIdRef.current || safeConversationId,
              type: 'system',
              text: `Quotation ${nextDecision || String(payload?.status || payload?.action || 'updated')}.`,
              created_at: new Date().toISOString(),
              status: 'sent',
            });
            return;
          }

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
        connectingRef.current = false;
        clearConnectTimeout();
        setWsDebugInfo((prev) => ({ ...prev, state: 'open' }));
        setWsCloseInfo(null);
        setWsErrorInfo(null);
        setWsEventInfo('open');
        setWsDebugExtras((prev) => ({ ...prev, connecting: false }));
        flushPendingMessages(safeConversationId);
      },
      (event) => {
        socketReadyRef.current = false;
        setWsStatus('disconnected');
        connectingRef.current = false;
        clearConnectTimeout();
        setWsDebugInfo((prev) => ({ ...prev, state: 'closed' }));
        setWsCloseInfo({
          code: event?.code,
          reason: event?.reason,
        });
        setWsEventInfo('close');
        setWsDebugExtras((prev) => ({ ...prev, connecting: false }));

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
      (event) => {
        setWsStatus('error');
        connectingRef.current = false;
        clearConnectTimeout();
        setWsDebugInfo((prev) => ({ ...prev, state: 'error' }));
        setWsErrorInfo({
          message: event?.message,
        });
        setWsEventInfo('error');
        setWsDebugExtras((prev) => ({ ...prev, connecting: false }));
      }
    );

    return true;
    // wsStatus intentionally omitted — read via wsStatusRef.current to avoid
    // stale closure captures and spurious reconnect loops on status transitions.
  }, [appendMessage, clearConnectTimeout, clearReconnectTimer, disconnectChatSocket, flushPendingMessages, handleJobStatusChange, token]);

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
      const statusCode = Number(fetchError?.statusCode || fetchError?.response?.status || 0);
      if (statusCode === 404) {
        setMessagesByConversationId((prev) => ({
          ...prev,
          [safeConversationId]: [],
        }));
        setError('This conversation is no longer available.');
        return { __ended: true };
      }
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
      if (__DEV__) {
        console.log('[Chat] Quotation error:', quotationError?.response?.data || quotationError?.message);
      }
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

  const initiatePaymentForJob = useCallback(async (jobId, paymentMethod, options = {}) => {
    const safeJobId = String(jobId || '').trim();

    if (!safeJobId) {
      setError('Job ID is required.');
      return null;
    }

    clearError();

    try {
      const response = await initiateJobPayment(safeJobId, {
        payment_method: paymentMethod || 'wallet',
        email: options?.email,
      });
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

    if (!socketReadyRef.current || wsStatusRef.current !== 'connected') {
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
  }, []);

  const sendTypingEvent = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId || !socketReadyRef.current || wsStatusRef.current !== 'connected') {
      return false;
    }

    return send({
      type: 'typing',
      conversation_id: safeConversationId,
    });
  }, []);

  const sendReadEvent = useCallback((conversationId) => {
    const safeConversationId = String(conversationId || '').trim();

    if (!safeConversationId || !socketReadyRef.current || wsStatusRef.current !== 'connected') {
      return false;
    }

    return send({
      type: 'read',
      conversation_id: safeConversationId,
    });
  }, []);

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
    clearConnectTimeout();
    close();
  }, [clearReconnectTimer, clearConnectTimeout]);

  // When the auth token changes (logout, login as different user, role switch),
  // fully tear down the existing socket and reset all chat state so the new
  // session starts clean. Without this the old authenticated socket leaks into
  // the new session and stays permanently disconnected.
  const prevTokenRef = useRef(token);
  useEffect(() => {
    if (prevTokenRef.current === token) {
      prevTokenRef.current = token;
      return;
    }
    prevTokenRef.current = token;

    // Tear down.
    manualDisconnectRef.current = true;
    socketReadyRef.current = false;
    clearReconnectTimer();
    clearConnectTimeout();
    close();
    wsStatusRef.current = 'idle';
    setWsStatus('idle');
    setWsCloseInfo(null);
    setWsErrorInfo(null);
    setWsDebugInfo({ url: '', tokenLength: 0, state: 'idle' });
    connectingRef.current = false;
    setWsEventInfo('');
    setWsDebugExtras({ connecting: false, activeConversationId: '', attemptId: '' });

    // Reset all chat state so the next session starts fresh.
    setConversations([]);
    setActiveConversation(null);
    setMessagesByConversationId({});
    setCarOwnerChatShortcutState(null);
    setMechanicChatShortcutState(null);
    activeConversationIdRef.current = '';
    reconnectAttemptsRef.current = 0;
    setError(null);
  }, [token, clearReconnectTimer, clearConnectTimeout]);

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
      wsCloseInfo,
      wsErrorInfo,
      wsDebugInfo,
      wsEventInfo,
      wsDebugExtras,
      latestJobRequestUpdate,
      latestJobStatusUpdate,
      carOwnerChatShortcut,
      mechanicChatShortcut,
      error,
      clearError,
      setCarOwnerChatShortcut,
      clearCarOwnerChatShortcut,
      setMechanicChatShortcut,
      clearMechanicChatShortcut,
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
      setChatActive,
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
      wsCloseInfo,
      wsErrorInfo,
      wsDebugInfo,
      wsEventInfo,
      wsDebugExtras,
      latestJobRequestUpdate,
      latestJobStatusUpdate,
      carOwnerChatShortcut,
      mechanicChatShortcut,
      error,
      clearError,
      setCarOwnerChatShortcut,
      clearCarOwnerChatShortcut,
      setMechanicChatShortcut,
      clearMechanicChatShortcut,
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
      setChatActive,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    if (__DEV__) {
      console.warn('[Chat] useChat called outside ChatProvider. Returning no-op fallback.');
    }
    return {
      conversations: [],
      activeConversation: null,
      messagesByConversationId: {},
      loadingConversations: false,
      loadingMessages: false,
      sendingMessage: false,
      uploadingImages: false,
      wsStatus: 'error',
      latestJobRequestUpdate: null,
      latestJobStatusUpdate: null,
      carOwnerChatShortcut: null,
      mechanicChatShortcut: null,
      error: 'Chat provider unavailable',
      clearError: () => {},
      setCarOwnerChatShortcut: () => {},
      clearCarOwnerChatShortcut: () => {},
      setMechanicChatShortcut: () => {},
      clearMechanicChatShortcut: () => {},
      clearActiveConversation: () => {},
      handleJobStatusChange: () => {},
      fetchConversations: async () => null,
      openConversation: async () => null,
      fetchMessages: async () => null,
      markConversationRead: async () => null,
      startConversation: async () => null,
      sendQuotation: async () => null,
      respondQuotation: async () => null,
      initiatePaymentForJob: async () => null,
      uploadImages: async () => null,
      connectChatSocket: () => false,
      disconnectChatSocket: () => {},
      sendSocketMessage: () => false,
      sendTypingEvent: () => false,
      sendReadEvent: () => false,
      retryPendingMessage: () => false,
      addPendingSocketMessage: () => null,
      addMockTextMessage: () => {},
      addLocalMessage: () => {},
      setChatActive: () => {},
    };
  }

  return context;
};

export default ChatContext;
