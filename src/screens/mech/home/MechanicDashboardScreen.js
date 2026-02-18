import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FilterHorizontalIcon, Location01Icon, Notification01Icon, StarIcon, Time04Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText } from '../../../components';
import { useAuth } from '../../../context';
import { getAvailableJobs } from '../../../services/jobs.service';
import { getWalletBalance } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';

const FILTERS = [
  { key: 'all', label: 'All jobs' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'high_paying', label: 'High paying' },
  { key: 'filters', label: 'Filters', icon: FilterHorizontalIcon },
];

const initialsFromName = (name) =>
  String(name || 'M')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const formatCurrency = (amount) => {
  const value = Number(amount || 0);
  return `#${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const normalizeJob = (job) => {
  return {
    id: job.id || job._id,
    name: job.car_owner?.name || job.user?.name || 'Customer',
    issue: job.title || job.issue_type || job.description || 'Car Issue',
    distance: job.distance || '',
    eta: job.eta || '',
    urgent: job.priority === 'urgent' || false,
  };
};

const readMechanicName = (user) => {
  const raw =
    user?.first_name ||
    user?.firstName ||
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    'Michael';

  return String(raw || 'Michael').trim();
};

const readMechanicRating = (user) => {
  const value = Number(user?.rating || user?.average_rating || 4.9);
  return Number.isFinite(value) ? value : 4.9;
};

const MechanicDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('all');
  const [walletBalance, setWalletBalance] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mechanicName = readMechanicName(user);
  const mechanicRating = readMechanicRating(user);

  const visibleJobs = useMemo(() => {
    let filtered = jobs;
    if (activeFilter === 'urgent') {
      filtered = jobs.filter((job) => job.urgent);
    }
    // High paying logic would go here if we had amounts
    return filtered;
  }, [activeFilter, jobs]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchData = async () => {
        try {
          const [walletRes, jobsRes] = await Promise.all([
            getWalletBalance().catch(() => null),
            getAvailableJobs({ page: 1, limit: 100 }).catch(() => null)
          ]);

          if (active) {
            if (walletRes) {
              const walletPayload = walletRes?.data || walletRes;
              setWalletBalance(Number(walletPayload?.balance || walletPayload?.available_balance || 0));
            }
            if (jobsRes) {
              const jobsPayload = jobsRes?.data || jobsRes;
              const rawJobs = Array.isArray(jobsPayload)
                ? jobsPayload
                : (jobsPayload?.jobs || jobsPayload?.items || jobsPayload?.results || []);
              setJobs(rawJobs.map(normalizeJob));
              setTotalJobs(Number(jobsPayload?.total || rawJobs.length || 0));
            }
            setError('');
          }
        } catch (fetchError) {
          if (active) {
            setError('Could not load available jobs.');
          }
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchData();

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initialsFromName(mechanicName)}</AppText>
          </View>
          <View>
            <AppText style={styles.welcome}>Welcome {mechanicName}</AppText>
            <AppText style={styles.partner}>BrodaMeko partner</AppText>
          </View>
        </View>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.85} onPress={() => navigation.navigate('Notifications')}>
          <HugeiconsIcon icon={Notification01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.earningsCard}>
        <AppText style={styles.earningsLabel}>Todays earnings</AppText>
        <AppText style={styles.earningsAmount}>#25,000.00</AppText>
        <AppText style={styles.trendText}>1.5% increase in the past 5 days</AppText>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <AppText style={styles.statLabel}>Total jobs</AppText>
          <AppText style={styles.statValue}>{totalJobs}</AppText>
        </View>
        <View style={styles.statCard}>
          <AppText style={styles.statLabel}>Ratings</AppText>
          <View style={styles.ratingRow}>
            <HugeiconsIcon icon={StarIcon} size={14} color={darkTheme.colors.accent} strokeWidth={2.1} />
            <AppText style={styles.statValue}>{mechanicRating.toFixed(1)}</AppText>
          </View>
        </View>
        <View style={styles.statCard}>
          <AppText style={styles.statLabel}>Wallet</AppText>
          <AppText style={styles.statValue}>{formatCurrency(walletBalance)}</AppText>
        </View>
      </View>

      <AppText style={styles.sectionTitle}>Available jobs nearby</AppText>

      <View style={styles.chipsRow}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              activeOpacity={0.85}
              onPress={() => setActiveFilter(filter.key)}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              {filter.icon ? (
                <HugeiconsIcon
                  icon={filter.icon}
                  size={14}
                  color={isActive ? '#1A1A1A' : darkTheme.colors.text}
                  strokeWidth={2}
                />
              ) : null}
              <AppText style={[styles.chipText, isActive && styles.chipTextActive]}>{filter.label}</AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.jobsList}>
        {loading ? (
          <AppText style={styles.jobsStateText}>Loading jobs...</AppText>
        ) : error ? (
          <AppText style={styles.jobsErrorText}>{error}</AppText>
        ) : visibleJobs.length === 0 ? (
          <AppText style={styles.jobsStateText}>No jobs available at the moment.</AppText>
        ) : (
          visibleJobs.map((job) => (
            <View key={job.id} style={styles.jobCard}>
              <View style={styles.jobTop}>
                <View style={styles.jobTopLeft}>
                  <View style={styles.jobAvatar}>
                    <AppText style={styles.jobAvatarText}>{initialsFromName(job.name)}</AppText>
                  </View>
                  <View style={styles.jobMain}>
                    <AppText style={styles.jobName}>{job.name}</AppText>
                    <AppText style={styles.jobIssue}>{job.issue}</AppText>
                  </View>
                </View>
                {job.urgent ? (
                  <View style={styles.urgentPill}>
                    <AppText style={styles.urgentText}>Urgent</AppText>
                  </View>
                ) : null}
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <HugeiconsIcon icon={Location01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
                  <AppText style={styles.metaText}>{job.distance || 'Distance unavailable'}</AppText>
                </View>
                <View style={styles.metaItem}>
                  <HugeiconsIcon icon={Time04Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
                  <AppText style={styles.metaText}>{job.eta || 'ETA unavailable'}</AppText>
                </View>
              </View>

              <AppButton
                label="Accept job"
                onPress={() => console.log('Accept job:', job.id)}
                style={styles.acceptBtn}
                textStyle={styles.acceptBtnText}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FF8A50',
    backgroundColor: '#392425',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: 16,
  },
  welcome: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  partner: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    padding: 14,
  },
  earningsLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  earningsAmount: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  trendText: {
    marginTop: 6,
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
  },
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: 8,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statLabel: {
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  statValue: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  sectionTitle: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  chipsRow: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 8,
    flexWrap: 'wrap',
    rowGap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    backgroundColor: 'transparent',
  },
  chipActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  chipText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  chipTextActive: {
    color: '#1A1A1A',
  },
  jobsList: {
    marginTop: 12,
    rowGap: 10,
  },
  jobsStateText: {
    color: darkTheme.colors.muted,
    textAlign: 'center',
    marginTop: 20,
  },
  jobsErrorText: {
    color: '#FF7F7F',
    textAlign: 'center',
    marginTop: 20,
  },
  jobCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 12,
  },
  jobTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 10,
  },
  jobTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    columnGap: 10,
  },
  jobAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226,255,49,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(226,255,49,0.45)',
  },
  jobAvatarText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  jobMain: {
    flex: 1,
  },
  jobName: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  jobIssue: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  urgentPill: {
    backgroundColor: 'rgba(226,255,49,0.15)',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  urgentText: {
    color: darkTheme.colors.accent,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  metaText: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  acceptBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: '#1A1A1A',
    fontSize: 14,
  },
});

export default MechanicDashboardScreen;
