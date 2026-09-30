import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { MarketScreenerPage } from './MarketScreenerPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const pairs = [
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
  {
    id: 'sol-usdt',
    symbol: 'SOL/USDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 180,
    prevPrice: 170,
    change24h: 8,
    high24h: 185,
    low24h: 165,
    volume24h: 300,
    marketCap: 5_000,
    sparklineData: [170, 180],
    logoColor: '#9945FF',
    category: 'Layer 1',
  },
];

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function symbolsInOrder() {
  return screen
    .getAllByRole('button')
    .map((button) => button.textContent?.match(/(?:BTC|ETH|SOL)\/USDT/)?.[0])
    .filter((symbol): symbol is string => Boolean(symbol));
}

describe('Market screener contract page', () => {
  it('filters and sorts contract pairs, then preserves the active shell prefix on navigation', async () => {
    server.use(
      http.get('*/market/pairs', ({ request }) => {
        expect(new URL(request.url).searchParams.get('limit')).toBe('100');
        return HttpResponse.json({ items: pairs });
      }),
    );

    renderWithProviders(
      <>
        <MarketScreenerPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/markets/screener'] } },
    );

    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    expect(symbolsInOrder()).toEqual(['SOL/USDT', 'BTC/USDT', 'ETH/USDT']);

    await userEvent.click(screen.getByRole('button', { name: 'Market cap' }));
    expect(symbolsInOrder()).toEqual(['ETH/USDT', 'BTC/USDT', 'SOL/USDT']);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Lọc ngành' }), 'Layer 1');
    fireEvent.change(screen.getByPlaceholderText('Tìm tài sản…'), { target: { value: 'BTC' } });
    expect(screen.getByText('1 tài sản')).toBeInTheDocument();
    expect(screen.queryByText('SOL/USDT')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /BTC\/USDT/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/pair/btc-usdt');
  });

  it('shows an explicit empty state when the contract returns no pairs', async () => {
    server.use(http.get('*/market/pairs', () => HttpResponse.json({ items: [] })));

    renderWithProviders(<MarketScreenerPage />);

    expect(await screen.findByText('Không có tài sản phù hợp.')).toBeInTheDocument();
    expect(screen.getByText('0 tài sản')).toBeInTheDocument();
  });

  it('shows the shared error state and retries a failed pairs request', async () => {
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

    renderWithProviders(<MarketScreenerPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    retryAllowed = true;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('BTC/USDT')).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
