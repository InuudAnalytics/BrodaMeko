import React, { useMemo } from 'react';
import {
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
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
        fill={color}
      />
    </Svg>
  );
};

const HireButton = ({ onPress }) => {
  return (
    <Pressable onPress={onPress} style={styles.hireButton}>
      <AppText style={styles.hireButtonText}>Hire</AppText>
    </Pressable>
  );
};

const ExpertCard = ({ item, onHire }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{item.initials}</AppText>
        </View>

        <View style={styles.details}>
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
          <AppText style={styles.priceValue}>{item.priceRange}</AppText>
        </View>
      </View>

      <HireButton onPress={onHire} />
    </View>
  );
};

const DiagnosticExpertsListScreen = ({ navigation }) => {
  const experts = useMemo(
    () => [
      {
        id: '7b6a4a5e-21a4-4df1-9a3c-64a764a8c8a1',
        name: 'Ali & sons diagnostic center',
        initials: 'AS',
        rating: 4.9,
        distanceKm: 1.3,
        etaMins: 10,
        priceRange: '₦3000 - 10,000',
      },
      {
        id: '1e4f2d9a-15af-4db0-9d8f-5b1a1f7de6b2',
        name: 'Baki diagnosis shop',
        initials: 'BD',
        rating: 4.9,
        distanceKm: 1.3,
        etaMins: 10,
        priceRange: '₦3000 - 10,000',
      },
      {
        id: 'a9f6f4c0-2fb0-4c20-8c35-7b4f0a1f3c12',
        name: 'Car doctor',
        initials: 'CD',
        rating: 4.9,
        distanceKm: 1.3,
        etaMins: 10,
        priceRange: '₦3000 - 10,000',
      },
      {
        id: '6c0fd8d3-77c8-4f8d-8b6f-4b5a2da88a05',
        name: 'Lordco Auto shop',
        initials: 'LA',
        rating: 4.9,
        distanceKm: 1.3,
        etaMins: 10,
        priceRange: '₦3000 - 10,000',
      },
    ],
    [],
  );

  const handleHire = (expert) => {
    const jobId = `job_${Date.now()}`;

    navigation.navigate(ROUTES.CAR_OWNER_CHAT, {
      mechanicId: expert.id,
      mechanicName: expert.name,
      jobId,
      mechanic: {
        id: expert.id,
        name: expert.name,
        initials: expert.initials,
        distanceKm: expert.distanceKm,
      },
    });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <BackIcon color={darkTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <AppText style={styles.headerTitle}>Book a diagnostic expert</AppText>
        </View>
        <View style={styles.backButtonSpacer} />
      </View>

      <FlatList
        data={experts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpertCard item={item} onHire={() => handleHire(item)} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 36,
    height: 36,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  listContent: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
    rowGap: darkTheme.spacing.md,
  },
  card: {
    borderRadius: darkTheme.radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: darkTheme.spacing.md,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    columnGap: darkTheme.spacing.sm,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  details: {
    flex: 1,
  },
  name: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  metaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
  },
  metaText: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  priceLabel: {
    marginTop: 4,
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
  },
  priceValue: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  hireButton: {
    minWidth: 70,
    minHeight: 36,
    borderRadius: 16,
    backgroundColor: '#E2FF31',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  hireButtonText: {
    color: '#1A1A1A',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default DiagnosticExpertsListScreen;
