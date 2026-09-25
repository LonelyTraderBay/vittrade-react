import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { WatchlistPage } from './WatchlistPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 67_543.21,
  prevPrice: 66_012.5,
  change24h: 2.34,
  high24h: 68_100,
  low24h: 65_800,
  volume24h: 23_456_789_000,
  marketCap: 1_324_567_890_000,
  sparklineData: [65_100, 66_200, 67_543.21],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

const watchlistItem = {
  id: 'watchlist-btc-usdt',
  pairId: 'btc-usdt',
  addedAt: '2026-09-24T08:30:00.000Z',
};

const authAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: {
      ...testAuthAdapter.initialSession!.user,
      permissions: ['market:read', 'market:watchlist:write'],
    },
  },
};

describe('WatchlistPage', () => {
  it('reuses the delete key after a transient failure and reports the failure', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [watchlistItem] }),
      ),
      http.delete(
        'http://localhost:3000/api/market/watchlist/watchlist-btc-usdt',
        ({ request }) => {
          idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
          attempts += 1;
          if (attempts === 1)
            return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<WatchlistPage />, { authAdapter });

    const remove = await screen.findByRole('button', { name: 'Xóa khỏi danh sách theo dõi' });
    await user.click(remove);
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể xóa cặp');
    await user.click(remove);

    await waitFor(() => expect(idempotencyKeys).toHaveLength(2));
    expect(idempotencyKeys[0]).toMatch(/^watchlist-delete-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });
});
