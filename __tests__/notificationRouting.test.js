const { resolveNotificationRoute } = require('../src/utils/notificationRouting');
const { ROLES, ROUTES } = require('../src/utils/constants');

describe('notification routing', () => {
  test('routes ticket notifications to support chat', () => {
    const target = resolveNotificationRoute({
      role: ROLES.CAR_OWNER,
      notification: { data: { ticket_id: 'ticket-1' } },
    });

    expect(target).toEqual({
      route: ROUTES.SUPPORT_CHAT,
      params: { ticketId: 'ticket-1' },
    });
  });

  test('routes dispute notifications to dispute detail with order type', () => {
    const target = resolveNotificationRoute({
      role: ROLES.CAR_OWNER,
      notification: { data: { dispute_id: 'dispute-1', order_id: 'order-1' } },
    });

    expect(target.route).toBe(ROUTES.DISPUTE_DETAIL);
    expect(target.params).toMatchObject({
      disputeId: 'dispute-1',
      disputeType: 'order',
      sourceOrderId: 'order-1',
    });
  });

  test('routes seller order notifications to pickup order details', () => {
    const target = resolveNotificationRoute({
      role: ROLES.SPARE_PARTS_SELLER,
      notification: { data: { order_id: 'order-9', order_item_id: 'item-9' } },
    });

    expect(target).toEqual({
      route: ROUTES.SPARE_PARTS_PICKUP_ORDER_DETAILS,
      params: { orderId: 'order-9', itemId: 'item-9' },
    });
  });

  test('routes buyer pickup order notifications to pickup tracking', () => {
    const target = resolveNotificationRoute({
      role: ROLES.CAR_OWNER,
      notification: {
        type: 'order_paid',
        data: { order_id: 'order-2', order_item_id: 'item-2', fulfillment_type: 'pickup', pickup_code: '1234' },
      },
    });

    expect(target).toEqual({
      route: ROUTES.CAR_OWNER_PICKUP_TRACKING,
      params: { orderId: 'order-2', itemId: 'item-2', pickupCode: '1234' },
    });
  });

  test('routes mechanic pickup order notifications to mechanic pickup tracking', () => {
    const target = resolveNotificationRoute({
      role: ROLES.MECH,
      notification: {
        type: 'order_ready_for_pickup',
        data: { order_id: 'order-3', order_item_id: 'item-3' },
      },
    });

    expect(target).toEqual({
      route: ROUTES.MECH_PICKUP_TRACKING,
      params: { orderId: 'order-3', itemId: 'item-3', pickupCode: undefined },
    });
  });

  test('routes buyer delivery order notifications to order tracking', () => {
    const target = resolveNotificationRoute({
      role: ROLES.CAR_OWNER,
      notification: { data: { order_id: 'order-4', order_item_id: 'item-4', fulfillment_type: 'delivery' } },
    });

    expect(target).toEqual({
      route: 'OrderTracking',
      params: { orderId: 'order-4', itemId: 'item-4' },
    });
  });
});
