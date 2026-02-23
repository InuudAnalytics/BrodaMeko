import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Briefcase01Icon, User02Icon, Wallet01Icon } from '@hugeicons/core-free-icons';
import { AppText } from '..';
import { darkTheme } from '../../theme';

const HomeIcon = ({ color }) => {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 10.5L12 3L21 10.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10V20H18V10" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
};

const TABS = [
  { key: 'home', label: 'Home', iconType: 'home' },
  { key: 'jobs', label: 'Jobs', icon: Briefcase01Icon },
  { key: 'wallet', label: 'Wallet', icon: Wallet01Icon },
  { key: 'profile', label: 'Profile', icon: User02Icon },
];

const MechanicTabBar = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        const color = isActive ? darkTheme.colors.accent : darkTheme.colors.muted;

        return (
          <TouchableOpacity key={tab.key} style={styles.item} activeOpacity={0.85} onPress={() => onTabPress(tab.key)}>
            {tab.iconType === 'home' ? (
              <HomeIcon color={color} />
            ) : (
              <HugeiconsIcon icon={tab.icon} size={20} color={color} strokeWidth={2} />
            )}
            <AppText style={[styles.label, { color }]}>{tab.label}</AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: darkTheme.colors.inputBorder,
    backgroundColor: darkTheme.colors.background,
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default MechanicTabBar;
