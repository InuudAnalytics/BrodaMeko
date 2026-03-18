import { ROLES, ROUTES } from './constants';

const safeString = (value) => String(value || '').trim();
const toLower = (value) => safeString(value).toLowerCase();
const toBool = (value) => {
  if (typeof value === 'boolean') return value;
  const text = toLower(value);
  return text === 'true' || text === '1' || text === 'yes';
};

export const resolveDisputeType = (payload = {}, fallbackType = '') => {
  const type = safeString(payload?.dispute_type || payload?.type || fallbackType).toLowerCase();
  if (type === 'order') {
    return 'order';
  }
  if (type === 'job') {
    return 'job';
  }

  if (safeString(payload?.order_id) || safeString(payload?.order_item_id)) {
    return 'order';
  }
  return 'job';
};

export const resolveNotificationRoute = ({ notification, role }) => {
  const payload = notification?.data && typeof notification.data === 'object' ? notification.data : {};
  const ticketId = safeString(payload?.ticket_id || payload?.support_ticket_id);
  const disputeId = safeString(payload?.dispute_id);
  const orderId = safeString(payload?.order_id || payload?.orderId);
  const orderItemId = safeString(payload?.order_item_id || payload?.orderItemId);
  const pickupCode = safeString(payload?.pickup_code || payload?.pickupCode);
  const fulfillmentType = toLower(
    payload?.fulfillment_type ||
    payload?.fulfillmentType ||
    payload?.delivery_type ||
    payload?.deliveryType ||
    payload?.order_type ||
    payload?.orderType ||
    payload?.fulfilment_type ||
    payload?.fulfilmentType ||
    payload?.fulfillment_mode ||
    payload?.fulfillmentMode
  );
  const notificationType = toLower(notification?.type);
  const bodyText = toLower(notification?.body || notification?.message || '');
  const titleText = toLower(notification?.title || '');
  const explicitPickup = toBool(payload?.is_pickup) || toBool(payload?.isPickup);
  const mentionsPickup = notificationType.includes('pickup') || bodyText.includes('pickup') || titleText.includes('pickup');
  const isPickupOrder =
    explicitPickup ||
    fulfillmentType === 'pickup' ||
    fulfillmentType === 'pick_up' ||
    fulfillmentType === 'pick-up' ||
    fulfillmentType === 'collection' ||
    fulfillmentType === 'collect' ||
    Boolean(pickupCode) ||
    mentionsPickup;

  if (ticketId) {
    return {
      route: ROUTES.SUPPORT_CHAT,
      params: { ticketId },
    };
  }

  if (disputeId) {
    const disputeType = resolveDisputeType(payload, notification?.type);
    return {
      route: ROUTES.DISPUTE_DETAIL,
      params: {
        disputeId,
        disputeType,
        sourceOrderId: disputeType === 'order' ? orderId : '',
        sourceOrderItemId: disputeType === 'order' ? orderItemId : '',
        sourceJobId: disputeType === 'job' ? safeString(payload?.job_id) : '',
      },
    };
  }

  if (orderId) {
    if (role === ROLES.SPARE_PARTS_SELLER) {
      return {
        route: ROUTES.SPARE_PARTS_PICKUP_ORDER_DETAILS,
        params: { orderId, itemId: orderItemId || undefined },
      };
    }

    if (isPickupOrder) {
      return {
        route: role === ROLES.MECH ? ROUTES.MECH_PICKUP_TRACKING : ROUTES.CAR_OWNER_PICKUP_TRACKING,
        params: {
          orderId,
          itemId: orderItemId || undefined,
          pickupCode: pickupCode || undefined,
        },
      };
    }

    return {
      route: 'OrderTracking',
      params: { orderId, itemId: orderItemId || undefined },
    };
  }

  return null;
};

export default {
  resolveNotificationRoute,
  resolveDisputeType,
};

