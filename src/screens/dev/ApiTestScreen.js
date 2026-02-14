import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { MOCK_FCM_TOKEN, getMockDeviceType } from '../../config/mockDevice';
import { registerDevice } from '../../services/device.service';
import { getTransactionDetails, getTransactions } from '../../services/transactions.service';
import { topUpWallet, verifyWalletPayment } from '../../services/wallet.service';
import { darkTheme } from '../../theme';

const PRETTY_SPACE = 2;

const safeJson = (value) => {
  try {
    return JSON.stringify(value, null, PRETTY_SPACE);
  } catch (error) {
    return String(value);
  }
};

const ApiTestScreen = () => {
  const [loadingAction, setLoadingAction] = useState('');
  const [output, setOutput] = useState('');

  const isBusy = useMemo(() => Boolean(loadingAction), [loadingAction]);

  const runAction = async (actionKey, runner) => {
    setLoadingAction(actionKey);

    try {
      const result = await runner();
      setOutput(
        safeJson({
          ok: true,
          action: actionKey,
          result,
        }),
      );
    } catch (error) {
      setOutput(
        safeJson({
          ok: false,
          action: actionKey,
          error: {
            message: error?.message || 'Request failed',
            statusCode: error?.statusCode || 0,
            data: error?.data || null,
          },
        }),
      );
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <ScreenContainer style={styles.screen}>
      <AppText variant="title" style={styles.heading}>
        API Dev Test
      </AppText>
      <AppText variant="muted" style={styles.subheading}>
        Temporary screen for service wiring checks
      </AppText>

      <View style={styles.buttonList}>
        <AppButton
          label="Register Device"
          disabled={isBusy}
          onPress={() =>
            runAction('register-device', () =>
              registerDevice({
                fcm_token: MOCK_FCM_TOKEN,
                device_type: getMockDeviceType(),
              }),
            )
          }
        />

        <AppButton
          label="Top Up Wallet (1300)"
          disabled={isBusy}
          onPress={() => runAction('top-up-wallet', () => topUpWallet(1300))}
        />

        <AppButton
          label="Verify Payment (reference/trxref)"
          disabled={isBusy}
          onPress={() =>
            runAction('verify-wallet-payment', () => verifyWalletPayment('abpeo0plqh', 'abpeo0plqh'))
          }
        />

        <AppButton
          label="Get Transactions"
          disabled={isBusy}
          onPress={() => runAction('get-transactions', () => getTransactions())}
        />

        <AppButton
          label="Get Transaction Details"
          disabled={isBusy}
          onPress={() => runAction('get-transaction-details', () => getTransactionDetails('abpeo0plqh'))}
        />
      </View>

      <View style={styles.outputCard}>
        <View style={styles.outputHeader}>
          <AppText variant="subtitle" style={styles.outputTitle}>
            Response
          </AppText>
          {isBusy ? <ActivityIndicator size="small" color={darkTheme.colors.accent} /> : null}
        </View>

        <ScrollView style={styles.outputScroll} contentContainerStyle={styles.outputContent}>
          <AppText style={styles.outputText}>{output || 'No response yet. Tap any button above.'}</AppText>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: darkTheme.spacing.lg,
    backgroundColor: darkTheme.colors.background,
  },
  heading: {
    color: darkTheme.colors.text,
  },
  subheading: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.lg,
  },
  buttonList: {
    rowGap: darkTheme.spacing.sm,
  },
  outputCard: {
    flex: 1,
    marginTop: darkTheme.spacing.lg,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: darkTheme.spacing.md,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  outputTitle: {
    color: darkTheme.colors.accent,
  },
  outputScroll: {
    flex: 1,
  },
  outputContent: {
    paddingBottom: darkTheme.spacing.md,
  },
  outputText: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 18,
  },
});

export default ApiTestScreen;
