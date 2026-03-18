import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, DeviceEventEmitter, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FilterHorizontalIcon, Message01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { AppText, CenteredHeader, NoInternetState, PullToRefreshIndicator, ScreenContainer, ScrollableTabs } from '../../../components';
import { confirmMarketplaceOrderItem, getMarketplaceOrder } from '../../../services/marketplace.service';
import { getActiveCallForContext, startCall } from '../../../services/calls.service';
import { getSellerOrders } from '../../../services/spareParts.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';

const formatNaira = (value) => `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;
const formatOrderDateTime = (value) => {
  const parsed = Date.parse(String(value || '').trim());
  if (!Number.isFinite(parsed)) {
    return 'Unavailable';
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(parsed));

  const readPart = (type) =>
    String(parts.find((entry) => entry.type === type)?.value || '').trim();

  const day = readPart('day');
  const month = readPart('month');
  const year = readPart('year');
  const hour = readPart('hour');
  const minute = readPart('minute');
  const dayPeriod = readPart('dayPeriod').toUpperCase();

  if (!day || !month || !year || !hour || !minute || !dayPeriod) {
    return 'Unavailable';
  }

  return `${day}-${month}-${year} ${hour}:${minute} ${dayPeriod}`;
};

const statusConfig = {
  new: { label: 'New', color: '#E6C714', textColor: '#1A1A1A' },
  preparing: { label: 'Preparing', color: '#3B82F6', textColor: '#E9F1FF' },
  in_transit: { label: 'Shipped', color: '#22C55E', textColor: '#0B2B15' },
  completed: { label: 'Completed', color: '#22C55E', textColor: '#0B2B15' },
  cancelled: { label: 'Cancelled', color: '#EF4444', textColor: '#FFFFFF' },
};

const normalizeOrderList = (payload) => {
  if (!payload) return [];
  const root = payload?.data || payload;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.orders)) return root.orders;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.results)) return root.results;
  return [];
};

const resolveImageUri = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return String(value?.url || value?.secure_url || value?.uri || value?.path || '').trim();
  }
  return '';
};

const toStatusKey = (value) => {
  const status = String(value || '').toLowerCase();
  if (['new', 'pending', 'confirmed'].includes(status)) return 'new';
  if (['preparing', 'processing'].includes(status)) return 'preparing';
  if (['shipped', 'in_transit', 'out_for_delivery'].includes(status)) return 'in_transit';
  if (['completed', 'delivered', 'received'].includes(status)) return 'completed';
  if ([
    'cancelled',
    'canceled',
    'cancelled_by_buyer',
    'canceled_by_buyer',
    'cancelled_by_seller',
    'canceled_by_seller',
    'cancelled_by_system',
    'canceled_by_system',
  ].includes(status)) {
    return 'cancelled';
  }
  return 'new';
};

const OrdersScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const pullDistance = useRef(new Animated.Value(0)).current;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      const response = await getSellerOrders();
      const list = normalizeOrderList(response);
      const detailResponses = await Promise.all(
        list.map((order) =>
          getMarketplaceOrder(order?.id || order?._id).catch(() => null)
        )
      );

      const mapped = list.map((order, index) => {
        const detailPayload = detailResponses[index]?.data || detailResponses[index] || {};
        const detail = detailPayload?.data || detailPayload || {};
        const detailItems = Array.isArray(detail?.items) ? detail.items : [];
        const firstItem = detailItems[0] || {};
        const orderId = String(order?.id || order?._id || '').trim();
        const itemImage =
          resolveImageUri(firstItem?.part_image) ||
          resolveImageUri(firstItem?.part?.images?.[0]) ||
          resolveImageUri(firstItem?.part?.image) ||
          resolveImageUri(order?.image);

        return {
          id: orderId || `order-${index}`,
          orderId,
          itemId: String(firstItem?.id || firstItem?._id || '').trim(),
          status: toStatusKey(order?.status || firstItem?.status),
          rawStatus: String(order?.status || firstItem?.status || '').toLowerCase(),
          name: firstItem?.part_name || order?.name || `Order ${orderId.slice(0, 8)}`,
          qty: Number(firstItem?.quantity || order?.quantity || 1),
          total: Number(order?.total_amount || firstItem?.subtotal || 0),
          orderedAt: formatOrderDateTime(order?.created_at || firstItem?.created_at),
          buyerName: order?.buyer_name || detail?.buyer_name || 'Buyer',
          buyerId: String(order?.buyer_id || detail?.buyer_id || detail?.buyer?.id || '').trim(),
          buyerPhone: String(order?.buyer_phone || detail?.buyer_phone || detail?.buyer?.phone || '').trim(),
          deliveryType: String(order?.fulfillment_type || detail?.fulfillment_type || '').toLowerCase(),
          pickupCode: '',
          shopName: firstItem?.store_name || 'Spare parts shop',
          image: itemImage,
        };
      });
      setOrders(mapped);
    } catch (error) {
      setErrorText(error?.message || 'Unable to load orders right now.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  React.useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('sellerPickupConfirmed', (event) => {
      const safeOrderId = String(event?.orderId || '').trim();
      if (!safeOrderId) {
        return;
      }
      setOrders((current) =>
        current.map((order) =>
          String(order.orderId || order.id) === safeOrderId
            ? {
                ...order,
                status: 'completed',
                rawStatus: 'completed',
              }
            : order
        )
      );
    });

    return () => subscription.remove();
  }, []);

  const visibleOrders = useMemo(() => {
    if (activeTab === 'all') {
      return orders;
    }
    return orders.filter((order) => order.status === activeTab);
  }, [activeTab, orders]);

  const tabsWithCounts = useMemo(() => {
    const counts = orders.reduce(
      (acc, order) => {
        acc.all += 1;
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      { all: 0, new: 0, preparing: 0, in_transit: 0, completed: 0 }
    );

    return [
      { key: 'all', label: `All (${counts.all})` },
      { key: 'new', label: `New (${counts.new})` },
      { key: 'preparing', label: `Preparing (${counts.preparing})` },
      { key: 'in_transit', label: `In transit (${counts.in_transit})` },
      { key: 'completed', label: `Completed (${counts.completed})` },
    ];
  }, [orders]);

  const handleConfirmItem = async (order) => {
    if (!order?.orderId || !order?.itemId) {
      AppAlert.alert('Missing order info', 'Unable to update this order right now.');
      return;
    }

    try {
      await confirmMarketplaceOrderItem(order.orderId, order.itemId);
      fetchOrders();
    } catch (error) {
      AppAlert.alert('Could not update order', error?.message || 'Please try again.');
    }
  };

  const isPickupOrder = useCallback((order) => {
    const mode = String(order?.deliveryType || '').toLowerCase();
    return ['pickup', 'pick_up', 'pick-up', 'collect', 'collection'].includes(mode);
  }, []);

  const handleOpenOrder = useCallback(
    (order) => {
      if (!isPickupOrder(order)) {
        return;
      }
      navigation.navigate(ROUTES.SPARE_PARTS_PICKUP_ORDER_DETAILS, {
        order: {
          id: order.orderId || order.id,
          itemId: order.itemId,
          buyerName: order.buyerName,
          buyerPhone: order.buyerPhone,
          productName: order.name,
          quantity: order.qty,
          amountPaid: order.total,
          shopName: order.shopName,
          image: order.image,
          status: order.rawStatus || order.status,
          pickupCode: order.pickupCode,
          deliveryType: order.deliveryType,
        },
      });
    },
    [isPickupOrder, navigation]
  );

  const handleCallBuyer = useCallback(async (order) => {
    const orderId = String(order?.orderId || order?.id || '').trim();
    const calleeId = String(order?.buyerId || '').trim();
    if (!orderId || !calleeId) {
      AppAlert.alert('Call unavailable', 'Buyer call session is not ready for this order yet.');
      return;
    }
    try {
      const clientCallId = `app-order-${orderId}-${Date.now()}`;
      const response = await startCall({
        context_type: 'order',
        context_id: orderId,
        callee_id: calleeId,
        client_call_id: clientCallId,
      });
      const callPayload = response?.data || {};
      const callId = String(callPayload?.call_id || '').trim();
      if (!callId) {
        AppAlert.alert('Call unavailable', 'Missing call identifier from server.');
        return;
      }
      navigation.navigate(ROUTES.CALL_OUTGOING, {
        callId,
        calleeName: String(order?.buyerName || 'Buyer').trim(),
        contextLabel: `Order #${orderId.slice(0, 8)}`,
        contextType: 'order',
        contextId: orderId,
      });
    } catch (error) {
      try {
        const activeCall = await getActiveCallForContext({
          context_type: 'order',
          context_id: orderId,
        });
        const activeCallId = String(activeCall?.call_id || '').trim();
        const activeState = String(activeCall?.state || '').trim().toLowerCase();
        if (activeCallId) {
          navigation.navigate(
            activeState === 'accepted' ? ROUTES.CALL_IN_PROGRESS : ROUTES.CALL_OUTGOING,
            {
              callId: activeCallId,
              calleeName: String(order?.buyerName || 'Buyer').trim(),
              participantName: String(order?.buyerName || 'Buyer').trim(),
              contextLabel: `Order #${orderId.slice(0, 8)}`,
              contextType: 'order',
              contextId: orderId,
            }
          );
          return;
        }
      } catch {
        // fall through
      }
      const statusCode = Number(error?.statusCode || 0);
      const safeMessage = String(error?.message || '').trim().toLowerCase();
      if (statusCode >= 500 || safeMessage.includes('internal server error')) {
        AppAlert.alert('Call unavailable', 'Call limit reached for this order. One-time call has been used.');
        return;
      }
      AppAlert.alert('Call failed', error?.message || 'Could not start call.');
    }
  }, [navigation]);

  const handleBackToHome = useCallback(() => {
    navigation.navigate(ROUTES.SPARE_PARTS_TABS, { tab: 'home' });
  }, [navigation]);

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <CenteredHeader title="Orders" onBackPress={handleBackToHome} />

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" strokeWidth={2} />
            <AppText style={styles.searchPlaceholder}>Search for products</AppText>
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
            <HugeiconsIcon icon={FilterHorizontalIcon} size={18} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsWrap}>
          <ScrollableTabs tabs={tabsWithCounts} activeKey={activeTab} onChange={setActiveTab} />
        </View>

        <View style={styles.listWrap}>
          <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
          <Animated.ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onScroll={event => {
              const offsetY = event.nativeEvent.contentOffset.y;
              const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
              pullDistance.setValue(pullValue);
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={fetchOrders}
                tintColor="transparent"
                colors={['transparent']}
              />
            }
          >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {errorText ? <NoInternetState message={errorText} onRetry={fetchOrders} /> : null}

          {visibleOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.new;
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.card}
                activeOpacity={0.95}
                onPress={() => handleOpenOrder(order)}
              >
                <View style={styles.cardTop}>
                  {order.image ? (
                    <Image source={{ uri: order.image }} style={styles.cardImage} />
                  ) : (
                    <View style={styles.cardImageFallback} />
                  )}
                  <View style={styles.cardInfo}>
                    <AppText style={styles.cardTitle}>{order.name}</AppText>
                    <AppText style={styles.cardQty}>Qty: {order.qty}</AppText>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: status.color }]}>
                    <AppText style={[styles.statusText, { color: status.textColor }]}>
                      {status.label}
                    </AppText>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <View>
                    <AppText style={styles.metaLabel}>Total amount</AppText>
                    <AppText style={styles.metaValue}>{formatNaira(order.total)}</AppText>
                  </View>
                  <View>
                    <AppText style={styles.metaLabel}>Ordered at</AppText>
                    <AppText style={styles.metaValue}>{order.orderedAt}</AppText>
                  </View>
                </View>

                {isPickupOrder(order) ? (
                  <View style={styles.pickupBadge}>
                    <AppText style={styles.pickupBadgeText}>Pickup order</AppText>
                  </View>
                ) : null}

                {order.status === 'new' ? (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => handleConfirmItem(order)}
                  >
                    <AppText style={styles.primaryButtonText}>Prepare package</AppText>
                  </TouchableOpacity>
                ) : null}

                {order.status === 'preparing' ? (
                  <View style={styles.prepRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      activeOpacity={0.85}
                      onPress={() => handleConfirmItem(order)}
                    >
                      <AppText style={styles.secondaryButtonText}>Mark as ready</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
                      <HugeiconsIcon icon={Message01Icon} size={18} color="#E6C714" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                {order.status === 'in_transit' ? (
                  <View style={styles.dualRow}>
                    {order?.buyerId ? (
                      <TouchableOpacity
                        style={styles.outlineButton}
                        activeOpacity={0.85}
                        onPress={() => handleCallBuyer(order)}
                      >
                        <AppText style={styles.outlineButtonText}>Call buyer</AppText>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.outlineButton, styles.disabledButton]} activeOpacity={1}>
                        <AppText style={[styles.outlineButtonText, styles.disabledButtonText]}>
                          Buyer phone hidden
                        </AppText>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.outlineButton} activeOpacity={0.85}>
                      <AppText style={styles.outlineButtonText}>Track order</AppText>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {order.status === 'completed' ? (
                  <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
                    <AppText style={styles.secondaryButtonText}>View ratings</AppText>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          })}
          </Animated.ScrollView>
        </View>
      </ScreenContainer>
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
  searchRow: {
    marginTop: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
  searchBox: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  searchPlaceholder: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabsWrap: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    rowGap: 12,
  },
  listWrap: {
    flex: 1,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 12,
  },
  pickupBadge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(230,199,20,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pickupBadgeText: {
    color: '#E6C714',
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  cardImage: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  cardImageFallback: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  cardQty: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  metaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E6C714',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  secondaryButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  secondaryButtonText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  prepRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  iconButton: {
    width: 46,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  dualRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  outlineButton: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  outlineButtonText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  disabledButton: {
    opacity: 0.45,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default OrdersScreen;



