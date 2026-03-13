import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import { getMarketplaceParts, getMarketplaceStore } from '../../../services/marketplace.service';
import { darkTheme } from '../../../theme';

const readRoot = (response) => response?.data || response || {};

const readStore = (response) => {
  const root = readRoot(response);
  const data = root?.data || root;
  return data && typeof data === 'object' ? data : null;
};

const readReviewsSummary = (response) => {
  const root = readRoot(response);
  const reviewRoot = root?.reviews || {};
  return {
    average: Number(reviewRoot?.average || reviewRoot?.avg_rating || reviewRoot?.rating || 0),
    count: Number(reviewRoot?.count || reviewRoot?.total_reviews || 0),
  };
};

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

const normalizeParts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.parts)) return payload.parts;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const formatAddress = (store) => {
  const street = String(store?.street || '').trim();
  const city = String(store?.city || '').trim();
  const state = String(store?.state || '').trim();
  const country = String(store?.country || '').trim();
  return [street, city, state, country].filter(Boolean).join(', ') || 'Address unavailable';
};

const formatOpenDays = (store) => {
  const days = Array.isArray(store?.open_days) ? store.open_days : [];
  if (!days.length) {
    return 'Not set';
  }
  if (days.length >= 6) {
    return 'Most days';
  }
  return days.join(', ');
};

const formatHours = (store) => {
  const opening = String(store?.opening_time || '').trim();
  const closing = String(store?.closing_time || '').trim();
  if (!opening || !closing) {
    return 'Not set';
  }
  return `${opening} - ${closing}`;
};

const mapPartToProduct = (part) => ({
  id: String(part?.id || part?._id || '').trim(),
  name: String(part?.name || 'Spare part').trim(),
  price: Number(part?.price || 0),
  images: Array.isArray(part?.images) ? part.images : part?.image ? [part.image] : [],
});

const ProductCard = ({ item, onPress }) => {
  const imageUri = resolveImageUri(item?.images?.[0]);
  return (
    <TouchableOpacity style={styles.productCard} activeOpacity={0.86} onPress={onPress}>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.productImage} /> : <View style={styles.productImageFallback} />}
      <AppText style={styles.productName} numberOfLines={1}>{item?.name || 'Spare part'}</AppText>
      <AppText style={styles.productPrice}>{`\u20A6${Number(item?.price || 0).toLocaleString('en-NG')}`}</AppText>
    </TouchableOpacity>
  );
};

const StoreDetailsScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ average: 0, count: 0 });
  const [error, setError] = useState('');
  const storeId = String(route?.params?.storeId || route?.params?.store_id || '').trim();

  const loadStore = useCallback(async () => {
    if (!storeId) {
      setError('Store ID is missing.');
      setStore(null);
      setProducts([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [storeResponse, partsResponse] = await Promise.all([
        getMarketplaceStore(storeId),
        getMarketplaceParts({ store_id: storeId }),
      ]);
      setStore(readStore(storeResponse));
      setReviewsSummary(readReviewsSummary(storeResponse));
      const partsPayload = partsResponse?.data || partsResponse || {};
      setProducts(normalizeParts(partsPayload).map(mapPartToProduct).filter((item) => item.id));
    } catch (requestError) {
      setStore(null);
      setProducts([]);
      setError(requestError?.message || 'Could not load store details.');
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const bannerUri = resolveImageUri(store?.banner);
  const logoUri = resolveImageUri(store?.logo);
  const storeName = String(store?.store_name || store?.name || 'Store').trim();
  const infoCards = useMemo(
    () => [
      { key: 'address', label: 'Location', value: formatAddress(store || {}) },
      { key: 'days', label: 'Open days', value: formatOpenDays(store || {}) },
      { key: 'hours', label: 'Opening hours', value: formatHours(store || {}) },
      {
        key: 'delivery',
        label: 'Delivery',
        value: `${String(store?.delivery_type || 'Not set')} / ${String(store?.delivery_scope || 'Not set')}`,
      },
    ],
    [store]
  );

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.1} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Store details</AppText>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadStore}
            tintColor={darkTheme.colors.accent}
            colors={[darkTheme.colors.accent]}
            progressBackgroundColor={darkTheme.colors.background}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.bannerWrap}>
              {bannerUri ? <Image source={{ uri: bannerUri }} style={styles.bannerImage} /> : <View style={styles.bannerFallback} />}
            </View>

            <View style={styles.storeInfoRow}>
              <View style={styles.logoWrap}>
                {logoUri ? <Image source={{ uri: logoUri }} style={styles.logoImage} /> : <View style={styles.logoFallback} />}
              </View>
              <View style={styles.storeTextWrap}>
                <AppText style={styles.storeName}>{storeName}</AppText>
                <View style={styles.ratingRow}>
                  <HugeiconsIcon icon={StarIcon} size={14} color={darkTheme.colors.accent} strokeWidth={2} />
                  <AppText style={styles.ratingText}>
                    {Number(reviewsSummary.average || 0).toFixed(1)} ({reviewsSummary.count || 0} reviews)
                  </AppText>
                </View>
              </View>
            </View>

            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

            <View style={styles.detailsGrid}>
              {infoCards.map((item) => (
                <View key={item.key} style={styles.infoCard}>
                  <AppText style={styles.infoLabel}>{item.label}</AppText>
                  <AppText style={styles.infoValue}>{item.value}</AppText>
                </View>
              ))}
            </View>

            <View style={styles.productsHeader}>
              <AppText style={styles.productsTitle}>Products from this store</AppText>
              <AppText style={styles.productsCount}>{products.length}</AppText>
            </View>
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyText}>No products found for this store.</AppText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard
            item={item}
            onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
          />
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000033',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: darkTheme.spacing.lg,
    paddingBottom: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    marginLeft: 12,
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 24,
  },
  bannerWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    height: 152,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerFallback: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  storeInfoRow: {
    marginTop: -24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#09113A',
    borderWidth: 3,
    borderColor: '#000033',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoFallback: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  storeTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginBottom: 8,
  },
  storeName: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  ratingRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  ratingText: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
  },
  errorText: {
    marginTop: 10,
    color: '#FF8B8B',
    textAlign: 'center',
  },
  detailsGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  infoCard: {
    width: '48.5%',
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  infoLabel: {
    color: darkTheme.colors.accent,
    fontSize: 12,
    marginBottom: 6,
  },
  infoValue: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  productsHeader: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productsTitle: {
    color: darkTheme.colors.text,
    fontSize: 15,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  productsCount: {
    color: darkTheme.colors.accent,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  productCard: {
    width: '48.5%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 10,
  },
  productImage: {
    width: '100%',
    height: 96,
    borderRadius: 10,
    resizeMode: 'cover',
    marginBottom: 8,
  },
  productImageFallback: {
    width: '100%',
    height: 96,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  productName: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  productPrice: {
    marginTop: 4,
    color: darkTheme.colors.accent,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.65)',
  },
});

export default StoreDetailsScreen;
