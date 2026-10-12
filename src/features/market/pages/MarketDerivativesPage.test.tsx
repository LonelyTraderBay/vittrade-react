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

  it('sorts multiple pairs by each selected metric and shows negative changes as losses', () => {
    const pairs: MarketDerivativesResponse['pairs'] = [
      {
        ...response.pairs[0],
        id: 'btc-perp',
        symbol: 'BTC/USDT',
        openInterest: 100,
        volume24h: 30,
        fundingRate: 0.0001,
        change24h: 3,
        liquidations24h: { long: 1, short: 1 },
      },
      {
        ...response.pairs[0],
        id: 'eth-perp',
        symbol: 'ETH/USDT',
        openInterest: 200,
        volume24h: 10,
        fundingRate: -0.0004,
        change24h: -1,
        liquidations24h: { long: 8, short: 2 },
      },
      {
        ...response.pairs[0],
        id: 'sol-perp',
        symbol: 'SOL/USDT',
        openInterest: 50,
        volume24h: 20,
        fundingRate: 0.0002,
        change24h: -5,
        liquidations24h: { long: 3, short: 2 },
      },
    ];
    useMarketDerivativesQuery.mockReturnValue(queryState({ data: { ...response, pairs } }));
    renderWithProviders(<MarketDerivativesPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Perpetual' }));

    const visibleSymbols = () => screen.getAllByText(/\/USDT$/).map((node) => node.textContent);
    expect(visibleSymbols()).toEqual(['ETH/USDT', 'BTC/USDT', 'SOL/USDT']);

    fireEvent.click(screen.getByRole('button', { name: 'Volume' }));
    expect(visibleSymbols()).toEqual(['BTC/USDT', 'SOL/USDT', 'ETH/USDT']);

    fireEvent.click(screen.getByRole('button', { name: 'Funding' }));
    expect(visibleSymbols()).toEqual(['ETH/USDT', 'SOL/USDT', 'BTC/USDT']);

    fireEvent.click(screen.getByRole('button', { name: 'Thay đổi' }));
    expect(visibleSymbols()).toEqual(['SOL/USDT', 'BTC/USDT', 'ETH/USDT']);
    expect(screen.getByText('-5.00%')).toHaveStyle({ color: '#EF4444' });

    fireEvent.click(screen.getByRole('button', { name: 'Thanh lý' }));
    expect(visibleSymbols()).toEqual(['ETH/USDT', 'SOL/USDT', 'BTC/USDT']);
  });

  it('shows the empty state on every tab when pairs and history are absent', () => {
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
          pairs: [],
          liquidationHistory: [],
        },
      }),
    );
    renderWithProviders(<MarketDerivativesPage />);

    expect(screen.getByText('Không có dữ liệu Open Interest.')).toBeInTheDocument();
    expect(screen.getByText('Không có dữ liệu thanh lý theo thời gian.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Perpetual' }));
    expect(screen.getByText('Không có dữ liệu perpetual.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thanh lý' }));
    expect(screen.getByText('Không có dữ liệu thanh lý theo cặp.')).toBeInTheDocument();
    expect(screen.getByText('Long $0')).toBeInTheDocument();
    expect(screen.getByText('Short $0')).toBeInTheDocument();
  });

  it('renders zero-width bars for a non-empty liquidation bucket with no activity', () => {
    useMarketDerivativesQuery.mockReturnValue(
      queryState({
        data: {
          ...response,
          liquidationHistory: [{ bucketAt: '2026-09-26T08:00:00.000Z', long: 0, short: 0 }],
        },
      }),
    );
    const { container } = renderWithProviders(<MarketDerivativesPage />);

    expect(
      Array.from(
        container.querySelectorAll('time + div > div'),
        (bar) => (bar as HTMLElement).style.width,
      ),
    ).toEqual(['0%', '0%']);
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
