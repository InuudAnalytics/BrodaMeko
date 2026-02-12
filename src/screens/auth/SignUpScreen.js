import React, { useMemo, useState } from 'react';
import {
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
import { CancelCircleIcon, CheckmarkCircle02Icon, RadioButtonIcon } from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppInput,
  AppText,
  AuthMethodToggle,
  DividerOr,
  GoogleButton,
  LogoLockup,
  ScreenContainer,
} from '../../components';
import { darkTheme } from '../../theme';
import { ROLES, ROUTES, validatePasswordRules } from '../../utils';

const ERROR_COLOR = '#FF7B8A';
const SUCCESS_COLOR = '#40C67A';
const NEUTRAL_COLOR = 'rgba(255,255,255,0.45)';

const METHODS = {
  PHONE: 'phone',
  EMAIL: 'email',
};

const maskPhone = (value) => {
  const raw = String(value || '').replace(/\D/g, '');

  if (raw.length <= 7) {
    return raw;
  }

  const start = raw.slice(0, 4);
  const end = raw.slice(-3);
  const hidden = '*'.repeat(Math.max(0, raw.length - 7));

  return `${start}${hidden}${end}`;
};

const maskEmail = (value) => {
  const email = String(value || '').trim();
  const [name, domain] = email.split('@');

  if (!name || !domain) {
    return email;
  }

  if (name.length <= 3) {
    return `${name[0] || ''}***@${domain}`;
  }

  return `${name.slice(0, 3)}***@${domain}`;
};

const SignUpScreen = ({ navigation, route }) => {
  const selectedRole = route?.params?.role || ROLES.CAR_OWNER;
  const [method, setMethod] = useState(METHODS.PHONE);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const destinationPreview = useMemo(() => {
    return method === METHODS.PHONE ? maskPhone(phone) : maskEmail(email);
  }, [method, phone, email]);

  const passwordChecks = useMemo(() => validatePasswordRules(password), [password]);
  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasNumberOrSpecialCharacter;

  const getRuleState = (isMet) => {
    if (isMet) {
      return 'success';
    }

    return error ? 'error' : 'neutral';
  };

  const resetError = () => {
    if (error) {
      setError('');
    }
  };

  const handleSignUp = () => {
    if (!fullName.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (method === METHODS.PHONE && !phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    if (method === METHODS.EMAIL && !email.trim()) {
      setError('Email address is required.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');

    navigation.navigate(ROUTES.OTP_VERIFICATION, {
      method,
      destination: destinationPreview,
      role: selectedRole,
      signupPayload: {
        fullName: fullName.trim(),
        email: method === METHODS.EMAIL ? email.trim() : '',
        phone: method === METHODS.PHONE ? phone.trim() : '',
        password,
        role: selectedRole,
      },
    });
  };

  const renderRule = (label, isMet) => {
    const state = getRuleState(isMet);
    const isSuccess = state === 'success';
    const isError = state === 'error';
    const iconColor = isSuccess ? SUCCESS_COLOR : isError ? ERROR_COLOR : NEUTRAL_COLOR;

    return (
      <View style={styles.ruleRow} key={label}>
        <HugeiconsIcon
          icon={isSuccess ? CheckmarkCircle02Icon : isError ? CancelCircleIcon : RadioButtonIcon}
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
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']}>
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
            <View style={styles.logoWrap}>
              <LogoLockup style={styles.logoScale} markSize={44} stacked />
            </View>

            <AppText variant="title" style={styles.heading}>
              SIGN UP
            </AppText>
            <AppText variant="muted" style={styles.subtitle}>
              Are you ready for the road?
            </AppText>

            <View style={styles.form}>
              <AuthMethodToggle
                initialValue={METHODS.PHONE}
                onChange={(value) => {
                  setMethod(value);
                  resetError();
                }}
              />

              <AppInput
                label="Full name"
                placeholder="Toluwalase Daniel"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  resetError();
                }}
                autoCapitalize="words"
              />

              {method === METHODS.EMAIL ? (
                <AppInput
                  label="Email Address"
                  placeholder="Youremail.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    resetError();
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <AppInput
                  label="Phone number"
                  placeholder="09075156578"
                  value={phone}
                  onChangeText={(text) => {
                    setPhone(text);
                    resetError();
                  }}
                  keyboardType="phone-pad"
                />
              )}

              <AppInput
                label="Password"
                placeholder="....."
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  resetError();
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                right={
                  <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                    <AppText variant="muted" style={styles.toggleText}>
                      {showPassword ? 'Hide' : 'Show'}
                    </AppText>
                  </TouchableOpacity>
                }
              />

              <View style={styles.rulesWrap}>
                {renderRule('At least 8 characters', passwordChecks.minLength)}
                {renderRule('Contains a number or special character', passwordChecks.hasNumberOrSpecialCharacter)}
              </View>

              <AppInput
                label="Confirm password"
                placeholder="....."
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  resetError();
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                right={
                  <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                    <AppText variant="muted" style={styles.toggleText}>
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </AppText>
                  </TouchableOpacity>
                }
              />

              {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

              <View style={styles.primaryCta}>
                <AppButton label="Sign Up" onPress={handleSignUp} />
              </View>

              <DividerOr />

              <GoogleButton label="Sign up with Google" onPress={() => {}} />

              <View style={styles.footer}>
                <AppText variant="muted">Have an account? </AppText>
                <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
                  <AppText variant="muted" color={darkTheme.colors.accent}>
                    Sign In
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xl,
  },
  logoScale: {
    transform: [{ scale: 1.4 }],
  },
  heading: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.xl,
  },
  form: {
    marginTop: darkTheme.spacing.xs,
  },
  toggleText: {
    color: darkTheme.colors.muted,
    fontWeight: darkTheme.typography.fontWeights.medium,
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
  ruleText: {
    fontSize: darkTheme.typography.fontSizes.sm,
  },
  ruleTextSuccess: {
    color: SUCCESS_COLOR,
  },
  ruleTextError: {
    color: ERROR_COLOR,
  },
  errorText: {
    color: ERROR_COLOR,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
  },
  primaryCta: {
    marginTop: darkTheme.spacing.md,
  },
  footer: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignUpScreen;

