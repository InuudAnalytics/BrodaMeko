import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
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

const STATUS_FLOW = ['en_route', 'arrive', 'in_progress', 'completed'];

const normalizeStatus = (value) => {
  const safe = String(value || '').trim().toLowerCase();
  if (safe === 'arrived') return 'arrive';
  if (safe === 'repairing') return 'in_progress';
  return safe;
};

const formatStatus = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getNextAction = (status) => {
  const normalized = normalizeStatus(status);
  const currentIndex = STATUS_FLOW.indexOf(normalized);

  if (currentIndex === -1) {
    return { status: 'en_route', label: 'On my way' };
  }

  if (normalized === 'completed') {
    return null;
  }

  const nextStatus = STATUS_FLOW[currentIndex + 1];
  if (!nextStatus) {
    return null;
  }

  const labelMap = {
    arrive: 'Arrived',
    in_progress: 'Start work',
    completed: 'Complete job',
  };

  return { status: nextStatus, label: labelMap[nextStatus] || 'Update status' };
};

const readCustomerName = (job, fallback = 'N/A') => {
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

  return String(
    combined ||
      job?.customer_name ||
      job?.car_owner_name ||
      job?.car_owner?.full_name ||
      job?.car_owner?.name ||
      job?.owner?.full_name ||
      job?.owner?.name ||
      job?.user?.full_name ||
      job?.user?.name ||
      fallback,
  ).trim();
};

const MechanicJobDetailsScreen = ({ navigation, route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const customerNameParam = String(route?.params?.customerName || '').trim();
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
  const currentStatus = normalizeStatus(job?.status || 'pending');
  const nextAction = getNextAction(currentStatus);
  const isFinalStatus = currentStatus === 'completed' || currentStatus === 'cancelled';
  const customerName =
    customerNameParam ||
    readCustomerName(job, 'N/A') ||
    'N/A';

  const handleUpdateStatus = async (status) => {
    if (!jobId || updating) {
      return;
    }

    setUpdating(status);
    try {
      await updateJobStatus(jobId, status);
      await fetchDetails();
      Alert.alert('Success', `Job updated to ${formatStatus(status)}.`);
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
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.accent} strokeWidth={2.2} />
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
              <AppText style={styles.value}>{formatStatus(currentStatus || 'pending')}</AppText>
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

            {isFinalStatus ? (
              <View style={[styles.finalStatusBadge, currentStatus === 'cancelled' ? styles.cancelledBadge : null]}>
                {currentStatus === 'completed' ? (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#0D3D1D" strokeWidth={2} />
                ) : null}
                <AppText
                  style={[
                    styles.finalStatusText,
                    currentStatus === 'cancelled' ? styles.cancelledText : styles.completedText,
                  ]}
                >
                  {currentStatus === 'completed' ? 'Completed' : 'Cancelled'}
                </AppText>
              </View>
            ) : (
              <View style={styles.actions}>
                <AppButton
                  label={updating === nextAction?.status ? 'Updating...' : nextAction?.label || 'On my way'}
                  onPress={() => handleUpdateStatus(nextAction?.status || 'en_route')}
                  disabled={Boolean(updating)}
                />
                <AppButton
                  label={updating === 'cancelled' ? 'Updating...' : 'Cancel job'}
                  onPress={() => handleUpdateStatus('cancelled')}
                  disabled={Boolean(updating)}
                  style={styles.secondaryBtn}
                  textStyle={styles.secondaryBtnText}
                />
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 10,
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
  finalStatusBadge: {
    marginTop: 14,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(64,198,122,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(64,198,122,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    columnGap: 6,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255,123,138,0.15)',
    borderColor: 'rgba(255,123,138,0.45)',
  },
  finalStatusText: {
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  completedText: {
    color: '#40C67A',
  },
  cancelledText: {
    color: '#FF7B8A',
  },
});

export default MechanicJobDetailsScreen;
