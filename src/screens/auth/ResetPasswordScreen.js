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
import {
  ArrowLeft01Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  Menu01Icon,
  ViewIcon,
  ViewOffIcon,
} from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppInput,
  AppText,
  ScreenContainer,
  SuccessModal,
} from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';
import { ROUTES, useKeyboardLift, validatePasswordRules } from '../../utils';

const ERROR_COLOR = '#FF7B8A';
const SUCCESS_COLOR = '#40C67A';
const NEUTRAL_COLOR = 'rgba(255,255,255,0.45)';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { resetPasswordWithOtp, isLoading, error, clearError } = useAuth();
  const { targetRef, animatedStyle } = useKeyboardLift({
    extraOffset: darkTheme.spacing.sm,
  });
  const { method = 'email', destination = '', otp: initialOtp = '' } = route.params || {};

  const [otp, setOtp] = useState(String(initialOtp || ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [showRestart, setShowRestart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const mergedError = localError || error;
  const passwordChecks = useMemo(
    () => validatePasswordRules(newPassword),
    [newPassword],
  );
  const lengthValid = newPassword.length >= 8 && newPassword.length <= 12;
  const isPasswordValid =
    lengthValid && passwordChecks.hasNumberOrSpecialCharacter;

  const getRuleState = isMet =>
    isMet ? 'success' : mergedError ? 'error' : 'neutral';

  const clearAllErrors = () => {
    if (localError) setLocalError('');
    if (error) clearError();
    if (showRestart) setShowRestart(false);
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
          style={[
            styles.ruleText,
            isSuccess ? styles.ruleSuccess : null,
            isError ? styles.ruleError : null,
          ]}
        >
          {label}
        </AppText>
      </View>
    );
  };

  const handleReset = async () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setLocalError('Please complete all fields.');
      return;
    }

    if (otp.trim().length !== 6) {
      setLocalError('OTP must be 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (!isPasswordValid) {
      setLocalError('Password does not meet all requirements.');
      return;
    }

    setLocalError('');
    const ok = await resetPasswordWithOtp({
      email: method === 'email' ? destination : '',
      phoneNumber: method === 'phone' ? destination : '',
      otp: otp.trim(),
      newPassword,
      confirmPassword,
    });

    if (ok) {
      setShowSuccess(true);
      return;
    }

    setShowRestart(true);
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
              <View style={styles.headerRow}>
                <TouchableOpacity
                  style={styles.headerIcon}
                  activeOpacity={0.85}
                  onPress={() => navigation.replace(ROUTES.LOGIN)}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft01Icon}
                    size={20}
                    color={darkTheme.colors.text}
                    strokeWidth={2.1}
                  />
                </TouchableOpacity>
                <View style={styles.headerSpacer} />
                {/* <TouchableOpacity
                  style={styles.headerIcon}
                  activeOpacity={0.85}
                >
                  <HugeiconsIcon
                    icon={Menu01Icon}
                    size={20}
                    color={darkTheme.colors.text}
                    strokeWidth={2.1}
                  />
                </TouchableOpacity> */}
              </View>

              <AppText variant="title" style={styles.heading}>
                Enter your new password
              </AppText>
              <AppText variant="muted" style={styles.subtitle}>
                Enter your new password to continue your progress.
              </AppText>

              <View style={styles.form}>
                <AppInput
                  label="OTP"
                  placeholder="ABC123"
                  value={otp}
                  onChangeText={text => {
                    setOtp(
                      text
                        .replace(/[^a-z0-9]/gi, '')
                        .toUpperCase()
                        .slice(0, 6),
                    );
                    clearAllErrors();
                  }}
                  keyboardType="default"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />

                <AppInput
                  label="Password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChangeText={text => {
                    setNewPassword(text);
                    clearAllErrors();
                  }}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  right={
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(prev => !prev)}
                    >
                      <HugeiconsIcon
                        icon={showNewPassword ? ViewOffIcon : ViewIcon}
                        size={20}
                        color={darkTheme.colors.muted}
                        strokeWidth={1.9}
                      />
                    </TouchableOpacity>
                  }
                />

                <View style={styles.rulesWrap}>
                  {renderRule(
                    'Password should contain 8-12 characters',
                    lengthValid,
                  )}
                  {renderRule(
                    'Password should contain at least one symbol/number',
                    passwordChecks.hasNumberOrSpecialCharacter,
                  )}
                </View>

                <AppInput
                  label="Confirm password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChangeText={text => {
                    setConfirmPassword(text);
                    clearAllErrors();
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

                {mergedError ? (
                  <AppText style={styles.errorText}>{mergedError}</AppText>
                ) : null}
                {showRestart ? (
                  <TouchableOpacity style={styles.restartLink} onPress={() => navigation.replace(ROUTES.FORGOT_PASSWORD)}>
                    <AppText variant="muted" color={darkTheme.colors.accent}>
                      Start again
                    </AppText>
                  </TouchableOpacity>
                ) : null}

                <View style={styles.primaryCta}>
                  <AppButton
                    label={isLoading ? 'Resetting...' : 'Reset password'}
                    onPress={handleReset}
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
              </View>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <SuccessModal
        visible={showSuccess}
        title="Password successfully updated"
        message="Your password has been updated, would you like to save or proceed?"
        onDismiss={() => {
          setShowSuccess(false);
          navigation.replace(ROUTES.LOGIN);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: { flex: 1 },
  scrollContent: {
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.xxl,
  },
  headerRow: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { flex: 1 },
  heading: {
    fontSize: darkTheme.typography.fontSizes.x,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    color: darkTheme.colors.text,
    marginTop: darkTheme.spacing.lg,
    marginBottom: darkTheme.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: darkTheme.typography.fontSizes.sm,
    color: darkTheme.colors.muted,
    marginBottom: darkTheme.spacing.lg,
    textAlign: 'center',
  },
  form: { marginTop: darkTheme.spacing.xs },
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
    fontSize: darkTheme.typography.fontSizes.xs,
    color: NEUTRAL_COLOR,
  },
  ruleSuccess: { color: SUCCESS_COLOR },
  ruleError: { color: ERROR_COLOR },
  ruleNeutral: { color: NEUTRAL_COLOR },
  errorText: {
    color: ERROR_COLOR,
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.sm,
  },
  restartLink: {
    alignItems: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  primaryCta: { marginTop: darkTheme.spacing.md },
});

export default ResetPasswordScreen;
