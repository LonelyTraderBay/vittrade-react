import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetDevTradingState } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetDevTradingState());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('development trading adapter', () => {
  it('keeps the order lifecycle stateful and idempotent', async () => {
    const createRequest = () =>
      fetch('http://localhost:3000/api/trading/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'place-order-123456',
        },
        body: JSON.stringify({
          symbol: 'BTC/USDT',
          side: 'buy',
          type: 'limit',
          amount: 0.1,
          price: 65_000,
        }),
      });

    const createdResponse = await createRequest();
    const created = await createdResponse.json();
    expect(createdResponse.status).toBe(201);
    expect(created).toMatchObject({ symbol: 'BTC/USDT', status: 'open', amount: 0.1 });

    const duplicateResponse = await createRequest();
    expect(await duplicateResponse.json()).toEqual(created);

    const openResponse = await fetch('http://localhost:3000/api/trading/orders?status=open');
    expect(await openResponse.json()).toEqual({ items: [created] });

    const modifyResponse = await fetch(`http://localhost:3000/api/trading/orders/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'modify-order-123456',
      },
      body: JSON.stringify({ price: 66_000, amount: 0.2 }),
    });
    const modified = await modifyResponse.json();
    expect(modified).toMatchObject({ id: created.id, price: 66_000, amount: 0.2 });

    const cancelResponse = await fetch(
      `http://localhost:3000/api/trading/orders/${created.id}/cancel`,
      {
        method: 'POST',
        headers: { 'Idempotency-Key': 'cancel-order-123456' },
      },
    );
    const cancelled = await cancelResponse.json();
    expect(cancelled).toMatchObject({ id: created.id, status: 'cancelled' });

    const historyResponse = await fetch('http://localhost:3000/api/trading/orders/history');
    expect(await historyResponse.json()).toEqual({ items: [cancelled] });
    const emptyOpenResponse = await fetch('http://localhost:3000/api/trading/orders');
    expect(await emptyOpenResponse.json()).toEqual({ items: [] });
  });

  it('rejects business mutations without idempotency keys', async () => {
    const response = await fetch('http://localhost:3000/api/trading/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: 'BTC/USDT', side: 'buy', type: 'market', amount: 0.1 }),
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
  });
});
