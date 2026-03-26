import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { darkTheme } from '../theme';

const radius = darkTheme.radius || { md: 12, lg: 16, xl: 20 };

const GoogleButton = ({ label = 'Continue with Google', onPress, disabled = false, style, ...rest }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled ? styles.disabled : null, style]}
      {...rest}
    >
      <Image
        source={require('../../assets/google-logo.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
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
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default GoogleButton;
