import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { AppButton, AppText, NoInternetState, PullToRefreshIndicator, ScreenContainer } from '../../../components';
import { useSellerStore } from '../../../context';
import { deleteSellerPart, deleteSellerPartImage, updateSellerPart } from '../../../services/spareParts.service';
import { darkTheme } from '../../../theme';
import { ROUTES } from '../../../utils';

const SCREEN_BG = '#000033';

const CATEGORY_FILTERS = ['All parts', 'Engine', 'Brakes', 'Battery', 'Electrical'];

const formatCurrency = (value) => `₦${Number(value || 0).toLocaleString('en-NG')}`;

const normalizeCategory = (value) => {
  const raw = String(value || '').trim();
  return raw || 'All parts';
};

const SellerStoreScreen = ({ navigation, onBack }) => {
  const { products, isHydrated, loading, error, removeProduct, updateProduct, refreshStore } = useSellerStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(CATEGORY_FILTERS[0]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const pullDistance = useRef(new Animated.Value(0)).current;

  const filteredProducts = useMemo(() => {
    const query = String(search || '').trim().toLowerCase();
    const isAll = activeCategory === 'All parts';

    return products.filter((product) => {
      const name = String(product?.name || '').toLowerCase();
      const category = normalizeCategory(product?.category || product?.type);
      const matchesSearch = query ? name.includes(query) : true;
      const matchesCategory = isAll ? true : category.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, products, search]);

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
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

  const resolveImages = (product) => {
    const raw = product?.images || product?.image_urls || product?.image || [];
    if (typeof raw === 'string') {
      return [{ uri: raw }];
    }
    if (Array.isArray(raw)) {
      return raw.map((item) => {
        if (typeof item === 'string') {
          return { uri: item };
        }
        return {
          uri: resolveImageUri(item),
          publicId: item?.public_id || item?.publicId || item?.id || '',
        };
      });
    }
    return [];
  };

  const handleRemoveImage = async (image) => {
    if (!selectedProduct?.id || !image?.publicId) {
      return;
    }

    await deleteSellerPartImage(selectedProduct.id, image.publicId);
    const nextImages = resolveImages(selectedProduct).filter(
      (item) => item.publicId !== image.publicId
    );
    updateProduct(selectedProduct.id, { images: nextImages.map((item) => item.uri) });
    setSelectedProduct((prev) => (prev ? { ...prev, images: nextImages.map((item) => item.uri) } : prev));
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleAddProduct = () => {
    navigation.navigate(ROUTES.SPARE_PARTS_ADD_PRODUCT);
  };

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.85}
            onPress={() => {
              if (onBack) {
                onBack();
                return;
              }
              navigation.goBack();
            }}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={darkTheme.colors.text} strokeWidth={2.2} />
          </TouchableOpacity>
          <AppText style={styles.headerTitle}>Store</AppText>
        </View>

        <View style={styles.searchWrap}>
          <HugeiconsIcon icon={Search01Icon} size={18} color={darkTheme.colors.muted} strokeWidth={2} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search for products"
            placeholderTextColor={darkTheme.colors.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORY_FILTERS.map((category) => {
            const active = activeCategory === category;
            return (
              <TouchableOpacity
                key={category}
                activeOpacity={0.85}
                onPress={() => setActiveCategory(category)}
                style={[styles.filterChip, active ? styles.filterChipActive : null]}
              >
                <AppText style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
                  {category}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyTitle}>Loading store...</AppText>
          </View>
        ) : null}

        {!loading && error ? (
          <NoInternetState message={error} onRetry={refreshStore} style={styles.errorState} />
        ) : null}

        {!loading && !error && isHydrated && products.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText style={styles.emptyTitle}>No products yet</AppText>
            <AppText variant="muted" style={styles.emptySubtitle}>
              Add your first product to start selling.
            </AppText>
            <AppButton label="Add product" onPress={handleAddProduct} style={styles.emptyCta} />
          </View>
        ) : null}

        {!loading && !error && isHydrated && products.length > 0 ? (
          <View style={styles.listWrap}>
            <PullToRefreshIndicator pullDistance={pullDistance} refreshing={loading} />
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.listScroll}
              contentContainerStyle={styles.list}
              onScroll={event => {
                const offsetY = event.nativeEvent.contentOffset.y;
                const pullValue = offsetY < 0 ? Math.min(-offsetY, 140) : 0;
                pullDistance.setValue(pullValue);
              }}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={refreshStore}
                  tintColor="transparent"
                  colors={['transparent']}
                />
              }
            >
            {filteredProducts.map((product) => {
              const quantity = Number(product?.quantity ?? product?.stock_quantity ?? 0);
              const outOfStock = quantity <= 0;
              const category = normalizeCategory(product?.category || product?.type);
              const imageUri = resolveImageUri(product?.images?.[0]);

              return (
                <View key={product.id} style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.thumbWrap}>
                      {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.thumb} />
                      ) : (
                        <View style={styles.thumbFallback} />
                      )}
                    </View>
                    <View style={styles.cardInfo}>
                      <AppText style={styles.productName}>{product?.name || 'Product'}</AppText>
                      <AppText variant="muted" style={styles.productMeta}>
                        {category}  {outOfStock ? 'Out of stock' : `${quantity} in stock`}
                      </AppText>
                      <View style={[styles.badge, outOfStock ? styles.badgeOut : styles.badgeActive]}>
                        <AppText style={[styles.badgeText, outOfStock ? styles.badgeTextOut : styles.badgeTextActive]}>
                          {outOfStock ? 'Out of stock' : 'Active'}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <AppText style={styles.price}>{formatCurrency(product?.price)}</AppText>
                    <TouchableOpacity activeOpacity={0.85} onPress={() => openEditModal(product)}>
                      <AppText style={styles.editText}>Edit</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
            </Animated.ScrollView>
          </View>
        ) : null}
      </View>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={closeEditModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeEditModal}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <AppText style={styles.modalTitle}>Edit product</AppText>
            <AppText variant="muted" style={styles.modalSubtitle}>
              Editing is coming soon for {selectedProduct?.name || 'this product'}.
            </AppText>

            {selectedProduct ? (
              <View style={styles.modalImages}>
                <AppText style={styles.modalSectionTitle}>Product images</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalImageRow}>
                  {resolveImages(selectedProduct).map((image, index) => (
                    <View key={`${image.uri}-${index}`} style={styles.modalImageTile}>
                      {image.uri ? (
                        <Image source={{ uri: image.uri }} style={styles.modalImage} />
                      ) : (
                        <View style={styles.modalImageFallback} />
                      )}
                      {image.publicId ? (
                        <TouchableOpacity
                          style={styles.modalRemove}
                          activeOpacity={0.85}
                          onPress={() => handleRemoveImage(image)}
                        >
                          <AppText style={styles.modalRemoveText}>Remove</AppText>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <AppButton
                label="Deactivate"
                onPress={async () => {
                  if (!selectedProduct?.id) return;
                  await updateSellerPart(selectedProduct.id, { is_available: false });
                  updateProduct(selectedProduct.id, { is_available: false });
                  closeEditModal();
                }}
                style={styles.modalButton}
              />
              <AppButton
                label="Delete"
                onPress={async () => {
                  if (!selectedProduct?.id) return;
                  await deleteSellerPart(selectedProduct.id);
                  removeProduct(selectedProduct.id);
                  closeEditModal();
                }}
                style={styles.modalDeleteButton}
                textStyle={styles.modalDeleteText}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  searchWrap: {
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkTheme.colors.inputBorder,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  searchInput: {
    flex: 1,
    color: darkTheme.colors.text,
    fontSize: 13,
  },
  filterRow: {
    paddingTop: 12,
    paddingBottom: 6,
    columnGap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: darkTheme.colors.accent,
  },
  filterChipText: {
    color: darkTheme.colors.text,
    fontSize: 12,
  },
  filterChipTextActive: {
    color: '#1A1A1A',
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  list: {
    paddingTop: 10,
    paddingBottom: 20,
    rowGap: 14,
    justifyContent: 'flex-start',
  },
  listWrap: {
    flex: 1,
  },
  errorState: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginRight: 12,
  },
  thumb: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbFallback: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cardInfo: {
    flex: 1,
  },
  productName: {
    color: darkTheme.colors.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  productMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(22,140,63,0.95)',
  },
  badgeOut: {
    backgroundColor: 'rgba(205,72,72,0.9)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  badgeTextActive: {
    color: '#F5F5F5',
  },
  badgeTextOut: {
    color: '#F5F5F5',
  },
  cardRight: {
    alignItems: 'flex-end',
    rowGap: 8,
    paddingLeft: 8,
  },
  price: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  editText: {
    color: darkTheme.colors.muted,
    fontSize: 12,
  },
  emptyState: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    color: darkTheme.colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 16,
    minWidth: 160,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: darkTheme.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  modalTitle: {
    color: darkTheme.colors.text,
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.semibold,
  },
  modalSubtitle: {
    marginTop: 8,
    color: darkTheme.colors.muted,
    fontSize: 13,
  },
  modalButton: {
    marginTop: 16,
  },
  modalActions: {
    width: '100%',
    rowGap: 10,
    marginTop: 16,
  },
  modalImages: {
    marginTop: 14,
  },
  modalSectionTitle: {
    color: darkTheme.colors.text,
    fontSize: 13,
    fontWeight: darkTheme.typography.fontWeights.semibold,
    marginBottom: 8,
  },
  modalImageRow: {
    columnGap: 10,
    paddingBottom: 4,
  },
  modalImageTile: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalImageFallback: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modalRemove: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modalRemoveText: {
    color: '#F87171',
    fontSize: 10,
  },
  modalDeleteButton: {
    backgroundColor: '#F87171',
  },
  modalDeleteText: {
    color: '#1A1A1A',
  },
});

export default SellerStoreScreen;
