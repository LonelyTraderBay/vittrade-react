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

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function installOverview() {
  server.use(
    http.get('*/market/overview', () => HttpResponse.json(overview)),
    http.get('*/market/pairs', ({ request }) => {
      expect(new URL(request.url).searchParams.get('category')).toBe('Layer 1');
      return HttpResponse.json({ items: [pair] });
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
});
