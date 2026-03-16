const setup = ({ allowV2 = true, v2Result, v2Error, legacyResult } = {}) => {
  jest.resetModules();

  const mockPost = jest.fn();
  const mockV2 = jest.fn();

  if (v2Error) {
    mockV2.mockRejectedValue(v2Error);
  } else {
    mockV2.mockResolvedValue(v2Result || { status: 'v2-ok' });
  }

  mockPost.mockResolvedValue(legacyResult || { data: { status: 'legacy-ok' } });

  jest.doMock('../src/services/api', () => ({
    __esModule: true,
    default: {
      post: mockPost,
      get: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  }));

  jest.doMock('../src/services/dispute.service', () => ({
    fileJobDisputeV2: mockV2,
  }));

  jest.doMock('../src/config/featureFlags', () => ({
    isDisputeV2EnabledForRole: jest.fn(() => allowV2),
  }));

  const jobsService = require('../src/services/jobs.service');
  const api = require('../src/services/api').default;
  return { jobsService, api, mockV2 };
};

describe('jobs.service fileJobDispute routing', () => {
  test('uses legacy endpoint when role flag disables v2', async () => {
    const { jobsService, api, mockV2 } = setup({ allowV2: false });

    const result = await jobsService.fileJobDispute('job-1', 'Need resolution', { role: 'car_owner' });

    expect(mockV2).not.toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('/api/v1/jobs/job-1/dispute', { reason: 'Need resolution' });
    expect(result).toEqual({ status: 'legacy-ok' });
  });

  test('uses v2 endpoint when role flag enables v2', async () => {
    const { jobsService, api, mockV2 } = setup({
      allowV2: true,
      v2Result: { status: 'v2-ok' },
    });

    const result = await jobsService.fileJobDispute('job-2', 'Reason text', { role: 'mechanic' });

    expect(mockV2).toHaveBeenCalledWith('job-2', { reason: 'Reason text' });
    expect(api.post).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'v2-ok' });
  });

  test('falls back to legacy endpoint when v2 returns 404', async () => {
    const { jobsService, api, mockV2 } = setup({
      allowV2: true,
      v2Error: { statusCode: 404 },
      legacyResult: { data: { status: 'fallback-ok' } },
    });

    const result = await jobsService.fileJobDispute('job-3', 'Late completion', { role: 'car_owner' });

    expect(mockV2).toHaveBeenCalledWith('job-3', { reason: 'Late completion' });
    expect(api.post).toHaveBeenCalledWith('/api/v1/jobs/job-3/dispute', { reason: 'Late completion' });
    expect(result).toEqual({ status: 'fallback-ok' });
  });
});
