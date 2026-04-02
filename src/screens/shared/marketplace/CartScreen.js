import React, { useMemo } from 'react';
import {
  Animated,
  Image,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Delete01Icon,
  MinusSignIcon,
  PlusSignIcon,
  Store01Icon,
} from '@hugeicons/core-free-icons';
import {
  AppBottomNav,
  AppButton,
  AppText,
  PullToRefreshIndicator,
  ScreenContainer,
} from '../../../components';
import MechanicTabBar from '../../../components/navigation/MechanicTabBar';
import { ROUTES } from '../../../utils';
import { useCart } from '../../../context';
import { useFocusEffect } from '@react-navigation/native';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatNaira = value => `N${Number(value || 0).toLocaleString('en-NG')}`;

const resolveImageUri = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object')
    return String(
      value?.url || value?.secure_url || value?.uri || value?.path || '',
    ).trim();
  return '';
};

const groupByVendor = items => {
  const map = {};
  items.forEach(item => {
    const key = item.product?.storeId || item.product?.shop || '__unknown__';
    const label = item.product?.shop || 'Unknown store';
    if (!map[key]) map[key] = { key, label, items: [] };
    map[key].items.push(item);
  });
  return Object.values(map);
};

const vendorSubtotal = vendorItems =>
  vendorItems.reduce(
    (sum, item) =>
      sum + Number(item.product?.price || 0) * Number(item.quantity || 1),
    0,
  );

// ─── CartItem ────────────────────────────────────────────────────────────────

const CartItem = ({ item, onRemove, onQtyChange }) => {
  const product = item.product || {};
  const image = resolveImageUri(product?.images?.[0]);
  const hasPrice = Number.isFinite(Number(product?.price));
  const itemTotal = Number(product?.price || 0) * Number(item.quantity || 1);

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemRow}>
        {image ? (
          <Image source={{ uri: image }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImagePlaceholder} />
        )}

        <View style={styles.itemInfo}>
          <AppText style={styles.itemName} numberOfLines={2}>
            {String(product?.name || '').trim() || 'Unavailable'}
          </AppText>
          {hasPrice ? (
            <AppText style={styles.itemUnitPrice}>
              {formatNaira(product.price)} / unit
            </AppText>
          ) : null}
          <AppText style={styles.itemTotal}>
            {hasPrice ? formatNaira(itemTotal) : 'Unavailable'}
          </AppText>
        </View>

        <View style={styles.actionCol}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onRemove}
            activeOpacity={0.85}
          >
            <HugeiconsIcon
              icon={Delete01Icon}
              size={17}
              color="#9CA3AF"
              strokeWidth={2}
            />
          </TouchableOpacity>

          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => onQtyChange(item.quantity - 1)}
              activeOpacity={0.85}
            >
              <HugeiconsIcon
                icon={MinusSignIcon}
                size={13}
                color="#E6C714"
                strokeWidth={2}
              />
            </TouchableOpacity>
            <AppText style={styles.qtyValue}>{item.quantity}</AppText>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => onQtyChange(item.quantity + 1)}
              activeOpacity={0.85}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                size={13}
                color="#E6C714"
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── VendorSection ───────────────────────────────────────────────────────────

const VendorSection = ({ group, onRemove, onQtyChange }) => {
  const sub = vendorSubtotal(group.items);
  return (
    <View style={styles.vendorSection}>
      {/* vendor header */}
      <View style={styles.vendorHeader}>
        <HugeiconsIcon
          icon={Store01Icon}
          size={15}
          color="#9CA3AF"
          strokeWidth={2}
        />
        <AppText style={styles.vendorName} numberOfLines={1}>
          {group.label}
        </AppText>
      </View>

      {/* items */}
      {group.items.map((item, i) => (
        <CartItem
          key={String(item?.id || item?.productId || `${group.key}-${i}`)}
          item={item}
          onRemove={() => onRemove(item.id || item.productId)}
          onQtyChange={qty => onQtyChange(item.id || item.productId, qty)}
        />
      ))}

      {/* vendor subtotal */}
      <View style={styles.vendorFooter}>
        <AppText style={styles.vendorSubLabel}>
          {group.items.length} item{group.items.length !== 1 ? 's' : ''}
        </AppText>
        <AppText style={styles.vendorSubValue}>{formatNaira(sub)}</AppText>
      </View>
    </View>
  );
};

// ─── CartScreen ──────────────────────────────────────────────────────────────

const CartScreen = ({ navigation, route }) => {
  const { items, removeFromCart, updateQuantity, calculateTotal, reloadCart } =
    useCart();
  const pullDistance = React.useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  const isMechanic = route?.params?.marketplaceRole === 'mechanic';
  const subtotal = calculateTotal();
  const vendorGroups = useMemo(() => groupByVendor(items), [items]);

  const handleCarOwnerTabPress = routeName => navigation.navigate(routeName);
  const handleMechanicTabPress = tabKey => {
    if (tabKey === 'profile') {
      navigation.navigate(ROUTES.USER_PROFILE);
      return;
    }
    navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: tabKey });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await reloadCart();
    } finally {
      await new Promise(r => setTimeout(r, 250));
    }
    setRefreshing(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      reloadCart();
      return undefined;
    }, [reloadCart]),
  );

  const renderBottomNav = () =>
    isMechanic ? (
      <MechanicTabBar
        activeTab="marketplace"
        onTabPress={handleMechanicTabPress}
      />
    ) : (
      <AppBottomNav
        activeTab={ROUTES.CAR_OWNER_MARKETPLACE}
        onTabPress={handleCarOwnerTabPress}
      />
    );

  const renderHeader = () => (
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
      <AppText style={styles.headerTitle}>Cart</AppText>
      <View style={styles.headerSpacer} />
    </View>
  );

  // ── empty state ─────────────────────────────────────────────────────────────
  if (!items.length) {
    return (
      <View style={styles.root}>
        <ScreenContainer
          padded={false}
          edges={['top', 'left', 'right']}
          style={styles.screen}
        >
          {renderHeader()}
          <View style={styles.emptyWrap}>
            <Image
              source={require('../../../../assets/Empty cart.png')}
              style={styles.emptyImage}
            />
            <AppText style={styles.emptyTitle}>Your cart is empty</AppText>
            <AppText style={styles.emptySubtitle}>
              Looks like you haven&apos;t added any spare parts to your cart
            </AppText>
          </View>
        </ScreenContainer>
        {renderBottomNav()}
      </View>
    );
  }

  // ── filled cart ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <ScreenContainer
        padded={false}
        edges={['top', 'left', 'right', 'bottom']}
        style={styles.screen}
      >
        {renderHeader()}

        <View style={styles.listWrap}>
          <PullToRefreshIndicator
            pullDistance={pullDistance}
            refreshing={refreshing}
          />
          <Animated.ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onScroll={e => {
              const y = e.nativeEvent.contentOffset.y;
              pullDistance.setValue(y < 0 ? Math.min(-y, 140) : 0);
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="transparent"
                colors={['transparent']}
              />
            }
          >
            {/* vendor groups */}
            {vendorGroups.map(group => (
              <VendorSection
                key={group.key}
                group={group}
                onRemove={removeFromCart}
                onQtyChange={updateQuantity}
              />
            ))}

            {/* order summary */}
            <View style={styles.summaryCard}>
              <AppText style={styles.summaryTitle}>Order Summary</AppText>

              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>
                  {items.length} item{items.length !== 1 ? 's' : ''} from{' '}
                  {vendorGroups.length} seller
                  {vendorGroups.length !== 1 ? 's' : ''}
                </AppText>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Subtotal</AppText>
                <AppText style={styles.summaryValue}>
                  {formatNaira(subtotal)}
                </AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Service fee (8%)</AppText>
                <AppText style={styles.summaryValue}>
                  {formatNaira(subtotal * 0.08)}
                </AppText>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.summaryRow}>
                <AppText style={styles.totalLabel}>Estimated total</AppText>
                <AppText style={styles.totalValue}>
                  {formatNaira(subtotal * 1.08)}
                </AppText>
              </View>

              <AppText style={styles.deliveryNote}>
                Delivery fee (if applicable) calculated at checkout
              </AppText>
            </View>
          </Animated.ScrollView>
        </View>

        <View style={styles.bottomButton}>
          <AppButton
            label={`Checkout · ${formatNaira(subtotal * 1.08)}`}
            onPress={() => navigation.navigate('Checkout')}
          />
        </View>
      </ScreenContainer>
      {renderBottomNav()}
    </View>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000033' },
  screen: { flex: 1, backgroundColor: '#000033' },

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
  headerSpacer: { width: 40 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 150,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 16,
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

  listWrap: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100 },

  // vendor section
  vendorSection: {
    marginBottom: 20,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 7,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  vendorName: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  vendorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    marginTop: 4,
  },
  vendorSubLabel: { color: '#6B7280', fontSize: 12 },
  vendorSubValue: { color: '#E6C714', fontSize: 13, fontWeight: '700' },

  // item card
  itemCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemImage: { width: 68, height: 68, borderRadius: 10, marginRight: 12 },
  itemImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemInfo: { flex: 1 },
  itemName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  itemUnitPrice: { color: '#6B7280', fontSize: 11, marginTop: 3 },
  itemTotal: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },

  actionCol: { flexDirection: 'column', alignItems: 'flex-end', marginLeft: 8 },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  qtyButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
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
    minWidth: 18,
    textAlign: 'center',
  },

  // summary card
  summaryCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: { color: '#9CA3AF', fontSize: 13 },
  summaryValue: { color: '#FFFFFF', fontSize: 13 },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 10,
  },
  totalLabel: { color: '#E6C714', fontSize: 14, fontWeight: '700' },
  totalValue: { color: '#E6C714', fontSize: 14, fontWeight: '700' },
  deliveryNote: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
  },

  // checkout button
  bottomButton: {
    paddingHorizontal: 20,
    paddingBottom: 72,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    backgroundColor: '#000033',
  },
});

export default CartScreen;
