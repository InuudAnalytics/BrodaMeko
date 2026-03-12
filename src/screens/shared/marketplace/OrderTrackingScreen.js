import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Linking, PanResponder, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  CallIcon,
} from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppText,
  OpenStreetMapView,
  PullToRefreshIndicator,
  ScreenContainer,
} from '../../../components';
import {
  getMarketplaceOrder,
  receivedMarketplaceOrderItem,
} from '../../../services/marketplace.service';
import { darkTheme } from '../../../theme';
import AppAlert from '../../../components/AppAlert';
import { useUserLocation } from '../../../hooks/useUserLocation';
const PANEL_MAX_DOWN = 520;

const fallbackTimeline = [
  { id: 'confirmed', label: 'Order confirmed', eta: 'Today � 10:15 AM' },
  {
    id: 'preparing',
    label: 'Seller preparing package',
    eta: 'Today � 11:30 AM',
  },
  { id: 'out_for_delivery', label: 'Out for delivery', eta: 'Today � 1:20 PM' },
  { id: 'delivered', label: 'Delivered', eta: 'Today � 3:30 PM' },
];

const fallbackProduct = {
  name: 'LED headlights',
  price: 2500,
  shop: 'Okon spare part hub',
  images: ['https://picsum.photos/300?random=55'],
};

const fallbackSeller = {
  name: 'Okon spare part hub',
  avatar: 'https://i.pravatar.cc/100?img=12',
  phone: '',
  isActive: true,
};

const fallbackAddress = 'No 1, Onireke street, Agbabiaka';
const NIGERIA_FALLBACK_COORDS = { latitude: 9.0765, longitude: 7.3986 }; // Abuja

const formatNaira = value =>
  `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const toMoney = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isWithinNigeria = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= 4.0 &&
  latitude <= 14.5 &&
  longitude >= 2.5 &&
  longitude <= 15.0;

const buildStoreCoordinates = ({ route, orderState }) => {
  const fromRoute = route?.params?.shopCoordinates || {};
  const fromSeller = orderState?.seller?.coordinates || {};
  const fromProduct = orderState?.product?.shopCoordinates || orderState?.product?.storeCoordinates || {};
  const latitude =
    toFiniteNumber(fromRoute?.latitude) ??
    toFiniteNumber(fromRoute?.lat) ??
    toFiniteNumber(fromSeller?.latitude) ??
    toFiniteNumber(fromSeller?.lat) ??
    toFiniteNumber(fromProduct?.latitude) ??
    toFiniteNumber(fromProduct?.lat) ??
    toFiniteNumber(orderState?.product?.latitude) ??
    toFiniteNumber(route?.params?.latitude);
  const longitude =
    toFiniteNumber(fromRoute?.longitude) ??
    toFiniteNumber(fromRoute?.lng) ??
    toFiniteNumber(fromSeller?.longitude) ??
    toFiniteNumber(fromSeller?.lng) ??
    toFiniteNumber(fromProduct?.longitude) ??
    toFiniteNumber(fromProduct?.lng) ??
    toFiniteNumber(orderState?.product?.longitude) ??
    toFiniteNumber(route?.params?.longitude);
  if (isWithinNigeria(latitude, longitude)) {
    return { latitude, longitude };
  }
  return NIGERIA_FALLBACK_COORDS;
};

const normalizeOrderPayload = (payload) => {
  if (!payload) return null;
  if (payload?.data) return payload.data;
  return payload;
};

const extractTimeline = (statusValue) => {
  const status = String(statusValue || '').toLowerCase();
  const steps = [
    { id: 'confirmed', label: 'Order confirmed' },
    { id: 'preparing', label: 'Seller preparing package' },
    { id: 'out_for_delivery', label: 'Out for delivery' },
    { id: 'delivered', label: 'Delivered' },
  ];

  const statusMap = {
    confirmed: 0,
    pending: 0,
    new: 0,
    preparing: 1,
    processing: 1,
    shipped: 2,
    in_transit: 2,
    out_for_delivery: 2,
    delivered: 3,
    completed: 3,
    received: 3,
  };

  const currentIndex = statusMap[status] ?? 0;
  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    eta: '',
  }));
};

const OrderTrackingScreen = ({ navigation, route }) => {
  const panelY = useRef(new Animated.Value(0)).current;
  const pullDistance = useRef(new Animated.Value(0)).current;
  const panelYRef = useRef(0);
  const dragStartRef = useRef(0);
  const { location, permissionStatus, requestPermission, refreshOnce } = useUserLocation();

  const [orderState, setOrderState] = useState({
    product: route?.params?.product || fallbackProduct,
    seller: route?.params?.seller || fallbackSeller,
    deliveryAddress: route?.params?.deliveryAddress || fallbackAddress,
    storeName: route?.params?.storeName || route?.params?.seller?.name || fallbackSeller.name,
    storeAddress: route?.params?.storeAddress || fallbackAddress,
    storeInfo: route?.params?.storeInfo || 'Store information unavailable.',
    statusTimeline: Array.isArray(route?.params?.statusTimeline)
      ? route.params.statusTimeline
      : fallbackTimeline,
    orderId: route?.params?.orderId || route?.params?.order_id || '',
    itemId: route?.params?.itemId || '',
    subtotal: toMoney(route?.params?.subtotal),
    serviceCharge: toMoney(route?.params?.serviceCharge),
    totalAmount: toMoney(
      route?.params?.totalAmount,
      toMoney(route?.params?.subtotal) + toMoney(route?.params?.serviceCharge),
    ),
  });
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const {
    product,
    seller,
    deliveryAddress,
    storeName,
    storeAddress,
    storeInfo,
    statusTimeline,
    orderId,
    itemId,
    subtotal,
    serviceCharge,
    totalAmount,
  } = orderState;
  const shopCoordinates = useMemo(
    () => buildStoreCoordinates({ route, orderState }),
    [orderState, route]
  );
  // TODO: replace map fallback with backend-provided delivery-driver coordinates for live courier tracking.
  const liveCoordinates = useMemo(() => {
    if (permissionStatus !== 'granted') {
      return null;
    }
    const latitude = toFiniteNumber(location?.latitude);
    const longitude = toFiniteNumber(location?.longitude);
    if (latitude === null || longitude === null) {
      return null;
    }
    return { latitude, longitude };
  }, [location?.latitude, location?.longitude, permissionStatus]);
  const mapOrigin = liveCoordinates || shopCoordinates;

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
  const imageUri = resolveImageUri(product?.images?.[0]);

  const animatePanelTo = toValue => {
    Animated.spring(panelY, {
      toValue,
      useNativeDriver: true,
      friction: 9,
      tension: 55,
    }).start();
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderGrant: () => {
          dragStartRef.current = panelYRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.max(
            0,
            Math.min(PANEL_MAX_DOWN, dragStartRef.current + gesture.dy),
          );
          panelY.setValue(next);
        },
        onPanResponderRelease: (_, gesture) => {
          const next = panelYRef.current + gesture.dy;
          if (next > PANEL_MAX_DOWN * 0.45) {
            animatePanelTo(PANEL_MAX_DOWN);
          } else {
            animatePanelTo(0);
          }
        },
      }),
    [panelY],
  );

  useEffect(() => {
    const id = panelY.addListener(({ value }) => {
      panelYRef.current = value;
    });
    return () => panelY.removeListener(id);
  }, [panelY]);

  useEffect(() => {
    if (permissionStatus === 'unknown') {
      requestPermission();
      return;
    }
    if (permissionStatus === 'granted') {
      refreshOnce();
    }
  }, [permissionStatus, refreshOnce, requestPermission]);

  const handleCallSeller = async () => {
    const phone = String(seller?.phone || '').trim();
    if (!phone) {
      AppAlert.alert('Number unavailable', 'Seller phone number is not available yet.');
      return;
    }
    const url = `tel:${phone}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        AppAlert.alert('Call unavailable', 'This device cannot place calls right now.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      AppAlert.alert('Call failed', 'Could not start call.');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!orderId || !itemId) {
      AppAlert.alert('Missing order info', 'Could not confirm delivery for this order.');
      return;
    }

    try {
      await receivedMarketplaceOrderItem(orderId, itemId);
      navigation.navigate('OrderDeliveredSuccess', {
        productName: product?.name,
        productImage: product?.images?.[0],
        sellerName: seller?.name,
        orderId,
        storeId: product?.storeId || seller?.storeId || '',
      });
    } catch (error) {
      AppAlert.alert('Could not confirm delivery', error?.message || 'Please try again.');
    }
  };

  const handleReportIssue = () => {
    AppAlert.alert('Report issue', 'Issue reporting will be wired soon.');
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        return;
      }

      setLoadingOrder(true);
      setOrderError('');
      try {
        const response = await getMarketplaceOrder(orderId);
        const data = normalizeOrderPayload(response);
        const items = data?.items || data?.order_items || data?.products || [];
        const item = items?.[0] || {};
        const part = item?.part || item?.product || item?.spare_part || {};
        const store = part?.store || data?.store || data?.seller || {};
        const computedSubtotal = items.reduce((sum, entry) => sum + toMoney(entry?.subtotal), 0);
        const backendTotal = toMoney(data?.total_amount, toMoney(data?.amount, 0));
        const backendServiceCharge = toMoney(
          data?.service_charge,
          backendTotal > computedSubtotal ? backendTotal - computedSubtotal : 0,
        );

        const resolvedProduct = {
          name: part?.name || item?.name || fallbackProduct.name,
          price: part?.price || item?.price || fallbackProduct.price,
          shop: store?.store_name || store?.name || fallbackProduct.shop,
          storeId: String(part?.store_id || store?.id || data?.store_id || '').trim(),
          images: part?.images || part?.image_urls || part?.image ? [part.image] : fallbackProduct.images,
          latitude: store?.coordinates?.latitude ?? part?.latitude ?? null,
          longitude: store?.coordinates?.longitude ?? part?.longitude ?? null,
          shopCoordinates: store?.coordinates || null,
        };

        const resolvedSeller = {
          name: store?.store_name || store?.name || fallbackSeller.name,
          storeId: String(store?.id || part?.store_id || data?.store_id || '').trim(),
          avatar: store?.logo || store?.avatar || fallbackSeller.avatar,
          phone: String(store?.phone || store?.phone_number || '').trim(),
          isActive: Boolean(store?.is_active ?? true),
          coordinates: store?.coordinates || null,
        };

        const addressPayload = data?.delivery_address || data?.address || data?.delivery || {};
        const resolvedAddress =
          addressPayload?.street
            ? `${addressPayload.street}, ${addressPayload.city || ''} ${addressPayload.state || ''}`.trim()
            : data?.delivery_address_text || fallbackAddress;

        setOrderState((prev) => ({
          ...prev,
          product: resolvedProduct,
          seller: resolvedSeller,
          deliveryAddress: resolvedAddress,
          storeName: resolvedSeller.name,
          storeAddress: store?.address || resolvedAddress || prev.storeAddress,
          storeInfo: store?.description || store?.phone || prev.storeInfo,
          statusTimeline: extractTimeline(item?.status || data?.status),
          itemId: String(item?.id || item?._id || prev.itemId || '').trim(),
          subtotal: computedSubtotal || prev.subtotal,
          serviceCharge: backendServiceCharge || prev.serviceCharge,
          totalAmount: backendTotal || prev.totalAmount || computedSubtotal + backendServiceCharge,
        }));
      } catch (error) {
        setOrderError(error?.message || 'Could not load order details.');
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <View style={styles.root}>
      <ScreenContainer
        padded={false}
        edges={['top', 'left', 'right']}
        style={styles.screen}
      >
        <View style={styles.mapBackdrop}>
          <OpenStreetMapView
            latitude={mapOrigin.latitude}
            longitude={mapOrigin.longitude}
            otherLatitude={shopCoordinates.latitude}
            otherLongitude={shopCoordinates.longitude}
            showRoute={Boolean(liveCoordinates)}
            currentPinColor={darkTheme.colors.accent}
            targetPinColor="#FF2D2D"
          />
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={22}
                color={darkTheme.colors.accent}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <AppText style={styles.topTitle}>Order tracking</AppText>
            <View style={styles.topSpacer} />
          </View>
        </View>

        <Animated.View
          style={[styles.bottomSheet, { transform: [{ translateY: panelY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <View style={styles.sheetListWrap}>
            <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loadingOrder} />
            <Animated.ScrollView
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
              onScroll={event => {
                const offsetY = event.nativeEvent.contentOffset.y;
                const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
                pullDistance.setValue(pullValue);
              }}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={loadingOrder}
                  onRefresh={async () => {
                    if (!orderId) {
                      return;
                    }
                    setLoadingOrder(true);
                    setOrderError('');
                    try {
                      const response = await getMarketplaceOrder(orderId);
                      const data = normalizeOrderPayload(response);
                      const items = data?.items || data?.order_items || data?.products || [];
                      const item = items?.[0] || {};
                      const part = item?.part || item?.product || item?.spare_part || {};
                      const store = part?.store || data?.store || data?.seller || {};
                      const computedSubtotal = items.reduce((sum, entry) => sum + toMoney(entry?.subtotal), 0);
                      const backendTotal = toMoney(data?.total_amount, toMoney(data?.amount, 0));
                      const backendServiceCharge = toMoney(
                        data?.service_charge,
                        backendTotal > computedSubtotal ? backendTotal - computedSubtotal : 0,
                      );

                      const resolvedProduct = {
                        name: part?.name || item?.name || fallbackProduct.name,
                        price: part?.price || item?.price || fallbackProduct.price,
                        shop: store?.store_name || store?.name || fallbackProduct.shop,
                        storeId: String(part?.store_id || store?.id || data?.store_id || '').trim(),
                        images: part?.images || part?.image_urls || part?.image ? [part.image] : fallbackProduct.images,
                        latitude: store?.coordinates?.latitude ?? part?.latitude ?? null,
                        longitude: store?.coordinates?.longitude ?? part?.longitude ?? null,
                        shopCoordinates: store?.coordinates || null,
                      };

                      const resolvedSeller = {
                        name: store?.store_name || store?.name || fallbackSeller.name,
                        storeId: String(store?.id || part?.store_id || data?.store_id || '').trim(),
                        avatar: store?.logo || store?.avatar || fallbackSeller.avatar,
                        phone: String(store?.phone || store?.phone_number || '').trim(),
                        isActive: Boolean(store?.is_active ?? true),
                        coordinates: store?.coordinates || null,
                      };

                      const addressPayload = data?.delivery_address || data?.address || data?.delivery || {};
                      const resolvedAddress =
                        addressPayload?.street
                          ? `${addressPayload.street}, ${addressPayload.city || ''} ${addressPayload.state || ''}`.trim()
                          : data?.delivery_address_text || fallbackAddress;

                      setOrderState((prev) => ({
                        ...prev,
                        product: resolvedProduct,
                        seller: resolvedSeller,
                        deliveryAddress: resolvedAddress,
                        storeName: resolvedSeller.name,
                        storeAddress: store?.address || resolvedAddress || prev.storeAddress,
                        storeInfo: store?.description || store?.phone || prev.storeInfo,
                        statusTimeline: extractTimeline(item?.status || data?.status),
                        itemId: String(item?.id || item?._id || prev.itemId || '').trim(),
                        subtotal: computedSubtotal || prev.subtotal,
                        serviceCharge: backendServiceCharge || prev.serviceCharge,
                        totalAmount: backendTotal || prev.totalAmount || computedSubtotal + backendServiceCharge,
                      }));
                    } catch (error) {
                      setOrderError(error?.message || 'Could not load order details.');
                    } finally {
                      setLoadingOrder(false);
                    }
                  }}
                  tintColor="transparent"
                  colors={['transparent']}
                />
              }
            >
            <View style={styles.timelineBlock}>
              {orderError ? (
                <AppText style={styles.errorText}>{orderError}</AppText>
              ) : null}
              {statusTimeline.map((step, index) => {
                const isCompleted =
                  typeof step?.completed === 'boolean'
                    ? step.completed
                    : index < statusTimeline.length - 1;
                return (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.timelineMarker}>
                    <View
                      style={[
                        styles.timelineCircle,
                        isCompleted
                          ? styles.timelineCircleActive
                          : styles.timelineCircleInactive,
                      ]}
                    >
                      <AppText
                        style={[
                          styles.timelineCheck,
                          isCompleted
                            ? styles.timelineCheckActive
                            : styles.timelineCheckInactive,
                        ]}
                      >
                        {'\u2713'}
                      </AppText>
                    </View>
                    {index < statusTimeline.length - 1 ? (
                      <View
                        style={[
                          styles.timelineLine,
                          isCompleted
                            ? styles.timelineLineActive
                            : styles.timelineLineInactive,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={styles.timelineContent}>
                    <AppText style={styles.timelineTitle}>{step.label}</AppText>
                    <AppText style={styles.timelineEta}>
                      {step.eta || 'ETA coming soon'}
                    </AppText>
                  </View>
                </View>
                );
              })}
            </View>

            <View style={styles.productCard}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} />
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
            <View style={styles.addressRow}>
              <AppText style={styles.addressLabel}>Delivery address</AppText>
              <AppText style={styles.addressValue}>{deliveryAddress}</AppText>
            </View>
            <View style={styles.addressRow}>
              <AppText style={styles.addressLabel}>Store</AppText>
              <AppText style={styles.addressValue}>{storeName}</AppText>
              <AppText style={styles.addressSubValue}>{storeAddress}</AppText>
              <AppText style={styles.addressHint}>{storeInfo}</AppText>
            </View>
            <View style={styles.addressRow}>
              <AppText style={styles.addressHint}>
                You are currently seeing your live location and the store pin while delivery-driver routing is pending.
              </AppText>
            </View>

            <View style={styles.summaryCard}>
              <AppText style={styles.summaryTitle}>Payment summary</AppText>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Subtotal</AppText>
                <AppText style={styles.summaryValue}>{formatNaira(subtotal)}</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Service fee</AppText>
                <AppText style={styles.summaryValue}>{formatNaira(serviceCharge)}</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText style={styles.totalLabel}>Total paid</AppText>
                <AppText style={styles.totalValue}>{formatNaira(totalAmount)}</AppText>
              </View>
            </View>

            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatarWrap}>
                {seller?.avatar ? (
                  <Image
                    source={{ uri: resolveImageUri(seller.avatar) }}
                    style={styles.sellerAvatar}
                  />
                ) : (
                  <View style={styles.sellerAvatarPlaceholder} />
                )}
                {seller?.isActive ? <View style={styles.activeDot} /> : null}
              </View>
              <View style={styles.sellerInfo}>
                <AppText style={styles.sellerName}>
                  {seller?.name || 'Seller'}
                </AppText>
                <AppText style={styles.sellerStatus}>Active now</AppText>
              </View>
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={handleCallSeller}
                activeOpacity={0.85}
              >
                <HugeiconsIcon
                  icon={CallIcon}
                  size={18}
                  color="#E6C714"
                  strokeWidth={2}
                />
                <AppText style={styles.messageText}>Call seller</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <AppButton
                label="Confirm delivery"
                onPress={handleConfirmDelivery}
                disabled={loadingOrder}
              />
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handleReportIssue}
                activeOpacity={0.85}
              >
                <AppText style={styles.secondaryActionText}>
                  Report an issue
                </AppText>
              </TouchableOpacity>
            </View>
            </Animated.ScrollView>
          </View>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
};
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  screen: { flex: 1, backgroundColor: darkTheme.colors.background },
  mapBackdrop: { flex: 1, backgroundColor: '#2B2B31', overflow: 'hidden' },
  topBar: {
    marginTop: darkTheme.spacing.xl,
    paddingHorizontal: darkTheme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  topSpacer: {
    width: 38,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 420,
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#000033',
    paddingBottom: darkTheme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 76,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.65)',
    marginTop: 10,
    marginBottom: darkTheme.spacing.md,
  },
  sheetContent: {
    paddingHorizontal: darkTheme.spacing.lg,
    paddingBottom: 60,
  },
  sheetListWrap: {
    width: '100%',
  },
  timelineBlock: {
    marginBottom: darkTheme.spacing.lg,
  },
  errorText: {
    color: '#F87171',
    fontSize: 12,
    marginBottom: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 12,
    marginBottom: 14,
  },
  timelineMarker: {
    width: 46,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCircleActive: {
    backgroundColor: '#E6C714',
  },
  timelineCircleInactive: {
    backgroundColor: '#3A3A52',
  },
  timelineCheck: {
    fontSize: 18,
    fontWeight: '700',
  },
  timelineCheckActive: {
    color: '#0B0B0B',
  },
  timelineCheckInactive: {
    color: '#FFFFFF',
  },
  timelineLine: {
    width: 2,
    height: 28,
    marginTop: 6,
  },
  timelineLineActive: {
    backgroundColor: '#E6C714',
  },
  timelineLineInactive: {
    backgroundColor: '#3A3A52',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timelineEta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 12,
    marginBottom: darkTheme.spacing.md,
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
  addressRow: {
    marginBottom: darkTheme.spacing.lg,
  },
  addressLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  addressValue: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 6,
  },
  addressSubValue: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 2,
  },
  addressHint: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 12,
    marginBottom: darkTheme.spacing.lg,
  },
  sellerAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeDot: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#1A1A4A',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sellerStatus: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.45)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  messageText: {
    color: '#E6C714',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    marginBottom: darkTheme.spacing.lg,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  totalLabel: {
    color: '#E6C714',
    fontSize: 12,
    fontWeight: '600',
  },
  totalValue: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryAction: {
    marginTop: 10,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default OrderTrackingScreen;



