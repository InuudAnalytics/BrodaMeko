import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

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
          setProducts(sanitizeProducts(parsed));
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
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

    AsyncStorage.setItem(storageKey, JSON.stringify(products)).catch(() => {});
  }, [isHydrated, products, storageKey]);

  const addProduct = useCallback((product) => {
    setProducts((prev) => [product, ...prev]);
  }, []);

  const resetStore = useCallback(() => {
    setProducts([]);
  }, []);

  const value = useMemo(
    () => ({
      products,
      isHydrated,
      addProduct,
      resetStore,
    }),
    [addProduct, isHydrated, products, resetStore]
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
