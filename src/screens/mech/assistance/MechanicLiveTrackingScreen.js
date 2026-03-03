import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CallIcon, CancelCircleIcon, Location01Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, OpenStreetMapView, ScreenContainer } from '../../../components';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const STATUS_STEPS = ['Accepted', 'En Route', 'Arrived', 'Repairing', 'Done'];
const toStatusIndex = (value) => {
  const status = String(value || '').trim().toLowerCase();

  if (status === 'accepted') {
    return 0;
  }
  if (status === 'en_route' || status === 'enroute' || status === 'on_the_way') {
    return 1;
  }
  if (status === 'arrived') {
    return 2;
  }
  if (status === 'repairing' || status === 'in_progress') {
    return 3;
  }
  if (status === 'completed' || status === 'done') {
    return 4;
  }

  return 1;
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
  const { location } = useUserLocation();
  const [trackedLocation, setTrackedLocation] = useState(null);
  const trackerAngleRef = useRef(0);

  const customer = route?.params?.customer || {
    id: route?.params?.carOwnerId || '',
    name: route?.params?.carOwnerName || 'Car Owner',
    initials: 'CO',
    rating: '4.8',
  };

  const recipient = useMemo(() => ({
    name: customer?.name || 'Car Owner',
    initials: customer?.initials || 'CO',
    rating: customer?.rating || '4.8',
    id: customer?.id || route?.params?.carOwnerId || null,
  }), [customer, route?.params?.carOwnerId]);
  const hasSeedMessage = Boolean(route?.params?.issueSummary);
  // TODO(map/geofence): when mechanic reaches the owner's exact location, this
  // status should be moved to `arrived` automatically from live GPS distance.
  const statusIndex = toStatusIndex(route?.params?.trackingStatus || route?.params?.progressStatus);

  useEffect(() => {
    if (!location) {
      setTrackedLocation(null);
      return undefined;
    }

    const radius = 0.002;
    const centerLat = location.latitude;
    const centerLng = location.longitude;
    let mounted = true;

    const tick = () => {
      trackerAngleRef.current = (trackerAngleRef.current + 0.16) % (Math.PI * 2);
      const nextLat = centerLat + radius * Math.cos(trackerAngleRef.current);
      const nextLng = centerLng + radius * Math.sin(trackerAngleRef.current);
      if (mounted) {
        setTrackedLocation({ latitude: nextLat, longitude: nextLng });
      }
    };

    tick();
    const interval = setInterval(tick, 1500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [location]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.mapArea}>
        <OpenStreetMapView
          latitude={location?.latitude}
          longitude={location?.longitude}
          otherLatitude={trackedLocation?.latitude}
          otherLongitude={trackedLocation?.longitude}
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
        <AppText style={styles.sheetTitle}>En Route</AppText>
        <AppText variant="muted" style={styles.sheetSubtitle}>
          You are on your way to {recipient.name}
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
              onPress={() => Alert.alert('Call', `Calling ${recipient.name}`)}
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
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#2B2B31',
    overflow: 'hidden',
  },
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
  sheetSubtitle: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    lineHeight: 20,
  },
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
  stepTrackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  stepItem: {
    alignItems: 'center',
    width: 62,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4A4A6A',
    borderWidth: 1,
    borderColor: '#5F5F80',
  },
  stepDotActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  stepLabel: {
    marginTop: darkTheme.spacing.xs,
    fontSize: 11,
    lineHeight: 14,
    color: darkTheme.colors.muted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: darkTheme.colors.accent,
  },
  card: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: darkTheme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF7B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  info: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  metaText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  actions: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.sm,
  },
  callBtn: {
    flex: 1,
    minHeight: 44,
  },
  messageBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBtnText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  messageBadge: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});

export default MechanicLiveTrackingScreen;
