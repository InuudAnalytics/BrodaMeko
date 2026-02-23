import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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
      <View style={styles.iconWrap}>
        <Svg width={18} height={18} viewBox="0 0 18 18">
          <Circle cx="9" cy="9" r="7" stroke="#EA4335" strokeWidth="2.4" strokeDasharray="11 33" strokeLinecap="round" transform="rotate(-45 9 9)" />
          <Circle cx="9" cy="9" r="7" stroke="#FBBC05" strokeWidth="2.4" strokeDasharray="11 33" strokeDashoffset="-11" strokeLinecap="round" transform="rotate(-45 9 9)" />
          <Circle cx="9" cy="9" r="7" stroke="#34A853" strokeWidth="2.4" strokeDasharray="11 33" strokeDashoffset="-22" strokeLinecap="round" transform="rotate(-45 9 9)" />
          <Circle cx="9" cy="9" r="7" stroke="#4285F4" strokeWidth="2.4" strokeDasharray="11 33" strokeDashoffset="-33" strokeLinecap="round" transform="rotate(-45 9 9)" />
          <Path d="M16 9h-6" stroke="#4285F4" strokeWidth="2.4" strokeLinecap="round" />
        </Svg>
      </View>
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
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default GoogleButton;
