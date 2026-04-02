import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { openSettings } from 'react-native-permissions';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Mail01Icon } from '@hugeicons/core-free-icons';
import {
  AppButton,
  NoInternetState,
  AppText,
  CenteredHeader,
  MechanicJobCard,
  PullToRefreshIndicator,
  ScreenContainer,
  ScrollableTabs,
} from '../../../components';
import { LOCATION_ENABLED } from '../../../config/featureFlags';
import { useUserLocation } from '../../../hooks/useUserLocation';
import {
  getConversationByJobId,
  getMechanicAssignedJobs,
  getMechanicPendingJobRequests,
  respondToJobRequest,
  updateJobStatus,
} from '../../../services/jobs.service';
import { useChat } from '../../../context';
import { useNotifications } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const TABS = [
  { key: 'available', label: 'Available jobs' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

// mechanic_completed = mechanic marked done, awaiting car owner confirmation
const COMPLETED_STATUSES = new Set(['completed', 'mechanic_completed']);
const FINAL_STATUSES = new Set(['completed', 'mechanic_completed', 'cancelled', 'disputed']);

const readOwnerName = (item, fallback = 'Customer') => {
  const firstName =
    item?.car_owner?.first_name ||
    item?.owner?.first_name ||
    item?.user?.first_name ||
    '';
  const lastName =
    item?.car_owner?.last_name ||
    item?.owner?.last_name ||
    item?.user?.last_name ||
    '';
  const combined = String(`${firstName} ${lastName}`).trim();

  return String(
    combined ||
      item?.owner_name ||
      item?.customer_name ||
      item?.car_owner_name ||
      item?.car_owner?.full_name ||
      item?.car_owner?.name ||
      item?.owner?.full_name ||
      item?.owner?.name ||
      item?.user?.full_name ||
      item?.user?.name ||
      fallback,
  ).trim();
};

const readList = response => {
  const payload = response?.data || response || {};
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.jobs)) {
    return payload.jobs;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
};

const normalizePendingRequest = (item, index) => ({
  id: String(item?.id || `pending-${index}`),
  jobId: String(item?.job_id || item?.jobId || ''),
  ownerId: item?.car_owner?.id || item?.car_owner?._id || item?.owner?.id || item?.owner?._id || item?.user?.id || item?.user?._id || '',
  ownerName: readOwnerName(item, 'Car owner'),
  issue: String(item?.issue_type || item?.title || 'Car issue'),
  carMake: String(item?.car_make || ''),
  avatarUri: String(item?.owner_avatar || item?.car_owner?.avatar || '').trim(),
  ownerAvatar: String(item?.owner_avatar || item?.car_owner?.avatar || '').trim(),
  urgent: String(item?.priority || '').toLowerCase() === 'urgent',
  status: normalizeStatus(String(item?.status || 'pending').toLowerCase()),
  distanceText: String(item?.distance_text || item?.distance || item?.distance_km || '').trim(),
  etaText: String(item?.eta_text || item?.eta || item?.estimated_time || '').trim(),
});

const normalizeAssignedJob = (item, index) => ({
  id: String(item?.id || item?._id || item?.job_id || `job-${index}`),
  ownerId: item?.car_owner?.id || item?.car_owner?._id || item?.owner?.id || item?.owner?._id || item?.user?.id || item?.user?._id || '',
  ownerName: readOwnerName(item, 'Customer'),
  issue: String(item?.issue_type || item?.title || 'Car issue'),
  carMake: String(item?.car_make || ''),
  status: normalizeStatus(String(item?.status || '').toLowerCase()),
  urgent: String(item?.priority || '').toLowerCase() === 'urgent',
  avatarUri: String(item?.owner_avatar || item?.car_owner?.avatar || item?.owner?.avatar || item?.user?.avatar || '').trim(),
  ownerAvatar: String(item?.owner_avatar || item?.car_owner?.avatar || item?.owner?.avatar || item?.user?.avatar || '').trim(),
  distanceText: String(item?.distance_text || item?.distance || item?.distance_km || '').trim(),
  etaText: String(item?.eta_text || item?.eta || item?.estimated_time || '').trim(),
});

const normalizeStatus = status => {
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

const normalizeAvatarUri = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  if (/^(https?:\/\/|file:|content:|data:|asset:)/i.test(raw)) {
    return raw;
  }
  return raw;
};

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

const canMechanicProgressStatus = status => {
  const normalized = normalizeStatus(status);
  return normalized === 'accepted' || normalized === 'en_route' || normalized === 'arrived' || normalized === 'in_progress';
};

const JobCard = ({
  item,
  tab,
  busyAction,
  onAccept,
  onDecline,
  onAdvance,
  onCancel,
}) => {
  const normalizedStatus = normalizeStatus(item.status);
  const nextAction = getNextAction(normalizedStatus);
  const canProgress = canMechanicProgressStatus(normalizedStatus);
  const isFinal = FINAL_STATUSES.has(normalizedStatus);
  const distance = item.distanceText ? `${item.distanceText} away` : '';
  const eta = item.etaText ? `${item.etaText}` : '';

  return (
    <MechanicJobCard
      jobId={item.jobId || item.id}
      name={item.ownerName}
      issue={item.issue}
      carMake={item.carMake}
      avatarUri={item.avatarUri}
      urgent={item.urgent}
      distanceText={distance}
      etaText={eta}
      actions={
        tab === 'available' ? (
          <View style={styles.buttonRow}>
            <AppButton
              label={busyAction === 'accept' ? 'Accepting...' : 'Accept job'}
              onPress={() => onAccept(item)}
              disabled={Boolean(busyAction)}
              style={styles.acceptBtn}
            />
            <AppButton
              label={busyAction === 'decline' ? 'Declining...' : 'Decline'}
              onPress={() => onDecline(item)}
              disabled={Boolean(busyAction)}
              style={styles.declineBtn}
              textStyle={styles.declineBtnText}
            />
          </View>
        ) : isFinal ? (
          <View
            style={[
              styles.finalBadge,
              normalizedStatus === 'cancelled' ? styles.finalBadgeCancelled : null,
            ]}
          >
            <AppText
              style={[
                styles.finalBadgeText,
                normalizedStatus === 'cancelled'
                  ? styles.finalBadgeTextCancelled
                  : styles.finalBadgeTextCompleted,
              ]}
            >
              {normalizedStatus === 'mechanic_completed' ? 'Pending Confirmation' : formatStatus(normalizedStatus)}
            </AppText>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <AppButton
              label={busyAction === nextAction?.status ? 'Updating...' : canProgress ? nextAction?.label || 'Update' : 'Awaiting acceptance'}
              onPress={() => nextAction?.status && onAdvance(item, nextAction.status)}
              disabled={Boolean(busyAction) || !nextAction?.status || !canProgress}
              style={styles.acceptBtn}
            />
            <AppButton
              label={busyAction === 'cancelled' ? 'Updating...' : 'Cancel'}
              onPress={() => onCancel(item)}
              disabled={Boolean(busyAction)}
              style={styles.declineBtn}
              textStyle={styles.declineBtnText}
            />
          </View>
        )
      }
    />
  );
};

const MechanicJobsScreen = ({ navigation, route, onBackToHome }) => {
  const { mechanicChatShortcut, setMechanicChatShortcut, clearMechanicChatShortcut } = useChat();
  const { promptPermissionIfNeeded } = useNotifications();
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [busyRequestId, setBusyRequestId] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [busyStatusJobId, setBusyStatusJobId] = useState('');
  const [busyStatusAction, setBusyStatusAction] = useState('');
  const pullDistance = useRef(new Animated.Value(0)).current;
  // Jobs accepted this session that may not yet appear in getMechanicAssignedJobs.
  // Cleared once the backend confirms the job (or it reaches a final status).
  const localAcceptedRef = useRef([]);
  const { permissionStatus, requestPermission } = useUserLocation();

  const requestedJobId = String(route?.params?.requestJobId || '').trim();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [pendingRes, assignedRes] = await Promise.all([
        getMechanicPendingJobRequests(),
        getMechanicAssignedJobs({ page: 1, limit: 100 }),
      ]);

      const pending = readList(pendingRes).map(normalizePendingRequest);
      const assigned = readList(assignedRes).map(normalizeAssignedJob);

      // Prune locally-cached accepted jobs that are now confirmed by the backend
      // or have reached a final status.
      const backendIds = new Set(assigned.map(j => j.id));
      localAcceptedRef.current = localAcceptedRef.current.filter(
        j => !backendIds.has(j.id) && !FINAL_STATUSES.has(j.status),
      );

      const backendActive = assigned.filter(item => !COMPLETED_STATUSES.has(item.status));
      // Inject any locally-accepted jobs the backend hasn't confirmed yet.
      const mergedActive = [
        ...backendActive,
        ...localAcceptedRef.current.filter(j => !backendIds.has(j.id)),
      ];

      setPendingRequests(pending);
      setActiveJobs(mergedActive);
      setCompletedJobs(
        assigned.filter(item => COMPLETED_STATUSES.has(item.status)),
      );
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load jobs.');
      setPendingRequests([]);
      setActiveJobs([]);
      setCompletedJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      if (requestedJobId) {
        setActiveTab('available');
      }
    }, [fetchData, requestedJobId]),
  );

  const handleRespond = async (item, action) => {
    const safeJobId = String(item?.jobId || '').trim();
    if (!safeJobId || busyRequestId) {
      return;
    }

    if (action === 'accept') {
      await promptPermissionIfNeeded?.('mechanic_jobs_accept_job');
    }

    if (action === 'accept' && LOCATION_ENABLED) {
      const status =
        permissionStatus === 'granted'
          ? permissionStatus
          : await requestPermission();

      if (status !== 'granted') {
        if (status === 'blocked') {
          openSettings();
        }
        setError('Please enable location access before accepting a job.');
        return;
      }
    }

    setBusyRequestId(item.id);
    setBusyAction(action);
    try {
      const response = await respondToJobRequest(safeJobId, action);
      if (action === 'accept') {
        // Optimistically add the accepted job to the active list so it shows
        // immediately when the mechanic returns from chat, even if the backend
        // hasn't moved it to getMechanicAssignedJobs yet (pre-quotation window).
        const optimisticJob = {
          id: safeJobId,
          ownerId: item.ownerId || '',
          ownerName: item.ownerName,
          issue: item.issue,
          carMake: item.carMake,
          // 'awaiting_quotation' is a local-only status — not in the flow array,
          // so canMechanicProgressStatus returns false → shows "Awaiting acceptance"
          // (disabled). Replaced by the real status once backend confirms.
          status: 'awaiting_quotation',
          urgent: item.urgent,
          avatarUri: item.avatarUri,
          ownerAvatar: item.ownerAvatar,
          distanceText: item.distanceText,
          etaText: item.etaText,
        };
        localAcceptedRef.current = [
          ...localAcceptedRef.current.filter(j => j.id !== safeJobId),
          optimisticJob,
        ];

        const payload = response?.data || response || {};
        let conversationId = String(payload?.conversation_id || payload?.conversationId || '').trim();
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

        if (conversationId) {
          const customer = {
            id: item?.ownerId || null,
            name: item?.ownerName || 'Customer',
            initials: String(item?.ownerName || 'C').trim().charAt(0).toUpperCase() || 'C',
            avatarUri: item?.avatarUri || item?.ownerAvatar || '',
          };

          setMechanicChatShortcut({
            conversationId,
            jobId: safeJobId,
            customer,
            issueSummary: {
              issueType: item?.issue || '',
              carMake: item?.carMake || '',
            },
            progressStatus: 'accepted',
          });

          navigation.navigate(ROUTES.MECH_CHAT, {
            conversationId,
            jobId: safeJobId,
            mechanicId: null,
            customer,
            issueSummary: {
              issueType: item?.issue || '',
              carMake: item?.carMake || '',
            },
            progressStatus: 'accepted',
          });
        }

        setActiveTab('active');
        await fetchData();
      } else {
        await fetchData();
      }
    } catch (respondError) {
      setError(respondError?.message || `Could not ${action} request.`);
    } finally {
      setBusyRequestId('');
      setBusyAction('');
    }
  };

  const handleStatusUpdate = async (item, status) => {
    const safeJobId = String(item?.id || item?.jobId || '').trim();
    if (!safeJobId || busyStatusJobId) {
      return;
    }
    const currentStatus = normalizeStatus(item?.status || '');
    if (!canMechanicProgressStatus(currentStatus)) {
      setError('Status update is available only after customer accepts the quotation.');
      return;
    }
    const safeStatus = sanitizeOutgoingMechanicStatus(status);
    const allowed = new Set(['en_route', 'arrived', 'in_progress', 'cancelled', 'completed']);
    if (!allowed.has(safeStatus)) {
      setError('Invalid status transition. Refresh and try again.');
      return;
    }

    setBusyStatusJobId(safeJobId);
    setBusyStatusAction(safeStatus);

    try {
      await updateJobStatus(safeJobId, safeStatus);
      const normalized = String(safeStatus || '').trim().toLowerCase();

      if (normalized === 'en_route') {
        let conversationId = '';
        if (String(mechanicChatShortcut?.jobId || '').trim() === safeJobId) {
          conversationId = String(mechanicChatShortcut?.conversationId || '').trim();
        }
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

        const customer = {
          id: item?.ownerId || null,
          name: item?.ownerName || 'Customer',
          initials: String(item?.ownerName || 'C').trim().charAt(0).toUpperCase() || 'C',
          avatarUri: item?.avatarUri || item?.ownerAvatar || '',
        };

        setMechanicChatShortcut({
          conversationId,
          jobId: safeJobId,
          customer,
          issueSummary: {
            issueType: item?.issue || '',
            carMake: item?.carMake || '',
          },
          progressStatus: normalized,
        });

        navigation.navigate(ROUTES.MECH_LIVE_TRACKING, {
          jobId: safeJobId,
          mechanicId: null,
          carOwnerId: customer.id,
          customer,
          conversationId,
          issueSummary: {
            issueType: item?.issue || '',
            carMake: item?.carMake || '',
          },
          trackingStatus: normalized,
          progressStatus: normalized,
        });
      }

      if (normalized === 'completed' || normalized === 'cancelled' || normalized === 'disputed') {
        clearMechanicChatShortcut();
        localAcceptedRef.current = localAcceptedRef.current.filter(j => j.id !== safeJobId);
      }
      await fetchData();
    } catch (requestError) {
      setError(requestError?.message || 'Could not update job status.');
    } finally {
      setBusyStatusJobId('');
      setBusyStatusAction('');
    }
  };

  const currentItems = useMemo(() => {
    if (activeTab === 'available') {
      return pendingRequests;
    }
    if (activeTab === 'active') {
      return activeJobs;
    }
    return completedJobs;
  }, [activeJobs, activeTab, completedJobs, pendingRequests]);

  const shortcutAvatarUri = normalizeAvatarUri(
    mechanicChatShortcut?.customer?.avatarUri ||
      mechanicChatShortcut?.customer?.avatar ||
      '',
  );
  const shortcutInitial =
    String(
      mechanicChatShortcut?.customer?.initials ||
        mechanicChatShortcut?.customer?.name ||
        'C',
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
      mechanicId: null,
      customer: mechanicChatShortcut?.customer || null,
      issueSummary: mechanicChatShortcut?.issueSummary || null,
      progressStatus: mechanicChatShortcut?.progressStatus || '',
    });
  }, [mechanicChatShortcut, navigation]);

  return (
    <ScreenContainer
      padded={false}
      edges={['left', 'right', 'bottom']}
      style={styles.screen}
    >
      <View style={styles.container}>
        <CenteredHeader
          title="Jobs"
          onBackPress={
            onBackToHome ||
            (() =>
              navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'home' }))
          }
        />
        <View style={styles.tabsWrap}>
          <ScrollableTabs
            tabs={TABS}
            activeKey={activeTab}
            onChange={setActiveTab}
            contentContainerStyle={{ flexGrow: 0 }}
          />
        </View>

        <AppText style={styles.heading}>Nearby requests</AppText>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {!loading && error ? (
          <NoInternetState message={error} onRetry={fetchData} />
        ) : null}

        {!loading && !error ? (
          <View style={styles.listWrap}>
            <PullToRefreshIndicator
              pullDistance={pullDistance}
              refreshing={loading}
            />
            <Animated.ScrollView
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
              bounces
              alwaysBounceVertical
              overScrollMode="always"
              onScroll={event => {
                const offsetY = event.nativeEvent.contentOffset.y;
                const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
                pullDistance.setValue(pullValue);
              }}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={fetchData}
                  tintColor="transparent"
                  colors={['transparent']}
                />
              }
            >
              {activeTab === 'available'
                ? currentItems.map(item => (
                    <JobCard
                      key={item.id}
                      item={item}
                      tab={activeTab}
                      busyAction={busyRequestId === item.id ? busyAction : ''}
                      onAccept={target => handleRespond(target, 'accept')}
                      onDecline={target => handleRespond(target, 'decline')}
                    />
                  ))
                : currentItems.map(item => (
                    <JobCard
                      key={item.id}
                      item={item}
                      tab={activeTab}
                      busyAction={
                        busyStatusJobId === String(item.id || item.jobId || '').trim()
                          ? busyStatusAction
                          : ''
                      }
                      onAdvance={(target, nextStatus) =>
                        handleStatusUpdate(target, nextStatus)
                      }
                      onCancel={target => handleStatusUpdate(target, 'cancelled')}
                    />
                  ))}

              {!currentItems.length ? (
                <View style={styles.centerState}>
                  <AppText style={styles.emptyText}>
                    No jobs in this tab right now.
                  </AppText>
                </View>
              ) : null}
            </Animated.ScrollView>
          </View>
        ) : null}
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
    paddingTop: 16,
  },
  heading: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 24,
    rowGap: 10,
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
  },
  tabsWrap: {
    marginTop: 10,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  acceptBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
  },
  declineBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
  },
  declineBtnText: {
    color: '#F5F5F5',
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
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    rowGap: 8,
  },
  emptyText: {
    color: darkTheme.colors.muted,
    textAlign: 'center',
  },
  floatingChatBtn: {
    position: 'absolute',
    right: 16,
    bottom: 86,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(230, 199, 20, 0.6)',
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
    backgroundColor: 'rgba(230, 199, 20, 0.2)',
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

export default MechanicJobsScreen;
