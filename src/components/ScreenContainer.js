import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { darkTheme } from '../theme';

const ScreenContainer = ({
  children,
  style,
  padded = true,
  safeAreaStyle,
  edges = ['top', 'left', 'right', 'bottom'],
  keyboardAware = true,
  keyboardVerticalOffset = 0,
}) => {
  return (
    <SafeAreaView edges={edges} style={[styles.safeArea, safeAreaStyle]}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={keyboardAware ? (Platform.OS === 'ios' ? 'padding' : 'height') : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <View style={[styles.content, padded ? styles.padded : null, style]}>{children}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  keyboardWrap: {
    flex: 1,
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
