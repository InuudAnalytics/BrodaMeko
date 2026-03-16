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
});
