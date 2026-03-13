import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  AppleIcon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons';
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
  maskNigerianPhone,
  ROLES,
  ROUTES,
  useKeyboardLift,
  validatePasswordRules,
  withNigerianCountryCode,
} from '../../utils';
import { TERMS_SIGNUP_SUMMARY } from '../../content/legalContent';

const ERROR_COLOR = '#FF7B8A';
const SUCCESS_COLOR = '#40C67A';
const NEUTRAL_COLOR = 'rgba(255,255,255,0.45)';
const METHODS = { PHONE: 'phone', EMAIL: 'email' };
const TERMS_SHEET_HEIGHT_RATIO = 0.7;
const ROLE_LABELS = {
  [ROLES.CAR_OWNER]: 'Car Owner',
  [ROLES.MECH]: 'Mechanic',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SPARE_PARTS_SELLER]: 'Spare parts seller',
};

const maskEmail = value => {
  const email = String(value || '').trim();
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 3) return `${name[0] || ''}***@${domain}`;
  return `${name.slice(0, 3)}***@${domain}`;
};

const SignUpScreen = ({ navigation, route }) => {
  const roleParam = route?.params?.role;
  const {
    selectedRole: persistedSelectedRole,
    signUp,
    signInWithGoogle: signUpWithGoogle,
    isLoading,
    error,
    clearError,
  } = useAuth();
  const selectedRole = roleParam || persistedSelectedRole || ROLES.CAR_OWNER;
  const { targetRef, animatedStyle } = useKeyboardLift({
    extraOffset: darkTheme.spacing.sm,
  });
  const { height: screenHeight } = useWindowDimensions();

  const [method, setMethod] = useState(METHODS.PHONE);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const termsTranslateY = useState(
    new Animated.Value(screenHeight * TERMS_SHEET_HEIGHT_RATIO),
  )[0];

  const destinationPreview = useMemo(() => {
    return method === METHODS.PHONE
      ? maskNigerianPhone(phone)
      : maskEmail(email);
  }, [method, phone, email]);

  const passwordChecks = useMemo(
    () => validatePasswordRules(password),
    [password],
  );
  const isPasswordValid =
    passwordChecks.minLength && passwordChecks.hasNumberOrSpecialCharacter;
  const mergedError = localError || error;

  const getRuleState = isMet =>
    isMet ? 'success' : mergedError ? 'error' : 'neutral';

  const resetError = () => {
    if (localError) setLocalError('');
    if (error) clearError();
  };

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => true,
      );
      return () => subscription.remove();
    }, []),
  );

  const openTermsSheet = () => {
    const sheetHeight = screenHeight * TERMS_SHEET_HEIGHT_RATIO;
    setIsTermsVisible(true);
    termsTranslateY.setValue(sheetHeight);
    Animated.timing(termsTranslateY, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  };

  const closeTermsSheet = () => {
    const sheetHeight = screenHeight * TERMS_SHEET_HEIGHT_RATIO;
    Animated.timing(termsTranslateY, {
      toValue: sheetHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsTermsVisible(false);
      }
    });
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !password.trim() || !confirmPassword.trim())
      return setLocalError('Please fill in all required fields.');
    if (method === METHODS.PHONE && !isValidNigerianPhoneDigits(phone))
      return setLocalError('Phone number must be exactly 10 digits.');
    if (method === METHODS.EMAIL && !email.trim())
      return setLocalError('Email address is required.');
    if (!isPasswordValid)
      return setLocalError('Password does not meet all requirements.');
    if (password !== confirmPassword)
      return setLocalError('Passwords do not match.');
    if (!acceptedTerms)
      return setLocalError(
        'Please accept our terms and conditions to continue.',
      );

    setLocalError('');
    const result = await signUp({
      fullName: fullName.trim(),
      email: method === METHODS.EMAIL ? email.trim() : '',
      phoneNumber:
        method === METHODS.PHONE ? withNigerianCountryCode(phone) : '',
      password,
      role: selectedRole,
    });

    const status =
      typeof result === 'object' && result !== null
        ? result.status
        : result
        ? 'success'
        : 'error';

    if (status === 'success' || status === 'uncertain') {
      if (status === 'uncertain' && error) {
        clearError();
      }

      navigation.navigate(ROUTES.OTP_VERIFICATION, {
        method,
        destination: destinationPreview,
        info:
          status === 'uncertain'
            ? 'Network was unstable. If OTP was sent, you can verify below or resend code.'
            : '',
      });
    }
  };

  const renderRule = (label, isMet) => {
    const state = getRuleState(isMet);
    const isSuccess = state === 'success';
    const isError = state === 'error';
    const iconColor = isSuccess
      ? SUCCESS_COLOR
      : isError
      ? ERROR_COLOR
      : NEUTRAL_COLOR;

    return (
      <View style={styles.ruleRow} key={label}>
        <HugeiconsIcon
          icon={
            isSuccess
              ? CheckmarkCircle02Icon
              : isError
              ? CancelCircleIcon
              : CheckmarkCircle02Icon
          }
          size={18}
          color={iconColor}
          strokeWidth={1.9}
        />
        <AppText
          variant="muted"
          style={[
            styles.ruleText,
            isSuccess ? styles.ruleTextSuccess : null,
            isError ? styles.ruleTextError : null,
          ]}
        >
          {label}
        </AppText>
      </View>
    );
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
                SIGN UP
              </AppText>
              <AppText variant="muted" style={styles.subtitle}>
                Are you ready for the road?
              </AppText>
              <View style={styles.roleRow}>
                <AppText variant="muted" style={styles.roleText}>
                  Signing up as {ROLE_LABELS[selectedRole] || 'Car Owner'}
                </AppText>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(ROUTES.ONBOARDING_CAROUSEL, {
                      returnToLogin: false,
                    })
                  }
                >
                  <AppText variant="muted" color={darkTheme.colors.accent}>
                    Change role
                  </AppText>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <AuthMethodToggle
                  initialValue={METHODS.PHONE}
                  onChange={value => {
                    setMethod(value);
                    resetError();
                  }}
                />

                <AppInput
                  label="Full name"
                  placeholder="Toluwalase Daniel"
                  value={fullName}
                  onChangeText={text => {
                    setFullName(text);
                    resetError();
                  }}
                  autoCapitalize="words"
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

                <AppInput
                  label="Password"
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

                <View style={styles.rulesWrap}>
                  {renderRule(
                    'At least 8 characters',
                    passwordChecks.minLength,
                  )}
                  {renderRule(
                    'Contains a number or special character',
                    passwordChecks.hasNumberOrSpecialCharacter,
                  )}
                </View>

                <AppInput
                  label="Confirm password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={text => {
                    setConfirmPassword(text);
                    resetError();
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(prev => !prev)}
                    >
                      <HugeiconsIcon
                        icon={showConfirmPassword ? ViewOffIcon : ViewIcon}
                        size={20}
                        color={darkTheme.colors.muted}
                        strokeWidth={1.9}
                      />
                    </TouchableOpacity>
                  }
                />

                <View style={styles.acceptTermsRow}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.acceptTermsCheckbox}
                    onPress={() => {
                      setAcceptedTerms(prev => !prev);
                      resetError();
                    }}
                  >
                    <View
                      style={[
                        styles.acceptTermsCheckboxBox,
                        acceptedTerms
                          ? styles.acceptTermsCheckboxBoxActive
                          : null,
                      ]}
                    >
                      {acceptedTerms ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={12}
                          color={darkTheme.colors.background}
                          strokeWidth={2.2}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  <AppText variant="muted">I accept our </AppText>
                  <TouchableOpacity
                    onPress={openTermsSheet}
                    activeOpacity={0.85}
                  >
                    <AppText variant="muted" style={styles.termsLink}>
                      terms and conditions
                    </AppText>
                  </TouchableOpacity>
                </View>

                {mergedError ? (
                  <AppText style={styles.errorText}>{mergedError}</AppText>
                ) : null}

                <View style={styles.primaryCta}>
                  <AppButton
                    label={isLoading ? 'Signing Up...' : 'Sign Up'}
                    onPress={handleSignUp}
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
                  label="Sign up with Google"
                  onPress={() => signUpWithGoogle({ role: selectedRole })}
                  disabled={isLoading}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={isLoading}
                  onPress={() => {}}
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
                    Sign up with Apple
                  </AppText>
                </TouchableOpacity>

                <View style={styles.footer}>
                  <AppText variant="muted">Have an account? </AppText>
                  <TouchableOpacity
                    onPress={() => navigation.navigate(ROUTES.LOGIN)}
                  >
                    <AppText variant="muted" color={darkTheme.colors.accent}>
                      Sign In
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        visible={isTermsVisible}
        transparent
        animationType="none"
        onRequestClose={closeTermsSheet}
      >
        <Pressable style={styles.termsBackdrop} onPress={closeTermsSheet}>
          <Pressable onPress={() => {}} style={styles.termsSheetWrap}>
            <Animated.View
              style={[
                styles.termsSheet,
                {
                  height: screenHeight * TERMS_SHEET_HEIGHT_RATIO,
                  transform: [{ translateY: termsTranslateY }],
                },
              ]}
            >
              <View style={styles.termsHeader}>
                <View />
                <TouchableOpacity
                  onPress={closeTermsSheet}
                  hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                >
                  <AppText style={styles.closeText}>x</AppText>
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.termsBody}
                showsVerticalScrollIndicator={false}
              >
                <AppText style={styles.termsSheetTitle}>
                  Terms and Conditions
                </AppText>
                {TERMS_SIGNUP_SUMMARY.map(section => (
                  <View key={section.title} style={styles.termsSection}>
                    <AppText style={styles.termsSectionTitle}>
                      {section.title}
                    </AppText>
                    <AppText style={styles.termsSectionBody}>
                      {section.body}
                    </AppText>
                  </View>
                ))}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    closeTermsSheet();
                    navigation.navigate(ROUTES.PRIVACY_POLICY, {
                      documentType: 'terms',
                    });
                  }}
                >
                  <AppText style={styles.termsOpenFullLink}>
                    Open full legal document
                  </AppText>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </Pressable>
        </Pressable>
      </Modal>
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
    marginBottom: darkTheme.spacing.xs,
  },
  logoImage: {
    width: 240,
    height: 90,
  },
  heading: {
    fontSize: darkTheme.typography.fontSizes.xl,
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.xl,
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
  rulesWrap: {
    marginTop: -darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
    rowGap: darkTheme.spacing.xs,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: darkTheme.spacing.xs,
  },
  ruleText: { fontSize: darkTheme.typography.fontSizes.sm },
  ruleTextSuccess: { color: SUCCESS_COLOR },
  ruleTextError: { color: ERROR_COLOR },
  errorText: {
    color: ERROR_COLOR,
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
  acceptTermsRow: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  acceptTermsCheckbox: {
    marginRight: darkTheme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptTermsCheckboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: darkTheme.colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptTermsCheckboxBoxActive: {
    backgroundColor: darkTheme.colors.accent,
    borderColor: darkTheme.colors.accent,
  },
  termsLink: {
    color: darkTheme.colors.accent,
    textDecorationLine: 'none',
  },
  footer: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  termsSheetWrap: {
    width: '100%',
  },
  termsSheet: {
    width: '100%',
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: darkTheme.radius.xl,
    borderTopRightRadius: darkTheme.radius.xl,
    paddingHorizontal: darkTheme.spacing.xl,
    paddingTop: darkTheme.spacing.md,
    paddingBottom: darkTheme.spacing.lg,
  },
  termsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeText: {
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
  termsBody: {
    flex: 1,
    paddingTop: darkTheme.spacing.md,
  },
  termsSheetTitle: {
    color: darkTheme.colors.text,
    fontSize: darkTheme.typography.fontSizes.lg,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: darkTheme.spacing.sm,
  },
  termsSection: {
    marginBottom: darkTheme.spacing.md,
  },
  termsSectionTitle: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 4,
  },
  termsSectionBody: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: darkTheme.typography.fontSizes.sm,
    lineHeight: 20,
  },
  termsOpenFullLink: {
    color: darkTheme.colors.accent,
    fontSize: darkTheme.typography.fontSizes.sm,
    textDecorationLine: 'underline',
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
  },
});

export default SignUpScreen;
