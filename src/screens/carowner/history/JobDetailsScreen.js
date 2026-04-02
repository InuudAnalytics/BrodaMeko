import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { AppText, PullToRefreshIndicator, ScreenContainer } from '../../../components';
import { getCarOwnerJob } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

// ─── helpers ────────────────────────────────────────────────────────────────

const prettyLabel = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const formatDateTime = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '--';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}  ${hh}:${min}`;
};

const toCurrency = (amount) => {
  const safe = Number(amount);
  return `₦${(Number.isFinite(safe) ? safe : 0).toLocaleString('en-NG')}`;
};

const readJobPayload = (response) => {
  const root = response?.data || response || {};
  if (root?.job && typeof root.job === 'object') return root.job;
  if (root?.data && typeof root.data === 'object') return root.data;
  return root;
};

const toImageUri = (image) => {
  if (!image) return '';
  if (typeof image === 'string') return image;
  return String(image?.url || image?.uri || '').trim();
};

const toAvatarUri = (raw) => {
  if (!raw) return null;
  if (typeof raw === 'object') return raw?.url || raw?.uri || null;
  const str = String(raw).trim();
  return str || null;
};

const statusColor = (s) => {
  switch (s) {
    case 'completed': return '#4CC968';
    case 'cancelled': return '#E85578';
    case 'pending':   return '#C8CCD8';
    default:          return '#7BC8FF';
  }
};
const statusBg = (s) => {
  switch (s) {
    case 'completed': return 'rgba(36,182,85,0.18)';
    case 'cancelled': return 'rgba(232,77,111,0.18)';
    case 'pending':   return 'rgba(154,161,181,0.22)';
    default:          return 'rgba(123,200,255,0.14)';
  }
};

// ─── sub-components ──────────────────────────────────────────────────────────

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <AppText style={styles.detailLabel}>{label}</AppText>
    <AppText style={styles.detailValue}>{String(value ?? '--')}</AppText>
  </View>
);

const SectionCard = ({ title, children }) => (
  <View style={styles.card}>
    <AppText style={styles.cardTitle}>{title}</AppText>
    {children}
  </View>
);

// ─── screen ──────────────────────────────────────────────────────────────────

const JobDetailsScreen = ({ navigation, route }) => {
  const jobId = String(route?.params?.jobId || '').trim();
  const preview = route?.params?.preview || {};

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pullDistance = useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    if (!jobId) { setError('Job ID is missing.'); setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const res = await getCarOwnerJob(jobId);
      setJob(readJobPayload(res));
    } catch (e) {
      setError(e?.message || 'Could not load job details.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // derived display values
  const mechanic = job?.mechanic || job?.assigned_mechanic || null;
  const mechanicName = mechanic?.full_name || mechanic?.name || preview?.mechanicName || 'Assigned mechanic';
  const avatarUri = toAvatarUri(mechanic?.avatar || preview?.avatarUrl);
  const initial = String(mechanicName).trim().charAt(0).toUpperCase() || 'M';
  const mechanicId = String(mechanic?.id || mechanic?._id || mechanic?.mechanic_id || '').trim();

  const rawAmount = job?.amount ?? job?.price ?? job?.total_fee ?? job?.total ?? job?.quoted_price;
  const hasAmount = rawAmount !== undefined && rawAmount !== null && String(rawAmount).trim() !== '';

  const images = Array.isArray(job?.images) ? job.images : Array.isArray(job?.photos) ? job.photos : [];
  const status = String(job?.status || '').toLowerCase();

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            pullDistance.setValue(y < 0 ? Math.min(-y, 140) : 0);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor="transparent"
              colors={['transparent']}
            />
          }
        >
          {/* header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
            </TouchableOpacity>
            <AppText style={styles.headerTitle}>Job Details</AppText>
            <View style={styles.headerSpacer} />
          </View>

          {/* loading */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {/* error */}
          {!loading && error ? (
            <View style={styles.center}>
              <AppText style={styles.errorText}>{error}</AppText>
              <TouchableOpacity onPress={load} style={styles.retryBtn}>
                <AppText style={styles.retryText}>Retry</AppText>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* content */}
          {!loading && !error && job ? (
            <View style={styles.body}>

              {/* ── Mechanic ── */}
              <SectionCard title="Mechanic">
                <TouchableOpacity
                  style={styles.mechanicRow}
                  activeOpacity={mechanicId ? 0.75 : 1}
                  onPress={() => {
                    if (!mechanicId) return;
                    navigation.navigate(ROUTES.CAR_OWNER_MECHANIC_DETAILS, {
                      jobId,
                      mechanicId,
                      preview: { mechanicName, avatarUrl: avatarUri },
                    });
                  }}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <AppText style={styles.avatarInitial}>{initial}</AppText>
                    </View>
                  )}
                  <View style={styles.mechanicMeta}>
                    <AppText style={styles.mechanicName}>{mechanicName}</AppText>
                    {mechanic?.phone_number ? (
                      <AppText style={styles.mechanicSub}>{mechanic.phone_number}</AppText>
                    ) : null}
                    {mechanic?.email ? (
                      <AppText style={styles.mechanicSub}>{mechanic.email}</AppText>
                    ) : null}
                  </View>
                  {status ? (
                    <View style={[styles.statusBadge, { backgroundColor: statusBg(status) }]}>
                      <AppText style={[styles.statusText, { color: statusColor(status) }]}>
                        {prettyLabel(status)}
                      </AppText>
                    </View>
                  ) : null}
                  {mechanicId ? (
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="rgba(255,255,255,0.35)" strokeWidth={2} />
                  ) : null}
                </TouchableOpacity>
              </SectionCard>

              {/* ── Job Info ── */}
              <SectionCard title="Job Info">
                <DetailRow label="Issue" value={prettyLabel(job.issue_type || job.issue)} />
                <DetailRow label="Car" value={job.car_make} />
                {job.description ? (
                  <View style={[styles.detailRow, styles.descRow]}>
                    <AppText style={styles.detailLabel}>Description</AppText>
                    <AppText style={[styles.detailValue, styles.descValue]}>{job.description}</AppText>
                  </View>
                ) : null}
                {images.length > 0 ? (
                  <View style={styles.imagesSection}>
                    <AppText style={styles.detailLabel}>Images</AppText>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.imagesRow}
                    >
                      {images.map((img, i) => {
                        const uri = toImageUri(img);
                        return uri ? (
                          <Image key={`img-${i}`} source={{ uri }} style={styles.jobImage} />
                        ) : null;
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </SectionCard>

              {/* ── Payment ── */}
              <SectionCard title="Payment">
                <DetailRow label="Amount" value={hasAmount ? toCurrency(rawAmount) : '--'} />
                <DetailRow label="Method" value={prettyLabel(job.payment_method)} />
                <DetailRow label="Status" value={prettyLabel(job.payment_status)} />
                {job.payment_reference ? (
                  <DetailRow label="Reference" value={job.payment_reference} />
                ) : null}
              </SectionCard>

              {/* ── Timeline ── */}
              <SectionCard title="Timeline">
                <DetailRow label="Requested" value={formatDateTime(job.created_at)} />
                {job.completed_at ? (
                  <DetailRow label="Completed" value={formatDateTime(job.completed_at)} />
                ) : null}
                {job.confirmed_at ? (
                  <DetailRow label="Confirmed" value={formatDateTime(job.confirmed_at)} />
                ) : null}
              </SectionCard>

            </View>
          ) : null}
        </Animated.ScrollView>
      </View>
    </ScreenContainer>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#010037' },
  listWrap: { flex: 1 },
  content: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 36 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 42,
    marginBottom: 16,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 36, height: 36 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },

  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, rowGap: 12 },
  errorText: { color: '#FF8B8B', textAlign: 'center', fontSize: 14 },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  retryText: { color: darkTheme.colors.text, fontSize: 14 },

  body: { rowGap: 12 },

  card: {
    borderRadius: 14,
    backgroundColor: 'rgba(125,128,173,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  cardTitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 12,
  },

  mechanicRow: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(247,162,61,0.22)',
    borderWidth: 2,
    borderColor: '#F7A23D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  mechanicMeta: { flex: 1 },
  mechanicName: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  mechanicSub: { marginTop: 2, color: '#AEB0CC', fontSize: 13, lineHeight: 17 },

  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 12,
    marginBottom: 10,
  },
  descRow: { alignItems: 'flex-start' },
  detailLabel: { color: '#AEB0CC', fontSize: 13, lineHeight: 17, flexShrink: 0 },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    flex: 1,
    textAlign: 'right',
  },
  descValue: { textAlign: 'left' },

  imagesSection: { marginTop: 4 },
  imagesRow: { paddingTop: 8, columnGap: 8 },
  jobImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});

export default JobDetailsScreen;
