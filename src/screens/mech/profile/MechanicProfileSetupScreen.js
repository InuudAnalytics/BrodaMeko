import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { darkTheme } from '../../../theme';

const CHECKLIST_ITEMS = [
  { key: 'profilePhoto', label: 'Upload profile photo', icon: Camera01Icon },
  { key: 'servicePricing', label: 'Add service pricing', icon: DollarCircleIcon },
  { key: 'idVerification', label: 'Upload ID verification', icon: Shield01Icon },
  { key: 'bankDetails', label: 'Add bank details', icon: Wallet01Icon },
];

const MechanicProfileSetupScreen = ({ navigation, onProceed }) => {
  const [checks, setChecks] = useState({
    profilePhoto: false,
    servicePricing: false,
    idVerification: false,
    bankDetails: false,
  });

  const completedCount = useMemo(() => Object.values(checks).filter(Boolean).length, [checks]);
  const percentage = completedCount * 25;
  const isComplete = completedCount === CHECKLIST_ITEMS.length;

  const handleToggleItem = (key) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePrimaryAction = () => {
    if (!isComplete) {
      Alert.alert('Complete profile', 'Finish all checklist items to continue.');
      return;
    }

    // TODO: Replace local completion gate with backend profile completion endpoint.
    if (typeof onProceed === 'function') {
      onProceed();
      return;
    }
    navigation.replace('MechanicDashboardTabs');
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topRow}>
          <View style={styles.profileMiniWrap}>
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>M</AppText>
            </View>
            <View>
              <AppText style={styles.welcomeText}>Welcome Michael</AppText>
              <AppText style={styles.partnerText}>BrodaMeko partner</AppText>
            </View>
          </View>

          <View style={styles.bellWrap}>
            <HugeiconsIcon icon={Notification01Icon} size={20} color="#1A1A1A" strokeWidth={2.1} />
          </View>
        </View>

        <View style={styles.progressHead}>
          <AppText style={styles.progressLabel}>Profile completion</AppText>
          <AppText style={styles.progressValue}>{percentage}%</AppText>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroIconCircle}>
            <HugeiconsIcon icon={Wrench01Icon} size={38} color="rgba(255,255,255,0.7)" strokeWidth={1.8} />
          </View>
          <AppText style={styles.heroTitle}>{isComplete ? 'Profile completed' : 'Complete your profile to receive jobs'}</AppText>
          <AppText style={styles.heroSubtext}>
            You need to complete your profile and upload required documents before you can start receiving service
            requests.
          </AppText>

          <AppButton
            label={isComplete ? 'Proceed' : 'Complete profile'}
            onPress={handlePrimaryAction}
            style={styles.cta}
            textStyle={styles.ctaText}
          />
        </View>

        <AppText style={styles.checklistTitle}>Setup checklist</AppText>
        <View style={styles.list}>
          {CHECKLIST_ITEMS.map((item) => {
            const done = checks[item.key];
            return (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.85}
                style={styles.row}
                onPress={() => handleToggleItem(item.key)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.rowIconWrap}>
                    <HugeiconsIcon icon={item.icon} size={18} color="rgba(255,255,255,0.75)" strokeWidth={2} />
                  </View>
                  <AppText style={styles.rowLabel}>{item.label}</AppText>
                </View>

                <View style={[styles.checkCircle, done ? styles.checkCircleDone : null]}>
                  <HugeiconsIcon
                    icon={Tick04Icon}
                    size={14}
                    color={done ? darkTheme.colors.accent : 'rgba(255,255,255,0.35)'}
                    strokeWidth={2.4}
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
    paddingTop: 18,
    paddingBottom: 22,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileMiniWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF8A50',
    backgroundColor: '#392425',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  welcomeText: {
    fontSize: 22,
    lineHeight: 26,
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  partnerText: {
    marginTop: 3,
    color: darkTheme.colors.muted,
    fontSize: 13,
    lineHeight: 16,
  },
  bellWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    fontSize: 14,
  },
  progressValue: {
    color: darkTheme.colors.accent,
    fontSize: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  progressTrack: {
    marginTop: 8,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  heroWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  heroIconCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#2E3C3A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    marginTop: 14,
    color: darkTheme.colors.text,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
    maxWidth: 318,
  },
  heroSubtext: {
    marginTop: 10,
    color: darkTheme.colors.muted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 330,
  },
  cta: {
    marginTop: 16,
    width: '100%',
  },
  ctaText: {
    color: '#1A1A1A',
  },
  checklistTitle: {
    marginTop: 14,
    color: darkTheme.colors.muted,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  list: {
    marginTop: 12,
    rowGap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    flex: 1,
    paddingRight: 10,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(226,255,49,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkCircleDone: {
    borderColor: darkTheme.colors.accent,
  },
});

export default MechanicProfileSetupScreen;
