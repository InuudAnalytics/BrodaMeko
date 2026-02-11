import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppText, ScreenContainer } from '../../components';
import { darkTheme } from '../../theme';
import { ROUTES } from '../../utils';

const OTPVerificationScreen = ({ route, navigation }) => {
  const { method, destination } = route.params || {};

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <AppText variant="title" style={styles.heading}>
          OTP Verification
        </AppText>

        <AppText variant="body" style={styles.text}>
          Method: {method || 'unknown'}
        </AppText>

        <AppText variant="muted" style={styles.text}>
          Destination: {destination || 'not provided'}
        </AppText>

        <AppText variant="muted" style={styles.hint}>
          Placeholder screen. Real OTP flow will be added later.
        </AppText>

        <AppButton label="Back to Sign In" onPress={() => navigation.navigate(ROUTES.LOGIN)} />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  heading: {
    color: darkTheme.colors.text,
    marginBottom: darkTheme.spacing.md,
  },
  text: {
    marginBottom: darkTheme.spacing.xs,
  },
  hint: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.md,
    marginBottom: darkTheme.spacing.xl,
  },
});

export default OTPVerificationScreen;
