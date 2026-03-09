import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { openSettings } from 'react-native-permissions';
import {
  AppButton,
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
  getMechanicAssignedJobs,
  getMechanicPendingJobRequests,
  respondToJobRequest,
  updateJobStatus,
} from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const TABS = [
  { key: 'available', label: 'Available jobs' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const COMPLETED_STATUSES = new Set(['completed', 'done']);
const FINAL_STATUSES = new Set(['completed', 'done', 'cancelled']);

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
  ownerName: readOwnerName(item, 'Car owner'),
  issue: String(item?.issue_type || item?.title || 'Car issue'),
  carMake: String(item?.car_make || ''),
  avatarUri: String(item?.owner_avatar || item?.car_owner?.avatar || '').trim(),
  ownerAvatar: String(item?.owner_avatar || item?.car_owner?.avatar || '').trim(),
  urgent: String(item?.priority || '').toLowerCase() === 'urgent',
  status: String(item?.status || 'pending').toLowerCase(),
  distanceText: String(item?.distance_text || item?.distance || item?.distance_km || '').trim(),
  etaText: String(item?.eta_text || item?.eta || item?.estimated_time || '').trim(),
});

const normalizeAssignedJob = (item, index) => ({
  id: String(item?.id || item?._id || item?.job_id || `job-${index}`),
  ownerName: readOwnerName(item, 'Customer'),
  issue: String(item?.issue_type || item?.title || 'Car issue'),
  carMake: String(item?.car_make || ''),
  status: String(item?.status || '').toLowerCase(),
  urgent: String(item?.priority || '').toLowerCase() === 'urgent',
  distanceText: String(item?.distance_text || item?.distance || item?.distance_km || '').trim(),
  etaText: String(item?.eta_text || item?.eta || item?.estimated_time || '').trim(),
});

const normalizeStatus = status => {
  const safe = String(status || '').trim().toLowerCase();
  if (safe === 'arrived') return 'arrive';
  if (safe === 'repairing') return 'in_progress';
  return safe;
};

const formatStatus = value =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

const getNextAction = status => {
  const normalized = normalizeStatus(status);
  const flow = ['accepted', 'en_route', 'arrive', 'in_progress', 'completed'];
  const currentIndex = flow.indexOf(normalized);

  if (currentIndex === -1) {
    return { status: 'en_route', label: 'On my way' };
  }

  if (normalized === 'completed') {
    return null;
  }

  const nextStatus = flow[currentIndex + 1];
  if (!nextStatus) {
    return null;
  }

  const labels = {
    en_route: 'On my way',
    arrive: 'Arrive',
    in_progress: 'Start work',
    completed: 'Complete',
  };

  return { status: nextStatus, label: labels[nextStatus] || 'Update' };
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
  const isFinal = FINAL_STATUSES.has(normalizedStatus);
  const distance = item.distanceText ? `${item.distanceText} away` : '';
  const eta = item.etaText ? `${item.etaText}` : '';

  return (
    <MechanicJobCard
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
              {formatStatus(normalizedStatus)}
            </AppText>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <AppButton
              label={busyAction === nextAction?.status ? 'Updating...' : nextAction?.label || 'On my way'}
              onPress={() => onAdvance(item, nextAction?.status || 'en_route')}
              disabled={Boolean(busyAction)}
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
      setPendingRequests(pending);
      setActiveJobs(
        assigned.filter(item => !COMPLETED_STATUSES.has(item.status)),
      );
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
      await respondToJobRequest(safeJobId, action);
      if (action === 'accept') {
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

    setBusyStatusJobId(safeJobId);
    setBusyStatusAction(status);

    try {
      await updateJobStatus(safeJobId, status);
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
          <View style={styles.centerState}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity activeOpacity={0.85} onPress={fetchData}>
              <AppText style={styles.retryText}>Retry</AppText>
            </TouchableOpacity>
          </View>
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
  errorText: {
    color: '#FF7F7F',
    textAlign: 'center',
  },
  retryText: {
    color: darkTheme.colors.accent,
  },
});

export default MechanicJobsScreen;
