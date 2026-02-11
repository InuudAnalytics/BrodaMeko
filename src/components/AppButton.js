import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { darkTheme } from '../theme';

const AppButton = ({ label, onPress, style, textStyle, ...rest }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.button, style]} {...rest}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: darkTheme.colors.accent,
    borderRadius: 10,
    paddingVertical: darkTheme.spacing.lg,
    paddingHorizontal: darkTheme.spacing.xl,
    marginTop: darkTheme.spacing.md,
  },
  label: {
    color: darkTheme.colors.background,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.bold,
    textAlign: 'center',
  },
});

export default AppButton;
