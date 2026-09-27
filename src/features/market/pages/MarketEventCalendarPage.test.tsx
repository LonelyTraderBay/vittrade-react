import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { MarketEventCalendarPage } from './MarketEventCalendarPage';
import type { MarketCalendarResponse } from '../model/market-types';

const { useMarketCalendarQuery } = vi.hoisted(() => ({ useMarketCalendarQuery: vi.fn() }));

vi.mock('@/features/market', () => ({ useMarketCalendarQuery }));

const response: MarketCalendarResponse = {
  items: [
    {
      id: 'event-1',
      title: 'Token unlock schedule',
      type: 'unlock',
      eventAt: '2026-10-01T08:00:00.000Z',
      symbol: 'ABC',
      impact: 'high',
      description: 'An upcoming token unlock event.',
      sourceUrl: 'https://events.example.com/unlock',
      confirmed: true,
    },
  ],
  updatedAt: '2026-09-26T08:01:00.000Z',
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

describe('MarketEventCalendarPage', () => {
  beforeEach(() => {
    useMarketCalendarQuery.mockReset();
  });

  it('shows a loading state and retries after an unavailable source', () => {
    useMarketCalendarQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<MarketEventCalendarPage />);
    expect(screen.getByText('Đang tải lịch sự kiện…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketCalendarQuery.mockReturnValue(queryState({ data: undefined, isError: true, refetch }));
    rerender(<MarketEventCalendarPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders only contract fields and links to the provided source', () => {
    useMarketCalendarQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketEventCalendarPage />);

    expect(screen.getByRole('heading', { name: response.items[0].title })).toBeInTheDocument();
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nguồn/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    expect(screen.queryByText('92.65M ARB')).not.toBeInTheDocument();
  });

  it('passes selected event type and impact to the query', () => {
    useMarketCalendarQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketEventCalendarPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Mở khóa' }));
    expect(useMarketCalendarQuery).toHaveBeenLastCalledWith({ type: 'unlock' });
    fireEvent.click(screen.getByRole('button', { name: 'Cao' }));
    expect(useMarketCalendarQuery).toHaveBeenLastCalledWith({ type: 'unlock', impact: 'high' });
  });

  it('renders the empty state when the source has no matching events', () => {
    useMarketCalendarQuery.mockReturnValue(
      queryState({ data: { items: [], updatedAt: response.updatedAt } }),
    );
    renderWithProviders(<MarketEventCalendarPage />);
    expect(screen.getByText('Không có sự kiện phù hợp.')).toBeInTheDocument();
  });
});
