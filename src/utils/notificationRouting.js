import { ROLES, ROUTES } from './constants';

const safeString = (value) => String(value || '').trim();

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
  const orderId = safeString(payload?.order_id);
  const orderItemId = safeString(payload?.order_item_id);

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

