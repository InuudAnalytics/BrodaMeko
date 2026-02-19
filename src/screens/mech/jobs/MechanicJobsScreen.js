import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { getMechanicAssignedJob, getMechanicAssignedJobs, updateJobStatus } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const TABS = [
  { key: 'available', label: 'Available jobs' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

const readJobs = (payload) => {
  const root = payload?.data || payload || {};

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root.jobs)) {
    return root.jobs;
  }

  if (Array.isArray(root.items)) {
    return root.items;
  }

  if (Array.isArray(root.results)) {
    return root.results;
  }

  return [];
};

const initialsFromName = (name) => {
  return String(name || 'M')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
};

const normalizeJob = (item, index) => ({
  id: String(item?.id || item?._id || item?.job_id || `job-${index}`),
  raw: item,
  name: item?.car_owner?.name || item?.user?.name || item?.owner?.name || 'Customer',
  issue: item?.issue_type || item?.title || item?.description || 'Car issue',
  vehicle: item?.car_make || item?.vehicle || '',
  distanceKm: Number(item?.distance_km || item?.distance || 0),
  etaMins: Number(item?.eta_minutes || item?.eta || 0),
  urgent: String(item?.priority || '').toLowerCase() === 'urgent',
  status: String(item?.status || '').toLowerCase(),
});

const normalizeIssueSummary = (job) => {
  const source = job && typeof job === 'object' ? job : {};
  const rawImages = Array.isArray(source?.images) ? source.images : [];
  const images = rawImages
    .map((image) => {
      if (typeof image === 'string') {
        return image;
      }
      return String(image?.url || image?.uri || image?.path || '').trim();
    })
    .filter(Boolean);

  return {
    issueType: String(source?.issue_type || source?.title || '').trim(),
    description: String(source?.description || '').trim(),
    carMake: String(source?.car_make || '').trim(),
    images,
  };
};

const readJobPayload = (response) => {
  const root = response?.data || response || {};
  if (root?.job && typeof root.job === 'object') {
    return root.job;
  }
  return root;
};

const ACTIVE_STATUSES = new Set(['accepted', 'en_route', 'arrived', 'repairing', 'in_progress', 'active']);
const COMPLETED_STATUSES = new Set(['completed', 'done']);

const filterJobsForTab = (jobs, tabKey) => {
  if (tabKey === 'completed') {
    return jobs.filter((job) => COMPLETED_STATUSES.has(job.status));
  }

  if (tabKey === 'active') {
    return jobs.filter((job) => ACTIVE_STATUSES.has(job.status));
  }

  return jobs.filter((job) => !ACTIVE_STATUSES.has(job.status) && !COMPLETED_STATUSES.has(job.status));
};

const JobCard = ({ item, tab, loadingAction, onAccept, onViewDetails }) => {
  const isAvailable = tab === 'available';
  const isActive = tab === 'active';
  const isCompleted = tab === 'completed';
  const isBusy = loadingAction === item.id;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => onViewDetails(item)}>
      <View style={styles.topRow}>
        <View style={styles.leftBlock}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{initialsFromName(item.name)}</AppText>
          </View>
          <View style={styles.info}>
            <AppText style={styles.name}>{item.name}</AppText>
            <AppText style={styles.issue}>
              {item.issue}{item.vehicle ? ` - ${item.vehicle}` : ''}
            </AppText>
          </View>
        </View>

        {item.urgent ? (
          <View style={styles.urgentBadge}>
            <AppText style={styles.urgentText}>Urgent</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <HugeiconsIcon icon={Location01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
          <AppText style={styles.metaText}>
            {item.distanceKm ? `${item.distanceKm}km away` : 'Distance unavailable'}
          </AppText>
        </View>
        <View style={styles.metaItem}>
          <HugeiconsIcon icon={Clock01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2.1} />
          <AppText style={styles.metaText}>
            {item.etaMins ? `${item.etaMins} minutes` : 'ETA unavailable'}
          </AppText>
        </View>
      </View>

      {isAvailable ? (
        <AppButton
          label={isBusy ? 'Accepting...' : 'Accept job'}
          onPress={() => onAccept(item)}
          style={styles.ctaBtn}
          textStyle={styles.ctaBtnText}
          disabled={isBusy}
          left={isBusy ? <ActivityIndicator size="small" color="#1A1A1A" /> : null}
        />
      ) : null}

      {isActive ? (
        <AppButton
          label="View details"
          onPress={() => onViewDetails(item)}
          style={styles.ctaBtn}
          textStyle={styles.ctaBtnText}
        />
      ) : null}

      {isCompleted ? (
        <View style={styles.completedChip}>
          <AppText style={styles.completedChipText}>Completed</AppText>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const MechanicJobsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('available');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingAction, setLoadingAction] = useState('');
  const [jobsByTab, setJobsByTab] = useState({
    available: [],
    active: [],
    completed: [],
  });

  const fetchTabJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMechanicAssignedJobs({ page: 1, limit: 50 });
      const normalized = readJobs(response).map(normalizeJob);

      setJobsByTab({
        available: filterJobsForTab(normalized, 'available'),
        active: filterJobsForTab(normalized, 'active'),
        completed: filterJobsForTab(normalized, 'completed'),
      });
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load jobs.');
      setJobsByTab({
        available: [],
        active: [],
        completed: [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTabJobs();
    }, [fetchTabJobs])
  );

  const currentList = useMemo(() => jobsByTab[activeTab] || [], [activeTab, jobsByTab]);

  const handleAccept = async (job) => {
    setLoadingAction(job.id);
    try {
      await updateJobStatus(job.id, 'accepted');
      await fetchTabJobs();

      const detailsResponse = await getMechanicAssignedJob(job.id).catch(() => null);
      const detailedJob = detailsResponse ? readJobPayload(detailsResponse) : null;
      const source = detailedJob || job?.raw || {};
      const customerName =
        source?.car_owner?.name ||
        source?.user?.name ||
        source?.owner?.name ||
        job?.name ||
        'Customer';
      const customerInitials = initialsFromName(customerName) || 'C';
      const conversationId = String(
        source?.conversation_id ||
        source?.conversationId ||
        source?.conversation?.id ||
        source?.conversation?._id ||
        ''
      ).trim();
      const mechanicId = String(
        source?.mechanic_id ||
        source?.mechanic?.id ||
        source?.assigned_mechanic_id ||
        'self'
      ).trim();
      const carOwnerId = String(
        source?.car_owner_id ||
        source?.car_owner?.id ||
        source?.user_id ||
        source?.user?.id ||
        ''
      ).trim();

      navigation.navigate(ROUTES.MECH_CHAT, {
        jobId: job.id,
        mechanicId: mechanicId || 'self',
        carOwnerId,
        conversationId,
        issueSummary: normalizeIssueSummary(source),
        customer: {
          id: carOwnerId,
          name: customerName,
          initials: customerInitials,
          rating: String(source?.car_owner?.rating || source?.user?.rating || ''),
        },
      });
    } catch (updateError) {
      Alert.alert('Error', updateError?.message || 'Could not accept this job.');
    } finally {
      setLoadingAction('');
    }
  };

  const handleViewDetails = (job) => {
    navigation.navigate(ROUTES.MECH_JOB_DETAILS, { jobId: job.id });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.tabWrap}>
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <AppText style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.centerState}>
            <AppText style={styles.errorText}>{error}</AppText>
            <TouchableOpacity activeOpacity={0.85} onPress={fetchTabJobs}>
              <AppText style={styles.retryText}>Retry</AppText>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error ? (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {currentList.map((item) => (
              <JobCard
                key={`${activeTab}-${item.id}`}
                item={item}
                tab={activeTab}
                loadingAction={loadingAction}
                onAccept={handleAccept}
                onViewDetails={handleViewDetails}
              />
            ))}

            {!currentList.length ? (
              <View style={styles.centerState}>
                <AppText style={styles.emptyText}>No jobs in this tab right now.</AppText>
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
    backgroundColor: '#000033',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  tabWrap: {
    flexDirection: 'row',
    columnGap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  tabBtnActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  tabText: {
    color: darkTheme.colors.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#1A1A1A',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 28,
    rowGap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    columnGap: 8,
  },
  leftBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    columnGap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(226,255,49,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(226,255,49,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  info: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  issue: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  urgentBadge: {
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(226,255,49,0.14)',
    borderRadius: 999,
    paddingHorizontal: 8,
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
  ctaBtn: {
    marginTop: 10,
    minHeight: 42,
    borderRadius: 10,
  },
  ctaBtnText: {
    color: '#1A1A1A',
    fontSize: 14,
  },
  completedChip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  completedChipText: {
    color: darkTheme.colors.text,
    fontSize: 11,
    lineHeight: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    rowGap: 8,
  },
  errorText: {
    color: '#FF7F7F',
    textAlign: 'center',
  },
  retryText: {
    color: darkTheme.colors.accent,
  },
  emptyText: {
    color: darkTheme.colors.muted,
    textAlign: 'center',
  },
});

export default MechanicJobsScreen;
