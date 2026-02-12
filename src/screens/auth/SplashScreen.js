import React, { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import AnimatedLogo from '../../components/AnimatedLogo';
import { AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SPLASH_DURATION_MS = 3000;

const SplashScreen = ({ navigation }) => {
  const hasNavigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasNavigated.current) {
        return;
      }

      hasNavigated.current = true;
      navigation.navigate(ROUTES.ROLE_SELECTION);
    }, SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation]);

  return (
    <ScreenContainer padded={false} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={darkTheme.colors.background} />

      <View style={styles.centerContent}>
        <AnimatedLogo size={92} />

        <AppText variant="subtitle" style={styles.wordmark}>
          Broda
          <AppText variant="subtitle" color={darkTheme.colors.accent} style={styles.wordmarkAccent}>
            Meko
          </AppText>
        </AppText>
      </View>
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
  wordmark: {
    marginTop: darkTheme.spacing.lg,
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  wordmarkAccent: {
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
});

export default SplashScreen;
