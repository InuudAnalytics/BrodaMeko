import React from 'react';
import { StyleSheet, View } from 'react-native';
import { darkTheme } from '../theme';
import AppText from './AppText';

const DividerOr = ({ label = 'Or', style }) => {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <AppText variant="muted" style={styles.label}>{label}</AppText>
      <View style={styles.line} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: darkTheme.spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: darkTheme.colors.inputBorder,
  },
  label: {
    marginHorizontal: darkTheme.spacing.md,
    color: darkTheme.colors.muted,
  },
});

export default DividerOr;
