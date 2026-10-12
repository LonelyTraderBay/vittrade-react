import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { MarketSectorsPage } from './MarketSectorsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const overview = {
  stats: {
    totalMarketCap: 150_000_000_000,
    totalMarketCapChange24h: 1.2,
    total24hVolume: 500_000,
    total24hVolumeChange: -0.4,
    btcDominance: 52.1,
    ethDominance: 18.4,
    totalCoins: 120,
    totalExchanges: 30,
    fearGreedIndex: 62,
    fearGreedLabel: 'Greed',
    activeCryptocurrencies: 100,
    defiTVL: 80_000,
    defiTVLChange24h: 0.7,
    stablecoinVolume24h: 200_000,
  },
  breadth: { advancing: 60, declining: 30, unchanged: 10, newATH: 2, dropping10Pct: 1 },
  fearGreedHistory: [{ date: 'today', value: 62, label: 'Greed' }],
  sectors: [
    {
      id: 'layer1',
      name: 'Layer 1',
      nameVi: 'Layer One',
      color: '#3B82F6',
      icon: 'L1',
      totalMarketCap: 100_000_000_000,
      change24h: 3,
      change7d: -5,
      change30d: 8,
      volume24h: 250_000,
      topCoins: ['BTC'],
      coinCount: 10,
      dominance: 50,
    },
    {
      id: 'defi',
      name: 'DeFi',
      nameVi: 'DeFi',
      color: '#8B5CF6',
      icon: 'D',
      totalMarketCap: 50_000_000_000,
      change24h: -4,
      change7d: 8,
      change30d: -2,
      volume24h: 150_000,
      topCoins: ['UNI'],
      coinCount: 8,
      dominance: 25,
    },
  ],
  topGainers: [],
  topLosers: [],
  updatedAt: '2026-09-21T10:00:00.000Z',
};

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  prevPrice: 64_000,
  change24h: 1.56,
  high24h: 66_000,
  low24h: 63_000,
  volume24h: 1_000_000,
  marketCap: 1_200_000_000,
  sparklineData: [64_000, 64_500, 65_000],
  logoColor: '#F7931A',
  category: 'Layer 1',
};

const secondPair = {
  ...pair,
  id: 'eth-usdt',
  symbol: 'ETH/USDT',
  baseAsset: 'ETH',
  price: 2_500,
  prevPrice: 2_520,
  change24h: -1.5,
  high24h: 2_600,
  low24h: 2_450,
  volume24h: 500_000_000,
  marketCap: 300_000_000,
  sparklineData: [2_520, 2_510, 2_500],
  logoColor: '#627EEA',
};

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function installOverview() {
  server.use(
    http.get('*/market/overview', () => HttpResponse.json(overview)),
    http.get('*/market/pairs', ({ request }) => {
      expect(new URL(request.url).searchParams.get('category')).toBe('Layer 1');
      return HttpResponse.json({ items: [pair, secondPair] });
    }),
  );
}

describe('Market sectors contract page', () => {
  it('loads API-backed sectors and opens a pair under the active web route prefix', async () => {
    installOverview();

    renderWithProviders(
      <>
        <MarketSectorsPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/markets/sectors'] } },
    );

    expect(await screen.findByRole('button', { name: /Layer One/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Layer One/ }));
    expect(await screen.findByText('Layer One', { selector: 'span' })).toBeInTheDocument();

    expect(await screen.findByText('-1.50%')).toHaveStyle({ color: 'rgb(239, 68, 68)' });
    await userEvent.click(await screen.findByRole('button', { name: /BTC\/USDT/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/pair/btc-usdt');
  });

  it('shows and retries pair-load failures in sector detail instead of presenting an empty list', async () => {
    let retryAllowed = false;
    let pairRequests = 0;
    server.use(
      http.get('*/market/overview', () => HttpResponse.json(overview)),
      http.get('*/market/pairs', ({ request }) => {
        pairRequests += 1;
        expect(new URL(request.url).searchParams.get('category')).toBe('Layer 1');
        return retryAllowed
          ? HttpResponse.json({ items: [pair] })
          : HttpResponse.json({ code: 'SECTOR_PAIRS_UNAVAILABLE' }, { status: 500 });
      }),
    );

    renderWithProviders(<MarketSectorsPage />);

    await userEvent.click(await screen.findByRole('button', { name: /Layer One/ }));
    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();

    retryAllowed = true;
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByRole('button', { name: /BTC\/USDT/ })).toBeInTheDocument();
    expect(pairRequests).toBe(2);
  });

  it('retries overview errors and returns to the sector list from the quick comparison detail', async () => {
    let overviewRequests = 0;
    let retryAllowed = false;
    server.use(
      http.get('*/market/overview', () => {
        overviewRequests += 1;
        return retryAllowed
          ? HttpResponse.json(overview)
          : HttpResponse.json({ code: 'OVERVIEW_UNAVAILABLE' }, { status: 500 });
      }),
      http.get('*/market/pairs', () => HttpResponse.json({ items: [pair, secondPair] })),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <MarketSectorsPage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/markets/sectors'] } },
    );

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    retryAllowed = true;
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));
    const comparison = await screen.findByRole('button', { name: /Layer 1/ });
    await user.click(comparison);
    expect(await screen.findByText('Layer One', { selector: 'span' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại ngành' }));

    expect(await screen.findByRole('button', { name: /Layer One/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quay lại ngành' })).not.toBeInTheDocument();
    expect(overviewRequests).toBe(2);
    expect(screen.getByTestId('location')).toHaveTextContent('/w/markets/sectors');
  });

  it('sorts sectors by the selected timeframe, market cap and coin count', async () => {
    const sortableOverview = {
      ...overview,
      sectors: [
        { ...overview.sectors[0], totalMarketCap: 10_000_000_000, coinCount: 12 },
        { ...overview.sectors[1], totalMarketCap: 20_000_000_000, coinCount: 9 },
      ],
    };
    server.use(http.get('*/market/overview', () => HttpResponse.json(sortableOverview)));
    const user = userEvent.setup();
    renderWithProviders(<MarketSectorsPage />);

    const sectorCoinOrder = () =>
      screen.getAllByText(/coins ·/).map((item) => item.textContent?.match(/^\d+/)?.[0]);

    await screen.findByRole('button', { name: /Layer One/ });
    expect(sectorCoinOrder()).toEqual(['12', '9']);
    await user.click(screen.getByRole('button', { name: '7d' }));
    expect(sectorCoinOrder()).toEqual(['9', '12']);
    await user.click(screen.getByRole('button', { name: '30d' }));
    expect(sectorCoinOrder()).toEqual(['12', '9']);

    const sort = screen.getByRole('combobox', { name: 'Sắp xếp ngành' });
    await user.selectOptions(sort, 'marketCap');
    expect(sectorCoinOrder()).toEqual(['9', '12']);
    await user.selectOptions(sort, 'coins');
    expect(sectorCoinOrder()).toEqual(['12', '9']);
  });
});
