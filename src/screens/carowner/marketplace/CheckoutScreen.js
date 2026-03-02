import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';

const formatNaira = value =>
  `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const CheckoutScreen = ({ navigation, route }) => {
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('transfer');

  const product = route?.params?.directProduct || {
    id: '1',
    name: 'LED headlights',
    price: 2500,
    shop: 'Okon spare part hub',
    images: ['https://picsum.photos/300'],
  };

  const image = product?.images?.[0];
  const quantity = Number(product?.quantity || 1);
  const subtotal = useMemo(
    () => Number(product?.price || 0) * quantity,
    [product?.price, quantity],
  );
  const deliveryFee = deliveryType === 'delivery' ? 2500 : 0;
  const serviceFee = 500;
  const total = subtotal + deliveryFee + serviceFee;

  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={22}
            color="#E6C714"
            strokeWidth={2}
          />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Checkout</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.productCard}>
            {image ? (
              <Image source={{ uri: image }} style={styles.productImage} />
            ) : (
              <View style={styles.imagePlaceholder} />
            )}
            <View style={styles.productInfo}>
              <AppText style={styles.productName} numberOfLines={1}>
                {product?.name || 'Product'}
              </AppText>
              <AppText style={styles.productShop} numberOfLines={1}>
                {product?.shop || 'Seller'}
              </AppText>
              <AppText style={styles.productPrice}>
                {formatNaira(product?.price || 0)}
              </AppText>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <AppText style={styles.sectionTitle}>Order summary</AppText>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Subtotal</AppText>
              <AppText style={styles.summaryValue}>
                {formatNaira(subtotal)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Delivery fee</AppText>
              <AppText style={styles.summaryValue}>
                {formatNaira(deliveryFee)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Service fee</AppText>
              <AppText style={styles.summaryValue}>
                {formatNaira(serviceFee)}
              </AppText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <AppText style={styles.totalLabel}>Total</AppText>
              <AppText style={styles.totalValue}>{formatNaira(total)}</AppText>
            </View>
          </View>
          <View style={styles.block}>
            <AppText style={styles.sectionTitle}>Delivery</AppText>
            <View style={styles.deliveryRow}>
              <TouchableOpacity
                style={[
                  styles.deliveryCard,
                  deliveryType === 'delivery' && styles.deliveryCardActive,
                ]}
                onPress={() => setDeliveryType('delivery')}
                activeOpacity={0.85}
              >
                <AppText style={styles.deliveryTitle}>Request delivery</AppText>
                <AppText style={styles.deliverySubtitle}>
                  1-3 days • ?2,500
                </AppText>
                {deliveryType === 'delivery' ? (
                  <View style={styles.deliveryCheck} />
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deliveryCard,
                  deliveryType === 'pickup' && styles.deliveryCardActive,
                ]}
                onPress={() => setDeliveryType('pickup')}
                activeOpacity={0.85}
              >
                <AppText style={styles.deliveryTitle}>Pick up</AppText>
                <AppText style={styles.deliverySubtitle}>
                  Collect from seller
                </AppText>
                {deliveryType === 'pickup' ? (
                  <View style={styles.deliveryCheck} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.locationCard}>
            <HugeiconsIcon
              icon={Location01Icon}
              size={18}
              color="#E6C714"
              strokeWidth={2}
            />
            <View style={styles.locationInfo}>
              <AppText style={styles.locationName}>
                {product?.shop || 'Okon spare part hub'}
              </AppText>
              <AppText style={styles.locationAddress}>
                No 1, Onireke street, Agbabiaka
              </AppText>
            </View>
            <TouchableOpacity activeOpacity={0.85}>
              <AppText style={styles.changeText}>Change</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.block}>
            <AppText style={styles.sectionTitle}>Payment method</AppText>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'transfer' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('transfer')}
              activeOpacity={0.85}
            >
              <View>
                <AppText style={styles.paymentTitle}>Pay with transfer</AppText>
                <AppText style={styles.paymentSubtitle}>Via paystack</AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'transfer' && styles.radioActive,
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'card' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.85}
            >
              <View>
                <AppText style={styles.paymentTitle}>
                  Pay with debit/credit card
                </AppText>
                <AppText style={styles.paymentSubtitle}>Via paystack</AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'card' && styles.radioActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        <AppButton
          label="Confirm and pay"
          onPress={() => navigation.navigate('PaymentSuccessScreen')}
        />
      </View>
    </ScreenContainer>
  );
};
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#E6C714',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  productCard: {
    marginTop: 8,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  productShop: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  productPrice: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryValue: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: '#E6C714',
    fontSize: 14,
    fontWeight: '700',
  },
  block: {
    marginTop: 18,
  },
  deliveryRow: {
    flexDirection: 'row',
    columnGap: 12,
  },
  deliveryCard: {
    flex: 1,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deliveryCardActive: {
    borderColor: '#E6C714',
  },
  deliveryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  deliverySubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },
  deliveryCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E6C714',
  },
  locationCard: {
    marginTop: 16,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  locationAddress: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  changeText: {
    color: '#E6C714',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentCardActive: {
    borderColor: '#E6C714',
  },
  paymentTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  paymentSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E6C714',
  },
  radioActive: {
    backgroundColor: '#E6C714',
  },
  bottomAction: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
});

export default CheckoutScreen;
