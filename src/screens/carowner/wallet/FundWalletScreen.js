import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { WebView } from 'react-native-webview';
import { AppButton, AppInput, AppText, ScreenContainer } from '../../../components';
import { topUpWallet, verifyWalletPayment } from '../../../services/wallet.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const readTopUpReference = (payload) => {
  const root = payload?.data || payload || {};

  return String(
    root?.reference ||
    root?.trxref ||
    root?.data?.reference ||
    root?.data?.trxref ||
    ''
  ).trim();
};

const readAuthorizationUrl = (payload) => {
  const root = payload?.data || payload || {};

  return String(
    root?.authorization_url ||
    root?.data?.authorization_url ||
    ''
  ).trim();
};

const FundWalletScreen = ({ navigation }) => {
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

  const canSubmit = useMemo(() => Number(amount) > 0, [amount]);
  const canVerify = useMemo(() => reference.trim() && trxref.trim(), [reference, trxref]);

  const handleTopUp = async () => {
    if (!canSubmit || loadingTopUp) {
      return;
    }

    setLoadingTopUp(true);
    setError('');
    setInfo('');

    try {
      const response = await topUpWallet(Number(amount));
      const nextReference = readTopUpReference(response);
      const nextAuthorizationUrl = readAuthorizationUrl(response);

      if (nextReference) {
        setReference(nextReference);
        setTrxref(nextReference);
      }

      if (nextAuthorizationUrl) {
        setAuthorizationUrl(nextAuthorizationUrl);
        setCheckoutError('');
        setInfo('Checkout link created. Open checkout, complete payment, then verify below.');
        setShowCheckoutModal(true);
      } else {
        setInfo('Top-up initialized. Use reference and trxref to verify payment.');
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
    if (!safeUrl || loadingTopUp || loadingVerify) {
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
    if (!canVerify || loadingVerify) {
      return;
    }

    setLoadingVerify(true);
    setError('');

    try {
      const safeReference = reference.trim();
      const safeTrxref = trxref.trim() || safeReference;

      await verifyWalletPayment(safeReference, safeTrxref);
      navigation.navigate(ROUTES.CAR_OWNER_REWARDS);
    } catch (verifyError) {
      setError(verifyError?.message || 'Could not verify this payment yet.');
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FFFFFF" strokeWidth={2.2} />
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
        />

        <AppButton
          label={loadingTopUp ? 'Processing...' : 'Top up'}
          onPress={handleTopUp}
          disabled={!canSubmit || loadingTopUp || loadingVerify}
          left={loadingTopUp ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          style={styles.primaryBtn}
        />

        <AppButton
          label="Open checkout"
          onPress={handleOpenCheckout}
          disabled={!authorizationUrl.trim() || loadingTopUp || loadingVerify}
          style={styles.secondaryBtn}
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
          disabled={!canVerify || loadingVerify || loadingTopUp}
          left={loadingVerify ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
          style={styles.verifyBtn}
        />

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
        {info ? <AppText style={styles.infoText}>{info}</AppText> : null}
      </View>

      <Modal visible={showCheckoutModal} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.checkoutScreen}>
          <View style={styles.checkoutHeader}>
            <TouchableOpacity style={styles.checkoutCloseBtn} activeOpacity={0.85} onPress={handleCheckoutClose}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FFFFFF" strokeWidth={2.2} />
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
                  <ActivityIndicator size="small" color={darkTheme.colors.accent} />
                </View>
              )}
              onError={(syntheticEvent) => {
                const description = syntheticEvent?.nativeEvent?.description || 'Could not load checkout.';
                setCheckoutError(String(description));
              }}
              onHttpError={(syntheticEvent) => {
                const statusCode = syntheticEvent?.nativeEvent?.statusCode;
                if (statusCode) {
                  setCheckoutError(`Checkout request failed (${statusCode}).`);
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
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
              onNavigationStateChange={(navState) => {
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
              <AppText style={styles.errorText}>No checkout URL available.</AppText>
            </View>
          )}

          {checkoutError ? (
            <View style={styles.checkoutErrorWrap}>
              <AppText style={styles.errorText}>{checkoutError}</AppText>
            </View>
          ) : null}

          <View style={styles.checkoutFooter}>
            <AppButton label="Done, verify payment" onPress={handleCheckoutClose} />
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
  secondaryBtn: {
    marginTop: 8,
  },
  verifyBtn: {
    marginTop: 8,
  },
  errorText: {
    marginTop: 12,
    color: '#FF7F7F',
  },
  infoText: {
    marginTop: 10,
    color: '#9BE17C',
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
