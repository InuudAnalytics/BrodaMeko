import React, { useMemo, useState, useCallback } from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  DollarCircleIcon,
  Invoice01Icon,
  Notification01Icon,
  PackageIcon,
  PlusSignIcon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { useAuth } from '../../../context';
import { getNotifications } from '../../../services/notifications.service';
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

const SellerDashboardScreen = ({ navigation, onTabPress }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
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
      { key: 'products', label: 'Total products', value: '48', icon: PackageIcon },
      { key: 'orders', label: 'Total orders', value: '156', icon: Invoice01Icon },
      { key: 'revenue', label: 'Revenue', value: formatCurrency(1500000), icon: DollarCircleIcon },
    ],
    []
  );

  const orders = useMemo(
    () => [
      { id: 'ord-1', product: 'Brake pad set', buyer: 'Chidi Okafor', price: 12500, status: 'Pending' },
      { id: 'ord-2', product: 'Car battery', buyer: 'Amaka Eze', price: 1500, status: 'Pending' },
      { id: 'ord-3', product: 'Spark plug', buyer: 'Tunde Bello', price: 30000, status: 'Delivered' },
      { id: 'ord-4', product: 'Radiator hose', buyer: 'Joy Nnamdi', price: 8200, status: 'Delivered' },
    ],
    []
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchUnread = async () => {
        try {
          const response = await getNotifications({ page: 1, limit: 1 });
          const payload = response?.data || response || {};
          const count = Number(payload?.unread_count || 0);
          if (active) setUnreadCount(Number.isFinite(count) ? count : 0);
        } catch {
          if (active) setUnreadCount(0);
        }
      };

      fetchUnread();

      return () => {
        active = false;
      };
    }, [])
  );

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
          {orders.slice(0, 5).map((order) => {
            const isDelivered = order.status.toLowerCase() === 'delivered';
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
                  <View style={[styles.statusPill, isDelivered ? styles.statusDelivered : styles.statusPending]}>
                    <AppText style={[styles.statusText, isDelivered ? styles.statusTextDelivered : styles.statusTextPending]}>
                      {order.status}
                    </AppText>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'space-between',
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
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: darkTheme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: SCREEN_BG,
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
});

export default SellerDashboardScreen;
