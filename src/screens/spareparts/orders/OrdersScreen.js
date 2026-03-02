import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FilterHorizontalIcon, Message01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { AppText, CenteredHeader, ScreenContainer, ScrollableTabs } from '../../../components';
import { darkTheme } from '../../../theme';

const TABS = [
  { key: 'all', label: 'All (4)' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'in_transit', label: 'In transit' },
  { key: 'completed', label: 'Completed' },
];

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

const OrdersScreen = () => {
  const [activeTab, setActiveTab] = useState('all');

  const visibleOrders = useMemo(() => {
    if (activeTab === 'all') {
      return ORDERS;
    }
    return ORDERS.filter((order) => order.status === activeTab);
  }, [activeTab]);

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
          <ScrollableTabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />
        </View>

        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
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
                  <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
                    <AppText style={styles.primaryButtonText}>Prepare package</AppText>
                  </TouchableOpacity>
                ) : null}

                {order.status === 'preparing' ? (
                  <View style={styles.prepRow}>
                    <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
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
