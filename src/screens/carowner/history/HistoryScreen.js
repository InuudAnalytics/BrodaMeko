import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppBottomNav, AppButton, AppText, ScreenContainer } from '../../../components';
import { getCarOwnerJobs } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const MOCK_COMPLETED_JOBS = [
  {
    id: 'mock_1',
    jobId: 'mock_1',
    mechanicName: 'Shittu Hassan',
    issueSummary: 'Engine misfire - Toyota Camry',
    rating: 4.9,
    amount: 19980,
  },
  {
    id: 'mock_2',
    jobId: 'mock_2',
    mechanicName: 'Emeka Okafor',
    issueSummary: 'Battery problem - Honda Accord',
    rating: 4.7,
    amount: 8400,
  },
  {
    id: 'mock_3',
    jobId: 'mock_3',
    mechanicName: 'Chidi Nwosu',
    issueSummary: 'Brake service - Nissan Altima',
    rating: 4.8,
    amount: 9300,
  },
];

const toCurrency = (amount) => {
  const safe = Number(amount);
  const value = Number.isFinite(safe) ? safe : 0;
  return `₦${value.toLocaleString('en-NG')}`;
};

const normalizeJob = (job, index) => {
  const amount =
    job?.amount ||
    job?.price ||
    job?.total_fee ||
    job?.total ||
    job?.quoted_price ||
    0;

  const issue =
    job?.issue ||
    job?.issue_type ||
    job?.problem ||
    job?.title ||
    'Car service';

  const vehicle = job?.car_make || job?.vehicle || '';

  const mechanicName =
    job?.mechanic?.name ||
    job?.mechanic_name ||
    job?.provider?.name ||
    'Assigned mechanic';

  const rating =
    Number(job?.rating || job?.mechanic?.rating || job?.provider?.rating || 4.8);

  const jobId = String(job?.id || job?._id || job?.job_id || `job-${index}`);

  return {
    id: jobId,
    jobId,
    mechanicName,
    issueSummary: vehicle ? `${issue} - ${vehicle}` : issue,
    rating: Number.isFinite(rating) ? rating : 4.8,
    amount: Number(amount) || 0,
  };
};

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

const JobHistoryCard = ({ item, onViewDetails }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTopLeft}>
          <AppText style={styles.mechanicName}>{item.mechanicName}</AppText>
          <AppText style={styles.issueSummary}>{item.issueSummary}</AppText>
        </View>
        <AppText style={styles.amount}>{toCurrency(item.amount)}</AppText>
      </View>

      <View style={styles.ratingRow}>
        <HugeiconsIcon icon={StarIcon} size={14} color={darkTheme.colors.accent} strokeWidth={2} />
        <AppText style={styles.ratingText}>{item.rating.toFixed(1)}</AppText>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.actionBtn, styles.actionBtnOutline]}
          onPress={onViewDetails}
        >
          <AppText style={styles.actionBtnOutlineText}>View details</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.actionBtn, styles.actionBtnFilled]}
          onPress={() => Alert.alert('Rebook', 'Rebook flow coming soon.')}
        >
          <AppText style={styles.actionBtnFilledText}>Rebook</AppText>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#1A1A1A" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const HistoryScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
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
      const hasStatusField = rawJobs.some((job) => Object.prototype.hasOwnProperty.call(job || {}, 'status'));
      const filteredJobs = hasStatusField
        ? rawJobs.filter((job) => String(job?.status || '').toLowerCase() === 'completed')
        : rawJobs;

      setJobs(filteredJobs.map(normalizeJob));
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

    if (!jobs.length) {
      return (
        <View style={styles.stateWrap}>
          <AppText style={styles.stateTitle}>No completed jobs yet</AppText>
          <AppText style={styles.stateText}>Completed bookings will appear here once they are done.</AppText>
        </View>
      );
    }

    return (
      <View style={styles.list}>
        {usingFallback ? (
          <AppText style={styles.fallbackHint}>Showing recent mock history while connection is unavailable.</AppText>
        ) : null}
        {jobs.map((item) => (
          <JobHistoryCard
            key={item.id}
            item={item}
            onViewDetails={() => navigation.navigate(ROUTES.CAR_OWNER_JOB_DETAILS, { jobId: item.jobId })}
          />
        ))}
      </View>
    );
  }, [loading, error, jobs, usingFallback, fetchHistory, navigation]);

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
        <AppText style={styles.subText}>Completed jobs</AppText>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
    backgroundColor: '#000033',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    minHeight: 42,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 2,
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
  subText: {
    marginBottom: 10,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  content: {
    paddingBottom: 24,
  },
  list: {
    rowGap: 10,
  },
  fallbackHint: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  cardTopLeft: {
    flex: 1,
  },
  mechanicName: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  issueSummary: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  amount: {
    color: darkTheme.colors.accent,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  ratingRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  ratingText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 6,
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'transparent',
  },
  actionBtnOutlineText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
  actionBtnFilled: {
    backgroundColor: darkTheme.colors.accent,
  },
  actionBtnFilledText: {
    color: '#1A1A1A',
    fontSize: 13,
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
    rowGap: 10,
  },
  skeletonCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 12,
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
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

export default HistoryScreen;
