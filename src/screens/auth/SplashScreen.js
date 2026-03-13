import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const SPLASH_DURATION_MS = 3000;
const QUICK_SPLASH_DURATION_MS = 900;
const LOGO_ANIMATION_DURATION_MS = 700;

const SplashScreen = ({ navigation }) => {
  const { selectedRole, hasSeenOnboarding } = useAuth();
  const hasNavigated = useRef(false);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(18)).current;
  const shouldSkipOnboarding = Boolean(selectedRole || hasSeenOnboarding);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: LOGO_ANIMATION_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoOpacity, logoTranslateY]);

  useEffect(() => {
    const delay = shouldSkipOnboarding
      ? QUICK_SPLASH_DURATION_MS
      : SPLASH_DURATION_MS;
    const timer = setTimeout(() => {
      if (hasNavigated.current) {
        return;
      }

      hasNavigated.current = true;
      if (shouldSkipOnboarding) {
        navigation.replace(
          ROUTES.LOGIN,
          selectedRole ? { role: selectedRole } : undefined,
        );
        return;
      }

      navigation.replace(ROUTES.ONBOARDING_CAROUSEL);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [navigation, selectedRole, shouldSkipOnboarding]);

  return (
    <ScreenContainer padded={false} style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={darkTheme.colors.background}
      />

      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoAnimationWrap,
            {
              opacity: logoOpacity,
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/brodamekoLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
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
  logoAnimationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
});

export default SplashScreen;
