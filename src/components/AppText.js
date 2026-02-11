import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { darkTheme } from '../theme';

const AppText = ({ children, variant = 'body', color, style, numberOfLines, ...rest }) => {
  const variantStyle = darkTheme.typography.textVariants[variant] || darkTheme.typography.textVariants.body;

  const defaultColor = variant === 'muted' ? darkTheme.colors.muted : darkTheme.colors.text;

  return (
    <Text
      {...rest}
      numberOfLines={numberOfLines}
      style={[styles.base, variantStyle, { color: color || defaultColor }, style]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: darkTheme.colors.text,
  },
});

export default AppText;
