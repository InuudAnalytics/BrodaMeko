import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const REDIRECT_DELAY_MS = 2530;

const CheckIcon = () => {
  return (
    <View style={styles.checkOuter}>
      <View style={styles.checkInner}>
        <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 12.8L10.1 16.4L18 7.8"
            stroke="#FFFFFF"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </View>
  );
};

const PaymentSuccessScreen = ({ navigation, route }) => {
  const payeeName = route?.params?.payeeName || 'Saheed Niyi';
  const nextRoute = route?.params?.nextRoute || ROUTES.CAR_OWNER_DASHBOARD;
  const nextParams = route?.params?.nextParams;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(nextRoute, nextParams);
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [navigation, nextParams, nextRoute]);

  return (
    <ScreenContainer padded={false} edges={['left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.card}>
        <CheckIcon />

        <AppText variant="subtitle" style={styles.title}>
          Payment has been successfully completed
        </AppText>

        <AppText variant="muted" style={styles.subtitle}>
          {payeeName} has been credited
        </AppText>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: darkTheme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: darkTheme.spacing.lg,
    paddingVertical: darkTheme.spacing.xl,
    alignItems: 'center',
  },
  checkOuter: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#78C10E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: darkTheme.spacing.lg,
  },
  checkInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#89E315',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#3B3B3B',
    textAlign: 'center',
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: darkTheme.spacing.xs,
  },
  subtitle: {
    color: '#A4A4A4',
    textAlign: 'center',
    fontSize: darkTheme.typography.fontSizes.md,
  },
});

export default PaymentSuccessScreen;
