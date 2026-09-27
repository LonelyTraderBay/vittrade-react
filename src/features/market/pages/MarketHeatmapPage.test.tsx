import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { MarketPair } from '../model/market-types';
import { MarketHeatmapPage } from './MarketHeatmapPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const pairs: MarketPair[] = [
  {
    id: 'btc-usdt',
    symbol: 'BTC/USDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 65_000,
    prevPrice: 64_000,
    change24h: 2,
    high24h: 66_000,
    low24h: 63_000,
    volume24h: 100,
    marketCap: 10_000,
    sparklineData: [64_000, 65_000],
    logoColor: '#F7931A',
    category: 'Layer 1',
  },
  {
    id: 'eth-usdt',
    symbol: 'ETH/USDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 3_000,
    prevPrice: 3_030,
    change24h: -1,
    high24h: 3_100,
    low24h: 2_900,
    volume24h: 900,
    marketCap: 20_000,
    sparklineData: [3_030, 3_000],
    logoColor: '#627EEA',
    category: 'DeFi',
  },
];

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function installPairs(items: MarketPair[]) {
  server.use(
    http.get('*/market/pairs', ({ request }) => {
      expect(new URL(request.url).searchParams.get('limit')).toBe('100');
      return HttpResponse.json({ items });
    }),
  );
}

describe('Market heatmap contract page', () => {
  it('filters contract pairs by category and preserves the web route prefix', async () => {
    installPairs(pairs);
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <MarketHeatmapPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/markets/heatmap'] } },
    );

    expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('2 cặp thị trường')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'DeFi' }));

    expect(screen.getByText('1 cặp thị trường')).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { name: /BTC/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('listitem', { name: /ETH/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/pair/eth-usdt');
  });

  it('shows an empty state when the pairs contract returns no items', async () => {
    installPairs([]);
    renderWithProviders(<MarketHeatmapPage />);

    expect(await screen.findByText('Không có dữ liệu cho ngành này.')).toBeInTheDocument();
    expect(screen.getByText('0 cặp thị trường')).toBeInTheDocument();
  });

  it('shows the shared error state and retries the pairs request', async () => {
    let retryAllowed = false;
    let requests = 0;
    server.use(
      http.get('*/market/pairs', () => {
        requests += 1;
        return retryAllowed
          ? HttpResponse.json({ items: pairs })
          : HttpResponse.json({ code: 'PAIRS_UNAVAILABLE' }, { status: 500 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<MarketHeatmapPage />);
    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();

    retryAllowed = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findAllByRole('listitem')).toHaveLength(2);
    expect(requests).toBe(2);
  });
});
