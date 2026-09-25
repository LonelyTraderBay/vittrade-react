import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { predictionsApi } from './predictions-api';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const event = {
  id: 'pred-1',
  title: 'BTC reaches target?',
  category: 'Live Crypto',
  tags: ['BTC'],
  outcomes: [
    { label: 'Yes', chance: 60, color: '#10B981' },
    { label: 'No', chance: 40, color: '#EF4444' },
  ],
  volume24h: 1000,
  totalVolume: 5000,
  endDate: '2026-12-01T00:00:00Z',
  liquidity: 2000,
  participants: 10,
  status: 'active',
  change24h: 1.2,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('predictions API contract', () => {
  it('loads and validates events through the API boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/predictions/events', () =>
        HttpResponse.json({ items: [event] }),
      ),
    );
    await expect(predictionsApi.listEvents({ status: 'active' })).resolves.toMatchObject({
      items: [{ id: 'pred-1' }],
    });
  });

  it('rejects an invalid event response', async () => {
    server.use(
      http.get('http://localhost:3000/api/predictions/events/pred-1', () =>
        HttpResponse.json({ ...event, participants: '10' }),
      ),
    );
    await expect(predictionsApi.getEvent('pred-1')).rejects.toThrow();
  });

  it('places an order with an idempotency key and validates its receipt', async () => {
    const receipt = {
      id: 'order-1',
      eventId: event.id,
      eventTitle: event.title,
      outcome: 'Yes',
      side: 'buy',
      orderType: 'market',
      shares: 10,
      filledShares: 10,
      price: 0.6,
      avgPrice: 0.6,
      total: 6,
      fee: 0.12,
      status: 'filled',
      createdAt: '2026-09-22T00:00:00Z',
      updatedAt: '2026-09-22T00:00:00Z',
      timeline: [{ label: 'Filled', date: 'now', done: true }],
    };
    server.use(
      http.post('http://localhost:3000/api/predictions/orders', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('prediction-key-001');
        return HttpResponse.json(receipt, { status: 201 });
      }),
    );
    await expect(
      predictionsApi.placeOrder(
        { eventId: event.id, outcome: 'Yes', side: 'buy', orderType: 'market', shares: 10 },
        'prediction-key-001',
      ),
    ).resolves.toMatchObject({ id: 'order-1', status: 'filled' });
  });
});
