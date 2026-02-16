import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, ScreenContainer } from '../components';
import MechanicTabBar from '../components/navigation/MechanicTabBar';
import MechanicDashboardScreen from '../screens/mech/home/MechanicDashboardScreen';
import MechanicJobsScreen from '../screens/mech/jobs/MechanicJobsScreen';
import MechanicWalletScreen from '../screens/mech/wallet/MechanicWalletScreen';
import { darkTheme } from '../theme';

const TabPlaceholder = ({ title, subtitle }) => {
  return (
    <View style={styles.placeholderWrap}>
      <AppText style={styles.placeholderTitle}>{title}</AppText>
      <AppText style={styles.placeholderSubtitle}>{subtitle}</AppText>
    </View>
  );
};

const MechanicDashboardTabs = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('home');

  const renderTabScreen = () => {
    if (activeTab === 'home') {
      return <MechanicDashboardScreen navigation={navigation} />;
    }

    if (activeTab === 'jobs') {
      return <MechanicJobsScreen navigation={navigation} />;
    }

    if (activeTab === 'wallet') {
      return <MechanicWalletScreen navigation={navigation} onTabPress={setActiveTab} showTabBar={false} />;
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
