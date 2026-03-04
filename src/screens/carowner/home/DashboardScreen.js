import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  InteractionManager,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, Location06Icon, Mail01Icon, Notification01Icon } from '@hugeicons/core-free-icons';
import { openSettings } from 'react-native-permissions';
import { AppBottomNav, AppButton, AppText, OpenStreetMapView, PersonalInfoAlert, ScreenContainer } from '../../../components';
import { LOCATION_ENABLED } from '../../../config/featureFlags';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth, useNotifications } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { confirmJob, getLatestJobLocation, updateJobStatus } from '../../../services/jobs.service';
import { getNotifications } from '../../../services/notifications.service';
import { closeScoped, connectScoped } from '../../../services/ws.service';
import { darkTheme, withAlpha } from '../../../theme';
import { getWATGreeting, ROUTES } from '../../../utils';

const PANEL_MAX_DOWN = 320;
const TRACKER_STEPS = [
  { key: 'accepted', label: 'Accepted' },
  { key: 'en_route', label: 'En Route' },
  { key: 'arrived', label: 'Arrived' },
  { key: 'repairing', label: 'Repairing' },
  { key: 'completed', label: 'Completed' },
];

const normalizeProgressStatus = (value) => {
  const status = String(value || '').trim().toLowerCase();

  if (!status) {
    return 'accepted';
  }

  if (status === 'accepted') {
    return 'accepted';
  }

  if (status === 'en_route' || status === 'enroute' || status === 'on_the_way') {
    return 'en_route';
  }

  if (status === 'arrived') {
    return 'arrived';
  }

  if (status === 'repairing' || status === 'in_progress') {
    return 'repairing';
  }

  if (status === 'completed' || status === 'done') {
    return 'completed';
  }

  return 'accepted';
};

const extractFirstName = (user) => {
  const rawName = user?.first_name || user?.firstName || user?.full_name || user?.fullName || user?.name || '';
  const fullName = String(rawName).trim();
  return fullName ? fullName.split(/\s+/)[0] : '';
};

const normalizeAvatarUri = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (/^(https?:\/\/|file:|content:|data:|asset:)/i.test(raw)) {
    return raw;
  }

  const base = String(BASE_URL || '').trim().replace(/\/+$/, '');
  const path = raw.replace(/^\/+/, '');
  return base ? `${base}/${path}` : raw;
};

const readAvatarUri = (user) =>
  normalizeAvatarUri(
    user?.avatar ||
      user?.avatar_url ||
      user?.avatarUrl ||
      user?.avatarUri ||
      user?.profile_photo ||
      user?.profile_photo_url ||
      user?.profile_picture ||
      user?.image_url ||
      user?.photo_url ||
      ''
  );

const HelpActionRow = ({ label, onPress }) => (
  <TouchableOpacity style={styles.helpRow} activeOpacity={0.9} onPress={onPress}>
    <AppText style={styles.helpRowText}>{label}</AppText>
    <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#1A1A1A" strokeWidth={2} />
  </TouchableOpacity>
);

const LocationFallbackCard = ({ isBlocked, onEnableLocation, onOpenSettings, loading, locationEnabled }) => (
  <View style={styles.locationFallbackWrap}>
    <View style={styles.locationFallbackCard}>
      <View style={styles.locationIconWrap}>
        <HugeiconsIcon icon={Location06Icon} size={20} color={darkTheme.colors.accent} strokeWidth={2} />
      </View>
      <AppText style={styles.locationFallbackTitle}>Location is off</AppText>
      <AppText style={styles.locationFallbackBody}>
        {locationEnabled
          ? 'Turn on location to find mechanics near you.'
          : 'Location is temporarily disabled while map setup is pending.'}
      </AppText>

      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.locationActionBtn, loading ? styles.locationActionBtnDisabled : null]}
        onPress={onEnableLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#1A1A1A" />
        ) : (
          <AppText style={styles.locationActionBtnText}>
            {locationEnabled ? 'Enable location' : 'Location unavailable'}
          </AppText>
        )}
      </TouchableOpacity>

      {isBlocked ? (
        <TouchableOpacity activeOpacity={0.9} style={styles.settingsBtn} onPress={onOpenSettings}>
          <AppText style={styles.settingsBtnText}>Open settings</AppText>
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

const DashboardScreen = ({ navigation, route }) => {
  const { user, token } = useAuth();
  const { unreadTick } = useNotifications();
  const { location, permissionStatus, loading, requestPermission, refreshOnce } = useUserLocation();
  const [activeSession, setActiveSession] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trackedLocation, setTrackedLocation] = useState(null);
  const panelY = useRef(new Animated.Value(0)).current;
  const panelYRef = useRef(0);
  const dragStartRef = useRef(0);
  const lastLocationUpdateRef = useRef(0);
  const locationPollRef = useRef(null);

  useEffect(() => {
    const id = panelY.addListener(({ value }) => {
      panelYRef.current = value;
    });
    return () => panelY.removeListener(id);
  }, [panelY]);

  useEffect(() => {
    const sessionParam = route?.params?.activeSession;
    if (sessionParam && typeof sessionParam === 'object') {
      setActiveSession((prev) => ({
        ...(prev || {}),
        ...sessionParam,
        progressStatus: normalizeProgressStatus(sessionParam?.progressStatus),
      }));
      navigation.setParams?.({ activeSession: undefined });
    }
  }, [navigation, route?.params?.activeSession]);

  const firstName = extractFirstName(user);
  const greetingPrefix = getWATGreeting();
  const greetingText = firstName ? `${greetingPrefix}, ${firstName}` : greetingPrefix;
  const avatarInitial = firstName.charAt(0).toUpperCase() || 'U';
  const avatarUri = readAvatarUri(user);
  const hasLocationPermission = LOCATION_ENABLED && permissionStatus === 'granted';
  const isLocationBlocked = LOCATION_ENABLED && permissionStatus === 'blocked';

  useFocusEffect(
    useCallback(() => {
      if (!LOCATION_ENABLED || !hasLocationPermission) {
        return undefined;
      }
      refreshOnce();
      return undefined;
    }, [hasLocationPermission, refreshOnce])
  );

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        panelY.setValue(0);
        panelYRef.current = 0;
      });

      return () => task?.cancel?.();
    }, [panelY])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchUnread = async () => {
        try {
          const response = await getNotifications({ page: 1, limit: 1 });
          const payload = response?.data || response || {};
          const count = Number(payload?.unread_count || 0);
          if (active) setUnreadCount(Number.isFinite(count) ? count : 0);
        } catch {
          if (active) setUnreadCount(0);
        }
      };

      fetchUnread();

      return () => {
        active = false;
      };
    }, [unreadTick])
  );

  useEffect(() => {
    const jobId = String(activeSession?.jobId || '').trim();
    const safeToken = String(token || '').trim();
    const progressStatus = normalizeProgressStatus(activeSession?.progressStatus);
    const trackingAllowed = ['accepted', 'en_route', 'arrived', 'repairing'].includes(progressStatus);

    if (!jobId || !safeToken || !trackingAllowed) {
      setTrackedLocation(null);
      closeScoped('job_location');
      return undefined;
    }

    let mounted = true;
    lastLocationUpdateRef.current = 0;

    const handleMessage = (event) => {
      if (!event?.data) {
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== 'job_location_update') {
          return;
        }

        const payloadJobId = String(payload?.job_id || '').trim();
        if (!payloadJobId || payloadJobId !== jobId) {
          return;
        }

        const lat = Number(payload?.lat);
        const lng = Number(payload?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }

        lastLocationUpdateRef.current = Date.now();
        if (mounted) {
          setTrackedLocation({ latitude: lat, longitude: lng });
        }
      } catch {
        // ignore invalid payloads
      }
    };

    connectScoped('job_location', safeToken, handleMessage);

    const pollLatest = async () => {
      try {
        const response = await getLatestJobLocation(jobId);
        const payload = response?.data || response || {};
        const lat = Number(payload?.lat ?? payload?.latitude);
        const lng = Number(payload?.lng ?? payload?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return;
        }

        lastLocationUpdateRef.current = Date.now();
        if (mounted) {
          setTrackedLocation({ latitude: lat, longitude: lng });
        }
      } catch {
        // ignore polling errors
      }
    };

    const interval = setInterval(() => {
      const lastUpdate = lastLocationUpdateRef.current || 0;
      if (!lastUpdate || Date.now() - lastUpdate > 5000) {
        pollLatest();
      }
    }, 3000);

    locationPollRef.current = interval;

    return () => {
      mounted = false;
      if (locationPollRef.current) {
        clearInterval(locationPollRef.current);
        locationPollRef.current = null;
      }
      closeScoped('job_location');
    };
  }, [activeSession?.jobId, activeSession?.progressStatus, token]);

  const locationBadgeText = useMemo(() => {
    if (!location) {
      return 'Detecting location...';
    }
    return `Lat ${location.latitude.toFixed(4)} - Lng ${location.longitude.toFixed(4)}`;
  }, [location]);

  const handleTabPress = (routeName) => {
    if (routeName === ROUTES.CAR_OWNER_DASHBOARD) {
      return;
    }
    navigation.navigate(routeName);
  };

  const handleEnableLocation = useCallback(async () => {
    if (!LOCATION_ENABLED) {
      return;
    }
    const status = await requestPermission();
    if (status === 'granted') {
      await refreshOnce();
    }
  }, [refreshOnce, requestPermission]);

  const animatePanelTo = useCallback(
    (toValue) => {
      Animated.spring(panelY, {
        toValue,
        useNativeDriver: true,
        friction: 9,
        tension: 55,
      }).start();
    },
    [panelY]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderGrant: () => {
          dragStartRef.current = panelYRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.max(0, Math.min(PANEL_MAX_DOWN, dragStartRef.current + gesture.dy));
          panelY.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const next = panelYRef.current + gesture.dy;
          if (next > PANEL_MAX_DOWN * 0.45) {
            animatePanelTo(PANEL_MAX_DOWN);
          } else {
            animatePanelTo(0);
          }
        },
      }),
    [animatePanelTo, panelY]
  );

  const handleOpenChat = () => {
    const conversationId = String(activeSession?.conversationId || '').trim();
    const jobId = String(activeSession?.jobId || '').trim();
    if (!conversationId || !jobId) {
      return;
    }
    navigation.navigate(ROUTES.CAR_OWNER_CHAT, {
      conversationId,
      jobId,
      mechanic: activeSession?.mechanic,
      mechanicId: activeSession?.mechanicId,
      issueSummary: activeSession?.issueSummary,
      progressStatus: activeSession?.progressStatus,
    });
  };

  const handleCancelJob = async () => {
    const jobId = String(activeSession?.jobId || '').trim();
    if (!jobId || cancelling) {
      return;
    }

    setCancelling(true);
    try {
      await updateJobStatus(jobId, 'cancelled');
      setActiveSession(null);
      Alert.alert('Cancelled', 'Job has been cancelled.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not cancel job.');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmRepairing = async () => {
    const jobId = String(activeSession?.jobId || '').trim();
    if (!jobId || syncing) {
      return;
    }
    setSyncing(true);
    try {
      // TODO: Confirm backend allows car owners to mark arrival/repairing.
      await updateJobStatus(jobId, 'repairing');
      setActiveSession((prev) => (prev ? { ...prev, progressStatus: 'repairing' } : prev));
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not update repairing status.');
    } finally {
      setSyncing(false);
    }
  };

  const handleConfirmCompletion = async () => {
    const jobId = String(activeSession?.jobId || '').trim();
    if (!jobId || syncing) {
      return;
    }
    setSyncing(true);
    try {
      // TODO: Confirm escrow debit/release result from API response.
      await confirmJob(jobId);
      setActiveSession((prev) => (prev ? { ...prev, progressStatus: 'completed' } : prev));
      Alert.alert('Success', 'Job completion confirmed.');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Could not confirm completion.');
    } finally {
      setSyncing(false);
    }
  };

  const renderDefaultContent = () => (
    <>
      <AppText variant="title" style={styles.sheetTitle}>
        Need help now?
      </AppText>
      <AppText variant="muted" style={styles.sheetSubtitle}>
        Our certified mechanics are nearby
      </AppText>
      <HelpActionRow label="I know the issues" onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REPORT_ISSUE)} />
      <HelpActionRow label="Diagnose my car" onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REQUEST_DIAGNOSTICS)} />
    </>
  );

  const renderTrackingContent = () => {
    const mechanic = activeSession?.mechanic || { name: 'Assigned mechanic', initials: 'M', rating: '4.8' };
    const progressStatus = normalizeProgressStatus(activeSession?.progressStatus);
    const currentStepIndex = TRACKER_STEPS.findIndex((item) => item.key === progressStatus);
    const currentLabel = TRACKER_STEPS[Math.max(0, currentStepIndex)]?.label || 'Accepted';
    const isCompleted = progressStatus === 'completed';

    return (
      <>
        <AppText style={styles.trackTitle}>Live tracking</AppText>
        <AppText variant="muted" style={styles.trackSubtitle}>
          {`${mechanic.name} is now active on this job.`}
        </AppText>

        <View style={styles.trackerWrap}>
          {TRACKER_STEPS.map((step, index) => {
            const active = index <= currentStepIndex;
            return (
              <View key={step.key} style={styles.trackerStep}>
                <View style={[styles.trackerDot, active ? styles.trackerDotActive : null]} />
                <AppText style={[styles.trackerText, active ? styles.trackerTextActive : null]}>{step.label}</AppText>
              </View>
            );
          })}
        </View>
        <AppText style={styles.trackerHint}>Current progress: {currentLabel}</AppText>

        <View style={styles.trackCard}>
          <View style={styles.trackRow}>
            <View style={styles.trackAvatar}>
              <AppText style={styles.trackAvatarText}>{mechanic.initials || 'M'}</AppText>
            </View>
            <View style={styles.trackInfo}>
              <AppText style={styles.trackName}>{mechanic.name}</AppText>
              <AppText style={styles.trackMeta}>Rating {mechanic.rating || '4.8'}</AppText>
            </View>
          </View>

        {!isCompleted ? (
          <View style={styles.trackActions}>
            <AppButton label="Message" onPress={handleOpenChat} style={styles.trackBtn} />
            <TouchableOpacity style={styles.callBtn} activeOpacity={0.88} onPress={handleCancelJob} disabled={cancelling}>
              <HugeiconsIcon icon={Mail01Icon} size={16} color={darkTheme.colors.accent} strokeWidth={2} />
              <AppText style={styles.callBtnText}>{cancelling ? 'Cancelling...' : 'Cancel'}</AppText>
            </TouchableOpacity>
          </View>
        ) : null}
        </View>

        <View style={styles.trackFooterActions}>
          {!isCompleted && (progressStatus === 'en_route' || progressStatus === 'arrived') ? (
            <AppButton
              label={syncing ? 'Updating...' : 'Confirm arrived & started repairing'}
              onPress={handleConfirmRepairing}
              disabled={syncing}
            />
          ) : null}
          {!isCompleted ? (
            <AppButton
              label={syncing ? 'Confirming...' : 'Confirm completion (after payment)'}
              onPress={handleConfirmCompletion}
              disabled={syncing || progressStatus !== 'repairing'}
            />
          ) : null}
          {isCompleted ? (
            <>
              <View style={styles.postCompleteRow}>
                <TouchableOpacity
                  style={styles.secondaryActionHalf}
                  activeOpacity={0.88}
                  onPress={() =>
                    navigation.navigate(ROUTES.CAR_OWNER_RATE_MECHANIC, {
                      mechanicId: activeSession?.mechanicId || null,
                      mechanicName: mechanic.name,
                      issueName: activeSession?.issueSummary?.issueType || '',
                      jobId: activeSession?.jobId || null,
                    })
                  }
                >
                  <AppText style={styles.secondaryActionText}>Rate mechanic</AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryActionHalf}
                  activeOpacity={0.88}
                  onPress={() => setActiveSession(null)}
                >
                  <AppText style={styles.secondaryActionText}>Back to home</AppText>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.secondaryAction}
                activeOpacity={0.88}
                onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REPORT_ISSUE)}
              >
                <AppText style={styles.secondaryActionText}>Report an issue</AppText>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      </>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
      <PersonalInfoAlert />
      <View style={styles.mapBackdrop}>
        {hasLocationPermission ? (
          <>
            <OpenStreetMapView
              latitude={location?.latitude}
              longitude={location?.longitude}
              otherLatitude={trackedLocation?.latitude}
              otherLongitude={trackedLocation?.longitude}
            />
            {!location ? (
              <View style={styles.locationLoadingOverlay}>
                <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                <AppText style={styles.locationLoadingText}>Getting your location...</AppText>
              </View>
            ) : null}
            <View style={styles.locationLiveBadge}>
              <AppText style={styles.locationLiveBadgeText}>{locationBadgeText}</AppText>
            </View>
            <View style={styles.osmAttribution}>
              <AppText style={styles.osmAttributionText}>Map data © OpenStreetMap contributors</AppText>
            </View>
          </>
        ) : (
          <LocationFallbackCard
            isBlocked={isLocationBlocked}
            onEnableLocation={handleEnableLocation}
            onOpenSettings={openSettings}
            loading={loading}
            locationEnabled={LOCATION_ENABLED}
          />
        )}

        <View style={styles.topBar}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {avatarUri ? <Image source={{ uri: avatarUri }} style={styles.avatarImage} /> : <AppText style={styles.avatarText}>{avatarInitial}</AppText>}
            </View>
            <View>
              <AppText variant="body" style={styles.greeting}>
                {greetingText}
              </AppText>
              <AppText variant="muted" style={styles.greetingSub}>
                Ready for the road?
              </AppText>
            </View>
          </View>

          <TouchableOpacity style={styles.bellButton} activeOpacity={0.85} onPress={() => navigation.navigate('Notifications')}>
            <HugeiconsIcon icon={Notification01Icon} size={22} color={darkTheme.colors.text} strokeWidth={1.8} />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <AppText style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</AppText>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: panelY }] }]} {...panResponder.panHandlers}>
        <View style={styles.handle} />
        <View style={styles.contentArea}>{activeSession ? renderTrackingContent() : renderDefaultContent()}</View>
      </Animated.View>

      <TouchableOpacity style={styles.peekHandle} activeOpacity={0.9} onPress={() => animatePanelTo(0)}>
        <View style={styles.peekPill} />
      </TouchableOpacity>

      </ScreenContainer>

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_DASHBOARD} onTabPress={handleTabPress} style={styles.stickyFooter} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  screen: { flex: 1, backgroundColor: darkTheme.colors.background },
  mapBackdrop: { flex: 1, backgroundColor: '#2B2B31', overflow: 'hidden' },
  topBar: {
    marginTop: darkTheme.spacing.xl,
    paddingHorizontal: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLoadingOverlay: {
    position: 'absolute',
    left: darkTheme.spacing.lg,
    right: darkTheme.spacing.lg,
    bottom: 190,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(0,0,51,0.78)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  locationLiveBadge: {
    position: 'absolute',
    left: darkTheme.spacing.lg,
    right: darkTheme.spacing.lg,
    bottom: 240,
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(0,0,51,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.sm,
  },
  locationLiveBadgeText: { color: darkTheme.colors.accent, fontSize: darkTheme.typography.fontSizes.xs },
  osmAttribution: { position: 'absolute', left: darkTheme.spacing.sm, right: darkTheme.spacing.sm, bottom: 6, alignItems: 'center' },
  osmAttributionText: { color: '#AAB0C2', fontSize: 10 },
  locationLoadingText: { color: darkTheme.colors.text, fontSize: darkTheme.typography.fontSizes.sm },
  locationFallbackWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: darkTheme.spacing.lg },
  locationFallbackCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(0,0,51,0.8)',
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.lg,
    alignItems: 'center',
  },
  locationIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  locationFallbackTitle: { color: darkTheme.colors.text, fontSize: darkTheme.typography.fontSizes.lg, fontWeight: darkTheme.typography.fontWeights.semibold },
  locationFallbackBody: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    textAlign: 'center',
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 20,
    marginBottom: darkTheme.spacing.md,
  },
  locationActionBtn: {
    minHeight: 44,
    minWidth: 170,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
  },
  locationActionBtnDisabled: { opacity: 0.85 },
  locationActionBtnText: { color: '#1A1A1A', fontSize: darkTheme.typography.fontSizes.sm, fontWeight: darkTheme.typography.fontWeights.medium },
  settingsBtn: { marginTop: darkTheme.spacing.sm, paddingVertical: 6, paddingHorizontal: 8 },
  settingsBtnText: { color: darkTheme.colors.text, textDecorationLine: 'underline', fontSize: darkTheme.typography.fontSizes.sm },
  avatarWrap: { flexDirection: 'row', alignItems: 'center', gap: darkTheme.spacing.sm },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF7B4A',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarText: { color: darkTheme.colors.text, fontWeight: darkTheme.typography.fontWeights.bold },
  greeting: { color: darkTheme.colors.text, fontWeight: darkTheme.typography.fontWeights.semibold },
  greetingSub: { color: darkTheme.colors.muted, marginTop: darkTheme.spacing.xxs },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: darkTheme.colors.background,
  },
  bellBadgeText: {
    color: '#1A1A1A',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 56,
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    paddingTop: darkTheme.spacing.md,
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.lg,
    minHeight: 320,
  },
  peekHandle: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 66,
    width: 92,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peekPill: {
    width: 54,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  handle: { alignSelf: 'center', width: 76, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.65)', marginBottom: darkTheme.spacing.md },
  contentArea: { width: '100%' },
  sheetTitle: {
    color: darkTheme.colors.text,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  sheetSubtitle: {
    marginTop: darkTheme.spacing.xs,
    textAlign: 'center',
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
    marginBottom: darkTheme.spacing.lg,
  },
  helpRow: {
    minHeight: 56,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: darkTheme.colors.accent,
    paddingHorizontal: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkTheme.spacing.md,
  },
  helpRowText: { color: '#1A1A1A', fontSize: 14, lineHeight: 20, fontWeight: darkTheme.typography.fontWeights.regular },
  trackTitle: {
    color: darkTheme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  trackSubtitle: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.md,
  },
  trackCard: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: darkTheme.spacing.md,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF7B4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
  },
  trackAvatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  trackInfo: { flex: 1 },
  trackName: { color: darkTheme.colors.text, fontWeight: darkTheme.typography.fontWeights.semibold },
  trackMeta: { color: darkTheme.colors.muted, marginTop: 2 },
  trackerWrap: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.md,
    paddingVertical: darkTheme.spacing.sm,
    paddingHorizontal: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackerStep: { width: 62, alignItems: 'center' },
  trackerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginBottom: 4,
  },
  trackerDotActive: { backgroundColor: darkTheme.colors.accent },
  trackerText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    textAlign: 'center',
  },
  trackerTextActive: {
    color: darkTheme.colors.accent,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  trackerHint: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    textAlign: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  trackActions: { marginTop: darkTheme.spacing.md, rowGap: darkTheme.spacing.sm },
  trackBtn: { minHeight: 44 },
  callBtn: {
    minHeight: 44,
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  callBtnText: { color: darkTheme.colors.accent, fontWeight: darkTheme.typography.fontWeights.medium },
  trackFooterActions: { marginTop: darkTheme.spacing.md, rowGap: darkTheme.spacing.sm },
  postCompleteRow: {
    flexDirection: 'row',
    columnGap: darkTheme.spacing.sm,
  },
  secondaryActionHalf: {
    flex: 1,
    minHeight: 42,
    borderRadius: darkTheme.radius.md,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryAction: {
    minHeight: 42,
    borderRadius: darkTheme.radius.md,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: { color: darkTheme.colors.accent, fontWeight: darkTheme.typography.fontWeights.medium },
  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default DashboardScreen;
