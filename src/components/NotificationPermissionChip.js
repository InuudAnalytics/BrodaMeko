import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { openSettings } from 'react-native-permissions';
import AppText from './AppText';
import { useAuth, useNotifications } from '../context';
import { darkTheme } from '../theme';

const NotificationPermissionChip = ({ style }) => {
  const { token, isBootstrapped } = useAuth();
  const { permissionStatus, requestPermission } = useNotifications();

  const status = String(permissionStatus || '').toLowerCase();
  const showChip = isBootstrapped && Boolean(token) && status !== 'granted';
  if (!showChip) {
    return null;
  }

  const isBlocked = status === 'blocked';
  const handlePress = async () => {
    if (isBlocked) {
      openSettings().catch(() => {});
      return;
    }
    await requestPermission();
  };

  return (
    <TouchableOpacity
      style={[styles.wrap, isBlocked ? styles.blockedWrap : null, style]}
      activeOpacity={0.88}
      onPress={handlePress}
    >
      <View style={styles.dot} />
      <AppText style={styles.text}>
        {isBlocked
          ? 'Notifications blocked. Tap to open settings.'
          : 'Enable notifications for job and payment updates.'}
      </AppText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    minHeight: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.45)',
    backgroundColor: 'rgba(230,199,20,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  blockedWrap: {
    borderColor: 'rgba(255,130,130,0.6)',
    backgroundColor: 'rgba(255,130,130,0.16)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: darkTheme.colors.accent,
  },
  text: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 11,
    lineHeight: 14,
  },
});

export default NotificationPermissionChip;
