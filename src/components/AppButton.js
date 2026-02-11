import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { darkTheme } from '../theme';

const AppButton = ({
  label,
  onPress,
  style,
  textStyle,
  disabled = false,
  left,
  right,
  ...rest
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled ? styles.buttonDisabled : null, style]}
      {...rest}
    >
      {left ? <View style={styles.side}>{left}</View> : null}
      <Text style={[styles.label, disabled ? styles.labelDisabled : null, textStyle]}>{label}</Text>
      {right ? <View style={styles.side}>{right}</View> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    backgroundColor: darkTheme.colors.accent,
    borderRadius: darkTheme.radius.lg,
    paddingHorizontal: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  label: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.bold,
    textAlign: 'center',
  },
  labelDisabled: {
    color: darkTheme.colors.background,
  },
  side: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppButton;
