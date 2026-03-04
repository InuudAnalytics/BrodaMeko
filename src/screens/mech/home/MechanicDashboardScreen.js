import React, { useCallback, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { openSettings } from 'react-native-permissions';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Mail01Icon, Notification01Icon, StarIcon, Time04Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, PersonalInfoAlert, ScrollableTabs } from '../../../components';
import { LOCATION_ENABLED } from '../../../config/featureFlags';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth, useNotifications } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { getAvailableJobs, getConversationByJobId, getMechanicPendingJobRequests, respondToJobRequest } from '../../../services/jobs.service';
import { getNotifications } from '../../../services/notifications.service';
import { getMechanicEarnings, setMechanicOnlineStatus } from '../../../services/mechanic.service';
import { getWalletBalance } from '../../../services/wallet.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROUTES } from '../../../utils';

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

const normalizeJob = (job, fallbackStatus = '') => {
  const resolvedStatus = String(job.status || fallbackStatus || '').toLowerCase();
  return {
    id: job.id || job._id,
    jobId: String(job.id || job._id || job.job_id || job.jobId || '').trim(),
    name: job.car_owner?.name || job.user?.name || 'Customer',
    ownerId: job.car_owner?.id || job.car_owner?._id || job.user?.id || job.user?._id || '',
    issue: job.title || job.issue_type || job.description || 'Car Issue',
    description: job.description || job.title || '',
    status: resolvedStatus,
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
  const value = Number(
    user?.rating_summary?.avg_rating ??
      user?.avg_rating ??
      user?.average_rating ??
      user?.rating ??
      0
  );
  return Number.isFinite(value) ? value : 0;
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
  const { unreadTick } = useNotifications();
  const { permissionStatus, requestPermission } = useUserLocation();
  const [activeFilter, setActiveFilter] = useState('available');
  const [walletBalance, setWalletBalance] = useState(0);
  const [earnings, setEarnings] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    allTime: 0,
    pendingRelease: 0,
  });
  const [jobs, setJobs] = useState([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(Boolean(user?.is_online ?? user?.isOnline));
  const [activeJob, setActiveJob] = useState(null);
  const [activeConversationId, setActiveConversationId] = useState('');
  const mechanicName = readMechanicName(user);
  const mechanicRating = readMechanicRating(user);
  const avatarUri = readAvatarUri(user);

  const handleToggleOnline = useCallback(async (value) => {
    setIsOnline(value);
    try {
      const response = await setMechanicOnlineStatus(value);
      const payload = response?.data || response || {};
      if (typeof payload?.is_online === 'boolean') {
        setIsOnline(payload.is_online);
      }
    } catch (error) {
      setError(error?.message || 'Could not update online status.');
    }
  }, []);

  const ensureLocationPermission = useCallback(async () => {
    if (!LOCATION_ENABLED) {
      return true;
    }

    const status =
      permissionStatus === 'granted'
        ? permissionStatus
        : await requestPermission();

    if (status === 'granted') {
      return true;
    }

    if (status === 'blocked') {
      openSettings();
    }

    setError('Please enable location access before accepting a job.');
    return false;
  }, [permissionStatus, requestPermission]);

  const handleAcceptJob = useCallback(
    async (job) => {
      const canProceed = await ensureLocationPermission();
      if (!canProceed) {
        return;
      }
      const safeJobId = String(job?.jobId || job?.id || '').trim();
      if (!safeJobId) {
        setError('Missing job id for this request.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const response = await respondToJobRequest(safeJobId, 'accept');
        const payload = response?.data || response || {};
        const conversationId = String(payload?.conversation_id || '').trim();
        if (conversationId) {
          setActiveConversationId(conversationId);
        }
        const refreshed = await getAvailableJobs({ page: 1, limit: 100 }).catch(() => null);
        if (refreshed) {
          const refreshedPayload = refreshed?.data || refreshed;
          const rawJobs = Array.isArray(refreshedPayload)
            ? refreshedPayload
            : (refreshedPayload?.jobs || refreshedPayload?.items || refreshedPayload?.results || []);
          const mappedAssigned = rawJobs.map((jobItem) => normalizeJob(jobItem));
          setJobs((prev) => {
            const pending = prev.filter((item) => item.status === 'pending');
            return [...pending, ...mappedAssigned];
          });
        }
      } catch (error) {
        setError(error?.message || 'Could not accept job.');
      } finally {
        setLoading(false);
      }
    },
    [ensureLocationPermission],
  );

  const visibleJobs = useMemo(() => {
    const status = String(activeFilter || '').toLowerCase();
    const availableStatuses = new Set(['pending', 'available', 'open', 'request']);
    const activeStatuses = new Set(['accepted', 'active', 'in_progress', 'repairing', 'en_route', 'arrived']);
    const completedStatuses = new Set(['completed', 'done']);

    if (status === 'active') {
      return jobs.filter((job) => activeStatuses.has(job?.status));
    }
    if (status === 'completed') {
      return jobs.filter((job) => completedStatuses.has(job?.status));
    }
    return jobs.filter((job) => availableStatuses.has(job?.status) || !job?.status);
  }, [activeFilter, jobs]);

  const resolveActiveJob = useCallback((jobList) => {
    const activeStatuses = new Set(['accepted', 'active', 'in_progress', 'repairing', 'en_route', 'arrived']);
    return jobList.find((job) => activeStatuses.has(job.status));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchData = async () => {
        try {
          const [walletRes, jobsRes, pendingRes, earningsRes] = await Promise.all([
            getWalletBalance().catch(() => null),
            getAvailableJobs({ page: 1, limit: 100 }).catch(() => null),
            getMechanicPendingJobRequests().catch(() => null),
            getMechanicEarnings().catch(() => null),
          ]);

          if (active) {
            if (walletRes) {
              const walletPayload = walletRes?.data || walletRes;
              setWalletBalance(Number(walletPayload?.balance || walletPayload?.available_balance || 0));
            }
            if (earningsRes) {
              const earningsPayload = earningsRes?.data || earningsRes || {};
              const earningsData = earningsPayload?.data || earningsPayload;
              const earningsInfo = earningsData?.earnings || {};
              const jobsInfo = earningsData?.jobs || {};
              setEarnings({
                today: Number(earningsInfo?.today || 0),
                thisWeek: Number(earningsInfo?.this_week || earningsInfo?.thisWeek || 0),
                thisMonth: Number(earningsInfo?.this_month || earningsInfo?.thisMonth || 0),
                allTime: Number(earningsInfo?.all_time || earningsInfo?.allTime || 0),
                pendingRelease: Number(earningsInfo?.pending_release || earningsInfo?.pendingRelease || 0),
              });
              if (Number.isFinite(Number(earningsData?.wallet_balance))) {
                setWalletBalance(Number(earningsData?.wallet_balance || 0));
              }
              if (Number.isFinite(Number(jobsInfo?.total))) {
                setTotalJobs(Number(jobsInfo?.total || 0));
              }
            }
            if (jobsRes) {
              const jobsPayload = jobsRes?.data || jobsRes;
              const rawJobs = Array.isArray(jobsPayload)
                ? jobsPayload
                : (jobsPayload?.jobs || jobsPayload?.items || jobsPayload?.results || []);
              const mappedAssigned = rawJobs.map((job) => normalizeJob(job));
              const pendingPayload = pendingRes?.data || pendingRes;
              const pendingRaw = Array.isArray(pendingPayload)
                ? pendingPayload
                : (pendingPayload?.jobs || pendingPayload?.items || pendingPayload?.results || pendingPayload?.data || []);
              const mappedPending = pendingRaw.map((job) => normalizeJob(job, 'pending'));
              const mergedJobs = [...mappedPending, ...mappedAssigned];
              setJobs(mergedJobs);
              setTotalJobs(Number(jobsPayload?.total || rawJobs.length || 0));
              const currentActive = resolveActiveJob(mergedJobs);
              setActiveJob(currentActive || null);
              if (currentActive?.jobId) {
                try {
                  const convoRes = await getConversationByJobId(currentActive.jobId);
                  const payload = convoRes?.data || convoRes || {};
                  const data = payload?.data || payload;
                  const convo = data?.conversation || data;
                  const conversationId = String(convo?.id || convo?._id || '').trim();
                  setActiveConversationId(conversationId);
                } catch {
                  setActiveConversationId('');
                }
              } else {
                setActiveConversationId('');
              }
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
    }, [resolveActiveJob])
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
    }, [unreadTick])
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
              <AppText style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</AppText>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: 'rgba(255,255,255,0.18)', true: withAlpha(darkTheme.colors.accent, 0.55) }}
              thumbColor={isOnline ? darkTheme.colors.accent : '#D9D9D9'}
            />
          </View>
        </View>
        <AppText style={styles.earningsAmount}>{formatCurrency(earnings.today)}</AppText>
        <AppText style={styles.trendText}>This week: {formatCurrency(earnings.thisWeek)}</AppText>
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

      {activeJob && activeJob.jobId && activeConversationId ? (
        <View style={styles.activeJobCard}>
          <View style={styles.activeJobHeader}>
            <AppText style={styles.activeJobTitle}>Active job</AppText>
            <View style={styles.activeJobPill}>
              <AppText style={styles.activeJobPillText}>{activeJob.status || 'Active'}</AppText>
            </View>
          </View>
          <AppText style={styles.activeJobIssue} numberOfLines={2}>
            {activeJob.issue}
          </AppText>
          {activeJob.description ? (
            <AppText style={styles.activeJobDesc} numberOfLines={2}>
              {activeJob.description}
            </AppText>
          ) : null}
          <View style={styles.activeJobMeta}>
            <HugeiconsIcon icon={Location01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2} />
            <AppText style={styles.activeJobMetaText}>{activeJob.distance || 'Distance updating'}</AppText>
            <HugeiconsIcon icon={Time04Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2} />
            <AppText style={styles.activeJobMetaText}>{activeJob.eta || 'ETA updating'}</AppText>
          </View>
          <View style={styles.activeJobActions}>
            <TouchableOpacity
              style={[
                styles.activeJobChat,
                !activeConversationId ? styles.activeJobChatDisabled : null,
              ]}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate(ROUTES.MECH_CHAT, {
                  conversationId: activeConversationId,
                  jobId: activeJob.jobId,
                  mechanicId: user?.id || user?._id,
                  customer: {
                    id: activeJob.ownerId,
                    name: activeJob.name,
                    initials: initialsFromName(activeJob.name),
                  },
                })
              }
              disabled={!activeConversationId}
            >
              <HugeiconsIcon icon={Mail01Icon} size={16} color={darkTheme.colors.accent} strokeWidth={2} />
              <AppText style={styles.activeJobChatText}>Chat</AppText>
            </TouchableOpacity>
            <AppButton
              label="Live tracking"
              onPress={() =>
                navigation.navigate(ROUTES.MECH_LIVE_TRACKING, {
                  jobId: activeJob.jobId,
                  mechanicId: user?.id || user?._id,
                  carOwnerId: activeJob.ownerId,
                  carOwnerName: activeJob.name,
                  conversationId: activeConversationId,
                  issueSummary: activeJob.issue,
                })
              }
              style={styles.activeJobTrackBtn}
              textStyle={styles.activeJobTrackText}
            />
          </View>
        </View>
      ) : null}

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
                    onPress={() => handleAcceptJob(job)}
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
  activeJobCard: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: withAlpha(darkTheme.colors.accent, 0.75),
    backgroundColor: 'rgba(255,255,255,0.04)',
    shadowColor: darkTheme.colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  activeJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeJobTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  activeJobPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.2),
  },
  activeJobPillText: {
    color: darkTheme.colors.accent,
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  activeJobIssue: {
    marginTop: 8,
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  activeJobDesc: {
    marginTop: 4,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  activeJobMeta: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  activeJobMetaText: {
    color: darkTheme.colors.muted,
    fontSize: 11,
  },
  activeJobActions: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  activeJobChat: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.7),
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
    justifyContent: 'center',
  },
  activeJobChatText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  activeJobChatDisabled: {
    opacity: 0.5,
  },
  activeJobTrackBtn: {
    flex: 1,
    minHeight: 40,
  },
  activeJobTrackText: {
    color: '#1A1A1A',
    fontSize: 12,
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
