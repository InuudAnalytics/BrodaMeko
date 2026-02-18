import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { topUpWallet, verifyWalletPayment } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const readTopUpReference = (payload) => {
  return String(
    payload?.reference ||
    payload?.trxref ||
    payload?.data?.reference ||
    payload?.data?.trxref ||
    ''
  ).trim();
};

const FundWalletScreen = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [trxref, setTrxref] = useState('');
  const [error, setError] = useState('');
  const [loadingTopUp, setLoadingTopUp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);

  const canSubmit = useMemo(() => Number(amount) > 0, [amount]);
  const canVerify = useMemo(() => reference.trim() && trxref.trim(), [reference, trxref]);

  const handleTopUp = async () => {
    if (!canSubmit || loadingTopUp) {
      return;
    }

    setLoadingTopUp(true);
    setError('');

    try {
      const response = await topUpWallet(Number(amount));
      const nextReference = readTopUpReference(response);

      if (nextReference) {
        setReference(nextReference);
        setTrxref(nextReference);
      }
    } catch (topUpError) {
      setError(topUpError?.message || 'Could not initialize top-up.');
    } finally {
      setLoadingTopUp(false);
    }
  };

  const handleVerify = async () => {
    if (!canVerify || loadingVerify) {
      return;
    }

    setLoadingVerify(true);
    setError('');

    try {
      await verifyWalletPayment(reference.trim(), trxref.trim());
      navigation.navigate(ROUTES.CAR_OWNER_REWARDS);
    } catch (verifyError) {
      setError(verifyError?.message || 'Could not verify this payment yet.');
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.content}>
        <AppText variant="title" style={styles.heading}>
          Fund Wallet
        </AppText>
        <AppText variant="muted" style={styles.subtext}>
          Start a top-up, then verify with reference and trxref.
        </AppText>

        <AppInput
          label="Amount"
          placeholder="5000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <AppButton
          label={loadingTopUp ? 'Processing...' : 'Top up'}
          onPress={handleTopUp}
          disabled={!canSubmit || loadingTopUp}
          left={loadingTopUp ? <ActivityIndicator size="small" color="#000033" /> : null}
          style={styles.primaryBtn}
        />

        <AppInput
          label="Reference"
          placeholder="payment reference"
          value={reference}
          onChangeText={setReference}
        />
        <AppInput
          label="Trxref"
          placeholder="trxref"
          value={trxref}
          onChangeText={setTrxref}
        />

        <AppButton
          label={loadingVerify ? 'Verifying...' : 'Verify payment'}
          onPress={handleVerify}
          disabled={!canVerify || loadingVerify}
          left={loadingVerify ? <ActivityIndicator size="small" color="#000033" /> : null}
          style={styles.secondaryBtn}
        />

        <AppButton
          label="I have a reference"
          onPress={() =>
            navigation.navigate(ROUTES.CAR_OWNER_VERIFY_TOP_UP, {
              reference: reference.trim(),
              trxref: trxref.trim(),
            })
          }
          style={styles.manualBtn}
          textStyle={styles.manualBtnText}
        />

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
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
    paddingTop: 16,
  },
  heading: {
    color: darkTheme.colors.text,
  },
  subtext: {
    color: darkTheme.colors.muted,
    marginTop: 6,
    marginBottom: 14,
  },
  primaryBtn: {
    marginTop: 6,
    marginBottom: 8,
  },
  secondaryBtn: {
    marginTop: 8,
  },
  manualBtn: {
    marginTop: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
  },
  manualBtnText: {
    color: darkTheme.colors.accent,
  },
  errorText: {
    marginTop: 12,
    color: '#FF7F7F',
  },
});

export default FundWalletScreen;
