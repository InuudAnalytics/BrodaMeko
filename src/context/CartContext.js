import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  addMarketplaceCartItem,
  clearMarketplaceCart,
  getMarketplaceCart,
  removeMarketplaceCartItem,
  updateMarketplaceCartItem,
} from '../services/marketplace.service';

const CartContext = createContext(undefined);

const normalizeProductId = (product) =>
  String(product?.id || product?._id || product?.product_id || product?.part_id || '').trim();

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeCartItems = (payload) => {
  const root = payload?.data || payload || {};
  const cart = root?.cart || root?.data?.cart || root;
  const rawItems =
    cart?.items ||
    cart?.cart_items ||
    root?.items ||
    root?.data ||
    [];
  const list = Array.isArray(rawItems) ? rawItems : [];
  return list.map((item) => {
    const product = item?.part || item?.product || item?.item || item?.spare_part || {};
    return {
      id: String(item?.id || item?._id || '').trim(),
      productId: normalizeProductId(product) || String(item?.part_id || item?.product_id || '').trim(),
      product,
      quantity: toNumber(item?.quantity || item?.qty || 1, 1),
    };
  });
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getMarketplaceCart();
      const nextItems = normalizeCartItems(response);
      setItems(nextItems);
    } catch (loadError) {
      setError(loadError?.message || 'Could not load cart.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = useCallback(async (product, quantity = 1) => {
    const productId = normalizeProductId(product);
    if (!productId) {
      return;
    }

    const qty = Math.max(1, toNumber(quantity, 1));
    try {
      const response = await addMarketplaceCartItem({ part_id: productId, quantity: qty });
      const nextItems = normalizeCartItems(response);
      if (nextItems.length) {
        setItems(nextItems);
      } else {
        setItems((prev) => {
          const existing = prev.find((item) => item.productId === productId);
          if (existing) {
            return prev.map((item) =>
              item.productId === productId ? { ...item, quantity: item.quantity + qty } : item
            );
          }
          return [...prev, { id: '', productId, product, quantity: qty }];
        });
      }
    } catch (addError) {
      setError(addError?.message || 'Could not add item to cart.');
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    const safeId = String(productId || '').trim();
    const target = items.find((item) => item.productId === safeId);
    if (!target?.id) {
      setItems((prev) => prev.filter((item) => item.productId !== safeId));
      return;
    }

    try {
      await removeMarketplaceCartItem(target.id);
      setItems((prev) => prev.filter((item) => item.productId !== safeId));
    } catch (removeError) {
      setError(removeError?.message || 'Could not remove item.');
    }
  }, [items]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    const safeId = String(productId || '').trim();
    const nextQty = Math.max(0, toNumber(quantity, 0));
    const target = items.find((item) => item.productId === safeId);
    if (!target?.id) {
      setItems((prev) =>
        prev
          .map((item) =>
            item.productId === safeId ? { ...item, quantity: nextQty } : item
          )
          .filter((item) => item.quantity > 0)
      );
      return;
    }

    if (nextQty <= 0) {
      await removeFromCart(safeId);
      return;
    }

    try {
      await updateMarketplaceCartItem(target.id, { quantity: nextQty });
      setItems((prev) =>
        prev.map((item) =>
          item.productId === safeId ? { ...item, quantity: nextQty } : item
        )
      );
    } catch (updateError) {
      setError(updateError?.message || 'Could not update quantity.');
    }
  }, [items, removeFromCart]);

  const clearCart = useCallback(async () => {
    try {
      await clearMarketplaceCart();
    } catch (clearError) {
      setError(clearError?.message || 'Could not clear cart.');
    } finally {
      setItems([]);
    }
  }, []);

  const calculateTotal = useCallback(() => {
    return items.reduce((total, item) => {
      const price = toNumber(item.product?.price, 0);
      return total + price * item.quantity;
    }, 0);
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      calculateTotal,
      loading,
      error,
      reloadCart: loadCart,
    }),
    [addToCart, calculateTotal, clearCart, items, loadCart, removeFromCart, updateQuantity, loading, error]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export default CartContext;
