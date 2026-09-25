import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApiError } from '@/shared/api/api-error';
import { tradingApi } from './trading-api';

const server = setupServer();

const order = {
  id: 'order-1',
  symbol: 'BTC/USDT',
  side: 'buy' as const,
  type: 'limit' as const,
  price: 65_000,
  amount: 0.1,
  filled: 0,
  status: 'open' as const,
  createdAt: '2026-09-21T10:00:00.000Z',
  fee: 0,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('trading API contract', () => {
  it('lists open orders and sends the status filter', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/orders', ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBe('open');
        return HttpResponse.json({ items: [order] });
      }),
    );

    await expect(tradingApi.listOpenOrders({ symbol: 'BTC/USDT' })).resolves.toEqual({
      items: [order],
    });
  });

  it('places an order with an idempotency key and validates the response', async () => {
    server.use(
      http.post('http://localhost:3000/api/trading/orders', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('place-123456');
        expect(await request.json()).toMatchObject({ symbol: 'BTC/USDT', amount: 0.1 });
        return HttpResponse.json(order, { status: 201 });
      }),
    );

    await expect(
      tradingApi.placeOrder({
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 65_000,
        idempotencyKey: 'place-123456',
      }),
    ).resolves.toEqual(order);
  });

  it('maps an order conflict into the shared ApiError boundary', async () => {
    server.use(
      http.post('http://localhost:3000/api/trading/orders/order-1/cancel', () =>
        HttpResponse.json(
          { code: 'ORDER_ALREADY_CLOSED', message: 'Order already closed' },
          { status: 409, headers: { 'X-Request-ID': 'cancel-request-1' } },
        ),
      ),
    );

    const error = await tradingApi
      .cancelOrder('order-1', 'cancel-123456')
      .catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'ORDER_ALREADY_CLOSED',
      requestId: 'cancel-request-1',
    });
  });

  it('rejects malformed order responses', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/orders/history', () =>
        HttpResponse.json({ items: [{ ...order, amount: '0.1' }] }),
      ),
    );

    await expect(tradingApi.listOrderHistory()).rejects.toThrow();
  });

  it.each([
    ['overfilled amount', { ...order, filled: 0.2 }],
    ['filled status with an incomplete amount', { ...order, status: 'filled', filled: 0.05 }],
    ['partial status with no fill', { ...order, status: 'partial', filled: 0 }],
    ['invalid timestamp', { ...order, createdAt: 'yesterday' }],
    ['non-positive execution price', { ...order, price: 0 }],
  ])('rejects an order with an invalid %s', async (_case, invalidOrder) => {
    server.use(
      http.get('http://localhost:3000/api/trading/orders/history', () =>
        HttpResponse.json({ items: [invalidOrder] }),
      ),
    );

    await expect(tradingApi.listOrderHistory()).rejects.toThrow();
  });

  it('loads copy providers with ranking and compliance filters', async () => {
    const provider = {
      id: 'provider-1',
      name: 'Alpha',
      avatar: 'A',
      winRate: 78,
      totalPnl: 12_000,
      totalPnlPct: 42,
      aum: 100_000,
      copiers: 200,
      maxCopiers: 500,
      sharpeRatio: 2.1,
      maxDrawdown: -9,
      totalTrades: 100,
      avgHoldingTime: '4h',
      weeklyPnl: [1, 2],
      tags: ['Stable'],
      isFollowing: false,
      riskLevel: 'low' as const,
      verified: true,
    };
    server.use(
      http.get('http://localhost:3000/api/trading/copy/providers', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('sort')).toBe('sharpe');
        expect(url.searchParams.get('risk')).toBe('low');
        expect(url.searchParams.get('verified')).toBe('true');
        return HttpResponse.json({ items: [provider] });
      }),
    );

    await expect(
      tradingApi.listCopyProviders({ sort: 'sharpe', risk: 'low', verified: true }),
    ).resolves.toEqual({ items: [provider] });
  });

  it('loads a copy provider profile with server-owned performance history', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/copy/providers/provider-1', () =>
        HttpResponse.json({
          provider: {
            id: 'provider-1',
            name: 'Alpha',
            avatar: 'A',
            winRate: 78,
            totalPnl: 12_000,
            totalPnlPct: 42,
            aum: 100_000,
            copiers: 200,
            maxCopiers: 500,
            sharpeRatio: 2.1,
            maxDrawdown: -9,
            totalTrades: 100,
            avgHoldingTime: '4h',
            weeklyPnl: [1, 2],
            tags: ['Stable'],
            isFollowing: false,
            riskLevel: 'low',
            verified: true,
          },
          pnlHistory: [{ day: '1', pnl: 100, cumPnl: 100 }],
          recentTrades: [
            {
              id: 'trade-1',
              pair: 'BTC/USDT',
              side: 'long',
              entry: 65_000,
              pnl: 100,
              pnlPct: 1.2,
              time: 'now',
              status: 'open',
            },
          ],
        }),
      ),
    );

    await expect(tradingApi.getCopyProviderProfile('provider-1')).resolves.toMatchObject({
      provider: { id: 'provider-1', verified: true },
      recentTrades: [{ pair: 'BTC/USDT', status: 'open' }],
    });
  });

  it('lists authenticated copy relationships', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/copy/relationships', () =>
        HttpResponse.json({
          items: [
            {
              id: 'copy-1',
              provider: {
                id: 'provider-1',
                name: 'Alpha',
                avatar: 'A',
                winRate: 78,
                totalPnl: 12_000,
                totalPnlPct: 42,
                aum: 100_000,
                copiers: 200,
                maxCopiers: 500,
                sharpeRatio: 2.1,
                maxDrawdown: -9,
                totalTrades: 100,
                avgHoldingTime: '4h',
                weeklyPnl: [1, 2],
                tags: ['Stable'],
                isFollowing: true,
                riskLevel: 'low',
                verified: true,
              },
              status: 'active',
              copyMode: 'mirror',
              positionSizing: 'percentage',
              copyRatio: 50,
              capital: 5_000,
              currentValue: 5_200,
              pnl: 200,
              pnlPct: 4,
              trades: 10,
              winRate: 80,
              hasCustomStopLoss: true,
              stopLossLevel: 10,
              performanceHistory: [{ date: '2026-09-21', value: 5_200 }],
            },
          ],
        }),
      ),
    );

    await expect(tradingApi.listCopyRelationships()).resolves.toMatchObject({
      items: [{ id: 'copy-1', status: 'active', provider: { isFollowing: true } }],
    });
  });

  it('creates a copy relationship with an idempotency key and no retry', async () => {
    server.use(
      http.post('http://localhost:3000/api/trading/copy/relationships', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('copy-create-123');
        expect(await request.json()).toMatchObject({
          providerId: 'provider-1',
          capital: 1_000,
          copyMode: 'smart',
        });
        return HttpResponse.json({ copyId: 'copy-2', status: 'active' }, { status: 201 });
      }),
    );

    await expect(
      tradingApi.createCopyRelationship(
        {
          providerId: 'provider-1',
          capital: 1_000,
          copyMode: 'smart',
          positionSizing: 'percentage',
          copyRatio: 25,
        },
        'copy-create-123',
      ),
    ).resolves.toEqual({ copyId: 'copy-2', status: 'active' });
  });

  it('stops a copy relationship with an idempotency key', async () => {
    server.use(
      http.post(
        'http://localhost:3000/api/trading/copy/relationships/copy-1/stop',
        async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBe('copy-stop-123');
          expect(await request.json()).toEqual({
            reason: 'Không còn phù hợp với khẩu vị rủi ro',
            closeOpenPositions: true,
          });
          return HttpResponse.json({
            id: 'copy-1',
            provider: {
              id: 'provider-1',
              name: 'Alpha',
              avatar: 'A',
              winRate: 78,
              totalPnl: 12_000,
              totalPnlPct: 42,
              aum: 100_000,
              copiers: 200,
              maxCopiers: 500,
              sharpeRatio: 2.1,
              maxDrawdown: -9,
              totalTrades: 100,
              avgHoldingTime: '4h',
              weeklyPnl: [1, 2],
              tags: ['Stable'],
              isFollowing: true,
              riskLevel: 'low',
              verified: true,
            },
            status: 'stopped',
            copyMode: 'mirror',
            positionSizing: 'percentage',
            capital: 5_000,
            currentValue: 5_200,
            pnl: 200,
            pnlPct: 4,
            trades: 10,
            winRate: 80,
            hasCustomStopLoss: false,
            performanceHistory: [],
          });
        },
      ),
    );

    await expect(
      tradingApi.stopCopyRelationship(
        'copy-1',
        { reason: 'Không còn phù hợp với khẩu vị rủi ro', closeOpenPositions: true },
        'copy-stop-123',
      ),
    ).resolves.toMatchObject({ id: 'copy-1', status: 'stopped' });
  });
});
