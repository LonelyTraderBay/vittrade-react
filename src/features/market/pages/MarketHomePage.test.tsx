import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { within } from '@testing-library/react';
import { useLocation } from 'react-router';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders, screen } from '../../../test/test-utils';
import { MarketHomePage } from './MarketHomePage';

const server = setupServer(
  http.get('http://localhost:3000/api/market/watchlist', () => HttpResponse.json({ items: [] })),
);

const pairs = [
  {
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
    isFavorite: true,
    category: 'Layer 1',
  },
  {
    id: 'eth-usdt',
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3_521.45,
    prevPrice: 3_565,
    change24h: -1.23,
    high24h: 3_600,
    low24h: 3_480,
    volume24h: 8_765_432_000,
    marketCap: 423_456_789_000,
    sparklineData: [3_565, 3_530, 3_521.45],
    logoColor: '#627EEA',
    isFavorite: false,
    category: 'Layer 1',
  },
];
const authenticatedAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: {
      ...testAuthAdapter.initialSession!.user,
      permissions: ['market:read'],
    },
  },
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('MarketHomePage contract-backed compatibility route', () => {
  it('renders a loading state while market data is pending', () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json({ items: pairs });
      }),
    );

    renderWithProviders(<MarketHomePage />);
    expect(screen.getByText(/Đang tải dữ liệu thị trường/)).toBeInTheDocument();
  });

  it('renders typed market sections after the API response', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => HttpResponse.json({ items: pairs })),
    );

    renderWithProviders(<MarketHomePage />);

    expect((await screen.findAllByText('BTC/USDT')).length).toBeGreaterThan(0);
    expect(screen.getByText('Chưa có cặp trong watchlist')).toBeInTheDocument();
    expect(screen.getByText('Đang theo dõi')).toBeInTheDocument();
    expect(screen.getAllByText('Tăng mạnh').length).toBeGreaterThan(0);
    expect(screen.getByText('Thanh khoản nổi bật')).toBeInTheDocument();
  });

  it('renders favorites from the authenticated user watchlist, not public pair flags', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => HttpResponse.json({ items: pairs })),
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({
          items: [{ id: 'watch-eth', pairId: 'eth-usdt', addedAt: '2026-09-24T08:30:00Z' }],
        }),
      ),
    );

    renderWithProviders(<MarketHomePage />, { authAdapter: authenticatedAdapter });

    const watchlistRegion = await screen.findByRole('region', { name: 'Đang theo dõi' });
    expect(within(watchlistRegion).getByRole('button', { name: /ETH\/USDT/ })).toBeInTheDocument();
    expect(within(watchlistRegion).queryByRole('button', { name: /BTC\/USDT/ })).toBeNull();
  });

  it('shows explicit empty states when the market contract returns no pairs', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => HttpResponse.json({ items: [] })),
    );

    renderWithProviders(<MarketHomePage />);

    expect(await screen.findByText('Chưa có cặp trong watchlist')).toBeInTheDocument();
    expect(screen.getAllByText('Chưa có dữ liệu')).toHaveLength(2);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  it('keeps the market navigation affordances accessible', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => HttpResponse.json({ items: pairs })),
    );

    renderWithProviders(
      <>
        <MarketHomePage />
        <CurrentPath />
      </>,
      { routerProps: { initialEntries: ['/w/markets'] } },
    );

    await screen.findAllByText('BTC/USDT');
    fireEvent.click(screen.getByRole('button', { name: 'Tổng quan' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/markets/overview');

    fireEvent.click(screen.getByRole('button', { name: 'Đang theo dõi' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/markets/watchlist');

    fireEvent.click(screen.getAllByRole('button', { name: /BTC\/USDT/ })[0]);
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/pair/btc-usdt');

    fireEvent.click(screen.getByRole('button', { name: 'Tăng mạnh' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/markets/movers');

    fireEvent.click(screen.getByRole('button', { name: 'Khám phá' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/w/markets');
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('recovers from an API error after the user retries', async () => {
    let attempts = 0;
    let allowSuccess = false;
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () => {
        attempts += 1;
        return allowSuccess
          ? HttpResponse.json({ items: pairs })
          : HttpResponse.json(
              { code: 'MARKET_UNAVAILABLE', message: 'Market unavailable' },
              { status: 503 },
            );
      }),
    );

    renderWithProviders(<MarketHomePage />);

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    allowSuccess = true;
    fireEvent.click(retryButton);
    expect((await screen.findAllByText('BTC/USDT')).length).toBeGreaterThan(0);
    expect(attempts).toBeGreaterThan(1);
  });
});
