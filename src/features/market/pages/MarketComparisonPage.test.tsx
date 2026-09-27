import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { MarketComparisonPage } from './MarketComparisonPage';

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
  {
    id: 'ada-usdt',
    symbol: 'ADA/USDT',
    baseAsset: 'ADA',
    quoteAsset: 'USDT',
    price: 0.5,
    prevPrice: 0.48,
    change24h: 4,
    high24h: 0.52,
    low24h: 0.47,
    volume24h: 250,
    marketCap: 4_000,
    sparklineData: [0.48, 0.5],
    logoColor: '#0033AD',
    category: 'Layer 1',
  },
  {
    id: 'xrp-usdt',
    symbol: 'XRP/USDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    price: 0.6,
    prevPrice: 0.61,
    change24h: -2,
    high24h: 0.63,
    low24h: 0.58,
    volume24h: 400,
    marketCap: 6_000,
    sparklineData: [0.61, 0.6],
    logoColor: '#23292F',
    category: 'Payments',
  },
];

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function installPairs() {
  server.use(
    http.get('*/market/pairs', ({ request }) => {
      expect(new URL(request.url).searchParams.get('limit')).toBe('100');
      return HttpResponse.json({ items: pairs });
    }),
  );
}

async function addPair(symbol: string) {
  const option = await screen.findByRole('option', { name: symbol });
  await userEvent.selectOptions(
    screen.getByRole('combobox', { name: 'Chọn tài sản để thêm' }),
    option,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Thêm tài sản' }));
}

describe('Market comparison contract page', () => {
  it('compares selected pairs, removes them, and preserves the web prefix on pair navigation', async () => {
    installPairs();

    renderWithProviders(
      <>
        <MarketComparisonPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/markets/compare'] } },
    );

    await addPair('BTC/USDT');
    await addPair('ETH/USDT');

    expect(screen.getByText('2/4')).toBeInTheDocument();
    expect(screen.getByText('Giá hiện tại')).toBeInTheDocument();
    expect(screen.getByText('Thay đổi 24h')).toBeInTheDocument();
    expect(screen.getByText('Market cap')).toBeInTheDocument();
    expect(screen.getByText('Volume 24h')).toBeInTheDocument();

    const assetButtons = screen.getAllByRole('button', { name: /BTC\/USDT/ });
    await userEvent.click(assetButtons[assetButtons.length - 1]!);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/pair/btc-usdt');

    const removeButtons = screen.getAllByRole('button', { name: 'BTC/USDT' });
    await userEvent.click(removeButtons[0]!);
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(screen.queryByText('Giá hiện tại')).not.toBeInTheDocument();
  });

  it('allows at most four unique pairs and can replace a removed pair', async () => {
    installPairs();
    renderWithProviders(<MarketComparisonPage />);

    await screen.findByRole('option', { name: 'BTC/USDT' });
    await addPair('BTC/USDT');
    await addPair('ETH/USDT');
    await addPair('SOL/USDT');
    await addPair('ADA/USDT');

    expect(screen.getByText('4/4')).toBeInTheDocument();
    const selector = screen.getByRole('combobox', { name: 'Chọn tài sản để thêm' });
    expect(within(selector).getAllByRole('option')).toHaveLength(2);
    expect(within(selector).getByRole('option', { name: 'XRP/USDT' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm tài sản' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'BTC/USDT' }));
    expect(screen.getByText('3/4')).toBeInTheDocument();
    await addPair('XRP/USDT');
    expect(screen.getByText('4/4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm tài sản' })).toBeDisabled();
  });

  it('shows an empty state when the contract returns no pairs', async () => {
    server.use(http.get('*/market/pairs', () => HttpResponse.json({ items: [] })));
    renderWithProviders(<MarketComparisonPage />);

    expect(await screen.findByText('Chọn ít nhất một cặp để bắt đầu so sánh.')).toBeInTheDocument();
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
    renderWithProviders(<MarketComparisonPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    retryAllowed = true;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(
      await screen.findByRole('combobox', { name: 'Chọn tài sản để thêm' }),
    ).toBeInTheDocument();
    expect(requests).toBe(2);
  });
});
