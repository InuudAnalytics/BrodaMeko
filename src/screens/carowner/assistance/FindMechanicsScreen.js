import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useChat } from '../../../context';
import { getMechanicsForJob } from '../../../services/jobs.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

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

const parseMaybeNumber = (value) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  const fromString = parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(fromString) ? fromString : 0;
};

const normalizeMechanic = (item, index) => {
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

  const minPrice = Number(item?.min_price || item?.minPrice || item?.min || 0);
  const maxPrice = Number(item?.max_price || item?.maxPrice || item?.max || 0);
  const priceRange = minPrice || maxPrice
    ? `N${minPrice.toLocaleString('en-NG')} - N${maxPrice.toLocaleString('en-NG')}`
    : 'Price on request';
  const avatarUri = normalizeAvatarUri(
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

  return {
    id: String(item?.id || item?._id || item?.mechanic_id || `mech-${index}`),
    name: fullName,
    initials,
    avatarUri,
    details,
    rating: parseMaybeNumber(item?.rating || item?.average_rating || user?.rating || user?.average_rating || 0),
    distanceKm: parseMaybeNumber(item?.distance_km || item?.distance || 0),
    etaMins: parseMaybeNumber(item?.eta_minutes || item?.eta || 0),
    priceRange,
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

const formatIssueSummaryForMessage = (summary) => {
  const parts = [
    summary?.issueType ? `Issue: ${summary.issueType}` : '',
    summary?.description ? `Description: ${summary.description}` : '',
    summary?.carMake ? `Car make: ${summary.carMake}` : '',
    Array.isArray(summary?.images) && summary.images.length ? `Images: ${summary.images.length}` : '',
  ].filter(Boolean);

  return parts.length ? parts.join(' | ') : 'New service request created.';
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
      <View style={styles.cardMain}>
        <View style={styles.avatar}>
          {item.avatarUri ? (
            <Image source={{ uri: item.avatarUri }} style={styles.avatarImage} />
          ) : (
            <AppText style={styles.avatarText}>{item.initials}</AppText>
          )}
        </View>

        <View style={styles.cardDetails}>
          <AppText style={styles.name}>{item.name}</AppText>
          {item.details ? <AppText style={styles.detailsText}>{item.details}</AppText> : null}

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <StarIcon color={darkTheme.colors.accent} />
              <AppText style={styles.metaText}>{item.rating ? item.rating.toFixed(1) : 'N/A'}</AppText>
            </View>
            <AppText style={styles.metaText}>
              {item.distanceKm ? `${item.distanceKm}km away` : 'Distance unavailable'}
            </AppText>
            <AppText style={styles.metaText}>
              {item.etaMins ? `${item.etaMins} minutes` : 'ETA unavailable'}
            </AppText>
          </View>

          <AppText style={styles.priceLabel}>Estimated price</AppText>
          <View style={styles.priceRow}>
            <AppText style={styles.priceValue}>{item.priceRange}</AppText>

            {item.available ? (
              <HireButton onPress={onHire} loading={loading} />
            ) : (
              <View style={styles.unavailableWrap}>
                <AppText style={styles.unavailableText}>Unavailable</AppText>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const FindMechanicsScreen = ({ navigation, route }) => {
  const { startConversation, addLocalMessage } = useChat();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMechanicId, setLoadingMechanicId] = useState(null);
  const [mechanics, setMechanics] = useState([]);

  const jobId = String(route?.params?.jobId || '').trim();
  const issueSummary = normalizeIssueSummary(route?.params?.job);
  const locationText = route?.params?.location || 'Ahmadu Bello way, Kwara state';

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
      const nextMechanics = readMechanics(response).map(normalizeMechanic);
      setMechanics(nextMechanics);
    } catch (fetchError) {
      setError(fetchError?.message || 'Could not load mechanics.');
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useFocusEffect(
    useCallback(() => {
      fetchMechanics();
    }, [fetchMechanics])
  );

  const handleHire = async (mechanic) => {
    if (!jobId || loadingMechanicId) {
      return;
    }

    setLoadingMechanicId(mechanic.id);

    try {
      const response = await startConversation({ mechanic_id: mechanic.id, job_id: jobId });
      const conversation = response?.data?.conversation || response?.data || null;
      const conversationId = String(
        conversation?.id || conversation?._id || conversation?.conversation_id || conversation?.conversationId || ''
      ).trim();

      if (conversationId) {
        addLocalMessage(conversationId, {
          type: 'system',
          text: formatIssueSummaryForMessage(issueSummary),
          sender: 'user',
        });
      }

      navigation.navigate(ROUTES.CAR_OWNER_LIVE_TRACKING, {
        mechanic,
        jobId,
        mechanicId: mechanic.id,
        conversationId,
        conversation,
        trackingStatus: 'waiting_acceptance',
        issueSummary,
      });
    } catch (hireError) {
      setError(hireError?.message || 'Could not start chat with mechanic.');
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
        </View>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.centerState}>
          <AppText style={styles.errorText}>{error}</AppText>
          <TouchableOpacity activeOpacity={0.85} onPress={fetchMechanics} style={styles.retryBtn}>
            <AppText style={styles.retryText}>Retry</AppText>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error ? (
        <FlatList
          data={mechanics}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
  cardMain: {
    flexDirection: 'row',
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
  cardDetails: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
  },
  detailsText: {
    marginTop: 1,
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
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
  priceLabel: {
    marginTop: darkTheme.spacing.xs,
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
  },
  priceValue: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  priceRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: darkTheme.spacing.sm,
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
  errorText: {
    color: '#FF7F7F',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryBtn: {
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: darkTheme.colors.accent,
  },
});

export default FindMechanicsScreen;
