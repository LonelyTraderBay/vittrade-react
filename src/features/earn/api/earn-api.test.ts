import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { earnApi } from './earn-api';

const server = setupServer();
const snapshot = {
  products: [
    {
      id: 'sav001',
      domain: 'savings',
      type: 'flexible',
      name: 'USDT Linh hoạt',
      asset: 'USDT',
      apy: 4.5,
      minAmount: 10,
      remainingQuota: 'Không giới hạn',
      participants: 100,
      totalStaked: '1M USDT',
      color: '#26A17B',
      riskLevel: 'low',
    },
  ],
  positions: [],
  balances: { USDT: 1000 },
  summary: { totalDepositedUsd: 0, totalEarnedUsd: 0, averageApy: 0, activePositions: 0 },
};
const receipt = {
  id: 'receipt-1',
  operation: 'subscribe' as const,
  productId: 'sav001',
  positionId: 'position-1',
  asset: 'USDT',
  amount: 100,
  status: 'completed' as const,
  createdAt: '2026-09-22T00:00:00.000Z',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Earn API contract', () => {
  it('validates and maps the snapshot boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/earn/snapshot', () => HttpResponse.json(snapshot)),
    );
    await expect(earnApi.getSnapshot()).resolves.toMatchObject({ products: [{ id: 'sav001' }] });
  });

  it('validates a domain-scoped, cursor-paginated transaction page', async () => {
    server.use(
      http.get('http://localhost:3000/api/earn/transactions', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('domain')).toBe('savings');
        expect(url.searchParams.get('cursor')).toBe('cursor-2');
        expect(url.searchParams.get('limit')).toBe('10');
        return HttpResponse.json({
          items: [
            {
              id: 'tx-2',
              domain: 'savings',
              operation: 'redeem',
              productId: 'sav001',
              product: 'USDT Linh hoạt',
              asset: 'USDT',
              amount: 50,
              status: 'completed',
              createdAt: '2026-09-22T00:00:00.000Z',
            },
          ],
        });
      }),
    );

    await expect(
      earnApi.getTransactions({ domain: 'savings', cursor: 'cursor-2', limit: 10 }),
    ).resolves.toMatchObject({ items: [{ id: 'tx-2', operation: 'redeem' }] });
  });

  it('rejects malformed transaction entries at the API boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/earn/transactions', () =>
        HttpResponse.json({
          items: [
            {
              id: 'tx-invalid',
              domain: 'savings',
              operation: 'subscribe',
              productId: 'sav001',
              product: 'USDT Linh hoạt',
              asset: 'USDT',
              amount: '500',
              status: 'completed',
              createdAt: 'not-a-date',
            },
          ],
        }),
      ),
    );

    await expect(earnApi.getTransactions({ domain: 'savings' })).rejects.toThrow();
  });

  it('requires idempotency keys for subscribe and redeem mutations', async () => {
    server.use(
      http.post('http://localhost:3000/api/earn/subscriptions', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('subscribe-key');
        return HttpResponse.json(receipt, { status: 201 });
      }),
      http.post('http://localhost:3000/api/earn/redemptions', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('redeem-key');
        return HttpResponse.json({ ...receipt, operation: 'redeem' }, { status: 201 });
      }),
    );

    await expect(
      earnApi.subscribe({ productId: 'sav001', amount: 100 }, 'subscribe-key'),
    ).resolves.toMatchObject({ id: 'receipt-1' });
    await expect(
      earnApi.redeem({ positionId: 'position-1', amount: 50 }, 'redeem-key'),
    ).resolves.toMatchObject({ operation: 'redeem' });
  });

  it('rejects malformed responses instead of leaking untyped data into UI', async () => {
    server.use(
      http.get('http://localhost:3000/api/earn/snapshot', () =>
        HttpResponse.json({ ...snapshot, balances: { USDT: '1000' } }),
      ),
    );
    await expect(earnApi.getSnapshot()).rejects.toThrow();
  });
});
