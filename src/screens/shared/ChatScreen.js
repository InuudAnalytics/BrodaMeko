import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Animated, FlatList, Image, Modal, Pressable, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BubbleChatIcon, SentIcon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../components';
import { useChat } from '../../context/ChatContext';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES, useKeyboardLift } from '../../utils';
import { useFocusEffect } from '@react-navigation/native';
import AppAlert from '../../components/AppAlert';
import { getWalletBalance } from '../../services/wallet.service';
const hexToRgba = (hex, alpha) => {
  const cleaned = String(hex || '')
    .replace('#', '')
    .trim();
  if (cleaned.length !== 6) {
    return `rgba(230,199,20,${alpha})`;
  }
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const BackIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M15 6L9 12L15 18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CallIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6.5 3.5h2.1c.5 0 .9.3 1 .8l.6 2.7c.1.4 0 .8-.3 1.1l-1.2 1.2a13 13 0 0 0 5.8 5.8l1.2-1.2c.3-.3.7-.4 1.1-.3l2.7.6c.5.1.8.5.8 1v2.1c0 .6-.4 1.1-1 1.2-.8.1-1.6.2-2.4.2A15.6 15.6 0 0 1 4.8 6.9c0-.8.1-1.6.2-2.4.1-.6.6-1 1.2-1Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const formatTime = dateValue => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const resolveConversationId = routeParams => {
  const fromParam = String(routeParams?.conversationId || '').trim();
  if (fromParam) {
    return fromParam;
  }

  const conversation = routeParams?.conversation;
  return (
    String(
      conversation?.id ||
        conversation?._id ||
        conversation?.conversation_id ||
        conversation?.conversationId ||
        '',
    ).trim() || 'local-preview'
  );
};

const isSenderMe = (item, currentUserRole) => {
  const sender = String(
    item?.sender || item?.sender_type || item?.role || '',
  ).toLowerCase();
  if (sender === 'me' || sender === 'self') {
    return true;
  }
  if (currentUserRole === ROLES.CAR_OWNER) {
    return sender === 'user' || sender === 'car_owner';
  }
  if (currentUserRole === ROLES.MECH) {
    return sender === 'mechanic' || sender === 'mech';
  }
  return sender === 'user' || sender === 'car_owner';
};

const getMessageText = item => {
  const baseText = item?.text || item?.message || '';
  return item?.status === 'pending' ? `${baseText} (pending)` : baseText;
};

const isPriceQuoteMessage = item => {
  const rawType = String(item?.type || item?.msg_type || '')
    .trim()
    .toLowerCase();
  return (
    rawType === 'price_quote' ||
    rawType === 'quotation' ||
    rawType === 'quote' ||
    rawType === 'quotation_created' ||
    rawType === 'quotation_received'
  );
};

const normalizeQuotationDecision = value => {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'accept' || raw === 'accepted') {
    return 'accepted';
  }
  if (raw === 'reject' || raw === 'decline' || raw === 'declined') {
    return 'declined';
  }
  return '';
};

const getQuotationKey = item =>
  String(item?.quotation_id || item?.quote_id || item?.id || item?._id || '').trim();

const readWalletAmount = (walletPayload) => {
  const root = walletPayload?.data || walletPayload || {};
  const value =
    root?.balance ??
    root?.available_balance ??
    root?.wallet_balance ??
    root?.amount ??
    0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const MessageBubble = ({
  item,
  currentUserRole,
  onAcceptPrice,
  onDeclinePrice,
  onRetryPending,
  quotationDecision,
  quotationBusy,
}) => {
  if (item?.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <AppText style={styles.systemText}>{item.text}</AppText>
      </View>
    );
  }

  if (isPriceQuoteMessage(item)) {
    const amountText = `₦${Number(item?.amount || 0).toLocaleString()}`;
    const isMechanicView = currentUserRole === ROLES.MECH;
    return (
      <View style={styles.priceQuoteWrap}>
        <View style={styles.priceQuoteBubble}>
          <AppText style={styles.priceQuoteTitle}>
            {isMechanicView ? 'Set price at' : 'Price quote'}
          </AppText>
          <AppText style={styles.priceQuoteAmount}>{amountText} NGN</AppText>
          <AppText style={styles.priceQuoteSub}>
            Price includes labour only
          </AppText>
        </View>
        {currentUserRole === ROLES.CAR_OWNER ? (
          quotationDecision ? (
            <View style={styles.quoteResolvedWrap}>
              <AppText
                style={[
                  styles.quoteResolvedText,
                  quotationDecision === 'accepted'
                    ? styles.quoteResolvedAccepted
                    : styles.quoteResolvedDeclined,
                ]}
              >
                {quotationDecision === 'accepted' ? 'Accepted' : 'Declined'}
              </AppText>
            </View>
          ) : (
            <View style={styles.priceQuoteActions}>
              <TouchableOpacity
                style={[styles.priceQuoteBtn, quotationBusy ? styles.priceQuoteBtnDisabled : null]}
                activeOpacity={0.85}
                onPress={onAcceptPrice}
                disabled={quotationBusy}
              >
                <AppText style={styles.priceQuoteBtnText}>Accept</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.priceQuoteBtnAlt, quotationBusy ? styles.priceQuoteBtnDisabled : null]}
                activeOpacity={0.85}
                onPress={onDeclinePrice}
                disabled={quotationBusy}
              >
                <AppText style={styles.priceQuoteBtnAltText}>Decline</AppText>
              </TouchableOpacity>
            </View>
          )
        ) : null}
      </View>
    );
  }

  const isMe = isSenderMe(item, currentUserRole);
  const isPendingMine = isMe && item?.status === 'pending';
  const isImageMessage =
    String(item?.type || item?.msg_type || '').toLowerCase() === 'image';

  if (isImageMessage) {
    const imageUri = String(
      item?.content || item?.text || item?.uri || '',
    ).trim();

    return (
      <Pressable
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
        onPress={() => {
          if (isPendingMine) {
            onRetryPending?.(item);
          }
        }}
      >
        <View
          style={[styles.bubble, isMe ? styles.meBubble : styles.otherBubble]}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.messageImage} />
          ) : (
            <AppText
              style={[
                styles.messageText,
                isMe ? styles.meMessageText : styles.otherMessageText,
              ]}
            >
              Image unavailable
            </AppText>
          )}
        </View>
        <AppText style={styles.timestamp}>
          {item?.timestamp || formatTime(item?.created_at)}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Pressable
      style={[
        styles.messageRow,
        isMe ? styles.messageRowMe : styles.messageRowOther,
      ]}
      onPress={() => {
        if (isPendingMine) {
          onRetryPending?.(item);
        }
      }}
    >
      <View
        style={[styles.bubble, isMe ? styles.meBubble : styles.otherBubble]}
      >
        <AppText
          style={[
            styles.messageText,
            isMe ? styles.meMessageText : styles.otherMessageText,
          ]}
        >
          {getMessageText(item)}
        </AppText>
      </View>
      <AppText style={styles.timestamp}>
        {item?.timestamp || formatTime(item?.created_at)}
      </AppText>
    </Pressable>
  );
};

const SharedChatScreen = ({
  route,
  navigation,
  recipient,
  currentUserRole,
  onBackPress,
  renderExtraContent,
  renderBottomNav,
}) => {
  const listRef = useRef(null);
  const { targetRef, animatedStyle } = useKeyboardLift({
    extraOffset: darkTheme.spacing.xxxl,
    anchor: 'bottom',
  });

  const {
    messagesByConversationId,
    fetchMessages,
    markConversationRead,
    connectChatSocket,
    disconnectChatSocket,
    sendSocketMessage,
    sendReadEvent,
    retryPendingMessage,
    addPendingSocketMessage,
    addMockTextMessage,
    sendTypingEvent,
    sendQuotation,
    respondQuotation,
    initiatePaymentForJob,
    wsStatus,
    setChatActive,
  } = useChat();

  const conversationId = useMemo(
    () => resolveConversationId(route?.params),
    [route?.params],
  );
  const hasRealConversation = conversationId !== 'local-preview';
  const messages = useMemo(
    () => messagesByConversationId[conversationId] || [],
    [conversationId, messagesByConversationId],
  );
  const isMechanic =
    currentUserRole === ROLES.MECH || route?.params?.userRole === 'mechanic';

  const [inputValue, setInputValue] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSettingPrice, setIsSettingPrice] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [quotationDecisions, setQuotationDecisions] = useState({});
  const [busyQuotationId, setBusyQuotationId] = useState('');
  const [acceptingQuotationId, setAcceptingQuotationId] = useState('');
  const typingLastSentAtRef = useRef(0);
  const conversationUnavailableNotifiedRef = useRef(false);
  const onBackPressRef = useRef(onBackPress);

  useEffect(() => {
    onBackPressRef.current = onBackPress;
  }, [onBackPress]);

  const handleConversationUnavailable = useCallback(() => {
    if (conversationUnavailableNotifiedRef.current) {
      return;
    }
    conversationUnavailableNotifiedRef.current = true;
    disconnectChatSocket('conversation-ended');
    AppAlert.alert('Chat unavailable', 'This conversation has ended for this job.', [
      {
        text: 'OK',
        onPress: () => {
          if (onBackPressRef.current) {
            onBackPressRef.current();
            return;
          }
          if (navigation?.canGoBack?.()) {
            navigation.goBack();
          }
        },
      },
    ]);
  }, [disconnectChatSocket, navigation]);

  const syncReadState = useCallback(async () => {
    if (!hasRealConversation) {
      return;
    }

    await markConversationRead(conversationId);
    sendReadEvent(conversationId);
  }, [
    conversationId,
    hasRealConversation,
    markConversationRead,
    sendReadEvent,
  ]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!hasRealConversation) {
        return;
      }

      const response = await fetchMessages(conversationId, { limit: 50, offset: 0 });
      if (response?.__ended) {
        if (mounted) {
          handleConversationUnavailable();
        }
        return;
      }
      if (!response) {
        return;
      }

      if (mounted) {
        await syncReadState();
        connectChatSocket(conversationId);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      disconnectChatSocket('screen-unmount');
    };
  }, [
    connectChatSocket,
    conversationId,
    disconnectChatSocket,
    fetchMessages,
    handleConversationUnavailable,
    hasRealConversation,
    syncReadState,
  ]);

  useEffect(() => {
    if (!hasRealConversation) {
      return undefined;
    }

    const sub = AppState.addEventListener('change', async nextState => {
      if (nextState === 'active') {
        const response = await fetchMessages(conversationId, { limit: 50, offset: 0 });
        if (response?.__ended) {
          handleConversationUnavailable();
          return;
        }
        if (!response) {
          return;
        }
        await syncReadState();
        connectChatSocket(conversationId);
      }
    });

    return () => sub.remove();
  }, [
    connectChatSocket,
    conversationId,
    fetchMessages,
    handleConversationUnavailable,
    hasRealConversation,
    syncReadState,
  ]);

  useFocusEffect(
    useCallback(() => {
      setChatActive(true);
      return () => setChatActive(false);
    }, [setChatActive]),
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    });
  }, [messages]);

  useEffect(() => {
    setQuotationDecisions((prev) => {
      const next = { ...prev };
      let changed = false;
      messages.forEach((message) => {
        if (!isPriceQuoteMessage(message)) {
          return;
        }
        const key = getQuotationKey(message);
        const decision = normalizeQuotationDecision(
          message?.quotation_status || message?.status || message?.action
        );
        if (!key || !decision || next[key] === decision) {
          return;
        }
        next[key] = decision;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [messages]);

  const handleSend = () => {
    if (isSettingPrice) {
      if (!inputValue.trim()) {
        return;
      }
      setShowPriceConfirm(true);
      return;
    }

    const text = inputValue.trim();
    if (!text) {
      return;
    }

    if (hasRealConversation && wsStatus === 'connected') {
      const sent = sendSocketMessage(conversationId, text);
      if (!sent) {
        addPendingSocketMessage(conversationId, text);
      }
    } else if (hasRealConversation) {
      addPendingSocketMessage(conversationId, text);
    } else {
      addMockTextMessage(conversationId, text);
    }

    setInputValue('');
    setHasInteracted(true);
  };

  const handleConfirmPrice = async confirmed => {
    if (!confirmed) {
      setShowPriceConfirm(false);
      return;
    }

    const amount = Number(String(inputValue || '').replace(/\D/g, '')) || 0;
    if (!amount) {
      setShowPriceConfirm(false);
      return;
    }

    const response = await sendQuotation(conversationId, {
      amount,
      job_id: route?.params?.jobId,
    });

    if (!response) {
      AppAlert.alert('Error', 'Could not send quotation.');
      setShowPriceConfirm(false);
      return;
    }

    setShowPriceConfirm(false);
    setInputValue('');
    setIsSettingPrice(false);
  };

  const handleAcceptPrice = async message => {
    const quotationKey = getQuotationKey(message);
    if ((quotationKey && quotationDecisions[quotationKey]) || (quotationKey && acceptingQuotationId === quotationKey)) {
      return;
    }

    const quotationId = String(
      message?.quotation_id || message?.id || message?._id || '',
    ).trim();
    const jobId = String(route?.params?.jobId || '').trim();
    if (!quotationId) {
      AppAlert.alert('Unable to continue', 'Quotation reference is missing.');
      return;
    }
    if (!jobId) {
      AppAlert.alert('Unable to continue', 'Job reference is missing.');
      return;
    }
    const quoteAmount = Number(message?.amount || 0);
    if (!Number.isFinite(quoteAmount) || quoteAmount <= 0) {
      AppAlert.alert('Unable to continue', 'Quotation amount is invalid.');
      return;
    }

    if (quotationKey) {
      setAcceptingQuotationId(quotationKey);
    }

    try {
      const wallet = await getWalletBalance();
      const availableBalance = readWalletAmount(wallet);
      if (availableBalance < quoteAmount) {
        AppAlert.alert(
          'Insufficient wallet balance',
          `You need ₦${quoteAmount.toLocaleString('en-NG')} but have ₦${availableBalance.toLocaleString('en-NG')}. Please fund your wallet and retry.`,
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Fund wallet',
              onPress: () =>
                navigation.navigate(ROUTES.CAR_OWNER_FUND_WALLET, {
                  source: 'chat_quote_accept',
                  quotationId,
                  conversationId,
                  jobId,
                }),
            },
          ],
        );
        return;
      }

      const quotationResponse = await respondQuotation(conversationId, {
        quotation_id: quotationId,
        action: 'accept',
      });
      if (!quotationResponse) {
        AppAlert.alert('Error', 'Could not accept quotation.');
        return;
      }

      const walletPaymentResponse = await initiatePaymentForJob(jobId, 'wallet');
      const paymentPayload = walletPaymentResponse?.data || walletPaymentResponse || {};
      const paymentCode = String(paymentPayload?.code || '').trim().toUpperCase();
      if (paymentCode === 'INSUFFICIENT_BALANCE') {
        const required = Number(paymentPayload?.required || quoteAmount);
        const available = Number(paymentPayload?.available || availableBalance);
        AppAlert.alert(
          'Insufficient wallet balance',
          `You need ₦${required.toLocaleString('en-NG')} but have ₦${available.toLocaleString('en-NG')}. Please fund your wallet and retry.`,
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Fund wallet',
              onPress: () =>
                navigation.navigate(ROUTES.CAR_OWNER_FUND_WALLET, {
                  source: 'chat_quote_accept_wallet_initiate',
                  quotationId,
                  conversationId,
                  jobId,
                }),
            },
          ],
        );
        return;
      }
      if (!walletPaymentResponse) {
        AppAlert.alert('Error', 'Could not secure payment in escrow.');
        return;
      }

      if (quotationKey) {
        setQuotationDecisions((prev) => ({ ...prev, [quotationKey]: 'accepted' }));
      }
      AppAlert.alert('Success', 'Quotation accepted and payment secured in escrow.');
    } catch (acceptError) {
      AppAlert.alert('Error', acceptError?.message || 'Could not process quotation acceptance.');
    } finally {
      if (quotationKey) {
        setAcceptingQuotationId('');
      }
    }
  };

  const handleDeclinePrice = async message => {
    const quotationKey = getQuotationKey(message);
    if (quotationKey && quotationDecisions[quotationKey]) {
      return;
    }

    const quotationId = String(
      message?.quotation_id || message?.id || message?._id || '',
    ).trim();
    if (!quotationId) {
      AppAlert.alert('Unable to continue', 'Quotation reference is missing.');
      return;
    }

    if (quotationKey) {
      setQuotationDecisions((prev) => ({ ...prev, [quotationKey]: 'declined' }));
      setBusyQuotationId(quotationKey);
    }

    const response = await respondQuotation(conversationId, {
      quotation_id: quotationId,
      action: 'reject',
    });
    if (!response && quotationKey) {
      setQuotationDecisions((prev) => {
        const next = { ...prev };
        delete next[quotationKey];
        return next;
      });
      setBusyQuotationId('');
      AppAlert.alert('Error', 'Could not decline quotation.');
      return;
    }

    setBusyQuotationId('');

  };

  const isSendEnabled = inputValue.trim().length > 0;
  const handleBack = useCallback(
    () => (onBackPressRef.current ? onBackPressRef.current() : navigation.goBack()),
    [navigation],
  );

  return (
    <ScreenContainer
      padded={false}
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <Animated.View ref={targetRef} style={[styles.chatArea, animatedStyle]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleBack}
            activeOpacity={0.85}
          >
            <BackIcon color={darkTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.userBlock}>
            <View style={styles.avatar}>
              {recipient?.avatarUri ? (
                <Image
                  source={{ uri: recipient.avatarUri }}
                  style={styles.avatarImage}
                />
              ) : (
                <AppText style={styles.avatarText}>
                  {recipient?.initials || 'U'}
                </AppText>
              )}
            </View>
            <View style={styles.nameWrap}>
              <AppText style={styles.name}>{recipient?.name || 'User'}</AppText>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <AppText style={styles.statusOnline}>Online</AppText>
                {recipient?.metaText ? (
                  <AppText style={styles.statusMeta}>
                    {recipient.metaText}
                  </AppText>
                ) : null}
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
            <CallIcon color={darkTheme.colors.muted} />
          </TouchableOpacity>
        </View>

        {hasRealConversation ? (
          <View style={styles.socketStatusWrap}>
            <View
              style={[
                styles.socketDot,
                wsStatus === 'connected'
                  ? styles.socketDotConnected
                  : wsStatus === 'connecting'
                  ? styles.socketDotConnecting
                  : styles.socketDotDisconnected,
              ]}
            />
            <AppText style={styles.socketStatusText}>
              {wsStatus === 'connected'
                ? 'Connected'
                : wsStatus === 'connecting'
                ? 'Connecting...'
                : wsStatus === 'error'
                ? 'Connection error'
                : 'Disconnected'}
            </AppText>
          </View>
        ) : null}

        {isMechanic ? (
          <TouchableOpacity
            style={[
              styles.setPricePill,
              isSettingPrice ? styles.setPricePillActive : null,
            ]}
            activeOpacity={0.88}
            onPress={() => setIsSettingPrice(prev => !prev)}
          >
            <AppText style={styles.setPricePillText}>
              {isSettingPrice ? 'Cancel' : 'Set price'}
            </AppText>
          </TouchableOpacity>
        ) : null}

        {renderExtraContent ? renderExtraContent(hasInteracted) : null}

        {messages.length ? (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) =>
              String(item?.id || `${conversationId}_${index}`)
            }
            renderItem={({ item }) => (
              <MessageBubble
                item={item}
                currentUserRole={currentUserRole}
                onAcceptPrice={() => handleAcceptPrice(item)}
                onDeclinePrice={() => handleDeclinePrice(item)}
                quotationDecision={
                  quotationDecisions[getQuotationKey(item)] ||
                  normalizeQuotationDecision(item?.quotation_status)
                }
                quotationBusy={
                  busyQuotationId === getQuotationKey(item) ||
                  acceptingQuotationId === getQuotationKey(item)
                }
                onRetryPending={() =>
                  retryPendingMessage(conversationId, item?.id)
                }
              />
            )}
            ListHeaderComponent={
              <AppText style={styles.todayLabel}>Today</AppText>
            }
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onMomentumScrollEnd={() => {
              if (hasRealConversation) {
                syncReadState();
              }
            }}
          />
        ) : (
          <View style={styles.emptyStateWrap}>
            <HugeiconsIcon
              icon={BubbleChatIcon}
              size={42}
              color={darkTheme.colors.muted}
              strokeWidth={1.8}
            />
            <AppText variant="muted" style={styles.emptyStateText}>
              No message.
            </AppText>
          </View>
        )}

        {isSettingPrice ? (
          <View style={styles.priceBanner}>
            <AppText style={styles.priceBannerText}>Setting price</AppText>
          </View>
        ) : null}

        <View style={styles.composerWrap}>
          <TextInput
            value={inputValue}
            onChangeText={value => {
              if (isSettingPrice) {
                setInputValue(String(value || '').replace(/\D/g, ''));
                return;
              }

              const now = Date.now();
              if (
                hasRealConversation &&
                String(value || '').trim().length > 0 &&
                now - typingLastSentAtRef.current >= 1000
              ) {
                sendTypingEvent(conversationId);
                typingLastSentAtRef.current = now;
              }
              setInputValue(value);
            }}
            placeholder={isSettingPrice ? 'Enter amount (NGN)' : 'Message'}
            placeholderTextColor={darkTheme.colors.muted}
            keyboardType={isSettingPrice ? 'number-pad' : 'default'}
            style={[styles.input, isSettingPrice ? styles.inputPrice : null]}
          />
          <Pressable
            style={[
              styles.sendButton,
              isSendEnabled
                ? styles.sendButtonActive
                : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={
              !isSendEnabled ||
              (wsStatus === 'connecting' && hasRealConversation)
            }
          >
            <HugeiconsIcon
              icon={SentIcon}
              size={22}
              color={
                isSendEnabled ? darkTheme.colors.accent : darkTheme.colors.muted
              }
              strokeWidth={1.9}
            />
          </Pressable>
        </View>
        {/* {renderBottomNav ? renderBottomNav() : null} */}
      </Animated.View>

      <Modal
        visible={showPriceConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriceConfirm(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>
              Set {inputValue || 0} price
            </AppText>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                activeOpacity={0.85}
                onPress={() => handleConfirmPrice(false)}
              >
                <AppText style={styles.modalBtnSecondaryText}>No</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnPrimary}
                activeOpacity={0.85}
                onPress={() => handleConfirmPrice(true)}
              >
                <AppText style={styles.modalBtnPrimaryText}>Yes</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.colors.background },
  chatArea: { flex: 1 },
  header: {
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: darkTheme.spacing.xs,
    paddingBottom: darkTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: darkTheme.spacing.xs,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF7B4A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xs,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  nameWrap: { flex: 1 },
  name: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.xs,
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00D64F',
  },
  statusOnline: {
    color: '#00D64F',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  statusMeta: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  socketStatusWrap: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginBottom: darkTheme.spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  socketDot: { width: 6, height: 6, borderRadius: 3 },
  socketDotConnected: { backgroundColor: '#00D64F' },
  socketDotConnecting: { backgroundColor: darkTheme.colors.accent },
  socketDotDisconnected: { backgroundColor: '#FF7F7F' },
  socketStatusText: {
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  todayLabel: {
    textAlign: 'center',
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.md,
    marginVertical: darkTheme.spacing.sm,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: darkTheme.spacing.md,
    paddingBottom: darkTheme.spacing.sm,
  },
  emptyStateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: darkTheme.spacing.xs,
    paddingHorizontal: darkTheme.spacing.lg,
  },
  emptyStateText: { color: darkTheme.colors.muted, textAlign: 'center' },
  setPricePill: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.xs,
    borderRadius: 999,
    marginBottom: darkTheme.spacing.sm,
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.08),
  },
  setPricePillActive: {
    backgroundColor: 'rgba(255,90,0,0.15)',
    borderColor: '#FF8A3D',
  },
  setPricePillText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  messageRow: { marginBottom: darkTheme.spacing.sm, maxWidth: '88%' },
  messageRowOther: { alignSelf: 'flex-start' },
  messageRowMe: { alignSelf: 'flex-end' },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
  },
  otherBubble: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 6 },
  meBubble: {
    backgroundColor: darkTheme.colors.accent,
    borderBottomRightRadius: 6,
  },
  messageText: { fontSize: darkTheme.typography.fontSizes.sm, lineHeight: 20 },
  messageImage: {
    width: 190,
    height: 170,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  otherMessageText: { color: '#303030' },
  meMessageText: { color: '#1A1A1A' },
  timestamp: {
    marginTop: 4,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  systemWrap: {
    alignSelf: 'center',
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.13),
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.xs,
    marginVertical: darkTheme.spacing.xs,
  },
  systemText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  priceQuoteWrap: {
    alignSelf: 'center',
    width: '82%',
    marginBottom: darkTheme.spacing.sm,
  },
  priceQuoteBubble: {
    borderRadius: 18,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.md,
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.16),
    borderWidth: 1,
    borderColor: hexToRgba(darkTheme.colors.accent, 0.45),
    alignItems: 'center',
  },
  priceQuoteTitle: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  priceQuoteAmount: {
    color: darkTheme.colors.accent,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  priceQuoteSub: { color: darkTheme.colors.muted, fontSize: 11, marginTop: 6 },
  priceQuoteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: darkTheme.spacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  priceQuoteBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.accent,
  },
  priceQuoteBtnText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  priceQuoteBtnAlt: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  priceQuoteBtnAltText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  priceQuoteBtnDisabled: {
    opacity: 0.55,
  },
  quoteResolvedWrap: {
    marginTop: darkTheme.spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  quoteResolvedText: {
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  quoteResolvedAccepted: {
    color: '#5EDC92',
  },
  quoteResolvedDeclined: {
    color: '#FF8B8B',
  },
  priceBanner: {
    marginHorizontal: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: hexToRgba(darkTheme.colors.accent, 0.5),
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: hexToRgba(darkTheme.colors.accent, 0.12),
  },
  priceBannerText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  composerWrap: {
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 23,
    paddingHorizontal: darkTheme.spacing.md,
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  inputPrice: {
    borderColor: 'rgba(255,138,61,0.75)',
    backgroundColor: 'rgba(255,138,61,0.12)',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'transparent',
  },
  sendButtonInactive: {
    borderColor: darkTheme.colors.muted,
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: darkTheme.spacing.lg,
    backgroundColor: '#11113A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modalTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  modalActions: { flexDirection: 'row', columnGap: darkTheme.spacing.sm },
  modalBtnPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: {
    color: '#1A1A1A',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  modalBtnSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  paymentMethodList: {
    rowGap: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
  },
  paymentMethodBtn: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodText: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default SharedChatScreen;



