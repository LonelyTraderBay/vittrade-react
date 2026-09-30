import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { MarketDerivativesResponse } from '../model/market-types';
import { MarketDerivativesPage } from './MarketDerivativesPage';

const { useMarketDerivativesQuery } = vi.hoisted(() => ({
  useMarketDerivativesQuery: vi.fn(),
}));

vi.mock('@/features/market', () => ({ useMarketDerivativesQuery }));

const response: MarketDerivativesResponse = {
  provider: 'Derivatives Source',
  updatedAt: '2026-09-26T08:00:00.000Z',
  stats: {
    totalOpenInterest: 10_000,
    openInterestChange24h: 2.3,
    totalVolume24h: 20_000,
    volumeChange24h: 1.5,
    totalLiquidations24h: 200,
    longLiquidations24h: 120,
    shortLiquidations24h: 80,
    averageFundingRate8h: 0.000012,
    btcLongShortRatio: 1.18,
  },
  pairs: [
    {
      id: 'btc-perp',
      symbol: 'BTC/USDT',
      name: 'Bitcoin',
      price: 65_000,
      change24h: 1.2,
      fundingRate: 0.0001,
      openInterest: 4_000,
      openInterestChange24h: 0.5,
      volume24h: 8_000,
      longSharePercent: 60,
      liquidations24h: { long: 90, short: 10 },
    },
  ],
  liquidationHistory: [
    { bucketAt: '2026-09-26T04:00:00.000Z', long: 40, short: 20 },
    { bucketAt: '2026-09-26T08:00:00.000Z', long: 80, short: 60 },
  ],
};

function queryState(overrides: Record<string, unknown> = {}) {
  return {
    data: response,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('MarketDerivativesPage', () => {
  beforeEach(() => {
    useMarketDerivativesQuery.mockReset();
  });

  it('shows loading and retries after the source is unavailable', () => {
    useMarketDerivativesQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<MarketDerivativesPage />);
    expect(screen.getByText('Đang tải dữ liệu phái sinh…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketDerivativesQuery.mockReturnValue(
      queryState({ data: undefined, isError: true, refetch }),
    );
    rerender(<MarketDerivativesPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the provider snapshot and market overview fields', () => {
    useMarketDerivativesQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketDerivativesPage />);

    expect(screen.getByText(/Derivatives Source/)).toBeInTheDocument();
    expect(screen.getByText('Tổng Open Interest')).toBeInTheDocument();
    expect(screen.getByText('Khối lượng 24h')).toBeInTheDocument();
    expect(screen.getByText('BTC Long/Short')).toBeInTheDocument();
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
  });

  it('shows source values and derived complementary shares on the perpetual tab', () => {
    useMarketDerivativesQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketDerivativesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Perpetual' }));

    expect(screen.getByRole('button', { name: 'Funding' })).toBeInTheDocument();
    expect(screen.getByText(/Long 60\.0%/)).toBeInTheDocument();
    expect(screen.getByText(/Short 40\.0%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Volume' }));
    expect(screen.getByRole('button', { name: 'Volume' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows liquidation amounts and handles zero-value bars safely', () => {
    useMarketDerivativesQuery.mockReturnValue(queryState());
    const { rerender } = renderWithProviders(<MarketDerivativesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Thanh lý' }));

    expect(screen.getByText('Tổng thanh lý 24h')).toBeInTheDocument();
    expect(screen.getByText('Long $120')).toBeInTheDocument();
    expect(screen.getByText('Short $80')).toBeInTheDocument();

    useMarketDerivativesQuery.mockReturnValue(
      queryState({
        data: {
          ...response,
          stats: {
            ...response.stats,
            totalLiquidations24h: 0,
            longLiquidations24h: 0,
            shortLiquidations24h: 0,
          },
          pairs: [{ ...response.pairs[0], liquidations24h: { long: 0, short: 0 } }],
          liquidationHistory: [],
        },
      }),
    );
    rerender(<MarketDerivativesPage />);
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
