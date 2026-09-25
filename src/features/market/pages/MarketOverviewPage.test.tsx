import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { MarketOverviewPage } from './MarketOverviewPage';
import type { MarketOverviewResponse } from '../model/market-types';

const { useMarketOverviewQuery } = vi.hoisted(() => ({ useMarketOverviewQuery: vi.fn() }));

vi.mock('@/features/market', () => ({ useMarketOverviewQuery }));

const overview: MarketOverviewResponse = {
  stats: {
    totalMarketCap: 2_100_000_000_000,
    totalMarketCapChange24h: -1.25,
    total24hVolume: 80_000_000_000,
    total24hVolumeChange: 2,
    btcDominance: 54,
    ethDominance: 18,
    totalCoins: 12_345,
    totalExchanges: 450,
    fearGreedIndex: 42,
    fearGreedLabel: 'Fear',
    activeCryptocurrencies: 10_000,
    defiTVL: 100_000_000,
    defiTVLChange24h: 1.5,
    stablecoinVolume24h: 20_000_000_000,
  },
  breadth: { advancing: 20, declining: 10, unchanged: 2, newATH: 1, dropping10Pct: 3 },
  fearGreedHistory: [
    { date: '2026-09-23', value: 42, label: 'Fear' },
    { date: '2026-09-24', value: 61, label: 'Greed' },
  ],
  sectors: [
    {
      id: 'layer-1',
      name: 'Layer 1',
      nameVi: 'Layer 1',
      color: '#123456',
      icon: 'layers',
      totalMarketCap: 1_000_000,
      change24h: 3,
      change7d: 2,
      change30d: 5,
      volume24h: 100_000,
      topCoins: ['BTC'],
      coinCount: 5,
      dominance: 12,
    },
  ],
  topGainers: [
    {
      id: 'BTC-USDT',
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 60_000,
      change1h: 1,
      change24h: 5,
      change7d: 8,
      volume24h: 10_000,
      volumeChange24h: 2,
      marketCap: 1_000_000,
      category: 'Layer 1',
      color: '#f7931a',
      sparkline: [1, 2, 3],
    },
  ],
  topLosers: [],
  updatedAt: '2026-09-24T10:00:00.000Z',
};

function queryState(overrides: Record<string, unknown> = {}) {
  return {
    data: overview,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return (
    <output data-testid="route-location">
      {location.pathname}
      {location.search}
    </output>
  );
}

describe('MarketOverviewPage', () => {
  beforeEach(() => {
    useMarketOverviewQuery.mockReset();
  });

  it('shows a loading state while the market overview is pending', () => {
    useMarketOverviewQuery.mockReturnValue(queryState({ isPending: true }));

    renderWithProviders(<MarketOverviewPage />);

    expect(screen.getByText('Đang tải dữ liệu thị trường…')).toBeInTheDocument();
  });

  it('offers a retry when the overview query fails or has no data', () => {
    const refetch = vi.fn();
    useMarketOverviewQuery.mockReturnValue(queryState({ data: undefined, isError: true, refetch }));

    renderWithProviders(<MarketOverviewPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));

    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders overview metrics and navigates to the selected market pair and sector', () => {
    useMarketOverviewQuery.mockReturnValue(queryState());

    renderWithProviders(
      <>
        <MarketOverviewPage />
        <LocationProbe />
      </>,
    );

    expect(screen.getByText('BTC Dominance')).toBeInTheDocument();
    expect(screen.getByText(overview.stats.totalCoins.toLocaleString())).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /BTC.*\+/ }));
    expect(screen.getByTestId('route-location')).toHaveTextContent('/pair/BTC-USDT');
    fireEvent.click(screen.getByText('Layer 1'));
    expect(screen.getByTestId('route-location')).toHaveTextContent('/markets/sectors?id=layer-1');
  });

  it('refreshes the overview and disables refresh while a request is active', () => {
    const refetch = vi.fn();
    useMarketOverviewQuery.mockReturnValue(queryState({ refetch, isFetching: true }));

    renderWithProviders(<MarketOverviewPage />);

    const refresh = screen.getByRole('button', { name: /làm mới/i });
    expect(refresh).toBeDisabled();
    fireEvent.click(refresh);
    expect(refetch).not.toHaveBeenCalled();
  });

  it('handles empty market collections and a zero breadth denominator safely', () => {
    const refetch = vi.fn();
    useMarketOverviewQuery.mockReturnValue(
      queryState({
        refetch,
        data: {
          ...overview,
          stats: { ...overview.stats, totalMarketCapChange24h: 1.25 },
          breadth: { advancing: 0, declining: 0, unchanged: 0, newATH: 0, dropping10Pct: 0 },
          fearGreedHistory: [],
          sectors: [],
          topGainers: [],
          topLosers: [],
        },
      }),
    );

    renderWithProviders(<MarketOverviewPage />);

    expect(screen.getByText('+1.25%')).toHaveStyle({ color: 'rgb(16, 185, 129)' });
    expect(screen.getByText('0 ATH mới')).toBeInTheDocument();
    expect(screen.getByText('0 giảm >10%')).toBeInTheDocument();
    expect(screen.queryByText('Layer 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /làm mới/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
