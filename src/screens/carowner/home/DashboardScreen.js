import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, Location06Icon, Notification01Icon } from '@hugeicons/core-free-icons';
import { openSettings } from 'react-native-permissions';
import { AppBottomNav, AppText, OpenStreetMapView, ScreenContainer } from '../../../components';
import { LOCATION_ENABLED } from '../../../config/featureFlags';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { darkTheme, withAlpha } from '../../../theme';
import { getWATGreeting, ROUTES } from '../../../utils';

const extractFirstName = (user) => {
  const rawName =
    user?.first_name ||
    user?.firstName ||
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    '';
  const fullName = String(rawName).trim();

  if (!fullName) {
    return '';
  }

  return fullName.split(/\s+/)[0];
};

const HelpActionRow = ({ label, onPress }) => {
  return (
    <TouchableOpacity style={styles.helpRow} activeOpacity={0.9} onPress={onPress}>
      <AppText style={styles.helpRowText}>{label}</AppText>
      <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#1A1A1A" strokeWidth={2} />
    </TouchableOpacity>
  );
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

const LocationFallbackCard = ({ isBlocked, onEnableLocation, onOpenSettings, loading, locationEnabled }) => {
  return (
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
};

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { location, permissionStatus, loading, requestPermission, refreshOnce } =
    useUserLocation();

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

      // watchPosition is disabled on this build (Play Services version mismatch).
      // Refresh location with a single reading whenever the screen gains focus.
      refreshOnce();

      return undefined;
    }, [hasLocationPermission, refreshOnce])
  );

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
      // TODO: ADD VALID API KEY AND RE-ENABLE LOCATION FLOW.
      return;
    }

    const status = await requestPermission();

    if (status === 'granted') {
      await refreshOnce();
    }
  }, [refreshOnce, requestPermission]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.mapBackdrop}>
        {hasLocationPermission ? (
          <>
            <OpenStreetMapView latitude={location?.latitude} longitude={location?.longitude} />

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
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <AppText style={styles.avatarText}>{avatarInitial}</AppText>
              )}
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

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Notifications')}
          >
            <HugeiconsIcon icon={Notification01Icon} size={22} color={darkTheme.colors.text} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <AppText variant="title" style={styles.sheetTitle}>
          Need help now?
        </AppText>

        <AppText variant="muted" style={styles.sheetSubtitle}>
          Our certified mechanics are nearby
        </AppText>

        <HelpActionRow
          label="I know the issues"
          onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REPORT_ISSUE)}
        />

        <HelpActionRow
          label="Diagnose my car"
          onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REQUEST_DIAGNOSTICS)}
        />
      </View>

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_DASHBOARD} onTabPress={handleTabPress} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  mapBackdrop: {
    flex: 1,
    backgroundColor: '#2B2B31',
    overflow: 'hidden',
  },
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
  locationLiveBadgeText: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  osmAttribution: {
    position: 'absolute',
    left: darkTheme.spacing.sm,
    right: darkTheme.spacing.sm,
    bottom: 6,
    alignItems: 'center',
  },
  osmAttributionText: {
    color: '#AAB0C2',
    fontSize: 10,
  },
  locationLoadingText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  locationFallbackWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
  },
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
  locationFallbackTitle: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.lg,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
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
  locationActionBtnDisabled: {
    opacity: 0.85,
  },
  locationActionBtnText: {
    color: '#1A1A1A',
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  settingsBtn: {
    marginTop: darkTheme.spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  settingsBtnText: {
    color: darkTheme.colors.text,
    textDecorationLine: 'underline',
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF7B4A',
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
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  greeting: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  greetingSub: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.xxs,
  },
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
  bottomSheet: {
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    marginTop: -18,
    paddingTop: darkTheme.spacing.md,
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 76,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginBottom: darkTheme.spacing.md,
  },
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
  helpRowText: {
    color: '#1A1A1A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
});

export default DashboardScreen;
