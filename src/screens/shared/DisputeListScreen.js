import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../components';
import AppAlert from '../../components/AppAlert';
import { useAuth } from '../../context';
import { getMyJobDisputes, getMyOrderDisputes } from '../../services/dispute.service';
import { createSupportTicket, getSupportDisputeTicket } from '../../services/support.service';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const formatDateTime = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const normalizeJobDispute = (raw, index = 0) => ({
  id: String(raw?.id || `job-dispute-${index}`).trim(),
  type: 'job',
  title: String(raw?.issue_type || raw?.car_make || 'Job dispute').trim(),
  reason: String(raw?.reason || 'No reason provided').trim(),
  status: String(raw?.status || 'open').trim().toLowerCase(),
  createdAt: raw?.created_at || null,
  filedByName: String(raw?.filer_name || '').trim(),
  respondentName: String(raw?.respondent_name || '').trim(),
});

const normalizeOrderDispute = (raw, index = 0) => ({
  id: String(raw?.id || `order-dispute-${index}`).trim(),
  type: 'order',
  title: 'Order dispute',
  reason: String(raw?.reason || 'No reason provided').trim(),
  status: String(raw?.status || 'open').trim().toLowerCase(),
  createdAt: raw?.created_at || null,
  filedByName: String(raw?.filer_name || '').trim(),
  respondentName: String(raw?.respondent_name || '').trim(),
});

const pickList = (response) => {
  const payload = response?.data || response || {};
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [];
};

const readTicketIdFromPayload = (response) => {
  const payload = response?.data || response || {};
  return String(payload?.data?.id || payload?.id || payload?.ticket_id || '').trim();
};

const DisputeListScreen = ({ navigation, route }) => {
  const { role } = useAuth();
  const isSeller = role === ROLES.SPARE_PARTS_SELLER;
  const [activeType, setActiveType] = useState('job');
  const [jobDisputes, setJobDisputes] = useState([]);
  const [orderDisputes, setOrderDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingDisputeId, setOpeningDisputeId] = useState('');
  const [focusedDisputeId, setFocusedDisputeId] = useState('');
  const [error, setError] = useState('');

  const loadDisputes = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError('');
    try {
      const shouldLoadJobs = !isSeller;
      const jobsPromise = shouldLoadJobs
        ? getMyJobDisputes({ page: 1, limit: 50 })
        : Promise.resolve({ data: [] });
      const ordersPromise = getMyOrderDisputes({ page: 1, limit: 50 });

      const [jobResult, orderResult] = await Promise.allSettled([
        jobsPromise,
        ordersPromise,
      ]);

      const jobs =
        jobResult.status === 'fulfilled'
          ? pickList(jobResult.value)
              .map((item, index) => normalizeJobDispute(item, index))
              .filter((item) => item.id)
          : [];

      const orders =
        orderResult.status === 'fulfilled'
          ? pickList(orderResult.value)
              .map((item, index) => normalizeOrderDispute(item, index))
              .filter((item) => item.id)
          : [];

      setJobDisputes(jobs);
      setOrderDisputes(orders);

      if (jobResult.status === 'rejected' && orderResult.status === 'rejected') {
        const firstError = jobResult.reason || orderResult.reason;
        setError(firstError?.message || 'Could not load disputes.');
      } else if (orderResult.status === 'rejected') {
        setError(orderResult.reason?.message || 'Could not load order disputes.');
      } else if (jobResult.status === 'rejected' && !isSeller) {
        setError(jobResult.reason?.message || 'Could not load job disputes.');
      }
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load disputes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isSeller]);

  useEffect(() => {
    loadDisputes();
  }, [loadDisputes]);

  useEffect(() => {
    if (isSeller && activeType !== 'order') {
      setActiveType('order');
    }
  }, [activeType, isSeller]);

  useEffect(() => {
    const targetDisputeId = String(route?.params?.focusDisputeId || '').trim();
    const targetType = String(route?.params?.focusType || '').trim().toLowerCase();

    if (!targetDisputeId) {
      return;
    }

    if (targetType === 'order') {
      setActiveType('order');
    } else {
      setActiveType('job');
    }

    setFocusedDisputeId(targetDisputeId);
    navigation.setParams?.({
      focusDisputeId: undefined,
      focusType: undefined,
      openedAt: undefined,
    });
  }, [navigation, route?.params?.focusDisputeId, route?.params?.focusType, route?.params?.openedAt]);

  const listData = useMemo(() => {
    const base = activeType === 'job' ? jobDisputes : orderDisputes;
    if (!focusedDisputeId) {
      return base;
    }

    const focusedIndex = base.findIndex((item) => item.id === focusedDisputeId);
    if (focusedIndex <= 0) {
      return base;
    }

    const clone = base.slice();
    const [focusedItem] = clone.splice(focusedIndex, 1);
    clone.unshift(focusedItem);
    return clone;
  }, [activeType, jobDisputes, orderDisputes, focusedDisputeId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDisputes({ silent: true });
  };

  const handleOpenDispute = async (item) => {
    const disputeId = String(item?.id || '').trim();
    if (!disputeId || openingDisputeId) {
      return;
    }

    setOpeningDisputeId(disputeId);
    try {
      const response = await getSupportDisputeTicket({
        disputeId,
        type: item?.type === 'order' ? 'order' : 'job',
      });
      const ticketId = readTicketIdFromPayload(response);

      if (!ticketId) {
        AppAlert.alert('Unavailable', 'Support chat is not open for this dispute yet.');
        return;
      }

      navigation.navigate(ROUTES.SUPPORT_CHAT, { ticketId });
    } catch (openError) {
      const statusCode = Number(openError?.statusCode || openError?.response?.status || 0);
      if (statusCode === 404) {
        try {
          const supportResponse = await createSupportTicket({
            subject: `Dispute follow-up: ${String(item?.title || 'Dispute').trim()}`,
            category: item?.type === 'order' ? 'order_dispute' : 'job_dispute',
            priority: 'high',
            job_dispute_id: item?.type === 'job' ? disputeId : undefined,
            order_dispute_id: item?.type === 'order' ? disputeId : undefined,
          });
          const ticketId = readTicketIdFromPayload(supportResponse);
          if (!ticketId) {
            AppAlert.alert('Created but unavailable', 'Support ticket was created, but chat ID was missing.');
            return;
          }
          navigation.navigate(ROUTES.SUPPORT_CHAT, { ticketId });
        } catch (createError) {
          AppAlert.alert('Create failed', createError?.message || 'Could not create linked support ticket.');
        }
      } else {
        AppAlert.alert('Could not open', openError?.message || 'Could not open dispute support chat.');
      }
    } finally {
      setOpeningDisputeId('');
    }
  };

  const renderItem = ({ item }) => {
    const isOpening = openingDisputeId === item.id;
    const isFocused = focusedDisputeId === item.id;
    return (
      <View style={[styles.card, isFocused ? styles.cardFocused : null]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() =>
            navigation.navigate(ROUTES.DISPUTE_DETAIL, {
              disputeId: item.id,
              disputeType: item.type,
            })
          }
        >
          <View style={styles.cardTopRow}>
            <AppText style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </AppText>
            {isFocused ? (
              <View style={styles.focusedPill}>
                <AppText style={styles.focusedPillText}>New</AppText>
              </View>
            ) : null}
            <View style={styles.statusPill}>
              <AppText style={styles.statusPillText}>{item.status}</AppText>
            </View>
          </View>
          <AppText style={styles.reason} numberOfLines={2}>
            {item.reason}
          </AppText>
          <View style={styles.metaRow}>
            <AppText style={styles.metaText}>{item.type}</AppText>
            <AppText style={styles.metaText}>-</AppText>
            <AppText style={styles.metaText}>{formatDateTime(item.createdAt)}</AppText>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.supportBtn}
          activeOpacity={0.88}
          onPress={() => handleOpenDispute(item)}
          disabled={isOpening}
        >
          <AppText style={styles.supportBtnText}>{isOpening ? 'Opening...' : 'Open support chat'}</AppText>
        </TouchableOpacity>
        {isOpening ? (
          <View style={styles.inlineLoader}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            <AppText style={styles.inlineLoaderText}>Opening support chat...</AppText>
          </View>
        ) : null}
      </View>
    );
  };

  const emptyState = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <AppText style={styles.emptyTitle}>No disputes yet</AppText>
        <AppText style={styles.emptyBody}>Disputes you file will appear here.</AppText>
      </View>
    ),
    []
  );

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>My disputes</AppText>
        <View style={styles.backButton} />
      </View>

      {!isSeller ? (
        <View style={styles.segmentWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeType === 'job' ? styles.segmentBtnActive : null]}
            activeOpacity={0.85}
            onPress={() => setActiveType('job')}
          >
            <AppText style={[styles.segmentText, activeType === 'job' ? styles.segmentTextActive : null]}>
              Job
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeType === 'order' ? styles.segmentBtnActive : null]}
            activeOpacity={0.85}
            onPress={() => setActiveType('order')}
          >
            <AppText style={[styles.segmentText, activeType === 'order' ? styles.segmentTextActive : null]}>
              Order
            </AppText>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={listData.length ? styles.listContent : styles.listEmptyContent}
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={darkTheme.colors.accent}
              colors={[darkTheme.colors.accent]}
              progressBackgroundColor={darkTheme.colors.background}
            />
          }
        />
      )}

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 8,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  segmentWrap: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segmentBtn: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  segmentBtnActive: {
    backgroundColor: darkTheme.colors.accent,
  },
  segmentText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  segmentTextActive: {
    color: darkTheme.colors.background,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    rowGap: 10,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardFocused: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(230,199,20,0.1)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  focusedPill: {
    minHeight: 20,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(54,227,111,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(54,227,111,0.38)',
  },
  focusedPillText: {
    color: '#36E36F',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  cardTitle: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
    textTransform: 'capitalize',
  },
  statusPill: {
    minHeight: 20,
    borderRadius: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230,199,20,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.38)',
  },
  statusPillText: {
    color: darkTheme.colors.accent,
    fontSize: 10,
    lineHeight: 12,
    textTransform: 'capitalize',
  },
  reason: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  metaText: {
    color: 'rgba(255,255,255,0.56)',
    fontSize: 11,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  supportBtn: {
    marginTop: 10,
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(230,199,20,0.12)',
  },
  supportBtnText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  inlineLoader: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  inlineLoaderText: {
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  emptyWrap: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  emptyBody: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.64)',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  errorText: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    color: '#FF8E8E',
    fontSize: 12,
  },
});

export default DisputeListScreen;

