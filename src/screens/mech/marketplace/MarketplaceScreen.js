import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  FilterHorizontalIcon,
  Search01Icon,
  ShoppingCart02Icon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { ROUTES } from '../../../utils';
import ProductCard from '../../../components/marketplace/ProductCard';
import { useCart } from '../../../context';
import { getMarketplaceParts } from '../../../services/marketplace.service';
import { darkTheme } from '../../../theme';

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

const MechanicMarketplaceScreen = ({ navigation }) => {
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);

  const fetchParts = useCallback(async () => {
    try {
      const response = await getMarketplaceParts({ title_search: search || undefined });
      const payload = response?.data || response || {};
      const list = normalizeParts(payload);
      setProducts(list.map(mapPartToProduct));
    } catch {
      setProducts([]);
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
  const handleTabPress = tabKey => {
    if (tabKey === 'profile') {
      navigation.navigate(ROUTES.USER_PROFILE);
      return;
    }

    navigation.navigate(ROUTES.MECH_DASHBOARD_TABS, { tab: tabKey });
  };

  const handleOpenProduct = product => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleAddToCart = product => {
    addToCart(product);
  };

  return (
    <View style={styles.root}>
      <ScreenContainer
        padded={false}
        edges={['left', 'right']}
        style={styles.screen}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Pressable
              style={styles.headerIconBtn}
              onPress={() => navigation.goBack()}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                color="#FFFFFF"
                strokeWidth={2}
              />
            </Pressable>
            <AppText style={styles.headerTitle}>Marketplace</AppText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <HugeiconsIcon
                icon={Search01Icon}
                size={18}
                color="#9CA3AF"
                strokeWidth={2}
              />
              <TextInput
                placeholder="Search for products"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              <HugeiconsIcon
                icon={FilterHorizontalIcon}
                size={18}
                color="#9CA3AF"
                strokeWidth={2}
              />
            </View>
            <Pressable
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <HugeiconsIcon
                icon={ShoppingCart02Icon}
                size={18}
                color="#000033"
                strokeWidth={2}
              />
            </Pressable>
          </View>

          <FlatList
            data={visibleProducts}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <ProductCard
                  product={item}
                  onPress={() => handleOpenProduct(item)}
                  onAddToCart={() => handleAddToCart(item)}
                />
              </View>
            )}
          />
        </View>
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
  cartButton: {
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
});

export default MechanicMarketplaceScreen;
