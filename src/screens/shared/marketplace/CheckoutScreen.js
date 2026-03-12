import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Location01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useAuth, useCart } from '../../../context';
import { MARKETPLACE_DELIVERY_FEE_NGN } from '../../../config/marketplacePricing';
import { checkoutMarketplaceOrder, getMarketplaceOrder, getMarketplacePart } from '../../../services/marketplace.service';
import AppAlert from '../../../components/AppAlert';
import { getWalletBalance } from '../../../services/wallet.service';
import { WebView } from 'react-native-webview';
const formatNaira = value =>
  `\u20A6${Number(value || 0).toLocaleString('en-NG')}`;

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

const formatAddressObject = (value) => {
  if (!value || typeof value !== 'object') {
    return '';
  }
  const street = String(value?.street || '').trim();
  const city = String(value?.city || '').trim();
  const state = String(value?.state || '').trim();
  const country = String(value?.country || '').trim();
  return [street, city, state, country].filter(Boolean).join(', ');
};

const pickFirstDefined = (...values) => values.find(value => value !== undefined && value !== null);

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

const extractShopCoordinates = (product) => {
  const source = product?.shopCoordinates || product?.storeCoordinates || product?.store?.coordinates || {};
  const latitude =
    toFiniteNumber(source?.latitude) ??
    toFiniteNumber(source?.lat) ??
    toFiniteNumber(product?.latitude) ??
    toFiniteNumber(product?.lat);
  const longitude =
    toFiniteNumber(source?.longitude) ??
    toFiniteNumber(source?.lng) ??
    toFiniteNumber(source?.lon) ??
    toFiniteNumber(product?.longitude) ??
    toFiniteNumber(product?.lng);

  if (isWithinNigeria(latitude, longitude)) {
    return { latitude, longitude };
  }

  // TODO: replace with backend-provided validated store coordinates.
  return NIGERIA_FALLBACK_COORDS;
};

const readWalletAmount = (walletPayload) => {
  const root = walletPayload?.data || walletPayload || {};
  const amount =
    root?.balance ??
    root?.available_balance ??
    root?.wallet_balance ??
    root?.amount ??
    0;
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readAuthorizationUrl = (responseData) => {
  const payload = responseData?.payment || responseData || {};
  return String(
    payload?.authorization_url ||
      payload?.checkout_url ||
      payload?.payment_url ||
      payload?.data?.authorization_url ||
      payload?.data?.checkout_url ||
      payload?.data?.payment_url ||
      '',
  ).trim();
};

const readOrderId = (responseData) => {
  const directId = String(
    responseData?.order_id ||
      responseData?.orderId ||
      responseData?.id ||
      '',
  ).trim();
  if (directId) {
    return directId;
  }

  const reference = String(
    responseData?.payment?.data?.reference ||
      responseData?.payment?.reference ||
      '',
  ).trim();
  if (reference.startsWith('ORDER-')) {
    return reference.replace(/^ORDER-/, '');
  }
  return '';
};

const CheckoutScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { items, calculateTotal, clearCart, addToCart } = useCart();
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydratedPart, setHydratedPart] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [pendingSuccessParams, setPendingSuccessParams] = useState(null);
  const [verifyingPaystack, setVerifyingPaystack] = useState(false);

  const directProduct = route?.params?.directProduct || null;
  const product = directProduct || items?.[0]?.product || {
    id: '1',
    name: 'LED headlights',
    price: 2500,
    shop: 'Okon spare part hub',
    images: ['https://picsum.photos/300'],
  };

  const image = resolveImageUri(product?.images?.[0]);
  const quantity = Number(product?.quantity || items?.[0]?.quantity || 1);
  const subtotal = useMemo(() => {
    if (directProduct) {
      return Number(product?.price || 0) * quantity;
    }
    return calculateTotal();
  }, [calculateTotal, directProduct, product?.price, quantity]);
  const deliveryFee = deliveryType === 'delivery' ? MARKETPLACE_DELIVERY_FEE_NGN : 0;
  const serviceFee = 500;
  const total = subtotal + deliveryFee + serviceFee;
  const productId = String(product?.id || product?._id || product?.part_id || '').trim();

  useEffect(() => {
    let active = true;
    const hydratePart = async () => {
      if (!productId) {
        setHydratedPart(null);
        return;
      }
      try {
        const response = await getMarketplacePart(productId);
        const payload = response?.data || response || {};
        const part = payload?.part || payload?.data || payload;
        if (active) {
          setHydratedPart(part || null);
        }
      } catch {
        if (active) {
          setHydratedPart(null);
        }
      }
    };
    hydratePart();
    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    let active = true;
    const loadWalletBalance = async () => {
      setWalletLoading(true);
      try {
        const wallet = await getWalletBalance();
        if (!active) {
          return;
        }
        setWalletBalance(readWalletAmount(wallet));
      } catch {
        if (!active) {
          return;
        }
        setWalletBalance(0);
      } finally {
        if (active) {
          setWalletLoading(false);
        }
      }
    };

    loadWalletBalance();
    return () => {
      active = false;
    };
  }, []);

  const storeName = String(
    pickFirstDefined(
      product?.store?.name,
      hydratedPart?.store_name,
      hydratedPart?.store?.store_name,
      hydratedPart?.store?.name,
      product?.shop
    ) || 'Seller'
  );
  const storeAddress = String(
    pickFirstDefined(
      product?.store?.address,
      product?.storeAddress,
      formatAddressObject(product?.store_address),
      formatAddressObject(hydratedPart?.store_address),
      hydratedPart?.store?.address,
      hydratedPart?.store?.street
        ? `${hydratedPart.store.street}, ${hydratedPart.store.city || ''}, ${hydratedPart.store.state || ''}, ${hydratedPart.store.country || ''}`
        : ''
    ) ||
      product?.location ||
      'Store address unavailable'
  );
  const storeInfo = String(
    pickFirstDefined(
      product?.store?.description,
      hydratedPart?.store?.description,
      product?.store?.phone,
      hydratedPart?.store?.phone,
      hydratedPart?.store?.phone_number
    ) ||
      'Store information unavailable.'
  );

  const resolvedStorePhone = String(
    pickFirstDefined(
      product?.store?.phone,
      hydratedPart?.store?.phone,
      hydratedPart?.store?.phone_number,
      product?.phone
    ) || ''
  ).trim();

  const closeCheckoutModal = () => {
    setShowCheckoutModal(false);
  };

  const finalizeOrderSuccess = async (successParams) => {
    await clearCart();
    navigation.navigate('PaymentSuccessScreen', successParams);
  };

  const verifyPaystackOrderAndContinue = async (orderId, successParams) => {
    if (!successParams) {
      return;
    }
    if (!orderId) {
      // TODO: backend should expose a dedicated marketplace payment verify endpoint for deterministic client verification.
      AppAlert.alert(
        'Payment submitted',
        'Payment verification is still syncing. Continuing for testing.',
      );
      await finalizeOrderSuccess(successParams);
      return;
    }

    setVerifyingPaystack(true);
    try {
      let paid = false;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const orderResponse = await getMarketplaceOrder(orderId);
        const payload = orderResponse?.data || orderResponse || {};
        const data = payload?.data || payload || {};
        const paymentStatus = String(data?.payment_status || '').trim().toLowerCase();
        if (paymentStatus === 'paid') {
          paid = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (!paid) {
        // TODO: Replace this testing fallback with strict verification once backend adds an explicit verification endpoint.
        AppAlert.alert(
          'Verification pending',
          'Payment has not been confirmed yet on the server. Continuing for testing.',
        );
      }
      await finalizeOrderSuccess(successParams);
    } catch {
      // TODO: Replace this fallback once backend verification endpoint is available.
      AppAlert.alert(
        'Verification unavailable',
        'Could not verify payment right now. Continuing for testing.',
      );
      await finalizeOrderSuccess(successParams);
    } finally {
      setVerifyingPaystack(false);
      setShowCheckoutModal(false);
      setAuthorizationUrl('');
      setPendingSuccessParams(null);
    }
  };

  const handleCheckout = async () => {
    if (isSubmitting) {
      return;
    }
    if (paymentMethod === 'wallet' && walletBalance < total) {
      AppAlert.alert(
        'Insufficient wallet balance',
        `Wallet balance is ${formatNaira(walletBalance)}. You need ${formatNaira(total)}.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (directProduct) {
        await addToCart(directProduct, quantity);
      }

      const payload = {
        payment_method: paymentMethod === 'wallet' ? 'wallet' : 'paystack',
        fulfillment_type: deliveryType === 'pickup' ? 'pickup' : 'delivery',
        ...(deliveryType === 'delivery'
          ? {
              delivery_street: 'No 1, Onireke street, Agbabiaka',
              delivery_city: 'Lagos',
              delivery_state: 'Lagos',
              delivery_country: 'Nigeria',
            }
          : {}),
        contact_phone: String(user?.phone_number || user?.phone || '').trim(),
        email: String(user?.email || 'buyer@example.com'),
      };

      if (!payload.contact_phone) {
        AppAlert.alert('Phone required', 'Please add your phone number in profile before checkout.');
        setIsSubmitting(false);
        return;
      }

      const checkoutResponse = await checkoutMarketplaceOrder(payload);
      const responsePayload = checkoutResponse?.data || checkoutResponse || {};
      const responseData = responsePayload?.data || responsePayload || {};
      const createdOrderId = readOrderId(responseData);
      const pickupCode =
        String(responseData?.pickup_code || '').replace(/\D/g, '').slice(0, 4) || undefined;
      const shopCoordinates = extractShopCoordinates({
        ...product,
        shopCoordinates:
          product?.shopCoordinates ||
          hydratedPart?.store?.coordinates ||
          {
            latitude: hydratedPart?.store?.latitude,
            longitude: hydratedPart?.store?.longitude,
          },
        latitude: pickFirstDefined(
          product?.latitude,
          hydratedPart?.store?.latitude,
          hydratedPart?.latitude
        ),
        longitude: pickFirstDefined(
          product?.longitude,
          hydratedPart?.store?.longitude,
          hydratedPart?.longitude
        ),
      });
      const successParams = {
        orderId: createdOrderId,
        fulfillmentType: deliveryType === 'pickup' ? 'pickup' : 'delivery',
        pickupCode,
        product: {
          name: product?.name || 'Product',
          storeId: String(product?.storeId || product?.store_id || product?.store?.id || '').trim(),
          price: Number(product?.price || 0),
          shop: product?.shop || 'Seller',
          images: Array.isArray(product?.images) ? product.images : [],
          latitude: shopCoordinates.latitude,
          longitude: shopCoordinates.longitude,
          shopCoordinates,
        },
        seller: {
          name: storeName,
          avatar: product?.store?.logo || product?.store?.avatar || hydratedPart?.store?.logo || '',
          phone: resolvedStorePhone,
          isActive: true,
          coordinates: shopCoordinates,
        },
        storeName,
        storeAddress,
        storeInfo,
        shopCoordinates,
        deliveryAddress: 'No 1, Onireke street, Agbabiaka',
      };

      if (paymentMethod === 'wallet') {
        await finalizeOrderSuccess(successParams);
        return;
      }

      const paystackUrl = readAuthorizationUrl(responseData);
      if (!paystackUrl) {
        // TODO: backend should always return Paystack authorization URL for paystack payment_method.
        AppAlert.alert(
          'Checkout pending',
          'Payment link is unavailable. Continuing for testing.',
        );
        await finalizeOrderSuccess(successParams);
        return;
      }

      setPendingSuccessParams(successParams);
      setAuthorizationUrl(paystackUrl);
      setCheckoutError('');
      setShowCheckoutModal(true);
    } catch (error) {
      AppAlert.alert('Checkout failed', error?.message || 'Could not process checkout.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <ScreenContainer padded={false}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={22}
            color="#E6C714"
            strokeWidth={2}
          />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Checkout</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.productCard}>
            {image ? (
              <Image source={{ uri: image }} style={styles.productImage} />
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
          <View style={styles.summaryCard}>
            <AppText style={styles.sectionTitle}>Order summary</AppText>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Subtotal</AppText>
              <AppText style={styles.summaryValue}>
                {formatNaira(subtotal)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Delivery fee</AppText>
              <AppText style={styles.summaryValue}>
                {formatNaira(deliveryFee)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText style={styles.summaryLabel}>Service fee</AppText>
              <AppText style={styles.summaryValue}>
                {formatNaira(serviceFee)}
              </AppText>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <AppText style={styles.totalLabel}>Total</AppText>
              <AppText style={styles.totalValue}>{formatNaira(total)}</AppText>
            </View>
          </View>
          <View style={styles.block}>
            <AppText style={styles.sectionTitle}>Delivery</AppText>
            <View style={styles.deliveryRow}>
              <TouchableOpacity
                style={[
                  styles.deliveryCard,
                  deliveryType === 'delivery' && styles.deliveryCardActive,
                ]}
                onPress={() => {
                  AppAlert.alert('Delivery unavailable', 'Delivery mode is not available yet. Please use Pick up for now.');
                  setDeliveryType('pickup');
                }}
                activeOpacity={0.85}
              >
                <AppText style={styles.deliveryTitle}>Request delivery</AppText>
                <AppText style={styles.deliverySubtitle}>
                  {`1-3 days - ${formatNaira(MARKETPLACE_DELIVERY_FEE_NGN)}`}
                </AppText>
                {deliveryType === 'delivery' ? (
                  <View style={styles.deliveryCheck} />
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.deliveryCard,
                  deliveryType === 'pickup' && styles.deliveryCardActive,
                ]}
                onPress={() => setDeliveryType('pickup')}
                activeOpacity={0.85}
              >
                <AppText style={styles.deliveryTitle}>Pick up</AppText>
                <AppText style={styles.deliverySubtitle}>
                  Collect from seller
                </AppText>
                {deliveryType === 'pickup' ? (
                  <View style={styles.deliveryCheck} />
                ) : null}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.locationCard}>
            <HugeiconsIcon
              icon={Location01Icon}
              size={18}
              color="#E6C714"
              strokeWidth={2}
            />
            <View style={styles.locationInfo}>
              <AppText style={styles.locationName}>
                {storeName}
              </AppText>
              <AppText style={styles.locationAddress}>
                {storeAddress}
              </AppText>
            </View>
            <TouchableOpacity activeOpacity={0.85}>
              <AppText style={styles.changeText}>Change</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.block}>
            <AppText style={styles.sectionTitle}>Payment method</AppText>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'wallet' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('wallet')}
              activeOpacity={0.85}
            >
              <View>
                <AppText style={styles.paymentTitle}>Pay with wallet</AppText>
                <AppText style={styles.paymentSubtitle}>Use your wallet balance</AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'wallet' && styles.radioActive,
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'transfer' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('transfer')}
              activeOpacity={0.85}
            >
              <View>
                <AppText style={styles.paymentTitle}>Pay with transfer</AppText>
                <AppText style={styles.paymentSubtitle}>Via paystack</AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'transfer' && styles.radioActive,
                ]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'card' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.85}
            >
              <View>
                <AppText style={styles.paymentTitle}>
                  Pay with debit/credit card
                </AppText>
                <AppText style={styles.paymentSubtitle}>Via paystack</AppText>
              </View>
              <View
                style={[
                  styles.radio,
                  paymentMethod === 'card' && styles.radioActive,
                ]}
              />
            </TouchableOpacity>
            <AppText
              style={[
                styles.walletBalanceText,
                paymentMethod === 'wallet' && walletBalance < total
                  ? styles.walletBalanceInsufficient
                  : null,
              ]}
            >
              {walletLoading
                ? 'Wallet balance: loading...'
                : `Wallet balance: ${formatNaira(walletBalance)}${
                    paymentMethod === 'wallet' && walletBalance < total
                      ? ' (insufficient)'
                      : ''
                  }`}
            </AppText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomAction}>
        <AppButton
          label={isSubmitting ? 'Processing...' : 'Confirm and pay'}
          onPress={handleCheckout}
          disabled={isSubmitting}
        />
      </View>

      <Modal visible={showCheckoutModal} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.checkoutScreen}>
          <View style={styles.checkoutHeader}>
            <TouchableOpacity style={styles.checkoutCloseBtn} activeOpacity={0.85} onPress={closeCheckoutModal}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
            <AppText style={styles.checkoutTitle}>Checkout</AppText>
            <View style={styles.checkoutCloseBtn} />
          </View>

          {authorizationUrl ? (
            <WebView
              source={{ uri: authorizationUrl }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              thirdPartyCookiesEnabled
              sharedCookiesEnabled
              onError={(event) => {
                const description = String(event?.nativeEvent?.description || 'Could not load checkout.');
                setCheckoutError(description);
              }}
              onHttpError={(event) => {
                const statusCode = Number(event?.nativeEvent?.statusCode || 0);
                if (statusCode) {
                  setCheckoutError(`Checkout request failed (${statusCode}).`);
                }
              }}
              onShouldStartLoadWithRequest={(request) => {
                const nextUrl = String(request?.url || '').toLowerCase();
                if (
                  nextUrl.includes('status=success') ||
                  nextUrl.includes('payment/success') ||
                  nextUrl.includes('/success') ||
                  nextUrl.includes('trxref=') ||
                  nextUrl.includes('reference=')
                ) {
                  const orderId = pendingSuccessParams?.orderId || '';
                  verifyPaystackOrderAndContinue(orderId, pendingSuccessParams);
                }
                if (
                  nextUrl.includes('status=failed') ||
                  nextUrl.includes('status=cancelled') ||
                  nextUrl.includes('status=canceled') ||
                  nextUrl.includes('/cancel')
                ) {
                  AppAlert.alert('Payment not completed', 'You can retry checkout.');
                }
                return true;
              }}
            />
          ) : (
            <View style={styles.webLoadingWrap}>
              <AppText style={styles.errorText}>No checkout URL available.</AppText>
            </View>
          )}

          {checkoutError ? (
            <View style={styles.checkoutErrorWrap}>
              <AppText style={styles.errorText}>{checkoutError}</AppText>
            </View>
          ) : null}

          <View style={styles.checkoutFooter}>
            <AppButton
              label={verifyingPaystack ? 'Verifying payment...' : 'Done, verify payment'}
              onPress={() =>
                verifyPaystackOrderAndContinue(
                  pendingSuccessParams?.orderId || '',
                  pendingSuccessParams,
                )
              }
              disabled={verifyingPaystack || !pendingSuccessParams}
              left={verifyingPaystack ? <ActivityIndicator size="small" color="#000033" /> : null}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#E6C714',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  productCard: {
    marginTop: 8,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  summaryCard: {
    marginTop: 16,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryValue: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  totalValue: {
    color: '#E6C714',
    fontSize: 14,
    fontWeight: '700',
  },
  block: {
    marginTop: 18,
  },
  deliveryRow: {
    flexDirection: 'row',
    columnGap: 12,
  },
  deliveryCard: {
    flex: 1,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  deliveryCardActive: {
    borderColor: '#E6C714',
  },
  deliveryTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  deliverySubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 6,
  },
  deliveryCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E6C714',
  },
  locationCard: {
    marginTop: 16,
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  locationAddress: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  changeText: {
    color: '#E6C714',
    fontSize: 12,
    fontWeight: '600',
  },
  paymentCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentCardActive: {
    borderColor: '#E6C714',
  },
  paymentTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  paymentSubtitle: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E6C714',
  },
  radioActive: {
    backgroundColor: '#E6C714',
  },
  walletBalanceText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
  },
  walletBalanceInsufficient: {
    color: '#FF6B6B',
  },
  bottomAction: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 16,
  },
  checkoutScreen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  checkoutHeader: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  checkoutCloseBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  webLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutErrorWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  checkoutFooter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: '#FF7F7F',
  },
});

export default CheckoutScreen;




