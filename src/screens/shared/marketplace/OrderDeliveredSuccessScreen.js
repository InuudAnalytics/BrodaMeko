import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { ROUTES } from '../../../utils';

const resolveImageUri = (value) => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    return String(value?.url || value?.secure_url || value?.uri || value?.path || '').trim();
  }
  return '';
};

const OrderDeliveredSuccessScreen = ({ navigation, route }) => {
  const { role } = useAuth();
  const productName = String(route?.params?.productName || route?.params?.product?.name || '').trim() || 'Unavailable';
  const productImage = resolveImageUri(route?.params?.productImage || route?.params?.product?.images?.[0]);
  const sellerName = String(route?.params?.sellerName || route?.params?.seller?.name || '').trim() || 'Unavailable';
  const orderId = String(route?.params?.orderId || route?.params?.order_id || '').trim() || 'Unavailable';
  const storeId =
    route?.params?.storeId ||
    route?.params?.store_id ||
    route?.params?.product?.storeId ||
    '';

  const handleBackToMarketplace = () => {
    if (String(role || '').toLowerCase() === 'mech') {
      navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'marketplace' });
      return;
    }
    navigation.navigate(ROUTES.CAR_OWNER_MARKETPLACE);
  };

  const handleRateProduct = () => {
    navigation.navigate('RateProduct', {
      productName,
      productImage,
      sellerName,
      orderId,
      storeId,
    });
  };

  return (
    <ScreenContainer padded={false}>
      <View style={styles.container}>
        <View style={styles.card}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={72} color="#22C55E" strokeWidth={2} />
          <AppText style={styles.title}>Package delivered</AppText>
          <AppText style={styles.subtitle}>
            Your order has been delivered successfully. Please rate this product.
          </AppText>

          <View style={styles.productCard}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.productImage} />
            ) : (
              <View style={styles.productImagePlaceholder} />
            )}
            <View style={styles.productInfo}>
              <AppText style={styles.productName} numberOfLines={1}>
                {productName}
              </AppText>
              <AppText style={styles.productSeller} numberOfLines={1}>
                {sellerName}
              </AppText>
              <AppText style={styles.productOrder}>Order #{orderId}</AppText>
            </View>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleRateProduct} activeOpacity={0.85}>
            <AppText style={styles.primaryText}>Rate product</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToMarketplace} activeOpacity={0.85}>
            <AppText style={styles.secondaryText}>Go to Spareparts</AppText>
          </TouchableOpacity>
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
  productCard: {
    marginTop: 18,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
  },
  productImagePlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  productSeller: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  productOrder: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 20,
    width: '100%',
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
    width: '100%',
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

export default OrderDeliveredSuccessScreen;
