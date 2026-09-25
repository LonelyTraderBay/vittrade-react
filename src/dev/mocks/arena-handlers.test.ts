import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { handlers, resetDevArenaState } from './handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetDevArenaState());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('development Arena adapter', () => {
  it('keeps challenge join idempotent and returns an audit event', async () => {
    const headers = { 'Idempotency-Key': 'arena-join-001' };
    const firstResponse = await fetch('http://localhost:3000/api/arena/challenges/ch001/join', {
      method: 'POST',
      headers,
    });
    const first = await firstResponse.json();
    expect(firstResponse.status).toBe(201);
    expect(first).toMatchObject({
      challenge: { id: 'ch001', slotsFilled: expect.any(Number) },
      auditEventId: expect.stringContaining('dev-arena-audit-'),
    });

    const replayResponse = await fetch('http://localhost:3000/api/arena/challenges/ch001/join', {
      method: 'POST',
      headers,
    });
    expect(replayResponse.status).toBe(200);
    expect(await replayResponse.json()).toEqual(first);
  });

  it('rejects a join without an idempotency key', async () => {
    const response = await fetch('http://localhost:3000/api/arena/challenges/ch001/join', {
      method: 'POST',
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
  });
});
