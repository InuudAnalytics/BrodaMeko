import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CancelCircleIcon, CheckmarkCircle02Icon, RadioButtonIcon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppInput,
  AppText,
  AuthMethodToggle,
  DividerOr,
  GoogleButton,
  LogoLockup,
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

const ERROR_COLOR = '#FF7B8A';
const SUCCESS_COLOR = '#40C67A';
const NEUTRAL_COLOR = 'rgba(255,255,255,0.45)';
const METHODS = { PHONE: 'phone', EMAIL: 'email' };

const maskEmail = (value) => {
  const email = String(value || '').trim();
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  if (name.length <= 3) return `${name[0] || ''}***@${domain}`;
  return `${name.slice(0, 3)}***@${domain}`;
};

const SignUpScreen = ({ navigation, route }) => {
  const selectedRole = route?.params?.role || ROLES.CAR_OWNER;
  const { signUp, isLoading, error, clearError } = useAuth();
  const { targetRef, animatedStyle } = useKeyboardLift({ extraOffset: darkTheme.spacing.sm });

  const [method, setMethod] = useState(METHODS.PHONE);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const destinationPreview = useMemo(() => {
    return method === METHODS.PHONE ? maskNigerianPhone(phone) : maskEmail(email);
  }, [method, phone, email]);

  const passwordChecks = useMemo(() => validatePasswordRules(password), [password]);
  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasNumberOrSpecialCharacter;
  const mergedError = localError || error;

  const getRuleState = (isMet) => (isMet ? 'success' : mergedError ? 'error' : 'neutral');

  const resetError = () => {
    if (localError) setLocalError('');
    if (error) clearError();
  };

  const handleSignUp = async () => {
    if (!fullName.trim() || !password.trim() || !confirmPassword.trim()) return setLocalError('Please fill in all required fields.');
    if (method === METHODS.PHONE && !isValidNigerianPhoneDigits(phone)) return setLocalError('Phone number must be exactly 10 digits.');
    if (method === METHODS.EMAIL && !email.trim()) return setLocalError('Email address is required.');
    if (!isPasswordValid) return setLocalError('Password does not meet all requirements.');
    if (password !== confirmPassword) return setLocalError('Passwords do not match.');

    setLocalError('');
    const result = await signUp({
      fullName: fullName.trim(),
      email: method === METHODS.EMAIL ? email.trim() : '',
      phoneNumber: method === METHODS.PHONE ? withNigerianCountryCode(phone) : '',
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
    const iconColor = isSuccess ? SUCCESS_COLOR : isError ? ERROR_COLOR : NEUTRAL_COLOR;

    return (
      <View style={styles.ruleRow} key={label}>
        <HugeiconsIcon icon={isSuccess ? CheckmarkCircle02Icon : isError ? CancelCircleIcon : RadioButtonIcon} size={18} color={iconColor} strokeWidth={1.9} />
        <AppText variant="muted" style={[styles.ruleText, isSuccess ? styles.ruleTextSuccess : null, isError ? styles.ruleTextError : null]}>
          {label}
        </AppText>
      </View>
    );
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Animated.View ref={targetRef} style={animatedStyle}>
              <View style={styles.logoWrap}>
                <LogoLockup style={styles.logoScale} markSize={44} stacked />
              </View>

              <AppText variant="title" style={styles.heading}>SIGN UP</AppText>
              <AppText variant="muted" style={styles.subtitle}>Are you ready for the road?</AppText>

              <View style={styles.form}>
                <AuthMethodToggle initialValue={METHODS.PHONE} onChange={(value) => { setMethod(value); resetError(); }} />

                <AppInput
                  label="Full name"
                  placeholder="Toluwalase Daniel"
                  value={fullName}
                  onChangeText={(text) => { setFullName(text); resetError(); }}
                  autoCapitalize="words"
                />

                {method === METHODS.EMAIL ? (
                  <AppInput
                    label="Email Address"
                    placeholder="you@email.com"
                    value={email}
                    onChangeText={(text) => { setEmail(text); resetError(); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <NigerianPhoneInput
                    label="Phone number"
                    value={phone}
                    onChangeText={(text) => { setPhone(text); resetError(); }}
                  />
                )}

                <AppInput
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChangeText={(text) => { setPassword(text); resetError(); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
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
                  {renderRule('At least 8 characters', passwordChecks.minLength)}
                  {renderRule('Contains a number or special character', passwordChecks.hasNumberOrSpecialCharacter)}
                </View>

                <AppInput
                  label="Confirm password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); resetError(); }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                      <HugeiconsIcon
                        icon={showConfirmPassword ? ViewOffIcon : ViewIcon}
                        size={20}
                        color={darkTheme.colors.muted}
                        strokeWidth={1.9}
                      />
                    </TouchableOpacity>
                  }
                />

                {mergedError ? <AppText style={styles.errorText}>{mergedError}</AppText> : null}

                <View style={styles.primaryCta}>
                  <AppButton
                    label={isLoading ? 'Signing Up...' : 'Sign Up'}
                    onPress={handleSignUp}
                    disabled={isLoading}
                    left={isLoading ? <ActivityIndicator size="small" color={darkTheme.colors.background} /> : null}
                  />
                </View>

                <DividerOr />
                <GoogleButton label="Sign up with Google" onPress={() => {}} disabled={isLoading} />

                <View style={styles.footer}>
                  <AppText variant="muted">Have an account? </AppText>
                  <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                    <AppText variant="muted" color={darkTheme.colors.accent}>Sign In</AppText>
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
  scrollContent: { paddingHorizontal: darkTheme.spacing.xl, paddingBottom: darkTheme.spacing.xxl },
  logoWrap: { alignItems: 'center', marginTop: darkTheme.spacing.md, marginBottom: darkTheme.spacing.xl },
  logoScale: { transform: [{ scale: 1.4 }] },
  heading: { color: darkTheme.colors.text, marginBottom: darkTheme.spacing.xs },
  subtitle: { color: darkTheme.colors.muted, marginBottom: darkTheme.spacing.xl },
  form: { marginTop: darkTheme.spacing.xs },
  rulesWrap: { marginTop: -darkTheme.spacing.xs, marginBottom: darkTheme.spacing.md, rowGap: darkTheme.spacing.xs },
  ruleRow: { flexDirection: 'row', alignItems: 'center', columnGap: darkTheme.spacing.xs },
  ruleText: { fontSize: darkTheme.typography.fontSizes.sm },
  ruleTextSuccess: { color: SUCCESS_COLOR },
  ruleTextError: { color: ERROR_COLOR },
  errorText: { color: ERROR_COLOR, fontSize: darkTheme.typography.fontSizes.xs, lineHeight: 16, marginTop: darkTheme.spacing.xs, marginBottom: darkTheme.spacing.sm },
  primaryCta: { marginTop: darkTheme.spacing.md },
  footer: { marginTop: darkTheme.spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});

export default SignUpScreen;
