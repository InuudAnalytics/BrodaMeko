import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { AppleIcon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppInput,
  AppText,
  AuthMethodToggle,
  DividerOr,
  GoogleButton,
  NigerianPhoneInput,
  ScreenContainer,
} from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import {
  isValidNigerianPhoneDigits,
  ROLES,
  ROUTES,
  useKeyboardLift,
  withNigerianCountryCode,
} from '../../utils';

const METHODS = { PHONE: 'phone', EMAIL: 'email' };
const ROLE_LABELS = {
  [ROLES.CAR_OWNER]: 'Car Owner',
  [ROLES.MECH]: 'Mechanic',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SPARE_PARTS_SELLER]: 'Spare parts seller',
};

const LoginScreen = ({ navigation, route }) => {
  const roleParam = route?.params?.role;
  const {
    token,
    selectedRole,
    setSelectedRole,
    signIn,
    signInWithGoogle,
    signInWithApple,
    isLoading,
    error,
    clearError,
  } = useAuth();
  const { targetRef, animatedStyle } = useKeyboardLift({
    extraOffset: darkTheme.spacing.sm,
  });

  const [method, setMethod] = useState(METHODS.PHONE);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const effectiveRole = useMemo(
    () => roleParam || selectedRole || ROLES.CAR_OWNER,
    [roleParam, selectedRole],
  );
  const effectiveRoleLabel = ROLE_LABELS[effectiveRole] || 'Car Owner';
  const mergedError = localError || error;

  useEffect(() => {
    if (roleParam && roleParam !== selectedRole) {
      setSelectedRole(roleParam);
    }
  }, [roleParam, selectedRole, setSelectedRole]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => subscription.remove();
    }, []),
  );

  const resetError = () => {
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const handleSignIn = async () => {
    if (!password.trim()) {
      setLocalError('Please enter your credentials.');
      return;
    }

    if (method === METHODS.EMAIL) {
      if (!email.trim()) {
        setLocalError('Please enter your credentials.');
        return;
      }

      setLocalError('');
      await signIn({
        email: email.trim(),
        phoneNumber: '',
        password,
        role: effectiveRole,
      });
      return;
    }

    if (!isValidNigerianPhoneDigits(phone)) {
      setLocalError('Phone number must be exactly 10 digits.');
      return;
    }

    setLocalError('');
    await signIn({
      email: '',
      phoneNumber: withNigerianCountryCode(phone),
      password,
      role: effectiveRole,
    });
  };

  return (
    <ScreenContainer
      padded={false}
      edges={['top', 'left', 'right', 'bottom']}
      keyboardAware={false}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View ref={targetRef} style={animatedStyle}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../../assets/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              <AppText variant="title" style={styles.heading}>
                SIGN IN
              </AppText>
              <AppText variant="muted" style={styles.subtitle}>
                Are you ready for the road?
              </AppText>
              {/* <View style={styles.roleRow}>
                <AppText variant="muted" style={styles.roleText}>
                  Signing in as {effectiveRoleLabel}
                </AppText>
                {!token ? (
                    <TouchableOpacity
                      onPress={() =>
                      navigation.navigate(ROUTES.ONBOARDING_CAROUSEL, {
                        returnToLogin: true,
                      })
                      }
                    >
                    <AppText variant="muted" color={darkTheme.colors.accent}>
                      Change role
                    </AppText>
                  </TouchableOpacity>
                ) : null}
              </View> */}

              <View style={styles.form}>
                <AuthMethodToggle
                  initialValue={METHODS.PHONE}
                  onChange={value => {
                    setMethod(value);
                    resetError();
                  }}
                />

                {method === METHODS.EMAIL ? (
                  <AppInput
                    label="Email Address"
                    placeholder="you@email.com"
                    value={email}
                    onChangeText={text => {
                      setEmail(text);
                      resetError();
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <NigerianPhoneInput
                    label="Phone number"
                    value={phone}
                    onChangeText={text => {
                      setPhone(text);
                      resetError();
                    }}
                  />
                )}

                <View style={styles.passwordLabelRow}>
                  <AppText variant="body">Password</AppText>
                  <TouchableOpacity
                    onPress={() => navigation.navigate(ROUTES.FORGOT_PASSWORD)}
                  >
                    <AppText variant="muted" color={darkTheme.colors.accent}>
                      Forgot password
                    </AppText>
                  </TouchableOpacity>
                </View>

                <AppInput
                  placeholder="Enter password"
                  value={password}
                  onChangeText={text => {
                    setPassword(text);
                    resetError();
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity
                      onPress={() => setShowPassword(prev => !prev)}
                    >
                      <HugeiconsIcon
                        icon={showPassword ? ViewOffIcon : ViewIcon}
                        size={20}
                        color={darkTheme.colors.muted}
                        strokeWidth={1.9}
                      />
                    </TouchableOpacity>
                  }
                />

                {mergedError ? (
                  <AppText style={styles.errorText}>{mergedError}</AppText>
                ) : null}

                <View style={styles.primaryCta}>
                  <AppButton
                    label={isLoading ? 'Signing In...' : 'Sign In'}
                    onPress={handleSignIn}
                    disabled={isLoading}
                    left={
                      isLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={darkTheme.colors.background}
                        />
                      ) : null
                    }
                  />
                </View>

                <DividerOr />

                <GoogleButton
                  label="Sign in with Google"
                  onPress={() => signInWithGoogle({ role: effectiveRole })}
                  disabled={isLoading}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isLoading}
                  onPress={() => signInWithApple({ role: effectiveRole })}
                  style={[
                    styles.appleButton,
                    isLoading ? styles.appleButtonDisabled : null,
                  ]}
                >
                  <HugeiconsIcon
                    icon={AppleIcon}
                    size={18}
                    color={darkTheme.colors.text}
                    strokeWidth={1.9}
                  />
                  <AppText style={styles.appleLabel}>
                    Sign in with Apple
                  </AppText>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <AppText variant="muted">Dont have an account? </AppText>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate(ROUTES.SIGN_UP, {
                        role: effectiveRole,
                      })
                    }
                  >
                    <AppText variant="muted" color={darkTheme.colors.accent}>
                      Sign Up
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  scrollContent: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.sm,
  },
  logoImage: {
    width: 200,
    height: 90,
  },
  heading: {
    fontSize: darkTheme.typography.fontSizes.xl,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.sm,
  },
  roleRow: {
    marginBottom: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleText: {
    color: darkTheme.colors.muted,
  },
  form: { marginTop: darkTheme.spacing.xs },
  passwordLabelRow: {
    marginBottom: darkTheme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#FF7B8A',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
  },
  primaryCta: { marginTop: darkTheme.spacing.md },
  appleButton: {
    minHeight: 52,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.sm,
    marginTop: darkTheme.spacing.sm,
  },
  appleButtonDisabled: {
    opacity: 0.45,
  },
  appleLabel: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.md,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  footer: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LoginScreen;
