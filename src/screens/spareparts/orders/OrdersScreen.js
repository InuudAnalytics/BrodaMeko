import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FilterHorizontalIcon, Message01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { AppText, CenteredHeader, ScreenContainer, ScrollableTabs } from '../../../components';
import { confirmMarketplaceOrderItem } from '../../../services/marketplace.service';
import { getSellerOrders } from '../../../services/spareParts.service';
import { darkTheme } from '../../../theme';

const ORDERS = [
  {
    id: '1',
    status: 'new',
    name: 'LED headlights',
    qty: 2,
    total: 7500,
    orderedAt: 'Today 8:56 AM',
    image: 'https://picsum.photos/120?random=91',
  },
  {
    id: '2',
    status: 'preparing',
    name: 'LED headlights',
    qty: 2,
    total: 7500,
    orderedAt: 'Today 8:56 AM',
    image: 'https://picsum.photos/120?random=92',
  },
  {
    id: '3',
    status: 'in_transit',
    name: 'LED headlights',
    qty: 2,
    total: 7500,
    orderedAt: 'Today 8:56 AM',
    image: 'https://picsum.photos/120?random=93',
  },
  {
    id: '4',
    status: 'completed',
    name: 'LED headlights',
    qty: 2,
    total: 7500,
    orderedAt: 'Today 8:56 AM',
    image: 'https://picsum.photos/120?random=94',
  },
];

const formatNaira = (value) => `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const statusConfig = {
  new: { label: 'New', color: '#E6C714', textColor: '#1A1A1A' },
  preparing: { label: 'Preparing', color: '#3B82F6', textColor: '#E9F1FF' },
  in_transit: { label: 'Shipped', color: '#22C55E', textColor: '#0B2B15' },
  completed: { label: 'Completed', color: '#22C55E', textColor: '#0B2B15' },
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

const toStatusKey = (value) => {
  const status = String(value || '').toLowerCase();
  if (['new', 'pending', 'confirmed'].includes(status)) return 'new';
  if (['preparing', 'processing'].includes(status)) return 'preparing';
  if (['shipped', 'in_transit', 'out_for_delivery'].includes(status)) return 'in_transit';
  if (['completed', 'delivered', 'received'].includes(status)) return 'completed';
  return 'new';
};

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState(ORDERS);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setErrorText('');
    try {
      // TODO: Confirm seller orders payload shape.
      const response = await getSellerOrders();
      const list = normalizeOrderList(response);
      const mapped = list.flatMap((order) => {
        const items = order?.items || order?.order_items || order?.products || [order];
        return items.map((item) => ({
          id: String(item?.id || item?._id || order?.id || order?._id || Math.random()),
          orderId: String(order?.id || order?._id || item?.order_id || item?.orderId || ''),
          itemId: String(item?.id || item?._id || ''),
          status: toStatusKey(item?.status || order?.status),
          name: item?.name || item?.part?.name || order?.name || 'Product',
          qty: Number(item?.quantity || item?.qty || order?.quantity || 1),
          total: Number(item?.total || item?.amount || order?.total || order?.amount || 0),
          orderedAt: item?.created_at || order?.created_at || 'Recently',
          image:
            item?.image ||
            item?.part?.images?.[0] ||
            item?.part?.image ||
            order?.image ||
            'https://picsum.photos/120?random=90',
        }));
      });
      setOrders(mapped.length ? mapped : []);
    } catch (error) {
      setErrorText(error?.message || 'Unable to load orders right now.');
      setOrders(ORDERS);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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
      Alert.alert('Missing order info', 'Unable to update this order right now.');
      return;
    }

    try {
      await confirmMarketplaceOrderItem(order.orderId, order.itemId);
      fetchOrders();
    } catch (error) {
      Alert.alert('Could not update order', error?.message || 'Please try again.');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <CenteredHeader title="Orders" />

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

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}

          {errorText ? (
            <AppText style={styles.errorText}>{errorText}</AppText>
          ) : null}

          {visibleOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.new;
            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Image source={{ uri: order.image }} style={styles.cardImage} />
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
                    <TouchableOpacity style={styles.outlineButton} activeOpacity={0.85}>
                      <AppText style={styles.outlineButtonText}>Chat with buyer</AppText>
                    </TouchableOpacity>
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
              </View>
            );
          })}
        </ScrollView>
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
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 12,
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
});

export default OrdersScreen;
