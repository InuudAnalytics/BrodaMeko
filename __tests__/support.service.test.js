jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

jest.mock('../src/services/telemetry.service', () => ({
  trackTelemetryEvent: jest.fn(),
}));

const api = require('../src/services/api').default;
const { createSupportTicket } = require('../src/services/support.service');

describe('support.service payloads', () => {
  beforeEach(() => {
    api.post.mockReset();
    api.get.mockReset();
    api.patch.mockReset();
  });

  test('createSupportTicket sends linked job dispute payload', async () => {
    api.post.mockResolvedValue({ data: { status: 'success' } });

    await createSupportTicket({
      subject: 'Dispute follow-up',
      category: 'job_dispute',
      priority: 'high',
      job_dispute_id: 'job-dispute-1',
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, payload] = api.post.mock.calls[0];
    expect(url).toBe('/api/v1/support/tickets');
    expect(payload).toMatchObject({
      subject: 'Dispute follow-up',
      category: 'job_dispute',
      priority: 'high',
      job_dispute_id: 'job-dispute-1',
    });
    expect(payload.order_dispute_id).toBeUndefined();
  });

  test('createSupportTicket sends linked order dispute payload', async () => {
    api.post.mockResolvedValue({ data: { status: 'success' } });

    await createSupportTicket({
      subject: 'Order dispute follow-up',
      category: 'order_dispute',
      priority: 'urgent',
      order_dispute_id: 'order-dispute-1',
    });

    const [, payload] = api.post.mock.calls[0];
    expect(payload).toMatchObject({
      subject: 'Order dispute follow-up',
      category: 'order_dispute',
      priority: 'urgent',
      order_dispute_id: 'order-dispute-1',
    });
    expect(payload.job_dispute_id).toBeUndefined();
  });
});
