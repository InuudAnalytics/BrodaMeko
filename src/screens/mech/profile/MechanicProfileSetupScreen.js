import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Camera01Icon,
  DollarCircleIcon,
  Notification01Icon,
  Shield01Icon,
  Tick04Icon,
  Wallet01Icon,
  Wrench01Icon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth, useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const CHECKLIST_ITEMS = [
  {
    key: 'photo',
    label: 'Upload profile photo',
    icon: Camera01Icon,
    route: ROUTES.MECH_UPLOAD_PROFILE_PHOTO,
  },
  {
    key: 'pricing',
    label: 'Add service pricing',
    icon: DollarCircleIcon,
    route: ROUTES.MECH_SERVICE_PRICING,
  },
  {
    key: 'kyc',
    label: 'Upload ID verification',
    icon: Shield01Icon,
    route: ROUTES.MECH_KYC_UPLOAD,
  },
  {
    key: 'bank',
    label: 'Add bank details',
    icon: Wallet01Icon,
    route: ROUTES.MECH_BANK_DETAILS,
  },
];

const getFirstName = (user) => {
  const raw = user?.full_name || user?.fullName || user?.name || 'Michael';
  const first = String(raw || 'Michael')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];

  return first || 'Michael';
};

const MechanicProfileSetupScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { completedSteps, completionPercent, isComplete } = useMechanicProfile();

  const firstName = getFirstName(user);
  const title = isComplete ? 'Profile completed' : 'Complete your profile to receive jobs';
  const cta = isComplete ? 'Proceed' : 'Complete profile';

  const firstIncompleteRoute = useMemo(() => {
    const item = CHECKLIST_ITEMS.find((step) => !completedSteps[step.key]);
    return item?.route || ROUTES.MECH_PROFILE_SETUP;
  }, [completedSteps]);

  const handlePrimaryAction = () => {
    if (isComplete) {
      navigation.replace(ROUTES.MECH_DASHBOARD_TABS);
      return;
    }

    navigation.navigate(firstIncompleteRoute);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View>
            <AppText style={styles.greeting}>Welcome {firstName}</AppText>
            <AppText style={styles.subGreeting}>BrodaMeko partner</AppText>
          </View>

          <View style={styles.bellWrap}>
            <HugeiconsIcon icon={Notification01Icon} size={18} color="#1A1A1A" strokeWidth={2.1} />
          </View>
        </View>

        <View style={styles.progressHead}>
          <AppText style={styles.progressLabel}>Profile completion</AppText>
          <AppText style={styles.progressPercent}>{completionPercent}%</AppText>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
        </View>

        <View style={styles.heroIconWrap}>
          <HugeiconsIcon icon={Wrench01Icon} size={40} color="rgba(255,255,255,0.72)" strokeWidth={1.9} />
        </View>

        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>
          You need to complete your profile and upload required documents before you can start receiving service
          requests.
        </AppText>

        <AppButton label={cta} onPress={handlePrimaryAction} style={styles.primaryBtn} textStyle={styles.primaryBtnText} />

        <AppText style={styles.checklistTitle}>Setup checklist</AppText>
        <View style={styles.list}>
          {CHECKLIST_ITEMS.map((item) => {
            const done = Boolean(completedSteps[item.key]);
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                style={styles.row}
                onPress={() => navigation.navigate(item.route)}
              >
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
              </TouchableOpacity>
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
    backgroundColor: '#000033',
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
    height: 12,
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
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#2E3C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 16,
    color: darkTheme.colors.text,
    fontSize: 38,
    lineHeight: 44,
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    marginTop: 10,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 20,
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

export default MechanicProfileSetupScreen;
