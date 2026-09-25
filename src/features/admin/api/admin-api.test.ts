import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { adminApi } from './admin-api';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('admin API contract', () => {
  it('validates overview, funnel and A/B test responses', async () => {
    server.use(
      http.get('http://localhost:3000/api/admin/overview', () =>
        HttpResponse.json({
          activeUsers: 100,
          verifiedUsers: 80,
          grossVolume: '12345.67 USDT',
          generatedAt: '2026-09-22T08:00:00.000Z',
        }),
      ),
      http.get('http://localhost:3000/api/admin/analytics/funnel', () =>
        HttpResponse.json({ steps: [{ key: 'login', count: 100, conversionRate: 0.8 }] }),
      ),
      http.get('http://localhost:3000/api/admin/analytics/ab-tests', () =>
        HttpResponse.json({
          tests: [
            {
              id: 'test-1',
              key: 'trade-terminal',
              status: 'running',
              owner: 'growth',
              expiresAt: '2026-10-01T00:00:00.000Z',
              variants: [{ key: 'control', rolloutPercentage: 50 }],
            },
          ],
        }),
      ),
    );

    await expect(adminApi.getOverview()).resolves.toMatchObject({ activeUsers: 100 });
    await expect(adminApi.getFunnel()).resolves.toMatchObject({ steps: [{ key: 'login' }] });
    await expect(adminApi.listAbTests()).resolves.toMatchObject({ tests: [{ id: 'test-1' }] });
  });

  it('sends an idempotency key for feature-flag updates and rejects invalid payloads', async () => {
    server.use(
      http.patch('http://localhost:3000/api/admin/feature-flags/trading', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('admin-flag-update-001');
        return HttpResponse.json({
          key: 'trading',
          enabled: true,
          rolloutPercentage: 25,
          owner: 'platform',
          expiresAt: '2026-10-01T00:00:00.000Z',
          rollbackBehavior: 'previous-version',
        });
      }),
    );

    await expect(
      adminApi.updateFeatureFlag(
        'trading',
        {
          enabled: true,
          rolloutPercentage: 25,
          expiresAt: '2026-10-01T00:00:00.000Z',
          rollbackBehavior: 'previous-version',
        },
        'admin-flag-update-001',
      ),
    ).resolves.toMatchObject({ key: 'trading', rolloutPercentage: 25 });

    server.use(
      http.get('http://localhost:3000/api/admin/overview', () =>
        HttpResponse.json({ activeUsers: '100' }),
      ),
    );
    await expect(adminApi.getOverview()).rejects.toThrow();
  });
});
