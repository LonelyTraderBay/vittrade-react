import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetDevPredictionState } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetDevPredictionState());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('development prediction adapter', () => {
  it('keeps order receipt creation idempotent and queryable', async () => {
    const request = () =>
      fetch('http://localhost:3000/api/predictions/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': 'prediction-order-001',
        },
        body: JSON.stringify({
          eventId: 'pred-1',
          outcome: 'Yes',
          side: 'buy',
          orderType: 'market',
          shares: 10,
        }),
      });

    const firstResponse = await request();
    const first = await firstResponse.json();
    expect(firstResponse.status).toBe(201);
    expect(first).toMatchObject({ eventId: 'pred-1', status: 'filled', shares: 10 });

    const replayResponse = await request();
    expect(replayResponse.status).toBe(200);
    expect(await replayResponse.json()).toEqual(first);

    const receiptResponse = await fetch(`http://localhost:3000/api/predictions/orders/${first.id}`);
    expect(await receiptResponse.json()).toEqual(first);
  });

  it('rejects missing idempotency and invalid market orders', async () => {
    const missingKeyResponse = await fetch('http://localhost:3000/api/predictions/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: 'pred-1', outcome: 'Yes', shares: 10 }),
    });
    expect(missingKeyResponse.status).toBe(400);
    expect(await missingKeyResponse.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });

    const invalidOrderResponse = await fetch('http://localhost:3000/api/predictions/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'prediction-invalid-001' },
      body: JSON.stringify({ eventId: 'unknown', outcome: 'Yes', side: 'buy', shares: 10 }),
    });
    expect(invalidOrderResponse.status).toBe(400);
    expect(await invalidOrderResponse.json()).toMatchObject({ code: 'PREDICTION_ORDER_INVALID' });
  });
});
