import React from 'react';
import { StyleSheet, View } from 'react-native';
import { darkTheme } from '../theme';
import AppText from './AppText';

const LogoLockup = ({ style, markSize = 86, stacked = true }) => {
  return (
    <View style={[stacked ? styles.stack : styles.row, style]}>
      <View style={[styles.outerMark, { width: markSize, height: markSize, borderRadius: markSize * 0.28 }]}>
        <View style={[styles.innerMark, { width: markSize * 0.44, height: markSize * 0.44, borderRadius: markSize * 0.11 }]} />
      </View>

      <AppText variant="subtitle" style={styles.wordmark}>
        Broda
        <AppText variant="subtitle" color={darkTheme.colors.accent}>
          Meko
        </AppText>
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.sm,
  },
  outerMark: {
    backgroundColor: darkTheme.colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '22.5deg' }],
    marginBottom: darkTheme.spacing.md,
  },
  innerMark: {
    backgroundColor: darkTheme.colors.accent,
    transform: [{ rotate: '-22.5deg' }],
  },
  wordmark: {
    color: darkTheme.colors.text,
    fontSize: 46,
    lineHeight: 52,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default LogoLockup;
