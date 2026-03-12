import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { ROUTES } from '../../../utils';

const PaymentSuccessScreen = ({ navigation, route }) => {
  const { role } = useAuth();
  const orderId = route?.params?.orderId;
  const fulfillmentType = String(route?.params?.fulfillmentType || 'delivery').toLowerCase();
  const subtotal = Number(route?.params?.subtotal || 0);
  const serviceCharge = Number(route?.params?.serviceCharge || 0);
  const totalAmount = Number(route?.params?.totalAmount || subtotal + serviceCharge);

  const handleBackToMarketplace = () => {
    if (String(role || '').toLowerCase() === 'mech') {
      navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'marketplace' });
      return;
    }

    navigation.navigate(ROUTES.CAR_OWNER_MARKETPLACE);
  };
  return (
    <ScreenContainer padded={false}>
      <View style={styles.container}>
        <View style={styles.card}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={72} color="#22C55E" strokeWidth={2} />
          <AppText style={styles.title}>Payment successful</AppText>
          <AppText style={styles.subtitle}>
            {fulfillmentType === 'pickup'
              ? 'Your order is ready for pickup flow. Use your pickup code at the shop.'
              : 'Your order is being processed and will be delivered soon.'}
          </AppText>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() =>
                fulfillmentType === 'pickup'
                  ? navigation.navigate(ROUTES.CAR_OWNER_PICKUP_TRACKING, {
                      orderId,
                      pickupCode: route?.params?.pickupCode,
                      product: route?.params?.product,
                      seller: route?.params?.seller,
                      deliveryAddress: route?.params?.deliveryAddress,
                      storeName: route?.params?.storeName,
                      storeAddress: route?.params?.storeAddress,
                      storeInfo: route?.params?.storeInfo,
                      shopCoordinates: route?.params?.shopCoordinates,
                      subtotal,
                      serviceCharge,
                      totalAmount,
                    })
                  : navigation.navigate('OrderTracking', {
                      orderId,
                      product: route?.params?.product,
                      seller: route?.params?.seller,
                      deliveryAddress: route?.params?.deliveryAddress,
                      storeName: route?.params?.storeName,
                      storeAddress: route?.params?.storeAddress,
                      storeInfo: route?.params?.storeInfo,
                      shopCoordinates: route?.params?.shopCoordinates,
                      subtotal,
                      serviceCharge,
                      totalAmount,
                    })
              }
            >
              <AppText style={styles.primaryText}>
                {fulfillmentType === 'pickup' ? 'Track pickup' : 'Track order'}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToMarketplace}>
              <AppText style={styles.secondaryText}>Go to Spareparts</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#1A1A4A',
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  actions: {
    marginTop: 24,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#E6C714',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#000033',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6C714',
  },
  secondaryText: {
    color: '#E6C714',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentSuccessScreen;
