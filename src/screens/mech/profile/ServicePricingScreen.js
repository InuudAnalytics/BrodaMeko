import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useMechanicProfile } from '../../../context';
import { darkTheme } from '../../../theme';
import { getNextOnboardingRoute, getOnboardingStepIndex, ROUTES } from '../../../utils';

const SERVICES = [
  { key: 'flat_tires', label: 'Flat tires' },
  { key: 'battery_problem', label: 'Battery problem' },
  { key: 'brake_failure', label: 'Brake failure' },
  { key: 'engine_overheating', label: 'Engine overheating' },
  { key: 'oil_leak', label: 'Oil leak' },
  { key: 'electrical_fault', label: 'Electrical fault' },
];

const ServicePricingScreen = ({ navigation, route }) => {
  const { mechanicProfile, setHasServicePricing, setServicePricing, completedSteps } = useMechanicProfile();
  const existingPricing = mechanicProfile.servicePricing || {};
  const [pricing, setPricing] = useState(existingPricing);
  const isOnboarding = Boolean(route?.params?.onboarding);
  const skippedSteps = route?.params?.skippedSteps || [];
  const stepIndex = getOnboardingStepIndex(ROUTES.MECH_SERVICE_PRICING);
  const progressPercent = useMemo(() => (stepIndex / 4) * 100, [stepIndex]);
  const added = Boolean(mechanicProfile.hasServicePricing || Object.keys(existingPricing).length);

  const handleAddPricing = () => {
    setHasServicePricing(true);
  };

  const handleSave = () => {
    setServicePricing(pricing);
    setHasServicePricing(true);

    if (isOnboarding) {
      const { nextRoute, nextSkipped } = getNextOnboardingRoute({
        currentRoute: ROUTES.MECH_SERVICE_PRICING,
        completedSteps: { ...completedSteps, pricing: true },
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
    const nextSkipped = Array.from(new Set([...skippedSteps, ROUTES.MECH_SERVICE_PRICING]));
    const { nextRoute, nextSkipped: resolvedSkipped } = getNextOnboardingRoute({
      currentRoute: ROUTES.MECH_SERVICE_PRICING,
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

  const updatePrice = (key, value) => {
    const digitsOnly = String(value || '').replace(/\D/g, '');
    setPricing((prev) => ({ ...prev, [key]: digitsOnly }));
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

        <AppText style={styles.note}>Set your service charges</AppText>
        <AppText style={styles.stepLabel}>Step {stepIndex} of 4</AppText>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {SERVICES.map((service) => (
            <View key={service.key} style={styles.serviceRow}>
              <AppText style={styles.serviceLabel}>{service.label}</AppText>
              <View style={styles.priceInputWrap}>
                <TextInput
                  value={pricing[service.key] || ''}
                  onChangeText={(value) => updatePrice(service.key, value)}
                  placeholder="N/A"
                  placeholderTextColor={darkTheme.colors.muted}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <AppButton label="Save & continue" onPress={handleSave} style={styles.saveBtn} />
        <TouchableOpacity style={styles.stateRow} activeOpacity={0.85} onPress={handleAddPricing}>
          <View style={styles.stateLeft}>
            <AppText style={styles.stateTitle}>{added ? 'Pricing added' : 'Pricing not added yet'}</AppText>
            <AppText style={styles.stateSub}>Tap Add pricing to mark this step as complete.</AppText>
          </View>
          <View style={[styles.checkWrap, added && styles.checkWrapDone]}>
            {added ? <HugeiconsIcon icon={Tick02Icon} size={14} color={darkTheme.colors.accent} strokeWidth={2.4} /> : null}
          </View>
        </TouchableOpacity>

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
  note: {
    marginTop: 16,
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  stepLabel: {
    marginTop: 8,
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  progressTrack: {
    marginTop: 6,
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: darkTheme.colors.accent,
  },
  list: {
    marginTop: 18,
    paddingBottom: 12,
    rowGap: 10,
  },
  serviceRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serviceLabel: {
    color: darkTheme.colors.text,
    fontSize: 14,
    marginBottom: 6,
  },
  priceInputWrap: {
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  priceInput: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  stateRow: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },
  stateLeft: {
    flex: 1,
  },
  stateTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  stateSub: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkWrapDone: {
    borderColor: darkTheme.colors.accent,
  },
  saveBtn: {
    marginTop: 12,
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

export default ServicePricingScreen;
