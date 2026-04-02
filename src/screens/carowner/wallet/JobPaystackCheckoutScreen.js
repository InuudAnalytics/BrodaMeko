import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { AppText, ScreenContainer } from '../../../components';
import { useAuth, useChat } from '../../../context';
import { getCarOwnerJob } from '../../../services/jobs.service';
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

const readAuthorizationUrl = (payload) => {
  const root = payload?.data || payload || {};
  return String(
    root?.authorization_url ||
      root?.checkout_url ||
      root?.payment_url ||
      root?.data?.authorization_url ||
      root?.data?.checkout_url ||
      root?.data?.payment_url ||
      '',
  ).trim();
};

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const isJobEscrowFunded = (job) => {
  const escrowStatus = normalizeStatus(job?.escrow_status || job?.escrowStatus);
  const paymentStatus = normalizeStatus(job?.payment_status || job?.paymentStatus);
  const escrowFundedFlag = Boolean(job?.escrow_funded ?? job?.escrowFunded);
  const paymentCompletedFlag = Boolean(job?.payment_completed ?? job?.paymentCompleted);
  const paidFlag = Boolean(job?.is_paid ?? job?.paid);

  const fundedEscrowStatuses = new Set(['funded', 'in_escrow', 'held', 'secured']);
  const paidPaymentStatuses = new Set(['paid', 'successful', 'success', 'completed']);

  return (
    escrowFundedFlag ||
    paymentCompletedFlag ||
    paidFlag ||
    fundedEscrowStatuses.has(escrowStatus) ||
    paidPaymentStatuses.has(paymentStatus)
  );
};

const readJobFromResponse = (response) => {
  const payload = response?.data || response || {};
  return payload?.job || payload?.data?.job || payload?.data || payload;
};

const JobPaystackCheckoutScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { respondQuotation, initiatePaymentForJob, addLocalMessage } = useChat();
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [finalizing, setFinalizing] = useState(false);
  const [complete, setComplete] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const params = useMemo(
    () => ({
      quotationId: String(route?.params?.quotationId || '').trim(),
      conversationId: String(route?.params?.conversationId || '').trim(),
      jobId: String(route?.params?.jobId || '').trim(),
      issueSummary: route?.params?.issueSummary || {},
      mechanic: route?.params?.mechanic || {},
      mechanicId: String(route?.params?.mechanicId || '').trim(),
      paymentMethodLabel: String(route?.params?.paymentMethodLabel || 'transfer').trim().toLowerCase(),
    }),
    [route?.params],
  );

  const completeFlow = useCallback(async () => {
    if (complete || finalizing) {
      return;
    }

    setFinalizing(true);
    try {
      addLocalMessage(params.conversationId, {
        type: 'system',
        text: 'Payment completed. Price accepted. Mechanic has been assigned.',
      });

      navigation.replace(ROUTES.CAR_OWNER_PAYMENT_SUCCESS, {
        payeeName: params.mechanic?.name || params.mechanic?.full_name || 'Assigned mechanic',
        nextRoute: ROUTES.CAR_OWNER_LIVE_TRACKING,
        nextParams: {
          jobId: params.jobId,
          mechanicId: params.mechanicId,
          mechanic: params.mechanic,
          conversationId: params.conversationId,
          issueSummary: params.issueSummary,
          progressStatus: 'accepted',
          trackingStatus: 'accepted',
        },
      });
      setComplete(true);
    } finally {
      setFinalizing(false);
    }
  }, [addLocalMessage, complete, finalizing, navigation, params]);

  const verifyEscrowFunding = useCallback(async () => {
    if (verifying) {
      return false;
    }

    setVerifying(true);
    try {
      const maxAttempts = 24; // ~2 minutes
      for (let i = 0; i < maxAttempts; i += 1) {
        const jobResponse = await getCarOwnerJob(params.jobId);
        const job = readJobFromResponse(jobResponse);
        if (isJobEscrowFunded(job)) {
          await completeFlow();
          return true;
        }
        // Wait 5s between checks.
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      setError('Payment is not yet confirmed on the server. Please tap "Verify payment" in a moment.');
      return false;
    } catch (verifyError) {
      setError(verifyError?.message || 'Could not verify payment yet.');
      return false;
    } finally {
      setVerifying(false);
    }
  }, [completeFlow, params.jobId, verifying]);

  const initializeCheckout = useCallback(async () => {
    if (!params.quotationId || !params.conversationId || !params.jobId) {
      setError('Payment context is incomplete.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Keep current backend dependency: quotation acceptance precedes payment initiation.
      const quotationResponse = await respondQuotation(params.conversationId, {
        quotation_id: params.quotationId,
        action: 'accept',
      });

      if (!quotationResponse) {
        throw new Error('Could not accept quotation.');
      }

      const paymentResponse = await initiatePaymentForJob(params.jobId, 'paystack', {
        email: user?.email || '',
      });
      if (!paymentResponse) {
        throw new Error('Could not initialize payment.');
      }

      const url = readAuthorizationUrl(paymentResponse);
      if (!url) {
        // Wallet payments or non-redirect paths still require server verification.
        await verifyEscrowFunding();
        return;
      }

      setAuthorizationUrl(url);
    } catch (initError) {
      setError(initError?.message || 'Could not initialize checkout.');
    } finally {
      setLoading(false);
    }
  }, [
    initiatePaymentForJob,
    params.conversationId,
    params.jobId,
    params.quotationId,
    respondQuotation,
    user?.email,
    verifyEscrowFunding,
  ]);

  React.useEffect(() => {
    initializeCheckout();
  }, [initializeCheckout]);

  const handleWebNavigation = (urlValue) => {
    const url = String(urlValue || '').toLowerCase();
    if (!url) {
      return;
    }

    const isSuccess =
      url.includes('status=success') ||
      url.includes('payment/success') ||
      url.includes('/success') ||
      url.includes('trxref=') ||
      url.includes('reference=');

    const isFailed =
      url.includes('status=failed') ||
      url.includes('status=cancelled') ||
      url.includes('status=canceled') ||
      url.includes('/cancel');

    if (isSuccess) {
      verifyEscrowFunding();
      return;
    }

    if (isFailed) {
      AppAlert.alert('Payment not completed', 'You can retry checkout.');
    }
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <BackIcon color={darkTheme.colors.text} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>
          {params.paymentMethodLabel === 'card' ? 'Card payment' : 'Transfer payment'}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.stateWrap}>
          <ActivityIndicator size="small" color={darkTheme.colors.accent} />
          <AppText style={styles.stateText}>Initializing checkout...</AppText>
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.stateWrap}>
          <AppText style={styles.errorText}>{error}</AppText>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.86} onPress={initializeCheckout}>
            <AppText style={styles.retryBtnText}>Retry</AppText>
          </TouchableOpacity>
        </View>
      ) : null}

      {!loading && !error && authorizationUrl ? (
        <WebView
          source={{ uri: authorizationUrl }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.webLoadingWrap}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          )}
          onNavigationStateChange={(navState) => handleWebNavigation(navState?.url)}
          onShouldStartLoadWithRequest={(request) => {
            handleWebNavigation(request?.url);
            return true;
          }}
        />
      ) : null}

      {!loading && !complete ? (
        <View style={styles.verifyFooter}>
          <TouchableOpacity
            style={[styles.verifyBtn, verifying ? styles.verifyBtnDisabled : null]}
            activeOpacity={0.88}
            onPress={verifyEscrowFunding}
            disabled={verifying}
          >
            {verifying ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
            <AppText style={styles.verifyBtnText}>{verifying ? 'Verifying...' : 'Verify payment'}</AppText>
          </TouchableOpacity>
        </View>
      ) : null}
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
    marginBottom: 8,
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
    fontSize: darkTheme.typography.fontSizes.lg,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateText: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: darkTheme.typography.fontSizes.md,
  },
  errorText: {
    color: '#FF8E8E',
    fontSize: darkTheme.typography.fontSizes.md,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  webLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.background,
  },
  verifyFooter: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
  },
  verifyBtn: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  verifyBtnDisabled: {
    opacity: 0.7,
  },
  verifyBtnText: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.bold,
    marginLeft: 8,
  },
});

export default JobPaystackCheckoutScreen;




