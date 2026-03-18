import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  CallIcon,
  Mic01Icon,
  VolumeHighIcon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import { endCall, getCall } from '../../../services/calls.service';
import AppAlert from '../../../components/AppAlert';
import { useCallSession } from '../../../context';

const formatDuration = totalSeconds => {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const InCallScreen = ({ navigation, route }) => {
  const callId = String(route?.params?.callId || '').trim();
  const contextType = String(route?.params?.contextType || '').trim().toLowerCase();
  const contextId = String(route?.params?.contextId || '').trim();
  const participantName = String(route?.params?.participantName || 'Contact').trim();
  const contextLabel = String(route?.params?.contextLabel || 'Connected').trim();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const elapsedRef = useRef(0);
  const didNavigateEndRef = useRef(false);
  const { joinCallById, joiningCall, callError, toggleMicrophone, microphoneEnabled, leaveActiveCall } = useCallSession();

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1;
        elapsedRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navigateToEnded = useCallback((payload = {}) => {
    if (didNavigateEndRef.current) {
      return;
    }
    didNavigateEndRef.current = true;
    navigation.replace(ROUTES.CALL_ENDED, {
      participantName,
      duration: formatDuration(payload?.duration_seconds || elapsedRef.current),
      endReason: String(payload?.end_reason || payload?.state || 'ended'),
      contextType: contextType || String(payload?.context?.type || '').trim().toLowerCase(),
      contextId: contextId || String(payload?.context?.id || '').trim(),
    });
  }, [contextId, contextType, navigation, participantName]);

  useEffect(() => {
    let mounted = true;
    if (!callId) {
      return undefined;
    }

    const join = async () => {
      try {
        await joinCallById(callId);
        if (mounted) {
          setMuted(!microphoneEnabled);
        }
      } catch (error) {
        if (mounted) {
          AppAlert.alert('Could not connect audio', error?.message || 'Call media setup failed.');
        }
      }
    };

    join();
    return () => {
      mounted = false;
    };
  }, [callId, joinCallById, microphoneEnabled]);

  useEffect(() => {
    if (!callId) {
      return undefined;
    }
    let mounted = true;
    const syncCallState = async () => {
      try {
        const response = await getCall(callId);
        const data = response?.data || {};
        const nextState = String(data?.state || '').trim().toLowerCase();
        if (!mounted || !nextState) {
          return;
        }

        if (['rejected', 'missed', 'failed', 'ended'].includes(nextState)) {
          await leaveActiveCall();
          navigateToEnded(data);
        }
      } catch {
        // preserve screen and retry on next poll
      }
    };
    const intervalId = setInterval(syncCallState, 2000);
    syncCallState();
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [callId, leaveActiveCall, navigateToEnded]);

  const duration = useMemo(() => formatDuration(elapsedSeconds), [elapsedSeconds]);

  const handleEndCall = () => {
    const stopCall = async () => {
      if (!callId) {
        navigateToEnded({
          duration_seconds: elapsedRef.current,
          context: { type: contextType, id: contextId },
        });
        return;
      }
      if (isEnding) {
        return;
      }
      setIsEnding(true);
      try {
        const response = await endCall({ call_id: callId, reason: 'hangup' });
        await leaveActiveCall();
        navigateToEnded(response?.data || { state: 'ended', end_reason: 'hangup' });
      } catch (error) {
        AppAlert.alert('Could not end call', error?.message || 'Please try again.');
        setIsEnding(false);
      }
    };
    stopCall();
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <AppText style={styles.avatarText}>{participantName.charAt(0).toUpperCase() || 'C'}</AppText>
        </View>
        <AppText style={styles.name}>{participantName}</AppText>
        <AppText style={styles.subtitle}>{contextLabel}</AppText>
        <AppText style={styles.timer}>{duration}</AppText>
        {joiningCall ? <AppText style={styles.subtitle}>Connecting audio...</AppText> : null}
        {callError ? <AppText style={styles.errorText}>{callError}</AppText> : null}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, muted ? styles.controlBtnActive : null]}
          activeOpacity={0.85}
          onPress={async () => {
            const nextEnabled = await toggleMicrophone();
            setMuted(!nextEnabled);
          }}
        >
          <HugeiconsIcon icon={Mic01Icon} size={19} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlBtn, speakerOn ? styles.controlBtnActive : null]}
          activeOpacity={0.85}
          onPress={() => setSpeakerOn(prev => !prev)}
        >
          <HugeiconsIcon icon={VolumeHighIcon} size={19} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} activeOpacity={0.85} onPress={handleEndCall}>
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#fff" strokeWidth={2.2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} activeOpacity={0.85}>
          <HugeiconsIcon icon={CallIcon} size={19} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 18,
  },
  header: {
    minHeight: 52,
    justifyContent: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(230,199,20,0.22)',
    borderWidth: 1,
    borderColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.accent,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  name: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    lineHeight: 18,
  },
  timer: {
    marginTop: 18,
    color: '#7CF0A6',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  errorText: {
    marginTop: 8,
    color: '#F87171',
    fontSize: 12,
    lineHeight: 16,
  },
  controls: {
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: 16,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  controlBtnActive: {
    borderColor: darkTheme.colors.accent,
    backgroundColor: 'rgba(230,199,20,0.2)',
  },
  endBtn: {
    backgroundColor: '#E05353',
    borderColor: '#E05353',
  },
});

export default InCallScreen;
