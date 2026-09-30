import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  marketCalendarResponseSchema,
  marketCorrelationsResponseSchema,
  marketDerivativesResponseSchema,
  marketNewsResponseSchema,
  marketSentimentResponseSchema,
  marketSignalsResponseSchema,
  marketTokenUnlocksResponseSchema,
} from '@/features/market/api/market-research-schemas';
import { p2pApi } from '@/features/p2p/api/p2p-api';
import { handlers, resetDevDcaState, resetDevTradingState } from './handlers';
import { previewScenarioHandler } from './preview-scenario-handler';
import { resetDevMockRuntime, setDevPreviewScenario } from './scenario-runtime';

const server = setupServer(previewScenarioHandler, ...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetDevMockRuntime();
  resetDevDcaState();
  resetDevTradingState();
});
afterAll(() => server.close());

function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  return fetch(`http://localhost/api${path}`, { ...init, headers });
}

describe('development preview scenario MSW handler', () => {
  it('serves schema-valid source fixtures only in the Market success preview', async () => {
    setDevPreviewScenario({ domain: 'market', state: 'success' });

    const cases = [
      ['/market/news?limit=10', marketNewsResponseSchema],
      ['/market/calendar', marketCalendarResponseSchema],
      ['/market/correlations?window=30d', marketCorrelationsResponseSchema],
      ['/market/unlocks?window=30d', marketTokenUnlocksResponseSchema],
      ['/market/derivatives', marketDerivativesResponseSchema],
      ['/market/sentiment?window=24h', marketSentimentResponseSchema],
      ['/market/signals', marketSignalsResponseSchema],
    ] as const;

    for (const [path, schema] of cases) {
      const response = await request(path);
      expect(response.status, path).toBe(200);
      expect(schema.safeParse(await response.json()).success, path).toBe(true);
    }

    resetDevMockRuntime();
    const unconfiguredSourceResponse = await request('/market/news');
    expect(unconfiguredSourceResponse.status).toBe(503);
  });

  it('returns only the declared 503 response for Market provider reads', async () => {
    setDevPreviewScenario({ domain: 'market', state: 'error' });

    const providerPaths = [
      '/market/news',
      '/market/calendar',
      '/market/correlations',
      '/market/unlocks',
      '/market/derivatives',
      '/market/sentiment',
      '/market/signals',
    ];

    for (const path of providerPaths) {
      const response = await request(path);
      expect(response.status, path).toBe(503);
      expect(await response.text(), path).toBe('');
    }
  });

  it('uses statusless transport failures for Market reads with no declared 5xx', async () => {
    setDevPreviewScenario({ domain: 'market', state: 'error' });

    const readPaths = [
      '/market/overview',
      '/market/movers',
      '/market/price-alerts',
      '/market/pairs',
      '/market/pairs/btcusdt',
      '/market/watchlist',
      '/market/pairs/btcusdt/orderbook',
      '/market/pairs/btcusdt/trades',
      '/market/pairs/btcusdt/candles?interval=1d',
    ];

    for (const path of readPaths) {
      await expect(request(path), path).rejects.toThrow('Failed to fetch');
    }
  });

  it('does not intercept Market writes in the read-error preview', async () => {
    setDevPreviewScenario({ domain: 'market', state: 'error' });

    const writes = await Promise.all([
      request('/market/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      request('/market/price-alerts/missing-alert', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      }),
      request('/market/price-alerts/missing-alert', { method: 'DELETE' }),
      request('/market/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairId: 'missing-pair' }),
      }),
      request('/market/watchlist/missing-item', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: 'preview test' }),
      }),
      request('/market/watchlist/missing-item', { method: 'DELETE' }),
    ]);

    expect(writes.every((response) => response.status !== 503)).toBe(true);
    expect(writes.map((response) => response.status)).toEqual([400, 404, 404, 404, 404, 404]);
  });

  it.each([
    ['error', 503],
    ['unauthorized', 401],
    ['forbidden', 403],
  ] as const)('injects the selected %s response only for its domain', async (state, status) => {
    setDevPreviewScenario({ domain: 'wallet', state });

    const selectedDomainResponse = await request('/wallet/assets');
    const otherDomainResponse = await request('/market/pairs');

    expect(selectedDomainResponse.status).toBe(status);
    expect(await selectedDomainResponse.json()).toMatchObject({
      code: state === 'error' ? 'PREVIEW_SERVER_ERROR' : `PREVIEW_${state.toUpperCase()}`,
    });
    expect(otherDomainResponse.status).toBe(200);
  });

  it('returns contract-shaped empty Admin collections without emptying overview metrics', async () => {
    setDevPreviewScenario({ domain: 'admin', state: 'empty' });

    const [overviewResponse, funnelResponse, testsResponse] = await Promise.all([
      request('/admin/overview'),
      request('/admin/analytics/funnel'),
      request('/admin/analytics/ab-tests'),
    ]);

    expect(overviewResponse.status).toBe(200);
    expect(await overviewResponse.json()).toMatchObject({ activeUsers: 1284, verifiedUsers: 947 });
    expect(funnelResponse.status).toBe(200);
    expect(await funnelResponse.json()).toEqual({ steps: [] });
    expect(testsResponse.status).toBe(200);
    expect(await testsResponse.json()).toEqual({ tests: [] });
  });

  it('returns empty Arena discovery without intercepting mode detail', async () => {
    setDevPreviewScenario({ domain: 'arena', state: 'empty' });

    const [discoveryResponse, modeResponse] = await Promise.all([
      request('/arena/discovery'),
      request('/arena/modes/mode001'),
    ]);

    expect(discoveryResponse.status).toBe(200);
    expect(await discoveryResponse.json()).toEqual({ modes: [], challenges: [] });
    expect(modeResponse.status).toBe(200);
    expect(await modeResponse.json()).toMatchObject({ id: 'mode001' });
  });

  it('returns an empty Launchpad list without hiding a valid project detail', async () => {
    setDevPreviewScenario({ domain: 'launchpad', state: 'empty' });

    const [listResponse, detailResponse] = await Promise.all([
      request('/launchpad/projects'),
      request('/launchpad/projects/proj1'),
    ]);

    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual({ projects: [], total: 0, activeCount: 0 });
    expect(detailResponse.status).toBe(200);
    expect(await detailResponse.json()).toMatchObject({ id: 'proj1', name: 'NexaAI Protocol' });
  });

  it('uses a transport failure for Launchpad list errors without inventing a 5xx', async () => {
    setDevPreviewScenario({ domain: 'launchpad', state: 'error' });

    await expect(request('/launchpad/projects')).rejects.toThrow('Failed to fetch');

    const detailResponse = await request('/launchpad/projects/proj1');
    expect(detailResponse.status).toBe(200);
    expect(await detailResponse.json()).toMatchObject({ id: 'proj1', name: 'NexaAI Protocol' });
  });

  it('uses a statusless P2P list transport failure and leaves order writes to normal handlers', async () => {
    server.use(
      previewScenarioHandler,
      http.post('*/p2p/orders', () =>
        HttpResponse.json({ status: 'normal-handler' }, { status: 201 }),
      ),
    );
    setDevPreviewScenario({ domain: 'p2p', state: 'error' });

    await expect(request('/p2p/orders')).rejects.toThrow('Failed to fetch');

    const writeResponse = await fetch('http://localhost/api/p2p/orders', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: 'ad001' }),
    });

    expect(writeResponse.status).toBe(201);
    expect(await writeResponse.json()).toEqual({ status: 'normal-handler' });
  });

  it('returns a zeroed contract-shaped DCA snapshot only for the snapshot read', async () => {
    setDevPreviewScenario({ domain: 'dca', state: 'empty' });

    const [snapshotResponse, advancedOverviewResponse] = await Promise.all([
      request('/dca/snapshot'),
      request('/dca/advanced/overview'),
    ]);

    expect(snapshotResponse.status).toBe(200);
    const snapshot = await snapshotResponse.json();
    expect(snapshot.overview).toMatchObject({
      currentValue: 0,
      totalInvested: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      activePlans: 0,
      pausedPlans: 0,
      errorPlans: 0,
      nextExecution: null,
    });
    expect(snapshot.plans).toEqual([]);
    expect(snapshot.purchaseHistory).toEqual([]);
    expect(
      snapshot.portfolioHistory.every(
        (point: { portfolioValue: number; totalInvested: number; hasPurchase: boolean }) =>
          point.portfolioValue === 0 && point.totalInvested === 0 && !point.hasPurchase,
      ),
    ).toBe(true);

    expect(advancedOverviewResponse.status).toBe(200);
    expect(await advancedOverviewResponse.json()).toMatchObject({
      views: expect.arrayContaining([
        expect.objectContaining({ id: 'rebalance-config', state: 'backend-required' }),
      ]),
    });
  });

  it('uses a transport failure for DCA snapshot errors without fabricating a status', async () => {
    setDevPreviewScenario({ domain: 'dca', state: 'error' });

    await expect(request('/dca/snapshot')).rejects.toThrow('Failed to fetch');

    const advancedOverviewResponse = await request('/dca/advanced/overview');
    expect(advancedOverviewResponse.status).toBe(200);
    expect(await advancedOverviewResponse.json()).toMatchObject({
      views: expect.arrayContaining([
        expect.objectContaining({ id: 'rebalance-config', state: 'backend-required' }),
      ]),
    });
  });

  it('uses transport failures only for Earn reads when Earn declares no 5xx responses', async () => {
    setDevPreviewScenario({ domain: 'earn', state: 'error' });

    await expect(request('/earn/snapshot')).rejects.toThrow('Failed to fetch');
    await expect(request('/earn/transactions?domain=savings')).rejects.toThrow('Failed to fetch');

    const invalidSubscriptionResponse = await fetch('http://localhost/api/earn/subscriptions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'earn-error-invalid-payload',
      },
      body: JSON.stringify({}),
    });
    expect(invalidSubscriptionResponse.status).toBe(400);
    expect(await invalidSubscriptionResponse.json()).toMatchObject({
      code: 'EARN_SUBSCRIPTION_INVALID',
    });
  });

  it('returns a contract-valid null Auth session only for the session read', async () => {
    setDevPreviewScenario({ domain: 'auth', state: 'empty' });

    const sessionResponse = await request('/auth/session');
    const logoutResponse = await fetch('http://localhost/api/auth/logout', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(sessionResponse.status).toBe(200);
    expect(await sessionResponse.json()).toBeNull();
    expect(logoutResponse.status).toBe(204);
  });

  it('uses a transport failure for Arena discovery without inventing an HTTP status', async () => {
    setDevPreviewScenario({ domain: 'arena', state: 'error' });

    await expect(request('/arena/discovery')).rejects.toThrow('Failed to fetch');

    const modeResponse = await request('/arena/modes/mode001');
    expect(modeResponse.status).toBe(200);
    expect(await modeResponse.json()).toMatchObject({ id: 'mode001' });
  });

  it('uses a transport failure for Prediction event-list errors without intercepting writes', async () => {
    setDevPreviewScenario({ domain: 'predictions', state: 'error' });

    await expect(request('/predictions/events')).rejects.toThrow('Failed to fetch');

    const eventDetailResponse = await request('/predictions/events/pred-1');
    expect(eventDetailResponse.status).toBe(200);

    const orderResponse = await fetch('http://localhost/api/predictions/orders', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(orderResponse.status).toBe(400);
    expect(await orderResponse.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
  });

  it('uses a statusless transport failure for Auth login without inventing an undeclared 5xx', async () => {
    setDevPreviewScenario({ domain: 'auth', state: 'error' });

    const loginRequest = fetch('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'developer@vittrade.local', password: 'Preview-123!' }),
    });
    await expect(loginRequest).rejects.toThrow('Failed to fetch');

    const sessionResponse = await request('/auth/session');
    expect(sessionResponse.status).toBe(401);
  });

  it('limits Auth unauthorized responses to operations that declare 401', async () => {
    setDevPreviewScenario({ domain: 'auth', state: 'unauthorized' });

    const [sessionResponse, currentPasswordResponse, changePasswordResponse, logoutResponse] =
      await Promise.all([
        request('/auth/session'),
        fetch('http://localhost/api/auth/password/verify-current', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'Preview-123!' }),
        }),
        fetch('http://localhost/api/auth/password/change', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: 'Preview-123!', newPassword: 'Next-123!' }),
        }),
        fetch('http://localhost/api/auth/logout', {
          method: 'POST',
          headers: { Accept: 'application/json' },
        }),
      ]);

    expect(sessionResponse.status).toBe(401);
    expect(await sessionResponse.json()).toMatchObject({ code: 'PREVIEW_UNAUTHORIZED' });
    expect(currentPasswordResponse.status).toBe(401);
    expect(changePasswordResponse.status).toBe(401);
    expect(logoutResponse.status).toBe(204);
  });

  it('does not synthesize an Auth forbidden response without a declared 403', async () => {
    setDevPreviewScenario({ domain: 'auth', state: 'forbidden' });

    const sessionResponse = await request('/auth/session');

    expect(sessionResponse.status).toBe(401);
    expect(await sessionResponse.json()).toMatchObject({ code: 'UNAUTHENTICATED' });
  });

  it('delays the selected domain response then falls through to the real mock handler', async () => {
    setDevPreviewScenario({ domain: 'wallet', state: 'loading' });
    const startedAt = Date.now();

    const response = await request('/wallet/assets');

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1_900);
    expect(response.status).toBe(200);
    expect(await response.json()).toHaveProperty('summary');
  });

  it('delays the Profile root read as part of the selected loading scenario', async () => {
    setDevPreviewScenario({ domain: 'profile', state: 'loading' });
    const startedAt = Date.now();

    const response = await request('/profile');

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1_900);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'usr001' });
  });

  it.each([
    ['/trading/orders?status=open', 200],
    ['/trading/orders/history', 200],
    ['/trading/positions', 503],
  ] as const)('delays only the selected Trading collection read: %s', async (path, status) => {
    setDevPreviewScenario({ domain: 'trading', state: 'loading' });
    const startedAt = Date.now();

    const response = await request(path);

    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1_900);
    expect(response.status).toBe(status);
    expect(response.headers.get('content-type')).toContain('application/json');
    if (status === 503) {
      expect(await response.json()).toMatchObject({ code: 'positions_source_unavailable' });
    } else {
      expect(await response.json()).toMatchObject({ items: expect.any(Array) });
    }
  });

  it('does not delay unrelated Trading reads or mutations in the loading scenario', async () => {
    setDevPreviewScenario({ domain: 'trading', state: 'loading' });

    const analyticsStartedAt = Date.now();
    const analyticsResponse = await request('/trading/analytics');
    expect(Date.now() - analyticsStartedAt).toBeLessThan(1_900);
    expect(analyticsResponse.status).toBe(200);

    const mutationStartedAt = Date.now();
    const mutationResponse = await fetch('http://localhost/api/trading/orders', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(Date.now() - mutationStartedAt).toBeLessThan(1_900);
    expect(mutationResponse.status).toBe(400);
    expect(await mutationResponse.json()).toMatchObject({ code: 'IDEMPOTENCY_KEY_REQUIRED' });
  });

  it('keeps Trading error responses within the contract-backed positions operation', async () => {
    setDevPreviewScenario({ domain: 'trading', state: 'error' });

    const [ordersResponse, historyResponse, analyticsResponse, positionsResponse] =
      await Promise.all([
        request('/trading/orders?status=open'),
        request('/trading/orders/history'),
        request('/trading/analytics'),
        request('/trading/positions'),
      ]);

    expect(ordersResponse.status).toBe(200);
    expect(await ordersResponse.json()).toMatchObject({ items: expect.any(Array) });
    expect(historyResponse.status).toBe(200);
    expect(await historyResponse.json()).toMatchObject({ items: expect.any(Array) });
    expect(analyticsResponse.status).toBe(200);
    expect(positionsResponse.status).toBe(503);
    expect(await positionsResponse.json()).toMatchObject({ code: 'positions_source_unavailable' });

    const invalidPlaceOrderResponse = await fetch('http://localhost/api/trading/orders', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(invalidPlaceOrderResponse.status).toBe(400);
    expect(await invalidPlaceOrderResponse.json()).toMatchObject({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
    });
  });

  it('injects a generic local error into the four Profile read endpoints only for Profile', async () => {
    setDevPreviewScenario({ domain: 'profile', state: 'error' });

    const profileResponses = await Promise.all([
      request('/profile'),
      request('/profile/devices'),
      request('/profile/activity'),
      request('/profile/sub-accounts'),
    ]);
    const otherDomainResponse = await request('/market/pairs');

    for (const response of profileResponses) {
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ code: 'PREVIEW_SERVER_ERROR' });
    }
    expect(otherDomainResponse.status).toBe(200);
  });

  it('injects the declared unauthorized response into Profile reads without affecting other domains', async () => {
    setDevPreviewScenario({ domain: 'profile', state: 'unauthorized' });

    const profileResponses = await Promise.all([
      request('/profile'),
      request('/profile/devices'),
      request('/profile/activity'),
      request('/profile/sub-accounts'),
    ]);
    const otherDomainResponse = await request('/market/pairs');

    for (const response of profileResponses) {
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ code: 'PREVIEW_UNAUTHORIZED' });
    }
    expect(otherDomainResponse.status).toBe(200);
  });

  it('returns a schema-valid empty market pair list only for the matching operation', async () => {
    setDevPreviewScenario({ domain: 'market', state: 'empty' });

    const emptyListResponse = await request('/market/pairs');
    expect(emptyListResponse.status).toBe(200);
    expect(await emptyListResponse.json()).toEqual({ items: [] });

    const detailResponse = await request('/market/pairs/btcusdt');
    expect(detailResponse.status).toBe(200);
    expect(await detailResponse.json()).toMatchObject({ id: 'btcusdt' });
  });

  it('returns schema-valid empty Profile collections without erasing the required Profile object', async () => {
    setDevPreviewScenario({ domain: 'profile', state: 'empty' });

    const [devicesResponse, activityResponse, subAccountsResponse, profileResponse] =
      await Promise.all([
        request('/profile/devices'),
        request('/profile/activity'),
        request('/profile/sub-accounts'),
        request('/profile'),
      ]);

    for (const response of [devicesResponse, activityResponse, subAccountsResponse]) {
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ items: [] });
    }
    expect(profileResponse.status).toBe(200);
    expect(await profileResponse.json()).toMatchObject({
      id: 'usr001',
      fullName: 'Nguyễn Văn A',
    });
  });

  it('returns an empty wallet activity list without replacing the balance read', async () => {
    setDevPreviewScenario({ domain: 'wallet', state: 'empty' });

    const [transactionsResponse, assetsResponse] = await Promise.all([
      request('/wallet/transactions?limit=10'),
      request('/wallet/assets'),
    ]);

    expect(transactionsResponse.status).toBe(200);
    expect(await transactionsResponse.json()).toEqual({ items: [], total: 0 });
    expect(assetsResponse.status).toBe(200);
    const assetsPayload = (await assetsResponse.json()) as {
      items: unknown[];
      summary: { totalUsd: number; availableUsd: number };
    };
    expect(assetsPayload.items.length).toBeGreaterThan(0);
    expect(assetsPayload.summary).toMatchObject({ totalUsd: 16_754.32, availableUsd: 16_754.32 });
  });

  it('returns contract-valid empty Trading collections only for the three collection reads', async () => {
    setDevPreviewScenario({ domain: 'trading', state: 'empty' });

    const [openOrdersResponse, positionsResponse, historyResponse, copyProvidersResponse] =
      await Promise.all([
        request('/trading/orders?status=open'),
        request('/trading/positions'),
        request('/trading/orders/history'),
        request('/trading/copy/providers'),
      ]);

    expect(openOrdersResponse.status).toBe(200);
    expect(await openOrdersResponse.json()).toEqual({ items: [] });
    expect(historyResponse.status).toBe(200);
    expect(await historyResponse.json()).toEqual({ items: [] });

    expect(positionsResponse.status).toBe(200);
    const positionsPayload = (await positionsResponse.json()) as {
      items: unknown[];
      updatedAt: string;
    };
    expect(positionsPayload.items).toEqual([]);
    expect(new Date(positionsPayload.updatedAt).toISOString()).toBe(positionsPayload.updatedAt);

    expect(copyProvidersResponse.status).toBe(200);
    expect(
      ((await copyProvidersResponse.json()) as { items: unknown[] }).items.length,
    ).toBeGreaterThan(0);
  });

  it('keeps the Support empty scenario scoped to tickets and lists a ticket created in that scenario', async () => {
    setDevPreviewScenario({ domain: 'support', state: 'empty' });

    const [emptyTicketsResponse, newsResponse, notificationsResponse, helpResponse] =
      await Promise.all([
        request('/support/tickets'),
        request('/content/news'),
        request('/notifications'),
        request('/support/help'),
      ]);
    expect(emptyTicketsResponse.status).toBe(200);
    expect(await emptyTicketsResponse.json()).toEqual({ items: [] });
    expect(((await newsResponse.json()) as { items: unknown[] }).items.length).toBeGreaterThan(0);
    expect(
      ((await notificationsResponse.json()) as { items: unknown[] }).items.length,
    ).toBeGreaterThan(0);
    expect(
      ((await helpResponse.json()) as { articles: unknown[] }).articles.length,
    ).toBeGreaterThan(0);

    const createResponse = await fetch('http://localhost/api/support/tickets', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'support-empty-ticket-key-001',
      },
      body: JSON.stringify({
        subject: 'Ticket from empty preview',
        category: 'other',
        description: 'Created within the selected empty Support scenario.',
      }),
    });
    const createdTicket = (await createResponse.json()) as { id: string; subject: string };
    const refreshedTicketsResponse = await request('/support/tickets');

    expect(createResponse.status).toBe(201);
    expect(createdTicket.id).toMatch(/^ticket-preview-support-/);
    expect(createdTicket.subject).toBe('Ticket from empty preview');
    expect(await refreshedTicketsResponse.json()).toEqual({
      items: [expect.objectContaining({ id: createdTicket.id, subject: createdTicket.subject })],
    });

    setDevPreviewScenario({ domain: 'support', state: 'success' });
    const successTicketsResponse = await request('/support/tickets');
    expect(successTicketsResponse.status).toBe(200);
    const successTickets = (await successTicketsResponse.json()) as {
      items: Array<{ id: string }>;
    };
    expect(successTickets.items.some((ticket) => ticket.id === createdTicket.id)).toBe(false);
  });

  it('returns pending Wallet receipts and the pending withdrawal transaction detail', async () => {
    setDevPreviewScenario({ domain: 'wallet', state: 'pending' });

    const transferResponse = await fetch('http://localhost/api/wallet/transfers', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'wallet-preview-transfer-key-001',
      },
      body: JSON.stringify({
        fromWallet: 'spot',
        toWallet: 'funding',
        asset: 'USDT',
        amount: 12.5,
      }),
    });
    const withdrawalResponse = await fetch('http://localhost/api/wallet/withdrawals', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'wallet-preview-withdrawal-key-001',
      },
      body: JSON.stringify({
        asset: 'USDT',
        networkId: 'ethereum',
        address: '0x1234567890abcdef1234567890abcdef12345678',
        amount: 12.5,
        verificationToken: 'preview-verification-token',
      }),
    });
    const withdrawal = (await withdrawalResponse.json()) as { transactionId: string };
    const transactionResponse = await request(`/wallet/transactions/${withdrawal.transactionId}`);

    expect(transferResponse.status).toBe(201);
    expect(await transferResponse.json()).toMatchObject({
      fromWallet: 'spot',
      toWallet: 'funding',
      asset: 'USDT',
      amount: 12.5,
      status: 'pending',
    });
    expect(withdrawalResponse.status).toBe(201);
    expect(withdrawal.transactionId).toMatch(/^preview-wallet-transaction-/);
    expect(transactionResponse.status).toBe(200);
    expect(await transactionResponse.json()).toMatchObject({
      id: withdrawal.transactionId,
      type: 'withdraw',
      asset: 'USDT',
      amount: 12.5,
      status: 'pending',
    });
  });

  it('keeps Trading pending as request-in-flight, then passes through contract-valid open and cancelled orders', async () => {
    setDevPreviewScenario({ domain: 'trading', state: 'pending' });
    const startedAt = Date.now();
    const createResponse = await fetch('http://localhost/api/trading/orders', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'trading-preview-pending-order-001',
      },
      body: JSON.stringify({
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'limit',
        price: 65_000,
        amount: 0.01,
      }),
    });
    const createElapsedMs = Date.now() - startedAt;
    const createdOrder = (await createResponse.json()) as { id: string; status: string };

    const modifyStartedAt = Date.now();
    const modifyResponse = await fetch(`http://localhost/api/trading/orders/${createdOrder.id}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'trading-preview-pending-modify-001',
      },
      body: JSON.stringify({ price: 65_100, amount: 0.01 }),
    });
    const modifyElapsedMs = Date.now() - modifyStartedAt;
    const modifiedOrder = (await modifyResponse.json()) as {
      id: string;
      price: number;
      status: string;
    };

    const cancelStartedAt = Date.now();
    const cancelResponse = await fetch(
      `http://localhost/api/trading/orders/${createdOrder.id}/cancel`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Idempotency-Key': 'trading-preview-pending-cancel-001',
        },
      },
    );
    const cancelElapsedMs = Date.now() - cancelStartedAt;
    const cancelledOrder = (await cancelResponse.json()) as { id: string; status: string };
    const historyResponse = await request('/trading/orders/history');
    const history = (await historyResponse.json()) as {
      items: Array<{ id: string; status: string }>;
    };

    expect(createElapsedMs).toBeGreaterThanOrEqual(1_900);
    expect(createResponse.status).toBe(201);
    expect(createdOrder).toMatchObject({ status: 'open' });
    expect(modifyElapsedMs).toBeGreaterThanOrEqual(1_900);
    expect(modifyResponse.status).toBe(200);
    expect(modifiedOrder).toMatchObject({
      id: createdOrder.id,
      price: 65_100,
      status: 'open',
    });
    expect(cancelElapsedMs).toBeGreaterThanOrEqual(1_900);
    expect(cancelResponse.status).toBe(200);
    expect(cancelledOrder).toMatchObject({ id: createdOrder.id, status: 'cancelled' });
    expect(historyResponse.status).toBe(200);
    expect(history.items).toContainEqual(
      expect.objectContaining({ id: createdOrder.id, status: 'cancelled' }),
    );
  }, 10_000);

  it('keeps Prediction order submission pending in flight, then reads its contract receipt', async () => {
    setDevPreviewScenario({ domain: 'predictions', state: 'pending' });
    const startedAt = Date.now();
    const response = await fetch('http://localhost/api/predictions/orders', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'prediction-preview-order-key-001',
      },
      body: JSON.stringify({
        eventId: 'pred-1',
        outcome: 'Yes',
        side: 'buy',
        orderType: 'market',
        shares: 10,
      }),
    });
    const elapsedMs = Date.now() - startedAt;
    const receipt = (await response.json()) as { id: string; status: string };
    const receiptResponse = await request(`/predictions/orders/${receipt.id}`);

    expect(elapsedMs).toBeGreaterThanOrEqual(1_900);
    expect(response.status).toBe(201);
    expect(receipt).toMatchObject({
      id: expect.stringMatching(/^prediction-order-/),
      status: 'filled',
    });
    expect(receiptResponse.status).toBe(200);
    expect(await receiptResponse.json()).toMatchObject({ id: receipt.id, status: 'filled' });
  }, 5_000);

  it('returns a contract-valid empty P2P order list only for the order-history read', async () => {
    setDevPreviewScenario({ domain: 'p2p', state: 'empty' });

    const orders = await p2pApi.listOrders({ limit: 100 });
    const detailResponse = await request('/p2p/orders/p2p002');

    expect(orders).toEqual({ items: [], total: 0 });
    expect(detailResponse.status).toBe(200);
    expect(await detailResponse.json()).toMatchObject({ id: 'p2p002' });
  });

  it('empties only Prediction collection reads while event detail and order writes use dev handlers', async () => {
    setDevPreviewScenario({ domain: 'predictions', state: 'empty' });

    const collectionPaths = [
      '/predictions/events',
      '/predictions/positions',
      '/predictions/rewards',
      '/predictions/leaderboard?period=today',
      '/predictions/activity',
    ];
    const collectionResponses = await Promise.all(collectionPaths.map((path) => request(path)));
    const collectionPayloads = await Promise.all(
      collectionResponses.map((response) => response.json()),
    );
    const eventResponse = await request('/predictions/events/pred-1');
    const orderResponse = await fetch('http://localhost/api/predictions/orders', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'prediction-empty-write-001',
      },
      body: JSON.stringify({
        eventId: 'pred-1',
        outcome: 'Yes',
        side: 'buy',
        orderType: 'market',
        shares: 10,
      }),
    });
    const order = (await orderResponse.json()) as { id: string; status: string };
    const receiptResponse = await request(`/predictions/orders/${order.id}`);

    expect(collectionResponses.map((response) => response.status)).toEqual([
      200, 200, 200, 200, 200,
    ]);
    expect(collectionPayloads).toEqual(collectionPaths.map(() => ({ items: [] })));
    expect(await eventResponse.json()).toMatchObject({ id: 'pred-1' });
    expect(orderResponse.status).toBe(201);
    expect(order).toMatchObject({ status: 'filled' });
    expect(receiptResponse.status).toBe(200);
    expect(await receiptResponse.json()).toMatchObject({ id: order.id, status: 'filled' });
  });

  it('limits P2P forbidden to the contract-declared release challenge operation', async () => {
    setDevPreviewScenario({ domain: 'p2p', state: 'forbidden' });

    const orderResponse = await request('/p2p/orders/p2p002');
    const challengeResponse = await fetch(
      'http://localhost/api/p2p/orders/p2p002/release/challenge',
      { method: 'POST', headers: { Accept: 'application/json' } },
    );

    expect(orderResponse.status).toBe(200);
    expect(await orderResponse.json()).toMatchObject({ id: 'p2p002' });
    expect(challengeResponse.status).toBe(403);
    expect(await challengeResponse.json()).toMatchObject({ code: 'PREVIEW_FORBIDDEN' });
  });

  it('scopes the P2P duplicate scenario to contract-declared order mutation conflicts', async () => {
    setDevPreviewScenario({ domain: 'p2p', state: 'duplicate' });

    const createOrderResponse = await fetch('http://localhost/api/p2p/orders', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'p2p-preview-conflict-key',
      },
      body: JSON.stringify({
        adId: 'ad001',
        asset: 'USDT',
        currency: 'VND',
        amount: 10,
        fiatAmount: 253500,
        paymentMethod: 'Vietcombank',
      }),
    });
    const markPaidResponse = await fetch('http://localhost/api/p2p/orders/p2p001/mark-paid', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'p2p-preview-mark-paid-conflict-key',
      },
    });
    const releaseResponse = await fetch('http://localhost/api/p2p/orders/p2p002/release', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'p2p-preview-release-conflict-key',
      },
      body: JSON.stringify({ verificationToken: 'preview-token' }),
    });
    const orderDetailResponse = await request('/p2p/orders/p2p002');
    const unrelatedResponse = await request('/market/pairs');

    expect(createOrderResponse.status).toBe(409);
    expect(await createOrderResponse.json()).toEqual({
      code: 'P2P_ORDER_CONFLICT',
      message: 'Kịch bản xem trước: yêu cầu tạo đơn bị trùng hoặc xung đột.',
    });
    expect(markPaidResponse.status).toBe(409);
    expect(await markPaidResponse.json()).toEqual({
      code: 'P2P_ORDER_CONFLICT',
      message: 'Kịch bản xem trước: đơn hàng không thể chuyển sang trạng thái đã thanh toán.',
    });
    expect(releaseResponse.status).toBe(409);
    expect(await releaseResponse.json()).toEqual({
      code: 'P2P_ORDER_CONFLICT',
      message: 'Kịch bản xem trước: đơn hàng không thể chuyển sang trạng thái đã release.',
    });
    expect(orderDetailResponse.status).toBe(200);
    expect(unrelatedResponse.status).toBe(200);
  });

  it('returns only the contract-declared status for a Prediction order conflict', async () => {
    setDevPreviewScenario({ domain: 'predictions', state: 'duplicate' });

    const conflictResponse = await request('/predictions/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'prediction-preview-conflict-key',
      },
      body: JSON.stringify({
        eventId: 'pred-1',
        outcome: 'Yes',
        side: 'buy',
        orderType: 'market',
        shares: 10,
      }),
    });
    const unrelatedRead = await request('/predictions/events/pred-1');

    expect(conflictResponse.status).toBe(409);
    expect(await conflictResponse.text()).toBe('');
    expect(unrelatedRead.status).toBe(200);
  });

  it('returns contract-valid empty Earn reads and lets writes reach their normal handler', async () => {
    setDevPreviewScenario({ domain: 'earn', state: 'empty' });

    const snapshotResponse = await request('/earn/snapshot');
    const transactionsResponse = await request('/earn/transactions?domain=savings&limit=25');
    const invalidSubscriptionResponse = await fetch('http://localhost/api/earn/subscriptions', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'missing-product', amount: 10 }),
    });

    expect(snapshotResponse.status).toBe(200);
    expect(await snapshotResponse.json()).toEqual({
      products: [],
      positions: [],
      balances: {},
      summary: {
        totalDepositedUsd: 0,
        totalEarnedUsd: 0,
        averageApy: 0,
        activePositions: 0,
      },
    });
    expect(transactionsResponse.status).toBe(200);
    expect(await transactionsResponse.json()).toEqual({ items: [] });
    expect(invalidSubscriptionResponse.status).toBe(400);
    expect(await invalidSubscriptionResponse.json()).toMatchObject({
      code: 'EARN_SUBSCRIPTION_INVALID',
    });
  });

  it('returns pending Earn receipts without finalizing the snapshot and exposes pending history', async () => {
    setDevPreviewScenario({ domain: 'earn', state: 'pending' });

    const beforeSnapshotResponse = await request('/earn/snapshot');
    const beforeSnapshot = await beforeSnapshotResponse.json();
    const subscriptionResponse = await fetch('http://localhost/api/earn/subscriptions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'earn-subscription-preview-key',
      },
      body: JSON.stringify({ productId: 'sav001', amount: 100 }),
    });
    const redemptionResponse = await fetch('http://localhost/api/earn/redemptions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'earn-redemption-preview-key',
      },
      body: JSON.stringify({ positionId: 'earn-position-1', amount: 50 }),
    });
    const transactionsResponse = await request('/earn/transactions?domain=savings&limit=25');
    const afterSnapshotResponse = await request('/earn/snapshot');

    expect(subscriptionResponse.status).toBe(201);
    expect(await subscriptionResponse.json()).toMatchObject({
      operation: 'subscribe',
      productId: 'sav001',
      amount: 100,
      status: 'pending',
    });
    expect(redemptionResponse.status).toBe(201);
    expect(await redemptionResponse.json()).toMatchObject({
      operation: 'redeem',
      productId: 'sav001',
      positionId: 'earn-position-1',
      amount: 50,
      status: 'pending',
    });
    expect(transactionsResponse.status).toBe(200);
    const transactions = (await transactionsResponse.json()) as {
      items: Array<{ id: string; status: string }>;
    };
    expect(transactions.items).toContainEqual(
      expect.objectContaining({ id: 'earn-tx-savings-002', status: 'pending' }),
    );
    expect(afterSnapshotResponse.status).toBe(200);
    expect(await afterSnapshotResponse.json()).toEqual(beforeSnapshot);
  });

  it('holds a P2P escrow release request in flight, then falls through to the release handler', async () => {
    setDevPreviewScenario({ domain: 'p2p', state: 'pending' });

    const challengeResponse = await fetch(
      'http://localhost/api/p2p/orders/p2p002/release/challenge',
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
      },
    );
    const challenge = (await challengeResponse.json()) as { id: string };
    const verificationResponse = await fetch(
      `http://localhost/api/p2p/orders/p2p002/release/challenge/${challenge.id}/verify`,
      {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: '000000' }),
      },
    );
    const verification = (await verificationResponse.json()) as { verificationToken: string };
    const startedAt = Date.now();
    const releaseResponse = await fetch('http://localhost/api/p2p/orders/p2p002/release', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'p2p-preview-release-key',
      },
      body: JSON.stringify({ verificationToken: verification.verificationToken }),
    });

    expect(challengeResponse.status).toBe(201);
    expect(verificationResponse.status).toBe(200);
    expect(Date.now() - startedAt).toBeGreaterThanOrEqual(1_900);
    expect(releaseResponse.status).toBe(200);
    expect(await releaseResponse.json()).toMatchObject({ id: 'p2p002', status: 'released' });
  });

  it('holds P2P create and mark-paid writes in flight before their normal handlers respond', async () => {
    const order = await p2pApi.getOrder('p2p001');
    server.use(
      previewScenarioHandler,
      http.post('*/p2p/orders', () =>
        HttpResponse.json(
          { orderId: 'preview-pending-order', status: 'created', expiresAt: order.expiresAt },
          { status: 201 },
        ),
      ),
      http.post('*/p2p/orders/p2p001/mark-paid', () =>
        HttpResponse.json({ ...order, status: 'paid' }),
      ),
    );
    setDevPreviewScenario({ domain: 'p2p', state: 'pending' });

    const createStartedAt = Date.now();
    const createResponse = await fetch('http://localhost/api/p2p/orders', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'p2p-preview-pending-create-key',
      },
      body: JSON.stringify({ adId: 'ad001' }),
    });
    const createReceipt = await createResponse.json();

    const markPaidStartedAt = Date.now();
    const markPaidResponse = await fetch('http://localhost/api/p2p/orders/p2p001/mark-paid', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Idempotency-Key': 'p2p-preview-pending-mark-paid-key',
      },
    });

    expect(createResponse.status).toBe(201);
    expect(createReceipt).toMatchObject({ orderId: 'preview-pending-order', status: 'created' });
    expect(Date.now() - createStartedAt).toBeGreaterThanOrEqual(1_900);
    expect(markPaidResponse.status).toBe(200);
    expect(await markPaidResponse.json()).toMatchObject({ id: 'p2p001', status: 'paid' });
    expect(Date.now() - markPaidStartedAt).toBeGreaterThanOrEqual(1_900);
  });

  it('serves a P2P escrow order fixture accepted by the real API schema', async () => {
    await expect(p2pApi.getOrder('p2p001')).resolves.toMatchObject({
      id: 'p2p001',
      status: 'pending_payment',
      createdAt: expect.stringMatching(/T.*\+07:00$/),
      expiresAt: expect.stringMatching(/T.*\+07:00$/),
    });
    await expect(p2pApi.listOrders({ limit: 100 })).resolves.toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ id: 'p2p007' })]),
      total: 7,
    });
  });

  it('returns a schema-valid empty Discovery search without emptying topic feeds', async () => {
    setDevPreviewScenario({ domain: 'discovery', state: 'empty' });

    const searchResponse = await request('/discovery/search?query=zz');
    const topicResponse = await request('/discovery/topics/crypto');

    expect(searchResponse.status).toBe(200);
    expect(await searchResponse.json()).toEqual({
      query: 'zz',
      predictions: [],
      arenaModes: [],
      arenaRooms: [],
      creators: [],
      tradingPairs: [],
    });
    expect(topicResponse.status).toBe(200);
    expect(await topicResponse.json()).toHaveProperty('topic.id', 'crypto');
  });

  it('returns a contract-valid empty Referral overview only for the overview read', async () => {
    setDevPreviewScenario({ domain: 'referral', state: 'empty' });

    const overviewResponse = await request('/referral/overview');
    const overview = await overviewResponse.json();
    const unrelatedResponse = await request('/wallet/assets');

    expect(overviewResponse.status).toBe(200);
    expect(overview).toMatchObject({
      referralCode: 'PREVIEW-EMPTY',
      stats: {
        totalFriends: 0,
        activeFriends: 0,
        kycCompleted: 0,
        totalCommission: 0,
        pendingCommission: 0,
        totalVolume: 0,
        thisMonthCommission: 0,
        thisMonthFriends: 0,
      },
      currentTier: { name: 'Đồng' },
      friends: [],
      campaign: { id: 'camp-march-2026' },
    });
    expect(unrelatedResponse.status).toBe(200);
    expect(await unrelatedResponse.json()).toHaveProperty('summary');
  });

  it.each([
    ['unauthorized', 401],
    ['forbidden', 403],
  ] as const)('limits Market %s responses to protected operations', async (state, status) => {
    setDevPreviewScenario({ domain: 'market', state });

    const publicPairsResponse = await request('/market/pairs');
    const protectedWatchlistResponse = await request('/market/watchlist');
    const protectedAlertsResponse = await request('/market/price-alerts');

    expect(publicPairsResponse.status).toBe(200);
    expect(await publicPairsResponse.json()).toHaveProperty('items');
    expect(protectedWatchlistResponse.status).toBe(status);
    expect(protectedAlertsResponse.status).toBe(status);
  });

  it.each(['market', 'discovery', 'profile'] as const)(
    'expires the mock refresh session when %s unauthorized is selected',
    async (domain) => {
      setDevPreviewScenario({ domain, state: 'unauthorized' });

      const response = await fetch('http://localhost/api/auth/refresh', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });

      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ code: 'SESSION_EXPIRED' });
    },
  );

  it('returns a contract-supported empty refresh session after an Earn unauthorized response', async () => {
    setDevPreviewScenario({ domain: 'earn', state: 'unauthorized' });

    const earnResponse = await request('/earn/snapshot');
    const refreshResponse = await fetch('http://localhost/api/auth/refresh', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });

    expect(earnResponse.status).toBe(401);
    expect(refreshResponse.status).toBe(200);
    expect(await refreshResponse.json()).toBeNull();
  });

  it('passes through when success is selected', async () => {
    setDevPreviewScenario({ domain: 'wallet', state: 'success' });
    const successResponse = await request('/wallet/assets');
    expect(successResponse.status).toBe(200);
  });

  it('persists successful DCA plan mutations in the local preview snapshot', async () => {
    setDevPreviewScenario({ domain: 'dca', state: 'success' });
    const createResponse = await fetch('http://localhost/api/dca/plans', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'dca-preview-create-plan-001',
      },
      body: JSON.stringify({
        coinSymbol: 'ADA',
        frequency: 'weekly',
        amountPerPurchase: 250_000,
      }),
    });
    const createdPlan = (await createResponse.json()) as { id: string; status: string };
    const createdSnapshotResponse = await request('/dca/snapshot');
    const createdSnapshot = (await createdSnapshotResponse.json()) as {
      plans: Array<{ id: string; coinSymbol: string }>;
    };

    const updateResponse = await fetch(`http://localhost/api/dca/plans/${createdPlan.id}`, {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'dca-preview-pause-plan-001',
      },
      body: JSON.stringify({ status: 'paused' }),
    });
    const updatedPlan = (await updateResponse.json()) as { id: string; status: string };
    const updatedSnapshotResponse = await request('/dca/snapshot');
    const updatedSnapshot = (await updatedSnapshotResponse.json()) as {
      plans: Array<{ id: string; status: string }>;
    };

    const deleteResponse = await fetch(`http://localhost/api/dca/plans/${createdPlan.id}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'Idempotency-Key': 'dca-preview-delete-plan-001' },
    });
    const deletedSnapshotResponse = await request('/dca/snapshot');
    const deletedSnapshot = (await deletedSnapshotResponse.json()) as {
      plans: Array<{ id: string }>;
    };
    const missingDeleteResponse = await fetch(
      'http://localhost/api/dca/plans/missing-preview-plan',
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Idempotency-Key': 'dca-preview-delete-missing-001',
        },
      },
    );
    const missingUpdateResponse = await fetch(
      'http://localhost/api/dca/plans/missing-preview-plan',
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Idempotency-Key': 'dca-preview-update-missing-001',
        },
        body: JSON.stringify({ status: 'paused' }),
      },
    );

    expect(createResponse.status).toBe(201);
    expect(createdPlan).toMatchObject({ id: 'dev-plan-0001', status: 'active' });
    expect(createdSnapshotResponse.status).toBe(200);
    expect(createdSnapshot.plans).toContainEqual(
      expect.objectContaining({ id: createdPlan.id, coinSymbol: 'ADA' }),
    );
    expect(updateResponse.status).toBe(200);
    expect(updatedPlan).toMatchObject({ id: createdPlan.id, status: 'paused' });
    expect(updatedSnapshot.plans).toContainEqual(
      expect.objectContaining({ id: createdPlan.id, status: 'paused' }),
    );
    expect(deleteResponse.status).toBe(204);
    expect(deletedSnapshot.plans).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: createdPlan.id })]),
    );
    expect(missingDeleteResponse.status).toBe(404);
    expect(missingUpdateResponse.status).toBe(404);
  });
});
