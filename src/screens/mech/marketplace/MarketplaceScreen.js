import React from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  FilterHorizontalIcon,
  Search01Icon,
  ShoppingCart02Icon,
} from '@hugeicons/core-free-icons';
import { AppText, ScreenContainer } from '../../../components';
import MechanicTabBar from '../../../components/navigation/MechanicTabBar';
import { ROUTES } from '../../../utils';
import ProductCard from '../../../components/marketplace/ProductCard';
import { useCart } from '../../../context';
import { darkTheme } from '../../../theme';

const products = [
  {
    id: '1',
    name: 'Ceramic brake pads',
    price: 3000,
    shop: "Bello's benzo store",
    rating: 4.9,
    reviews: 98,
    images: ['https://picsum.photos/300'],
  },
  {
    id: '2',
    name: '12V power battery',
    price: 3000,
    shop: "Bello's benzo store",
    rating: 4.9,
    reviews: 98,
    images: ['https://picsum.photos/301'],
  },
  {
    id: '3',
    name: 'Ceramic brake pads',
    price: 3000,
    shop: "Bello's benzo store",
    rating: 4.9,
    reviews: 98,
    images: ['https://picsum.photos/302'],
  },
  {
    id: '4',
    name: 'Ceramic brake pads',
    price: 3000,
    shop: "Bello's benzo store",
    rating: 4.9,
    reviews: 98,
    images: ['https://picsum.photos/303'],
  },
];

const MechanicMarketplaceScreen = ({ navigation }) => {
  const { addToCart } = useCart();

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
        edges={['top', 'left', 'right']}
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
          data={products}
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
      <MechanicTabBar activeTab="marketplace" onTabPress={handleTabPress} />
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
