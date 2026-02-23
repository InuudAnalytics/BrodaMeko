import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Alert01Icon,
  ArrowLeft01Icon,
  Briefcase01Icon,
  Settings01Icon,
  Shield01Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import { useAuth, useChat } from '../../context';
import { darkTheme, withAlpha } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const TABS = [
  { key: 'all', label: 'All notifications' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'payments', label: 'Payments' },
  { key: 'system', label: 'System' },
];

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'jobs',
    title: 'New job nearby',
    message: 'A car owner requested help with a flat tire 1.2km away.',
    time: '2m ago',
    read: false,
  },
  {
    id: 'n2',
    type: 'payments',
    title: 'Escrow released',
    message: 'Payment for Job #1208 has been credited to your wallet.',
    time: '18m ago',
    read: false,
  },
  {
    id: 'n3',
    type: 'system',
    title: 'Profile reminder',
    message: 'Complete your setup checklist to increase job visibility.',
    time: '1h ago',
    read: true,
  },
  {
    id: 'n4',
    type: 'dispute',
    title: 'Dispute update',
    message: 'A support agent responded to your recent dispute ticket.',
    time: '3h ago',
    read: false,
  },
  {
    id: 'n5',
    type: 'jobs',
    title: 'Job accepted',
    message: 'Mechanic Samuel Hassan accepted your diagnostics request.',
    time: '6h ago',
    read: true,
  },
];

const TYPE_UI = {
  jobs: {
    icon: Briefcase01Icon,
    bg: withAlpha(darkTheme.colors.accent, 0.18),
    color: darkTheme.colors.accent,
  },
  payments: {
    icon: Wallet01Icon,
    bg: 'rgba(87,210,255,0.16)',
    color: '#57D2FF',
  },
  system: {
    icon: Settings01Icon,
    bg: 'rgba(255,255,255,0.12)',
    color: '#D4D7E6',
  },
  dispute: {
    icon: Shield01Icon,
    bg: 'rgba(255,118,118,0.14)',
    color: '#FF7676',
  },
};

const NotificationsScreen = ({ navigation }) => {
  const { role } = useAuth();
  const { conversations, fetchConversations } = useChat();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  const conversationNotifications = useMemo(() => {
    if (role !== ROLES.MECH) {
      return [];
    }

    return (Array.isArray(conversations) ? conversations : [])
      .filter((item) => Number(item?.unread_count || item?.unreadCount || 0) > 0)
      .slice(0, 5)
      .map((item) => {
        const conversationId = String(
          item?.id || item?._id || item?.conversation_id || item?.conversationId || ''
        ).trim();
        const customerName =
          item?.user?.name ||
          item?.other_user?.name ||
          item?.car_owner?.name ||
          item?.participant_name ||
          'Car owner';
        const latestText =
          item?.last_message?.text ||
          item?.lastMessage?.text ||
          item?.last_message ||
          'New hire request';

        return {
          id: `conv-${conversationId}`,
          type: 'jobs',
          title: 'New hire request',
          message: `${customerName}: ${latestText}`,
          time: 'now',
          read: false,
          conversation: item,
          conversationId,
          kind: 'chat_request',
        };
      });
  }, [conversations, role]);

  const allNotifications = useMemo(
    () => [...conversationNotifications, ...notifications],
    [conversationNotifications, notifications]
  );

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return allNotifications;
    }
    return allNotifications.filter((item) => item.type === activeTab);
  }, [activeTab, allNotifications]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handlePressNotification = (item) => {
    if (item?.kind === 'chat_request' && item?.conversationId) {
      navigation.navigate(ROUTES.MECH_CHAT, {
        conversationId: item.conversationId,
        conversation: item.conversation,
        jobId: item?.conversation?.job_id || item?.conversation?.jobId || '',
      });
      return;
    }

    markAsRead(item.id);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Notifications</AppText>
        </View>

        <View style={styles.tabsWrap}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
              >
                <AppText style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filteredNotifications.map((item) => {
            const ui = TYPE_UI[item.type] || {
              icon: Alert01Icon,
              bg: 'rgba(255,255,255,0.12)',
              color: darkTheme.colors.text,
            };

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.88}
                style={styles.card}
                onPress={() => handlePressNotification(item)}
              >
                <View style={[styles.iconWrap, { backgroundColor: ui.bg }]}>
                  <HugeiconsIcon icon={ui.icon} size={18} color={ui.color} strokeWidth={2} />
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <AppText style={styles.title}>{item.title}</AppText>
                    {!item.read ? <View style={styles.unreadDot} /> : null}
                  </View>
                  <AppText style={styles.message}>{item.message}</AppText>
                  <AppText style={styles.time}>{item.time}</AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  tabsWrap: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tabBtn: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  tabText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  tabTextActive: {
    color: '#1A1A1A',
  },
  list: {
    paddingTop: 12,
    paddingBottom: 24,
    rowGap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
    flexDirection: 'row',
    columnGap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkTheme.colors.accent,
    marginTop: 2,
  },
  message: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default NotificationsScreen;
