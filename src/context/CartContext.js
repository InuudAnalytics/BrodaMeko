import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(undefined);

const normalizeProductId = (product) =>
  String(product?.id || product?._id || product?.product_id || product?.part_id || '').trim();

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addToCart = useCallback((product, quantity = 1) => {
    const productId = normalizeProductId(product);
    if (!productId) {
      return;
    }

    const qty = Math.max(1, toNumber(quantity, 1));
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + qty } : item
        );
      }
      return [...prev, { productId, product, quantity: qty }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    const safeId = String(productId || '').trim();
    setItems((prev) => prev.filter((item) => item.productId !== safeId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    const safeId = String(productId || '').trim();
    const nextQty = Math.max(0, toNumber(quantity, 0));
    setItems((prev) =>
      prev
        .map((item) =>
          item.productId === safeId ? { ...item, quantity: nextQty } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
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
    }),
    [addToCart, calculateTotal, clearCart, items, removeFromCart, updateQuantity]
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
