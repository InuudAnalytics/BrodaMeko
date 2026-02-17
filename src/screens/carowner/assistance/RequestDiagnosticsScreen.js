import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const CHECKLIST_ITEMS = [
  'Engine and transmission scan',
  'Brake and suspension check',
  'Electrical system test',
  'Written diagnostic report',
];

const CheckIcon = ({ color }) => {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 7L10 17L5 12"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const ChecklistItem = ({ label }) => {
  return (
    <View style={styles.checklistRow}>
      <View style={styles.checkIconWrap}>
        <CheckIcon color={darkTheme.colors.background} />
      </View>
      <AppText style={styles.checklistText}>{label}</AppText>
    </View>
  );
};

const PricingCard = ({ feeLabel, description }) => {
  return (
    <View style={styles.pricingCard}>
      <AppText style={styles.pricingLabel}>Estimated diagnostic fee</AppText>
      <AppText style={styles.pricingValue}>{feeLabel}</AppText>
      <AppText variant="muted" style={styles.pricingDescription}>
        {description}
      </AppText>
    </View>
  );
};

const RequestDiagnosticsScreen = ({ navigation }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pricingData = useMemo(
    () => ({
      feeLabel: '5000 / visit',
      description: 'Covers onsite inspection, scanner checks, and a written diagnostic summary.',
    }),
    [],
  );

  const handleRequestDiagnostics = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      navigation.navigate(ROUTES.CAR_OWNER_DIAGNOSTIC_EXPERTS, {
        source: 'diagnostics',
      });
    }, 450);
  };

  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppText variant="body" style={styles.introText}>
          Not sure what is wrong yet? Request a certified diagnostic expert for an onsite visit before choosing a
          repair.
        </AppText>

        <PricingCard feeLabel={pricingData.feeLabel} description={pricingData.description} />

        <AppText variant="subtitle" style={styles.sectionTitle}>
          What&apos;s included
        </AppText>

        <View style={styles.checklistWrap}>
          {CHECKLIST_ITEMS.map((item) => (
            <ChecklistItem key={item} label={item} />
          ))}
        </View>

        <AppButton
          label={isSubmitting ? 'Requesting...' : 'Request diagnostics'}
          onPress={handleRequestDiagnostics}
          disabled={isSubmitting}
          style={styles.cta}
        />

        <TouchableOpacity activeOpacity={0.9} disabled>
          <AppText variant="muted" style={styles.disclaimer}>
            You wont be charged until the expert arrives.
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.xxl,
  },
  introText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 22,
    marginBottom: darkTheme.spacing.lg,
  },
  pricingCard: {
    borderWidth: 1.4,
    borderColor: darkTheme.colors.accent,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(226,255,49,0.08)',
    padding: darkTheme.spacing.lg,
    marginBottom: darkTheme.spacing.xl,
  },
  pricingLabel: {
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.sm,
    marginBottom: darkTheme.spacing.xs,
  },
  pricingValue: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.xl,
    lineHeight: 34,
    fontWeight: darkTheme.typography.fontWeights.bold,
    marginBottom: darkTheme.spacing.xs,
  },
  pricingDescription: {
    color: darkTheme.colors.text,
    lineHeight: 20,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.md,
  },
  checklistWrap: {
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    paddingHorizontal: darkTheme.spacing.md,
    paddingVertical: darkTheme.spacing.sm,
    marginBottom: darkTheme.spacing.xl,
    rowGap: darkTheme.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
  },
  checkIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 20,
  },
  cta: {
    marginBottom: darkTheme.spacing.md,
  },
  disclaimer: {
    textAlign: 'center',
    color: darkTheme.colors.muted,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 18,
  },
});

export default RequestDiagnosticsScreen;
