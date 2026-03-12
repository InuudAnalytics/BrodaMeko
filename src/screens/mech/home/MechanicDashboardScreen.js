import React, { useCallback, useMemo, useState } from 'react';
import { Animated, Image, RefreshControl, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { openSettings } from 'react-native-permissions';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Location01Icon, Mail01Icon, Notification01Icon, StarIcon, Time04Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, MechanicJobCard, NoInternetState, NotificationPermissionChip, PersonalInfoAlert, PullToRefreshIndicator, ScrollableTabs } from '../../../components';
import { LOCATION_ENABLED } from '../../../config/featureFlags';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth, useChat, useNotifications } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { getAvailableJobs, getConversationByJobId, getMechanicAssignedJob, getMechanicPendingJobRequests, respondToJobRequest, updateJobStatus } from '../../../services/jobs.service';
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

const readOwnerDisplayName = (job, fallback = 'Customer') => {
  const firstName =
    job?.car_owner?.first_name ||
    job?.owner?.first_name ||
    job?.user?.first_name ||
    '';
  const lastName =
    job?.car_owner?.last_name ||
    job?.owner?.last_name ||
    job?.user?.last_name ||
    '';
  const combined = String(`${firstName} ${lastName}`).trim();
  return (
    combined ||
    String(
      job?.owner_name ||
        job?.car_owner_name ||
        job?.customer_name ||
        job?.car_owner?.fullName ||
        job?.owner?.fullName ||
        job?.user?.fullName ||
        job?.car_owner?.full_name ||
        job?.car_owner?.name ||
        job?.owner?.full_name ||
        job?.owner?.name ||
        job?.user?.full_name ||
        job?.user?.name ||
        fallback
    ).trim()
  );
};

const readOwnerNameFromAssignedJobDetails = (response) => {
  const payload = response?.data || response || {};
  const root = payload?.data || payload || {};
  const owner = root?.car_owner || root?.owner || root?.user || {};
  return readOwnerDisplayName(
    {
      car_owner: owner,
      owner,
      user: owner,
      owner_name: owner?.full_name || owner?.fullName || owner?.name || '',
      car_owner_name: owner?.full_name || owner?.fullName || owner?.name || '',
      customer_name: owner?.full_name || owner?.fullName || owner?.name || '',
    },
    ''
  );
};

const normalizeJob = (job, fallbackStatus = '') => {
  const resolvedStatus = normalizeStatus(String(job.status || fallbackStatus || '').toLowerCase());
  const resolvedJobId =
    String(job.job_id || job.jobId || job.id || job._id || '').trim();
  const resolvedRequestId = String(job.id || job._id || '').trim();
  const ownerName = readOwnerDisplayName(job, 'Customer');
  return {
    id: resolvedRequestId || resolvedJobId,
    jobId: resolvedJobId,
    requestId: resolvedRequestId,
    ownerName,
    name: ownerName,
    ownerAvatar: job.car_owner?.avatar || job.user?.avatar || '',
    ownerId: job.car_owner?.id || job.car_owner?._id || job.user?.id || job.user?._id || '',
    issue: job.title || job.issue_type || job.description || 'Car Issue',
    description: job.description || job.title || '',
    status: resolvedStatus,
    distance: job.distance || '',
    eta: job.eta || '',
    urgent: job.priority === 'urgent' || false,
  };
};

const normalizeStatus = (status) => {
  const safe = String(status || '').trim().toLowerCase();
  if (safe === 'arrive') return 'arrived';
  if (safe === 'enroute' || safe === 'on_the_way') return 'en_route';
  if (safe === 'repairing') return 'in_progress';
  if (safe === 'done') return 'completed';
  return safe;
};

const sanitizeOutgoingMechanicStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === 'canceled') {
    return 'cancelled';
  }
  return normalized;
};

const formatStatus = value =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const getNextAction = status => {
  const normalized = normalizeStatus(status);
  const flow = ['accepted', 'en_route', 'arrived', 'in_progress', 'completed'];
  const currentIndex = flow.indexOf(normalized);

  if (currentIndex === -1) {
    return null;
  }

  if (normalized === 'completed' || normalized === 'cancelled' || normalized === 'disputed') {
    return null;
  }

  const nextStatus = flow[currentIndex + 1];
  if (!nextStatus) {
    return null;
  }

  const labels = {
    en_route: 'On my way',
    arrived: 'Arrived',
    in_progress: 'Start work',
    completed: 'Complete',
  };

  return { status: nextStatus, label: labels[nextStatus] || 'Update' };
};

const canMechanicProgressStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === 'accepted' || normalized === 'en_route' || normalized === 'arrived' || normalized === 'in_progress';
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

const readUnreadCount = (payload) => {
  const count = Number(
    payload?.unread_count ??
      payload?.data?.unread_count ??
      payload?.meta?.unread_count ??
      0,
  );
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
};

const MechanicDashboardScreen = ({ navigation }) => {
  const { user, refreshUserProfile } = useAuth();
  const { mechanicChatShortcut, setMechanicChatShortcut, clearMechanicChatShortcut } = useChat();
  const { unreadTick, permissionStatus: notificationPermissionStatus, promptPermissionIfNeeded } = useNotifications();
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
  const [refreshing, setRefreshing] = useState(false);
  const [busyRequestId, setBusyRequestId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [busyStatusJobId, setBusyStatusJobId] = useState('');
  const [busyStatusAction, setBusyStatusAction] = useState('');
  const pullDistance = React.useRef(new Animated.Value(0)).current;
  const hasAutoRequestedLocationRef = React.useRef(false);
  const refreshUserProfileRef = React.useRef(refreshUserProfile);
  const mechanicName = readMechanicName(user);
  const mechanicRating = readMechanicRating(user);
  const avatarUri = readAvatarUri(user);

  React.useEffect(() => {
    refreshUserProfileRef.current = refreshUserProfile;
  }, [refreshUserProfile]);

  React.useEffect(() => {
    if (typeof user?.is_online === 'boolean') {
      setIsOnline(Boolean(user?.is_online));
      return;
    }
    if (typeof user?.isOnline === 'boolean') {
      setIsOnline(Boolean(user?.isOnline));
    }
  }, [user?.isOnline, user?.is_online]);

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
      await promptPermissionIfNeeded?.('mechanic_accept_job');
      const canProceed = await ensureLocationPermission();
      if (!canProceed) {
        return;
      }
      const safeJobId = String(job?.jobId || '').trim();
      if (!safeJobId) {
        setError('Missing job id for this request.');
        return;
      }

      setError('');
      setBusyRequestId(String(job?.id || safeJobId));
      setBusyAction('accept');
      try {
        const response = await respondToJobRequest(safeJobId, 'accept');
        const payload = response?.data || response || {};
        let conversationId = String(payload?.conversation_id || '').trim();
        if (!conversationId) {
          try {
            const convoRes = await getConversationByJobId(safeJobId);
            const convoPayload = convoRes?.data || convoRes || {};
            const convoData = convoPayload?.data || convoPayload;
            const conversation = convoData?.conversation || convoData;
            conversationId = String(conversation?.id || conversation?._id || '').trim();
          } catch {
            // best effort fallback
          }
        }
        setJobs(prev =>
          prev.map(item =>
            item.id === job.id || item.jobId === safeJobId
              ? { ...item, status: 'accepted' }
              : item,
          ),
        );
        setActiveFilter('active');
        if (conversationId) {
          const customerName = String(job?.ownerName || job?.name || 'Customer').trim() || 'Customer';
          const customer = {
            id: job?.ownerId || null,
            name: customerName,
            initials: initialsFromName(customerName),
            avatarUri: job?.avatarUri || job?.ownerAvatar || '',
          };
          setMechanicChatShortcut({
            conversationId,
            jobId: safeJobId,
            customer,
            issueSummary: {
              issueType: job?.issue || '',
              carMake: job?.carMake || '',
            },
            progressStatus: 'accepted',
          });
          setActiveConversationId(conversationId);
          navigation.navigate(ROUTES.MECH_CHAT, {
            conversationId,
            jobId: safeJobId,
            mechanicId: user?.id || user?._id,
            customer,
            issueSummary: job,
            progressStatus: 'accepted',
          });
          return;
        }
      } catch (error) {
        setError(error?.message || 'Could not accept job.');
      } finally {
        setBusyRequestId('');
        setBusyAction('');
      }
    },
    [ensureLocationPermission, navigation, promptPermissionIfNeeded, setMechanicChatShortcut, user?._id, user?.id],
  );

  const handleDeclineJob = useCallback(async (job) => {
    const safeJobId = String(job?.jobId || '').trim();
    if (!safeJobId) {
      setError('Missing job id for this request.');
      return;
    }

    setError('');
    setBusyRequestId(String(job?.id || safeJobId));
    setBusyAction('decline');
    try {
      await respondToJobRequest(safeJobId, 'decline');
      setJobs(prev => prev.filter(item => !(item.id === job.id || item.jobId === safeJobId)));
    } catch (error) {
      setError(error?.message || 'Could not decline job.');
    } finally {
      setBusyRequestId('');
      setBusyAction('');
    }
  }, []);

  const handleAdvanceStatus = useCallback(async (job, status) => {
    const safeJobId = String(job?.jobId || '').trim();
    const currentStatus = normalizeStatus(job?.status || '');
    if (!canMechanicProgressStatus(currentStatus)) {
      setError('Status update is available only after customer accepts the quotation.');
      return;
    }
    const nextStatus = sanitizeOutgoingMechanicStatus(status);
    if (!safeJobId || !nextStatus) {
      setError('Missing job id or status.');
      return;
    }
    const allowed = new Set(['en_route', 'arrived', 'in_progress', 'cancelled', 'completed']);
    if (!allowed.has(nextStatus)) {
      setError('Invalid status transition. Refresh and try again.');
      return;
    }

    setError('');
    setBusyStatusJobId(safeJobId);
    setBusyStatusAction(nextStatus);
    try {
      await updateJobStatus(safeJobId, nextStatus);
      setJobs(prev =>
        prev.map(item => (item.jobId === safeJobId ? { ...item, status: nextStatus } : item)),
      );

      if (nextStatus === 'en_route') {
        let conversationId = '';
        if (String(mechanicChatShortcut?.jobId || '').trim() === safeJobId) {
          conversationId = String(mechanicChatShortcut?.conversationId || '').trim();
        }
        if (!conversationId) {
          try {
            const convoRes = await getConversationByJobId(safeJobId);
            const payload = convoRes?.data || convoRes || {};
            const data = payload?.data || payload;
            const convo = data?.conversation || data;
            conversationId = String(convo?.id || convo?._id || '').trim();
          } catch {
            // best effort fallback
          }
        }

        const customerName = String(job?.ownerName || job?.name || 'Customer').trim() || 'Customer';
        const customer = {
          id: job?.ownerId || null,
          name: customerName,
          initials: initialsFromName(customerName),
          avatarUri: job?.avatarUri || job?.ownerAvatar || '',
        };

        setMechanicChatShortcut({
          conversationId,
          jobId: safeJobId,
          customer,
          issueSummary: {
            issueType: job?.issue || '',
            carMake: job?.carMake || '',
          },
          progressStatus: nextStatus,
        });

        navigation.navigate(ROUTES.MECH_LIVE_TRACKING, {
          jobId: safeJobId,
          mechanicId: user?.id || user?._id || null,
          carOwnerId: customer.id,
          customer,
          conversationId,
          issueSummary: {
            issueType: job?.issue || '',
            carMake: job?.carMake || '',
          },
          trackingStatus: nextStatus,
          progressStatus: nextStatus,
        });
      }

      if (nextStatus === 'completed' || nextStatus === 'cancelled' || nextStatus === 'disputed') {
        clearMechanicChatShortcut();
      }
    } catch (statusError) {
      setError(statusError?.message || 'Could not update status.');
    } finally {
      setBusyStatusJobId('');
      setBusyStatusAction('');
    }
  }, [
    clearMechanicChatShortcut,
    mechanicChatShortcut?.conversationId,
    mechanicChatShortcut?.jobId,
    navigation,
    setMechanicChatShortcut,
    user?._id,
    user?.id,
  ]);

  const visibleJobs = useMemo(() => {
    const status = String(activeFilter || '').toLowerCase();
    const availableStatuses = new Set(['pending', 'available', 'open', 'request']);
    const activeStatuses = new Set(['accepted', 'in_progress', 'en_route', 'arrived']);
    const completedStatuses = new Set(['completed', 'cancelled', 'disputed']);

    if (status === 'active') {
      return jobs.filter((job) => activeStatuses.has(job?.status));
    }
    if (status === 'completed') {
      return jobs.filter((job) => completedStatuses.has(job?.status));
    }
    return jobs.filter((job) => availableStatuses.has(job?.status) || !job?.status);
  }, [activeFilter, jobs]);

  const shortcutAvatarUri = normalizeAvatarUri(
    mechanicChatShortcut?.customer?.avatarUri ||
      mechanicChatShortcut?.customer?.avatar ||
      ''
  );
  const shortcutInitial = String(
    mechanicChatShortcut?.customer?.initials ||
      mechanicChatShortcut?.customer?.name ||
      'C'
  )
    .trim()
    .charAt(0)
    .toUpperCase() || 'C';

  const handleOpenFloatingChat = useCallback(() => {
    const conversationId = String(mechanicChatShortcut?.conversationId || '').trim();
    const jobId = String(mechanicChatShortcut?.jobId || '').trim();
    if (!conversationId || !jobId) {
      return;
    }

    navigation.navigate(ROUTES.MECH_CHAT, {
      conversationId,
      jobId,
      mechanicId: user?.id || user?._id || null,
      customer: mechanicChatShortcut?.customer || null,
      issueSummary: mechanicChatShortcut?.issueSummary || null,
      progressStatus: mechanicChatShortcut?.progressStatus || '',
    });
  }, [mechanicChatShortcut, navigation, user?._id, user?.id]);

  const resolveActiveJob = useCallback((jobList) => {
    const activeStatuses = new Set(['accepted', 'in_progress', 'en_route', 'arrived']);
    return jobList.find((job) => activeStatuses.has(normalizeStatus(job.status)));
  }, []);

  const enrichMissingOwnerNames = useCallback(async (jobList) => {
    const targets = (Array.isArray(jobList) ? jobList : []).filter((job) => {
      const jobId = String(job?.jobId || '').trim();
      const ownerName = String(job?.ownerName || job?.name || '').trim();
      return Boolean(jobId) && (!ownerName || ownerName.toLowerCase() === 'customer');
    });

    if (!targets.length) {
      return;
    }

    const detailResults = await Promise.all(
      targets.map(async (job) => {
        const jobId = String(job?.jobId || '').trim();
        try {
          const details = await getMechanicAssignedJob(jobId);
          const ownerName = readOwnerNameFromAssignedJobDetails(details);
          return { jobId, ownerName };
        } catch {
          return { jobId, ownerName: '' };
        }
      })
    );

    const nameByJobId = new Map(
      detailResults
        .filter((entry) => String(entry?.ownerName || '').trim())
        .map((entry) => [String(entry.jobId).trim(), String(entry.ownerName).trim()])
    );

    if (!nameByJobId.size) {
      return;
    }

    setJobs((prev) => {
      const next = prev.map((job) => {
        const jobId = String(job?.jobId || '').trim();
        const ownerName = nameByJobId.get(jobId);
        if (!ownerName) {
          return job;
        }
        return {
          ...job,
          ownerName,
          name: ownerName,
        };
      });
      setActiveJob(resolveActiveJob(next) || null);
      return next;
    });
  }, [resolveActiveJob]);

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
              enrichMissingOwnerNames(mergedJobs);
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
            refreshUserProfileRef.current?.()
              .then((profileRes) => {
                const nextOnline =
                  typeof profileRes?.is_online === 'boolean'
                    ? profileRes?.is_online
                    : typeof profileRes?.isOnline === 'boolean'
                      ? profileRes?.isOnline
                      : null;
                if (typeof nextOnline === 'boolean') {
                  setIsOnline(nextOnline);
                }
              })
              .catch(() => null);
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
    }, [enrichMissingOwnerNames, resolveActiveJob])
  );

  useFocusEffect(
    useCallback(() => {
      promptPermissionIfNeeded?.('mechanic_dashboard_focus');
      return undefined;
    }, [promptPermissionIfNeeded])
  );

  React.useEffect(() => {
    const locationStatus = String(permissionStatus || '').toLowerCase();
    const notifStatus = String(notificationPermissionStatus || '').toLowerCase();
    if (!LOCATION_ENABLED) {
      return;
    }
    if (locationStatus !== 'unknown') {
      return;
    }
    if (notifStatus === 'unknown') {
      return;
    }
    if (hasAutoRequestedLocationRef.current) {
      return;
    }
    hasAutoRequestedLocationRef.current = true;
    requestPermission();
  }, [notificationPermissionStatus, permissionStatus, requestPermission]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchUnread = async () => {
        try {
          const response = await getNotifications({ page: 1, limit: 1 });
          const payload = response || {};
          if (active) setUnreadCount(readUnreadCount(payload));
        } catch {
          if (active) setUnreadCount(0);
        }
      };

      fetchUnread(unreadTick);

      return () => {
        active = false;
      };
    }, [unreadTick])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError('');
    try {
      const [walletRes, jobsRes, pendingRes, earningsRes, unreadRes] = await Promise.all([
        getWalletBalance().catch(() => null),
        getAvailableJobs({ page: 1, limit: 100 }).catch(() => null),
        getMechanicPendingJobRequests().catch(() => null),
        getMechanicEarnings().catch(() => null),
        getNotifications({ page: 1, limit: 1 }).catch(() => null),
      ]);

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
        enrichMissingOwnerNames(mergedJobs);
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

      if (unreadRes) {
        const unreadPayload = unreadRes || {};
        setUnreadCount(readUnreadCount(unreadPayload));
      }
      refreshUserProfileRef.current?.()
        .then((profileRes) => {
          const nextOnline =
            typeof profileRes?.is_online === 'boolean'
              ? profileRes?.is_online
              : typeof profileRes?.isOnline === 'boolean'
                ? profileRes?.isOnline
                : null;
          if (typeof nextOnline === 'boolean') {
            setIsOnline(nextOnline);
          }
        })
        .catch(() => null);
    } catch {
      setError('Could not refresh dashboard.');
    } finally {
      setRefreshing(false);
    }
  }, [enrichMissingOwnerNames, resolveActiveJob]);

  return (
    <View style={styles.root}>
      <PersonalInfoAlert />
      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
        <Animated.ScrollView
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const offsetY = event.nativeEvent?.contentOffset?.y || 0;
            const pullValue = offsetY < 0 ? Math.min(120, -offsetY) : 0;
            pullDistance.setValue(pullValue);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkTheme.colors.accent}
              colors={[darkTheme.colors.accent]}
              progressBackgroundColor={darkTheme.colors.background}
            />
          }
        >
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
      <NotificationPermissionChip style={styles.notificationChip} />

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
          <NoInternetState message={error} onRetry={handleRefresh} style={styles.jobsErrorState} />
        ) : visibleJobs.length === 0 ? (
          <AppText style={styles.jobsStateText}>No jobs available at the moment.</AppText>
        ) : (
          visibleJobs.map((job) => (
            <MechanicJobCard
              key={job.id}
              jobId={job.jobId}
              name={job.name}
              issue={job.issue}
              avatarUri={job.avatarUri || job.ownerAvatar || ''}
              urgent={job.urgent}
              distanceText={job.distance}
              etaText={job.eta}
              actions={(() => {
                const normalizedStatus = normalizeStatus(job.status);
                const isFinal = normalizedStatus === 'completed' || normalizedStatus === 'cancelled' || normalizedStatus === 'disputed';
                const nextAction = getNextAction(normalizedStatus);
                const isRequestBusy = busyRequestId === job.id && Boolean(busyAction);
                const isStatusBusy = busyStatusJobId === job.jobId && Boolean(busyStatusAction);
                const disableAll = isRequestBusy || isStatusBusy;

                if (activeFilter === 'available') {
                  return (
                    <View style={styles.jobActions}>
                      <AppButton
                        label={isRequestBusy && busyAction === 'accept' ? 'Accepting...' : 'Accept job'}
                        onPress={() => handleAcceptJob(job)}
                        disabled={disableAll}
                        style={[styles.actionBtn, styles.acceptBtn]}
                        textStyle={styles.acceptBtnText}
                      />
                      <AppButton
                        label={isRequestBusy && busyAction === 'decline' ? 'Declining...' : 'Decline'}
                        onPress={() => handleDeclineJob(job)}
                        disabled={disableAll}
                        style={[styles.actionBtn, styles.cancelBtn]}
                        textStyle={styles.cancelBtnText}
                      />
                    </View>
                  );
                }

                if (isFinal) {
                  return (
                    <View style={[styles.finalBadge, normalizedStatus === 'cancelled' ? styles.finalBadgeCancelled : null]}>
                      <AppText
                        style={[
                          styles.finalBadgeText,
                          normalizedStatus === 'cancelled'
                            ? styles.finalBadgeTextCancelled
                            : styles.finalBadgeTextCompleted,
                        ]}
                      >
                        {formatStatus(normalizedStatus)}
                      </AppText>
                    </View>
                  );
                }

                return (
                  <View style={styles.jobActions}>
                    <AppButton
                      label={
                        isStatusBusy && busyStatusAction === nextAction?.status
                          ? 'Updating...'
                          : canMechanicProgressStatus(normalizedStatus)
                          ? nextAction?.label || 'Update'
                          : 'Awaiting acceptance'
                      }
                      onPress={() => nextAction?.status && handleAdvanceStatus(job, nextAction.status)}
                      disabled={disableAll || !nextAction?.status || !canMechanicProgressStatus(normalizedStatus)}
                      style={[styles.actionBtn, styles.acceptBtn]}
                      textStyle={styles.acceptBtnText}
                    />
                    <AppButton
                      label={isStatusBusy && busyStatusAction === 'cancelled' ? 'Updating...' : 'Cancel'}
                      onPress={() => handleAdvanceStatus(job, 'cancelled')}
                      disabled={disableAll}
                      style={[styles.actionBtn, styles.cancelBtn]}
                      textStyle={styles.cancelBtnText}
                    />
                  </View>
                );
              })()}
            />
          ))
        )}
      </View>
        </Animated.ScrollView>
      </View>
      {mechanicChatShortcut?.conversationId ? (
        <TouchableOpacity
          style={styles.floatingChatBtn}
          activeOpacity={0.9}
          onPress={handleOpenFloatingChat}
        >
          {shortcutAvatarUri ? (
            <Image source={{ uri: shortcutAvatarUri }} style={styles.floatingChatAvatarImage} />
          ) : (
            <View style={styles.floatingChatAvatarFallback}>
              <AppText style={styles.floatingChatAvatarText}>{shortcutInitial}</AppText>
            </View>
          )}
          <View style={styles.floatingChatBadge}>
            <HugeiconsIcon icon={Mail01Icon} size={12} color="#1A1A1A" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listWrap: {
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
  notificationChip: {
    marginBottom: 12,
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
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: darkTheme.colors.background,
    zIndex: 2,
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
  jobsErrorState: {
    marginTop: 8,
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
  finalBadge: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(64,198,122,0.5)',
    backgroundColor: 'rgba(64,198,122,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finalBadgeCancelled: {
    borderColor: 'rgba(255,123,138,0.6)',
    backgroundColor: 'rgba(255,123,138,0.15)',
  },
  finalBadgeText: {
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  finalBadgeTextCompleted: {
    color: '#40C67A',
  },
  finalBadgeTextCancelled: {
    color: '#FF7B8A',
  },
  floatingChatBtn: {
    position: 'absolute',
    right: 16,
    bottom: 86,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: withAlpha(darkTheme.colors.accent, 0.6),
    backgroundColor: '#202631',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 35,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  floatingChatAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    resizeMode: 'cover',
  },
  floatingChatAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.2),
  },
  floatingChatAvatarText: {
    color: darkTheme.colors.accent,
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  floatingChatBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10151D',
  },
});

export default MechanicDashboardScreen;
