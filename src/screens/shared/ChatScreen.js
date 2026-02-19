import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { BubbleChatIcon, PlusSignIcon, SentIcon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../components';
import { useChat } from '../../context/ChatContext';
import { darkTheme } from '../../theme';
import { pickSingleImageFromGallery, ROLES, ROUTES, useKeyboardLift } from '../../utils';

const BackIcon = ({ color }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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

const formatTime = (dateValue) => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const resolveConversationId = (routeParams) => {
  const fromParam = String(routeParams?.conversationId || '').trim();
  if (fromParam) {
    return fromParam;
  }

  const conversation = routeParams?.conversation;
  return String(
    conversation?.id || conversation?._id || conversation?.conversation_id || conversation?.conversationId || ''
  ).trim() || 'local-preview';
};

const isSenderMe = (item, currentUserRole) => {
  const sender = String(item?.sender || item?.sender_type || item?.role || '').toLowerCase();
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

const getMessageText = (item) => {
  if (item?.type === 'image') {
    if (item?.status === 'uploading') {
      return 'Uploading image...';
    }
    if (item?.status === 'upload-failed') {
      return 'Image upload failed';
    }
    return 'Image sent';
  }

  const baseText = item?.text || item?.message || '';
  return item?.status === 'pending' ? `${baseText} (pending)` : baseText;
};

const MessageBubble = ({ item, currentUserRole, onAcceptPrice, onDeclinePrice, onRetryPending }) => {
  if (item?.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <AppText style={styles.systemText}>{item.text}</AppText>
      </View>
    );
  }

  if (item?.type === 'price_quote') {
    const amountText = `₦${Number(item?.amount || 0).toLocaleString()}`;
    const isMechanicView = currentUserRole === ROLES.MECH;
    return (
      <View style={styles.priceQuoteWrap}>
        <View style={styles.priceQuoteBubble}>
          <AppText style={styles.priceQuoteTitle}>{isMechanicView ? 'Set price at' : 'Price quote'}</AppText>
          <AppText style={styles.priceQuoteAmount}>{amountText} NGN</AppText>
          <AppText style={styles.priceQuoteSub}>Price includes labour only</AppText>
        </View>
        {currentUserRole === ROLES.CAR_OWNER ? (
          <View style={styles.priceQuoteActions}>
            <TouchableOpacity style={styles.priceQuoteBtn} activeOpacity={0.85} onPress={onAcceptPrice}>
              <AppText style={styles.priceQuoteBtnText}>Accept</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.priceQuoteBtnAlt} activeOpacity={0.85} onPress={onDeclinePrice}>
              <AppText style={styles.priceQuoteBtnAltText}>Decline</AppText>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  const isMe = isSenderMe(item, currentUserRole);
  const isPendingMine = isMe && item?.status === 'pending';

  return (
    <Pressable
      style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}
      onPress={() => {
        if (isPendingMine) {
          onRetryPending?.(item);
        }
      }}
    >
      <View style={[styles.bubble, isMe ? styles.meBubble : styles.otherBubble]}>
        <AppText style={[styles.messageText, isMe ? styles.meMessageText : styles.otherMessageText]}>
          {getMessageText(item)}
        </AppText>
      </View>
      <AppText style={styles.timestamp}>{item?.timestamp || formatTime(item?.created_at)}</AppText>
    </Pressable>
  );
};

const SharedChatScreen = ({ route, navigation, recipient, currentUserRole, onBackPress, renderExtraContent }) => {
  const listRef = useRef(null);
  const { targetRef, animatedStyle } = useKeyboardLift({
    extraOffset: darkTheme.spacing.xxxl,
    anchor: 'bottom',
  });

  const {
    messagesByConversationId,
    fetchMessages,
    markConversationRead,
    openConversation,
    connectChatSocket,
    disconnectChatSocket,
    sendSocketMessage,
    retryPendingMessage,
    addPendingSocketMessage,
    addMockTextMessage,
    addLocalMessage,
    sendQuotation,
    respondQuotation,
    initiatePaymentForJob,
    uploadImages,
    uploadingImages,
    wsStatus,
  } = useChat();

  const conversationId = useMemo(() => resolveConversationId(route?.params), [route?.params]);
  const hasRealConversation = conversationId !== 'local-preview';
  const messages = useMemo(() => messagesByConversationId[conversationId] || [], [conversationId, messagesByConversationId]);
  const isMechanic = currentUserRole === ROLES.MECH || route?.params?.userRole === 'mechanic';

  const [inputValue, setInputValue] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isSettingPrice, setIsSettingPrice] = useState(false);
  const [showPriceConfirm, setShowPriceConfirm] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [selectedQuoteMessage, setSelectedQuoteMessage] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      if (!hasRealConversation) {
        return;
      }

      if (route?.params?.conversation) {
        await openConversation(route.params.conversation);
      } else {
        await fetchMessages(conversationId, { limit: 50, offset: 0 });
      }

      if (mounted) {
        await markConversationRead(conversationId);
        connectChatSocket(conversationId);
      }
    };

    bootstrap();

    return () => {
      mounted = false;
      disconnectChatSocket();
    };
  }, [
    connectChatSocket,
    conversationId,
    disconnectChatSocket,
    fetchMessages,
    hasRealConversation,
    markConversationRead,
    openConversation,
    route?.params?.conversation,
  ]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
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

  const handleConfirmPrice = async (confirmed) => {
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
      Alert.alert('Error', 'Could not send quotation.');
      setShowPriceConfirm(false);
      return;
    }

    const quotationPayload = response?.data?.quotation || response?.data || null;
    const normalizedId =
      quotationPayload?.id || quotationPayload?._id || quotationPayload?.quotation_id || `local-quote-${Date.now()}`;

    addLocalMessage(conversationId, {
      id: normalizedId,
      type: 'price_quote',
      amount: Number(quotationPayload?.amount || amount),
      quotation_id: normalizedId,
      text: `Set price at ${amount} NGN`,
      sender: 'me',
    });

    setShowPriceConfirm(false);
    setInputValue('');
    setIsSettingPrice(false);
  };

  const handleAttach = async () => {
    if (!hasRealConversation) {
      Alert.alert('Unavailable', 'Open a real conversation before uploading images.');
      return;
    }

    try {
      const { asset, cancelled, error } = await pickSingleImageFromGallery();
      if (cancelled) {
        return;
      }
      if (error) {
        Alert.alert('Upload failed', error);
        return;
      }
      if (asset?.uri) {
        await uploadImages(conversationId, [asset]);
        setHasInteracted(true);
      }
    } catch {
      Alert.alert('Upload failed', 'Could not attach image. Please try again.');
    }
  };

  const handleAcceptPrice = (message) => {
    setSelectedQuoteMessage(message);
    setShowPaymentMethodModal(true);
  };

  const handleConfirmPaymentMethod = async (paymentMethod) => {
    const message = selectedQuoteMessage;
    const quotationId = String(message?.quotation_id || message?.id || message?._id || '').trim();

    if (!quotationId) {
      Alert.alert('Unable to continue', 'Quotation reference is missing.');
      return;
    }

    setPaying(true);
    try {
      const quotationResponse = await respondQuotation(conversationId, {
        quotation_id: quotationId,
        action: 'accept',
      });

      if (!quotationResponse) {
        Alert.alert('Error', 'Could not accept quotation.');
        return;
      }

      const jobId = route?.params?.jobId;
      const paymentResponse = await initiatePaymentForJob(jobId, paymentMethod);

      if (!paymentResponse) {
        Alert.alert('Error', 'Payment could not be initiated.');
        return;
      }

      setShowPaymentMethodModal(false);
      setSelectedQuoteMessage(null);
      addLocalMessage(conversationId, {
        type: 'system',
        text: 'Price accepted',
      });
      navigation.navigate(ROUTES.CAR_OWNER_LIVE_TRACKING, {
        jobId: route?.params?.jobId,
        mechanicId: route?.params?.mechanicId,
        agreedPrice: message?.amount || null,
        mechanic: route?.params?.mechanic,
      });
    } finally {
      setPaying(false);
    }
  };

  const handleDeclinePrice = async (message) => {
    const quotationId = String(message?.quotation_id || message?.id || message?._id || '').trim();
    if (quotationId) {
      await respondQuotation(conversationId, {
        quotation_id: quotationId,
        action: 'reject',
      });
    }

    addLocalMessage(conversationId, {
      type: 'system',
      text: 'Price declined',
    });
  };

  const isSendEnabled = inputValue.trim().length > 0;
  const handleBack = () => (onBackPress ? onBackPress() : navigation.goBack());

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <Animated.View ref={targetRef} style={[styles.chatArea, animatedStyle]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBack} activeOpacity={0.85}>
            <BackIcon color={darkTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.userBlock}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{recipient?.initials || 'U'}</AppText>
            </View>
            <View style={styles.nameWrap}>
              <AppText style={styles.name}>{recipient?.name || 'User'}</AppText>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <AppText style={styles.statusOnline}>Online</AppText>
                {recipient?.metaText ? <AppText style={styles.statusMeta}>{recipient.metaText}</AppText> : null}
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
            style={[styles.setPricePill, isSettingPrice ? styles.setPricePillActive : null]}
            activeOpacity={0.88}
            onPress={() => setIsSettingPrice((prev) => !prev)}
          >
            <AppText style={styles.setPricePillText}>{isSettingPrice ? 'Cancel' : 'Set price'}</AppText>
          </TouchableOpacity>
        ) : null}

        {renderExtraContent ? renderExtraContent(hasInteracted) : null}

        {messages.length ? (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item, index) => String(item?.id || `${conversationId}_${index}`)}
            renderItem={({ item }) => (
              <MessageBubble
                item={item}
                currentUserRole={currentUserRole}
                onAcceptPrice={() => handleAcceptPrice(item)}
                onDeclinePrice={() => handleDeclinePrice(item)}
                onRetryPending={() => retryPendingMessage(conversationId, item?.id)}
              />
            )}
            ListHeaderComponent={<AppText style={styles.todayLabel}>Today</AppText>}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyStateWrap}>
            <HugeiconsIcon icon={BubbleChatIcon} size={42} color={darkTheme.colors.muted} strokeWidth={1.8} />
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
          <Pressable style={styles.attachButton} onPress={handleAttach}>
            {uploadingImages ? (
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            ) : (
              <HugeiconsIcon icon={PlusSignIcon} size={20} color={darkTheme.colors.accent} strokeWidth={2} />
            )}
          </Pressable>

          <TextInput
            value={inputValue}
            onChangeText={(value) => {
              if (isSettingPrice) {
                setInputValue(String(value || '').replace(/\D/g, ''));
                return;
              }
              setInputValue(value);
            }}
            placeholder={isSettingPrice ? 'Enter amount (NGN)' : 'Message'}
            placeholderTextColor={darkTheme.colors.muted}
            keyboardType={isSettingPrice ? 'number-pad' : 'default'}
            style={[styles.input, isSettingPrice ? styles.inputPrice : null]}
          />
          <Pressable
            style={[styles.sendButton, isSendEnabled ? styles.sendButtonActive : styles.sendButtonInactive]}
            onPress={handleSend}
            disabled={!isSendEnabled || (wsStatus === 'connecting' && hasRealConversation)}
          >
            <HugeiconsIcon
              icon={SentIcon}
              size={22}
              color={isSendEnabled ? darkTheme.colors.accent : darkTheme.colors.muted}
              strokeWidth={1.9}
            />
          </Pressable>
        </View>
      </Animated.View>

      <Modal visible={showPriceConfirm} transparent animationType="fade" onRequestClose={() => setShowPriceConfirm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>Set {inputValue || 0} price</AppText>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} activeOpacity={0.85} onPress={() => handleConfirmPrice(false)}>
                <AppText style={styles.modalBtnSecondaryText}>No</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} activeOpacity={0.85} onPress={() => handleConfirmPrice(true)}>
                <AppText style={styles.modalBtnPrimaryText}>Yes</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentMethodModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>Choose payment method</AppText>
            <View style={styles.paymentMethodList}>
              <TouchableOpacity style={styles.paymentMethodBtn} activeOpacity={0.85} onPress={() => handleConfirmPaymentMethod('wallet')} disabled={paying}>
                <AppText style={styles.paymentMethodText}>Wallet</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentMethodBtn} activeOpacity={0.85} onPress={() => handleConfirmPaymentMethod('paystack')} disabled={paying}>
                <AppText style={styles.paymentMethodText}>Paystack</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentMethodBtn} activeOpacity={0.85} onPress={() => handleConfirmPaymentMethod('cash')} disabled={paying}>
                <AppText style={styles.paymentMethodText}>Cash</AppText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.modalBtnSecondary}
              activeOpacity={0.85}
              onPress={() => {
                if (!paying) {
                  setShowPaymentMethodModal(false);
                  setSelectedQuoteMessage(null);
                }
              }}
              disabled={paying}
            >
              <AppText style={styles.modalBtnSecondaryText}>{paying ? 'Processing...' : 'Cancel'}</AppText>
            </TouchableOpacity>
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
  iconButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  userBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', columnGap: darkTheme.spacing.xs },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF7B4A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: darkTheme.colors.text, fontSize: darkTheme.typography.fontSizes.xs, fontWeight: darkTheme.typography.fontWeights.semibold },
  nameWrap: { flex: 1 },
  name: { color: darkTheme.colors.text, fontSize: darkTheme.typography.fontSizes.md, lineHeight: 20, fontWeight: darkTheme.typography.fontWeights.medium },
  statusRow: { flexDirection: 'row', alignItems: 'center', columnGap: darkTheme.spacing.xs, marginTop: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00D64F' },
  statusOnline: { color: '#00D64F', fontSize: darkTheme.typography.fontSizes.xs, lineHeight: 16 },
  statusMeta: { color: darkTheme.colors.muted, fontSize: darkTheme.typography.fontSizes.xs, lineHeight: 16 },
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
  socketDotConnecting: { backgroundColor: '#E2FF31' },
  socketDotDisconnected: { backgroundColor: '#FF7F7F' },
  socketStatusText: { color: darkTheme.colors.muted, fontSize: 11, lineHeight: 14 },
  todayLabel: { textAlign: 'center', color: darkTheme.colors.muted, fontSize: darkTheme.typography.fontSizes.md, marginVertical: darkTheme.spacing.sm },
  messagesContent: { flexGrow: 1, paddingHorizontal: darkTheme.spacing.md, paddingBottom: darkTheme.spacing.sm },
  emptyStateWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', rowGap: darkTheme.spacing.xs, paddingHorizontal: darkTheme.spacing.lg },
  emptyStateText: { color: darkTheme.colors.muted, textAlign: 'center' },
  setPricePill: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.xs,
    borderRadius: 999,
    marginBottom: darkTheme.spacing.sm,
    backgroundColor: 'rgba(226,255,49,0.08)',
  },
  setPricePillActive: { backgroundColor: 'rgba(255,90,0,0.15)', borderColor: '#FF8A3D' },
  setPricePillText: { color: darkTheme.colors.accent, fontSize: 12, fontWeight: darkTheme.typography.fontWeights.medium },
  messageRow: { marginBottom: darkTheme.spacing.sm, maxWidth: '88%' },
  messageRowOther: { alignSelf: 'flex-start' },
  messageRowMe: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 18, paddingHorizontal: darkTheme.spacing.md, paddingVertical: darkTheme.spacing.sm },
  otherBubble: { backgroundColor: '#F3F4F6', borderBottomLeftRadius: 6 },
  meBubble: { backgroundColor: darkTheme.colors.accent, borderBottomRightRadius: 6 },
  messageText: { fontSize: darkTheme.typography.fontSizes.sm, lineHeight: 20 },
  otherMessageText: { color: '#303030' },
  meMessageText: { color: '#1A1A1A' },
  timestamp: { marginTop: 4, color: darkTheme.colors.muted, fontSize: 12, lineHeight: 16 },
  systemWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(226,255,49,0.13)',
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.xs,
    marginVertical: darkTheme.spacing.xs,
  },
  systemText: { color: darkTheme.colors.accent, fontSize: darkTheme.typography.fontSizes.xs, lineHeight: 16 },
  priceQuoteWrap: { alignSelf: 'center', width: '82%', marginBottom: darkTheme.spacing.sm },
  priceQuoteBubble: {
    borderRadius: 18,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.md,
    backgroundColor: 'rgba(226,255,49,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(226,255,49,0.45)',
    alignItems: 'center',
  },
  priceQuoteTitle: { color: darkTheme.colors.muted, fontSize: 12, marginBottom: 4 },
  priceQuoteAmount: { color: darkTheme.colors.accent, fontSize: 18, fontWeight: darkTheme.typography.fontWeights.semibold },
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
  priceQuoteBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: darkTheme.colors.accent },
  priceQuoteBtnText: { color: '#1A1A1A', fontSize: 12, fontWeight: darkTheme.typography.fontWeights.semibold },
  priceQuoteBtnAlt: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  priceQuoteBtnAltText: { color: darkTheme.colors.text, fontSize: 12, fontWeight: darkTheme.typography.fontWeights.medium },
  priceBanner: {
    marginHorizontal: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,255,49,0.5)',
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(226,255,49,0.12)',
  },
  priceBannerText: { color: darkTheme.colors.accent, fontSize: 12, fontWeight: darkTheme.typography.fontWeights.medium },
  composerWrap: {
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
  inputPrice: { borderColor: 'rgba(255,138,61,0.75)', backgroundColor: 'rgba(255,138,61,0.12)' },
  sendButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sendButtonActive: { borderColor: darkTheme.colors.accent, backgroundColor: 'transparent' },
  sendButtonInactive: { borderColor: darkTheme.colors.muted, backgroundColor: 'transparent' },
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
  modalTitle: { color: darkTheme.colors.text, fontSize: 16, textAlign: 'center', marginBottom: darkTheme.spacing.md, fontWeight: darkTheme.typography.fontWeights.semibold },
  modalActions: { flexDirection: 'row', columnGap: darkTheme.spacing.sm },
  modalBtnPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnPrimaryText: { color: '#1A1A1A', fontWeight: darkTheme.typography.fontWeights.semibold },
  modalBtnSecondary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondaryText: { color: darkTheme.colors.text, fontWeight: darkTheme.typography.fontWeights.medium },
  paymentMethodList: { rowGap: darkTheme.spacing.xs, marginBottom: darkTheme.spacing.sm },
  paymentMethodBtn: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentMethodText: { color: darkTheme.colors.text, fontSize: 14, fontWeight: darkTheme.typography.fontWeights.medium },
});

export default SharedChatScreen;
