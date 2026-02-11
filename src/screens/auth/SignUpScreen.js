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
import {
  AppButton,
  AppInput,
  AppText,
  DividerOr,
  GoogleButton,
  LogoLockup,
  ScreenContainer,
} from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const ERROR_COLOR = '#FF7B8A';

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

const SignUpScreen = ({ navigation }) => {
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

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    navigation.navigate(ROUTES.OTP_VERIFICATION, {
      method,
      destination: destinationPreview,
    });
  };

  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']}>
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
              <View style={styles.segmentWrap}>
                <TouchableOpacity
                  style={[styles.segment, method === METHODS.PHONE ? styles.segmentActive : null]}
                  onPress={() => {
                    setMethod(METHODS.PHONE);
                    resetError();
                  }}
                >
                  <AppText
                    variant="muted"
                    style={method === METHODS.PHONE ? styles.segmentTextActive : styles.segmentText}
                  >
                    Phone Number
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.segment, method === METHODS.EMAIL ? styles.segmentActive : null]}
                  onPress={() => {
                    setMethod(METHODS.EMAIL);
                    resetError();
                  }}
                >
                  <AppText
                    variant="muted"
                    style={method === METHODS.EMAIL ? styles.segmentTextActive : styles.segmentText}
                  >
                    Email Address
                  </AppText>
                </TouchableOpacity>
              </View>

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
    marginTop: darkTheme.spacing.sm,
    marginBottom: darkTheme.spacing.lg,
  },
  logoScale: {
    transform: [{ scale: 0.35 }],
  },
  heading: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.lg,
  },
  form: {
    marginTop: darkTheme.spacing.xs,
  },
  segmentWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    borderRadius: darkTheme.radius.lg,
    overflow: 'hidden',
    marginBottom: darkTheme.spacing.md,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  segmentText: {
    color: darkTheme.colors.muted,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  segmentTextActive: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  toggleText: {
    color: darkTheme.colors.muted,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  errorText: {
    color: ERROR_COLOR,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
  },
  primaryCta: {
    marginTop: darkTheme.spacing.sm,
  },
  footer: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SignUpScreen;
