import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { MarketSignalsResponse } from '../model/market-types';
import { MarketSignalsPage } from './MarketSignalsPage';

const { useMarketSignalsQuery } = vi.hoisted(() => ({ useMarketSignalsQuery: vi.fn() }));

vi.mock('@/features/market', () => ({ useMarketSignalsQuery }));

const response: MarketSignalsResponse = {
  provider: 'Signals Aggregator',
  updatedAt: '2026-09-26T08:00:00.000Z',
  items: [
    {
      id: 'signal-1',
      providerName: 'Provider A',
      symbol: 'BTC/USDT',
      direction: 'long',
      category: 'swing',
      status: 'active',
      publishedAt: '2026-09-26T07:00:00.000Z',
      expiresAt: '2026-10-01T07:00:00.000Z',
      rationale: 'Source-published market context.',
      sourceUrl: 'https://signals.example.com/1',
    },
    {
      id: 'signal-2',
      providerName: 'Provider B',
      symbol: 'ETH/USDT',
      direction: 'short',
      category: 'scalp',
      status: 'closed',
      publishedAt: '2026-09-25T07:00:00.000Z',
      rationale: 'Another source-published note.',
      sourceUrl: 'https://signals.example.com/2',
    },
  ],
};

function queryState(overrides: Record<string, unknown> = {}) {
  return { data: response, isPending: false, isError: false, refetch: vi.fn(), ...overrides };
}

describe('MarketSignalsPage', () => {
  beforeEach(() => useMarketSignalsQuery.mockReset());

  it('shows loading and retries an unavailable source', () => {
    useMarketSignalsQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<MarketSignalsPage />);
    expect(screen.getByText('Đang tải tín hiệu…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketSignalsQuery.mockReturnValue(queryState({ data: undefined, isError: true, refetch }));
    rerender(<MarketSignalsPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders source-attributed signals without an execution action', () => {
    useMarketSignalsQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketSignalsPage />);

    expect(screen.getByText(/Signals Aggregator/)).toBeInTheDocument();
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('Provider A · swing')).toBeInTheDocument();
    expect(screen.getByText(/không tạo lệnh giao dịch/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Xem nguồn' })[0]).toHaveAttribute(
      'href',
      'https://signals.example.com/1',
    );
    expect(screen.queryByRole('button', { name: /copy|trade|giao dịch/i })).not.toBeInTheDocument();
  });

  it('filters by source-reported status and category and reports empty results', () => {
    useMarketSignalsQuery.mockReturnValue(queryState());
    const { rerender } = renderWithProviders(<MarketSignalsPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Đã đóng' }));
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.queryByText('BTC/USDT')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Swing' }));
    expect(screen.getByText('Không có tín hiệu phù hợp bộ lọc.')).toBeInTheDocument();

    useMarketSignalsQuery.mockReturnValue(queryState({ data: { ...response, items: [] } }));
    rerender(<MarketSignalsPage />);
    expect(screen.getByText('Nguồn chưa cung cấp tín hiệu.')).toBeInTheDocument();
  });
});
