import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../../components';
import { useChat } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

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
  return `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
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
  const { respondQuotation, initiatePaymentForJob, addLocalMessage } =
    useChat();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paying, setPaying] = useState(false);

  const quotationId = String(route?.params?.quotationId || '').trim();
  const conversationId = String(route?.params?.conversationId || '').trim();
  const jobId = String(route?.params?.jobId || '').trim();

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
      { label: 'Service fee', value: formatNaira(serviceFee) },
    ],
    [diagnosticFee, quoteAmount, serviceFee],
  );

  const handleConfirmAndPay = async () => {
    if (!quotationId || !conversationId || !jobId) {
      Alert.alert('Unable to continue', 'Payment context is incomplete.');
      return;
    }

    setPaying(true);
    try {
      // Step 1: Accept the quotation — this assigns the mechanic.
      await respondQuotation(conversationId, {
        quotation_id: quotationId,
        action: 'accept',
      });

      // Step 2: Initiate payment. Backend accepts wallet/paystack/cash.
      // UI offers card/transfer — both go through paystack.
      await initiatePaymentForJob(jobId, 'paystack');

      // Step 3: Add a local system message in the chat thread so the car
      // owner sees confirmation when they return to chat.
      addLocalMessage(conversationId, {
        type: 'system',
        text: 'Price accepted. Mechanic has been assigned.',
      });

      // Step 4: Navigate to payment success screen, which then redirects
      // back to the chat with progressStatus:'accepted' so the live tracking
      // banner appears automatically.
      navigation.replace(ROUTES.CAR_OWNER_PAYMENT_SUCCESS, {
        payeeName: mechanicName,
        nextRoute: ROUTES.CAR_OWNER_CHAT,
        nextParams: {
          conversationId,
          jobId,
          mechanic,
          mechanicId,
          issueSummary,
          // This is the key addition — tells CarOwnerChatScreen to show the
          // live tracking banner as soon as the user lands back in chat.
          progressStatus: 'accepted',
        },
      });
    } catch (error) {
      Alert.alert(
        'Payment failed',
        error?.message || 'Could not complete payment.',
      );
    } finally {
      setPaying(false);
    }
  };

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
        <View style={styles.row}>
          <AppText style={styles.totalLabel}>Total fee</AppText>
          <AppText style={styles.totalValue}>{formatNaira(totalFee)}</AppText>
        </View>
      </View>

      <View style={styles.section}>
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

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.confirmButton, paying ? styles.confirmButtonBusy : null]}
        activeOpacity={0.88}
        onPress={handleConfirmAndPay}
        disabled={paying}
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
    marginBottom: 12,
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
  spacer: {
    flex: 1,
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: darkTheme.colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: 8,
  },
  confirmButtonBusy: {
    opacity: 0.9,
  },
  confirmButtonText: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.lg,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default EscrowFundingScreen;
