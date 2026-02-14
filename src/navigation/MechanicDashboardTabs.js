import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, ScreenContainer } from '../components';
import MechanicTabBar from '../components/navigation/MechanicTabBar';
import MechanicDashboardScreen from '../screens/mech/home/MechanicDashboardScreen';
import { darkTheme } from '../theme';

const TabPlaceholder = ({ title, subtitle }) => {
  return (
    <View style={styles.placeholderWrap}>
      <AppText style={styles.placeholderTitle}>{title}</AppText>
      <AppText style={styles.placeholderSubtitle}>{subtitle}</AppText>
    </View>
  );
};

const MechanicDashboardTabs = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderTabScreen = () => {
    if (activeTab === 'home') {
      return <MechanicDashboardScreen />;
    }

    if (activeTab === 'jobs') {
      return <TabPlaceholder title="Jobs coming soon" subtitle="Job requests view will appear here." />;
    }

    if (activeTab === 'wallet') {
      return <TabPlaceholder title="Wallet coming soon" subtitle="Mechanic wallet screen will be added here next." />;
    }

    return <TabPlaceholder title="Chat coming soon" subtitle="Mechanic chat list will appear here." />;
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>{renderTabScreen()}</View>
      <MechanicTabBar activeTab={activeTab} onTabPress={setActiveTab} />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
  },
  placeholderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#000033',
  },
  placeholderTitle: {
    color: darkTheme.colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    marginTop: 8,
    color: darkTheme.colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default MechanicDashboardTabs;
