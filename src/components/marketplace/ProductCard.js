import React from 'react';
import { Image, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { FavouriteIcon, ShoppingCart02Icon, StarIcon } from '@hugeicons/core-free-icons';
import { AppText } from '../';
import { useFavorites } from '../../context';

const ProductCard = ({ product, onPress, onAddToCart }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const imageUri = product?.images?.[0] || '';
  const favorited = isFavorite(product?.id);

  const handleFavoritePress = (event) => {
    if (event?.stopPropagation) {
      event.stopPropagation();
    }
    toggleFavorite(product);
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.imageWrap}>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} /> : <View style={styles.imagePlaceholder} />}
        <Pressable
          style={[styles.favoriteBadge, favorited ? styles.favoriteBadgeActive : null]}
          onPress={handleFavoritePress}
          hitSlop={10}
        >
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={16}
            color={favorited ? '#EF4444' : '#FFFFFF'}
            strokeWidth={2}
            fill={favorited ? '#EF4444' : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.infoWrap}>
        <AppText style={styles.name} numberOfLines={1}>
          {product?.name || 'Product'}
        </AppText>
        <AppText style={styles.shop} numberOfLines={1}>
          {product?.shop || 'Seller'}
        </AppText>
        <View style={styles.ratingRow}>
          <HugeiconsIcon icon={StarIcon} size={12} color="#E6C714" strokeWidth={2} />
          <AppText style={styles.ratingText}>
            {product?.rating?.toFixed?.(1) || product?.rating || '0.0'} ({product?.reviews || 0})
          </AppText>
        </View>

        <View style={styles.bottomRow}>
          <AppText style={styles.price}>₦{Number(product?.price || 0).toLocaleString('en-NG')}</AppText>
          <TouchableOpacity style={styles.cartButton} activeOpacity={0.85} onPress={onAddToCart}>
            <HugeiconsIcon icon={ShoppingCart02Icon} size={18} color="#E6C714" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A4A',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imageWrap: {
    position: 'relative',
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBadgeActive: {
    backgroundColor: 'rgba(239,68,68,0.18)',
  },
  infoWrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  shop: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 4,
    marginTop: 6,
  },
  ratingText: {
    color: '#E6C714',
    fontSize: 11,
  },
  bottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    color: '#E6C714',
    fontSize: 13,
    fontWeight: '700',
  },
  cartButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230,199,20,0.6)',
  },
});

export default ProductCard;
