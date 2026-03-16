import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Briefcase01Icon,
  Settings01Icon,
  Shield01Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { AppText, NoInternetState, ScreenContainer, ScrollableTabs } from '../../components';
import { useAuth, useMechanicProfile } from '../../context';
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notifications.service';
import { getConversationByJobId } from '../../services/jobs.service';
import { getMessages as getConversationMessages } from '../../services/chat.service';
import { darkTheme, withAlpha } from '../../theme';
import { ROLES, ROUTES } from '../../utils';
import { resolveNotificationRoute } from '../../utils/notificationRouting';
import AppAlert from '../../components/AppAlert';
const TABS = [
  { key: 'all', label: 'All', category: '' },
  { key: 'jobs', label: 'Jobs', category: 'jobs' },
  { key: 'payments', label: 'Payments', category: 'payments' },
  { key: 'system', label: 'System', category: 'system' },
];

const PAYMENT_TYPES = new Set([
  'payment_received',
  'payment_released',
  'escrow_funded',
  'quotation_received',
  'quotation_accepted',
  'quotation_rejected',
]);

const JOB_TYPES = new Set(['job_request', 'job_accepted', 'job_declined', 'job_cancelled', 'job_completed']);
const PAGE_SIZE = 10;

const formatRelativeTime = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getNotificationUi = (item, hasPendingProfileReminder) => {
  const type = String(item?.type || '').trim().toLowerCase();
  const title = String(item?.title || '').trim().toLowerCase();

  if (PAYMENT_TYPES.has(type)) {
    return {
      icon: Wallet01Icon,
      bg: 'rgba(87,210,255,0.16)',
      color: '#57D2FF',
    };
  }

  if (JOB_TYPES.has(type)) {
    return {
      icon: Briefcase01Icon,
      bg: withAlpha(darkTheme.colors.accent, 0.18),
      color: darkTheme.colors.accent,
    };
  }

  if (hasPendingProfileReminder && (type === 'general' || title.includes('profile'))) {
    return {
      icon: Settings01Icon,
      bg: 'rgba(255,255,255,0.12)',
      color: '#F5F5F5',
    };
  }

  return {
    icon: Shield01Icon,
    bg: 'rgba(255,118,118,0.14)',
    color: '#FF7676',
  };
};

const NotificationsScreen = ({ navigation }) => {
  const { role } = useAuth();
  const { isComplete: mechanicProfileComplete } = useMechanicProfile();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  const hasPendingProfileReminder = role === ROLES.MECH && !mechanicProfileComplete;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    setPage(1);
    setHasMore(false);

    try {
      const tab = TABS.find((item) => item.key === activeTab) || TABS[0];
      const response = await getNotifications({
        page: 1,
        limit: PAGE_SIZE,
        category: tab.category || undefined,
      });
      const payload = response?.data || response || {};
      const data = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      const meta = payload?.meta && typeof payload.meta === 'object' ? payload.meta : {};
      const currentPage = Number(payload?.page || payload?.current_page || meta?.page || 1);
      const totalPages = Number(payload?.total_pages || payload?.last_page || meta?.total_pages || meta?.last_page || 0);
      const pageSize = Number(payload?.limit || payload?.per_page || meta?.limit || meta?.per_page || PAGE_SIZE);
      const hasMoreByPage = Number.isFinite(totalPages) && totalPages > 0 && currentPage < totalPages;
      const hasMoreByCount = Array.isArray(data) && data.length >= pageSize;

      setNotifications(data);
      setPage(1);
      setHasMore(hasMoreByPage || hasMoreByCount);
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load notifications.');
      setNotifications([]);
      setPage(1);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadMoreNotifications = useCallback(async () => {
    if (loading || loadingMore || !hasMore || error) {
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const tab = TABS.find((item) => item.key === activeTab) || TABS[0];
      const response = await getNotifications({
        page: nextPage,
        limit: PAGE_SIZE,
        category: tab.category || undefined,
      });
      const payload = response?.data || response || {};
      const data = Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
      const meta = payload?.meta && typeof payload.meta === 'object' ? payload.meta : {};
      const currentPage = Number(payload?.page || payload?.current_page || meta?.page || nextPage);
      const totalPages = Number(payload?.total_pages || payload?.last_page || meta?.total_pages || meta?.last_page || 0);
      const pageSize = Number(payload?.limit || payload?.per_page || meta?.limit || meta?.per_page || PAGE_SIZE);
      const hasMoreByPage = Number.isFinite(totalPages) && totalPages > 0 && currentPage < totalPages;
      const hasMoreByCount = Array.isArray(data) && data.length >= pageSize;

      setNotifications((prev) => {
        if (!Array.isArray(data) || !data.length) {
          return prev;
        }
        const seen = new Set(prev.map((item) => String(item?.id || '').trim()).filter(Boolean));
        const incoming = data.filter((item) => !seen.has(String(item?.id || '').trim()));
        return incoming.length ? [...prev, ...incoming] : prev;
      });
      setPage(nextPage);
      setHasMore(hasMoreByPage || hasMoreByCount);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [activeTab, error, hasMore, loading, loadingMore, page]);

  const handleScrollEndReached = useCallback(
    ({ nativeEvent }) => {
      const yOffset = Number(nativeEvent?.contentOffset?.y || 0);
      const contentHeight = Number(nativeEvent?.contentSize?.height || 0);
      const viewportHeight = Number(nativeEvent?.layoutMeasurement?.height || 0);
      const remaining = contentHeight - (yOffset + viewportHeight);

      if (remaining <= 120) {
        loadMoreNotifications();
      }
    },
    [loadMoreNotifications]
  );

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleNavigateFromNotification = async (item) => {
    const payloadData = item?.data && typeof item.data === 'object' ? item.data : {};
    const deepLink = resolveNotificationRoute({ notification: item, role });
    if (deepLink?.route) {
      navigation.navigate(deepLink.route, deepLink.params || {});
      return;
    }

    const actionRequired = String(payloadData?.action_required || '').trim().toLowerCase();
    const conversationId = String(payloadData?.conversation_id || '').trim();
    const jobId = String(payloadData?.job_id || '').trim();

    if (actionRequired === 'open_conversation') {
      let resolvedConversationId = conversationId;

      try {
        if (jobId) {
          const response = await getConversationByJobId(jobId);
          const payload = response?.data || response || {};
          const data = payload?.data || payload;
          const conversation = data?.conversation || null;
          resolvedConversationId = String(
            conversation?.id ||
            conversation?._id ||
            conversation?.conversation_id ||
            conversation?.conversationId ||
            ''
          ).trim();
        } else if (resolvedConversationId) {
          const messagesResponse = await getConversationMessages(resolvedConversationId, { limit: 1, offset: 0 });
          if (!messagesResponse) {
            resolvedConversationId = '';
          }
        }
      } catch (navigationError) {
        const statusCode = Number(navigationError?.statusCode || navigationError?.response?.status || 0);
        if (statusCode === 404) {
          resolvedConversationId = '';
        } else {
          AppAlert.alert('Unable to open chat', navigationError?.message || 'Please try again.');
          return;
        }
      }

      if (!resolvedConversationId) {
        AppAlert.alert('Chat unavailable', 'This chat is no longer available for this job.');
        return;
      }

      navigation.navigate(role === ROLES.MECH ? ROUTES.MECH_CHAT : ROUTES.CAR_OWNER_CHAT, {
        conversationId: resolvedConversationId,
        jobId,
      });
      return;
    }

    if (actionRequired === 'hire_another_mechanic' && jobId) {
      navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, { jobId });
      return;
    }

    if (actionRequired === 'respond_to_job_request' && jobId) {
      navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'jobs', requestJobId: jobId });
      return;
    }
  };

  const handlePressNotification = async (item) => {
    const notificationId = String(item?.id || '').trim();
    if (!notificationId) {
      return;
    }

    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) => prev.map((entry) => (entry.id === notificationId ? { ...entry, is_read: true } : entry)));
    } catch {
      // Ignore mark-read failures to preserve navigation.
    }

    await handleNavigateFromNotification(item);
  };

  const handleDeleteNotification = async (item) => {
    const notificationId = String(item?.id || '').trim();
    if (!notificationId) {
      return;
    }

    try {
      await deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((entry) => entry.id !== notificationId));
    } catch (deleteError) {
      AppAlert.alert('Delete failed', deleteError?.message || 'Could not delete notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (markAllError) {
      AppAlert.alert('Action failed', markAllError?.message || 'Could not mark all notifications as read.');
    }
  };

  const list = useMemo(() => notifications, [notifications]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Notifications</AppText>
          <TouchableOpacity style={styles.markAllBtn} activeOpacity={0.85} onPress={handleMarkAllRead}>
            <AppText style={styles.markAllText}>Mark all read</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsWrap}>
          <ScrollableTabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {!loading && error ? (
          <NoInternetState message={error} onRetry={fetchNotifications} />
        ) : null}

        {!loading && !error ? (
          <ScrollView
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            onScroll={handleScrollEndReached}
            scrollEventThrottle={150}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchNotifications}
                tintColor="transparent"
                colors={['transparent']}
              />
            }
          >
            {list.map((item) => {
              const ui = getNotificationUi(item, hasPendingProfileReminder);
              const isRead = Boolean(item?.is_read);
              const timeText = formatRelativeTime(item?.created_at);
              return (
                <TouchableOpacity
                  key={String(item?.id || Math.random())}
                  activeOpacity={0.88}
                  style={styles.card}
                  onPress={() => handlePressNotification(item)}
                  onLongPress={() => handleDeleteNotification(item)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: ui.bg }]}>
                    <HugeiconsIcon icon={ui.icon} size={18} color={ui.color} strokeWidth={2} />
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.cardTopRow}>
                      <AppText style={styles.title}>{String(item?.title || '').trim() || 'Notification'}</AppText>
                      {!isRead ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <AppText style={styles.message}>{String(item?.body || item?.message || '').trim()}</AppText>
                    {timeText ? <AppText style={styles.time}>{timeText}</AppText> : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            {!list.length ? (
              <View style={styles.centerState}>
                <AppText style={styles.emptyText}>No notifications yet.</AppText>
              </View>
            ) : null}
            {loadingMore ? (
              <View style={styles.loadMoreWrap}>
                <ActivityIndicator size="small" color={darkTheme.colors.accent} />
              </View>
            ) : null}
          </ScrollView>
        ) : null}
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
  tabsWrap: {
    marginTop: 10,
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
  markAllBtn: {
    position: 'absolute',
    right: 0,
    minHeight: 30,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
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
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    rowGap: 8,
  },
  emptyText: {
    color: darkTheme.colors.muted,
  },
  loadMoreWrap: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationsScreen;




