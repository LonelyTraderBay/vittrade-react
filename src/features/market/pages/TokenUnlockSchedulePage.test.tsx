import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { TokenUnlockSchedulePage } from './TokenUnlockSchedulePage';
import type { MarketTokenUnlocksResponse } from '../model/market-types';

const { useMarketTokenUnlocksQuery } = vi.hoisted(() => ({
  useMarketTokenUnlocksQuery: vi.fn(),
}));

vi.mock('@/features/market', () => ({ useMarketTokenUnlocksQuery }));

const response: MarketTokenUnlocksResponse = {
  window: '30d',
  provider: 'Unlock Source',
  items: [
    {
      id: 'unlock-1',
      symbol: 'ARB',
      name: 'Arbitrum',
      eventAt: '2026-10-01T08:00:00.000Z',
      amount: 92_650_000,
      circulatingSupplyPercent: 2.8,
      category: 'investor',
      scheduleType: 'cliff',
      status: 'confirmed',
      sourceUrl: 'https://unlock.example.com/arb',
    },
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

describe('TokenUnlockSchedulePage', () => {
  beforeEach(() => {
    useMarketTokenUnlocksQuery.mockReset();
  });

  it('shows loading and offers retry after an unavailable source', () => {
    useMarketTokenUnlocksQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<TokenUnlockSchedulePage />);
    expect(screen.getByText('Đang tải lịch mở khóa…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketTokenUnlocksQuery.mockReturnValue(
      queryState({ data: undefined, isError: true, refetch }),
    );
    rerender(<TokenUnlockSchedulePage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders only source-reported amount, circulating share and status', () => {
    useMarketTokenUnlocksQuery.mockReturnValue(queryState());
    renderWithProviders(<TokenUnlockSchedulePage />);

    expect(screen.getByText('Arbitrum')).toBeInTheDocument();
    expect(screen.getByText('92,650,000 ARB')).toBeInTheDocument();
    expect(screen.getByText('2.80% nguồn cung lưu hành')).toBeInTheDocument();
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nguồn/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.queryByText(/\$120/)).not.toBeInTheDocument();
  });

  it('passes the selected window and category to the query hook', () => {
    useMarketTokenUnlocksQuery.mockReturnValue(queryState());
    renderWithProviders(<TokenUnlockSchedulePage />);

    fireEvent.click(screen.getByRole('button', { name: '90d' }));
    expect(useMarketTokenUnlocksQuery).toHaveBeenLastCalledWith({ window: '90d' });
    fireEvent.click(screen.getByRole('button', { name: 'Nhà đầu tư' }));
    expect(useMarketTokenUnlocksQuery).toHaveBeenLastCalledWith({
      window: '90d',
      category: 'investor',
    });
  });

  it('shows an empty result state', () => {
    useMarketTokenUnlocksQuery.mockReturnValue(queryState({ data: { ...response, items: [] } }));
    renderWithProviders(<TokenUnlockSchedulePage />);
    expect(screen.getByText('Không có sự kiện mở khóa phù hợp.')).toBeInTheDocument();
  });
});
