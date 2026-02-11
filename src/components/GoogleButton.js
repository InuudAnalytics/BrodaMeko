import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { darkTheme } from '../theme';

const GoogleButton = ({ label = 'Continue with Google', onPress, disabled = false, style, ...rest }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled ? styles.disabled : null, style]}
      {...rest}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>G</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
    columnGap: darkTheme.spacing.sm,
  },
  disabled: {
    opacity: 0.45,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: darkTheme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.bold,
    color: darkTheme.colors.background,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default GoogleButton;
