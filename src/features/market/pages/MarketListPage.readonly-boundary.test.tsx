import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { toast } from 'sonner';
import { marketApi } from '../api/market-api';
import { MarketListPage } from './MarketListPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

vi.mock('../components/MarketListSections', async (importOriginal) => {
  const original = await importOriginal<typeof import('../components/MarketListSections')>();
  const ReactModule = await import('react');

  return {
    ...original,
    MarketListHeader: () => null,
    MarketTopMovers: () => null,
    MarketPairsList: ({
      visiblePairs,
      onFavoriteToggle,
    }: {
      visiblePairs: Array<{ id: string; symbol: string }>;
      onFavoriteToggle?: (id: string) => void | Promise<void>;
    }) =>
      ReactModule.createElement(
        'div',
        null,
        ...visiblePairs.map((pair) =>
          ReactModule.createElement('span', { key: pair.id }, pair.symbol),
        ),
        ReactModule.createElement(
          'button',
          { onClick: () => void onFavoriteToggle?.('missing-pair') },
          'Trigger missing-pair callback',
        ),
        ReactModule.createElement(
          'button',
          { onClick: () => void onFavoriteToggle?.(visiblePairs[0]?.id ?? 'btc-usdt') },
          'Trigger favorite callback',
        ),
      ),
  };
});

vi.mock('@/features/market/components/DiscoverMoreSection', () => ({
  DiscoverMoreSection: () => null,
}));

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

describe('MarketListPage permission handler boundary', () => {
  it('rechecks missing-pair and watchlist permissions when a child callback fires', async () => {
    vi.mocked(toast.error).mockClear();
    let writes = 0;
    server.use(
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
      http.get('*/market/watchlist', () => HttpResponse.json({ items: [] })),
      http.post('*/market/watchlist', () => {
        writes += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<MarketListPage />, { authAdapter: readOnlyAdapter });

    await user.click(screen.getByRole('button', { name: 'Trigger missing-pair callback' }));
    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Trigger favorite callback' }));

    expect(toast.error).toHaveBeenCalledWith(
      'Market watchlist permission is required to change favorites.',
      { duration: 2000 },
    );
    expect(writes).toBe(0);
  });

  it('does not write until the watchlist read has settled', async () => {
    let releaseWatchlist!: (response: Response) => void;
    const pendingWatchlist = new Promise<Response>((resolve) => {
      releaseWatchlist = resolve;
    });
    let writes = 0;
    server.use(
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
      http.get('*/market/watchlist', () => pendingWatchlist),
      http.post('*/market/watchlist', () => {
        writes += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter: writeAdapter });
    await user.click(await screen.findByText('BTC/USDT'));
    await user.click(screen.getByRole('button', { name: 'Trigger favorite callback' }));
    expect(writes).toBe(0);

    releaseWatchlist(HttpResponse.json({ items: [] }));
  });

  it('reports a failed watchlist read before attempting a favorite write', async () => {
    let writes = 0;
    server.use(
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
      http.get('*/market/watchlist', () =>
        HttpResponse.json({ code: 'WATCHLIST_UNAVAILABLE' }, { status: 503 }),
      ),
      http.post('*/market/watchlist', () => {
        writes += 1;
        return HttpResponse.json({ id: 'watchlist-1', pairId: pair.id }, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter: writeAdapter });
    expect(await screen.findByText(/Không thể tải watchlist/)).toBeInTheDocument();
    await user.click(await screen.findByText('BTC/USDT'));
    await user.click(screen.getByRole('button', { name: 'Trigger favorite callback' }));

    expect(toast.error).toHaveBeenCalledWith(
      'Không thể xác nhận danh sách theo dõi. Tải lại rồi thử lại.',
      { duration: 2000 },
    );
    expect(writes).toBe(0);
  });

  it('uses safe feedback when a watchlist mutation rejects with a non-Error value', async () => {
    vi.mocked(toast.error).mockClear();
    server.use(
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair] })),
      http.get('*/market/watchlist', () => HttpResponse.json({ items: [] })),
    );
    vi.spyOn(marketApi, 'createWatchlistItem').mockRejectedValueOnce('opaque adapter failure');

    const user = userEvent.setup();
    renderWithProviders(<MarketListPage />, { authAdapter: writeAdapter });
    await user.click(await screen.findByText('BTC/USDT'));
    await user.click(screen.getByRole('button', { name: 'Trigger favorite callback' }));

    expect(toast.error).toHaveBeenCalledWith('Không thể cập nhật danh sách theo dõi.', {
      duration: 2000,
    });
  });
});
