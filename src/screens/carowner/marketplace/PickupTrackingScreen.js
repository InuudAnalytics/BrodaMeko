import React, { useCallback, useMemo, useRef } from 'react';
import { Animated, Image, PanResponder, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Message02Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, OpenStreetMapView, ScreenContainer } from '../../../components';
import { darkTheme } from '../../../theme';
import AppAlert from '../../../components/AppAlert';
const PANEL_MAX_DOWN = 360;

const formatNaira = value => `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

const resolveImageUri = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return String(value?.url || value?.secure_url || value?.uri || value?.path || '').trim();
  }
  return '';
};

const PickupTrackingScreen = ({ navigation, route }) => {
  const panelY = useRef(new Animated.Value(0)).current;
  const panelYRef = useRef(0);
  const dragStartRef = useRef(0);

  const incomingCode = String(route?.params?.pickupCode || '')
    .replace(/\D/g, '')
    .slice(0, 4);
  const pickupCode = useMemo(() => {
    if (incomingCode.length === 4) {
      return incomingCode;
    }
    // TODO: replace local pickup code generation with backend-issued pickup code
    return String(Math.floor(1000 + Math.random() * 9000));
  }, [incomingCode]);

  const product = route?.params?.product || {
    name: 'LED headlights',
    price: 2500,
    shop: 'Okon spare part hub',
    images: ['https://picsum.photos/300?random=31'],
  };
  const seller = route?.params?.seller || {
    name: product?.shop || 'Okon spare part hub',
    avatar: 'https://i.pravatar.cc/100?img=12',
    isActive: true,
  };
  const pickupAddress = route?.params?.deliveryAddress || 'No 1, Onireke street, Agbabiaka';

  const mapCenter = useMemo(() => {
    const lat = Number(route?.params?.shopCoordinates?.latitude || 6.5244);
    const lng = Number(route?.params?.shopCoordinates?.longitude || 3.3792);
    // TODO: backend should provide shop coordinates for pickup navigation
    return { latitude: lat, longitude: lng };
  }, [route?.params?.shopCoordinates?.latitude, route?.params?.shopCoordinates?.longitude]);

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

  panelY.addListener(({ value }) => {
    panelYRef.current = value;
  });

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

  const handleMessageSeller = () => {
    AppAlert.alert('Coming soon', 'Seller chat will be wired soon.');
  };

  const handleReportIssue = () => {
    AppAlert.alert('Report issue', 'Issue reporting for pickup orders will be wired soon.');
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.mapBackdrop}>
          <OpenStreetMapView latitude={mapCenter.latitude} longitude={mapCenter.longitude} />
          <View style={styles.mockRouteLine} />
          <View style={styles.mockPin} />

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
              <AppText style={styles.codeText}>{pickupCode.split('').join(' ')}</AppText>
            </View>

            <View style={styles.productCard}>
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.productImage} /> : <View style={styles.imagePlaceholder} />}
              <View style={styles.productInfo}>
                <AppText style={styles.productName} numberOfLines={1}>{product?.name || 'Product'}</AppText>
                <AppText style={styles.productShop}>{product?.shop || 'Seller'}</AppText>
                <AppText style={styles.productPrice}>{formatNaira(product?.price || 0)}</AppText>
                <AppText style={styles.productAddress} numberOfLines={2}>{pickupAddress}</AppText>
              </View>
            </View>

            <View style={styles.sellerCard}>
              <View style={styles.sellerLeft}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.sellerAvatar} />
                ) : (
                  <View style={styles.sellerAvatarFallback}>
                    <AppText style={styles.sellerAvatarText}>{String(seller?.name || 'S').charAt(0).toUpperCase()}</AppText>
                  </View>
                )}
                <View>
                  <AppText style={styles.sellerName}>{seller?.name || 'Seller'}</AppText>
                  <View style={styles.sellerStatusRow}>
                    <View style={styles.statusDot} />
                    <AppText style={styles.sellerStatusText}>{seller?.isActive ? 'Active now' : 'Offline'}</AppText>
                  </View>
                </View>
              </View>
              <AppButton
                label="Message seller"
                onPress={handleMessageSeller}
                style={styles.messageButton}
                left={<HugeiconsIcon icon={Message02Icon} size={16} color="#1A1A1A" strokeWidth={2.1} />}
              />
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleReportIssue}>
              <AppText style={styles.reportText}>Report an issue</AppText>
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
  mockRouteLine: {
    position: 'absolute',
    left: '52%',
    top: '28%',
    width: 6,
    height: 150,
    borderRadius: 4,
    backgroundColor: '#26A4FF',
  },
  mockPin: {
    position: 'absolute',
    left: '50%',
    top: '24%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF2A2A',
    borderWidth: 2,
    borderColor: '#FFD5D5',
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



