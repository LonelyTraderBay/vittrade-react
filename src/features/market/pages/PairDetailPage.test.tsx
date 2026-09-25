import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { toast } from 'sonner';
import { PairDetailPage } from './PairDetailPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

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

const orderBook = {
  bids: [{ price: 67_500, amount: 0.5, total: 33_750, depth: 0.5 }],
  asks: [{ price: 67_600, amount: 0.25, total: 16_900, depth: 0.25 }],
  updatedAt: '2026-09-24T08:30:00.000Z',
};

const recentTrades = {
  items: [
    {
      id: 'trade-1',
      price: 67_543.21,
      amount: 0.125,
      side: 'buy',
      time: '2026-09-24T08:29:00.000Z',
    },
  ],
};

function writeAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['market:watchlist:write'],
      },
    },
  };
}

function readOnlyAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['market:read'],
      },
    },
  };
}

function guestAdapter(): AuthAdapter {
  return { ...testAuthAdapter, initialSession: null };
}

function installMarketReadHandlers(watchlist: { items: Array<Record<string, unknown>> }) {
  server.use(
    http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)),
    http.get('*/market/pairs/btc-usdt/orderbook', () => HttpResponse.json(orderBook)),
    http.get('*/market/pairs/btc-usdt/trades', () => HttpResponse.json(recentTrades)),
    http.get('*/market/watchlist', () => HttpResponse.json(watchlist)),
  );
}

function renderPairDetail(authAdapter?: AuthAdapter, initialEntries = ['/pair/btc-usdt']) {
  return renderWithProviders(
    <Routes>
      <Route path="/markets" element={<p>Market list destination</p>} />
      <Route path="/pair/:pairId" element={<PairDetailPage />} />
      <Route path="/login" element={<p>Login destination</p>} />
      <Route path="/trade/:pairId" element={<p>Trade destination</p>} />
    </Routes>,
    {
      routerProps: { initialEntries },
      authAdapter,
    },
  );
}

describe('Market pair detail page', () => {
  it('loads pair data and adds then removes the pair from the watchlist', async () => {
    const watchlist: { items: Array<Record<string, unknown>> } = { items: [] };
    installMarketReadHandlers(watchlist);
    server.use(
      http.post('*/market/watchlist', async ({ request }) => {
        const body = (await request.json()) as { pairId: string };
        const item = {
          id: 'watchlist-btc-usdt',
          pairId: body.pairId,
          addedAt: '2026-09-24T08:30:00.000Z',
        };
        watchlist.items.push(item);
        return HttpResponse.json(item, { status: 201 });
      }),
      http.delete('*/market/watchlist/watchlist-btc-usdt', () => {
        watchlist.items = [];
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderPairDetail(writeAdapter());

    expect(await screen.findAllByText('BTC/USDT')).not.toHaveLength(0);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' }));
    expect(
      await screen.findByRole('button', { name: 'Bỏ theo dõi cặp giao dịch' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Bỏ theo dõi cặp giao dịch' }));
    expect(await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('keeps the watchlist control disabled for an authenticated read-only session', async () => {
    installMarketReadHandlers({ items: [] });
    renderPairDetail(readOnlyAdapter());

    expect(await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' })).toBeDisabled();
  });

  it('renders server order-book and recent-trade tabs', async () => {
    installMarketReadHandlers({ items: [] });
    renderPairDetail();

    const user = userEvent.setup();
    expect(await screen.findAllByText('BTC/USDT')).not.toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Sổ lệnh' }));
    expect(await screen.findByText('Giá')).toBeVisible();
    expect(screen.getByText('0.500000')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Giao dịch' }));
    expect(screen.getByText('0.125000')).toBeVisible();
  });

  it('redirects unauthenticated users to login when they try to follow a pair', async () => {
    installMarketReadHandlers({ items: [] });
    renderPairDetail(guestAdapter());

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' }));

    expect(await screen.findByText('Login destination')).toBeVisible();
  });

  it('navigates to trading from both buy and sell actions', async () => {
    installMarketReadHandlers({ items: [] });
    const { unmount } = renderPairDetail();
    const user = userEvent.setup();
    await screen.findAllByText('BTC/USDT');

    await user.click(screen.getByRole('button', { name: 'Mua' }));
    expect(await screen.findByText('Trade destination')).toBeVisible();

    unmount();
    renderPairDetail();
    await screen.findAllByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Bán' }));
    expect(await screen.findByText('Trade destination')).toBeVisible();
  });

  it('uses browser history for the back action', async () => {
    installMarketReadHandlers({ items: [] });
    renderPairDetail(undefined, ['/markets', '/pair/btc-usdt']);

    const user = userEvent.setup();
    await screen.findAllByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Quay lại' }));

    expect(await screen.findByText('Market list destination')).toBeVisible();
  });

  it('shows a recoverable error and refetches pair data', async () => {
    let pairRequests = 0;
    server.use(
      http.get('*/market/pairs/btc-usdt', () => {
        pairRequests += 1;
        return HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 });
      }),
      http.get('*/market/pairs/btc-usdt/orderbook', () => HttpResponse.json(orderBook)),
      http.get('*/market/pairs/btc-usdt/trades', () => HttpResponse.json(recentTrades)),
      http.get('*/market/watchlist', () => HttpResponse.json({ items: [] })),
    );
    renderPairDetail();

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(pairRequests).toBeGreaterThanOrEqual(2);
  });

  it('allows retrying failed order-book and recent-trade requests', async () => {
    let orderBookRequests = 0;
    let tradeRequests = 0;
    installMarketReadHandlers({ items: [] });
    server.use(
      http.get('*/market/pairs/btc-usdt/orderbook', () => {
        orderBookRequests += 1;
        return HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 });
      }),
      http.get('*/market/pairs/btc-usdt/trades', () => {
        tradeRequests += 1;
        return HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 });
      }),
    );
    renderPairDetail();

    const user = userEvent.setup();
    await screen.findAllByText('BTC/USDT');
    await user.click(screen.getByRole('button', { name: 'Sổ lệnh' }));
    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(orderBookRequests).toBeGreaterThanOrEqual(2);

    await user.click(screen.getByRole('button', { name: 'Giao dịch' }));
    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(tradeRequests).toBeGreaterThanOrEqual(2);
  });

  it('reports watchlist mutation failures and leaves the pair unfavorited', async () => {
    installMarketReadHandlers({ items: [] });
    server.use(
      http.post('*/market/watchlist', () =>
        HttpResponse.json({ message: 'Watchlist service unavailable' }, { status: 503 }),
      ),
    );
    renderPairDetail(writeAdapter());

    const user = userEvent.setup();
    const favoriteButton = await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' });
    await user.click(favoriteButton);

    expect(await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(toast.error).toHaveBeenCalledWith('Watchlist service unavailable', { duration: 2000 });
  });

  it('reuses the watchlist create key when retrying after a transient failure', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    installMarketReadHandlers({ items: [] });
    server.use(
      http.post('*/market/watchlist', ({ request }) => {
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        attempts += 1;
        if (attempts === 1)
          return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
        return HttpResponse.json(
          { id: 'watchlist-btc-usdt', pairId: 'btc-usdt', addedAt: '2026-09-24T08:30:00Z' },
          { status: 201 },
        );
      }),
    );
    renderPairDetail(writeAdapter());

    const user = userEvent.setup();
    const favoriteButton = await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' });
    await user.click(favoriteButton);
    await user.click(favoriteButton);

    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toMatch(/^market-watchlist-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });
});
