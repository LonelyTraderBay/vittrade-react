import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';
import { queryClient as applicationQueryClient } from './query-client';

describe('application query retry policy', () => {
  it('does not retry 403 permission errors and keeps one retry for 503', async () => {
    const applicationDefaults = applicationQueryClient.getDefaultOptions();
    const testClient = new QueryClient({
      defaultOptions: {
        ...applicationDefaults,
        queries: {
          ...applicationDefaults.queries,
          retryDelay: 0,
        },
      },
    });
    let forbiddenAttempts = 0;
    let unavailableAttempts = 0;

    try {
      await expect(
        testClient.fetchQuery({
          queryKey: ['permission-denied'],
          queryFn: () => {
            forbiddenAttempts += 1;
            throw new ApiError('Forbidden', { status: 403 });
          },
        }),
      ).rejects.toMatchObject({ status: 403 });
      expect(forbiddenAttempts).toBe(1);

      await expect(
        testClient.fetchQuery({
          queryKey: ['temporarily-unavailable'],
          queryFn: () => {
            unavailableAttempts += 1;
            if (unavailableAttempts === 1) {
              throw new ApiError('Unavailable', { status: 503 });
            }
            return 'available';
          },
        }),
      ).resolves.toBe('available');
      expect(unavailableAttempts).toBe(2);
    } finally {
      testClient.clear();
    }
  });
});
