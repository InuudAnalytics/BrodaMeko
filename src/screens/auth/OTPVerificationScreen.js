import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CancelCircleIcon, UserSettings01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import {
  resendOtp as resendOtpService,
  verifyConfirmContact as verifyConfirmContactService,
  verifyOtp as verifyOtpService,
} from '../../services/auth.service';
import { darkTheme } from '../../theme';
import { ROUTES, useKeyboardLift } from '../../utils';

const OTP_LENGTH = 6;
const MAX_OTP_ATTEMPTS = 3;

const OTPVerificationScreen = ({ route, navigation }) => {
  const { verifyOtp, resendOtp, updateUserData, error, clearError, pendingVerification } = useAuth();
  const { targetRef, animatedStyle } = useKeyboardLift({ extraOffset: darkTheme.spacing.sm });

  const routeParams = route.params || {};
  const flow = String(routeParams.flow || 'signup').trim();
  const isAddContactFlow = flow === 'add_contact';
  const method = isAddContactFlow
    ? (routeParams.contactType === 'email' ? 'email' : 'phone')
    : (routeParams.method || pendingVerification?.method || 'phone');
  const destination = routeParams.destination || pendingVerification?.email || pendingVerification?.phoneNumber || '';
  const initialInfo = String(routeParams.info || '').trim();

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [localError, setLocalError] = useState('');
  const [info, setInfo] = useState(initialInfo);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const inputRefs = useRef([]);
  const redirectTimerRef = useRef(null);

  const otpValue = useMemo(() => otp.join(''), [otp]);
  const mergedError = localError || error;

  const clearFeedback = () => {
    if (isLockedOut) {
      return;
    }

    if (localError) {
      setLocalError('');
    }

    if (error) {
      clearError();
    }

    if (info) {
      setInfo('');
    }
  };

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const fillFromIndex = (rawText, startIndex) => {
    const digits = String(rawText || '').replace(/\D/g, '');

    if (!digits) {
      const nextOtp = [...otp];
      nextOtp[startIndex] = '';
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    let cursor = startIndex;

    for (let i = 0; i < digits.length && cursor < OTP_LENGTH; i += 1) {
      nextOtp[cursor] = digits[i];
      cursor += 1;
    }

    setOtp(nextOtp);

    if (cursor < OTP_LENGTH) {
      inputRefs.current[cursor]?.focus();
    } else {
      inputRefs.current[OTP_LENGTH - 1]?.blur();
      Keyboard.dismiss();
    }
  };

  const setDigit = (value, index) => {
    clearFeedback();
    fillFromIndex(value, index);
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    const nextOtp = [...otp];

    if (nextOtp[index]) {
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    if (index > 0) {
      nextOtp[index - 1] = '';
      setOtp(nextOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (isVerifying || isResending || isLockedOut) {
      return;
    }

    if (otpValue.length !== OTP_LENGTH || otp.some((digit) => !digit)) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    setLocalError('');
    setIsVerifying(true);

    try {
      if (isAddContactFlow) {
        const response = await verifyConfirmContactService({ otp: otpValue });
        const ok = response?.success !== false;

        if (!ok) {
          const nextAttempts = failedAttempts + 1;
          setFailedAttempts(nextAttempts);
          setLocalError(`Incorrect OTP. Attempt ${nextAttempts} of ${MAX_OTP_ATTEMPTS}.`);
          return;
        }

        if (method === 'email') {
          await updateUserData({ email: destination });
        } else {
          await updateUserData({
            phone: destination,
            phoneNumber: destination,
            phone_number: destination,
          });
        }

        navigation.replace(ROUTES.CAR_OWNER_ADD_CONTACT_SUCCESS, {
          contactType: method,
          contactValue: destination,
        });
        return;
      }

      const ok = await verifyOtp({ otp: otpValue });

      if (!ok) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= MAX_OTP_ATTEMPTS) {
          setIsLockedOut(true);
          setInfo('');
          setLocalError(
            'You have tried 3 times and failed. You will be sent back to Sign Up to start again.',
          );

          if (redirectTimerRef.current) {
            clearTimeout(redirectTimerRef.current);
          }

          redirectTimerRef.current = setTimeout(() => {
            navigation.navigate(ROUTES.SIGN_UP, pendingVerification?.role ? { role: pendingVerification.role } : undefined);
          }, 1600);
          return;
        }

        setLocalError(`Incorrect OTP. Attempt ${nextAttempts} of ${MAX_OTP_ATTEMPTS}.`);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || isVerifying || isLockedOut) {
      return;
    }

    setLocalError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setIsResending(true);

    try {
      const ok = isAddContactFlow
        ? await (async () => {
            await resendOtpService({
              email: method === 'email' ? destination : '',
              phoneNumber: method === 'phone' ? destination : '',
            });
            return true;
          })()
        : await resendOtp();

      if (ok) {
        setInfo('OTP resent successfully.');
        requestAnimationFrame(() => {
          inputRefs.current[0]?.focus();
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleCancel = () => {
    if (isAddContactFlow) {
      navigation.goBack();
      return;
    }

    navigation.navigate(ROUTES.SIGN_UP, pendingVerification?.role ? { role: pendingVerification.role } : undefined);
  };

  const destinationLabel = destination || `your ${method}`;

  return (
    <ScreenContainer style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <TouchableOpacity style={styles.closeButton} onPress={handleCancel} disabled={isVerifying || isResending}>
          <HugeiconsIcon icon={CancelCircleIcon} size={26} color="rgba(17,17,51,0.45)" strokeWidth={1.8} />
        </TouchableOpacity>

        <View style={styles.iconBadge}>
          <HugeiconsIcon icon={UserSettings01Icon} size={20} color="rgba(17,17,51,0.7)" strokeWidth={1.9} />
        </View>

        <AppText variant="subtitle" style={styles.title}>
          Enter verification code
        </AppText>

        <AppText variant="muted" style={styles.subtitle}>
          Verification code has been sent
        </AppText>
        <AppText variant="muted" style={styles.subtitle}>
          to {destinationLabel}
        </AppText>

        <View ref={targetRef} style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={`otp-${index}`}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => setDigit(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              editable={!isLockedOut}
              style={styles.otpInput}
              selectionColor={darkTheme.colors.accent}
              contextMenuHidden={false}
            />
          ))}
        </View>

        {mergedError ? <AppText style={styles.errorText}>{mergedError}</AppText> : null}
        {/* {info ? <AppText style={styles.infoText}>{info}</AppText> : null} */}

        <View style={styles.verifyButtonWrap}>
          <AppButton
            label={isVerifying ? 'Verifying...' : 'Verify'}
            onPress={handleVerify}
            disabled={isVerifying || isResending || isLockedOut}
          />
        </View>

        <View style={styles.resendRow}>
          <AppText variant="muted" style={styles.resendText}>
            Didn't receive the code?{' '}
          </AppText>
          <TouchableOpacity onPress={handleResend} disabled={isResending || isVerifying || isLockedOut}>
            <AppText variant="muted" color={darkTheme.colors.background} style={styles.resendLink}>
              {isResending ? 'Resending...' : 'Resend code'}
            </AppText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#F3F3F3',
    borderRadius: 14,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingTop: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: darkTheme.spacing.sm,
    right: darkTheme.spacing.sm,
    zIndex: 2,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    backgroundColor: 'rgba(17,17,51,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.sm,
  },
  title: {
    color: '#111133',
    marginBottom: darkTheme.spacing.xs,
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  subtitle: {
    color: 'rgba(17,17,51,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    columnGap: darkTheme.spacing.xs,
    marginTop: darkTheme.spacing.lg,
  },
  otpInput: {
    width: 38,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(17,17,51,0.18)',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 18,
    color: '#111133',
    fontWeight: darkTheme.typography.fontWeights.semibold,
    paddingVertical: 0,
  },
  errorText: {
    color: '#FF6B7A',
    fontSize: darkTheme.typography.fontSizes.xs,
    lineHeight: 16,
    marginTop: darkTheme.spacing.sm,
  },
  infoText: {
    color: '#40C67A',
    marginTop: darkTheme.spacing.sm,
  },
  verifyButtonWrap: {
    marginTop: darkTheme.spacing.lg,
  },
  resendRow: {
    marginTop: darkTheme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  resendText: {
    color: 'rgba(17,17,51,0.7)',
  },
  resendLink: {
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
});

export default OTPVerificationScreen;
