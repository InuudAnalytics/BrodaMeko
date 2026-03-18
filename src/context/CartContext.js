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
    const rawProduct = item?.part || item?.product || item?.item || item?.spare_part || {};
    const fallbackImageObject = item?.part_image && typeof item.part_image === 'object' ? item.part_image : null;
    const fallbackImageUri =
      String(
        fallbackImageObject?.url ||
          fallbackImageObject?.secure_url ||
          fallbackImageObject?.uri ||
          fallbackImageObject?.path ||
          ''
      ).trim();
    const productId =
      normalizeProductId(rawProduct) || String(item?.part_id || item?.product_id || '').trim();
    const normalizedProduct = {
      ...rawProduct,
      id: productId || String(rawProduct?.id || rawProduct?._id || '').trim(),
      storeId: String(
        rawProduct?.store_id ||
          rawProduct?.storeId ||
          item?.store_id ||
          item?.storeId ||
          ''
      ).trim(),
      name: String(rawProduct?.name || item?.part_name || item?.name || '').trim(),
      price: toNumber(rawProduct?.price ?? item?.unit_price, 0),
      shop: String(
        rawProduct?.shop ||
          rawProduct?.store_name ||
          rawProduct?.store?.name ||
          item?.store_name ||
          ''
      ).trim(),
      images: Array.isArray(rawProduct?.images)
        ? rawProduct.images
        : fallbackImageUri
          ? [fallbackImageUri]
          : [],
    };
    return {
      id: String(item?.id || item?._id || '').trim(),
      productId,
      product: normalizedProduct,
      quantity: toNumber(item?.quantity || item?.qty || 1, 1),
      subtotal: toNumber(item?.subtotal, 0),
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

  const findCartItem = useCallback((identifier) => {
    const safeIdentifier = String(identifier || '').trim();
    if (!safeIdentifier) {
      return null;
    }
    return (
      items.find((item) => String(item?.id || '').trim() === safeIdentifier) ||
      items.find((item) => String(item?.productId || '').trim() === safeIdentifier) ||
      null
    );
  }, [items]);

  const removeFromCart = useCallback(async (identifier) => {
    const target = findCartItem(identifier);
    const targetId = String(target?.id || '').trim();
    const targetProductId = String(target?.productId || '').trim();

    if (!target && identifier) {
      const fallbackId = String(identifier).trim();
      setItems((prev) =>
        prev.filter((item) => String(item?.id || '').trim() !== fallbackId && String(item?.productId || '').trim() !== fallbackId)
      );
      return;
    }

    if (!target?.id) {
      setItems((prev) =>
        prev.filter((item) => String(item?.productId || '').trim() !== targetProductId)
      );
      return;
    }

    try {
      await removeMarketplaceCartItem(targetId);
      setItems((prev) =>
        prev.filter((item) => String(item?.id || '').trim() !== targetId)
      );
    } catch (removeError) {
      setError(removeError?.message || 'Could not remove item.');
    }
  }, [findCartItem]);

  const updateQuantity = useCallback(async (identifier, quantity) => {
    const nextQty = Math.max(0, toNumber(quantity, 0));
    const target = findCartItem(identifier);
    const targetId = String(target?.id || '').trim();
    const targetProductId = String(target?.productId || '').trim();
    if (!target?.id) {
      setItems((prev) =>
        prev
          .map((item) =>
            String(item?.productId || '').trim() === targetProductId
              ? { ...item, quantity: nextQty }
              : item
          )
          .filter((item) => item.quantity > 0)
      );
      return;
    }

    if (nextQty <= 0) {
      await removeFromCart(targetId);
      return;
    }

    try {
      await updateMarketplaceCartItem(targetId, { quantity: nextQty });
      setItems((prev) =>
        prev.map((item) =>
          String(item?.id || '').trim() === targetId
            ? { ...item, quantity: nextQty }
            : item
        )
      );
    } catch (updateError) {
      setError(updateError?.message || 'Could not update quantity.');
    }
  }, [findCartItem, removeFromCart]);

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
      const lineSubtotal = toNumber(item?.subtotal, NaN);
      if (Number.isFinite(lineSubtotal) && lineSubtotal > 0) {
        return total + lineSubtotal;
      }
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
