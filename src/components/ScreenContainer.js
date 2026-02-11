import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { darkTheme } from '../theme';

const ScreenContainer = ({ children, style }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.content, style]}>{children}</View>
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
    padding: darkTheme.spacing.xl,
  },
});

export default ScreenContainer;
