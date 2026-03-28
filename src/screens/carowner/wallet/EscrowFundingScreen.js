import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../../components';
import { useChat } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';

const BackIcon = ({ color }) => (
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

const formatNaira = value => {
  const amount = Number(value || 0);
  return `\u20A6${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
};

const RadioOption = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={styles.paymentOption}
    activeOpacity={0.85}
    onPress={onPress}
  >
    <View style={styles.radioOuter}>
      {active ? <View style={styles.radioInner} /> : null}
    </View>
    <AppText style={styles.paymentLabel}>{label}</AppText>
  </TouchableOpacity>
);

const EscrowFundingScreen = ({ navigation, route }) => {
  const { respondQuotation, initiatePaymentForJob } = useChat();
  const [paying, setPaying] = useState(false);

  const quotationId = String(route?.params?.quotationId || '').trim();
  const conversationId = String(route?.params?.conversationId || '').trim();
  const jobId = String(route?.params?.jobId || '').trim();
  const walletBalance = Number(route?.params?.walletBalance || 0);

  const issueSummary = route?.params?.issueSummary || {};
  const mechanic = route?.params?.mechanic || {};
  const mechanicId = String(route?.params?.mechanicId || '').trim();
  const mechanicName =
    mechanic?.name || mechanic?.full_name || 'Assigned mechanic';
  const vehicleLabel =
    route?.params?.vehicle || issueSummary?.carMake || 'Not specified';
  const issueLabel =
    issueSummary?.issueType || issueSummary?.issue || 'Issue not specified';

  const quoteAmount = Number(route?.params?.quoteAmount || 0);
  const diagnosticFee = Number(route?.params?.diagnosticFee || 0);
  const serviceFee = Math.round(quoteAmount * 0.08);
  const totalFee = diagnosticFee + quoteAmount + serviceFee;

  const walletTooLow = walletBalance < totalFee;
  const [paymentMethod, setPaymentMethod] = useState(walletTooLow ? 'card' : 'wallet');

  const summaryRows = useMemo(
    () => [
      { label: 'Issue', value: String(issueLabel || '').replace(/_/g, ' ') },
      { label: 'Vehicle', value: vehicleLabel },
      { label: 'Mechanic', value: mechanicName },
    ],
    [issueLabel, mechanicName, vehicleLabel],
  );

  const breakdownRows = useMemo(
    () => [
      { label: 'Diagnostic fee', value: formatNaira(diagnosticFee) },
      { label: 'Labour', value: formatNaira(quoteAmount) },
      { label: 'Service fee (8%)', value: formatNaira(serviceFee) },
    ],
    [diagnosticFee, quoteAmount, serviceFee],
  );

  const handleConfirmAndPay = async () => {
    if (!quotationId || !conversationId || !jobId) {
      AppAlert.alert('Unable to continue', 'Payment context is incomplete.');
      return;
    }

    const paymentParams = {
      quotationId,
      conversationId,
      jobId,
      issueSummary,
      mechanic,
      mechanicId,
    };

    setPaying(true);
    try {
      if (paymentMethod === 'wallet') {
        const acceptRes = await respondQuotation(conversationId, {
          quotation_id: quotationId,
          action: 'accept',
        });
        if (!acceptRes) {
          AppAlert.alert('Error', 'Could not accept quotation. Please try again.');
          return;
        }
        const payRes = await initiatePaymentForJob(jobId, 'wallet');
        if (!payRes) {
          AppAlert.alert('Error', 'Could not secure payment in escrow.');
          return;
        }
        const payPayload = payRes?.data || payRes || {};
        const payCode = String(payPayload?.code || '').trim().toUpperCase();
        if (payCode === 'INSUFFICIENT_BALANCE') {
          AppAlert.alert(
            'Insufficient balance',
            'Your wallet balance is too low. Please top up and try again.',
          );
          return;
        }
        navigation.navigate(ROUTES.CAR_OWNER_PAYMENT_SUCCESS, {
          payeeName: mechanicName,
          nextRoute: ROUTES.CAR_OWNER_DASHBOARD,
        });
        return;
      }

      if (paymentMethod === 'card') {
        navigation.navigate(ROUTES.CAR_OWNER_CARD_PAYMENT, paymentParams);
        return;
      }

      navigation.navigate(ROUTES.CAR_OWNER_JOB_PAYSTACK_CHECKOUT, {
        ...paymentParams,
        paymentMethodLabel: 'transfer',
      });
    } finally {
      setPaying(false);
    }
  };

  const isConfirmDisabled = paying || (paymentMethod === 'wallet' && walletTooLow);

  return (
    <ScreenContainer
      padded={false}
      edges={['left', 'right', 'bottom']}
      style={styles.screen}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <BackIcon color={darkTheme.colors.text} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Payment</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Job summary</AppText>
          {summaryRows.map(row => (
            <View key={row.label} style={styles.row}>
              <AppText style={styles.rowLabel}>{row.label}</AppText>
              <AppText style={styles.rowValue}>{row.value}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Cost breakdown</AppText>
          {breakdownRows.map(row => (
            <View key={row.label} style={styles.row}>
              <AppText style={styles.rowLabel}>{row.label}</AppText>
              <AppText style={styles.rowValue}>{row.value}</AppText>
            </View>
          ))}
          <View style={styles.totalRow}>
            <AppText style={styles.totalLabel}>Total fee</AppText>
            <AppText style={styles.totalValue}>{formatNaira(totalFee)}</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Payment method</AppText>

          <RadioOption
            label="Pay with wallet"
            active={paymentMethod === 'wallet'}
            onPress={() => setPaymentMethod('wallet')}
          />
          <AppText
            style={[
              styles.balanceText,
              walletTooLow ? styles.balanceTextLow : styles.balanceTextOk,
            ]}
          >
            Balance: {formatNaira(walletBalance)}
            {walletTooLow ? ' — insufficient' : ''}
          </AppText>

          <RadioOption
            label="Pay with your ATM card"
            active={paymentMethod === 'card'}
            onPress={() => setPaymentMethod('card')}
          />
          <RadioOption
            label="Pay with transfer"
            active={paymentMethod === 'transfer'}
            onPress={() => setPaymentMethod('transfer')}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          isConfirmDisabled ? styles.confirmButtonDisabled : null,
        ]}
        activeOpacity={0.88}
        onPress={handleConfirmAndPay}
        disabled={isConfirmDisabled}
      >
        {paying ? (
          <ActivityIndicator size="small" color={darkTheme.colors.background} />
        ) : null}
        <AppText style={styles.confirmButtonText}>
          {paying ? 'Processing...' : 'Confirm and pay'}
        </AppText>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: darkTheme.spacing.md,
    paddingTop: darkTheme.spacing.xs,
    paddingBottom: darkTheme.spacing.xl,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.xl,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xl,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: darkTheme.spacing.lg,
  },
  sectionTitle: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xl,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: darkTheme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rowLabel: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  rowValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.regular,
    textTransform: 'capitalize',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalLabel: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.lg,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  totalValue: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.lg,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: darkTheme.colors.accent,
  },
  paymentLabel: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
  },
  balanceText: {
    fontSize: 12,
    lineHeight: 16,
    marginLeft: 34,
    marginBottom: 14,
  },
  balanceTextOk: {
    color: 'rgba(255,255,255,0.45)',
  },
  balanceTextLow: {
    color: '#E05C5C',
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: darkTheme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
    marginTop: darkTheme.spacing.md,
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  confirmButtonText: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.lg,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default EscrowFundingScreen;
