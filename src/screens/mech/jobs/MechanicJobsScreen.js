import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { getMechanicAssignedJobs } from '../../../services/jobs.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROUTES } from '../../../utils';

const TABS = [
  { key: 'ongoing', label: 'Ongoing' },
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

const COMPLETED_STATUSES = new Set(['completed', 'done']);

const filterJobsForTab = (jobs, tabKey) => {
  if (tabKey === 'completed') {
    return jobs.filter((job) => COMPLETED_STATUSES.has(job.status));
  }

  if (tabKey === 'ongoing') {
    return jobs.filter((job) => !COMPLETED_STATUSES.has(job.status));
  }

  return [];
};

const JobCard = ({ item, tab, onViewDetails }) => {
  const isOngoing = tab === 'ongoing';
  const isCompleted = tab === 'completed';

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

      {isOngoing ? (
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
  const [activeTab, setActiveTab] = useState('ongoing');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobsByTab, setJobsByTab] = useState({
    ongoing: [],
    completed: [],
  });

  const fetchTabJobs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getMechanicAssignedJobs({ page: 1, limit: 50 });
      const normalized = readJobs(response).map(normalizeJob);

      setJobsByTab({
        ongoing: filterJobsForTab(normalized, 'ongoing'),
        completed: filterJobsForTab(normalized, 'completed'),
      });
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load jobs.');
      setJobsByTab({
        ongoing: [],
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
    backgroundColor: darkTheme.colors.background,
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
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.2),
    borderWidth: 1,
    borderColor: withAlpha(darkTheme.colors.accent, 0.42),
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
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.14),
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
