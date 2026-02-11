import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme } from '../theme';

const ScreenContainer = ({ children, style, padded = true, safeAreaStyle }) => {
  return (
    <SafeAreaView style={[styles.safeArea, safeAreaStyle]}>
      <View style={[styles.content, padded ? styles.padded : null, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  padded: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingVertical: darkTheme.spacing.md,
  },
});

export default ScreenContainer;
