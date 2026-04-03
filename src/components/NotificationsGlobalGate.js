import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import notifee from '@notifee/react-native';
import { openSettings } from 'react-native-permissions';
import AppText from './AppText';
import ForegroundNotificationToast from './ForegroundNotificationToast';
import { useAuth, useChat, useNotifications } from '../context';
import { navigationRef } from '../navigation/navigationRef';
import { darkTheme } from '../theme';
import { trackTelemetryEvent } from '../services/telemetry.service';
import { buildCallNavigationTarget } from '../utils/callRouting';

const readTarget = message => {
  const data = message?.data && typeof message.data === 'object' ? message.data : {};
  const callTarget = buildCallNavigationTarget(data);
  if (callTarget) {
    return callTarget;
  }

  const routeName = String(data?.screen || data?.route || data?.screen_name || '').trim() || 'Notifications';
  let params = data?.params && typeof data.params === 'object' ? data.params : {};
  if (!Object.keys(params).length && typeof data?.params === 'string') {
    try {
      const parsed = JSON.parse(data.params);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        params = parsed;
      }
    } catch {
      params = {};
    }
  }
  return { routeName, params };
};

const NotificationsGlobalGate = () => {
  const { token, isBootstrapped } = useAuth();
  const { permissionStatus, requestPermission, lastNotification } = useNotifications();
  const { latestCallSignal } = useChat();
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const lastCallSignalKeyRef = useRef('');

  const normalizedStatus = String(permissionStatus || '').toLowerCase();
  const isBlocked = normalizedStatus === 'blocked';
  const hasSession = isBootstrapped && Boolean(token);
  const isGranted = normalizedStatus === 'granted';
  const showGate = hasSession && !isGranted && !sessionDismissed;

  useEffect(() => {
    // New login session should always be allowed to show gate again.
    setSessionDismissed(false);
  }, [token]);

  useEffect(() => {
    if (isGranted) {
      setSessionDismissed(false);
    }
  }, [isGranted]);

  useEffect(() => {
    const signal = latestCallSignal && typeof latestCallSignal === 'object' ? latestCallSignal : null;
    if (!signal) {
      return;
    }

    const callId = String(signal?.payload?.call_id || '').trim();
    const signalType = String(signal?.type || '').trim().toLowerCase();

    // Dismiss the persistent notifee incoming-call notification when the caller
    // ends, the callee rejects, or the call is marked missed.
    if (signalType === 'call.ended' || signalType === 'call.rejected' || signalType === 'call.missed') {
      notifee.cancelNotification('incoming_call').catch(() => {});
    }

    const target = buildCallNavigationTarget({
      ...signal?.payload,
      type: signal?.type,
    });
    if (!target) {
      return;
    }

    const dedupeKey = `${signalType}:${callId}`;
    if (!callId || dedupeKey === lastCallSignalKeyRef.current) {
      return;
    }
    lastCallSignalKeyRef.current = dedupeKey;
    trackTelemetryEvent('ws_delivered', {
      signal_type: signalType,
      call_id: callId,
      route: target?.routeName || '',
    });

    if (navigationRef.isReady()) {
      navigationRef.navigate(target.routeName, target.params);
    }
  }, [latestCallSignal]);

  const handleEnableNotifications = async () => {
    if (isBlocked) {
      openSettings().catch(() => {});
      return;
    }
    setIsRequestingPermission(true);
    try {
      await requestPermission();
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleToastPress = () => {
    const target = readTarget(lastNotification || {});
    if (navigationRef.isReady()) {
      navigationRef.navigate(target.routeName, target.params);
    }
  };

  return (
    <>
      {showGate ? (
        <View style={styles.gateWrap} pointerEvents="auto">
          <Pressable style={styles.gateBackdrop} onPress={() => {}} />
          <View style={styles.gateCard}>
            <AppText style={styles.gateTitle}>Enable notifications</AppText>
            <AppText style={styles.gateBody}>
              Turn on push notifications for job updates, quotes, and wallet events.
            </AppText>
            <View style={styles.gateActions}>
              <TouchableOpacity
                style={styles.gateSecondaryBtn}
                activeOpacity={0.9}
                disabled={isRequestingPermission}
                onPress={() => {
                  setSessionDismissed(true);
                }}
              >
                <AppText style={styles.gateSecondaryText}>Not now</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gatePrimaryBtn}
                activeOpacity={0.9}
                disabled={isRequestingPermission}
                onPress={handleEnableNotifications}
              >
                <AppText style={styles.gatePrimaryText}>
                  {isRequestingPermission ? 'Please wait...' : isBlocked ? 'Open settings' : 'Enable'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      <ForegroundNotificationToast notification={lastNotification} onPress={handleToastPress} />
    </>
  );
};

const styles = StyleSheet.create({
  gateWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingBottom: 20,
    zIndex: 60,
  },
  gateBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  gateCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,51,0.96)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  gateTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  gateBody: {
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 5,
  },
  gateActions: {
    marginTop: 12,
    flexDirection: 'row',
    columnGap: 10,
  },
  gateSecondaryBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateSecondaryText: {
    color: darkTheme.colors.text,
    fontSize: 12,
  },
  gatePrimaryBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatePrimaryText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default NotificationsGlobalGate;
