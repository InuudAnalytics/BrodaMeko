import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
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
  ScreenContainer,
  ScrollableTabs,
} from '../../../components';
import { LOCATION_ENABLED } from '../../../config/featureFlags';
import { useUserLocation } from '../../../hooks/useUserLocation';
import {
  getMechanicAssignedJobs,
  getMechanicPendingJobRequests,
  respondToJobRequest,
} from '../../../services/jobs.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROUTES } from '../../../utils';

const TABS = [
  { key: 'available', label: 'Available jobs' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const COMPLETED_STATUSES = new Set(['completed', 'done']);

const initialsFromName = name =>
  String(name || 'M')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

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
  ownerName: String(item?.owner_name || item?.car_owner?.name || 'Car owner'),
  issue: String(item?.issue_type || item?.title || 'Car issue'),
  carMake: String(item?.car_make || ''),
  avatarUri: String(item?.owner_avatar || item?.car_owner?.avatar || '').trim(),
  urgent: String(item?.priority || '').toLowerCase() === 'urgent',
  status: String(item?.status || 'pending').toLowerCase(),
});

const normalizeAssignedJob = (item, index) => ({
  id: String(item?.id || item?._id || item?.job_id || `job-${index}`),
  ownerName: String(
    item?.car_owner?.name ||
      item?.owner?.name ||
      item?.user?.name ||
      'Customer',
  ),
  issue: String(item?.issue_type || item?.title || 'Car issue'),
  carMake: String(item?.car_make || ''),
  status: String(item?.status || '').toLowerCase(),
});

const RequestCard = ({ item, busyAction, onAccept, onDecline }) => {
  const initials = initialsFromName(item.ownerName);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          {item.avatarUri ? (
            <Image
              source={{ uri: item.avatarUri }}
              style={styles.avatarImage}
            />
          ) : (
            <AppText style={styles.avatarText}>{initials}</AppText>
          )}
        </View>
        <View style={styles.info}>
          <AppText style={styles.name}>{item.ownerName}</AppText>
          <AppText style={styles.issue}>
            {item.issue}
            {item.carMake ? ` - ${item.carMake}` : ''}
          </AppText>
        </View>
        {item.urgent ? (
          <View style={styles.urgentBadge}>
            <AppText style={styles.urgentText}>Urgent</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
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
    </View>
  );
};

const AssignedCard = ({ item, onOpen }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    style={styles.card}
    onPress={() => onOpen(item)}
  >
    <View style={styles.cardTop}>
      <View style={styles.avatar}>
        <AppText style={styles.avatarText}>
          {initialsFromName(item.ownerName)}
        </AppText>
      </View>
      <View style={styles.info}>
        <AppText style={styles.name}>{item.ownerName}</AppText>
        <AppText style={styles.issue}>
          {item.issue}
          {item.carMake ? ` - ${item.carMake}` : ''}
        </AppText>
      </View>
    </View>
    <AppButton
      label="View details"
      onPress={() => onOpen(item)}
      style={styles.acceptBtn}
    />
  </TouchableOpacity>
);

const MechanicJobsScreen = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [busyRequestId, setBusyRequestId] = useState('');
  const [busyAction, setBusyAction] = useState('');
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
      const response = await respondToJobRequest(safeJobId, action);
      if (action === 'accept') {
        const payload = response?.data || response || {};
        const conversationId = String(payload?.conversation_id || '').trim();
        navigation.navigate(ROUTES.MECH_CHAT, {
          conversationId,
          jobId: safeJobId,
          tab: 'jobs',
        });
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

  const handleOpenJob = item => {
    navigation.navigate(ROUTES.MECH_JOB_DETAILS, { jobId: item.id });
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
        <CenteredHeader title="Jobs" />
        <ScrollableTabs
          tabs={TABS}
          activeKey={activeTab}
          onChange={setActiveTab}
        />

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
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'available'
              ? currentItems.map(item => (
                  <RequestCard
                    key={item.id}
                    item={item}
                    busyAction={busyRequestId === item.id ? busyAction : ''}
                    onAccept={target => handleRespond(target, 'accept')}
                    onDecline={target => handleRespond(target, 'decline')}
                  />
                ))
              : currentItems.map(item => (
                  <AssignedCard
                    key={item.id}
                    item={item}
                    onOpen={handleOpenJob}
                  />
                ))}

            {!currentItems.length ? (
              <View style={styles.centerState}>
                <AppText style={styles.emptyText}>
                  No jobs in this tab right now.
                </AppText>
              </View>
            ) : null}
          </ScrollView>
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
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  heading: {
    marginTop: 14,
    color: '#F5F5F5',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 24,
    rowGap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.65),
    borderRadius: 16,
    padding: 12,
    backgroundColor: 'rgba(0,0,51,0.6)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: '#F5F5F5',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#F5F5F5',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  issue: {
    marginTop: 2,
    color: 'rgba(245,245,245,0.62)',
    fontSize: 13,
    lineHeight: 16,
  },
  urgentBadge: {
    backgroundColor: 'rgba(157,36,74,0.8)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgentText: {
    color: '#F7D1E0',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  actions: {
    marginTop: 14,
    rowGap: 8,
  },
  acceptBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
  },
  declineBtn: {
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
