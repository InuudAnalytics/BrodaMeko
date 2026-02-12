import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const BellIcon = ({ color }) => {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4a4 4 0 0 0-4 4v2.2c0 .9-.3 1.8-.9 2.5L5.7 14.5c-.6.7-.2 1.7.7 1.7h11.2c.9 0 1.3-1 .7-1.7l-1.4-1.8a4 4 0 0 1-.9-2.5V8a4 4 0 0 0-4-4Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.2 18a2 2 0 0 0 3.6 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const ChevronRightIcon = ({ color }) => {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6L15 12L9 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const HelpActionRow = ({ label, onPress }) => {
  return (
    <TouchableOpacity style={styles.helpRow} activeOpacity={0.9} onPress={onPress}>
      <AppText style={styles.helpRowText}>{label}</AppText>
      <ChevronRightIcon color="#1A1A1A" />
    </TouchableOpacity>
  );
};

const DashboardScreen = ({ navigation }) => {
  const handleTabPress = (routeName) => {
    if (routeName === ROUTES.CAR_OWNER_DASHBOARD) {
      return;
    }

    navigation.navigate(routeName);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.mapBackdrop}>
        <View style={styles.mapLineA} />
        <View style={styles.mapLineB} />
        <View style={styles.mapLineC} />
        <View style={styles.routeLine} />
        <View style={styles.pin} />

        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.avatarWrap}
            onPress={() => navigation.navigate(ROUTES.CAR_OWNER_PROFILE)}
          >
            <View style={styles.avatar}>
              <AppText style={styles.avatarText}>D</AppText>
            </View>
            <View>
              <AppText variant="body" style={styles.greeting}>
                Good morning Danclem
              </AppText>
              <AppText variant="muted" style={styles.greetingSub}>
                Ready for the road?
              </AppText>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.85}
            onPress={() => Alert.alert('Notifications', 'Notifications page coming soon.')}
          >
            <BellIcon color={darkTheme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />

        <AppText variant="title" style={styles.sheetTitle}>
          Need help now?
        </AppText>

        <AppText variant="muted" style={styles.sheetSubtitle}>
          Our certified mechanics are nearby
        </AppText>

        <HelpActionRow
          label="I know the issues"
          onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REPORT_ISSUE)}
        />

        <HelpActionRow
          label="Diagnose my car"
          onPress={() => navigation.navigate(ROUTES.CAR_OWNER_REQUEST_DIAGNOSTICS)}
        />
      </View>

      <AppBottomNav activeTab={ROUTES.CAR_OWNER_DASHBOARD} onTabPress={handleTabPress} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  mapBackdrop: {
    flex: 1,
    backgroundColor: '#2B2B31',
    overflow: 'hidden',
  },
  mapLineA: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 420,
    height: 6,
    backgroundColor: '#505057',
    transform: [{ rotate: '-35deg' }],
    opacity: 0.45,
  },
  mapLineB: {
    position: 'absolute',
    top: 180,
    left: -40,
    width: 460,
    height: 6,
    backgroundColor: '#4A4A51',
    transform: [{ rotate: '12deg' }],
    opacity: 0.4,
  },
  mapLineC: {
    position: 'absolute',
    bottom: 180,
    left: 70,
    width: 340,
    height: 6,
    backgroundColor: '#48484F',
    transform: [{ rotate: '-22deg' }],
    opacity: 0.35,
  },
  routeLine: {
    position: 'absolute',
    top: 210,
    left: 58,
    width: 16,
    height: 300,
    borderRadius: 8,
    backgroundColor: '#2FAEFC',
  },
  pin: {
    position: 'absolute',
    top: 190,
    left: 49,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF2D2D',
    borderWidth: 4,
    borderColor: '#2B2B31',
  },
  topBar: {
    marginTop: darkTheme.spacing.xl,
    paddingHorizontal: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: darkTheme.spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF7B4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  greeting: {
    color: darkTheme.colors.text,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  greetingSub: {
    color: darkTheme.colors.muted,
    marginTop: darkTheme.spacing.xxs,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bottomSheet: {
    backgroundColor: darkTheme.colors.background,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    marginTop: -18,
    paddingTop: darkTheme.spacing.md,
    paddingHorizontal: darkTheme.spacing.xl,
    paddingBottom: darkTheme.spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 76,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginBottom: darkTheme.spacing.md,
  },
  sheetTitle: {
    color: darkTheme.colors.text,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: darkTheme.typography.fontWeights.bold,
  },
  sheetSubtitle: {
    marginTop: darkTheme.spacing.xs,
    textAlign: 'center',
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '300',
    marginBottom: darkTheme.spacing.lg,
  },
  helpRow: {
    minHeight: 56,
    borderRadius: darkTheme.radius.lg,
    backgroundColor: darkTheme.colors.accent,
    paddingHorizontal: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: darkTheme.spacing.md,
  },
  helpRowText: {
    color: '#1A1A1A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.regular,
  },
});

export default DashboardScreen;
