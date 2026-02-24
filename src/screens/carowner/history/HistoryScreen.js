import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppBottomNav, AppButton, AppText, ScreenContainer } from '../../../components';
import { getCarOwnerJobs } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const MOCK_COMPLETED_JOBS = [
  {
    id: 'mock_1',
    jobId: 'mock_1',
    mechanicName: 'Emeka Nwosu',
    issueSummary: 'Flat Tire Replacement',
    rating: 4.6,
    amount: 8500,
    hasAmount: true,
    status: 'completed',
    avatarUrl: 'https://i.pravatar.cc/100?img=12',
  },
  {
    id: 'mock_2',
    jobId: 'mock_2',
    mechanicName: 'Tunde Bakare',
    issueSummary: 'Battery Jump Start',
    rating: 4.6,
    amount: 5000,
    hasAmount: true,
    status: 'pending',
    avatarUrl: 'https://i.pravatar.cc/100?img=15',
  },
  {
    id: 'mock_3',
    jobId: 'mock_3',
    mechanicName: 'Chidi Okafor',
    issueSummary: 'Engine Diagnostics',
    rating: 4.6,
    amount: 8900,
    hasAmount: true,
    status: 'cancelled',
    avatarUrl: 'https://i.pravatar.cc/100?img=65',
  },
];

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

  const safeStatus = String(job?.status || 'pending').toLowerCase();

  const mechanicName =
    job?.mechanic?.name ||
    job?.mechanic_name ||
    job?.provider?.name ||
    (safeStatus === 'pending' ? 'Awaiting assignment' : 'Assigned mechanic');

  const rating = Number(job?.rating || job?.mechanic?.rating || job?.provider?.rating || 4.6);
  const jobId = String(job?.id || job?._id || job?.job_id || `job-${index}`);
  const avatarUrl = job?.mechanic?.avatar || job?.mechanic_avatar || job?.provider?.avatar || null;

  return {
    id: jobId,
    jobId,
    mechanicName,
    issueSummary: normalizeIssueType(issue),
    rating: Number.isFinite(rating) ? rating : 4.6,
    amount,
    hasAmount,
    status: safeStatus,
    avatarUrl,
  };
};

const HISTORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
];

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

const JobHistoryCard = ({ item, onViewDetails, onRate }) => {
  const isCancelled = item.status === 'cancelled';
  const isCompleted = item.status === 'completed';
  const statusLabel = isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Pending';
  const statusTextColor = isCancelled ? '#E85578' : isCompleted ? '#4CC968' : '#C8CCD8';

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
              {[1, 2, 3, 4].map((star) => (
                <HugeiconsIcon key={star} icon={StarIcon} size={12} color="#FFB800" strokeWidth={2} />
              ))}
              <AppText style={styles.ratingText}>{item.rating.toFixed(1)}</AppText>
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
        <TouchableOpacity activeOpacity={0.85} style={[styles.actionBtn, styles.actionBtnView]} onPress={onViewDetails}>
          <AppText style={styles.actionBtnViewText}>View details</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.actionBtn, styles.actionBtnRate]}
          onPress={onRate}
        >
          <AppText style={styles.actionBtnRateText}>Rate</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HistoryScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    setUsingFallback(false);

    try {
      const response = await getCarOwnerJobs({ limit: 10, page: 1 });
      const rawJobs = pickJobsFromResponse(response?.data);
      setJobs(rawJobs.map(normalizeJob));
    } catch (requestError) {
      const statusCode = Number(requestError?.statusCode || 0);
      const shouldUseMockFallback = statusCode === 0 || statusCode === 401;

      if (shouldUseMockFallback) {
        setUsingFallback(true);
        setJobs(MOCK_COMPLETED_JOBS);
      } else {
        setError('Could not load your history right now. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const filteredJobs = useMemo(() => {
    if (activeTab === 'all') {
      return jobs;
    }
    return jobs.filter((item) => String(item?.status || '').toLowerCase() === activeTab);
  }, [activeTab, jobs]);

  const content = useMemo(() => {
    if (loading) {
      return <HistorySkeleton />;
    }

    if (error) {
      return (
        <View style={styles.stateWrap}>
          <AppText style={styles.stateTitle}>Unable to load history</AppText>
          <AppText style={styles.stateText}>{error}</AppText>
          <AppButton label="Retry" onPress={fetchHistory} style={styles.retryBtn} />
        </View>
      );
    }

    if (!filteredJobs.length) {
      return (
        <View style={styles.stateWrap}>
          <AppText style={styles.stateTitle}>No history yet</AppText>
          <AppText style={styles.stateText}>Your completed, pending, or cancelled bookings will appear here.</AppText>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {usingFallback ? (
          <AppText style={styles.fallbackHint}>Showing recent mock history while connection is unavailable.</AppText>
        ) : null}
        {filteredJobs.map((item) => (
          <JobHistoryCard
            key={item.id}
            item={item}
            onViewDetails={() => navigation.navigate(ROUTES.CAR_OWNER_JOB_DETAILS, { jobId: item.jobId })}
            onRate={() =>
              navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DETAILS, {
                jobId: item.jobId,
                preview: {
                  mechanicName: item.mechanicName,
                  rating: item.rating,
                  avatarUrl: item.avatarUrl,
                },
              })
            }
          />
        ))}
      </View>
    );
  }, [loading, error, filteredJobs, usingFallback, fetchHistory, navigation]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.heading}>History</AppText>
          <View style={styles.backButtonSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.tabsWrap}>
            {HISTORY_TABS.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabBtn, isActive ? styles.tabBtnActive : null]}
                  activeOpacity={0.85}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <AppText style={[styles.tabText, isActive ? styles.tabTextActive : null]}>{tab.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          {content}
        </ScrollView>
      </View>

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_HISTORY} onTabPress={(routeName) => navigation.navigate(routeName)} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: 20,
  },
  tabsWrap: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 8,
    padding: 5,
    columnGap: 4,
  },
  tabBtn: {
    flex: 1,
    minHeight: 30,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: darkTheme.colors.accent,
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  tabTextActive: {
    color: 'rgba(26,26,26,0.92)',
  },
  list: {
    rowGap: 12,
  },
  fallbackHint: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
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
  retryBtn: {
    marginTop: 14,
    minWidth: 140,
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
