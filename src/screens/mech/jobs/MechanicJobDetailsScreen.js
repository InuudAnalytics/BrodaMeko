import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { getMechanicAssignedJob, updateJobStatus } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';

const readJob = (response) => {
  const payload = response?.data || response || {};
  if (payload?.job && typeof payload.job === 'object') {
    return payload.job;
  }
  return payload;
};

const readImages = (job) => {
  const images = job?.images || job?.photos || job?.attachments || [];
  return Array.isArray(images) ? images : [];
};

const toImageUri = (image) => {
  if (!image) {
    return '';
  }

  if (typeof image === 'string') {
    return image;
  }

  return String(image.url || image.uri || image.path || '').trim();
};

const MechanicJobDetailsScreen = ({ navigation, route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState('');

  const fetchDetails = useCallback(async () => {
    if (!jobId) {
      setError('Job ID is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getMechanicAssignedJob(jobId);
      setJob(readJob(response));
    } catch (requestError) {
      setError(requestError?.message || 'Could not load job details.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [fetchDetails])
  );

  const images = useMemo(() => readImages(job), [job]);
  const customerName = job?.car_owner?.name || job?.user?.name || job?.owner?.name || 'N/A';
  const customerPhone = job?.car_owner?.phone_number || job?.user?.phone_number || job?.owner?.phone_number || 'N/A';

  const handleUpdateStatus = async (status) => {
    if (!jobId || updating) {
      return;
    }

    setUpdating(status);
    try {
      await updateJobStatus(jobId, status);
      await fetchDetails();
      Alert.alert('Success', `Job updated to ${status}.`);
    } catch (requestError) {
      Alert.alert('Error', requestError?.message || 'Could not update job status.');
    } finally {
      setUpdating('');
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <AppText style={styles.backText}>Back</AppText>
          </TouchableOpacity>
          <AppText style={styles.title}>Job details</AppText>
        </View>

        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          </View>
        ) : null}

        {!loading && error ? (
          <View style={styles.stateWrap}>
            <AppText style={styles.errorText}>{error}</AppText>
            <AppButton label="Retry" onPress={fetchDetails} style={styles.retryBtn} />
          </View>
        ) : null}

        {!loading && !error && job ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <AppText style={styles.label}>Status</AppText>
              <AppText style={styles.value}>{String(job?.status || 'pending')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Issue</AppText>
              <AppText style={styles.value}>{String(job?.issue_type || job?.title || 'N/A')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Description</AppText>
              <AppText style={styles.value}>{String(job?.description || 'N/A')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Car make</AppText>
              <AppText style={styles.value}>{String(job?.car_make || 'N/A')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Created</AppText>
              <AppText style={styles.value}>{String(job?.created_at || job?.createdAt || 'N/A')}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Customer</AppText>
              <AppText style={styles.value}>{customerName}</AppText>
            </View>
            <View style={styles.row}>
              <AppText style={styles.label}>Phone</AppText>
              <AppText style={styles.value}>{customerPhone}</AppText>
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
              <AppText style={styles.emptyImages}>No images uploaded.</AppText>
            )}

            <View style={styles.actions}>
              <AppButton
                label={updating === 'repairing' ? 'Updating...' : 'Mark In Progress'}
                onPress={() => handleUpdateStatus('repairing')}
                disabled={Boolean(updating)}
              />
              <AppButton
                label={updating === 'completed' ? 'Updating...' : 'Mark Completed'}
                onPress={() => handleUpdateStatus('completed')}
                disabled={Boolean(updating)}
                style={styles.secondaryBtn}
                textStyle={styles.secondaryBtnText}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginBottom: 12,
  },
  backText: {
    color: darkTheme.colors.accent,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  stateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    rowGap: 10,
  },
  errorText: {
    color: '#FF7F7F',
    textAlign: 'center',
  },
  retryBtn: {
    minWidth: 120,
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 10,
    marginBottom: 8,
  },
  label: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
  value: {
    color: darkTheme.colors.text,
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  imagesTitle: {
    marginTop: 6,
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  imagesRow: {
    columnGap: 8,
    paddingTop: 8,
  },
  image: {
    width: 84,
    height: 84,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyImages: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  actions: {
    marginTop: 14,
    rowGap: 10,
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
  },
  secondaryBtnText: {
    color: darkTheme.colors.accent,
  },
});

export default MechanicJobDetailsScreen;
