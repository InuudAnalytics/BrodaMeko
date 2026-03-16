jest.mock('../src/services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

jest.mock('../src/services/telemetry.service', () => ({
  trackTelemetryEvent: jest.fn(),
}));

const api = require('../src/services/api').default;
const { fileJobDisputeV2, fileOrderDispute } = require('../src/services/dispute.service');

class MockFormData {
  constructor() {
    this.__entries = [];
  }

  append(key, value) {
    this.__entries.push([key, value]);
  }
}

describe('dispute.service payloads', () => {
  beforeEach(() => {
    global.FormData = MockFormData;
    api.post.mockReset();
    api.get.mockReset();
  });

  test('fileJobDisputeV2 sends reason and evidence multipart fields', async () => {
    api.post.mockResolvedValue({ data: { status: 'success' } });

    await fileJobDisputeV2('job-123', {
      reason: 'Work not completed',
      evidence: [{ uri: 'file:///evidence.jpg', fileName: 'evidence.jpg', type: 'image/jpeg' }],
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = api.post.mock.calls[0];
    expect(url).toBe('/api/v1/dispute/jobs/job-123/dispute');
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

    const keys = formData.__entries.map(([key]) => key);
    expect(keys).toContain('reason');
    expect(keys).toContain('evidence');
  });

  test('fileOrderDispute sends reason, order_item_id and evidence', async () => {
    api.post.mockResolvedValue({ data: { status: 'success' } });

    await fileOrderDispute('order-456', {
      reason: 'Wrong part delivered',
      order_item_id: 'item-789',
      evidence: [{ uri: 'file:///wrong-part.jpg', type: 'image/jpeg' }],
    });

    expect(api.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = api.post.mock.calls[0];
    expect(url).toBe('/api/v1/dispute/orders/order-456/dispute');
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

    const fields = Object.fromEntries(
      formData.__entries.filter(([key, value]) => typeof value === 'string')
    );
    expect(fields.reason).toBe('Wrong part delivered');
    expect(fields.order_item_id).toBe('item-789');

    const keys = formData.__entries.map(([key]) => key);
    expect(keys).toContain('evidence');
  });
});
