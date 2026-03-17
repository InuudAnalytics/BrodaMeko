import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { WebView } from 'react-native-webview';
import {
  AppButton,
  AppInput,
  AppText,
  ScreenContainer,
} from '../../../components';
import { trackTelemetryEvent } from '../../../services/telemetry.service';
import {
  getWalletBalance,
  topUpWallet,
  verifyWalletPayment,
} from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const readTopUpReference = payload => {
  const root = payload?.data || payload || {};

  return String(
    root?.reference ||
      root?.trxref ||
      root?.data?.reference ||
      root?.data?.trxref ||
      '',
  ).trim();
};

const readTopUpTrxref = payload => {
  const root = payload?.data || payload || {};

  return String(
    root?.trxref ||
      root?.reference ||
      root?.data?.trxref ||
      root?.data?.reference ||
      '',
  ).trim();
};

const readAuthorizationUrl = payload => {
  const root = payload?.data || payload || {};

  return String(
    root?.authorization_url || root?.data?.authorization_url || '',
  ).trim();
};

const readWalletAmount = walletPayload => {
  const root = walletPayload?.data || walletPayload || {};
  const amount = Number(
    root?.wallet?.balance ??
      root?.balance ??
      root?.available_balance ??
      root?.wallet_balance ??
      0,
  );
  return Number.isFinite(amount) ? amount : 0;
};

const WEBHOOK_POLL_INTERVAL_MS = 5000;
const WEBHOOK_POLL_TIMEOUT_MS = 60000;

const sleep = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const FundWalletScreen = ({ navigation, route }) => {
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [trxref, setTrxref] = useState('');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loadingTopUp, setLoadingTopUp] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingSync, setLoadingSync] = useState(false);
  const [loadingWebhookWait, setLoadingWebhookWait] = useState(false);
  const [awaitingWebhookCredit, setAwaitingWebhookCredit] = useState(false);
  const [preTopUpBalance, setPreTopUpBalance] = useState(null);
  const [expectedCreditAmount, setExpectedCreditAmount] = useState(0);
  const source = String(route?.params?.source || '')
    .trim()
    .toLowerCase();
  const openedFromCheckout =
    source.includes('checkout') || Boolean(route?.params?.fromCheckout);

  const canSubmit = useMemo(() => Number(amount) >= 100, [amount]);
  const canVerify = useMemo(() => reference.trim().length > 0, [reference]);

  const waitForWalletWebhookCredit = async (baseBalance, creditAmount) => {
    const expectedBalance =
      Number(baseBalance || 0) + Number(creditAmount || 0);
    if (!Number.isFinite(expectedBalance)) {
      return false;
    }

    const startedAt = Date.now();
    while (Date.now() - startedAt < WEBHOOK_POLL_TIMEOUT_MS) {
      await sleep(WEBHOOK_POLL_INTERVAL_MS);
      try {
        const wallet = await getWalletBalance();
        const currentBalance = readWalletAmount(wallet);
        if (currentBalance >= expectedBalance) {
          return true;
        }
      } catch (walletError) {
        // Ignore transient poll failures, continue until timeout.
      }
    }

    return false;
  };

  const runWebhookCreditCheck = async ({
    showPendingMessage = false,
    eventSource = 'verify',
  } = {}) => {
    const creditAmount = Number(expectedCreditAmount || amount || 0);
    const baseBalance = Number(preTopUpBalance ?? 0);
    const safeReference = reference.trim();
    const expectedBalance = baseBalance + creditAmount;

    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      navigation.navigate(ROUTES.CAR_OWNER_REWARDS);
      return;
    }

    setLoadingWebhookWait(true);
    const checkStartedAt = Date.now();
    try {
      const credited = await waitForWalletWebhookCredit(
        baseBalance,
        creditAmount,
      );
      const waitedMs = Date.now() - checkStartedAt;

      if (credited) {
        trackTelemetryEvent('wallet_credit_confirmed', {
          source: eventSource,
          reference: safeReference,
          expected_credit_amount: creditAmount,
          expected_balance: expectedBalance,
        });
        setAwaitingWebhookCredit(false);
        setInfo('Wallet credited successfully.');
        navigation.navigate(ROUTES.CAR_OWNER_REWARDS);
        return;
      }

      if (showPendingMessage) {
        trackTelemetryEvent('wallet_credit_pending_webhook', {
          source: eventSource,
          reference: safeReference,
          expected_credit_amount: creditAmount,
          expected_balance: expectedBalance,
        });
        trackTelemetryEvent('verify_success_but_no_credit', {
          source: eventSource,
          reference: safeReference,
          trxref: trxref.trim() || safeReference,
          expected_credit_amount: creditAmount,
          expected_balance: expectedBalance,
          waited_ms: waitedMs,
        });
        setAwaitingWebhookCredit(true);
        setError(
          `Webhook delay on server. Your payment reference: ${
            safeReference || 'N/A'
          }`,
        );
        setInfo(
          'Payment verified, waiting for wallet credit. Use Sync payment status to recheck.',
        );
      }
    } finally {
      setLoadingWebhookWait(false);
    }
  };

  const handleTopUp = async () => {
    if (
      !canSubmit ||
      loadingTopUp ||
      loadingWebhookWait ||
      awaitingWebhookCredit ||
      loadingSync
    ) {
      return;
    }

    setLoadingTopUp(true);
    setError('');
    setInfo('');
    setAwaitingWebhookCredit(false);

    try {
      const enteredAmount = Number(amount);
      setExpectedCreditAmount(enteredAmount);

      try {
        const walletBeforeTopUp = await getWalletBalance();
        setPreTopUpBalance(readWalletAmount(walletBeforeTopUp));
      } catch (walletReadError) {
        setPreTopUpBalance(0);
      }

      const response = await topUpWallet(enteredAmount);
      const nextReference = readTopUpReference(response);
      const nextTrxref = readTopUpTrxref(response);
      const nextAuthorizationUrl = readAuthorizationUrl(response);

      const safeReference = nextReference || nextTrxref;
      const safeTrxref = nextTrxref || nextReference;
      if (safeReference) {
        setReference(safeReference);
      }
      if (safeTrxref) {
        setTrxref(safeTrxref);
      }

      if (nextAuthorizationUrl) {
        setAuthorizationUrl(nextAuthorizationUrl);
        setCheckoutError('');
        setInfo(
          'Checkout link created. Open checkout, complete payment, then verify below.',
        );
        setShowCheckoutModal(true);
      } else {
        setInfo(
          'Top-up initialized. Use reference and trxref to verify payment.',
        );
      }
    } catch (topUpError) {
      setError(topUpError?.message || 'Could not initialize top-up.');
      setInfo('');
    } finally {
      setLoadingTopUp(false);
    }
  };

  const handleOpenCheckout = async () => {
    const safeUrl = authorizationUrl.trim();
    if (
      !safeUrl ||
      loadingTopUp ||
      loadingVerify ||
      loadingWebhookWait ||
      loadingSync
    ) {
      return;
    }

    setError('');
    setCheckoutError('');
    setInfo('Complete payment in-app, then verify.');
    setShowCheckoutModal(true);
  };

  const handleCheckoutClose = () => {
    setShowCheckoutModal(false);
    setInfo('If payment was successful, tap Verify payment now.');
  };

  const handleVerify = async () => {
    if (!canVerify || loadingVerify || loadingWebhookWait || loadingSync) {
      return;
    }

    setLoadingVerify(true);
    setError('');
    setAwaitingWebhookCredit(false);

    try {
      const safeReference = reference.trim();
      const safeTrxref = trxref.trim() || safeReference;

      await verifyWalletPayment(safeReference, safeTrxref);
      setInfo('Payment verified, waiting for wallet credit.');
      await runWebhookCreditCheck({
        showPendingMessage: true,
        eventSource: 'verify',
      });
    } catch (verifyError) {
      setError(verifyError?.message || 'Could not verify this payment yet.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleSyncPaymentStatus = async () => {
    if (
      !canVerify ||
      loadingSync ||
      loadingVerify ||
      loadingTopUp ||
      loadingWebhookWait
    ) {
      return;
    }

    setLoadingSync(true);
    setError('');
    try {
      const safeReference = reference.trim();
      const safeTrxref = trxref.trim() || safeReference;
      await verifyWalletPayment(safeReference, safeTrxref);
      setInfo('Payment re-verified, waiting for wallet credit.');
      await runWebhookCreditCheck({
        showPendingMessage: true,
        eventSource: 'sync_status',
      });
    } catch (syncError) {
      setError(syncError?.message || 'Could not sync payment status yet.');
    } finally {
      setLoadingSync(false);
    }
  };

  return (
    <ScreenContainer
      padded={false}
      edges={['top', 'left', 'right', 'bottom']}
      style={styles.screen}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={20}
              color="#FFFFFF"
              strokeWidth={2.2}
            />
          </TouchableOpacity>
          <AppText style={styles.heading}>Fund Wallet</AppText>
          <View style={styles.backButtonSpacer} />
        </View>

        <AppInput
          label="Amount"
          placeholder="5000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          editable={
            !awaitingWebhookCredit &&
            !loadingTopUp &&
            !loadingVerify &&
            !loadingSync
          }
        />
        <AppText style={styles.helperText}>Minimum top-up is ₦100.</AppText>

        <AppButton
          label={loadingTopUp ? 'Processing...' : 'Top up'}
          onPress={handleTopUp}
          disabled={
            !canSubmit ||
            loadingTopUp ||
            loadingVerify ||
            loadingWebhookWait ||
            awaitingWebhookCredit ||
            loadingSync
          }
          left={
            loadingTopUp ? (
              <ActivityIndicator
                size="small"
                color={darkTheme.colors.background}
              />
            ) : null
          }
          style={styles.primaryBtn}
        />

        {openedFromCheckout ? (
          <AppButton
            label="Open checkout"
            onPress={handleOpenCheckout}
            disabled={
              !authorizationUrl.trim() ||
              loadingTopUp ||
              loadingVerify ||
              loadingWebhookWait ||
              loadingSync
            }
            style={styles.secondaryBtn}
          />
        ) : null}

        <AppButton
          label={loadingVerify ? 'Verifying...' : 'Verify payment'}
          onPress={handleVerify}
          disabled={
            !canVerify ||
            loadingVerify ||
            loadingTopUp ||
            loadingWebhookWait ||
            loadingSync
          }
          left={
            loadingVerify ? (
              <ActivityIndicator
                size="small"
                color={darkTheme.colors.background}
              />
            ) : null
          }
          style={styles.verifyBtn}
        />

        {awaitingWebhookCredit ? (
          <View>
            <AppButton
              label={loadingSync ? 'Syncing...' : 'Sync payment status'}
              onPress={handleSyncPaymentStatus}
              disabled={
                loadingSync ||
                loadingWebhookWait ||
                loadingTopUp ||
                loadingVerify
              }
              left={
                loadingSync ? (
                  <ActivityIndicator
                    size="small"
                    color={darkTheme.colors.background}
                  />
                ) : null
              }
              style={styles.verifyBtn}
            />
            <AppButton
              label={
                loadingWebhookWait
                  ? 'Rechecking wallet...'
                  : 'Recheck wallet credit'
              }
              onPress={() =>
                runWebhookCreditCheck({
                  showPendingMessage: true,
                  eventSource: 'manual_recheck',
                })
              }
              disabled={
                loadingWebhookWait ||
                loadingTopUp ||
                loadingVerify ||
                loadingSync
              }
              left={
                loadingWebhookWait ? (
                  <ActivityIndicator
                    size="small"
                    color={darkTheme.colors.background}
                  />
                ) : null
              }
              style={styles.verifyBtn}
            />
          </View>
        ) : null}

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
        {info ? <AppText style={styles.infoText}>{info}</AppText> : null}
        {reference.trim() ? (
          <AppText style={styles.infoText}>
            Reference: {reference.trim()} | Trxref:{' '}
            {trxref.trim() || reference.trim()}
          </AppText>
        ) : null}
      </View>

      <Modal
        visible={showCheckoutModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <View style={styles.checkoutScreen}>
          <View style={styles.checkoutHeader}>
            <TouchableOpacity
              style={styles.checkoutCloseBtn}
              activeOpacity={0.85}
              onPress={handleCheckoutClose}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                color="#FFFFFF"
                strokeWidth={2.2}
              />
            </TouchableOpacity>
            <AppText style={styles.checkoutTitle}>Checkout</AppText>
            <View style={styles.checkoutCloseBtn} />
          </View>

          {authorizationUrl.trim() ? (
            <WebView
              source={{ uri: authorizationUrl.trim() }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              mixedContentMode="always"
              setSupportMultipleWindows={false}
              cacheEnabled={false}
              incognito={false}
              userAgent="Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
              startInLoadingState
              renderLoading={() => (
                <View style={styles.webLoadingWrap}>
                  <ActivityIndicator
                    size="small"
                    color={darkTheme.colors.accent}
                  />
                </View>
              )}
              onError={syntheticEvent => {
                const description =
                  syntheticEvent?.nativeEvent?.description ||
                  'Could not load checkout.';
                setCheckoutError(String(description));
              }}
              onHttpError={syntheticEvent => {
                const statusCode = syntheticEvent?.nativeEvent?.statusCode;
                if (statusCode) {
                  setCheckoutError(`Checkout request failed (${statusCode}).`);
                }
              }}
              onShouldStartLoadWithRequest={request => {
                const target = String(request?.url || '').toLowerCase();
                if (
                  target.includes('status=success') ||
                  target.includes('payment/success') ||
                  target.includes('/success')
                ) {
                  setInfo('Payment success detected. Tap Verify payment now.');
                }

                if (
                  target.includes('status=cancelled') ||
                  target.includes('status=failed') ||
                  target.includes('/cancel')
                ) {
                  setInfo('Payment not completed. You can try checkout again.');
                }

                return true;
              }}
              onNavigationStateChange={navState => {
                const nextUrl = String(navState?.url || '').toLowerCase();
                if (!nextUrl) {
                  return;
                }

                if (
                  nextUrl.includes('status=success') ||
                  nextUrl.includes('payment/success') ||
                  nextUrl.includes('/success')
                ) {
                  setInfo('Payment success detected. Tap Verify payment now.');
                }
              }}
            />
          ) : (
            <View style={styles.webLoadingWrap}>
              <AppText style={styles.errorText}>
                No checkout URL available.
              </AppText>
            </View>
          )}

          {checkoutError ? (
            <View style={styles.checkoutErrorWrap}>
              <AppText style={styles.errorText}>{checkoutError}</AppText>
            </View>
          ) : null}

          <View style={styles.checkoutFooter}>
            <AppButton
              label="Done, verify payment"
              onPress={handleCheckoutClose}
            />
          </View>
        </View>
      </Modal>
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
    paddingTop: 10,
  },
  header: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpacer: {
    width: 36,
    height: 36,
  },
  heading: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    flex: 1,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: 6,
    marginBottom: 8,
  },
  helperText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  secondaryBtn: {
    marginTop: 8,
  },
  verifyBtn: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 12,
    color: '#FF7F7F',
    fontSize: 11,
    lineHeight: 15,
  },
  infoText: {
    marginTop: 10,
    color: '#9BE17C',
    fontSize: 11,
    lineHeight: 15,
  },
  checkoutScreen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  checkoutHeader: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  checkoutCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutTitle: {
    color: darkTheme.colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    flex: 1,
    textAlign: 'center',
  },
  webLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    backgroundColor: darkTheme.colors.background,
  },
  checkoutErrorWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,123,138,0.08)',
  },
});

export default FundWalletScreen;
