import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../../components';
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
          <AppText style={styles.avatarText}>{item.initials}</AppText>
        </View>

        <View style={styles.cardDetails}>
          <AppText style={styles.name}>{item.name}</AppText>

          <View style={styles.metaRow}>
            <View style={styles.ratingRow}>
              <StarIcon color={darkTheme.colors.accent} />
              <AppText style={styles.metaText}>{item.rating.toFixed(1)}</AppText>
            </View>
            <AppText style={styles.metaText}>{item.distanceKm}km away</AppText>
            <AppText style={styles.metaText}>{item.etaMins} minutes</AppText>
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
  const [loadingMechanicId, setLoadingMechanicId] = useState(null);

  const mechanics = useMemo(
    () => [
      {
        id: 'm_01',
        name: 'Danjuma Auto Clinic',
        initials: 'DA',
        rating: 4.8,
        distanceKm: 1.3,
        etaMins: 10,
        priceRange: 'N5,000 - N8,000',
        available: true,
      },
      {
        id: 'm_02',
        name: 'Kwara Garage Pro',
        initials: 'KG',
        rating: 4.6,
        distanceKm: 2.1,
        etaMins: 14,
        priceRange: 'N4,500 - N7,500',
        available: true,
      },
      {
        id: 'm_03',
        name: 'Torque Masters',
        initials: 'TM',
        rating: 4.7,
        distanceKm: 3.4,
        etaMins: 20,
        priceRange: 'N6,000 - N9,000',
        available: false,
      },
    ],
    [],
  );

  const locationText = route?.params?.location || 'Ahmadu Bello way, Kwara state';

  const handleHire = (mechanic) => {
    if (loadingMechanicId) {
      return;
    }

    setLoadingMechanicId(mechanic.id);

    setTimeout(() => {
      const jobId = `job_${Date.now()}`;
      setLoadingMechanicId(null);
      navigation.navigate(ROUTES.CAR_OWNER_CHAT, { mechanic, jobId, mechanicId: mechanic.id });
    }, 1200);
  };

  const renderItem = ({ item }) => {
    return (
      <MechanicCard
        item={item}
        loading={loadingMechanicId === item.id}
        onHire={() => handleHire(item)}
      />
    );
  };

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

      <FlatList
        data={mechanics}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
});

export default FindMechanicsScreen;
