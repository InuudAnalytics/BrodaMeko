import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { verifyWalletPayment } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const VerifyTopUpScreen = ({ navigation, route }) => {
  const [reference, setReference] = useState(String(route?.params?.reference || '').trim());
  const [trxref, setTrxref] = useState(String(route?.params?.trxref || '').trim());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canVerify = useMemo(
    () => reference.trim().length > 0 && trxref.trim().length > 0,
    [reference, trxref]
  );

  const handleVerify = async () => {
    if (!canVerify || loading) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await verifyWalletPayment({ reference: reference.trim(), trxref: trxref.trim() });
      setSuccess('Payment verified successfully.');
      setTimeout(() => {
        navigation.navigate(ROUTES.CAR_OWNER_REWARDS, { refresh: Date.now() });
      }, 600);
    } catch (verifyError) {
      setError(verifyError?.message || 'Could not verify payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.content}>
        <AppText style={styles.title}>Verify top-up</AppText>
        <AppText style={styles.subtitle}>Enter your reference and trxref to verify payment.</AppText>

        <AppInput
          label="Reference"
          value={reference}
          onChangeText={setReference}
          placeholder="payment reference"
        />

        <AppInput
          label="Trxref"
          value={trxref}
          onChangeText={setTrxref}
          placeholder="trxref"
        />

        <AppButton
          label={loading ? 'Verifying...' : 'Verify Payment'}
          onPress={handleVerify}
          disabled={!canVerify || loading}
          left={loading ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          style={styles.verifyBtn}
        />

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
        {success ? <AppText style={styles.successText}>{success}</AppText> : null}
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: darkTheme.colors.text,
    fontSize: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
  verifyBtn: {
    marginTop: 10,
  },
  errorText: {
    marginTop: 10,
    color: '#FF7F7F',
  },
  successText: {
    marginTop: 10,
    color: darkTheme.colors.accent,
  },
});

export default VerifyTopUpScreen;
