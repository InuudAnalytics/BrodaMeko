import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { openSettings } from 'react-native-permissions';
import AppText from './AppText';
import { useAuth, useNotifications } from '../context';
import { navigationRef } from '../navigation/navigationRef';
import { darkTheme } from '../theme';

const TOAST_HIDE_DELAY_MS = 3800;

const readTarget = message => {
  const data = message?.data && typeof message.data === 'object' ? message.data : {};
  const routeName = String(data?.screen || data?.route || data?.screen_name || '').trim() || 'Notifications';
  const params = data?.params && typeof data.params === 'object' ? data.params : {};
  return { routeName, params };
};

const NotificationsGlobalGate = () => {
  const { token, isBootstrapped } = useAuth();
  const { permissionStatus, requestPermission, lastNotification } = useNotifications();
  const [showGate, setShowGate] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);
  const seenToastKeyRef = useRef('');
  const gateDismissedRef = useRef(false);

  const normalizedStatus = String(permissionStatus || '').toLowerCase();
  const shouldPrompt = isBootstrapped && Boolean(token) && normalizedStatus !== 'granted';
  const isBlocked = normalizedStatus === 'blocked';

  useEffect(() => {
    if (!shouldPrompt) {
      gateDismissedRef.current = false;
      setShowGate(false);
      return;
    }
    if (!gateDismissedRef.current) {
      setShowGate(true);
    }
  }, [shouldPrompt]);

  const toastKey = useMemo(() => {
    const id = String(lastNotification?.data?.notification_id || '').trim();
    if (id) {
      return id;
    }
    return `${lastNotification?.title || ''}|${lastNotification?.body || ''}|${
      lastNotification?.data?.job_id || ''
    }|${lastNotification?.data?.conversation_id || ''}`;
  }, [lastNotification]);

  useEffect(() => {
    if (!lastNotification) {
      return;
    }
    if (!toastKey || toastKey === seenToastKeyRef.current) {
      return;
    }
    seenToastKeyRef.current = toastKey;
    setToastVisible(true);
    Animated.timing(toastAnim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, TOAST_HIDE_DELAY_MS);
  }, [lastNotification, toastAnim, toastKey]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  const handleEnableNotifications = async () => {
    if (isBlocked) {
      openSettings().catch(() => {});
      return;
    }
    await requestPermission();
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
        <View style={styles.gateWrap} pointerEvents="box-none">
          <View style={styles.gateCard}>
            <AppText style={styles.gateTitle}>Enable notifications</AppText>
            <AppText style={styles.gateBody}>
              Turn on push notifications for job updates, quotes, and wallet events.
            </AppText>
            <View style={styles.gateActions}>
              <TouchableOpacity
                style={styles.gateSecondaryBtn}
                activeOpacity={0.9}
                onPress={() => {
                  gateDismissedRef.current = true;
                  setShowGate(false);
                }}
              >
                <AppText style={styles.gateSecondaryText}>Not now</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gatePrimaryBtn}
                activeOpacity={0.9}
                onPress={handleEnableNotifications}
              >
                <AppText style={styles.gatePrimaryText}>
                  {isBlocked ? 'Open settings' : 'Enable'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : null}

      {toastVisible ? (
        <Animated.View
          style={[
            styles.toastWrap,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={handleToastPress}>
            <AppText style={styles.toastTitle}>
              {String(lastNotification?.title || 'New notification').trim() || 'New notification'}
            </AppText>
            <AppText style={styles.toastBody} numberOfLines={2}>
              {String(lastNotification?.body || 'Tap to view details.').trim() || 'Tap to view details.'}
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
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
  toastWrap: {
    position: 'absolute',
    top: 52,
    left: 12,
    right: 12,
    zIndex: 70,
  },
  toastCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,51,0.93)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toastTitle: {
    color: darkTheme.colors.text,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  toastBody: {
    marginTop: 2,
    color: darkTheme.colors.muted,
    fontSize: 12,
    lineHeight: 15,
  },
});

export default NotificationsGlobalGate;
