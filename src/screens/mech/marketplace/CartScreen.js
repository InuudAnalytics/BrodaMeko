import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Delete02Icon, MinusSignIcon, PlusSignIcon, ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import MechanicTabBar from '../../../components/navigation/MechanicTabBar';
import { ROUTES } from '../../../utils';
import { useCart } from '../../../context';

const formatNaira = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

const CartScreen = ({ navigation }) => {
  const { items, removeFromCart, updateQuantity, calculateTotal } = useCart();

  const subtotal = calculateTotal();
  const deliveryFee = subtotal > 0 ? 1500 : 0;
  const serviceFee = subtotal > 0 ? 500 : 0;
  const total = subtotal + deliveryFee + serviceFee;

  const handleTabPress = (tabKey) => {
    if (tabKey === 'profile') {
      navigation.navigate(ROUTES.USER_PROFILE);
      return;
    }

    navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: tabKey });
  };

  if (!items.length) {
    return (
      <View style={styles.root}>
        <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#E6C714" strokeWidth={2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Cart</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <HugeiconsIcon icon={ShoppingCart01Icon} size={40} color="#E6C714" strokeWidth={2} />
          </View>
          <AppText style={styles.emptyTitle}>Your cart is empty</AppText>
          <AppText style={styles.emptySubtitle}>
            Looks like you haven't added any spare parts to your cart
          </AppText>
        </View>
      </ScreenContainer>
      <MechanicTabBar activeTab="marketplace" onTabPress={handleTabPress} />
    </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#E6C714" strokeWidth={2} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Cart</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {items.map((item) => {
          const product = item.product || {};
          const image = product?.images?.[0];
          return (
            <View key={item.productId} style={styles.itemCard}>
              <View style={styles.itemRow}>
                {image ? (
                  <Image source={{ uri: image }} style={styles.itemImage} />
                ) : (
                  <View style={styles.itemImagePlaceholder} />
                )}
                <View style={styles.itemInfo}>
                  <AppText style={styles.itemName} numberOfLines={1}>
                    {product?.name || 'Product'}
                  </AppText>
                  <AppText style={styles.itemShop} numberOfLines={1}>
                    {product?.shop || 'Seller'}
                  </AppText>
                  <AppText style={styles.itemPrice}>{formatNaira(product?.price || 0)}</AppText>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeFromCart(item.productId)}
                  activeOpacity={0.85}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={18} color="#F87171" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                  activeOpacity={0.85}
                >
                  <HugeiconsIcon icon={MinusSignIcon} size={14} color="#E6C714" strokeWidth={2} />
                </TouchableOpacity>
                <AppText style={styles.qtyValue}>{item.quantity}</AppText>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                  activeOpacity={0.85}
                >
                  <HugeiconsIcon icon={PlusSignIcon} size={14} color="#E6C714" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={styles.summaryCard}>
          <AppText style={styles.summaryTitle}>Order Summary</AppText>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Subtotal</AppText>
            <AppText style={styles.summaryValue}>{formatNaira(subtotal)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Delivery fee</AppText>
            <AppText style={styles.summaryValue}>{formatNaira(deliveryFee)}</AppText>
          </View>
          <View style={styles.summaryRow}>
            <AppText style={styles.summaryLabel}>Service fee</AppText>
            <AppText style={styles.summaryValue}>{formatNaira(serviceFee)}</AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <AppText style={styles.totalLabel}>Total</AppText>
            <AppText style={styles.totalValue}>{formatNaira(total)}</AppText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomButton}>
        <AppButton label="Proceed to checkout" onPress={() => navigation.navigate('Checkout')} />
      </View>
    </ScreenContainer>
      <MechanicTabBar activeTab="marketplace" onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000033',
  },
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
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
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(230,199,20,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 130,
  },
  itemCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  itemImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  itemShop: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  itemPrice: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    columnGap: 12,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.35)',
  },
  qtyValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    color: '#FFFFFF',
    fontSize: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: '#E6C714',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
});

export default CartScreen;
