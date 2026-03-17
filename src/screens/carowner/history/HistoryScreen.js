import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Animated, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Delete02Icon, StarIcon } from '@hugeicons/core-free-icons';
import {
  AppBottomNav,
  AppButton,
  NoInternetState,
  AppText,
  PullToRefreshIndicator,
  ScreenContainer,
  ScrollableTabs,
} from '../../../components';
import { useChat } from '../../../context';
import { deleteJob, getCarOwnerJobs, updateJobStatus } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';

const toCurrency = (amount) => {
  const safe = Number(amount);
  const value = Number.isFinite(safe) ? safe : 0;
  return `₦${value.toLocaleString('en-NG')}`;
};

const toTitleCaseWords = (value) => {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const normalizeIssueType = (value) => {
  const safe = String(value || '').trim();
  if (!safe) {
    return 'Car service';
  }

  return toTitleCaseWords(safe.replace(/[_-]+/g, ' '));
};

const normalizeJob = (job, index) => {
  const amountRaw =
    job?.amount ??
    job?.price ??
    job?.total_fee ??
    job?.total ??
    job?.quoted_price;
  const hasAmount = amountRaw !== undefined && amountRaw !== null && String(amountRaw).trim() !== '';
  const amount = hasAmount ? Number(amountRaw) || 0 : 0;

  const issue =
    job?.issue ||
    job?.issue_type ||
    job?.problem ||
    job?.title ||
    'Car service';

  const rawStatus = String(job?.status || 'pending').toLowerCase();
  const safeStatus = rawStatus === 'canceled' ? 'cancelled' : rawStatus;

  const mechanicId = String(
    job?.mechanic?.id ||
    job?.mechanic?._id ||
    job?.mechanic?.mechanic_id ||
    job?.mechanic_id ||
    job?.assigned_mechanic?.id ||
    job?.assigned_mechanic?._id ||
    job?.assigned_mechanic?.mechanic_id ||
    '',
  ).trim();

  const mechanicName =
    job?.mechanic?.name ||
    job?.mechanic_name ||
    job?.mech_name ||
    job?.assigned_mechanic?.name ||
    job?.provider?.name ||
    (safeStatus === 'pending' ? 'Awaiting assignment' : 'Assigned mechanic');

  const rating = Number(
    job?.mechanic?.rating_summary?.avg_rating ??
    job?.mechanic?.avg_rating ??
    job?.mechanic?.rating ??
    job?.rating ??
    job?.provider?.rating ??
    0
  );
  const jobId = String(job?.id || job?._id || job?.job_id || `job-${index}`);
  const avatarUrl =
    job?.mechanic?.avatar ||
    job?.mechanic?.avatar_url ||
    job?.mechanic?.image ||
    job?.mechanic_avatar ||
    job?.mech_avatar ||
    job?.mechanic_image ||
    job?.assigned_mechanic?.avatar ||
    job?.provider?.avatar ||
    null;
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0;
  const hasMechanicIdentity = Boolean(mechanicId || String(mechanicName || '').trim());
  const canRate = safeStatus !== 'pending' && hasMechanicIdentity;

  return {
    id: jobId,
    jobId,
    mechanicId,
    mechanicName: mechanicName || (safeStatus === 'pending' ? 'Awaiting assignment' : 'Assigned mechanic'),
    issueSummary: normalizeIssueType(issue),
    rating: safeRating,
    amount,
    hasAmount,
    status: safeStatus,
    avatarUrl,
    canRate,
  };
};

const HISTORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];
const PAGE_LIMIT = 10;

const pickJobsFromResponse = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.jobs)) {
    return responseData.jobs;
  }

  if (Array.isArray(responseData?.items)) {
    return responseData.items;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
};

const HistorySkeleton = () => {
  return (
    <View style={styles.skeletonWrap}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.skeletonCard}>
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLineMid} />
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonLineShort} />
          </View>
          <View style={styles.skeletonBtnRow}>
            <View style={styles.skeletonBtn} />
            <View style={styles.skeletonBtn} />
          </View>
        </View>
      ))}
    </View>
  );
};

const JobHistoryCard = ({ item, onViewDetails, onRate, onCancel, onDelete, cancelling, deleting }) => {
  const isCancelled = item.status === 'cancelled';
  const isCompleted = item.status === 'completed';
  const isPending = item.status === 'pending';
  const canDelete = isPending;
  const canRate = !isPending && Boolean(item?.canRate);
  const statusLabel = isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Pending';
  const statusTextColor = isCancelled ? '#E85578' : isCompleted ? '#4CC968' : '#C8CCD8';
  const filledStars = Math.round(Number(item?.rating || 0));

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={styles.profileBlock}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback} />
          )}

          <View style={styles.profileTextWrap}>
            <AppText style={styles.mechanicName}>{item.mechanicName}</AppText>
            <AppText style={styles.issueSummary} numberOfLines={1}>
              {item.issueSummary}
            </AppText>

            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <HugeiconsIcon
                  key={star}
                  icon={StarIcon}
                  size={12}
                  color={star <= filledStars ? '#FFB800' : 'rgba(255,255,255,0.28)'}
                  strokeWidth={2}
                />
              ))}
              <AppText style={styles.ratingText}>{Number(item.rating || 0).toFixed(1)}</AppText>
            </View>
          </View>
        </View>

        <View style={styles.cardRight}>
          <View
            style={[
              styles.statusBadge,
              isCancelled
                ? styles.statusBadgeCancelled
                : isCompleted
                  ? styles.statusBadgeCompleted
                  : styles.statusBadgePending,
            ]}
          >
            <AppText style={[styles.statusText, { color: statusTextColor }]}>{statusLabel}</AppText>
          </View>
          <AppText style={styles.amount}>{item.hasAmount ? toCurrency(item.amount) : '--'}</AppText>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {typeof onViewDetails === 'function' ? (
          <TouchableOpacity activeOpacity={0.85} style={[styles.actionBtn, styles.actionBtnView]} onPress={onViewDetails}>
            <AppText style={styles.actionBtnViewText}>View details</AppText>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.actionBtn, isPending ? styles.actionBtnCancel : styles.actionBtnRate, !isPending && !canRate ? styles.actionBtnDisabled : null]}
          onPress={isPending ? onCancel : onRate}
          disabled={(isPending && (cancelling || deleting)) || (!isPending && !canRate)}
        >
          <AppText style={[isPending ? styles.actionBtnCancelText : styles.actionBtnRateText, !isPending && !canRate ? styles.actionBtnDisabledText : null]}>
            {isPending ? (cancelling ? 'Cancelling...' : 'Cancel') : 'Rate'}
          </AppText>
        </TouchableOpacity>
      </View>

      {canDelete ? (
        <View style={styles.pendingMetaRow}>
          <TouchableOpacity
            style={styles.deleteIconBtn}
            activeOpacity={0.85}
            onPress={onDelete}
            disabled={deleting || (isPending && cancelling)}
          >
            <HugeiconsIcon icon={Delete02Icon} size={18} color={deleting ? '#B75A6F' : '#F87171'} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const HistoryScreen = ({ navigation }) => {
  const { clearActiveConversation } = useChat();
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [cancellingJobId, setCancellingJobId] = useState('');
  const [deletingJobId, setDeletingJobId] = useState('');
  const pullDistance = useRef(new Animated.Value(0)).current;
  const fetchHistoryRef = useRef(null);

  const mergeUniqueJobs = useCallback((existing, incoming) => {
    const next = [...existing];
    const seen = new Set(existing.map((item) => String(item?.jobId || item?.id || '').trim()));

    incoming.forEach((item) => {
      const key = String(item?.jobId || item?.id || '').trim();
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      next.push(item);
    });

    return next;
  }, []);

  const fetchHistory = useCallback(async ({ reset = false } = {}) => {
    if (!reset && (loadingMore || loading || !hasMore)) {
      return;
    }

    const targetPage = reset ? 1 : page + 1;
    if (reset) {
      setLoading(true);
      setError('');
      setHasMore(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await getCarOwnerJobs({ limit: PAGE_LIMIT, page: targetPage });
      const rawJobs = pickJobsFromResponse(response?.data);
      const normalized = rawJobs.map(normalizeJob);
      setJobs((prev) => (reset ? normalized : mergeUniqueJobs(prev, normalized)));
      setPage(targetPage);
      setHasMore(normalized.length >= PAGE_LIMIT);
    } catch (requestError) {
      if (reset) {
        setError(requestError?.message || 'Could not load your history right now. Please try again.');
      }
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [hasMore, loading, loadingMore, mergeUniqueJobs, page]);

  fetchHistoryRef.current = fetchHistory;

  useFocusEffect(
    useCallback(() => {
      fetchHistoryRef.current?.({ reset: true });
    }, [])
  );

  const handleCancelJob = useCallback(async (jobId) => {
    const safeJobId = String(jobId || '').trim();
    if (!safeJobId) {
      return;
    }
    const job = jobs.find((entry) => String(entry?.jobId || '').trim() === safeJobId);
    const currentStatus = String(job?.status || '').trim().toLowerCase();
    const allowed = new Set(['pending', 'accepted']);
    if (!allowed.has(currentStatus)) {
      AppAlert.alert('Cannot cancel', 'Only pending or accepted jobs can be cancelled by car owner.');
      return;
    }

    AppAlert.alert('Cancel job', 'Are you sure you want to cancel this job?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancellingJobId(safeJobId);
          try {
            await updateJobStatus(safeJobId, 'cancelled');
            clearActiveConversation();
            setJobs((prev) =>
              prev.map((entry) => (entry.jobId === safeJobId ? { ...entry, status: 'cancelled' } : entry))
            );
            AppAlert.alert('Cancelled', 'Job has been cancelled.');
          } catch (requestError) {
            AppAlert.alert('Cancel failed', requestError?.message || 'Could not cancel this job.');
          } finally {
            setCancellingJobId('');
          }
        },
      },
    ]);
  }, [clearActiveConversation, jobs]);

  const handleDeleteJob = useCallback((jobId) => {
    const safeJobId = String(jobId || '').trim();
    if (!safeJobId) {
      return;
    }

    AppAlert.alert('Delete job', 'Are you sure you want to delete this job?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingJobId(safeJobId);
          try {
            await deleteJob(safeJobId);
            clearActiveConversation();
            setJobs((prev) => prev.filter((entry) => entry.jobId !== safeJobId));
            AppAlert.alert('Deleted', 'Job deleted successfully.');
          } catch (requestError) {
            AppAlert.alert('Delete failed', requestError?.message || 'Could not delete this job.');
          } finally {
            setDeletingJobId('');
          }
        },
      },
    ]);
  }, [clearActiveConversation]);

  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') {
      return jobs;
    }
    return jobs.filter((item) => String(item?.status || '').toLowerCase() === activeTab);
  }, [activeTab, jobs]);

  const handleEndReached = useCallback(() => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    fetchHistory({ reset: false });
  }, [fetchHistory, hasMore, loading, loadingMore]);

  const renderItem = useCallback(({ item }) => (
    <JobHistoryCard
      item={item}
      onViewDetails={null}
      onCancel={() => handleCancelJob(item.jobId)}
      onDelete={() => handleDeleteJob(item.jobId)}
      cancelling={cancellingJobId === item.jobId}
      deleting={deletingJobId === item.jobId}
      onRate={() =>
        navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DETAILS, {
          jobId: item.jobId,
          mechanicId: item.mechanicId,
          preview: {
            mechanicId: item.mechanicId,
            mechanicName: item.mechanicName,
            rating: item.rating,
            avatarUrl: item.avatarUrl,
          },
        })
      }
    />
  ), [navigation, handleCancelJob, handleDeleteJob, cancellingJobId, deletingJobId]);

  const listHeader = useMemo(() => (
    <View style={styles.tabsWrap}>
      <ScrollableTabs tabs={HISTORY_TABS} activeKey={activeTab} onChange={setActiveTab} />
    </View>
  ), [activeTab]);

  const listFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerWrap}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      );
    }

    if (!hasMore && filteredJobs.length > 0) {
      return (
        <View style={styles.footerWrap}>
          <AppText style={styles.footerText}>You've reached the end.</AppText>
        </View>
      );
    }

    return null;
  }, [filteredJobs.length, hasMore, loadingMore]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return <HistorySkeleton />;
    }

    if (error) {
      return (
        <NoInternetState
          title="Network error"
          message={error}
          onRetry={() => fetchHistory({ reset: true })}
        />
      );
    }

    return (
      <View style={styles.stateWrap}>
        <AppText style={styles.stateTitle}>No history yet</AppText>
        <AppText style={styles.stateText}>Your completed, pending, or cancelled bookings will appear here.</AppText>
      </View>
    );
  }, [loading, error, fetchHistory]);

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.heading}>History</AppText>
          <View style={styles.backButtonSpacer} />
        </View>

        <View style={styles.listWrap}>
          <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
          <Animated.FlatList
            data={filteredJobs}
            keyExtractor={(item, index) => String(item?.id || item?.jobId || `history-${index}`)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.35}
            onScroll={event => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
              pullDistance.setValue(pullValue);
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => fetchHistory({ reset: true })}
                tintColor="transparent"
                colors={['transparent']}
              />
            }
          />
        </View>
        </View>
      </ScreenContainer>

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_HISTORY} onTabPress={(routeName) => navigation.navigate(routeName)} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#010037',
  },
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  container: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  header: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 36,
    height: 36,
  },
  heading: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 108,
  },
  listWrap: {
    flex: 1,
  },
  tabsWrap: {
    marginBottom: 10,
  },
  cardSeparator: {
    height: 10,
  },
  footerWrap: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  list: {
    rowGap: 12,
  },
  card: {
    borderRadius: 14,
    backgroundColor: 'rgba(125,128,173,0.26)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  profileBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: '#575A86',
  },
  profileTextWrap: {
    flex: 1,
  },
  mechanicName: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  issueSummary: {
    marginTop: 1,
    color: '#AEB0CC',
    fontSize: 14,
    lineHeight: 16,
  },
  cardRight: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  statusBadge: {
    minHeight: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(36, 182, 85, 0.24)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(232, 77, 111, 0.24)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(154, 161, 181, 0.28)',
  },
  statusText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  amount: {
    marginTop: 18,
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  ratingRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 2,
  },
  ratingText: {
    marginLeft: 3,
    color: '#B7B9D1',
    fontSize: 12,
    lineHeight: 14,
  },
  actionsRow: {
    marginTop: 14,
    flexDirection: 'row',
    columnGap: 12,
  },
  actionBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnView: {
    backgroundColor: 'rgba(255,255,255,0.36)',
  },
  actionBtnViewText: {
    color: '#D6D8E9',
    fontSize: 15,
  },
  actionBtnRate: {
    borderWidth: 0.5,
    borderRadius: 18,
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'transparent',
  },
  actionBtnRateText: {
    color: darkTheme.colors.accent,
    fontSize: 15,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnDisabledText: {
    color: 'rgba(255,255,255,0.65)',
  },
  actionBtnCancel: {
    borderWidth: 0.5,
    borderRadius: 18,
    borderColor: 'rgba(232,85,120,0.85)',
    backgroundColor: 'rgba(232,85,120,0.12)',
  },
  actionBtnCancelText: {
    color: '#E85578',
    fontSize: 15,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  pendingMetaRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  deleteIconBtn: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(248,113,113,0.08)',
  },
  stateWrap: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  stateTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  skeletonWrap: {
    rowGap: 12,
  },
  skeletonCard: {
    borderRadius: 14,
    backgroundColor: 'rgba(125,128,173,0.2)',
    padding: 14,
  },
  skeletonLineWide: {
    width: '70%',
    height: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skeletonLineMid: {
    marginTop: 8,
    width: '85%',
    height: 11,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonRow: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 8,
  },
  skeletonLineShort: {
    width: 80,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skeletonBtnRow: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: 8,
  },
  skeletonBtn: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default HistoryScreen;




