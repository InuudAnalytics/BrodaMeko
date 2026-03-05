import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { getSellerParts } from '../services/spareParts.service';

const STORAGE_KEY_BASE = '@brodameko/seller_store';

const SellerStoreContext = createContext(undefined);

const sanitizeProducts = (value) => {
  const list = Array.isArray(value) ? value : [];
  return list.filter((item) => item && typeof item === 'object' && !Array.isArray(item));
};

export const SellerStoreProvider = ({ children }) => {
  const { user, role } = useAuth();
  const [products, setProducts] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const refreshStore = useCallback(async () => {
    setIsHydrated(false);
    setLoading(true);
    setError('');
    try {
      const response = await getSellerParts();
      const payload = response?.data || response || {};
      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.parts)
          ? payload.parts
          : Array.isArray(payload?.items)
            ? payload.items
            : Array.isArray(payload?.data)
              ? payload.data
              : [];
      if (list.length) {
        setProducts(sanitizeProducts(list));
      } else {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setProducts(sanitizeProducts(parsed));
        } else {
          setProducts([]);
        }
      }
    } catch (err) {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          setProducts(sanitizeProducts(parsed));
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      }
      setError(err?.message || 'Could not load store items.');
    } finally {
      setIsHydrated(true);
      setLoading(false);
    }
  }, [storageKey]);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(storageKey, JSON.stringify(products)).catch(() => {});
  }, [isHydrated, products, storageKey]);

  const addProduct = useCallback((product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const updateProduct = useCallback((productId, updates) => {
    const safeId = String(productId || '').trim();
    if (!safeId) return;
    setProducts((prev) =>
      prev.map((item) => (String(item?.id || item?._id || '') === safeId ? { ...item, ...updates } : item))
    );
  }, []);

  const removeProduct = useCallback((productId) => {
    const safeId = String(productId || '').trim();
    setProducts((prev) => prev.filter((item) => String(item?.id || item?._id || '') !== safeId));
  }, []);

  const resetStore = useCallback(() => {
    setProducts([]);
  }, []);

  const value = useMemo(
    () => ({
      products,
      isHydrated,
      loading,
      error,
      addProduct,
      updateProduct,
      removeProduct,
      resetStore,
      refreshStore,
    }),
    [addProduct, isHydrated, products, resetStore, loading, error, updateProduct, removeProduct, refreshStore]
  );

  return <SellerStoreContext.Provider value={value}>{children}</SellerStoreContext.Provider>;
};

export const useSellerStore = () => {
  const context = useContext(SellerStoreContext);

  if (!context) {
    throw new Error('useSellerStore must be used within SellerStoreProvider');
  }

  return context;
};

export default SellerStoreContext;
