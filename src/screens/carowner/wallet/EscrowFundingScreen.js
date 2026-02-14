import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const BackIcon = ({ color }) => {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6L9 12L15 18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const MOCK_JOB = {
  issue: 'Engine misfire',
  vehicle: 'Toyota Camry',
  mechanic: 'Shittu Hassan',
  walletBalance: 10000,
};

const MOCK_BREAKDOWN = {
  diagnosticFee: 2000,
  labour: 4560,
  spareParts: 6200,
  serviceFee: 1770,
};

const formatNaira = (value) => {
  const amount = Number(value || 0);
  return `#${amount.toLocaleString()}`;
};

const EscrowFundingScreen = ({ navigation, route }) => {
  const [isPaying, setIsPaying] = useState(false);

  const job = route?.params?.job || MOCK_JOB;
  const breakdown = route?.params?.breakdown || MOCK_BREAKDOWN;

  const summary = useMemo(
    () => ({
      issue: job?.issue || 'Engine misfire',
      vehicle: job?.vehicle || 'Toyota Camry',
      mechanic: job?.mechanic || 'Shittu Hassan',
    }),
    [job]
  );

  const fees = useMemo(() => {
    const diagnosticFee = Number(breakdown?.diagnosticFee || 0);
    const labour = Number(breakdown?.labour || 0);
    const spareParts = Number(breakdown?.spareParts || breakdown?.parts || 0);
    const serviceFee = Number(breakdown?.serviceFee || 0);
    const totalFee = diagnosticFee + labour + spareParts + serviceFee;

    return {
      diagnosticFee,
      labour,
      spareParts,
      serviceFee,
      totalFee,
    };
  }, [breakdown]);

  const fundEscrow = async () => {
    const walletBalance = Number(job?.walletBalance || 0);

    if (walletBalance < fees.totalFee) {
      navigation.navigate(ROUTES.CAR_OWNER_FUND_WALLET);
      return;
    }

    navigation.navigate('PaymentSuccessScreen', { payeeName: 'Saheed Niyi' });
  };

  const handleConfirmAndPay = async () => {
    setIsPaying(true);

    try {
      await fundEscrow();
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen} edges={['left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <BackIcon color={darkTheme.colors.text} />
        </TouchableOpacity>
        <AppText variant="subtitle" style={styles.headerTitle}>
          Payment
        </AppText>
        <View style={styles.backButton} />
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Job summary
        </AppText>

        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Issue
          </AppText>
          <AppText style={styles.value}>{summary.issue}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Vehicle
          </AppText>
          <AppText style={styles.value}>{summary.vehicle}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Mechanic
          </AppText>
          <AppText style={styles.value}>{summary.mechanic}</AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle" style={styles.sectionTitle}>
          Cost breakdown
        </AppText>

        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Diagnostic fee
          </AppText>
          <AppText style={styles.value}>{formatNaira(fees.diagnosticFee)}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Labour
          </AppText>
          <AppText style={styles.value}>{formatNaira(fees.labour)}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Spare parts
          </AppText>
          <AppText style={styles.value}>{formatNaira(fees.spareParts)}</AppText>
        </View>
        <View style={styles.row}>
          <AppText variant="muted" style={styles.label}>
            Service fee
          </AppText>
          <AppText style={styles.value}>{formatNaira(fees.serviceFee)}</AppText>
        </View>
        <View style={styles.row}>
          <AppText style={styles.totalLabel}>Total fee</AppText>
          <AppText style={styles.totalValue}>{formatNaira(fees.totalFee)}</AppText>
        </View>
      </View>

      <View style={styles.ctaWrap}>
        <AppButton
          label={isPaying ? 'Processing...' : 'Confirm and pay'}
          onPress={handleConfirmAndPay}
          disabled={isPaying}
          left={isPaying ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
        />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkTheme.spacing.xl,
  },
  backButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.lg,
  },
  section: {
    marginBottom: darkTheme.spacing.lg,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkTheme.spacing.xs,
  },
  label: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: darkTheme.typography.fontSizes.md,
  },
  value: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  totalLabel: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginTop: darkTheme.spacing.xs,
  },
  totalValue: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.lg,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginTop: darkTheme.spacing.xs,
  },
  ctaWrap: {
    marginTop: 'auto',
    marginBottom: darkTheme.spacing.xxl,
  },
});

export default EscrowFundingScreen;
