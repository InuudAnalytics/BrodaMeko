import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import AppText from './AppText';
import { darkTheme } from '../theme';

const TOAST_HIDE_DELAY_MS = 3800;

const ForegroundNotificationToast = ({ notification, onPress }) => {
  const [visible, setVisible] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef(null);
  const seenToastKeyRef = useRef('');

  const toastKey = useMemo(() => {
    const id = String(notification?.data?.notification_id || '').trim();
    if (id) {
      return id;
    }
    return `${notification?.title || ''}|${notification?.body || ''}|${
      notification?.data?.job_id || ''
    }|${notification?.data?.conversation_id || ''}`;
  }, [notification]);

  useEffect(() => {
    if (!notification) {
      return;
    }
    if (!toastKey || toastKey === seenToastKeyRef.current) {
      return;
    }
    seenToastKeyRef.current = toastKey;
    setVisible(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, TOAST_HIDE_DELAY_MS);
  }, [anim, notification, toastKey]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.toastWrap,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-12, 0],
              }),
            },
          ],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity style={styles.toastCard} activeOpacity={0.9} onPress={onPress}>
        <AppText style={styles.toastTitle}>
          {String(notification?.title || 'New notification').trim() || 'New notification'}
        </AppText>
        <AppText style={styles.toastBody} numberOfLines={2}>
          {String(notification?.body || 'Tap to view details.').trim() || 'Tap to view details.'}
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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

export default ForegroundNotificationToast;
