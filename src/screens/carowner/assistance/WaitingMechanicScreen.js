import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth, useChat } from '../../../context';
import { getConversationByJobId, getJobRequestStatus, updateJobStatus } from '../../../services/jobs.service';
import { closeScoped as closeSocketScoped, connectScoped as connectSocketScoped } from '../../../services/ws.service';
import { darkTheme, withAlpha } from '../../../theme';
import { ROUTES } from '../../../utils';

const WAIT_SCOPE = 'car-owner-waiting-screen';
const INITIAL_WAIT_SECONDS = 90;

const WaitingMechanicScreen = ({ navigation, route }) => {
  const { token } = useAuth();
  const { clearActiveConversation } = useChat();
  const [remainingSeconds, setRemainingSeconds] = useState(INITIAL_WAIT_SECONDS);
  const [showTimedOutState, setShowTimedOutState] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;
  const jobId = String(route?.params?.jobId || '').trim();

  const sessionPayload = useMemo(
    () => ({
      mechanic: route?.params?.mechanic || null,
      mechanicId: route?.params?.mechanicId || null,
      jobId,
      issueSummary: route?.params?.issueSummary || null,
      requestId: route?.params?.requestId || null,
    }),
    [jobId, route?.params?.issueSummary, route?.params?.mechanic, route?.params?.mechanicId, route?.params?.requestId]
  );

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );

    if (!showTimedOutState) {
      loop.start();
    }

    return () => {
      loop.stop();
    };
  }, [pulse, showTimedOutState]);

  useEffect(() => {
    if (showTimedOutState) {
      return undefined;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimedOutState(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimedOutState]);

  const activateSession = useCallback(
    async (safeJobId) => {
      const response = await getConversationByJobId(safeJobId);
      const payload = response?.data || response || {};
      const data = payload?.data || payload;
      const conversation = data?.conversation || null;
      const conversationId = String(conversation?.id || conversation?._id || '').trim();

      if (!conversationId) {
        return false;
      }

      navigation.replace(ROUTES.CAR_OWNER_DASHBOARD, {
        activeSession: {
          ...sessionPayload,
          status: 'active',
          progressStatus: 'accepted',
          conversationId,
        },
      });
      return true;
    },
    [navigation, sessionPayload]
  );

  useEffect(() => {
    if (!jobId || !token) {
      return undefined;
    }

    let active = true;

    const onDeclined = () => {
      if (!active) {
        return;
      }
      Alert.alert('Request declined', 'Mechanic declined your request. Please find another mechanic.');
      navigation.replace(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, {
        jobId: sessionPayload.jobId,
        job: route?.params?.job,
        location: route?.params?.location,
      });
    };

    const onCancelled = () => {
      if (!active) {
        return;
      }
      Alert.alert('Mechanic cancelled', 'Please choose another mechanic.');
      navigation.replace(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, {
        jobId: sessionPayload.jobId,
        job: route?.params?.job,
        location: route?.params?.location,
      });
    };

    const onAccepted = async () => {
      if (!active) {
        return;
      }
      const ok = await activateSession(jobId);
      if (!ok && active) {
        setTimeout(() => {
          if (active) {
            activateSession(jobId);
          }
        }, 1200);
      }
    };

    const checkConversation = async () => {
      try {
        const response = await getConversationByJobId(jobId);
        const payload = response?.data || response || {};
        const data = payload?.data || payload;
        const conversation = data?.conversation || data || null;
        const conversationId = String(conversation?.id || conversation?._id || '').trim();
        if (conversationId) {
          navigation.replace(ROUTES.CAR_OWNER_DASHBOARD, {
            activeSession: {
              ...sessionPayload,
              status: 'active',
              progressStatus: 'accepted',
              conversationId,
            },
          });
        }
      } catch {
        // ignore conversation lookup errors
      }
    };

    const handleSocketEvent = async (event) => {
      try {
        const parsed = JSON.parse(event?.data || '{}');
        const type = String(parsed?.type || '').toLowerCase();
        if (type !== 'job_request_updated') {
          return;
        }

        const payload = parsed?.payload || {};
        if (String(payload?.job_id || '').trim() !== jobId) {
          return;
        }

        const status = String(payload?.status || '').toLowerCase();
        if (status === 'accepted') {
          await onAccepted();
          return;
        }

        if (status === 'declined') {
          onDeclined();
          return;
        }

        if (status === 'cancelled' || status === 'canceled') {
          onCancelled();
        }
      } catch {
        // Ignore malformed socket payloads.
      }
    };

    const poll = async () => {
      try {
        const response = await getJobRequestStatus(jobId);
        const root = response?.data || response || {};
        const items = Array.isArray(root?.data) ? root.data : [];
        const requestId = String(sessionPayload?.requestId || '').trim();
        const request = requestId ? items.find((item) => String(item?.id || '').trim() === requestId) : items[0];
        const status = String(request?.status || '').toLowerCase();
        if (status === 'accepted') {
          await onAccepted();
          return;
        }
        if (status === 'declined') {
          onDeclined();
          return;
        }
        if (status === 'cancelled' || status === 'canceled') {
          onCancelled();
        }
        if (!status || status === 'pending') {
          await checkConversation();
        }
      } catch {
        // Ignore poll errors and continue polling.
      }
    };

    connectSocketScoped(WAIT_SCOPE, token, handleSocketEvent);
    poll();
    const intervalId = setInterval(poll, 8000);

    return () => {
      active = false;
      clearInterval(intervalId);
      closeSocketScoped(WAIT_SCOPE);
    };
  }, [activateSession, jobId, navigation, route?.params?.job, route?.params?.location, sessionPayload, token]);

  const handleKeepWaiting = () => {
    setRemainingSeconds(INITIAL_WAIT_SECONDS);
    setShowTimedOutState(false);
  };

  const handleFindOtherMechanics = () => {
    clearActiveConversation();
    navigation.replace(ROUTES.CAR_OWNER_MECHANIC_DISCOVERY, {
      jobId: sessionPayload.jobId,
      job: route?.params?.job,
      location: route?.params?.location,
    });
  };

  const handleCancel = async () => {
    if (!jobId || cancelling) {
      return;
    }
    setCancelling(true);
    try {
      await updateJobStatus(jobId, 'cancelled');
      clearActiveConversation();
      navigation.replace(ROUTES.CAR_OWNER_DASHBOARD);
    } catch (error) {
      Alert.alert('Cancel failed', error?.message || 'Could not cancel this request.');
    } finally {
      setCancelling(false);
    }
  };

  const outerScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.06],
  });

  const middleScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.03],
  });

  const outerOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.52],
  });

  const middleOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.72],
  });

  if (showTimedOutState) {
    return (
      <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Finding mechanics</AppText>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.timeoutWrap}>
          <AppText style={styles.timeoutTitle}>Mechanic is taking time to respond</AppText>

          <View style={styles.timeoutRow}>
            <AppButton label="Keep waiting" onPress={handleKeepWaiting} style={styles.keepWaitingBtn} />
            <AppButton
              label="Find other mechanics"
              onPress={handleFindOtherMechanics}
              style={styles.findOthersBtn}
              textStyle={styles.findOthersText}
            />
          </View>

          <AppButton
            label={cancelling ? 'Cancelling...' : 'Cancel'}
            onPress={handleCancel}
            disabled={cancelling}
            style={styles.cancelBtn}
            textStyle={styles.cancelText}
          />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Finding mechanics</AppText>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.pulseWrap}>
        <Animated.View style={[styles.outerCircle, { transform: [{ scale: outerScale }], opacity: outerOpacity }]} />
        <Animated.View style={[styles.middleCircle, { transform: [{ scale: middleScale }], opacity: middleOpacity }]} />
        <View style={styles.innerCircle}>
          <AppText style={styles.processingTitle}>Processing</AppText>
          <AppText style={styles.processingText}>Waiting for mechanic to accept job</AppText>
        </View>
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
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  pulseWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 293,
    height: 293,
    borderRadius: 146.5,
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.28),
    borderWidth: 1,
    position: 'absolute',
  },
  middleCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.44),
    borderWidth: 1,
    position: 'absolute',
  },
  innerCircle: {
    width: 197,
    height: 197,
    borderRadius: 98.5,
    backgroundColor: withAlpha(darkTheme.colors.accent, 0.62),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  processingTitle: {
    color: '#F6E58D',
    fontSize: 44 / 2,
    lineHeight: 48 / 2,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  processingText: {
    marginTop: 8,
    color: '#F5E6A8',
    fontSize: 24 / 2,
    lineHeight: 30 / 2,
    textAlign: 'center',
  },
  timeoutWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  timeoutTitle: {
    color: darkTheme.colors.text,
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
    marginBottom: 14,
  },
  timeoutRow: {
    width: '100%',
    flexDirection: 'row',
    columnGap: 10,
  },
  keepWaitingBtn: {
    flex: 1,
    minHeight: 42,
  },
  findOthersBtn: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'transparent',
  },
  findOthersText: {
    color: darkTheme.colors.accent,
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 12,
    width: '100%',
    minHeight: 42,
    backgroundColor: 'rgba(255,77,109,0.28)',
    borderWidth: 0,
  },
  cancelText: {
    color: '#FF7B8A',
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default WaitingMechanicScreen;
