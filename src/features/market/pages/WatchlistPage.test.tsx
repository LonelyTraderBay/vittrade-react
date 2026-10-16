import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { WatchlistPage } from './WatchlistPage';

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

const readOnlyAuthAdapter: AuthAdapter = {
  ...authAdapter,
  initialSession: {
    ...authAdapter.initialSession!,
    user: {
      ...authAdapter.initialSession!.user,
      permissions: ['market:read'],
    },
  },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function installWatchlistHandlers() {
  server.use(
    http.get('http://localhost:3000/api/market/pairs', () => HttpResponse.json({ items: [pair] })),
    http.get('http://localhost:3000/api/market/watchlist', () =>
      HttpResponse.json({ items: [watchlistItem] }),
    ),
  );
}

describe('WatchlistPage', () => {
  it('shows permission denial when the protected watchlist request returns 403', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ code: 'FORBIDDEN' }, { status: 403 }),
      ),
    );

    renderWithProviders(<WatchlistPage />, { authAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không có quyền xem danh sách theo dõi',
    );
    expect(screen.queryByText('Chưa có cặp trong danh sách theo dõi')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Thử lại' })).not.toBeInTheDocument();
  });

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

  it('filters pairs and keeps a read-only session from mutating the watchlist', async () => {
    const mutate = vi.fn();
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [watchlistItem] }),
      ),
      http.patch('http://localhost:3000/api/market/watchlist/watchlist-btc-usdt', () => {
        mutate();
        return HttpResponse.json(watchlistItem);
      }),
      http.delete('http://localhost:3000/api/market/watchlist/watchlist-btc-usdt', () => {
        mutate();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchlistPage />, { authAdapter: readOnlyAuthAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent('read-only');
    const remove = await screen.findByRole('button', { name: 'Xóa khỏi danh sách theo dõi' });
    const note = screen.getByRole('button', { name: 'Thêm ghi chú' });
    expect(remove).toBeDisabled();
    expect(note).toBeDisabled();
    await user.click(remove);
    await user.click(note);
    expect(mutate).not.toHaveBeenCalled();

    const search = screen.getByPlaceholderText('Tìm cặp giao dịch…');
    await user.type(search, 'SOL');
    expect(screen.getByText('Không tìm thấy cặp nào')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Xóa khỏi danh sách theo dõi' }),
    ).not.toBeInTheDocument();
  });

  it('navigates to the selected pair trade route inside the current shell', async () => {
    installWatchlistHandlers();
    renderWithProviders(
      <>
        <WatchlistPage />
        <LocationProbe />
      </>,
      { authAdapter, routerProps: { initialEntries: ['/w/markets/watchlist'] } },
    );

    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    expect(
      screen.getByText('1 cặp đang theo dõi').parentElement?.querySelector('svg'),
    ).toHaveAttribute('fill', 'var(--tr-primary)');
    fireEvent.click(screen.getByRole('button', { name: 'Giao dịch' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/trade/btc-usdt');
  });

  it('opens the markets route from both watchlist add actions when the list is empty', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <WatchlistPage />
        <LocationProbe />
      </>,
      { authAdapter, routerProps: { initialEntries: ['/w/markets/watchlist'] } },
    );

    expect(await screen.findByText('Chưa có cặp trong danh sách theo dõi')).toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: 'Thêm cặp giao dịch' });
    expect(addButtons).toHaveLength(2);
    await user.click(addButtons[0]);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/markets');
    await user.click(addButtons[1]);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/markets');
  });

  it('navigates to the pair detail route from both pair identity controls', async () => {
    installWatchlistHandlers();
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <WatchlistPage />
        <LocationProbe />
      </>,
      { authAdapter, routerProps: { initialEntries: ['/w/markets/watchlist'] } },
    );

    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    const assetLabels = screen.getAllByText('BTC', { exact: true });
    expect(assetLabels).toHaveLength(2);
    await user.click(assetLabels[0].closest('button')!);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/pair/btc-usdt');
    await user.click(screen.getByText('BTC/USDT').closest('button')!);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/pair/btc-usdt');
  });

  it('shows the negative market move with its loss color', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [{ ...pair, change24h: -2.34 }] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [watchlistItem] }),
      ),
    );

    renderWithProviders(<WatchlistPage />, { authAdapter });

    expect(await screen.findByText('-2.34%')).toHaveStyle({ color: 'var(--tr-error-text)' });
  });

  it('retries both market queries after a transient load error', async () => {
    let pairRequests = 0;
    let watchlistRequests = 0;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => {
        pairRequests += 1;
        return pairRequests <= 3
          ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
          : HttpResponse.json({ items: [pair] });
      }),
      http.get('http://localhost:3000/api/market/watchlist', () => {
        watchlistRequests += 1;
        return HttpResponse.json({ items: [watchlistItem] });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchlistPage />, { authAdapter });

    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    await waitFor(() => {
      expect(pairRequests).toBe(4);
      expect(watchlistRequests).toBe(2);
    });
  });

  it('trims and saves a note while reusing its idempotency key after a transient failure', async () => {
    const prompt = vi
      .spyOn(window, 'prompt')
      .mockReturnValueOnce('  support level  ')
      .mockReturnValueOnce(' support level ');
    const requests: Array<{ key: string | null; body: unknown }> = [];
    let note: string | undefined;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair] }),
      ),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [{ ...watchlistItem, note }] }),
      ),
      http.patch(
        'http://localhost:3000/api/market/watchlist/watchlist-btc-usdt',
        async ({ request }) => {
          requests.push({
            key: request.headers.get('Idempotency-Key'),
            body: await request.json(),
          });
          if (requests.length === 1) {
            return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
          }
          note = (requests[1].body as { note: string }).note;
          return HttpResponse.json({ ...watchlistItem, note });
        },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchlistPage />, { authAdapter });

    await user.click(await screen.findByRole('button', { name: 'Thêm ghi chú' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể lưu ghi chú');
    await user.click(screen.getByRole('button', { name: 'Thêm ghi chú' }));

    expect(await screen.findByText('📝 support level')).toBeInTheDocument();
    expect(prompt).toHaveBeenCalledTimes(2);
    expect(requests).toEqual([
      { key: expect.any(String), body: { note: 'support level' } },
      { key: requests[0].key, body: { note: 'support level' } },
    ]);
  });

  it('does not send a note update after the prompt is cancelled', async () => {
    installWatchlistHandlers();
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue(null);
    const update = vi.fn();
    server.use(
      http.patch('http://localhost:3000/api/market/watchlist/watchlist-btc-usdt', () => {
        update();
        return HttpResponse.json(watchlistItem);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchlistPage />, { authAdapter });

    await user.click(await screen.findByRole('button', { name: 'Thêm ghi chú' }));

    expect(prompt).toHaveBeenCalledWith('Nhập ghi chú:', '');
    expect(update).not.toHaveBeenCalled();
  });
});
