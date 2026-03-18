import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
import { endCall, getCall } from '../../../services/calls.service';

const formatDuration = (totalSeconds) => {
  const seconds = Math.max(0, Number(totalSeconds || 0));
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const OutgoingCallScreen = ({ navigation, route }) => {
  const calleeName = String(route?.params?.calleeName || 'Contact').trim();
  const contextLabel = String(route?.params?.contextLabel || 'Calling...').trim();
  const contextType = String(route?.params?.contextType || '').trim().toLowerCase();
  const contextId = String(route?.params?.contextId || '').trim();
  const callId = String(route?.params?.callId || '').trim();
  const [callState, setCallState] = useState('ringing');
  const [isEnding, setIsEnding] = useState(false);
  const pollRef = useRef(null);
  const isTerminalRef = useRef(false);
  const didNavigateRef = useRef(false);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleTerminal = useCallback((payload = {}) => {
    if (didNavigateRef.current) {
      return;
    }
    didNavigateRef.current = true;
    isTerminalRef.current = true;
    const duration = formatDuration(payload?.duration_seconds || 0);
    navigation.replace(ROUTES.CALL_ENDED, {
      participantName: calleeName,
      duration,
      endReason: String(payload?.end_reason || payload?.state || 'ended'),
      contextType: contextType || String(payload?.context?.type || '').trim().toLowerCase(),
      contextId: contextId || String(payload?.context?.id || '').trim(),
    });
  }, [calleeName, contextId, contextType, navigation]);

  useEffect(() => {
    if (!callId) {
      return undefined;
    }

    const syncCall = async () => {
      try {
        const response = await getCall(callId);
        const data = response?.data || {};
        const nextState = String(data?.state || '').trim().toLowerCase();
        if (!nextState) {
          return;
        }
        setCallState(nextState);
        if (nextState === 'accepted') {
          if (didNavigateRef.current) {
            return;
          }
          didNavigateRef.current = true;
          isTerminalRef.current = true;
          stopPolling();
          navigation.replace(ROUTES.CALL_IN_PROGRESS, {
            callId,
            participantName: calleeName,
            contextLabel,
            contextType,
            contextId,
          });
          return;
        }
        if (['rejected', 'missed', 'failed', 'ended'].includes(nextState)) {
          stopPolling();
          handleTerminal(data);
        }
      } catch {
        // keep polling while caller is on screen
      }
    };

    syncCall();
    pollRef.current = setInterval(syncCall, 2000);

    return () => {
      stopPolling();
      // If caller leaves this screen while still ringing, cancel the call to avoid stale active sessions.
      if (!isTerminalRef.current && callId) {
        endCall({ call_id: callId, reason: 'hangup' }).catch(() => {});
      }
    };
  }, [callId, calleeName, contextId, contextLabel, contextType, navigation, handleTerminal]);

  const handleEnd = async () => {
    if (isEnding) {
      return;
    }
    if (!callId) {
      navigation.goBack();
      return;
    }
    setIsEnding(true);
    try {
      const response = await endCall({ call_id: callId, reason: 'hangup' });
      handleTerminal(response?.data || {});
    } catch (error) {
      AppAlert.alert('Could not end call', error?.message || 'Please try again.');
      setIsEnding(false);
    }
  };

  const ringingLabel = useMemo(() => {
    if (callState === 'ringing') {
      return 'Ringing...';
    }
    if (callState === 'accepted') {
      return 'Connecting...';
    }
    return callState ? `${callState}...` : 'Calling...';
  }, [callState]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={handleEnd}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarWrap}>
          <AppText style={styles.avatarText}>{calleeName.charAt(0).toUpperCase() || 'C'}</AppText>
        </View>
        <AppText style={styles.name}>{calleeName}</AppText>
        <AppText style={styles.subtitle}>{contextLabel}</AppText>
        <AppText style={styles.ringing}>{ringingLabel}</AppText>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.actionBtn, styles.endBtn]} activeOpacity={0.85} onPress={handleEnd}>
          <HugeiconsIcon icon={Cancel01Icon} size={20} color="#fff" strokeWidth={2.2} />
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
  ringing: {
    marginTop: 24,
    color: darkTheme.colors.accent,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  footer: {
    paddingBottom: 28,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endBtn: {
    backgroundColor: '#E05353',
  },
});

export default OutgoingCallScreen;
