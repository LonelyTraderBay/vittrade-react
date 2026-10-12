import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { MarketPriceAlertsPage } from './MarketPriceAlertsPage';

const marketHooks = vi.hoisted(() => ({
  useMarketPairsQuery: vi.fn(),
  useMarketPriceAlertsQuery: vi.fn(),
  useMarketPriceAlertCreateMutation: vi.fn(),
  useMarketPriceAlertUpdateMutation: vi.fn(),
  useMarketPriceAlertDeleteMutation: vi.fn(),
}));

vi.mock('@/features/market', () => marketHooks);

describe('Market price-alert page defensive query state', () => {
  beforeEach(() => {
    marketHooks.useMarketPairsQuery.mockReturnValue({
      data: { items: [] },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    marketHooks.useMarketPriceAlertsQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    marketHooks.useMarketPriceAlertCreateMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isError: false,
      isPending: false,
    });
    marketHooks.useMarketPriceAlertUpdateMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isError: false,
      isPending: false,
    });
    marketHooks.useMarketPriceAlertDeleteMutation.mockReturnValue({
      mutateAsync: vi.fn(),
      isError: false,
      isPending: false,
    });
  });

  it('renders the empty state when a successful query has no cached payload', () => {
    renderWithProviders(<MarketPriceAlertsPage />);

    expect(screen.getByText('Chưa có cảnh báo phù hợp.')).toBeInTheDocument();
    expect(screen.getByText('Tổng')).toBeInTheDocument();
  });
});
