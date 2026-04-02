import { ENDPOINTS } from '../config/endpoints';
import api from './api';

export const getMarketplaceParts = async (params = {}) => {
  const response = await api.get(ENDPOINTS.marketplace.partsList, { params });
  return response.data;
};

export const getMarketplacePart = async (partId) => {
  const safeId = String(partId || '').trim();
  if (!safeId) {
    const error = new Error('partId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.get(ENDPOINTS.marketplace.partDetails(safeId));
  return response.data;
};

export const getMarketplaceStore = async (storeId) => {
  const safeId = String(storeId || '').trim();
  if (!safeId) {
    const error = new Error('storeId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }

  const response = await api.get(ENDPOINTS.marketplace.storeDetails(safeId));
  return response.data;
};

export const getMarketplaceCart = async () => {
  const response = await api.get(ENDPOINTS.marketplace.cart);
  return response.data;
};

export const addMarketplaceCartItem = async ({ part_id, quantity }) => {
  const response = await api.post(ENDPOINTS.marketplace.cartItems, {
    part_id: String(part_id || '').trim(),
    quantity: Number(quantity || 1),
  });
  return response.data;
};

export const updateMarketplaceCartItem = async (itemId, { quantity }) => {
  const safeId = String(itemId || '').trim();
  if (!safeId) {
    const error = new Error('itemId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.patch(ENDPOINTS.marketplace.cartItem(safeId), {
    quantity: Number(quantity || 0),
  });
  return response.data;
};

export const removeMarketplaceCartItem = async (itemId) => {
  const safeId = String(itemId || '').trim();
  if (!safeId) {
    const error = new Error('itemId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.delete(ENDPOINTS.marketplace.cartItem(safeId));
  return response.data;
};

export const clearMarketplaceCart = async () => {
  const response = await api.delete(ENDPOINTS.marketplace.cartClear);
  return response.data;
};

export const checkoutMarketplaceOrder = async (payload) => {
  const response = await api.post(ENDPOINTS.marketplace.checkout, payload);
  return response.data;
};

export const getMarketplaceOrders = async () => {
  const response = await api.get(ENDPOINTS.marketplace.orders);
  return response.data;
};

export const getMarketplaceOrder = async (orderId) => {
  const safeId = String(orderId || '').trim();
  if (!safeId) {
    const error = new Error('orderId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.get(ENDPOINTS.marketplace.orderDetails(safeId));
  return response.data;
};

export const cancelMarketplaceOrder = async (orderId) => {
  const safeId = String(orderId || '').trim();
  if (!safeId) {
    const error = new Error('orderId is required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.patch(ENDPOINTS.marketplace.orderCancel(safeId));
  return response.data;
};

export const confirmMarketplaceOrderItem = async (orderId, itemId) => {
  const safeOrderId = String(orderId || '').trim();
  const safeItemId = String(itemId || '').trim();
  if (!safeOrderId || !safeItemId) {
    const error = new Error('orderId and itemId are required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.patch(ENDPOINTS.marketplace.orderConfirmItem(safeOrderId, safeItemId));
  return response.data;
};

export const receivedMarketplaceOrderItem = async (orderId, itemId) => {
  const safeOrderId = String(orderId || '').trim();
  const safeItemId = String(itemId || '').trim();
  if (!safeOrderId || !safeItemId) {
    const error = new Error('orderId and itemId are required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.patch(ENDPOINTS.marketplace.orderReceivedItem(safeOrderId, safeItemId));
  return response.data;
};

export const sellerConfirmMarketplacePickup = async (orderId, pickupCode) => {
  const safeOrderId = String(orderId || '').trim();
  const safePickupCode = String(pickupCode || '').replace(/\D/g, '').slice(0, 4);
  if (!safeOrderId || !safePickupCode) {
    const error = new Error('orderId and pickupCode are required.');
    error.statusCode = 400;
    error.data = null;
    throw error;
  }
  const response = await api.patch(ENDPOINTS.marketplace.orderPickupConfirm(safeOrderId), {
    pickup_code: safePickupCode,
  }, { skipUnauthorizedHandler: true });
  return response.data;
};

export default {
  getMarketplaceParts,
  getMarketplacePart,
  getMarketplaceStore,
  getMarketplaceCart,
  addMarketplaceCartItem,
  updateMarketplaceCartItem,
  removeMarketplaceCartItem,
  clearMarketplaceCart,
  checkoutMarketplaceOrder,
  getMarketplaceOrders,
  getMarketplaceOrder,
  cancelMarketplaceOrder,
  confirmMarketplaceOrderItem,
  receivedMarketplaceOrderItem,
  sellerConfirmMarketplacePickup,
};
