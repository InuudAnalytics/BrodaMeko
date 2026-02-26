import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import SparePartsTabBar from '../components/navigation/SparePartsTabBar';
import SellerDashboardScreen from '../screens/spareparts/home/SellerDashboardScreen';
import MechanicWalletScreen from '../screens/mech/wallet/MechanicWalletScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import SellerStoreScreen from '../screens/spareparts/store/SellerStoreScreen';
import { ROUTES } from '../utils';

const SparePartsTabs = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const requestedTab = route?.params?.tab;
    if (!requestedTab) {
      return;
    }
    setActiveTab(requestedTab);
  }, [route?.params?.tab]);

  const renderTabScreen = () => {
    if (activeTab === 'home') {
      return <SellerDashboardScreen navigation={navigation} onTabPress={setActiveTab} />;
    }

    if (activeTab === 'orders') {
      return <PlaceholderScreen navigation={navigation} route={{ params: { title: 'Orders' } }} />;
    }

    if (activeTab === 'store') {
      return <SellerStoreScreen navigation={navigation} />;
    }

    if (activeTab === 'wallet') {
      return <MechanicWalletScreen navigation={navigation} showTabBar={false} />;
    }

    if (activeTab === 'profile') {
      return <PlaceholderScreen navigation={navigation} route={{ params: { title: 'Profile' } }} />;
    }

    return null;
  };

  const handleTabPress = (tabKey) => {
    if (tabKey === activeTab) {
      return;
    }
    setActiveTab(tabKey);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderTabScreen()}</View>
      <SparePartsTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default SparePartsTabs;
