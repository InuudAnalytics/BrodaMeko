import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  FavouriteIcon,
  FilterHorizontalIcon,
  Search01Icon,
  ShoppingCart02Icon,
} from '@hugeicons/core-free-icons';
import { AppBottomNav, AppText, ScreenContainer } from '../../../components';
import ProductCard from '../../../components/marketplace/ProductCard';
import { useCart } from '../../../context';
import { getMarketplaceParts } from '../../../services/marketplace.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const normalizeParts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.parts)) return payload.parts;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const mapPartToProduct = (part) => ({
  id: String(part?.id || part?._id || ''),
  name: String(part?.name || part?.title || 'Spare part'),
  price: Number(part?.price || 0),
  shop: String(part?.store?.name || part?.store_name || part?.seller_name || "Seller's store"),
  rating: Number(part?.rating || 4.9),
  reviews: Number(part?.reviews || part?.review_count || 0),
  images: Array.isArray(part?.images) ? part.images : part?.image ? [part.image] : [],
});

const SKELETON_ITEMS = Array.from({ length: 6 }).map((_, index) => ({
  id: `skeleton-${index}`,
  isSkeleton: true,
}));

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
      <View style={styles.skeletonRating} />
      <View style={styles.skeletonBottomRow}>
        <View style={styles.skeletonPrice} />
        <View style={styles.skeletonCircle} />
      </View>
    </View>
  </View>
);

const MarketplaceScreen = ({ navigation }) => {
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMarketplaceParts({ title_search: search || undefined });
      const payload = response?.data || response || {};
      const list = normalizeParts(payload);
      setProducts(list.map(mapPartToProduct));
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      fetchParts();
    }, [fetchParts])
  );

  const visibleProducts = useMemo(() => {
    if (!search) return products;
    const q = search.trim().toLowerCase();
    return products.filter((item) => item.name.toLowerCase().includes(q));
  }, [products, search]);
  const listData = loading ? SKELETON_ITEMS : visibleProducts;

  const handleOpenProduct = (product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const handleTabPress = (routeName) => {
    navigation.navigate(routeName);
  };

  return (
    <View style={styles.root}>
      <ScreenContainer padded={false} edges={['top', 'left', 'right']} style={styles.screen}>
        <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.headerIconBtn} onPress={() => navigation.navigate(ROUTES.CAR_OWNER_DASHBOARD)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          </View>
          <AppText style={styles.headerTitle}>Marketplace</AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              placeholder="Search for products"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            <HugeiconsIcon icon={FilterHorizontalIcon} size={18} color="#9CA3AF" strokeWidth={2} />
          </View>
          <Pressable style={styles.wishlistButton} onPress={() => navigation.navigate('Favorites')}>
            <HugeiconsIcon icon={FavouriteIcon} size={18} color="#000033" strokeWidth={2} />
          </Pressable>
        </View>

        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrap}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              {item.isSkeleton ? (
                <SkeletonCard />
              ) : (
                <ProductCard
                  product={item}
                  onPress={() => handleOpenProduct(item)}
                  onAddToCart={() => handleAddToCart(item)}
                />
              )}
            </View>
          )}
        />
        </View>

        <Pressable style={styles.floatingCart} onPress={() => navigation.navigate('Cart')}>
          <HugeiconsIcon icon={ShoppingCart02Icon} size={20} color="#000033" strokeWidth={2} />
        </Pressable>
      </ScreenContainer>
      <AppBottomNav activeTab={ROUTES.CAR_OWNER_MARKETPLACE} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  headerSpacer: {
    width: 36,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
    marginBottom: 16,
  },
  searchWrap: {
    flex: 1,
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  wishlistButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6C714',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  columnWrap: {
    columnGap: 12,
  },
  cardWrap: {
    flex: 1,
  },
  skeletonCard: {
    backgroundColor: '#1A1A4A',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  skeletonImage: {
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skeletonContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    rowGap: 8,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skeletonLineShort: {
    width: '70%',
  },
  skeletonRating: {
    width: '55%',
    height: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skeletonBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skeletonPrice: {
    width: '45%',
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(230,199,20,0.28)',
  },
  skeletonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.4)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  floatingCart: {
    position: 'absolute',
    right: 18,
    bottom: 86,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E6C714',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  root: {
    flex: 1,
    backgroundColor: '#000033',
  },
});

export default MarketplaceScreen;
