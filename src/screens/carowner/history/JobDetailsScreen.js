import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, PullToRefreshIndicator, ScreenContainer } from '../../../components';
import { useJobs } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
const readImages = (job) => {
  const images = job?.images || job?.photos || job?.attachments || [];
  return Array.isArray(images) ? images : [];
};

const prettyLabel = (value) => {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const toImageUri = (image) => {
  if (!image) {
    return '';
  }
  if (typeof image === 'string') {
    return image;
  }
  return String(image?.url || image?.uri || image?.path || '').trim();
};

const readJobPayload = (response) => {
  const root = response?.data || response || {};

  if (!root || typeof root !== 'object') {
    return null;
  }

  if (root?.job && typeof root.job === 'object') {
    return root.job;
  }

  if (root?.data && typeof root.data === 'object') {
    if (root.data.job && typeof root.data.job === 'object') {
      return root.data.job;
    }

    return root.data;
  }

  return root;
};

const JobDetailsScreen = ({ navigation, route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const { fetchJob, deleteJob, loading } = useJobs();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const fetchJobRef = useRef(fetchJob);
  const pullDistance = useRef(new Animated.Value(0)).current;

  fetchJobRef.current = fetchJob;

  const loadJob = useCallback(async () => {
    if (!jobId) {
      setError('Job ID is missing.');
      return;
    }

    setError('');
    const response = await fetchJobRef.current(jobId);
    if (!response) {
      setError('Could not load this job.');
      return;
    }

    const payload = readJobPayload(response);
    setJob(payload);
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      loadJob();
    }, [loadJob])
  );

  const images = useMemo(() => readImages(job), [job]);

  const handleDelete = () => {
    AppAlert.alert('Delete job', 'Are you sure you want to delete this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const response = await deleteJob(jobId);
          if (!response) {
            AppAlert.alert('Error', 'Could not delete this job.');
            return;
          }
          AppAlert.alert('Deleted', 'Job deleted successfully.');
          navigation.navigate(ROUTES.CAR_OWNER_HISTORY, { refresh: Date.now() });
        },
      },
    ]);
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={Boolean(loading.fetchJob)} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={event => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
            pullDistance.setValue(pullValue);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(loading.fetchJob)}
              onRefresh={loadJob}
              tintColor="transparent"
              colors={['transparent']}
            />
          }
        >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.title}>Job details</AppText>
          <View style={styles.backButtonSpacer} />
        </View>

        {(loading.fetchJob || !job) && !error ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {error ? (
          <View style={styles.stateWrap}>
            <AppText style={styles.errorText}>{error}</AppText>
            <AppButton label="Retry" onPress={loadJob} style={styles.retryBtn} />
          </View>
        ) : null}

        {job && !error ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <AppText style={styles.label}>Issue</AppText>
              <AppText style={styles.value}>{prettyLabel(job?.issue_type || 'N/A')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Car make</AppText>
              <AppText style={styles.value}>{String(job?.car_make || 'N/A')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Description</AppText>
              <AppText style={styles.value}>{String(job?.description || 'No description')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Status</AppText>
              <AppText style={styles.value}>{prettyLabel(job?.status || 'N/A')}</AppText>
            </View>

            <AppText style={styles.imagesTitle}>Images</AppText>
            {images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
                {images.map((image, index) => {
                  const uri = toImageUri(image);
                  return uri ? <Image key={`${uri}-${index}`} source={{ uri }} style={styles.image} /> : null;
                })}
              </ScrollView>
            ) : (
              <AppText style={styles.emptyText}>No images uploaded.</AppText>
            )}

            <AppButton
              label="Edit"
              onPress={() => navigation.navigate(ROUTES.CAR_OWNER_EDIT_JOB, { jobId, job })}
              style={styles.editBtn}
            />
            <AppButton
              label={loading.deleteJob ? 'Deleting...' : 'Delete'}
              onPress={handleDelete}
              disabled={loading.deleteJob}
              style={styles.deleteBtn}
              textStyle={styles.deleteBtnText}
            />
          </View>
        ) : null}
        </Animated.ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  listWrap: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    marginBottom: 14,
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
  title: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    flex: 1,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 12,
    marginBottom: 10,
  },
  label: {
    color: '#AEB0CC',
    fontSize: 13,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  imagesTitle: {
    marginTop: 10,
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  imagesRow: {
    paddingTop: 8,
    columnGap: 8,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
  },
  emptyText: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  editBtn: {
    marginTop: 14,
  },
  deleteBtn: {
    marginTop: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF7B8A',
  },
  deleteBtnText: {
    color: '#FF7B8A',
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    rowGap: 10,
  },
  errorText: {
    color: '#FF7F7F',
  },
  retryBtn: {
    minWidth: 120,
  },
});

export default JobDetailsScreen;



