import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { darkTheme } from '../theme';

const AppText = ({ children, variant = 'body', color, style, ...rest }) => {
  const variantStyle = darkTheme.typography.textVariants[variant] || darkTheme.typography.textVariants.body;

  return (
    <Text
      {...rest}
      style={[
        styles.base,
        variantStyle,
        { color: color || darkTheme.colors.textPrimary },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: darkTheme.colors.textPrimary,
  },
});

export default AppText;
