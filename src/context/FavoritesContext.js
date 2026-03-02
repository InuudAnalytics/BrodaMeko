import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const STORAGE_KEY_BASE = '@brodameko/favorites';

const FavoritesContext = createContext(undefined);

const normalizeId = (product) =>
  String(product?.id || product?._id || product?.product_id || product?.part_id || '').trim();

const sanitizeFavorites = (value) => {
  const list = Array.isArray(value) ? value : [];
  return list.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
};

export const FavoritesProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const ownerKey = useMemo(() => {
    const raw =
      user?.id ||
      user?._id ||
      user?.user_id ||
      user?.seller_id ||
      user?.email ||
      user?.phone_number ||
      user?.phoneNumber ||
      'guest';

    return String(raw || 'guest').trim() || 'guest';
  }, [user]);

  const storageKey = useMemo(
    () => `${STORAGE_KEY_BASE}:${String(role || 'unknown').toLowerCase()}:${ownerKey}`,
    [ownerKey, role]
  );

  useEffect(() => {
    const restore = async () => {
      setIsHydrated(false);
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setFavorites(sanitizeFavorites(parsed));
        } else {
          setFavorites([]);
        }
      } catch {
        setFavorites([]);
      } finally {
        setIsHydrated(true);
      }
    };

    restore();
  }, [storageKey]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    AsyncStorage.setItem(storageKey, JSON.stringify(favorites)).catch(() => {});
  }, [favorites, isHydrated, storageKey]);

  const isFavorite = useCallback(
    (productId) => favorites.some((item) => normalizeId(item) === String(productId || '').trim()),
    [favorites]
  );

  const toggleFavorite = useCallback((product) => {
    const productId = normalizeId(product);
    if (!productId) {
      return;
    }

    setFavorites((prev) => {
      const exists = prev.some((item) => normalizeId(item) === productId);
      if (exists) {
        return prev.filter((item) => normalizeId(item) !== productId);
      }
      return [product, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((productId) => {
    const safeId = String(productId || '').trim();
    setFavorites((prev) => prev.filter((item) => normalizeId(item) !== safeId));
  }, []);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      isHydrated,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
    }),
    [clearFavorites, favorites, isFavorite, removeFavorite, toggleFavorite, isHydrated]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

export default FavoritesContext;
