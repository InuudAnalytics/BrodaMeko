import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  MinusSignIcon,
  PlusSignIcon,
  StarIcon,
} from '@hugeicons/core-free-icons';
import { AppButton, AppText, ScreenContainer } from '../../../components';
import { useCart } from '../../../context';
import { getMarketplacePart } from '../../../services/marketplace.service';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Ceramic brake pads',
    price: 3000,
    shop: "Bello's benzo store",
    rating: 4.9,
    reviews: 98,
    stock: 14,
    location: 'Lagos, Nigeria',
    compatibility: 'Toyota Camry 2018-2022',
    delivery: 'Oct 24 - Oct 26',
    description:
      'High-performance ceramic brake pads designed for quieter stops and reduced dust. Built for consistent braking power and long-lasting durability across everyday and performance use cases.',
    images: [
      'https://picsum.photos/600/600?random=1',
      'https://picsum.photos/600/600?random=2',
      'https://picsum.photos/600/600?random=3',
    ],
  },
];

const ProductDetailsScreen = ({ navigation, route }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef(null);
  const { addToCart } = useCart();

  const [product, setProduct] = useState(() => {
    if (route?.params?.product) {
      return route.params.product;
    }
    const id = route?.params?.productId;
    return MOCK_PRODUCTS.find(item => item.id === id) || MOCK_PRODUCTS[0];
  });

  useEffect(() => {
    const id = route?.params?.productId;
    if (!id || route?.params?.product) {
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const response = await getMarketplacePart(id);
        const payload = response?.data || response || {};
        const part = payload?.part || payload?.data || payload;
        if (active && part) {
          setProduct({
            id: String(part?.id || part?._id || id),
            name: String(part?.name || part?.title || 'Spare part'),
            price: Number(part?.price || 0),
            shop: String(part?.store?.name || part?.store_name || part?.seller_name || "Seller's store"),
            rating: Number(part?.rating || 4.9),
            reviews: Number(part?.reviews || part?.review_count || 0),
            stock: Number(part?.stock_quantity || part?.stock || 0),
            location: String(part?.location || part?.city || 'Lagos, Nigeria'),
            compatibility: String(part?.compatibility || 'Compatible'),
            delivery: String(part?.delivery || 'Delivery date'),
            description: String(part?.description || ''),
            images: Array.isArray(part?.images) ? part.images : part?.image ? [part.image] : [],
          });
        }
      } catch {
        // keep fallback
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [route?.params?.product, route?.params?.productId]);

  const images = product?.images?.length
    ? product.images
    : ['https://picsum.photos/600/600?random=10'];
  const isInStock = Number(product?.stock || 0) > 0;

  const handleScrollEnd = event => {
    const offsetX = event.nativeEvent.contentOffset.x || 0;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    navigation?.navigate?.('Cart');
  };

  const handleBuyNow = () => {
    navigation.navigate('Checkout', {
      directProduct: { ...product, quantity },
    });
  };

  const decrement = () => setQuantity(prev => Math.max(1, prev - 1));
  const increment = () => setQuantity(prev => prev + 1);

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
        <AppText style={styles.headerTitle}>Product description</AppText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.carouselWrap}>
          <FlatList
            ref={listRef}
            data={images}
            keyExtractor={(item, index) => `${item}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            )}
          />
          <View style={styles.dotsRow}>
            {images.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  index === activeIndex ? styles.dotActive : null,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.productName}>
            {product?.name || 'Product'}
          </AppText>
          <View style={styles.ratingRow}>
            <HugeiconsIcon
              icon={StarIcon}
              size={14}
              color="#E6C714"
              strokeWidth={2}
            />
            <AppText style={styles.ratingText}>
              {product?.rating?.toFixed?.(1) || product?.rating || '0.0'} (
              {product?.reviews || 0} reviews)
            </AppText>
            <View
              style={[
                styles.stockBadge,
                isInStock ? styles.stockIn : styles.stockOut,
              ]}
            >
              <AppText style={styles.stockText}>
                {isInStock ? 'In stock' : 'Not in stock'}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.sellerCard}>
          <View>
            <AppText style={styles.sellerName}>
              {product?.shop || 'Seller'}
            </AppText>
            <View style={styles.sellerRow}>
              <View style={styles.sellerBadge}>
                <AppText style={styles.sellerBadgeText}>Seller</AppText>
              </View>
              <AppText style={styles.sellerSubtitle}>Top rated seller</AppText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Description</AppText>
          <AppText
            style={styles.description}
            numberOfLines={expanded ? undefined : 3}
          >
            {product?.description || 'No description available.'}
          </AppText>
          <TouchableOpacity
            onPress={() => setExpanded(prev => !prev)}
            activeOpacity={0.8}
          >
            <AppText style={styles.readMore}>
              {expanded ? 'Read less' : 'Read more'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.infoGrid}>
          {[
            { label: 'Compatibility', value: product?.compatibility || 'N/A' },
            { label: 'Location', value: product?.location || 'N/A' },
            { label: 'Delivery', value: product?.delivery || 'N/A' },
            { label: 'Estimated date', value: product?.delivery || 'N/A' },
          ].map(item => (
            <View key={item.label} style={styles.infoCard}>
              <AppText style={styles.infoLabel}>{item.label}</AppText>
              <AppText style={styles.infoValue}>{item.value}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Quantity</AppText>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={decrement}
              activeOpacity={0.85}
            >
              <HugeiconsIcon
                icon={MinusSignIcon}
                size={18}
                color="#E6C714"
                strokeWidth={2}
              />
            </TouchableOpacity>
            <AppText style={styles.qtyValue}>{quantity}</AppText>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={increment}
              activeOpacity={0.85}
            >
              <HugeiconsIcon
                icon={PlusSignIcon}
                size={18}
                color="#E6C714"
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.addToCart}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <AppText style={styles.addToCartText}>Add to cart</AppText>
        </TouchableOpacity>
        <AppButton
          label="Buy now"
          onPress={handleBuyNow}
          style={styles.buyNow}
          textStyle={styles.buyNowText}
        />
      </View>
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
  scrollContent: {
    paddingBottom: 60,
  },
  carouselWrap: {
    marginTop: 10,
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 260,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#E6C714',
    width: 10,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    columnGap: 6,
  },
  ratingText: {
    color: '#E6C714',
    fontSize: 13,
  },
  stockBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockIn: {
    backgroundColor: 'rgba(34,197,94,0.18)',
  },
  stockOut: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  sellerCard: {
    marginTop: 18,
    marginHorizontal: 20,
    backgroundColor: '#1A1A4A',
    borderRadius: 14,
    padding: 16,
  },
  sellerName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    columnGap: 8,
  },
  sellerBadge: {
    backgroundColor: 'rgba(230,199,20,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  sellerBadgeText: {
    color: '#E6C714',
    fontSize: 11,
    fontWeight: '600',
  },
  sellerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#E6C714',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
  },
  readMore: {
    color: '#E6C714',
    fontSize: 12,
    marginTop: 6,
  },
  infoGrid: {
    marginTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    width: (SCREEN_WIDTH - 20 * 2 - 12) / 2,
    backgroundColor: '#1A1A4A',
    borderRadius: 12,
    padding: 12,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 16,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A4A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.4)',
  },
  qtyValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    columnGap: 12,
  },
  addToCart: {
    width: '50%',
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9D9D9',
  },
  addToCartText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '300',
  },
  buyNow: {
    width: '50%',
    minHeight: 52,
    borderRadius: 16,
  },
  buyNowText: {
    fontWeight: '600',
  },
});

export default ProductDetailsScreen;
