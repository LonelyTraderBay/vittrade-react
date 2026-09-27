import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { MarketNewsFeedPage } from './MarketNewsFeedPage';
import type { MarketNewsResponse } from '../model/market-types';

const { useMarketNewsQuery } = vi.hoisted(() => ({ useMarketNewsQuery: vi.fn() }));

vi.mock('@/features/market', () => ({ useMarketNewsQuery }));

const response: MarketNewsResponse = {
  items: [
    {
      id: 'news-1',
      title: 'Thông tin thị trường mới',
      summary: 'Tóm tắt từ nguồn tin đã xác thực.',
      category: 'market',
      sentiment: 'bullish',
      source: 'Market Source',
      articleUrl: 'https://news.example.com/article',
      publishedAt: '2026-09-26T08:00:00.000Z',
      relatedPairs: [{ pairId: 'btc-usdt', symbol: 'BTC/USDT' }],
      isBreaking: true,
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

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="route-location">{location.pathname}</output>;
}

describe('MarketNewsFeedPage', () => {
  beforeEach(() => {
    useMarketNewsQuery.mockReset();
  });

  it('shows loading and offers retry after a request failure', () => {
    useMarketNewsQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<MarketNewsFeedPage />);
    expect(screen.getByText('Đang tải tin thị trường…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketNewsQuery.mockReturnValue(queryState({ data: undefined, isError: true, refetch }));
    rerender(<MarketNewsFeedPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders contracted source data and opens related market pairs', () => {
    useMarketNewsQuery.mockReturnValue(queryState());
    renderWithProviders(
      <>
        <MarketNewsFeedPage />
        <LocationProbe />
      </>,
    );

    expect(screen.getByRole('heading', { name: response.items[0].title })).toBeInTheDocument();
    expect(screen.getByText(response.items[0].summary)).toBeInTheDocument();
    expect(screen.getByText('NÓNG')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /nguồn/i })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
    fireEvent.click(screen.getByRole('button', { name: 'BTC/USDT' }));
    expect(screen.getByTestId('route-location')).toHaveTextContent('/pair/btc-usdt');
  });

  it('sends selected category and sentiment through the query hook', () => {
    useMarketNewsQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketNewsFeedPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Pháp lý' }));
    expect(useMarketNewsQuery).toHaveBeenLastCalledWith({ category: 'regulation', limit: 50 });

    fireEvent.click(screen.getByRole('button', { name: 'Tiêu cực' }));
    expect(useMarketNewsQuery).toHaveBeenLastCalledWith({
      category: 'regulation',
      sentiment: 'bearish',
      limit: 50,
    });
  });

  it('handles empty results and refresh state', () => {
    const refetch = vi.fn();
    useMarketNewsQuery.mockReturnValue(
      queryState({ data: { items: [], updatedAt: response.updatedAt }, refetch, isFetching: true }),
    );
    renderWithProviders(<MarketNewsFeedPage />);

    expect(screen.getByText('Chưa có tin phù hợp.')).toBeInTheDocument();
    const refresh = screen.getByRole('button', { name: 'Làm mới tin thị trường' });
    expect(refresh).toBeDisabled();
    fireEvent.click(refresh);
    expect(refetch).not.toHaveBeenCalled();
  });
});
