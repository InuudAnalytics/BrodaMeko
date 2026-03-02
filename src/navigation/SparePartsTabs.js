import React, { useEffect, useState, useCallback } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import SparePartsTabBar from '../components/navigation/SparePartsTabBar';
import SellerDashboardScreen from '../screens/spareparts/home/SellerDashboardScreen';
import MechanicWalletScreen from '../screens/mech/wallet/MechanicWalletScreen';
import PlaceholderScreen from '../screens/shared/PlaceholderScreen';
import OrdersScreen from '../screens/spareparts/orders/OrdersScreen';
import SellerStoreScreen from '../screens/spareparts/store/SellerStoreScreen';
import UserProfileScreen from '../screens/shared/profile/UserProfileScreen';
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

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, [])
  );

  const renderTabScreen = () => {
    if (activeTab === 'home') {
      return <SellerDashboardScreen navigation={navigation} onTabPress={setActiveTab} />;
    }

    if (activeTab === 'orders') {
      return <OrdersScreen navigation={navigation} onBack={() => setActiveTab('home')} />;
    }

    if (activeTab === 'store') {
      return <SellerStoreScreen navigation={navigation} onBack={() => setActiveTab('home')} />;
    }

    if (activeTab === 'wallet') {
      return <MechanicWalletScreen navigation={navigation} showTabBar={false} />;
    }

    if (activeTab === 'profile') {
      return <UserProfileScreen navigation={navigation} onBack={() => setActiveTab('home')} />;
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
