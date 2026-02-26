import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components';
import MechanicTabBar from '../components/navigation/MechanicTabBar';
import MechanicDashboardScreen from '../screens/mech/home/MechanicDashboardScreen';
import MechanicJobsScreen from '../screens/mech/jobs/MechanicJobsScreen';
import MechanicWalletScreen from '../screens/mech/wallet/MechanicWalletScreen';
import { darkTheme } from '../theme';
import { ROUTES } from '../utils';

const MechanicDashboardTabs = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const requestedTab = route?.params?.tab;

    if (!requestedTab || requestedTab === 'profile') {
      return;
    }

    setActiveTab(requestedTab);
    navigation.setParams?.({ tab: undefined });
  }, [navigation, route?.params?.tab]);

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

    return null;
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === 'profile') {
      navigation.navigate(ROUTES.USER_PROFILE);
      return;
    }

    setActiveTab(tabKey);
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.content}>{renderTabScreen()}</View>
      </ScreenContainer>
      <MechanicTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    flex: 1,
  },
});

export default MechanicDashboardTabs;
