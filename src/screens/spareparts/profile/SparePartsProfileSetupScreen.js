import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  DocumentValidationIcon,
  Location01Icon,
  Notification01Icon,
  Shield01Icon,
  Tick04Icon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { BASE_URL } from '../../../config/endpoints';
import { useAuth, useSparePartsProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const CHECKLIST_ITEMS = [
  {
    key: 'cac',
    label: 'Upload CAC document',
    icon: DocumentValidationIcon,
  },
  {
    key: 'nin',
    label: 'Upload NIN',
    icon: Shield01Icon,
  },
  {
    key: 'address',
    label: 'Add address',
    icon: Location01Icon,
  },
  {
    key: 'bank',
    label: 'Add bank details',
    icon: Wallet01Icon,
  },
];

const STEP_ROUTE_BY_KEY = {
  cac: ROUTES.SPARE_PARTS_UPLOAD_CAC,
  nin: ROUTES.SPARE_PARTS_UPLOAD_NIN,
  address: ROUTES.SPARE_PARTS_ADDRESS,
  bank: ROUTES.SPARE_PARTS_BANK_DETAILS,
};

const getFirstName = (user) => {
  const raw = user?.full_name || user?.fullName || user?.name || 'Partner';
  const first = String(raw || 'Partner')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];

  return first || 'Partner';
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

const SparePartsProfileSetupScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { completedSteps, completionPercent, isComplete } = useSparePartsProfile();

  const firstName = getFirstName(user);
  const title = isComplete ? 'Profile completed' : 'Complete your profile to start selling';
  const cta = isComplete ? 'Proceed' : 'Complete profile';
  const avatarUri = normalizeAvatarUri(user?.avatar || user?.avatar_url || user?.profile_photo || user?.image || '');

  const handlePrimaryAction = () => {
    if (isComplete) {
      navigation.replace(ROUTES.SPARE_PARTS_DASHBOARD);
      return;
    }

    const firstPending = CHECKLIST_ITEMS.find((item) => !completedSteps[item.key]);
    const nextRoute = firstPending ? STEP_ROUTE_BY_KEY[firstPending.key] : ROUTES.SPARE_PARTS_UPLOAD_CAC;
    navigation.navigate(nextRoute, { onboarding: true });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View style={styles.userWrap}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <AppText style={styles.avatarFallback}>{String(firstName || 'S').charAt(0).toUpperCase()}</AppText>
              )}
            </View>
            <View>
              <AppText style={styles.greeting}>Welcome {firstName}</AppText>
              <AppText style={styles.subGreeting}>Spare parts seller</AppText>
            </View>
          </View>

          <View style={styles.bellWrap}>
            <HugeiconsIcon icon={Notification01Icon} size={18} color="#1A1A1A" strokeWidth={2.1} />
          </View>
        </View>

        <View style={styles.progressBar}>
          <View style={styles.progressHead}>
            <AppText style={styles.progressLabel}>Profile completion</AppText>
            <AppText style={styles.progressPercent}>{completionPercent}%</AppText>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
          </View>
        </View>

        <View style={styles.heroIconWrap}>
          <HugeiconsIcon icon={DocumentValidationIcon} size={46} color="rgba(255,255,255,0.72)" strokeWidth={1.9} />
        </View>

        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>
          Upload your required documents and add bank details before your store goes live.
        </AppText>

        <AppButton label={cta} onPress={handlePrimaryAction} style={styles.primaryBtn} textStyle={styles.primaryBtnText} />

        <AppText style={styles.checklistTitle}>Setup checklist</AppText>
        <View style={styles.list}>
          {CHECKLIST_ITEMS.map((item) => {
            const done = Boolean(completedSteps[item.key]);
            return (
              <View key={item.key} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.leftIconCircle}>
                    <HugeiconsIcon icon={item.icon} size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                  </View>
                  <AppText style={styles.rowLabel}>{item.label}</AppText>
                </View>

                <View style={[styles.checkWrap, done && styles.checkWrapDone]}>
                  <HugeiconsIcon
                    icon={Tick04Icon}
                    size={14}
                    color={done ? darkTheme.colors.accent : 'rgba(255,255,255,0.35)'}
                    strokeWidth={2.5}
                  />
                </View>
              </View>
            );
          })}
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.4,
    borderColor: '#FF8A3D',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  greeting: {
    color: darkTheme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  subGreeting: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  bellWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    paddingHorizontal: 12,
  },
  progressHead: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
  progressPercent: {
    color: darkTheme.colors.accent,
    fontSize: 19,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  progressTrack: {
    marginTop: 8,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  heroIconWrap: {
    marginTop: 22,
    alignSelf: 'center',
    width: 100,
    height: 100,
    borderRadius: 55,
    backgroundColor: '#2E3C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    paddingHorizontal: 12,
    color: darkTheme.colors.text,
    fontSize: 30,
    lineHeight: 42,
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    marginTop: 10,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 18,
  },
  primaryBtnText: {
    color: '#1A1A1A',
  },
  checklistTitle: {
    marginTop: 22,
    color: darkTheme.colors.muted,
    fontSize: 17,
    lineHeight: 26,
  },
  list: {
    marginTop: 12,
    rowGap: 10,
  },
  row: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    flex: 1,
    paddingRight: 8,
  },
  leftIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 20,
  },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapDone: {
    borderColor: darkTheme.colors.accent,
  },
});

export default SparePartsProfileSetupScreen;
