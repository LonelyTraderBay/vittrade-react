import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { MarketListPage } from './MarketListPage';

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
const marketPairs = [
  pair,
  {
    ...pair,
    id: 'eth-usdt',
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    price: 3_521.45,
    change24h: -1.23,
    volume24h: 8_765_432_000,
    category: 'DeFi',
  },
  {
    ...pair,
    id: 'sol-usdt',
    symbol: 'SOL/USDT',
    baseAsset: 'SOL',
    price: 150,
    change24h: 5.67,
    volume24h: 1_234_567_890,
    category: 'Layer 1',
  },
];
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

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('MarketListPage', () => {
  it('keeps watchlist actions read-only when the session lacks write permission', async () => {
    let createCalls = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
      http.post('http://localhost:3000/api/market/watchlist', () => {
        createCalls += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...authAdapter,
      initialSession: {
        ...authAdapter.initialSession!,
        user: { ...authAdapter.initialSession!.user, permissions: ['market:read'] },
      },
    };

    renderWithProviders(<MarketListPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Market watchlist is read-only for this session.',
    );
    await screen.findByRole('button', { name: /BTC\/USDT —/ }, { timeout: 5_000 });
    const favorite = screen.getByRole('button', { name: 'Thêm vào yêu thích' });
    expect(favorite).toBeDisabled();
    favorite.removeAttribute('disabled');
    fireEvent.click(favorite);
    expect(createCalls).toBe(0);
  });

  it('routes an unauthenticated favorite action to the matching shell login', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
    );
    const anonymousAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: null,
      async getSession() {
        return null;
      },
      async refresh() {
        return null;
      },
    };
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <MarketListPage />
        <CurrentPath />
      </>,
      { authAdapter: anonymousAdapter, routerProps: { initialEntries: ['/t/markets'] } },
    );

    await screen.findByRole('button', { name: 'Thêm vào yêu thích' }, { timeout: 5_000 });
    await user.click(screen.getByRole('button', { name: 'Thêm vào yêu thích' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/t/login');
  });

  it('filters market pairs and applies each supported sort order', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: marketPairs }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    renderWithProviders(<MarketListPage />);

    await screen.findByRole('button', { name: /BTC\/USDT —/ }, { timeout: 5_000 });
    fireEvent.click(screen.getByRole('button', { name: 'DeFi' }));
    expect(
      await screen.findByRole('button', { name: /ETH\/USDT —/ }, { timeout: 5_000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /BTC\/USDT —/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));
    const sortCases = [
      { label: 'Giá cao → thấp', order: ['BTC', 'ETH', 'SOL'] },
      { label: 'Giá thấp → cao', order: ['SOL', 'ETH', 'BTC'] },
      { label: 'Tăng nhiều nhất', order: ['SOL', 'BTC', 'ETH'] },
      { label: 'Giảm nhiều nhất', order: ['ETH', 'BTC', 'SOL'] },
      { label: 'Volume lớn nhất', order: ['BTC', 'ETH', 'SOL'] },
    ];

    for (const { label, order } of sortCases) {
      fireEvent.click(screen.getByRole('button', { name: 'Mở bộ sắp xếp' }));
      fireEvent.click(screen.getByRole('button', { name: label }));
      await screen.findByRole(
        'button',
        { name: new RegExp(`^${order[0]}\\/USDT —`) },
        {
          timeout: 5_000,
        },
      );

      const rows = screen
        .getAllByRole('button')
        .filter((button) => /\/USDT —/.test(button.getAttribute('aria-label') ?? ''));
      expect(rows.map((row) => row.getAttribute('aria-label')?.split(' — ')[0])).toEqual(
        order.map((asset) => `${asset}/USDT`),
      );
    }
  }, 30_000);

  it('searches symbols and base-asset aliases, then resets search, category and sorting', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({
          items: [...marketPairs, { ...pair, id: 'btc-alias-usdt', symbol: 'XBT/USDT' }],
        }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter });
    const searchInput = await screen.findByPlaceholderText('Tìm kiếm BTC, ETH...');

    await user.type(searchInput, 'BTC');
    expect(await screen.findByRole('button', { name: /XBT\/USDT —/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /BTC\/USDT —/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xóa tìm kiếm' }));
    await user.type(searchInput, 'SOL');
    expect(await screen.findByRole('button', { name: /SOL\/USDT —/ })).toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(screen.getByRole('button', { name: 'DeFi' }));
    expect(await screen.findByRole('button', { name: /ETH\/USDT —/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /BTC\/USDT —/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Mở bộ sắp xếp' }));
    await user.click(screen.getByRole('button', { name: 'Giá thấp → cao' }));
    await user.type(searchInput, 'missing');
    await user.click(await screen.findByRole('button', { name: 'Xóa bộ lọc' }));

    expect(await screen.findByRole('button', { name: /BTC\/USDT —/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /XBT\/USDT —/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ETH\/USDT —/ })).toBeInTheDocument();
    const rows = screen
      .getAllByRole('button')
      .filter((button) => /\/USDT —/.test(button.getAttribute('aria-label') ?? ''));
    expect(rows.map((row) => row.getAttribute('aria-label')?.split(' — ')[0])).toEqual([
      'BTC/USDT',
      'ETH/USDT',
      'SOL/USDT',
      'XBT/USDT',
    ]);
  }, 30_000);

  it('recovers from market-pair loading errors through the list retry action', async () => {
    let pairReads = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => {
        pairReads += 1;
        if (pairReads <= 3) {
          return HttpResponse.json({ message: 'Market unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ items: [pair] });
      }),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter });

    await user.click(await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5_000 }));

    expect(await screen.findByRole('button', { name: /BTC\/USDT —/ })).toBeInTheDocument();
    expect(pairReads).toBe(4);
  });

  it('retries an unavailable watchlist without blocking market data', async () => {
    let watchlistReads = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () => {
        watchlistReads += 1;
        if (watchlistReads <= 3) {
          return HttpResponse.json({ message: 'Watchlist unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ items: [] });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tải watchlist; thao tác yêu thích đang tạm khóa.',
    );
    expect(await screen.findByRole('button', { name: 'Thêm vào yêu thích' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Thử tải lại' }));

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /BTC\/USDT —/ })).toBeEnabled();
    expect(watchlistReads).toBe(4);
  });

  it('runs the query refetch callback after a pull-to-refresh gesture', async () => {
    let pairReads = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => {
        pairReads += 1;
        return HttpResponse.json({ items: [pair] });
      }),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    renderWithProviders(<MarketListPage />, { authAdapter });
    const footer = await screen.findByText(/Hiển thị \d+\/\d+ cặp giao dịch/);
    const surface = footer.closest('.relative.flex-1');
    expect(surface).not.toBeNull();

    fireEvent.touchStart(surface!, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(surface!, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(surface!);

    await waitFor(() => expect(pairReads).toBe(2), { timeout: 5_000 });
  });

  it('routes market shortcuts and sorts the strongest losers by percentage change', async () => {
    const additionalLoser = {
      ...pair,
      id: 'xrp-usdt',
      symbol: 'XRP/USDT',
      baseAsset: 'XRP',
      price: 0.52,
      change24h: -4.5,
      category: 'DeFi',
    };
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [...marketPairs, additionalLoser] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <MarketListPage />
        <CurrentPath />
      </>,
      { authAdapter, routerProps: { initialEntries: ['/t/markets'] } },
    );
    await screen.findByRole('button', { name: /XRP\/USDT —/ }, { timeout: 5_000 });
    const loserCard = screen.getByText('Giảm mạnh').parentElement?.parentElement;
    expect(loserCard).not.toBeNull();
    expect(loserCard!.textContent!.indexOf('XRP')).toBeLessThan(
      loserCard!.textContent!.indexOf('ETH'),
    );

    const shortcuts = [
      { label: 'Tổng quan thị trường', path: '/t/markets/overview' },
      { label: 'Biến động', path: '/t/markets/movers' },
      { label: 'Ngành', path: '/t/markets/sectors' },
    ];
    for (const shortcut of shortcuts) {
      await user.click(screen.getByRole('button', { name: shortcut.label }));
      expect(screen.getByTestId('current-path')).toHaveTextContent(shortcut.path);
    }
    await user.click(screen.getByRole('button', { name: 'Bộ lọc' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/t/markets/screener');
  });

  it('loads the next market batch when its intersection sentinel becomes visible', async () => {
    const originalIntersectionObserver = globalThis.IntersectionObserver;
    class IntersectingObserver {
      private disconnected = false;

      constructor(private readonly callback: IntersectionObserverCallback) {}

      observe(target: Element) {
        queueMicrotask(() => {
          if (!this.disconnected) {
            this.callback(
              [{ isIntersecting: true, target } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            );
          }
        });
      }

      disconnect() {
        this.disconnected = true;
      }

      unobserve() {}

      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }
    globalThis.IntersectionObserver =
      IntersectingObserver as unknown as typeof IntersectionObserver;
    try {
      const items = Array.from({ length: 10 }, (_, index) => ({
        ...pair,
        id: `asset-${index + 1}-usdt`,
        symbol: `ASSET${index + 1}/USDT`,
        baseAsset: `ASSET${index + 1}`,
        price: index + 1,
      }));
      server.use(
        http.get('http://localhost:3000/api/market/pairs', () => HttpResponse.json({ items })),
        http.get('http://localhost:3000/api/market/watchlist', () =>
          HttpResponse.json({ items: [] }),
        ),
      );
      renderWithProviders(<MarketListPage />, { authAdapter });

      expect(await screen.findByText('Đang tải thêm...')).toBeInTheDocument();
      expect(await screen.findByText('Hiển thị 10/10 cặp giao dịch')).toBeInTheDocument();
    } finally {
      globalThis.IntersectionObserver = originalIntersectionObserver;
    }
  });

  it('reuses the watchlist delete key after a transient failure', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({
          items: [
            { id: 'watchlist-btc-usdt', pairId: 'btc-usdt', addedAt: '2026-09-24T08:30:00Z' },
          ],
        }),
      ),
      http.delete(
        'http://localhost:3000/api/market/watchlist/watchlist-btc-usdt',
        ({ request }) => {
          idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
          attempts += 1;
          return attempts === 1
            ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
            : new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<MarketListPage />, { authAdapter });

    await user.click(
      await screen.findByRole('button', { name: 'Bỏ yêu thích' }, { timeout: 5_000 }),
    );
    await waitFor(() => expect(idempotencyKeys).toHaveLength(1), { timeout: 5_000 });
    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Bỏ yêu thích' })).toBeEnabled(),
      { timeout: 5_000 },
    );

    await user.click(screen.getByRole('button', { name: 'Bỏ yêu thích' }));
    await waitFor(() => expect(idempotencyKeys).toHaveLength(2), { timeout: 5_000 });
    expect(idempotencyKeys[0]).toMatch(/^market-watchlist-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('reuses the watchlist create key after a transient failure and prevents pending double-clicks', async () => {
    const idempotencyKeys: string[] = [];
    let attempts = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
      http.post('http://localhost:3000/api/market/watchlist', ({ request }) => {
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

    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter });

    await screen.findAllByText('BTC');
    await user.click(await screen.findByRole('button', { name: 'Thêm vào yêu thích' }));
    await waitFor(() => expect(idempotencyKeys).toHaveLength(1));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Thêm vào yêu thích' })).toBeEnabled(),
    );
    expect(idempotencyKeys).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Thêm vào yêu thích' }));
    await waitFor(() => expect(idempotencyKeys).toHaveLength(2));
    expect(idempotencyKeys[0]).toMatch(/^market-watchlist-/);
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });
});
