import React, { useCallback, useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppText, LogoLockup, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SplashScreen = ({ navigation }) => {
  const hasNavigated = useRef(false);

  const goToLogin = useCallback(() => {
    if (hasNavigated.current) {
      return;
    }

    hasNavigated.current = true;
    navigation.navigate(ROUTES.LOGIN);
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(goToLogin, 1200);
    return () => clearTimeout(timer);
  }, [goToLogin]);

  return (
    <ScreenContainer padded={false} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

      <View style={styles.centerContent}>
        <LogoLockup markSize={86} stacked />
      </View>

      <TouchableOpacity onPress={goToLogin} activeOpacity={0.7} style={styles.fallbackButton}>
        <AppText variant="muted" style={styles.fallbackText}>
          Tap to continue
        </AppText>
      </TouchableOpacity>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: darkTheme.spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackButton: {
    paddingVertical: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.xxl,
  },
  fallbackText: {
    color: darkTheme.colors.muted,
    opacity: 0.8,
  },
});

export default SplashScreen;
