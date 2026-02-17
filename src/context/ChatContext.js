import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  getConversations,
  getMessages,
  markAsRead,
  startConversation,
  uploadConversationImages,
} from '../services/chat.service';

const ChatContext = createContext(undefined);

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

  return [];
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messagesByConversationId, setMessagesByConversationId] = useState({});
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null);
    setMessagesByConversationId({});
    setConversations([]);
  }, []);

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
      setConversations([]);
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
      const incomingMessages = extractMessages(response?.data);

    setMessagesByConversationId((prev) => {
      const existing = prev[safeConversationId] || [];
      const next =
        Number(offset) > 0
          ? [...existing, ...incomingMessages]
            : incomingMessages;

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
    setConversations([]);
    setMessagesByConversationId({});
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
        setActiveConversation(conversation);
        setConversations([]);
        setMessagesByConversationId({});
        await fetchMessages(conversationId, { limit: 50, offset: 0 });
      } else {
        clearActiveConversation();
      }

      return response;
    } catch (startError) {
      setError(startError?.message || 'Failed to start conversation.');
      return null;
    }
  }, [fetchConversations, fetchMessages]);

  const addMockTextMessage = useCallback((conversationId, text) => {
    const safeConversationId = String(conversationId || '').trim();
    const safeText = String(text || '').trim();

    if (!safeConversationId || !safeText) {
      return;
    }

    setSendingMessage(true);
    clearError();

    const mockMessage = {
      id: `mock-text-${Date.now()}`,
      conversation_id: safeConversationId,
      type: 'text',
      text: safeText,
      mocked: true,
      sender: 'me',
      created_at: new Date().toISOString(),
      status: 'local-only',
    };

    setMessagesByConversationId((prev) => ({
      ...prev,
      [safeConversationId]: [...(prev[safeConversationId] || []), mockMessage],
    }));

    setSendingMessage(false);
  }, [clearError]);

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
      const uploadedMessages = extractMessages(response?.data);

      setMessagesByConversationId((prev) => {
        const withoutPlaceholders = (prev[safeConversationId] || []).filter(
          (message) => !String(message?.id || '').startsWith(placeholderBatchId)
        );

        return {
          ...prev,
          [safeConversationId]: uploadedMessages.length
            ? [...withoutPlaceholders, ...uploadedMessages]
            : withoutPlaceholders,
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

  const value = useMemo(
    () => ({
      conversations,
      activeConversation,
      messagesByConversationId,
      loadingConversations,
      loadingMessages,
      sendingMessage,
      uploadingImages,
      error,
      clearError,
      clearActiveConversation,
      handleJobStatusChange,
      fetchConversations,
      openConversation,
      fetchMessages,
      markConversationRead,
      startConversation: startNewConversation,
      uploadImages,
      addMockTextMessage,
    }),
    [
      conversations,
      activeConversation,
      messagesByConversationId,
      loadingConversations,
      loadingMessages,
      sendingMessage,
      uploadingImages,
      error,
      clearError,
      clearActiveConversation,
      handleJobStatusChange,
      fetchConversations,
      openConversation,
      fetchMessages,
      markConversationRead,
      startNewConversation,
      uploadImages,
      addMockTextMessage,
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
