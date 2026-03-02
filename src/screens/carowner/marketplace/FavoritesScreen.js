import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import ProductCard from '../../../components/marketplace/ProductCard';
import { useFavorites } from '../../../context';
import { darkTheme } from '../../../theme';

const FavoritesScreen = ({ navigation }) => {
  const { favorites } = useFavorites();
  const [query, setQuery] = useState('');

  const data = useMemo(() => {
    if (!query.trim()) {
      return favorites;
    }
    const needle = query.trim().toLowerCase();
    return favorites.filter((item) => String(item?.name || '').toLowerCase().includes(needle));
  }, [favorites, query]);

  return (
    <ScreenContainer padded={false} edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>Favorites</AppText>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <HugeiconsIcon icon={Search01Icon} size={18} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              placeholder="Search for products"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>

        {!data.length ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>No favorites yet</AppText>
            <AppText style={styles.emptySubtitle}>Tap the heart on any product to save it here.</AppText>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item?.id || item?._id || item?.product_id || item?.part_id)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrap}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrap}>
                <ProductCard
                  product={item}
                  onPress={() => navigation.navigate('ProductDetails', { productId: item?.id })}
                  onAddToCart={() => {}}
                />
              </View>
            )}
          />
        )}
      </View>
    </ScreenContainer>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: darkTheme.typography.fontWeights.medium,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  listContent: {
    paddingBottom: 80,
  },
  columnWrap: {
    columnGap: 12,
  },
  cardWrap: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FavoritesScreen;
