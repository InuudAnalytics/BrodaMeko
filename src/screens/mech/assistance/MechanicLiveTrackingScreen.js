import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CallIcon, CancelCircleIcon, Location01Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, OpenStreetMapView, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { updateJobStatus, updateJobLocation } from '../../../services/jobs.service';
import { startCall, getActiveCallForContext } from '../../../services/calls.service';
import { closeScoped, connectScoped, sendScoped } from '../../../services/ws.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';

const STATUS_STEPS = ['Accepted', 'En Route', 'Arrived', 'Repairing', 'Done'];

const toStatusIndex = (value) => {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'accepted') { return 0; }
  if (status === 'en_route' || status === 'enroute' || status === 'on_the_way') { return 1; }
  if (status === 'arrived') { return 2; }
  if (status === 'repairing' || status === 'in_progress') { return 3; }
  if (status === 'completed' || status === 'mechanic_completed' || status === 'done') { return 4; }
  return 0;
};

const getSheetTitle = (progressStatus) => {
  if (progressStatus === 'en_route') { return 'En Route'; }
  if (progressStatus === 'arrived') { return 'Arrived'; }
  if (progressStatus === 'repairing' || progressStatus === 'in_progress') { return 'Repairing'; }
  if (progressStatus === 'completed' || progressStatus === 'mechanic_completed') { return 'Job Complete'; }
  return 'Accepted';
};

const getSheetSubtitle = (progressStatus, recipientName) => {
  if (progressStatus === 'en_route') { return `You are on your way to ${recipientName}`; }
  if (progressStatus === 'arrived') { return `You have arrived at ${recipientName}'s location`; }
  if (progressStatus === 'repairing' || progressStatus === 'in_progress') { return 'Work in progress'; }
  if (progressStatus === 'completed' || progressStatus === 'mechanic_completed') {
    return 'Waiting for car owner to confirm';
  }
  return `Head to ${recipientName}'s location`;
};

const StarIcon = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" fill={color} />
  </Svg>
);

const StatusStepper = ({ currentIndex }) => {
  const progressPercent = (currentIndex / (STATUS_STEPS.length - 1)) * 100;
  return (
    <View style={styles.stepperWrap}>
      <View style={styles.stepTrack}>
        <View style={[styles.stepTrackFill, { width: `${progressPercent}%` }]} />
      </View>
      {STATUS_STEPS.map((label, index) => {
        const active = index <= currentIndex;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, active ? styles.stepDotActive : null]} />
            <AppText style={[styles.stepLabel, active ? styles.stepLabelActive : null]}>{label}</AppText>
          </View>
        );
      })}
    </View>
  );
};

const MechanicLiveTrackingScreen = ({ navigation, route }) => {
  const { token, user } = useAuth();
  const { location, refreshOnce } = useUserLocation();
  const locationRef = useRef(null);
  const jobId = String(route?.params?.jobId || '').trim();
  const userId = String(user?.id || user?._id || user?.user_id || '').trim();
  const [carOwnerLocation, setCarOwnerLocation] = useState(route?.params?.customerLocation || null);
  const [progressStatus, setProgressStatus] = useState(
    String(route?.params?.trackingStatus || route?.params?.progressStatus || 'accepted').trim().toLowerCase(),
  );
  const [busy, setBusy] = useState(false);

  const statusIndex = toStatusIndex(progressStatus);

  const customer = useMemo(
    () =>
      route?.params?.customer || {
        id: route?.params?.carOwnerId || '',
        name: route?.params?.carOwnerName || 'Car Owner',
        initials: 'CO',
        rating: '4.8',
      },
    [route?.params?.carOwnerId, route?.params?.carOwnerName, route?.params?.customer],
  );

  const recipient = useMemo(() => ({
    name: customer?.name || 'Car Owner',
    initials: customer?.initials || 'CO',
    rating: customer?.rating || '4.8',
    id: customer?.id || route?.params?.carOwnerId || null,
  }), [customer, route?.params?.carOwnerId]);

  const hasSeedMessage = Boolean(route?.params?.issueSummary);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  useEffect(() => {
    if (!jobId) { return undefined; }

    const safeToken = String(token || '').trim();
    const senderId = String(userId || route?.params?.mechanicId || '').trim();

    const handleMessage = (event) => {
      if (!event?.data) { return; }
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== 'job_location_update') { return; }
        const payloadJobId = String(payload?.job_id || '').trim();
        if (!payloadJobId || payloadJobId !== jobId) { return; }
        const senderRole = String(payload?.sender_role || payload?.role || '').trim().toLowerCase();
        const incomingSenderId = String(payload?.sender_id || payload?.user_id || '').trim();
        if (senderRole === 'mechanic' || (incomingSenderId && senderId && incomingSenderId === senderId)) { return; }
        const lat = Number(payload?.lat);
        const lng = Number(payload?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) { return; }
        setCarOwnerLocation({ latitude: lat, longitude: lng });
      } catch {
        // ignore invalid payloads
      }
    };

    if (safeToken) { connectScoped('job_location', safeToken, handleMessage); }

    const sendLocation = async () => {
      const refreshed = await refreshOnce?.();
      const current = refreshed || locationRef.current;
      if (!current) { return; }
      const payload = {
        type: 'job_location_update',
        job_id: jobId,
        sender_role: 'mechanic',
        sender_id: senderId || undefined,
        lat: current.latitude,
        lng: current.longitude,
        heading: 0,
        speed: 0,
      };
      if (safeToken) { sendScoped('job_location', payload); }
      try {
        await updateJobLocation(jobId, { lat: current.latitude, lng: current.longitude, heading: 0, speed: 0 });
      } catch {
        // ignore fallback errors
      }
    };

    const interval = setInterval(sendLocation, 5000);
    sendLocation();

    return () => {
      clearInterval(interval);
      closeScoped('job_location');
    };
  }, [jobId, refreshOnce, route?.params?.mechanicId, token, userId]);

  const handleUpdateStatus = useCallback(async (newStatus) => {
    if (!jobId || busy) { return; }

    if (newStatus === 'cancelled') {
      AppAlert.alert('Cancel job', 'Are you sure you want to cancel this job?', [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await updateJobStatus(jobId, 'cancelled');
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate(ROUTES.MECH_DASHBOARD);
              }
            } catch (err) {
              AppAlert.alert('Error', err?.message || 'Could not cancel job.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]);
      return;
    }

    setBusy(true);
    try {
      await updateJobStatus(jobId, newStatus);
      setProgressStatus(newStatus);
    } catch (err) {
      AppAlert.alert('Error', err?.message || 'Could not update job status.');
    } finally {
      setBusy(false);
    }
  }, [busy, jobId, navigation]);

  const handleCall = useCallback(async () => {
    const calleeId = recipient.id;
    if (!calleeId || !jobId) {
      AppAlert.alert('Error', 'Cannot start call — missing contact info.');
      return;
    }
    const clientCallId = `app-job-${jobId}-${Date.now()}`;
    const navParams = {
      calleeName: recipient.name,
      contextLabel: `Job #${jobId}`,
      contextType: 'job',
      contextId: jobId,
    };
    try {
      const response = await startCall({ context_type: 'job', context_id: jobId, callee_id: calleeId, client_call_id: clientCallId });
      const callId = response?.data?.call_id || response?.data?.id || response?.call_id || response?.id;
      navigation.navigate(ROUTES.CALL_OUTGOING, { ...navParams, callId });
    } catch {
      try {
        const existing = await getActiveCallForContext({ context_type: 'job', context_id: jobId });
        const callId = existing?.data?.call_id || existing?.data?.id || existing?.call_id || existing?.id;
        if (callId) {
          navigation.navigate(ROUTES.CALL_OUTGOING, { ...navParams, callId });
          return;
        }
      } catch {
        // ignore
      }
      AppAlert.alert('Error', 'Could not start call. Please try again.');
    }
  }, [jobId, navigation, recipient]);

  const renderActionButtons = () => {
    const isJobDone =
      progressStatus === 'completed' ||
      progressStatus === 'mechanic_completed' ||
      progressStatus === 'done';

    if (isJobDone) {
      return (
        <View style={styles.awaitingWrap}>
          <AppText style={styles.awaitingText}>Awaiting car owner confirmation</AppText>
        </View>
      );
    }

    if (progressStatus === 'accepted') {
      return (
        <View style={styles.actionRow}>
          <AppButton
            label={busy ? 'Updating...' : 'En Route'}
            onPress={() => handleUpdateStatus('en_route')}
            disabled={busy}
            style={styles.actionBtnPrimary}
            left={busy ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          />
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => handleUpdateStatus('cancelled')}
            disabled={busy}
          >
            <AppText style={styles.actionBtnSecondaryText}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      );
    }

    if (progressStatus === 'en_route') {
      return (
        <View style={styles.actionRow}>
          <AppButton
            label={busy ? 'Updating...' : 'Arrived'}
            onPress={() => handleUpdateStatus('arrived')}
            disabled={busy}
            style={styles.actionBtnPrimary}
            left={busy ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          />
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => handleUpdateStatus('cancelled')}
            disabled={busy}
          >
            <AppText style={styles.actionBtnSecondaryText}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      );
    }

    if (progressStatus === 'arrived') {
      return (
        <View style={styles.actionRow}>
          <AppButton
            label={busy ? 'Updating...' : 'Mark Complete'}
            onPress={() => handleUpdateStatus('completed')}
            disabled={busy}
            style={styles.actionBtnPrimary}
            left={busy ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          />
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(ROUTES.JOB_DISPUTE, { jobId })}
            disabled={busy}
          >
            <AppText style={styles.actionBtnSecondaryText}>Report Issue</AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.mapArea}>
        <OpenStreetMapView
          latitude={location?.latitude}
          longitude={location?.longitude}
          otherLatitude={carOwnerLocation?.latitude}
          otherLongitude={carOwnerLocation?.longitude}
        />
        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <HugeiconsIcon icon={CancelCircleIcon} size={22} color={darkTheme.colors.accent} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.sheet}>
        <AppText style={styles.sheetTitle}>{getSheetTitle(progressStatus)}</AppText>
        <AppText variant="muted" style={styles.sheetSubtitle}>
          {getSheetSubtitle(progressStatus, recipient.name)}
        </AppText>

        <StatusStepper currentIndex={statusIndex} />

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>{recipient.initials}</AppText>
            </View>
            <View style={styles.info}>
              <AppText style={styles.name}>{recipient.name}</AppText>
              <View style={styles.metaRow}>
                <HugeiconsIcon icon={Location01Icon} size={14} color={darkTheme.colors.muted} strokeWidth={2} />
                <AppText style={styles.metaText}>Destination shared</AppText>
                <StarIcon color={darkTheme.colors.accent} />
                <AppText style={styles.metaText}>{recipient.rating}</AppText>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              label="Call"
              onPress={handleCall}
              style={styles.callBtn}
              left={<HugeiconsIcon icon={CallIcon} size={18} color={darkTheme.colors.background} strokeWidth={2} />}
            />
            <TouchableOpacity
              style={styles.messageBtn}
              activeOpacity={0.88}
              onPress={() =>
                navigation.navigate(ROUTES.MECH_CHAT, {
                  jobId: route?.params?.jobId,
                  mechanicId: route?.params?.mechanicId,
                  carOwnerId: recipient.id,
                  customer: recipient,
                  conversationId: route?.params?.conversationId,
                  issueSummary: route?.params?.issueSummary,
                })
              }
            >
              <HugeiconsIcon icon={Mail01Icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
              <AppText style={styles.messageBtnText}>Message</AppText>
              {hasSeedMessage ? <View style={styles.messageBadge} /> : null}
            </TouchableOpacity>
          </View>
        </View>

        {renderActionButtons()}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: darkTheme.colors.background },
  mapArea: { flex: 1, backgroundColor: '#2B2B31', overflow: 'hidden' },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sheet: {
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    marginTop: -18,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xl,
  },
  sheetTitle: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  sheetSubtitle: { marginTop: darkTheme.spacing.xs, color: darkTheme.colors.muted, lineHeight: 20 },
  stepperWrap: {
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    position: 'relative',
  },
  stepTrack: {
    position: 'absolute',
    top: 8,
    left: 20,
    right: 20,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  stepTrackFill: { height: '100%', borderRadius: 999, backgroundColor: darkTheme.colors.accent },
  stepItem: { alignItems: 'center', width: 62 },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A4A6A',
    borderWidth: 1,
    borderColor: '#5F5F80',
  },
  stepDotActive: { backgroundColor: darkTheme.colors.accent, borderColor: darkTheme.colors.accent },
  stepLabel: { marginTop: darkTheme.spacing.xs, fontSize: 11, lineHeight: 14, color: darkTheme.colors.muted, textAlign: 'center' },
  stepLabelActive: { color: darkTheme.colors.accent },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: darkTheme.spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FF7B4A',
    alignItems: 'center', justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
  },
  avatarText: { color: darkTheme.colors.text, fontWeight: darkTheme.typography.fontWeights.semibold },
  info: { flex: 1 },
  name: { color: darkTheme.colors.text, fontSize: darkTheme.typography.fontSizes.md, fontWeight: darkTheme.typography.fontWeights.semibold },
  metaRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center', columnGap: 6 },
  metaText: { color: darkTheme.colors.muted, fontSize: darkTheme.typography.fontSizes.xs },
  actions: { marginTop: darkTheme.spacing.md, flexDirection: 'row', columnGap: darkTheme.spacing.sm },
  callBtn: { flex: 1, minHeight: 44 },
  messageBtn: {
    flex: 1, minHeight: 44,
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: { color: darkTheme.colors.accent, fontSize: darkTheme.typography.fontSizes.sm, fontWeight: darkTheme.typography.fontWeights.medium },
  messageBadge: {
    position: 'absolute', top: 10, right: 14,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  actionRow: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.sm,
  },
  actionBtnPrimary: { flex: 1, minHeight: 48 },
  actionBtnSecondary: {
    flex: 1,
    minHeight: 48,
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnSecondaryText: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  awaitingWrap: {
    marginTop: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
    paddingHorizontal: darkTheme.spacing.md,
    borderRadius: darkTheme.radius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  awaitingText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.sm,
    textAlign: 'center',
  },
});

export default MechanicLiveTrackingScreen;
