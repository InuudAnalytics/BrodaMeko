import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';

const CallEndedScreen = ({ navigation, route }) => {
  const { role } = useAuth();
  const participantName = String(route?.params?.participantName || 'Contact').trim();
  const duration = String(route?.params?.duration || '00:00').trim();
  const endReason = String(route?.params?.endReason || '').trim();
  const contextType = String(route?.params?.contextType || '').trim().toLowerCase();
  const contextId = String(route?.params?.contextId || '').trim();

  const handleGoHome = () => {
    const safeRole = String(role || '').trim().toUpperCase();
    if (safeRole === ROLES.MECH) {
      navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'home' });
      return;
    }
    if (safeRole === ROLES.SPARE_PARTS_SELLER.toUpperCase()) {
      navigation.navigate(ROUTES.SPARE_PARTS_TABS, { tab: 'home' });
      return;
    }
    navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD);
  };

  const handleBackToContext = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (contextType === 'job') {
      const safeRole = String(role || '').trim().toUpperCase();
      if (safeRole === ROLES.MECH) {
        navigation.navigate(ROUTES.MECH_CHAT);
        return;
      }
      navigation.navigate(ROUTES.CAR_OWNER_CHAT);
      return;
    }

    if (contextType === 'order') {
      const safeRole = String(role || '').trim().toUpperCase();
      if (safeRole === ROLES.SPARE_PARTS_SELLER.toUpperCase()) {
        navigation.navigate(ROUTES.SPARE_PARTS_ORDERS);
        return;
      }
      if (safeRole === ROLES.MECH) {
        navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'marketplace' });
        return;
      }
      navigation.navigate(ROUTES.CAR_OWNER_MARKETPLACE, contextId ? { orderId: contextId } : undefined);
      return;
    }

    handleGoHome();
  };

  const backButtonLabel = contextType === 'job' ? 'Back to chat' : 'Back to tracking';

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={44} color="#7CF0A6" strokeWidth={1.8} />
        </View>
        <AppText style={styles.title}>Call ended</AppText>
        <AppText style={styles.subtitle}>{participantName}</AppText>
        <AppText style={styles.duration}>Duration: {duration}</AppText>
        {endReason ? <AppText style={styles.duration}>Reason: {endReason}</AppText> : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <AppButton
            label={backButtonLabel}
            onPress={handleBackToContext}
            style={styles.footerButton}
            textStyle={styles.footerButtonText}
          />
          <AppButton
            label="Go to home"
            onPress={handleGoHome}
            style={styles.footerButton}
            textStyle={styles.footerButtonText}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 18,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124,240,166,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 15,
    lineHeight: 20,
  },
  duration: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.56)',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingBottom: 28,
  },
  footerRow: {
    flexDirection: 'row',
    columnGap: 10,
  },
  footerButton: {
    flex: 1,
    minHeight: 44,
  },
  footerButtonText: {
    fontSize: 13,
    lineHeight: 16,
  },
});

export default CallEndedScreen;
