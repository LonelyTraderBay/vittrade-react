import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import type { ReactNode } from 'react';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { toast } from 'sonner';
import { marketApi } from '../api/market-api';
import { PairDetailPage } from './PairDetailPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('@/shared/ui/layout/Header', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/shared/ui/layout/Header')>();
  const ReactModule = await import('react');

  return {
    ...original,
    Header: ({ title, right }: { title: string; right?: ReactNode }) => {
      const enabledAction = ReactModule.isValidElement(right)
        ? ReactModule.cloneElement(right, { disabled: false } as never)
        : right;
      return ReactModule.createElement(
        'header',
        null,
        ReactModule.createElement('h1', null, title),
        enabledAction,
      );
    },
  };
});

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
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

const readOnlyAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions: ['market:read'] },
  },
};

const writeAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: {
      ...testAuthAdapter.initialSession!.user,
      permissions: ['market:read', 'market:watchlist:write'],
    },
  },
};

function installPairHandlers(watchlist: () => Response | Promise<Response>) {
  server.use(
    http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)),
    http.get('*/market/pairs/btc-usdt/orderbook', () =>
      HttpResponse.json({ bids: [], asks: [], updatedAt: '2026-09-24T08:30:00.000Z' }),
    ),
    http.get('*/market/pairs/btc-usdt/trades', () => HttpResponse.json({ items: [] })),
    http.get('*/market/watchlist', () => watchlist()),
  );
}

describe('PairDetailPage permission handler boundary', () => {
  it('rechecks watchlist permission when a stale child event bypasses the disabled control', async () => {
    vi.mocked(toast.error).mockClear();
    let writes = 0;
    server.use(
      http.get('*/market/pairs/btc-usdt', () => HttpResponse.json(pair)),
      http.get('*/market/pairs/btc-usdt/orderbook', () =>
        HttpResponse.json({ bids: [], asks: [], updatedAt: '2026-09-24T08:30:00.000Z' }),
      ),
      http.get('*/market/pairs/btc-usdt/trades', () => HttpResponse.json({ items: [] })),
      http.get('*/market/watchlist', () => HttpResponse.json({ items: [] })),
      http.post('*/market/watchlist', () => {
        writes += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/pair/:pairId" element={<PairDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/pair/btc-usdt'] }, authAdapter: readOnlyAdapter },
    );

    const followButton = await screen.findByRole('button', { name: 'Theo dõi cặp giao dịch' });
    expect(followButton).toBeEnabled();
    await userEvent.click(followButton);

    expect(toast.error).toHaveBeenCalledWith(
      'Market watchlist permission is required to change favorites.',
      { duration: 2000 },
    );
    expect(writes).toBe(0);
  });

  it('waits for watchlist confirmation before allowing a favorite write', async () => {
    let releaseWatchlist!: (response: Response) => void;
    const pendingWatchlist = new Promise<Response>((resolve) => {
      releaseWatchlist = resolve;
    });
    let writes = 0;
    installPairHandlers(() => pendingWatchlist);
    server.use(
      http.post('*/market/watchlist', () => {
        writes += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/pair/:pairId" element={<PairDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/pair/btc-usdt'] }, authAdapter: writeAdapter },
    );

    await screen.findByRole('heading', { name: 'BTC/USDT' });
    await userEvent.click(screen.getByRole('button', { name: 'Theo dõi cặp giao dịch' }));
    expect(writes).toBe(0);
    releaseWatchlist(HttpResponse.json({ items: [] }));
  });

  it('keeps favorite writes locked after the watchlist read fails', async () => {
    vi.mocked(toast.error).mockClear();
    let writes = 0;
    installPairHandlers(() =>
      HttpResponse.json({ code: 'WATCHLIST_UNAVAILABLE' }, { status: 503 }),
    );
    server.use(
      http.post('*/market/watchlist', () => {
        writes += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/pair/:pairId" element={<PairDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/pair/btc-usdt'] }, authAdapter: writeAdapter },
    );

    expect(await screen.findByText(/Không thể tải watchlist/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Theo dõi cặp giao dịch' }));
    expect(writes).toBe(0);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('uses safe feedback when a watchlist mutation rejects with a non-Error value', async () => {
    vi.mocked(toast.error).mockClear();
    installPairHandlers(() => HttpResponse.json({ items: [] }));
    vi.spyOn(marketApi, 'createWatchlistItem').mockRejectedValueOnce('opaque adapter failure');

    renderWithProviders(
      <Routes>
        <Route path="/pair/:pairId" element={<PairDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/pair/btc-usdt'] }, authAdapter: writeAdapter },
    );

    await screen.findByRole('heading', { name: 'BTC/USDT' });
    await userEvent.click(screen.getByRole('button', { name: 'Theo dõi cặp giao dịch' }));

    expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật danh sách theo dõi.', {
      duration: 2000,
    });
  });
});
