import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { RepeatIcon, User02Icon, Wallet01Icon } from '@hugeicons/core-free-icons';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';
import AppText from './AppText';

const TABS = [
  { key: ROUTES.CAR_OWNER_DASHBOARD, label: 'Home', icon: 'home' },
  { key: ROUTES.CAR_OWNER_HISTORY, label: 'History', icon: RepeatIcon },
  { key: ROUTES.CAR_OWNER_REWARDS, label: 'Wallet', icon: Wallet01Icon },
  { key: ROUTES.CAR_OWNER_PROFILE, label: 'Profile', icon: User02Icon },
];

const HomeIcon = ({ color }) => {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5L12 3L21 10.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10V20H18V10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const AppBottomNav = ({ activeTab, onTabPress, style }) => {
  return (
    <View style={[styles.container, style]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const color = isActive ? darkTheme.colors.accent : darkTheme.colors.muted;

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onTabPress(tab.key)}
            style={styles.tabButton}
            activeOpacity={0.8}
          >
            {tab.icon === 'home' ? (
              <HomeIcon color={color} />
            ) : (
              <HugeiconsIcon icon={tab.icon} size={22} color={color} strokeWidth={1.9} />
            )}
            <AppText variant="muted" style={[styles.label, { color }]}>
              {tab.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: darkTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.inputBorder,
    paddingTop: darkTheme.spacing.sm,
    paddingBottom: darkTheme.spacing.md,
    paddingHorizontal: darkTheme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    marginTop: darkTheme.spacing.xs,
  },
});

export default AppBottomNav;
