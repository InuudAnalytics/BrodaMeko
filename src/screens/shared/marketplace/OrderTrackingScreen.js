import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, PanResponder, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  cancelMarketplaceOrder,
  getMarketplaceOrder,
  receivedMarketplaceOrderItem,
} from '../../../services/marketplace.service';
import { getActiveCallForContext, startCall } from '../../../services/calls.service';
import { useAuth } from '../../../context';
import { darkTheme } from '../../../theme';
import { ROLES, ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
import { useUserLocation } from '../../../hooks/useUserLocation';
const PANEL_MAX_DOWN = 520;

const NIGERIA_FALLBACK_COORDS = { latitude: 9.0765, longitude: 7.3986 }; // Abuja

const formatNaira = value =>
  `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;
const toUnavailable = (value) => String(value || '').trim() || 'Unavailable';

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

const extractOrderItems = (data) => {
  const items = data?.items || data?.order_items || data?.products || [];
  return Array.isArray(items) ? items : [];
};

const readItemId = (item) => String(item?.id || item?._id || '').trim();

const readItemName = (item) => {
  const part = item?.part || item?.product || item?.spare_part || {};
  return String(part?.name || item?.part_name || item?.name || '').trim() || 'Unavailable';
};

const readItemStatus = (item) => String(item?.status || '').trim().toLowerCase();

const toTrackingItem = (item, index) => ({
  id: readItemId(item) || `item-${index}`,
  name: readItemName(item),
  status: readItemStatus(item),
});

const mapOrderToState = ({ data, prev, selectedItemId }) => {
  const items = extractOrderItems(data);
  const trackingItems = items.map(toTrackingItem);
  const preferredItemId = String(selectedItemId || prev?.itemId || '').trim();
  const activeItem =
    items.find((entry) => readItemId(entry) === preferredItemId) || items[0] || {};
  const itemId = readItemId(activeItem) || preferredItemId;
  const part = activeItem?.part || activeItem?.product || activeItem?.spare_part || {};
  const store = part?.store || data?.store || data?.seller || {};
  const itemStoreName = String(activeItem?.store_name || '').trim();
  const itemStorePhone = String(activeItem?.store_phone || '').trim();
  const itemStoreLat = Number.isFinite(Number(activeItem?.store_latitude))
    ? Number(activeItem.store_latitude)
    : null;
  const itemStoreLng = Number.isFinite(Number(activeItem?.store_longitude))
    ? Number(activeItem.store_longitude)
    : null;
  const computedSubtotal = items.reduce((sum, entry) => sum + toMoney(entry?.subtotal), 0);
  const backendTotal = toMoney(data?.total_amount, toMoney(data?.amount, 0));
  const backendServiceCharge = toMoney(
    data?.service_charge,
    backendTotal > computedSubtotal ? backendTotal - computedSubtotal : 0,
  );
  const productImages = Array.isArray(part?.images) && part.images.length
    ? part.images
    : Array.isArray(part?.image_urls) && part.image_urls.length
      ? part.image_urls
      : part?.image
        ? [part.image]
        : [];

  const resolvedProduct = {
    name: String(part?.name || activeItem?.part_name || activeItem?.name || '').trim(),
    price: part?.price ?? activeItem?.price ?? activeItem?.unit_price ?? null,
    shop: String(itemStoreName || store?.store_name || store?.name || '').trim(),
    storeId: String(part?.store_id || store?.id || data?.store_id || '').trim(),
    images: productImages,
    latitude: itemStoreLat ?? store?.coordinates?.latitude ?? part?.latitude ?? null,
    longitude: itemStoreLng ?? store?.coordinates?.longitude ?? part?.longitude ?? null,
    shopCoordinates: itemStoreLat !== null && itemStoreLng !== null
      ? { latitude: itemStoreLat, longitude: itemStoreLng }
      : (store?.coordinates || null),
  };

  const resolvedSeller = {
    name: String(itemStoreName || store?.store_name || store?.name || '').trim(),
    storeId: String(store?.id || part?.store_id || data?.store_id || '').trim(),
    userId: String(activeItem?.seller_id || part?.seller_id || store?.seller_id || '').trim(),
    avatar: String(store?.logo || store?.avatar || '').trim(),
    phone: itemStorePhone || String(store?.phone || store?.phone_number || '').trim(),
    isActive: Boolean(store?.is_active ?? true),
    coordinates: itemStoreLat !== null && itemStoreLng !== null
      ? { latitude: itemStoreLat, longitude: itemStoreLng }
      : (store?.coordinates || null),
  };

  const addressPayload = data?.delivery_address || data?.address || data?.delivery || {};
  const resolvedAddress =
    addressPayload?.street
      ? `${addressPayload.street}, ${addressPayload.city || ''} ${addressPayload.state || ''}`.trim()
      : String(data?.delivery_address_text || '').trim();
  const resolvedStatus = String(data?.status || readItemStatus(activeItem) || '').trim().toLowerCase();

  return {
    ...prev,
    product: resolvedProduct,
    seller: resolvedSeller,
    deliveryAddress: resolvedAddress,
    storeName: resolvedSeller.name,
    storeAddress: String(store?.address || resolvedAddress || '').trim(),
    storeInfo: String(store?.description || itemStorePhone || store?.phone || '').trim(),
    statusTimeline: resolvedStatus ? extractTimeline(resolvedStatus) : [],
    itemId: itemId || prev?.itemId || '',
    orderItems: trackingItems,
    subtotal: computedSubtotal || prev?.subtotal || 0,
    serviceCharge: backendServiceCharge || prev?.serviceCharge || 0,
    totalAmount: backendTotal || prev?.totalAmount || computedSubtotal + backendServiceCharge,
    orderStatus: resolvedStatus,
  };
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
  const { role } = useAuth();

  const [orderState, setOrderState] = useState({
    product: route?.params?.product || {},
    seller: route?.params?.seller || {},
    deliveryAddress: String(route?.params?.deliveryAddress || '').trim(),
    storeName: String(route?.params?.storeName || route?.params?.seller?.name || '').trim(),
    storeAddress: String(route?.params?.storeAddress || '').trim(),
    storeInfo: String(route?.params?.storeInfo || '').trim(),
    statusTimeline: Array.isArray(route?.params?.statusTimeline)
      ? route.params.statusTimeline
      : [],
    orderId: route?.params?.orderId || route?.params?.order_id || '',
    itemId: route?.params?.itemId || '',
    orderItems: [],
    subtotal: toMoney(route?.params?.subtotal),
    serviceCharge: toMoney(route?.params?.serviceCharge),
    totalAmount: toMoney(
      route?.params?.totalAmount,
      toMoney(route?.params?.subtotal) + toMoney(route?.params?.serviceCharge),
    ),
    orderStatus: String(route?.params?.status || '').trim().toLowerCase(),
  });
  const [orderData, setOrderData] = useState(null);
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
    orderItems,
    subtotal,
    serviceCharge,
    totalAmount,
    orderStatus,
  } = orderState;
  const isOrderCompleted = orderStatus === 'completed';
  const isOrderCancelled = orderStatus === 'cancelled';
  const isOrderDisputed = orderStatus === 'disputed';
  const isTerminalOrderState = isOrderCompleted || isOrderCancelled || isOrderDisputed;
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
  const hasProductPrice = Number.isFinite(Number(product?.price));
  const sellerInitial = String(seller?.name || '').trim().charAt(0).toUpperCase() || 'U';

  const animatePanelTo = useCallback((toValue) => {
    Animated.spring(panelY, {
      toValue,
      useNativeDriver: true,
      friction: 9,
      tension: 55,
    }).start();
  }, [panelY]);

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
    [animatePanelTo, panelY],
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
    const calleeId = String(seller?.userId || '').trim();
    if (!orderId || !calleeId) {
      AppAlert.alert('Call unavailable', 'Seller call session is not ready for this order yet.');
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
        calleeName: toUnavailable(seller?.name),
        contextLabel: `Order #${String(orderId).slice(0, 8)}`,
        contextType: 'order',
        contextId: orderId,
      });
    } catch (error) {
      console.warn('Order call start failed', {
        orderId,
        sellerId: seller?.id,
        statusCode: Number(error?.statusCode || 0),
        message: error?.message || '',
        data: error?.data || null,
      });
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
              calleeName: toUnavailable(seller?.name),
              participantName: toUnavailable(seller?.name),
              contextLabel: `Order #${String(orderId).slice(0, 8)}`,
              contextType: 'order',
              contextId: orderId,
            }
          );
          return;
        }
      } catch {
        // fall through to base error below
      }
      const statusCode = Number(error?.statusCode || 0);
      const safeMessage = String(error?.message || '').trim().toLowerCase();
      if (statusCode >= 500 || safeMessage.includes('internal server error')) {
        AppAlert.alert('Call unavailable', 'Could not start call right now. Please try again.');
        return;
      }
      AppAlert.alert('Call failed', error?.message || 'Could not start call.');
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
    if (!orderId) {
      AppAlert.alert('Missing order info', 'Could not open dispute form for this order.');
      return;
    }

    navigation.navigate(ROUTES.ORDER_DISPUTE, {
      orderId,
      itemId,
      orderItems: orderItems.map((entry) => ({
        id: entry?.id,
        name: entry?.name,
        status: entry?.status,
      })),
    });
  };

  const handleOpenDisputeDetail = () => {
    if (!orderId) {
      AppAlert.alert('Missing order info', 'Could not open dispute detail for this order.');
      return;
    }

    navigation.navigate(ROUTES.DISPUTE_DETAIL, {
      disputeType: 'order',
      sourceOrderId: orderId,
      sourceOrderItemId: itemId || '',
    });
  };

  const resolveStoreIdFromOrderPayload = (payload) => {
    const root = payload?.data || payload || {};
    const items = Array.isArray(root?.items) ? root.items : [];
    const firstItem = items[0] || {};
    const part = firstItem?.part || firstItem?.product || firstItem?.spare_part || {};
    const store = part?.store || root?.store || root?.seller || {};
    return String(
      root?.store_id ||
      store?.id ||
      firstItem?.store_id ||
      part?.store_id ||
      ''
    ).trim();
  };

  const handleReviewProduct = async () => {
    let storeId = String(
      product?.storeId ||
      seller?.storeId ||
      route?.params?.storeId ||
      route?.params?.store_id ||
      resolveStoreIdFromOrderPayload(orderData) ||
      ''
    ).trim();

    if (!storeId && orderId) {
      try {
        const response = await getMarketplaceOrder(orderId);
        storeId = resolveStoreIdFromOrderPayload(response);
      } catch {
        // fallback to error below
      }
    }

    if (!storeId) {
      AppAlert.alert('Review unavailable', 'Store reference is missing for this order.');
      return;
    }

    navigation.navigate('RateProduct', {
      storeId,
      orderId,
      sellerName: toUnavailable(seller?.name),
      productName: toUnavailable(product?.name),
      productImage: product?.images?.[0],
      seller,
      product,
    });
  };

  const handleCancelOrder = () => {
    if (!orderId) {
      AppAlert.alert('Missing order info', 'Could not cancel this order right now.');
      return;
    }

    AppAlert.alert(
      'Cancel order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMarketplaceOrder(orderId);
              AppAlert.alert('Cancelled', 'Order cancelled successfully.', [
                {
                  text: 'OK',
                  onPress: () => {
                    const safeRole = String(role || '').trim().toUpperCase();
                    if (safeRole === ROLES.MECH) {
                      navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: 'marketplace' });
                      return;
                    }
                    if (safeRole === ROLES.SPARE_PARTS_SELLER.toUpperCase()) {
                      navigation.navigate(ROUTES.SPARE_PARTS_TABS, { tab: 'home' });
                      return;
                    }
                    navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD);
                  },
                },
              ]);
            } catch (error) {
              AppAlert.alert('Could not cancel order', error?.message || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleOpenStoreDetails = () => {
    const storeId = String(
      product?.storeId || seller?.storeId || route?.params?.storeId || route?.params?.store_id || ''
    ).trim();
    if (!storeId) {
      return;
    }
    navigation.navigate(ROUTES.STORE_DETAILS, { storeId });
  };

  const applyOrderData = useMemo(
    () => (data, selectedId = '') => {
      setOrderState((prev) => mapOrderToState({ data, prev, selectedItemId: selectedId }));
    },
    []
  );

  const fetchOrderDetails = useMemo(
    () => async (preferredItemId = '') => {
      if (!orderId) {
        return;
      }

      setLoadingOrder(true);
      setOrderError('');
      try {
        const response = await getMarketplaceOrder(orderId);
        const data = normalizeOrderPayload(response);
        setOrderData(data);
        applyOrderData(data, preferredItemId || itemId);
      } catch (error) {
        setOrderError(error?.message || 'Could not load order details.');
      } finally {
        setLoadingOrder(false);
      }
    },
    [applyOrderData, itemId, orderId]
  );

  const handleSelectOrderItem = (selectedId) => {
    const safeSelectedId = String(selectedId || '').trim();
    if (!safeSelectedId || !orderData) {
      return;
    }
    applyOrderData(orderData, safeSelectedId);
  };

  useEffect(() => {
    fetchOrderDetails(itemId);
  }, [fetchOrderDetails, itemId]);

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
                  onRefresh={() => fetchOrderDetails(itemId)}
                  tintColor="transparent"
                  colors={['transparent']}
                />
              }
            >
            <View style={styles.timelineBlock}>
              {orderError ? (
                <AppText style={styles.errorText}>{orderError}</AppText>
              ) : null}
              {statusTimeline.length ? statusTimeline.map((step, index) => {
                const isCompleted =
                  typeof step?.completed === 'boolean'
                    ? step.completed
                    : index < statusTimeline.length - 1;
                return (
                  <View key={step.id || index} style={styles.timelineRow}>
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
                        {step.eta || 'ETA unavailable'}
                      </AppText>
                    </View>
                  </View>
                );
              }) : (
                <AppText style={styles.timelineEta}>Tracking unavailable</AppText>
              )}
            </View>

            <View style={styles.productCard}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} />
              ) : (
                <View style={styles.imagePlaceholder} />
              )}
              <View style={styles.productInfo}>
                <AppText style={styles.productName} numberOfLines={1}>
                  {toUnavailable(product?.name)}
                </AppText>
                <AppText style={styles.productShop} numberOfLines={1}>
                  {toUnavailable(product?.shop)}
                </AppText>
                <AppText style={styles.productPrice}>
                  {hasProductPrice ? formatNaira(product?.price) : 'Unavailable'}
                </AppText>
              </View>
            </View>
            <View style={styles.addressRow}>
              <AppText style={styles.addressLabel}>Delivery address</AppText>
              <AppText style={styles.addressValue}>{toUnavailable(deliveryAddress)}</AppText>
            </View>
            <TouchableOpacity style={styles.addressRow} activeOpacity={0.88} onPress={handleOpenStoreDetails}>
              <AppText style={styles.addressLabel}>Store</AppText>
              <AppText style={styles.addressValue}>{toUnavailable(storeName)}</AppText>
              <AppText style={styles.addressSubValue}>{toUnavailable(storeAddress)}</AppText>
              <AppText style={styles.addressHint}>{toUnavailable(storeInfo)}</AppText>
            </TouchableOpacity>
            <View style={styles.addressRow}>
              <AppText style={styles.addressHint}>
                You are currently seeing your live location and the store pin while delivery-driver routing is pending.
              </AppText>
            </View>
            {orderItems.length > 1 ? (
              <View style={styles.itemSelectorBlock}>
                <AppText style={styles.itemSelectorTitle}>Order items</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemSelectorWrap}>
                  {orderItems.map((entry) => {
                    const selected = entry.id === itemId;
                    return (
                      <TouchableOpacity
                        key={entry.id}
                        style={[styles.itemChip, selected ? styles.itemChipActive : null]}
                        activeOpacity={0.85}
                        onPress={() => handleSelectOrderItem(entry.id)}
                      >
                        <AppText style={[styles.itemChipName, selected ? styles.itemChipNameActive : null]} numberOfLines={1}>
                          {entry.name}
                        </AppText>
                        <AppText style={[styles.itemChipStatus, selected ? styles.itemChipStatusActive : null]}>
                          {entry.status || 'pending'}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

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
              <TouchableOpacity style={styles.sellerInfoTap} activeOpacity={0.88} onPress={handleOpenStoreDetails}>
                <View style={styles.sellerAvatarWrap}>
                  {seller?.avatar ? (
                    <Image
                      source={{ uri: resolveImageUri(seller.avatar) }}
                      style={styles.sellerAvatar}
                    />
                  ) : (
                    <View style={styles.sellerAvatarPlaceholder}>
                      <AppText style={styles.sellerAvatarText}>{sellerInitial}</AppText>
                    </View>
                  )}
                  {seller?.isActive ? <View style={styles.activeDot} /> : null}
                </View>
                <View style={styles.sellerInfo}>
                  <AppText style={styles.sellerName}>
                    {toUnavailable(seller?.name)}
                  </AppText>
                  <AppText style={styles.sellerStatus}>Active now</AppText>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.messageBtn}
                onPress={isOrderCompleted ? handleReviewProduct : handleCallSeller}
                activeOpacity={0.85}
              >
                {!isOrderCompleted ? (
                  <HugeiconsIcon
                    icon={CallIcon}
                    size={18}
                    color="#E6C714"
                    strokeWidth={2}
                  />
                ) : null}
                <AppText style={styles.messageText}>
                  {isOrderCompleted ? 'Review product' : 'Call seller'}
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              {isOrderDisputed ? (
                <TouchableOpacity
                  style={styles.disputeStatusCard}
                  activeOpacity={0.88}
                  onPress={handleOpenDisputeDetail}
                >
                  <AppText style={styles.disputeStatusTitle}>Order is disputed</AppText>
                  <AppText style={styles.disputeStatusBody}>View dispute status and support follow-up.</AppText>
                </TouchableOpacity>
              ) : null}
              <AppButton
                label="Confirm delivery"
                onPress={handleConfirmDelivery}
                disabled={loadingOrder || !itemId || isTerminalOrderState}
              />
              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={isOrderDisputed ? handleOpenDisputeDetail : ((isOrderCompleted || isOrderCancelled) ? handleReportIssue : handleCancelOrder)}
                activeOpacity={0.85}
              >
                <AppText style={styles.secondaryActionText}>
                  {isOrderDisputed ? 'View dispute status' : ((isOrderCompleted || isOrderCancelled) ? 'Report an issue' : 'Cancel order')}
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
  itemSelectorBlock: {
    marginBottom: darkTheme.spacing.md,
  },
  itemSelectorTitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 8,
  },
  itemSelectorWrap: {
    columnGap: 8,
    paddingRight: 10,
  },
  itemChip: {
    minWidth: 124,
    maxWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemChipActive: {
    borderColor: 'rgba(230,199,20,0.75)',
    backgroundColor: 'rgba(230,199,20,0.14)',
  },
  itemChipName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  itemChipNameActive: {
    color: '#F4DE7A',
  },
  itemChipStatus: {
    marginTop: 3,
    color: '#9CA3AF',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  itemChipStatusActive: {
    color: '#F4DE7A',
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
  sellerInfoTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
  disputeStatusCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.45)',
    backgroundColor: 'rgba(230,199,20,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  disputeStatusTitle: {
    color: '#F4DE7A',
    fontSize: 13,
    fontWeight: '700',
  },
  disputeStatusBody: {
    marginTop: 4,
    color: '#E5E7EB',
    fontSize: 12,
    lineHeight: 16,
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
