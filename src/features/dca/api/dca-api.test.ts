import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { dcaApi } from './dca-api';

const server = setupServer();
const plan = {
  id: 'plan-1',
  coinSymbol: 'BTC',
  coinName: 'Bitcoin',
  coinIcon: 'https://example.invalid/btc.png',
  frequency: 'weekly' as const,
  amountPerPurchase: 500000,
  nextExecution: '2026-10-01T00:00:00.000Z',
  status: 'active' as const,
  totalInvested: 1000000,
  currentHoldings: 0.01,
  averageCost: 100000000,
  createdAt: '2026-09-01T00:00:00.000Z',
};

const snapshot = {
  overview: {
    currentValue: 1100000,
    totalInvested: 1000000,
    profitLoss: 100000,
    profitLossPercent: 10,
    activePlans: 1,
    pausedPlans: 0,
    errorPlans: 0,
    nextExecution: { relativeTime: '10 ngày', amount: 500000 },
  },
  plans: [plan],
  purchaseHistory: [
    {
      id: 'purchase-1',
      planId: 'plan-1',
      coinSymbol: 'BTC',
      date: '2026-09-20T00:00:00.000Z',
      amountVND: 500000,
      coinAmount: 0.005,
      pricePerCoin: 100000000,
      status: 'completed' as const,
    },
  ],
  portfolioHistory: [
    {
      date: '2026-09-20T00:00:00.000Z',
      portfolioValue: 1100000,
      totalInvested: 1000000,
      hasPurchase: true,
    },
  ],
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('DCA API contract', () => {
  it('maps ISO date fields into domain dates', async () => {
    server.use(
      http.get('http://localhost:3000/api/dca/snapshot', () => HttpResponse.json(snapshot)),
    );

    const result = await dcaApi.getSnapshot();
    expect(result.plans[0].nextExecution).toBeInstanceOf(Date);
    expect(result.purchaseHistory[0].date).toBeInstanceOf(Date);
    expect(result.overview.currentValue).toBe(1100000);
  });

  it('sends idempotency keys for mutating plan operations', async () => {
    server.use(
      http.post('http://localhost:3000/api/dca/plans', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        return HttpResponse.json(plan, { status: 201 });
      }),
      http.patch('http://localhost:3000/api/dca/plans/plan-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        return HttpResponse.json(plan);
      }),
      http.delete('http://localhost:3000/api/dca/plans/plan-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(
      dcaApi.createPlan(
        { coinSymbol: 'BTC', frequency: 'weekly', amountPerPurchase: 500000 },
        'create-key',
      ),
    ).resolves.toMatchObject({ id: 'plan-1' });
    await expect(
      dcaApi.updatePlan('plan-1', { status: 'paused' }, 'update-key'),
    ).resolves.toMatchObject({
      status: 'active',
    });
    await expect(dcaApi.deletePlan('plan-1', 'delete-key')).resolves.toBeUndefined();
  });

  it('rejects malformed snapshots', async () => {
    server.use(
      http.get('http://localhost:3000/api/dca/snapshot', () =>
        HttpResponse.json({ ...snapshot, plans: [{ ...plan, amountPerPurchase: '500000' }] }),
      ),
    );

    await expect(dcaApi.getSnapshot()).rejects.toThrow();
  });
});
