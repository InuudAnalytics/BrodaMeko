import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../../components';
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

const CardPaymentScreen = ({ navigation, route }) => {
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const paymentParams = useMemo(
    () => ({
      quotationId: String(route?.params?.quotationId || '').trim(),
      conversationId: String(route?.params?.conversationId || '').trim(),
      jobId: String(route?.params?.jobId || '').trim(),
      issueSummary: route?.params?.issueSummary || {},
      mechanic: route?.params?.mechanic || {},
      mechanicId: String(route?.params?.mechanicId || '').trim(),
      paymentMethodLabel: 'card',
    }),
    [route?.params],
  );

  const canProceed =
    cardName.trim().length > 0 &&
    cardNumber.replace(/\s/g, '').length >= 12 &&
    cvv.trim().length >= 3 &&
    expiryDate.trim().length >= 5;

  const handleContinue = () => {
    if (!canProceed) {
      return;
    }

    navigation.navigate(ROUTES.CAR_OWNER_JOB_PAYSTACK_CHECKOUT, paymentParams);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <BackIcon color={darkTheme.colors.text} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Payment</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <AppText style={styles.label}>Card name</AppText>
        <TextInput
          value={cardName}
          onChangeText={setCardName}
          placeholder="Enter your card name"
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
          selectionColor={darkTheme.colors.accent}
          autoCapitalize="words"
        />

        <AppText style={styles.label}>Card number</AppText>
        <View style={styles.inputWithIcons}>
          <TextInput
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="Enter your card number"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.inputFlex}
            selectionColor={darkTheme.colors.accent}
            keyboardType="number-pad"
            maxLength={19}
          />
          <View style={styles.cardPillsWrap}>
            <View style={styles.cardPill}>
              <View style={[styles.mcDot, styles.mcDotRed]} />
              <View style={[styles.mcDot, styles.mcDotYellow]} />
            </View>
            <View style={styles.cardPill}>
              <AppText style={styles.visaText}>VISA</AppText>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.colSmall}>
            <AppText style={styles.label}>CVV</AppText>
            <TextInput
              value={cvv}
              onChangeText={setCvv}
              placeholder="453"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
              selectionColor={darkTheme.colors.accent}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
          <View style={styles.colLarge}>
            <AppText style={styles.label}>Expire date</AppText>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="MM/DD/YYYY"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.input}
              selectionColor={darkTheme.colors.accent}
              maxLength={10}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, !canProceed && styles.confirmButtonDisabled]}
          activeOpacity={0.88}
          onPress={handleContinue}
          disabled={!canProceed}
        >
          <AppText style={styles.confirmButtonText}>Confirm and pay</AppText>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 26,
    paddingHorizontal: 14,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 14,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 27,
    lineHeight: 34,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  content: {
    paddingHorizontal: 16,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xl,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    height: 52,
    borderRadius: 6,
    backgroundColor: '#3A3D6B',
    color: darkTheme.colors.text,
    paddingHorizontal: 14,
    fontSize: darkTheme.typography.fontSizes.md,
  },
  inputWithIcons: {
    minHeight: 52,
    borderRadius: 6,
    backgroundColor: '#3A3D6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  inputFlex: {
    flex: 1,
    color: darkTheme.colors.text,
    paddingHorizontal: 14,
    fontSize: darkTheme.typography.fontSizes.md,
  },
  cardPillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPill: {
    height: 30,
    minWidth: 54,
    borderRadius: 5,
    backgroundColor: '#C7C8D6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginLeft: 6,
  },
  mcDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  mcDotRed: {
    backgroundColor: '#EA4335',
    marginRight: -2,
    zIndex: 1,
  },
  mcDotYellow: {
    backgroundColor: '#FBBC05',
  },
  visaText: {
    color: '#2F4A92',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  colSmall: {
    flex: 1,
    marginRight: 10,
  },
  colLarge: {
    flex: 2.2,
  },
  confirmButton: {
    marginTop: 42,
    height: 56,
    borderRadius: 14,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.55,
  },
  confirmButtonText: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.md,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
});

export default CardPaymentScreen;
