import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Message02Icon,
} from '@hugeicons/core-free-icons';
import {
  AppButton,
  AppText,
  OpenStreetMapView,
  ScreenContainer,
} from '../../../components';
import { darkTheme } from '../../../theme';

const PANEL_MAX_DOWN = 360;

const fallbackTimeline = [
  { id: 'confirmed', label: 'Order confirmed', eta: 'Today • 10:15 AM' },
  {
    id: 'preparing',
    label: 'Seller preparing package',
    eta: 'Today • 11:30 AM',
  },
  { id: 'out_for_delivery', label: 'Out for delivery', eta: 'Today • 1:20 PM' },
  { id: 'delivered', label: 'Delivered', eta: 'Today • 3:30 PM' },
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
  isActive: true,
};

const fallbackAddress = 'No 1, Onireke street, Agbabiaka';

const formatNaira = value =>
  `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const OrderTrackingScreen = ({ navigation, route }) => {
  const panelY = useRef(new Animated.Value(0)).current;
  const panelYRef = useRef(0);
  const dragStartRef = useRef(0);

  const [mapReady] = useState(true);
  const product = route?.params?.product || fallbackProduct;
  const seller = route?.params?.seller || fallbackSeller;
  const deliveryAddress = route?.params?.deliveryAddress || fallbackAddress;
  const statusTimeline = Array.isArray(route?.params?.statusTimeline)
    ? route.params.statusTimeline
    : fallbackTimeline;

  const mapCenter = useMemo(() => {
    const lat = Number(route?.params?.latitude || 6.5244);
    const lng = Number(route?.params?.longitude || 3.3792);
    return { latitude: lat, longitude: lng };
  }, [route?.params?.latitude, route?.params?.longitude]);

  const imageUri = product?.images?.[0] || '';

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

  panelY.addListener(({ value }) => {
    panelYRef.current = value;
  });

  const handleMessageSeller = () => {
    Alert.alert('Coming soon', 'Seller chat is not available yet.');
  };

  const handleConfirmDelivery = () => {
    navigation.navigate('OrderDeliveredSuccess', {
      productName: product?.name,
      productImage: product?.images?.[0],
      sellerName: seller?.name,
      orderId: route?.params?.orderId || route?.params?.order_id,
    });
  };

  const handleReportIssue = () => {
    Alert.alert('Report issue', 'Issue reporting will be wired soon.');
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        padded={false}
        edges={['top', 'left', 'right']}
        style={styles.screen}
      >
        <View style={styles.mapBackdrop}>
          {mapReady ? (
            <>
              <OpenStreetMapView
                latitude={mapCenter.latitude}
                longitude={mapCenter.longitude}
              />
              <View style={styles.mockRouteLine} />
              <View style={styles.mockPin} />
            </>
          ) : (
            <View style={styles.mapFallback}>
              <AppText style={styles.mapFallbackText}>
                Map preview unavailable
              </AppText>
            </View>
          )}
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
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.timelineBlock}>
              {statusTimeline.map(step => (
                <View key={step.id} style={styles.timelineRow}>
                  <View style={styles.timelineIconWrap}>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={18}
                      color="#E6C714"
                      strokeWidth={2}
                    />
                  </View>
                  <View style={styles.timelineContent}>
                    <AppText style={styles.timelineTitle}>{step.label}</AppText>
                    <AppText style={styles.timelineEta}>
                      {step.eta || 'ETA coming soon'}
                    </AppText>
                  </View>
                </View>
              ))}
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

            <View style={styles.sellerCard}>
              <View style={styles.sellerAvatarWrap}>
                {seller?.avatar ? (
                  <Image
                    source={{ uri: seller.avatar }}
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
                onPress={handleMessageSeller}
                activeOpacity={0.85}
              >
                <HugeiconsIcon
                  icon={Message02Icon}
                  size={18}
                  color="#E6C714"
                  strokeWidth={2}
                />
                <AppText style={styles.messageText}>Message seller</AppText>
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <AppButton
                label="Confirm delivery"
                onPress={handleConfirmDelivery}
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
          </ScrollView>
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
  mapFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A4A',
  },
  mapFallbackText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  mockRouteLine: {
    position: 'absolute',
    width: 120,
    height: 3,
    backgroundColor: '#E6C714',
    opacity: 0.85,
    borderRadius: 3,
    left: '45%',
    top: '45%',
  },
  mockPin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E6C714',
    left: '55%',
    top: '42%',
    borderWidth: 2,
    borderColor: '#000033',
  },
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
  timelineBlock: {
    marginBottom: darkTheme.spacing.lg,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 12,
    marginBottom: 14,
  },
  timelineIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(230,199,20,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
