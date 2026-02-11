import React, { useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { useAuth } from '../../context';
import { darkTheme } from '../../theme';

const ERROR_COLOR = '#FF7B8A';
const OTP_LENGTH = 4;

const OTPVerificationScreen = ({ route }) => {
  const { signIn, isLoading } = useAuth();

  const { method = 'phone', destination = '' } = route.params || {};

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');

  const inputRefs = useRef([]);

  const methodLabel = method === 'email' ? 'email address' : 'phone number';

  const otpValue = useMemo(() => otp.join(''), [otp]);

  const setDigit = (value, index) => {
    const numericValue = value.replace(/\D/g, '');
    const nextDigit = numericValue.slice(-1);

    const nextOtp = [...otp];
    nextOtp[index] = nextDigit;
    setOtp(nextOtp);

    if (error) {
      setError('');
    }

    if (nextDigit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key !== 'Backspace') {
      return;
    }

    if (otp[index]) {
      const nextOtp = [...otp];
      nextOtp[index] = '';
      setOtp(nextOtp);
      return;
    }

    if (index > 0) {
      const nextOtp = [...otp];
      nextOtp[index - 1] = '';
      setOtp(nextOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== OTP_LENGTH || otp.some((digit) => !digit)) {
      setError('Please enter the 4-digit verification code.');
      return;
    }

    setError('');

    // Placeholder flow for now: once OTP length is valid, mark user as signed in.
    await signIn({ email: 'otp@brodameko.local', password: '1234' });
  };

  const handleResend = () => {
    Alert.alert('Resend code', 'A new verification code will be sent (placeholder).');
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.card}>
        <AppText variant="subtitle" style={styles.title}>
          Enter verification code
        </AppText>

        <AppText variant="muted" style={styles.subtitle}>
          Verification code has been sent to your {methodLabel}
        </AppText>

        {destination ? (
          <AppText variant="muted" style={styles.destination}>
            {destination}
          </AppText>
        ) : null}

        <View style={styles.otpRow}>
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
              maxLength={1}
              style={styles.otpInput}
              selectionColor={darkTheme.colors.accent}
            />
          ))}
        </View>

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

        <View style={styles.verifyButtonWrap}>
          <AppButton
            label={isLoading ? 'Verifying...' : 'Verify'}
            onPress={handleVerify}
            disabled={isLoading}
          />
        </View>

        <View style={styles.resendRow}>
          <AppText variant="muted" style={styles.resendText}>
            Didn't receive the code?{' '}
          </AppText>
          <TouchableOpacity onPress={handleResend}>
            <AppText variant="muted" color={darkTheme.colors.accent} style={styles.resendLink}>
              Resend code
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#FFFFFF',
    borderRadius: darkTheme.radius.lg,
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.xl,
  },
  title: {
    color: '#111133',
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: 'rgba(17,17,51,0.75)',
  },
  destination: {
    color: 'rgba(17,17,51,0.75)',
    marginTop: darkTheme.spacing.xs,
    marginBottom: darkTheme.spacing.md,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: darkTheme.spacing.lg,
  },
  otpInput: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(17,17,51,0.18)',
    borderRadius: darkTheme.radius.md,
    textAlign: 'center',
    fontSize: 22,
    color: '#111133',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  errorText: {
    color: ERROR_COLOR,
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
