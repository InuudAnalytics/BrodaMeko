import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { ENDPOINTS } from '../../config/endpoints';
import { useAuth } from '../../context';
import { getSupportTicketMessages, getSupportTickets, markSupportTicketRead } from '../../services/support.service';
import { trackTelemetryEvent } from '../../services/telemetry.service';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SupportChatScreen = ({ navigation, route }) => {
  const { token } = useAuth();
  const [ticketId, setTicketId] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState('Connecting...');
  const [sending, setSending] = useState(false);
  const wsRef = useRef(null);

  const appendOrMergeMessage = useCallback((incoming) => {
    if (!incoming) {
      return;
    }

    setMessages((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === incoming.id);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = incoming;
        return next;
      }
      return [...prev, incoming].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
  }, []);

  const normalizeMessage = useCallback((raw) => {
    const createdAtValue = raw?.created_at || raw?.createdAt || new Date().toISOString();
    const createdAtDate = new Date(createdAtValue);
    return {
      id: String(raw?.id || `local-${Date.now()}-${Math.random()}`),
      ticketId: String(raw?.ticket_id || raw?.ticketId || '').trim(),
      text: String(raw?.content || raw?.text || '').trim(),
      mine: String(raw?.sender_type || raw?.senderType || '').toLowerCase() === 'user',
      msgType: String(raw?.msg_type || raw?.msgType || 'text').toLowerCase(),
      createdAt: Number.isNaN(createdAtDate.getTime()) ? new Date().toISOString() : createdAtDate.toISOString(),
      time: Number.isNaN(createdAtDate.getTime())
        ? ''
        : createdAtDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    };
  }, []);

  const resolveInitialTicket = useCallback(async () => {
    const routeTicketId = String(route?.params?.ticketId || '').trim();
    if (routeTicketId) {
      return routeTicketId;
    }

    const listResponse = await getSupportTickets({ page: 1, limit: 1 });
    const payload = listResponse?.data || listResponse || {};
    const list = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return String(list?.[0]?.id || '').trim();
  }, [route?.params?.ticketId]);

  const hydrateMessages = useCallback(async (targetTicketId) => {
    const history = await getSupportTicketMessages(targetTicketId, { limit: 100, offset: 0 });
    const payload = history?.data || history || {};
    const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    const normalized = items.map(normalizeMessage).filter((item) => item.text);
    setMessages(normalized);
    await markSupportTicketRead(targetTicketId).catch(() => null);
  }, [normalizeMessage]);

  const connectSocket = useCallback((targetTicketId) => {
    if (!token || !targetTicketId) {
      return;
    }

    const wsUrl = `${ENDPOINTS.support.ws}${ENDPOINTS.support.ws.includes('?') ? '&' : '?'}token=${encodeURIComponent(
      String(token || '')
    )}`;

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore close error
      }
      wsRef.current = null;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusText('Connected');
      trackTelemetryEvent('support_ws_connected', { ticket_id: targetTicketId });
    };

    ws.onerror = () => {
      setStatusText('Connection error');
      trackTelemetryEvent('support_ws_error', { ticket_id: targetTicketId });
    };

    ws.onclose = () => {
      setStatusText('Disconnected');
      trackTelemetryEvent('support_ws_closed', { ticket_id: targetTicketId });
    };

    ws.onmessage = (event) => {
      if (!event?.data) {
        return;
      }

      try {
        const packet = JSON.parse(event.data);
        const packetType = String(packet?.type || '').toLowerCase();
        if (packetType === 'message') {
          const normalized = normalizeMessage(packet?.payload || {});
          if (normalized.ticketId && normalized.ticketId !== targetTicketId) {
            return;
          }
          appendOrMergeMessage(normalized);
        } else if (packetType === 'error') {
          const message = String(packet?.payload?.message || 'Message failed.');
          setStatusText(message);
        }
      } catch {
        // ignore invalid ws payload
      }
    };
  }, [appendOrMergeMessage, normalizeMessage, token]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      setLoading(true);
      setStatusText('Loading...');
      try {
        const nextTicketId = await resolveInitialTicket();
        if (!active) {
          return;
        }

        if (!nextTicketId) {
          setStatusText('Ready');
          setLoading(false);
          return;
        }

        setTicketId(nextTicketId);
        await hydrateMessages(nextTicketId);
        if (!active) {
          return;
        }
        connectSocket(nextTicketId);
      } catch (error) {
        if (active) {
          setStatusText(error?.message || 'Could not load support chat');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore close error
        }
        wsRef.current = null;
      }
    };
  }, [connectSocket, hydrateMessages, resolveInitialTicket]);

  const canSend = useMemo(() => String(input || '').trim().length > 0, [input]);
  const hasTicket = Boolean(String(ticketId || '').trim());
  const hasMessages = messages.length > 0;
  const showNoTicketState = !loading && !hasTicket;
  const showNoMessagesState = !loading && hasTicket && !hasMessages;

  const handleSend = () => {
    if (sending) {
      return;
    }

    const text = String(input || '').trim();
    if (!text || !ticketId) {
      return;
    }

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatusText('Chat is not connected yet.');
      trackTelemetryEvent('support_ws_send_failed_not_connected', { ticket_id: ticketId });
      return;
    }

    setSending(true);
    ws.send(
      JSON.stringify({
        type: 'message',
        ticket_id: ticketId,
        content: text,
      })
    );
    trackTelemetryEvent('support_ws_message_sent', { ticket_id: ticketId, length: text.length });
    setInput('');

    setTimeout(() => {
      setSending(false);
      hydrateMessages(ticketId).catch(() => null);
    }, 400);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <AppText style={styles.title}>Chat support</AppText>
          <AppText style={styles.subtitle}>{statusText}</AppText>
        </View>
      </View>

      {hasTicket ? <AppText style={styles.todayText}>{`Ticket: ${ticketId.slice(0, 8)}...`}</AppText> : null}

      <View style={styles.messagesWrap}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}
        {showNoTicketState ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyText}>No support ticket found.</AppText>
            <TouchableOpacity
              style={styles.createTicketButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate(ROUTES.SUPPORT_CREATE)}
            >
              <AppText style={styles.createTicketButtonText}>Create a ticket</AppText>
            </TouchableOpacity>
          </View>
        ) : null}
        {showNoMessagesState ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyText}>No messages yet.</AppText>
          </View>
        ) : null}
        {messages.map((item) => (
          <View key={item.id} style={[styles.messageRow, item.mine ? styles.messageRowMine : null]}>
            <View style={[styles.messageBubble, item.mine ? styles.messageBubbleMine : null]}>
              {item.msgType === 'image' ? (
                <AppText style={[styles.messageText, item.mine ? styles.messageTextMine : null]}>
                  Image: {item.text}
                </AppText>
              ) : (
                <AppText style={[styles.messageText, item.mine ? styles.messageTextMine : null]}>{item.text}</AppText>
              )}
            </View>
            <AppText style={styles.messageTime}>{item.time}</AppText>
          </View>
        ))}
      </View>

      {hasTicket ? (
        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type in your message"
              placeholderTextColor="rgba(255,255,255,0.38)"
              style={styles.input}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, !canSend ? styles.sendButtonDisabled : null]}
            activeOpacity={0.9}
            disabled={!canSend || sending || !ticketId}
            onPress={handleSend}
          >
            {sending ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.82)" />
            ) : (
              <HugeiconsIcon icon={SentIcon} size={18} color="rgba(255,255,255,0.82)" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    marginRight: 36,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  subtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    lineHeight: 20,
  },
  todayText: {
    marginTop: 14,
    alignSelf: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  messagesWrap: {
    marginTop: 14,
    flex: 1,
    rowGap: 14,
  },
  loadingWrap: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    marginTop: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  createTicketButton: {
    marginTop: 10,
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTicketButtonText: {
    color: darkTheme.colors.background,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  messageRow: {
    alignSelf: 'flex-start',
    maxWidth: '76%',
  },
  messageRowMine: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 18,
    borderTopLeftRadius: 18,
    backgroundColor: '#F1F2F4',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: '#DADDF6',
  },
  messageText: {
    color: '#5B6072',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTextMine: {
    color: '#2B2F42',
  },
  messageTime: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.48)',
    fontSize: 14,
    lineHeight: 18,
  },
  inputRow: {
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  inputWrap: {
    flex: 1,
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  input: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    paddingVertical: 0,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
});

export default SupportChatScreen;
