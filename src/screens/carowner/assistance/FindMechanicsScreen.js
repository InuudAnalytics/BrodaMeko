import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AppText, NoInternetState, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useChat } from '../../../context';
import { useNotifications } from '../../../context';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { getMechanicsForJob, hireMechanicForJob } from '../../../services/jobs.service';
import { getMechanicReviews } from '../../../services/mechanic-reviews.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import { parseAddressComponents, reverseGeocode } from '../../../utils/places';

const BackIcon = ({ color }) => {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6L9 12L15 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const StarIcon = ({ color }) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
        fill={color}
      />
    </Svg>
  );
};

const readMechanics = (payload) => {
  const root = payload?.data || payload || {};

  if (Array.isArray(root)) {
    return root;
  }

  if (Array.isArray(root.mechanics)) {
    return root.mechanics;
  }

  if (Array.isArray(root.items)) {
    return root.items;
  }

  if (Array.isArray(root.results)) {
    return root.results;
  }

  return [];
};

const readIssueType = (payload) => {
  const root = payload?.data || payload || {};
  return String(root?.issue_type || '').trim();
};

const parseMaybeNumber = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const fromString = parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(fromString) ? fromString : 0;
};

const toPriceRange = (services, fallbackIssueType) => {
  const safeServices = Array.isArray(services) ? services : [];
  if (!safeServices.length) {
    return '';
  }

  const safeIssueType = String(fallbackIssueType || '').trim().toLowerCase();
  const matchedService = safeIssueType
    ? safeServices.find((service) => String(service?.issue_type || '').trim().toLowerCase() === safeIssueType)
    : null;
  const target = matchedService || safeServices[0] || null;

  if (!target) {
    return '';
  }

  const minPrice = Number(target?.min_price || target?.minPrice || 0);
  const maxPrice = Number(target?.max_price || target?.maxPrice || 0);

  if (minPrice > 0 && maxPrice > 0) {
    return `₦${minPrice.toLocaleString('en-NG')}-${maxPrice.toLocaleString('en-NG')}`;
  }

  if (minPrice > 0) {
    return `₦${minPrice.toLocaleString('en-NG')}`;
  }

  if (maxPrice > 0) {
    return `₦${maxPrice.toLocaleString('en-NG')}`;
  }

  return '';
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeMechanic = (item, index, fallbackIssueType = '', userLat = null, userLon = null) => {
  const user = item?.user || {};
  const fullName =
    item?.name ||
    item?.full_name ||
    item?.mechanic_name ||
    user?.name ||
    user?.full_name ||
    `Mechanic ${index + 1}`;
  const initials = String(fullName)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'M';

  const priceRange =
    toPriceRange(item?.services, fallbackIssueType) ||
    toPriceRange(item?.service_estimates, fallbackIssueType) ||
    (() => {
      const minPrice = Number(item?.min_price || item?.minPrice || item?.min || 0);
      const maxPrice = Number(item?.max_price || item?.maxPrice || item?.max || 0);
      if (minPrice > 0 && maxPrice > 0) {
        return `₦${minPrice.toLocaleString('en-NG')}-${maxPrice.toLocaleString('en-NG')}`;
      }
      if (minPrice > 0) {
        return `₦${minPrice.toLocaleString('en-NG')}`;
      }
      if (maxPrice > 0) {
        return `₦${maxPrice.toLocaleString('en-NG')}`;
      }
      return '';
    })();

  const avatarUri = normalizeAvatarUri(
    item?.avatar?.url ||
    item?.avatar ||
    item?.avatar_url ||
    item?.avatarUrl ||
    item?.profile_photo ||
    item?.profile_photo_url ||
    item?.profile_picture ||
    item?.image_url ||
    item?.photo_url ||
    item?.user?.avatar ||
    item?.user?.avatar_url ||
    item?.user?.profile_photo ||
    item?.user?.avatar?.url ||
    ''
  );
  const specialty =
    item?.specialty ||
    item?.specialization ||
    item?.service_type ||
    item?.issue_type ||
    item?.expertise ||
    '';
  const experienceYears = item?.years_of_experience || item?.experience_years || item?.yearsExperience || '';
  const details = [specialty ? String(specialty) : '', experienceYears ? `${experienceYears} yrs exp` : '']
    .filter(Boolean)
    .join(' • ');

  const computedDistanceKm = (() => {
    const backendDist = parseMaybeNumber(item?.distance_km || item?.distance || 0);
    if (backendDist > 0) return backendDist;
    if (!userLat || !userLon) return 0;
    const addresses = Array.isArray(item?.shop_addresses) ? item.shop_addresses : [];
    const addr =
      addresses.find((a) => a.is_primary && a.latitude && a.longitude) ||
      addresses.find((a) => a.latitude && a.longitude);
    if (!addr) return 0;
    return Math.round(haversineKm(userLat, userLon, addr.latitude, addr.longitude) * 10) / 10;
  })();

  return {
    id: String(item?.id || item?._id || item?.mechanic_id || `mech-${index}`),
    name: fullName,
    initials,
    avatarUri,
    details,
    rating: parseMaybeNumber(item?.rating || item?.average_rating || user?.rating || user?.average_rating || 0),
    distanceKm: computedDistanceKm,
    etaMins: parseMaybeNumber(item?.eta_minutes || item?.eta || 0) || (computedDistanceKm > 0 ? Math.round((computedDistanceKm / 30) * 60) : 0),
    priceRange: priceRange || 'Price on request',
    available: item?.available !== false,
    raw: item,
  };
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

const normalizeIssueSummary = (job) => {
  const source = job && typeof job === 'object' ? job : {};
  const images = Array.isArray(source?.images) ? source.images : [];

  const imageUris = images
    .map((image) => {
      if (typeof image === 'string') {
        return normalizeAvatarUri(image);
      }
      return normalizeAvatarUri(image?.url || image?.uri || image?.path || '');
    })
    .filter(Boolean);

  return {
    issueType: String(source?.issue_type || source?.title || '').trim(),
    description: String(source?.description || '').trim(),
    carMake: String(source?.car_make || '').trim(),
    images: imageUris,
  };
};

const HireButton = ({ onPress, loading }) => {
  return (
    <Pressable onPress={onPress} disabled={loading} style={[styles.hireButton, loading ? styles.hireButtonBusy : null]}>
      {loading ? (
        <ActivityIndicator size="small" color={darkTheme.colors.background} />
      ) : (
        <AppText style={styles.hireButtonText}>Hire</AppText>
      )}
    </Pressable>
  );
};

const MechanicCard = ({ item, loading, onHire }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.avatar}>
          {item.avatarUri ? (
            <Image source={{ uri: item.avatarUri }} style={styles.avatarImage} />
          ) : (
            <AppText style={styles.avatarText}>{item.initials}</AppText>
          )}
        </View>

        <View style={styles.identityColumn}>
          <AppText style={styles.name}>{item.name}</AppText>

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <StarIcon color={darkTheme.colors.accent} />
              <AppText style={styles.metaText}>{item.rating ? item.rating.toFixed(1) : 'N/A'}</AppText>
            </View>
            <AppText style={styles.metaDot}>•</AppText>
            <AppText style={styles.metaText}>{item.distanceKm ? `${item.distanceKm}km away` : 'Distance N/A'}</AppText>
            <AppText style={styles.metaDot}>•</AppText>
            <AppText style={styles.metaText}>{item.etaMins ? `${item.etaMins} minutes` : 'ETA N/A'}</AppText>
          </View>
        </View>
      </View>

      <View style={styles.cardBottomRow}>
        <View style={styles.priceColumn}>
          <AppText style={styles.priceLabel}>Estimated price</AppText>
          <AppText style={styles.priceValue}>{item.priceRange}</AppText>
        </View>

        {item.available ? (
          <HireButton onPress={onHire} loading={loading} />
        ) : (
          <View style={styles.unavailableWrap}>
            <AppText style={styles.unavailableText}>Unavailable</AppText>
          </View>
        )}
      </View>
    </View>
  );
};

const FindMechanicsScreen = ({ navigation, route }) => {
  const { clearActiveConversation } = useChat();
  const { permissionStatus: notificationPermissionStatus, promptPermissionIfNeeded } = useNotifications();
  const { location, permissionStatus: locationPermissionStatus, requestPermission, refreshOnce } = useUserLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMechanicId, setLoadingMechanicId] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [matchedIssueType, setMatchedIssueType] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const hasAutoRequestedLocationRef = useRef(false);

  const jobId = String(route?.params?.jobId || '').trim();
  const issueSummary = normalizeIssueSummary(route?.params?.job);
  const locationText = locationLabel || route?.params?.location || 'Detecting location...';

  useEffect(() => {
    promptPermissionIfNeeded?.('car_owner_find_mechanics_mount');
    refreshOnce?.();
  }, [promptPermissionIfNeeded, refreshOnce]);

  useEffect(() => {
    const locationStatus = String(locationPermissionStatus || '').toLowerCase();
    const notifStatus = String(notificationPermissionStatus || '').toLowerCase();
    if (locationStatus !== 'unknown') {
      return;
    }
    if (notifStatus === 'unknown') {
      return;
    }
    if (hasAutoRequestedLocationRef.current) {
      return;
    }
    hasAutoRequestedLocationRef.current = true;
    requestPermission();
  }, [locationPermissionStatus, notificationPermissionStatus, requestPermission, hasAutoRequestedLocationRef]);

  useEffect(() => {
    let active = true;

    const resolveLocation = async () => {
      if (!location?.latitude || !location?.longitude) {
        return;
      }

      try {
        const response = await reverseGeocode({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        const parsed = parseAddressComponents(response?.components || []);
        const city = parsed.city || '';
        const state = parsed.state || '';
        const label = [city, state].filter(Boolean).join(', ');
        if (active && label) {
          setLocationLabel(label);
        }
      } catch {
        // ignore geocode errors
      }
    };

    resolveLocation();

    return () => {
      active = false;
    };
  }, [location]);

  const fetchMechanics = useCallback(async () => {
    if (!jobId) {
      setError('No job selected.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await getMechanicsForJob(jobId);
      const issueType = readIssueType(response) || issueSummary?.issueType || '';
      setMatchedIssueType(issueType);
      const userLat = location?.latitude ?? null;
      const userLon = location?.longitude ?? null;
      const nextMechanics = readMechanics(response).map((item, index) =>
        normalizeMechanic(item, index, issueType, userLat, userLon)
      );
      setMechanics(nextMechanics);

      if (nextMechanics.length > 0) {
        const ratingResults = await Promise.allSettled(
          nextMechanics.map((m) => getMechanicReviews(m.id))
        );
        setMechanics(
          nextMechanics.map((m, i) => {
            const result = ratingResults[i];
            if (result.status !== 'fulfilled') return m;
            const summary = result.value?.summary || result.value?.data?.summary || {};
            const avgRating = parseMaybeNumber(summary?.avg_rating || 0);
            return avgRating > 0 ? { ...m, rating: avgRating } : m;
          })
        );
      }
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load mechanics.');
      setMechanics([]);
      setMatchedIssueType('');
    } finally {
      setLoading(false);
    }
  }, [issueSummary?.issueType, jobId, location]);

  useFocusEffect(
    useCallback(() => {
      promptPermissionIfNeeded?.('car_owner_find_mechanics_focus');
      fetchMechanics();
    }, [fetchMechanics, promptPermissionIfNeeded])
  );

  const handleHire = async (mechanic) => {
    if (!jobId || loadingMechanicId) {
      return;
    }

    setLoadingMechanicId(mechanic.id);

    try {
      const response = await hireMechanicForJob(jobId, mechanic.id);
      const requestId = String(response?.request_id || response?.data?.request_id || '').trim();

      clearActiveConversation();
      navigation.replace(ROUTES.CAR_OWNER_WAITING_MECHANIC, {
        mechanic,
        mechanicId: mechanic.id,
        jobId,
        issueSummary,
        requestId,
        job: route?.params?.job,
        location: route?.params?.location,
      });
    } catch (hireError) {
      setError(hireError?.message || 'Could not send hire request.');
    } finally {
      setLoadingMechanicId(null);
    }
  };

  const renderItem = ({ item }) => (
    <MechanicCard
      item={item}
      loading={loadingMechanicId === item.id}
      onHire={() => handleHire(item)}
    />
  );

  return (
    <ScreenContainer style={styles.screen} padded={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <BackIcon color={darkTheme.colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <AppText style={styles.title}>Find Mechanics</AppText>
          <AppText variant="muted" style={styles.subtitle}>
            {locationText}
          </AppText>
          {matchedIssueType ? (
            <AppText variant="muted" style={styles.issueText}>
              {matchedIssueType.replace(/_/g, ' ')}
            </AppText>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : null}

      {!loading && error ? (
        <NoInternetState message={error} onRetry={fetchMechanics} />
      ) : null}

      {!loading && !error ? (
        <FlatList
          data={mechanics}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={fetchMechanics}
              tintColor="transparent"
              colors={['transparent']}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <AppText style={styles.emptyText}>No mechanics available for this job yet.</AppText>
            </View>
          }
        />
      ) : null}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: darkTheme.spacing.sm,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.md,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.xs,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 34,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.bold,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    color: darkTheme.colors.accent,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '300',
    textAlign: 'center',
  },
  issueText: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  listContent: {
    paddingHorizontal: darkTheme.spacing.sm,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.xxl,
    rowGap: darkTheme.spacing.md,
  },
  card: {
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: darkTheme.spacing.md,
    alignItems: 'stretch',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: darkTheme.spacing.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  identityColumn: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 6,
    rowGap: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  metaText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  metaDot: {
    color: darkTheme.colors.muted,
    opacity: 0.8,
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 1,
  },
  priceLabel: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  priceValue: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  cardBottomRow: {
    marginTop: darkTheme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: darkTheme.spacing.sm,
  },
  priceColumn: {
    flex: 1,
    paddingRight: darkTheme.spacing.sm,
  },
  hireButton: {
    minWidth: 76,
    minHeight: 40,
    borderRadius: darkTheme.radius.md,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.md,
  },
  hireButtonBusy: {
    opacity: 0.9,
  },
  hireButtonText: {
    color: darkTheme.colors.background,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  unavailableWrap: {
    minWidth: 76,
    minHeight: 40,
    borderRadius: darkTheme.radius.md,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.sm,
  },
  unavailableText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: darkTheme.colors.muted,
    textAlign: 'center',
  },
});

export default FindMechanicsScreen;
