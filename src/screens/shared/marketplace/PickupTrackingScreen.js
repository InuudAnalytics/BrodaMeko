import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Image, Linking, PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, CallIcon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, OpenStreetMapView, ScreenContainer } from '../../../components';
import { cancelMarketplaceOrder, getMarketplaceOrder } from '../../../services/marketplace.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';
import AppAlert from '../../../components/AppAlert';
import { useUserLocation } from '../../../hooks/useUserLocation';
const PANEL_MAX_DOWN = 360;

const formatNaira = value => `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const toMoney = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const resolveImageUri = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return String(value?.url || value?.secure_url || value?.uri || value?.path || '').trim();
  }
  return '';
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const NIGERIA_FALLBACK_COORDS = { latitude: 9.0765, longitude: 7.3986 }; // Abuja
const isWithinNigeria = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  latitude >= 4.0 &&
  latitude <= 14.5 &&
  longitude >= 2.5 &&
  longitude <= 15.0;

const extractShopCoordinates = ({ route, product, seller }) => {
  const fromRoute = route?.params?.shopCoordinates || {};
  const fromProduct = product?.shopCoordinates || product?.storeCoordinates || product?.store?.coordinates || {};
  const fromSeller = seller?.coordinates || {};

  const latitude =
    toFiniteNumber(fromRoute?.latitude) ??
    toFiniteNumber(fromRoute?.lat) ??
    toFiniteNumber(fromProduct?.latitude) ??
    toFiniteNumber(fromProduct?.lat) ??
    toFiniteNumber(product?.latitude) ??
    toFiniteNumber(product?.lat) ??
    toFiniteNumber(fromSeller?.latitude) ??
    toFiniteNumber(fromSeller?.lat);

  const longitude =
    toFiniteNumber(fromRoute?.longitude) ??
    toFiniteNumber(fromRoute?.lng) ??
    toFiniteNumber(fromRoute?.lon) ??
    toFiniteNumber(fromProduct?.longitude) ??
    toFiniteNumber(fromProduct?.lng) ??
    toFiniteNumber(fromProduct?.lon) ??
    toFiniteNumber(product?.longitude) ??
    toFiniteNumber(product?.lng) ??
    toFiniteNumber(fromSeller?.longitude) ??
    toFiniteNumber(fromSeller?.lng);

  if (isWithinNigeria(latitude, longitude)) {
    return { latitude, longitude };
  }

  // TODO: backend should provide validated Nigeria shop coordinates for pickup navigation
  return NIGERIA_FALLBACK_COORDS;
};

const PickupTrackingScreen = ({ navigation, route }) => {
  const panelY = useRef(new Animated.Value(0)).current;
  const panelYRef = useRef(0);
  const dragStartRef = useRef(0);
  const { location, permissionStatus, requestPermission, refreshOnce } = useUserLocation();
  const [resolvedPickupCode, setResolvedPickupCode] = React.useState('');
  const [isHydratingOrder, setIsHydratingOrder] = React.useState(false);
  const [product, setProduct] = React.useState(route?.params?.product || null);
  const [seller, setSeller] = React.useState(route?.params?.seller || null);
  const [pickupAddress, setPickupAddress] = React.useState(
    route?.params?.storeAddress || route?.params?.deliveryAddress || ''
  );
  const [summary, setSummary] = React.useState({
    subtotal: toMoney(route?.params?.subtotal),
    serviceCharge: toMoney(route?.params?.serviceCharge),
    totalAmount: toMoney(
      route?.params?.totalAmount,
      toMoney(route?.params?.subtotal) + toMoney(route?.params?.serviceCharge),
    ),
  });
  const [orderStatus, setOrderStatus] = React.useState(
    String(route?.params?.status || '').trim().toLowerCase()
  );

  const incomingCode = String(route?.params?.pickupCode || '')
    .replace(/\D/g, '')
    .slice(0, 4);
  const orderId = String(route?.params?.orderId || route?.params?.order_id || '').trim();
  const pickupCode = resolvedPickupCode || incomingCode;
  const isOrderCompleted = orderStatus === 'completed';

  const shopCoordinates = useMemo(() => {
    // TODO: backend should provide shop coordinates for pickup navigation
    return extractShopCoordinates({ route, product, seller });
  }, [product, route, seller]);
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

  const imageUri = resolveImageUri(product?.images?.[0]);
  const avatarUri = resolveImageUri(seller?.avatar);

  const animatePanelTo = useCallback((toValue) => {
    Animated.spring(panelY, {
      toValue,
      useNativeDriver: true,
      friction: 9,
      tension: 55,
    }).start();
  }, [panelY]);

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

  useEffect(() => {
    let active = true;
    const hydratePickupCode = async () => {
      if (!orderId) {
        return;
      }
      setIsHydratingOrder(true);
      try {
        const response = await getMarketplaceOrder(orderId);
        const payload = response?.data || response || {};
        const data = payload?.data || payload || {};
        const code = String(data?.pickup_code || '').replace(/\D/g, '').slice(0, 4);
        if (active && code.length === 4) {
          setResolvedPickupCode(code);
        }
        if (active) {
          setOrderStatus(String(data?.status || '').trim().toLowerCase());
        }

        const items = data?.items || data?.order_items || data?.products || [];
        const firstItem = items?.[0] || {};
        const part = firstItem?.part || firstItem?.product || firstItem?.spare_part || {};
        const store = part?.store || data?.store || data?.seller || {};
        const itemStoreName = String(firstItem?.store_name || '').trim();
        const itemStorePhone = String(firstItem?.store_phone || '').trim();
        const itemStoreLat = Number.isFinite(Number(firstItem?.store_latitude))
          ? Number(firstItem.store_latitude)
          : null;
        const itemStoreLng = Number.isFinite(Number(firstItem?.store_longitude))
          ? Number(firstItem.store_longitude)
          : null;

        if (active) {
          if (!product) {
            setProduct({
              id: String(part?.id || firstItem?.id || '').trim(),
              storeId: String(part?.store_id || store?.id || data?.store_id || '').trim(),
              name: String(part?.name || firstItem?.part_name || firstItem?.name || '').trim(),
              shop: String(itemStoreName || store?.store_name || store?.name || '').trim(),
              price: Number(part?.price || firstItem?.price || 0),
              images: Array.isArray(part?.images) ? part.images : part?.image ? [part.image] : [],
              shopCoordinates: itemStoreLat !== null && itemStoreLng !== null
                ? { latitude: itemStoreLat, longitude: itemStoreLng }
                : (store?.coordinates || null),
              latitude: itemStoreLat ?? store?.coordinates?.latitude ?? part?.latitude ?? null,
              longitude: itemStoreLng ?? store?.coordinates?.longitude ?? part?.longitude ?? null,
            });
          }
          if (!seller) {
            setSeller({
              storeId: String(store?.id || part?.store_id || data?.store_id || '').trim(),
              name: String(itemStoreName || store?.store_name || store?.name || '').trim(),
              avatar: store?.logo || store?.avatar || '',
              phone: itemStorePhone || String(store?.phone || store?.phone_number || '').trim(),
              isActive: Boolean(store?.is_active ?? true),
              coordinates: itemStoreLat !== null && itemStoreLng !== null
                ? { latitude: itemStoreLat, longitude: itemStoreLng }
                : (store?.coordinates || null),
            });
          }
          if (!pickupAddress) {
            const addressPayload = data?.delivery_address || data?.address || data?.delivery || {};
            const resolvedAddress = addressPayload?.street
              ? `${addressPayload.street}, ${addressPayload.city || ''} ${addressPayload.state || ''}`.trim()
              : String(data?.delivery_address_text || '').trim();
            setPickupAddress(resolvedAddress);
          }
        }

        const computedSubtotal = items.reduce((sum, entry) => sum + toMoney(entry?.subtotal), 0);
        const backendTotal = toMoney(data?.total_amount, toMoney(data?.amount, 0));
        const backendServiceCharge = toMoney(
          data?.service_charge,
          backendTotal > computedSubtotal ? backendTotal - computedSubtotal : 0,
        );
        if (active) {
          setSummary((prev) => ({
            subtotal: computedSubtotal || prev.subtotal,
            serviceCharge: backendServiceCharge || prev.serviceCharge,
            totalAmount: backendTotal || prev.totalAmount || computedSubtotal + backendServiceCharge,
          }));
        }
      } catch {
        // No-op: show explicit unavailable text when backend payload is missing.
      } finally {
        if (active) {
          setIsHydratingOrder(false);
        }
      }
    };

    hydratePickupCode();
    return () => {
      active = false;
    };
  }, [incomingCode.length, orderId, pickupAddress, product, seller]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderGrant: () => {
          dragStartRef.current = panelYRef.current;
        },
        onPanResponderMove: (_, gesture) => {
          const next = Math.max(0, Math.min(PANEL_MAX_DOWN, dragStartRef.current + gesture.dy));
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

  const handleReportIssue = () => {
    AppAlert.alert('Report issue', 'Issue reporting for pickup orders will be wired soon.');
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
                { text: 'OK', onPress: () => navigation.goBack() },
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
      route?.params?.storeId ||
        route?.params?.store_id ||
        seller?.storeId ||
        product?.storeId ||
        ''
    ).trim();
    if (!storeId) {
      return;
    }
    navigation.navigate(ROUTES.STORE_DETAILS, { storeId });
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
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
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={darkTheme.colors.accent} strokeWidth={2} />
            </TouchableOpacity>
            <AppText style={styles.topTitle}>Pick up tracking</AppText>
            <View style={styles.topSpacer} />
          </View>
        </View>

        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: panelY }] }]} {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <AppText style={styles.heading}>Your delivery code</AppText>
            <AppText style={styles.description}>
              This delivery code would be entered by the seller to confirm your order. Please do not share to anyone else.
            </AppText>

            <View style={styles.codeWrap}>
              <AppText style={styles.codeText}>
                {pickupCode ? pickupCode.split('').join(' ') : '- - - -'}
              </AppText>
            </View>

            {isHydratingOrder ? (
              <View style={styles.productCard}>
                <View style={styles.imagePlaceholder} />
                <View style={styles.productInfo}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                  <View style={[styles.skeletonLine, styles.skeletonLineTiny]} />
                </View>
              </View>
            ) : (
              <View style={styles.productCard}>
                {imageUri ? <Image source={{ uri: imageUri }} style={styles.productImage} /> : <View style={styles.imagePlaceholder} />}
                <View style={styles.productInfo}>
                  <AppText style={styles.productName} numberOfLines={1}>{String(product?.name || '').trim() || 'Unavailable'}</AppText>
                  <TouchableOpacity activeOpacity={0.85} onPress={handleOpenStoreDetails}>
                    <AppText style={styles.productShop}>{String(product?.shop || '').trim() || 'Unavailable'}</AppText>
                  </TouchableOpacity>
                  <AppText style={styles.productPrice}>{formatNaira(product?.price || 0)}</AppText>
                  <AppText style={styles.productAddress} numberOfLines={2}>{pickupAddress || 'Pickup address unavailable'}</AppText>
                </View>
              </View>
            )}

            <View style={styles.summaryCard}>
              <AppText style={styles.summaryTitle}>Payment summary</AppText>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Subtotal</AppText>
                <AppText style={styles.summaryValue}>{formatNaira(summary.subtotal)}</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText style={styles.summaryLabel}>Service fee</AppText>
                <AppText style={styles.summaryValue}>{formatNaira(summary.serviceCharge)}</AppText>
              </View>
              <View style={styles.summaryRow}>
                <AppText style={styles.totalLabel}>Total paid</AppText>
                <AppText style={styles.totalValue}>{formatNaira(summary.totalAmount)}</AppText>
              </View>
            </View>

            <View style={styles.sellerCard}>
              <TouchableOpacity style={styles.sellerLeft} activeOpacity={0.88} onPress={handleOpenStoreDetails}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.sellerAvatar} />
                ) : (
                  <View style={styles.sellerAvatarFallback}>
                    <AppText style={styles.sellerAvatarText}>{String(seller?.name || 'S').charAt(0).toUpperCase()}</AppText>
                  </View>
                )}
                <View>
                  <AppText style={styles.sellerName}>{String(seller?.name || '').trim() || 'Unavailable'}</AppText>
                  <View style={styles.sellerStatusRow}>
                    <View style={styles.statusDot} />
                    <AppText style={styles.sellerStatusText}>{seller?.isActive ? 'Active now' : 'Offline'}</AppText>
                  </View>
                </View>
              </TouchableOpacity>
              <AppButton
                label="Call seller"
                onPress={handleCallSeller}
                style={styles.messageButton}
                left={<HugeiconsIcon icon={CallIcon} size={16} color="#1A1A1A" strokeWidth={2.1} />}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={isOrderCompleted ? handleReportIssue : handleCancelOrder}
            >
              <AppText style={styles.reportText}>
                {isOrderCompleted ? 'Report an issue' : 'Cancel order'}
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#010037',
  },
  screen: {
    flex: 1,
    backgroundColor: '#010037',
  },
  mapBackdrop: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 8,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
  },
  topSpacer: {
    width: 40,
    height: 40,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 440,
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#010037',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    alignSelf: 'center',
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginTop: 10,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 26,
    rowGap: 12,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 18,
  },
  codeWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6C714',
    backgroundColor: 'rgba(230,199,20,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  codeText: {
    color: '#E6C714',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: 2,
  },
  productCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 10,
    flexDirection: 'row',
    columnGap: 10,
  },
  productImage: {
    width: 62,
    height: 62,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  productInfo: {
    flex: 1,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 6,
    width: '92%',
  },
  skeletonLineShort: {
    width: '64%',
  },
  skeletonLineTiny: {
    width: '46%',
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  productShop: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 16,
  },
  productPrice: {
    marginTop: 4,
    color: '#E6C714',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  productAddress: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 15,
  },
  sellerCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
    rowGap: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 14,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 15,
  },
  totalLabel: {
    color: '#E6C714',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  totalValue: {
    color: '#E6C714',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  sellerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    resizeMode: 'cover',
  },
  sellerAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  sellerStatusRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  sellerStatusText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    lineHeight: 14,
  },
  messageButton: {
    minHeight: 40,
  },
  reportText: {
    textAlign: 'center',
    color: '#E6C714',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});

export default PickupTrackingScreen;



