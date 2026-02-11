import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';
import AppText from './AppText';

const TABS = [
  { key: ROUTES.CAR_OWNER_DASHBOARD, label: 'Home', icon: 'home' },
  { key: ROUTES.CAR_OWNER_HISTORY, label: 'History', icon: 'history' },
  { key: ROUTES.CAR_OWNER_REWARDS, label: 'Rewards', icon: 'rewards' },
  { key: ROUTES.CAR_OWNER_SETTINGS, label: 'Settings', icon: 'settings' },
];

const TabIcon = ({ name, color }) => {
  const stroke = color;

  if (name === 'home') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M3 10.5L12 3L21 10.5" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M6 10V20H18V10" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (name === 'history') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path d="M4 12A8 8 0 1 0 7 5.8" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
        <Path d="M4 5V9H8" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (name === 'rewards') {
    return (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="9" r="4" stroke={stroke} strokeWidth={1.8} />
        <Path d="M10.5 13.2L9.2 20L12 18.3L14.8 20L13.5 13.2" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.2" stroke={stroke} strokeWidth={1.8} />
      <Line x1="12" y1="2.5" x2="12" y2="5.2" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="12" y1="18.8" x2="12" y2="21.5" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="2.5" y1="12" x2="5.2" y2="12" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="18.8" y1="12" x2="21.5" y2="12" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="5.1" y1="5.1" x2="7" y2="7" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="17" y1="17" x2="18.9" y2="18.9" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="17" y1="7" x2="18.9" y2="5.1" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      <Line x1="5.1" y1="18.9" x2="7" y2="17" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
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
            <TabIcon name={tab.icon} color={color} />
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
