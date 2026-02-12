import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { SentIcon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES, useKeyboardLift } from '../../../utils';

const BackIcon = ({ color }) => {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const CallIcon = ({ color }) => {
  return (
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
};

const formatTime = (date = new Date()) => {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const createSeedMessages = () => {
  const entries = [
    { sender: 'mechanic', text: "Hi, I've received your location and i'm on my way, i will be there in 15 minutes." },
    { sender: 'user', text: "Great, thank you, i'm right beside that church sign post." },
    { sender: 'mechanic', text: 'Got it, i will be right there.' },
    { sender: 'mechanic', text: 'Please keep your phone line open.' },
    { sender: 'user', text: 'Sure, i will.' },
    { sender: 'mechanic', text: 'Have you turned off the engine?' },
    { sender: 'user', text: 'Yes, engine is off now.' },
    { sender: 'mechanic', text: 'Perfect. I am 1.2km away now.' },
    { sender: 'user', text: 'Okay noted.' },
    { sender: 'mechanic', text: 'Any dashboard warning light?' },
    { sender: 'user', text: 'Battery and brake light showed up.' },
    { sender: 'mechanic', text: 'That helps, thanks.' },
    { sender: 'user', text: 'Will diagnostics happen onsite?' },
    { sender: 'mechanic', text: 'Yes, quick scan onsite first.' },
    { sender: 'user', text: 'How long should that take?' },
    { sender: 'mechanic', text: 'About 20 minutes.' },
    { sender: 'user', text: 'Alright, waiting here.' },
    { sender: 'mechanic', text: 'I can see the junction now.' },
    { sender: 'user', text: 'I am wearing a blue shirt.' },
    { sender: 'mechanic', text: 'Seen you. Parking now.' },
    { sender: 'user', text: 'Perfect.' },
    { sender: 'mechanic', text: 'Coming over in 1 minute.' },
    { sender: 'user', text: 'Thanks.' },
  ];

  const base = new Date();
  return entries.map((entry, index) => {
    const at = new Date(base.getTime() - (entries.length - index) * 60 * 1000);
    return {
      id: `seed_${index + 1}`,
      sender: entry.sender,
      text: entry.text,
      timestamp: formatTime(at),
      type: 'message',
    };
  });
};

const MessageBubble = ({ item }) => {
  if (item.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <AppText style={styles.systemText}>{item.text}</AppText>
      </View>
    );
  }

  const isUser = item.sender === 'user';
  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowMechanic]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.mechanicBubble]}>
        <AppText style={[styles.messageText, isUser ? styles.userMessageText : styles.mechanicMessageText]}>
          {item.text}
        </AppText>
      </View>
      <AppText style={styles.timestamp}>{item.timestamp}</AppText>
    </View>
  );
};

const ChatScreen = ({ navigation, route }) => {
  const seededMessages = useMemo(() => createSeedMessages(), []);
  const listRef = useRef(null);
  const acceptanceTimerRef = useRef(null);
  const { targetRef, animatedStyle } = useKeyboardLift({
    extraOffset: darkTheme.spacing.xxxl,
    anchor: 'bottom',
  });

  const mechanic = route?.params?.mechanic || {
    name: 'Samuel Olamilekan',
    initials: 'SO',
    distanceKm: 1.2,
  };
  const jobId = route?.params?.jobId || `job_${Date.now()}`;

  const [messages, setMessages] = useState(seededMessages);
  const [inputValue, setInputValue] = useState('');
  const [accepted, setAccepted] = useState(false);
  const isSendEnabled = inputValue.trim().length > 0;

  const appendMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const appendAcceptanceMessage = () => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.type === 'system' && m.text === 'Mechanic accepted your request');
      if (exists) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          type: 'system',
          text: 'Mechanic accepted your request',
        },
      ];
    });
  };

  const acceptMechanic = () => {
    setAccepted((prev) => {
      if (!prev) {
        appendAcceptanceMessage();
      }
      return true;
    });
  };

  useEffect(() => {
    acceptanceTimerRef.current = setTimeout(() => {
      acceptMechanic();
    }, 2000);

    return () => {
      if (acceptanceTimerRef.current) {
        clearTimeout(acceptanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) {
      return;
    }

    appendMessage({
      id: `user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: formatTime(),
      type: 'message',
    });
    setInputValue('');

    acceptMechanic();
    if (acceptanceTimerRef.current) {
      clearTimeout(acceptanceTimerRef.current);
    }

    setTimeout(() => {
      appendMessage({
        id: `mech_${Date.now()}`,
        sender: 'mechanic',
        text: 'Received. I am on it.',
        timestamp: formatTime(),
        type: 'message',
      });
    }, 1000);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <Animated.View ref={targetRef} style={[styles.chatArea, animatedStyle]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <BackIcon color={darkTheme.colors.text} />
          </TouchableOpacity>

          <View style={styles.userBlock}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{mechanic.initials || 'M'}</AppText>
            </View>
            <View style={styles.nameWrap}>
              <AppText style={styles.name}>{mechanic.name}</AppText>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <AppText style={styles.statusOnline}>Online</AppText>
                <AppText style={styles.statusMeta}>{mechanic.distanceKm || 1.2}km away</AppText>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
            <CallIcon color={darkTheme.colors.muted} />
          </TouchableOpacity>
        </View>

        {accepted ? (
          <TouchableOpacity
            style={styles.trackingCta}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(ROUTES.CAR_OWNER_LIVE_TRACKING, { mechanic, jobId })}
          >
            <AppText style={styles.trackingText}>View tracking</AppText>
          </TouchableOpacity>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble item={item} />}
          ListHeaderComponent={<AppText style={styles.todayLabel}>Today</AppText>}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.composerWrap}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Message"
            placeholderTextColor={darkTheme.colors.muted}
            style={styles.input}
          />
          <Pressable
            style={[
              styles.sendButton,
              isSendEnabled ? styles.sendButtonActive : styles.sendButtonInactive,
            ]}
            onPress={handleSend}
            disabled={!isSendEnabled}
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

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_SETTINGS} onTabPress={(routeName) => navigation.navigate(routeName)} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  chatArea: {
    flex: 1,
  },
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
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xs,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  nameWrap: {
    flex: 1,
  },
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
  trackingCta: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    borderRadius: darkTheme.radius.md,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.xs,
  },
  trackingText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  todayLabel: {
    textAlign: 'center',
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.md,
    marginVertical: darkTheme.spacing.sm,
  },
  messagesContent: {
    paddingHorizontal: darkTheme.spacing.md,
    paddingBottom: darkTheme.spacing.sm,
  },
  messageRow: {
    marginBottom: darkTheme.spacing.sm,
    maxWidth: '88%',
  },
  messageRowMechanic: {
    alignSelf: 'flex-start',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
  },
  mechanicBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 6,
  },
  userBubble: {
    backgroundColor: darkTheme.colors.accent,
    borderBottomRightRadius: 6,
  },
  messageText: {
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 20,
  },
  mechanicMessageText: {
    color: '#303030',
  },
  userMessageText: {
    color: '#1A1A1A',
  },
  timestamp: {
    marginTop: 4,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  systemWrap: {
    alignSelf: 'center',
    backgroundColor: 'rgba(226,255,49,0.13)',
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
  composerWrap: {
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.xs,
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
});

export default ChatScreen;
