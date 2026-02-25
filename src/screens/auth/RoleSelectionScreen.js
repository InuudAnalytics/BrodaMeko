import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { AppButton, AppText, AnimatedLogo, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES } from '../../utils';

const LOGO_ENTRY_OFFSET = 120;
const BUTTONS_ENTRY_OFFSET = 34;

const RoleSelectionScreen = ({ navigation, route }) => {
  const { token, setSelectedRole } = useAuth();
  const shouldAnimateIntro = route?.params?.animateIntro === true;
  const returnToLogin = route?.params?.returnToLogin === true;
  const logoTranslateY = useRef(new Animated.Value(shouldAnimateIntro ? LOGO_ENTRY_OFFSET : 0)).current;
  const actionsTranslateY = useRef(new Animated.Value(shouldAnimateIntro ? BUTTONS_ENTRY_OFFSET : 0)).current;
  const actionsOpacity = useRef(new Animated.Value(shouldAnimateIntro ? 0 : 1)).current;
  const [isLogoSpinning, setIsLogoSpinning] = useState(shouldAnimateIntro);

  useEffect(() => {
    if (!shouldAnimateIntro) {
      return;
    }

    const sequence = Animated.sequence([
      Animated.delay(220),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 760,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(actionsOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(actionsTranslateY, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    sequence.start(({ finished }) => {
      if (finished) {
        setIsLogoSpinning(false);
      }
    });

    return () => {
      sequence.stop();
    };
  }, [actionsOpacity, actionsTranslateY, logoTranslateY, shouldAnimateIntro]);

  const handleSelectRole = async (nextRole) => {
    await setSelectedRole(nextRole);

    if (!token && returnToLogin) {
      navigation.replace(ROUTES.LOGIN, { role: nextRole });
      return;
    }

    navigation.navigate(ROUTES.SIGN_UP, { role: nextRole });
  };

  return (
    <ScreenContainer style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ translateY: logoTranslateY }] }]}>
        <AnimatedLogo size={86} duration={1300} spinning={isLogoSpinning} />
        <AppText variant="subtitle" style={styles.wordmark}>
          Broda
          <AppText variant="subtitle" color={darkTheme.colors.accent} style={styles.wordmarkAccent}>
            Meko
          </AppText>
        </AppText>
      </Animated.View>

      <Animated.View
        style={[
          styles.actions,
          {
            opacity: actionsOpacity,
            transform: [{ translateY: actionsTranslateY }],
          },
        ]}
      >
        <AppButton label="Get started as user" onPress={() => handleSelectRole(ROLES.CAR_OWNER)} style={styles.cta} />
        <AppButton label="Get started as mechanic" onPress={() => handleSelectRole(ROLES.MECH)} />
        <AppButton label="Get started as spare part seller" onPress={() => handleSelectRole(ROLES.SPARE_PARTS_SELLER)} />
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: darkTheme.spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: darkTheme.spacing.xxxl,
  },
  wordmark: {
    marginTop: darkTheme.spacing.lg,
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  wordmarkAccent: {
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  actions: {
    width: '100%',
  },
  cta: {
    marginBottom: darkTheme.spacing.md,
  },
});

export default RoleSelectionScreen;
