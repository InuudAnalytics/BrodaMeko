import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Notification01Icon, StarIcon, Time04Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, PersonalInfoAlert, ScrollableTabs } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { getAvailableJobs } from '../../../services/jobs.service';
import { getNotifications } from '../../../services/notifications.service';
import { setMechanicOnlineStatus } from '../../../services/mechanic.service';
import { getWalletBalance } from '../../../services/wallet.service';
import { darkTheme, withAlpha } from '../../../theme';

const FILTERS = [
  { key: 'available', label: 'Available jobs' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
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
  return `\u20A6${value.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

const normalizeAvatarUri = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^(https?:\/\/|file:|content:|data:|asset:)/i.test(raw)) {
    return raw;
  }

  const base = String(BASE_URL || '').trim().replace(/\/+$/, '');
  const path = raw.replace(/^\/+/, '');
  return base ? `${base}/${path}` : raw;
};

const readAvatarUri = (user) =>
  normalizeAvatarUri(
    user?.avatar ||
    user?.avatar_url ||
    user?.avatarUrl ||
    user?.avatarUri ||
    user?.profile_photo ||
    user?.profile_photo_url ||
    user?.profile_picture ||
    user?.image_url ||
    user?.photo_url ||
    ''
  );

const MechanicDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState('available');
  const [walletBalance, setWalletBalance] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(Boolean(user?.is_online ?? user?.isOnline));
  const mechanicName = readMechanicName(user);
  const mechanicRating = readMechanicRating(user);
  const avatarUri = readAvatarUri(user);

  const handleToggleOnline = useCallback(async (value) => {
    setIsOnline(value);
    try {
      await setMechanicOnlineStatus(value);
    } catch (error) {
      setIsOnline((prev) => !prev);
    }
  }, []);

  const visibleJobs = useMemo(() => {
    if (activeFilter === 'active') {
      return jobs.filter((job) => job?.status === 'active');
    }
    if (activeFilter === 'completed') {
      return jobs.filter((job) => job?.status === 'completed');
    }
    return jobs;
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

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchUnread = async () => {
        try {
          const response = await getNotifications({ page: 1, limit: 1 });
          const payload = response?.data || response || {};
          const count = Number(payload?.unread_count || 0);
          if (active) setUnreadCount(Number.isFinite(count) ? count : 0);
        } catch {
          if (active) setUnreadCount(0);
        }
      };

      fetchUnread();

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.root}>
      <PersonalInfoAlert />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <AppText style={styles.avatarText}>{initialsFromName(mechanicName)}</AppText>
            )}
          </View>
          <View>
            <AppText style={styles.welcome}>Welcome {mechanicName}</AppText>
            <AppText style={styles.partner}>BrodaMeko partner</AppText>
          </View>
        </View>
        <TouchableOpacity style={styles.bellButton} activeOpacity={0.85} onPress={() => navigation.navigate('Notifications')}>
          <HugeiconsIcon icon={Notification01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2} />
          {unreadCount > 0 ? (
            <View style={styles.bellBadge}>
              <AppText style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</AppText>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      <View style={styles.earningsCard}>
        <View style={styles.earningsHeader}>
          <AppText style={styles.earningsLabel}>Todays earnings</AppText>
          <View style={styles.onlineToggle}>
            <AppText style={styles.onlineLabel}>Online</AppText>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: 'rgba(255,255,255,0.18)', true: withAlpha(darkTheme.colors.accent, 0.55) }}
              thumbColor={isOnline ? darkTheme.colors.accent : '#D9D9D9'}
            />
          </View>
        </View>
        <AppText style={styles.earningsAmount}>{'\u20A6'}25,000.00</AppText>
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

      <AppText style={styles.sectionTitle}>Nearby requests</AppText>

      <View style={styles.tabsWrap}>
        <ScrollableTabs tabs={FILTERS} activeKey={activeFilter} onChange={setActiveFilter} />
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

              <View style={styles.jobActions}>
                <AppButton
                  label="Accept job"
                  onPress={() => console.log('Accept job:', job.id)}
                  style={[styles.actionBtn, styles.acceptBtn]}
                  textStyle={styles.acceptBtnText}
                />
                <AppButton
                  label="Cancel"
                  onPress={() => console.log('Cancel job:', job.id)}
                  style={[styles.actionBtn, styles.cancelBtn]}
                  textStyle={styles.cancelBtnText}
                />
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: 16,
  },
  welcome: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  partner: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
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
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: darkTheme.colors.background,
  },
  bellBadgeText: {
    color: '#1A1A1A',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  earningsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    padding: 14,
  },
  earningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earningsLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  onlineLabel: {
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  earningsAmount: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  trendText: {
    marginTop: 6,
    color: darkTheme.colors.accent,
    fontSize: 11,
    lineHeight: 14,
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
    fontSize: 10,
    lineHeight: 13,
  },
  statValue: {
    marginTop: 4,
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 18,
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
    fontSize: 15,
    lineHeight: 19,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  tabsWrap: {
    marginTop: 10,
    marginBottom: 4,
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
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.22),
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.45),
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
    fontSize: 14,
    lineHeight: 17,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  jobIssue: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  urgentPill: {
    backgroundColor: '#5A1B1B',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  urgentText: {
    color: '#F5F5F5',
    fontSize: 10,
    lineHeight: 12,
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
    fontSize: 11,
    lineHeight: 14,
  },
  jobActions: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 10,
  },
  actionBtn: {
    flex: 1,
    minHeight: 42,
    borderRadius: 10,
  },
  acceptBtn: {
    backgroundColor: darkTheme.colors.accent,
  },
  acceptBtnText: {
    color: '#1A1A1A',
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cancelBtnText: {
    color: darkTheme.colors.text,
    fontSize: 13,
  },
});

export default MechanicDashboardScreen;
