import React, { useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Animated, Image, RefreshControl, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  DollarCircleIcon,
  Invoice01Icon,
  Notification01Icon,
  PackageIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { AppText, NotificationPermissionChip, PersonalInfoAlert, PullToRefreshIndicator, ScreenContainer } from '../../../components';
import { useAuth, useNotifications } from '../../../context';
import { getMarketplaceOrder } from '../../../services/marketplace.service';
import { getNotifications } from '../../../services/notifications.service';
import { getSellerDashboardMetrics, getSellerOrders } from '../../../services/spareParts.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

const getFirstName = (user) => {
  const raw = user?.full_name || user?.fullName || user?.name || 'Seller';
  const first = String(raw || 'Seller')
    .trim()
    .split(/\s+/)
    .filter(Boolean)[0];
  return first || 'Seller';
};

const SCREEN_BG = '#000033';

const readUnreadCount = (payload) => {
  const count = Number(
    payload?.unread_count ??
      payload?.data?.unread_count ??
      payload?.meta?.unread_count ??
      0,
  );
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
};

const normalizeList = (payload) => {
  if (!payload) return [];
  const root = payload?.data || payload;
  if (Array.isArray(root)) return root;
  if (Array.isArray(root?.data)) return root.data;
  if (Array.isArray(root?.orders)) return root.orders;
  if (Array.isArray(root?.items)) return root.items;
  if (Array.isArray(root?.results)) return root.results;
  return [];
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeStatusLabel = (value) => {
  const status = String(value || '').trim().toLowerCase();
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
    return 'Cancelled';
  }
  if (['completed', 'delivered', 'received', 'confirmed'].includes(status)) {
    return 'Delivered';
  }
  if (['preparing', 'processing'].includes(status)) {
    return 'Preparing';
  }
  if (['shipped', 'in_transit', 'out_for_delivery', 'ready_for_pickup'].includes(status)) {
    return 'In transit';
  }
  return 'Pending';
};

const SellerDashboardScreen = ({ navigation, onTabPress }) => {
  const { user } = useAuth();
  const { unreadTick, promptPermissionIfNeeded } = useNotifications();
  const [unreadCount, setUnreadCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenueAmount, setRevenueAmount] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pullDistance = React.useRef(new Animated.Value(0)).current;
  const firstName = getFirstName(user);
  const avatarUri =
    user?.avatar ||
    user?.avatar_url ||
    user?.profile_photo ||
    user?.image ||
    user?.photo_url ||
    '';

  const stats = useMemo(
    () => [
      { key: 'products', label: 'Total products', value: String(productCount), icon: PackageIcon },
      { key: 'orders', label: 'Total orders', value: String(orderCount), icon: Invoice01Icon },
      { key: 'revenue', label: 'Revenue', value: formatCurrency(revenueAmount), icon: DollarCircleIcon },
    ],
    [orderCount, productCount, revenueAmount]
  );

  const fetchUnread = useCallback(async () => {
    try {
      const response = await getNotifications({ page: 1, limit: 1 });
      const payload = response || {};
      setUnreadCount(readUnreadCount(payload));
    } catch {
      setUnreadCount(0);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const sellerId = String(user?.id || user?._id || '').trim();
      const [metricsResponse, ordersResponse] = await Promise.all([
        getSellerDashboardMetrics(),
        getSellerOrders(),
      ]);
      const sellerOrders = normalizeList(ordersResponse);
      const metricsRoot = metricsResponse?.data || metricsResponse || {};
      const metricsData = metricsRoot?.data || metricsRoot || {};

      setProductCount(toNumber(metricsData?.total_products, 0));
      setOrderCount(toNumber(metricsData?.total_orders, sellerOrders.length));
      setRevenueAmount(toNumber(metricsData?.total_revenue, 0));

      const orderDetails = await Promise.all(
        sellerOrders.map((entry) => {
          const id = String(entry?.id || entry?._id || '').trim();
          if (!id) return null;
          return getMarketplaceOrder(id).catch(() => null);
        })
      );

      const flattenedItems = [];
      orderDetails.forEach((detailResponse, index) => {
        const root = detailResponse?.data || detailResponse || {};
        const detail = root?.data || root || {};
        const items = Array.isArray(detail?.items) ? detail.items : [];
        const scopedItems = items.filter((item) => {
          if (!sellerId) return true;
          return String(item?.seller_id || '').trim() === sellerId;
        });
        const sourceOrder = sellerOrders[index] || {};
        const buyerName = String(sourceOrder?.buyer_name || detail?.buyer_name || '').trim() || 'Buyer';
        const createdAtRaw = sourceOrder?.created_at || detail?.created_at || '';

        scopedItems.forEach((item) => {
          flattenedItems.push({
            id: `${String(detail?.id || sourceOrder?.id || '')}:${String(item?.id || '')}`,
            product: String(item?.part_name || item?.part?.name || '').trim() || 'Unavailable',
            buyer: buyerName,
            price: Number(item?.subtotal || item?.unit_price || 0),
            status: normalizeStatusLabel(item?.status || sourceOrder?.status),
            createdAtMs: Number.isFinite(Date.parse(String(createdAtRaw || '').trim()))
              ? Date.parse(String(createdAtRaw || '').trim())
              : 0,
          });
        });
      });

      const topRecentOrders = flattenedItems
        .sort((a, b) => Number(b?.createdAtMs || 0) - Number(a?.createdAtMs || 0))
        .slice(0, 5);

      setRecentOrders(topRecentOrders);
    } catch {
      setProductCount(0);
      setOrderCount(0);
      setRevenueAmount(0);
      setRecentOrders([]);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user?.id, user?._id]);

  useFocusEffect(
    useCallback(() => {
      promptPermissionIfNeeded?.('seller_dashboard_focus');
      return undefined;
    }, [promptPermissionIfNeeded])
  );

  useFocusEffect(
    useCallback(() => {
      fetchUnread(unreadTick);
      return undefined;
    }, [fetchUnread, unreadTick])
  );

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      return undefined;
    }, [fetchDashboardData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchUnread(), fetchDashboardData()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDashboardData, fetchUnread]);

  const handleSeeMore = () => {
    if (typeof onTabPress === 'function') {
      onTabPress('orders');
      return;
    }
    navigation.navigate(ROUTES.SPARE_PARTS_TABS, { tab: 'orders' });
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <PersonalInfoAlert />
      <View style={styles.listWrap}>
        <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
        <Animated.ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            const offsetY = event.nativeEvent?.contentOffset?.y || 0;
            const pullValue = offsetY < 0 ? Math.min(120, -offsetY) : 0;
            pullDistance.setValue(pullValue);
          }}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={darkTheme.colors.accent}
              colors={[darkTheme.colors.accent]}
              progressBackgroundColor={darkTheme.colors.background}
            />
          }
        >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <AppText style={styles.avatarFallback}>{firstName.charAt(0).toUpperCase()}</AppText>
              )}
            </View>
            <View style={styles.greetingTextWrap}>
              <AppText style={styles.greetingTitle}>Good morning {firstName}</AppText>
              <AppText variant="muted" style={styles.greetingSubtitle}>
                Welcome back
              </AppText>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton} activeOpacity={0.85} onPress={() => navigation.navigate('Notifications')}>
            <HugeiconsIcon icon={Notification01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2} />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <AppText style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</AppText>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
        <NotificationPermissionChip style={styles.notificationChip} />

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.key} style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <HugeiconsIcon icon={stat.icon} size={18} color={darkTheme.colors.accent} strokeWidth={2} />
              </View>
              <AppText style={styles.statValue}>{stat.value}</AppText>
              <AppText variant="muted" style={styles.statLabel}>
                {stat.label}
              </AppText>
            </View>
          ))}
        </View>

        <AppText style={styles.sectionTitle}>Quick actions</AppText>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(ROUTES.SPARE_PARTS_ADD_PRODUCT)}
          >
            <View style={styles.actionIcon}>
              <HugeiconsIcon icon={PlusSignIcon} size={18} color={darkTheme.colors.background} strokeWidth={2.2} />
            </View>
            <AppText style={styles.actionLabel}>Add product</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={handleSeeMore}
          >
            <View style={styles.actionIcon}>
              <HugeiconsIcon icon={Invoice01Icon} size={18} color={darkTheme.colors.background} strokeWidth={2.2} />
            </View>
            <AppText style={styles.actionLabel}>View orders</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionRow}>
          <AppText style={styles.sectionTitle}>Recent orders</AppText>
          <TouchableOpacity activeOpacity={0.85} onPress={handleSeeMore}>
            <AppText style={styles.seeMore}>See more</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.ordersList}>
          {loadingDashboard ? (
            <View style={styles.dashboardLoader}>
              <ActivityIndicator size="small" color={darkTheme.colors.accent} />
            </View>
          ) : null}
          {!loadingDashboard && !recentOrders.length ? (
            <AppText variant="muted" style={styles.emptyOrdersText}>
              No recent orders yet.
            </AppText>
          ) : null}
          {recentOrders.map((order) => {
            const statusLower = String(order.status || '').toLowerCase();
            const isDelivered = statusLower === 'delivered';
            const isCancelled = statusLower === 'cancelled';
            return (
              <View key={order.id} style={styles.orderRow}>
                <View style={styles.orderIconWrap}>
                  <HugeiconsIcon icon={PackageIcon} size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
                </View>
                <View style={styles.orderInfo}>
                  <AppText style={styles.orderTitle}>{order.product}</AppText>
                  <AppText variant="muted" style={styles.orderSubtitle}>
                    {order.buyer}
                  </AppText>
                </View>
                <View style={styles.orderMeta}>
                  <AppText style={styles.orderPrice}>{formatCurrency(order.price)}</AppText>
                  <View
                    style={[
                      styles.statusPill,
                      isCancelled ? styles.statusCancelled : (isDelivered ? styles.statusDelivered : styles.statusPending),
                    ]}
                  >
                    <AppText
                      style={[
                        styles.statusText,
                        isCancelled ? styles.statusTextCancelled : (isDelivered ? styles.statusTextDelivered : styles.statusTextPending),
                      ]}
                    >
                      {order.status}
                    </AppText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
        </Animated.ScrollView>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  listWrap: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  notificationChip: {
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarFallback: {
    color: darkTheme.colors.text,
    fontSize: 14,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  greetingTextWrap: {
    marginLeft: 12,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bellBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: SCREEN_BG,
    zIndex: 2,
  },
  bellBadgeText: {
    color: '#1A1A1A',
    fontSize: 10,
    lineHeight: 12,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  greetingTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  greetingSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    marginTop: 18,
    flexDirection: 'row',
    columnGap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  statLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    lineHeight: 14,
  },
  sectionTitle: {
    marginTop: 18,
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    columnGap: 12,
  },
  actionCard: {
    flex: 1,
    minHeight: 82,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: darkTheme.colors.text,
    fontSize: 12,
  },
  sectionRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeMore: {
    color: darkTheme.colors.accent,
    fontSize: 12,
  },
  ordersList: {
    marginTop: 8,
    rowGap: 12,
  },
  dashboardLoader: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyOrdersText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    paddingVertical: 8,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  orderSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  statusPill: {
    marginTop: 6,
    minWidth: 72,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statusPending: {
    backgroundColor: 'rgba(166,190,74,0.95)',
  },
  statusDelivered: {
    backgroundColor: 'rgba(22,140,63,0.95)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239,68,68,0.95)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  statusTextPending: {
    color: '#1A1A1A',
  },
  statusTextDelivered: {
    color: '#F5F5F5',
  },
  statusTextCancelled: {
    color: '#F5F5F5',
  },
});

export default SellerDashboardScreen;
