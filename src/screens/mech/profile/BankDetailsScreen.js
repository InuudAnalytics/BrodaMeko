import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { getNextOnboardingRoute, getOnboardingStepIndex, ROUTES } from '../../../utils';

const BankDetailsScreen = ({ navigation, route }) => {
  const { mechanicProfile, setBankDetails, completedSteps } = useMechanicProfile();
  const existing = mechanicProfile.bankDetails || {};

  const [accountName, setAccountName] = useState(existing.accountName || '');
  const [accountNumber, setAccountNumber] = useState(existing.accountNumber || '');
  const [bankName, setBankName] = useState(existing.bankName || '');
  const isOnboarding = Boolean(route?.params?.onboarding);
  const skippedSteps = route?.params?.skippedSteps || [];
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_BANK_DETAILS);
  const progressPercent = useMemo(() => (stepIndex / 4) * 100, [stepIndex]);

  const isValid = useMemo(
    () => {
      const normalizedNumber = String(accountNumber || '').replace(/\D/g, '');
      const hasAllFields =
        String(accountName).trim().length > 0 &&
        String(bankName).trim().length > 0 &&
        normalizedNumber.length >= 10;

      return hasAllFields;
    },
    [accountName, accountNumber, bankName]
  );

  const handleSave = () => {
    if (!isValid) {
      Alert.alert('Invalid details', 'Enter account name, bank name and a valid account number (10+ digits).');
      return;
    }

    setBankDetails({
      accountName: String(accountName).trim(),
      accountNumber: String(accountNumber).replace(/\D/g, ''),
      bankName: String(bankName).trim(),
    });

    if (isOnboarding) {
      const { nextRoute, nextSkipped } = getNextOnboardingRoute({
        currentRoute: ROUTES.MECH_BANK_DETAILS,
        completedSteps: { ...completedSteps, bank: true },
        skippedSteps,
      });
      if (nextRoute === ROUTES.MECH_PROFILE_SETUP) {
        navigation.navigate(nextRoute);
        return;
      }
      navigation.replace(nextRoute, { onboarding: true, skippedSteps: nextSkipped });
      return;
    }

    navigation.goBack();
  };

  const handleSkipNext = () => {
    const nextSkipped = Array.from(new Set([...skippedSteps, ROUTES.MECH_BANK_DETAILS]));
    const { nextRoute, nextSkipped: resolvedSkipped } = getNextOnboardingRoute({
      currentRoute: ROUTES.MECH_BANK_DETAILS,
      completedSteps,
      skippedSteps: nextSkipped,
    });
    if (nextRoute === ROUTES.MECH_PROFILE_SETUP) {
      navigation.navigate(nextRoute);
      return;
    }
    navigation.replace(nextRoute, { onboarding: true, skippedSteps: resolvedSkipped });
  };

  const handleSkipAll = () => {
    navigation.navigate(ROUTES.MECH_PROFILE_SETUP);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Verification screen</AppText>
        </View>

        <AppText style={styles.helper}>Please upload a correct bank details</AppText>
        <AppText style={styles.stepLabel}>Step {stepIndex} of 4</AppText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <AppInput
          label="Account name"
          value={accountName}
          onChangeText={setAccountName}
          placeholder="John Doe"
          autoCapitalize="words"
        />

        <AppInput
          label="Account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          placeholder="0123456789"
          keyboardType="number-pad"
        />

        <AppInput
          label="Bank name"
          value={bankName}
          onChangeText={setBankName}
          placeholder="GTBank"
          autoCapitalize="words"
        />

        <AppButton label="Save & continue" onPress={handleSave} style={styles.saveBtn} />

        {isOnboarding ? (
          <View style={styles.skipRow}>
            <TouchableOpacity activeOpacity={0.85} onPress={handleSkipNext}>
              <AppText style={styles.skipText}>Skip next</AppText>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.85} onPress={handleSkipAll}>
              <AppText style={styles.skipText}>Skip all</AppText>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  helper: {
    marginTop: 14,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 6,
  },
  stepLabel: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    marginBottom: 6,
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  saveBtn: {
    marginTop: 'auto',
  },
  skipRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  skipText: {
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
});

export default BankDetailsScreen;
