import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { MarketCorrelationPairsPage } from './MarketCorrelationPairsPage';
import type { MarketCorrelationsResponse } from '../model/market-types';

const { useMarketCorrelationsQuery } = vi.hoisted(() => ({
  useMarketCorrelationsQuery: vi.fn(),
}));

vi.mock('@/features/market', () => ({ useMarketCorrelationsQuery }));

const response: MarketCorrelationsResponse = {
  window: '7d',
  method: 'pearson',
  provider: 'Market Source',
  items: [
    { assetA: 'BTC', assetB: 'ETH', coefficient: 0.82, observations: 168 },
    { assetA: 'BTC', assetB: 'SOL', coefficient: -0.24, observations: 168 },
  ],
  updatedAt: '2026-09-26T08:00:00.000Z',
};

function queryState(overrides: Record<string, unknown> = {}) {
  return {
    data: response,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe('MarketCorrelationPairsPage', () => {
  beforeEach(() => {
    useMarketCorrelationsQuery.mockReset();
  });

  it('shows loading and lets the user retry after a source failure', () => {
    useMarketCorrelationsQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<MarketCorrelationPairsPage />);
    expect(screen.getByText('Đang tải dữ liệu tương quan…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketCorrelationsQuery.mockReturnValue(
      queryState({ data: undefined, isError: true, refetch }),
    );
    rerender(<MarketCorrelationPairsPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders provider, methodology, sample counts and signed coefficients', () => {
    useMarketCorrelationsQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketCorrelationPairsPage />);

    expect(screen.getByText(/Market Source · pearson/)).toBeInTheDocument();
    expect(screen.getByText(/Cùng chiều/)).toHaveTextContent('168 quan sát');
    expect(screen.getByLabelText('Hệ số tương quan BTC và SOL')).toHaveTextContent('-0.24');
    expect(screen.getByText(/không phải dự báo giá/)).toBeInTheDocument();
  });

  it('requests the selected period and sorts toward negative coefficients', () => {
    useMarketCorrelationsQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketCorrelationPairsPage />);

    fireEvent.click(screen.getByRole('button', { name: '30d' }));
    expect(useMarketCorrelationsQuery).toHaveBeenLastCalledWith({ window: '30d' });
    fireEvent.click(screen.getByRole('button', { name: 'Âm nhất' }));
    expect(screen.getAllByLabelText(/^Hệ số tương quan/)[0]).toHaveTextContent('-0.24');
  });

  it('shows an explicit empty state', () => {
    useMarketCorrelationsQuery.mockReturnValue(queryState({ data: { ...response, items: [] } }));
    renderWithProviders(<MarketCorrelationPairsPage />);
    expect(
      screen.getByText('Chưa có hệ số tương quan cho khoảng thời gian này.'),
    ).toBeInTheDocument();
  });
});
