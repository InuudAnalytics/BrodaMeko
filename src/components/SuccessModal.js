import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { darkTheme } from '../theme';
import AppText from './AppText';

const SuccessModal = ({ visible, title, message, onDismiss, duration = 1000 }) => {
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onDismiss?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={() => {}} pointerEvents="auto">
          <View style={styles.iconWrap}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={70} color="#4CC61F" strokeWidth={2.2} />
          </View>
          <AppText style={styles.title}>{title}</AppText>
          {message ? <AppText style={styles.message}>{message}</AppText> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E9F7D8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.md,
  },
  title: {
    color: '#2B2B2B',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  message: {
    marginTop: darkTheme.spacing.xs,
    color: '#9A9A9A',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default SuccessModal;
