import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { MarketSentimentResponse } from '../model/market-types';
import { MarketSentimentPage } from './MarketSentimentPage';

const { useMarketSentimentQuery } = vi.hoisted(() => ({
  useMarketSentimentQuery: vi.fn(),
}));

vi.mock('@/features/market', () => ({ useMarketSentimentQuery }));

const response: MarketSentimentResponse = {
  window: '24h',
  provider: 'Sentiment Source',
  updatedAt: '2026-09-26T08:00:00.000Z',
  overall: {
    score: 32,
    sentiment: 'bullish',
    totalMentions24h: 1200,
    mentionsChange24h: 12.5,
    trendingTokenCount: 4,
    socialDominance: { btcPercent: 40, ethPercent: 20, otherPercent: 40 },
  },
  timeline: [
    { at: '2026-09-25T08:00:00.000Z', score: 25, mentions: 1000 },
    { at: '2026-09-26T08:00:00.000Z', score: 32, mentions: 1200 },
  ],
  tokens: [
    {
      id: 'btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      score: 48,
      sentiment: 'bullish',
      mentions24h: 700,
      mentionsChange24h: 8.2,
      sentimentSharePercent: { bullish: 60, neutral: 25, bearish: 15 },
      trendingRank: 1,
      topTopics: ['ETF flows'],
    },
    {
      id: 'eth',
      symbol: 'ETH',
      name: 'Ethereum',
      score: -12,
      sentiment: 'bearish',
      mentions24h: 500,
      mentionsChange24h: -3.4,
      sentimentSharePercent: { bullish: 30, neutral: 20, bearish: 50 },
      topTopics: ['L2 growth'],
    },
  ],
  trendingTopics: [
    { topic: 'ETF flows', mentions24h: 340, change24h: 21.2 },
    { topic: 'L2 growth', mentions24h: 210, change24h: -2.1 },
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

describe('MarketSentimentPage', () => {
  beforeEach(() => {
    useMarketSentimentQuery.mockReset();
  });

  it('shows loading and retry after the data source is unavailable', () => {
    useMarketSentimentQuery.mockReturnValue(queryState({ isPending: true }));
    const { rerender } = renderWithProviders(<MarketSentimentPage />);
    expect(screen.getByText('Đang tải dữ liệu tâm lý…')).toBeInTheDocument();

    const refetch = vi.fn();
    useMarketSentimentQuery.mockReturnValue(
      queryState({ data: undefined, isError: true, refetch }),
    );
    rerender(<MarketSentimentPage />);
    fireEvent.click(screen.getByRole('button', { name: /thử lại|retry/i }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('renders the source score, update time and aggregate shares', () => {
    useMarketSentimentQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketSentimentPage />);

    expect(screen.getByText(/Sentiment Source/)).toBeInTheDocument();
    expect(screen.getByText('Chỉ số tâm lý chung')).toBeInTheDocument();
    expect(screen.getByText('+32')).toBeInTheDocument();
    expect(screen.getByText('BTC 40%')).toBeInTheDocument();
    expect(screen.getAllByText('Token trending').length).toBeGreaterThan(0);
  });

  it('passes the selected window and shows source-provided token distributions', () => {
    useMarketSentimentQuery.mockReturnValue(queryState());
    renderWithProviders(<MarketSentimentPage />);

    fireEvent.click(screen.getByRole('button', { name: '7d' }));
    expect(useMarketSentimentQuery).toHaveBeenLastCalledWith({ window: '7d' });
    fireEvent.click(screen.getByRole('button', { name: 'Theo token' }));

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText(/Tích cực 60%/)).toBeInTheDocument();
    expect(screen.getByText(/Tiêu cực 50%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Trending' }));
    expect(screen.getByRole('button', { name: 'Trending' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders source-provided topics and handles empty trend data', () => {
    useMarketSentimentQuery.mockReturnValue(queryState());
    const { rerender } = renderWithProviders(<MarketSentimentPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Xu hướng' }));
    expect(screen.getByText('#ETF flows')).toBeInTheDocument();

    useMarketSentimentQuery.mockReturnValue(
      queryState({ data: { ...response, trendingTopics: [], tokens: [] } }),
    );
    rerender(<MarketSentimentPage />);
    expect(screen.getByText('Không có chủ đề trending.')).toBeInTheDocument();
    expect(screen.getByText('Không có dữ liệu theo token.')).toBeInTheDocument();
  });

  it('renders empty history, token, topic, heatmap and mention states for empty response arrays', () => {
    useMarketSentimentQuery.mockReturnValue(
      queryState({ data: { ...response, timeline: [], tokens: [], trendingTopics: [] } }),
    );
    renderWithProviders(<MarketSentimentPage />);

    expect(screen.getByText('Không có dữ liệu lịch sử.')).toBeInTheDocument();
    expect(screen.getByText('Không có token trending.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Theo token' }));
    expect(screen.getByText('Không có dữ liệu sentiment theo token.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Xu hướng' }));
    expect(screen.getByText('Không có chủ đề trending.')).toBeInTheDocument();
    expect(screen.getByText('Không có dữ liệu theo token.')).toBeInTheDocument();
    expect(screen.getByText('Không có dữ liệu lượt đề cập.')).toBeInTheDocument();
  });

  it('covers supported timeline bands, optional ranks and each token sort order', () => {
    const data: MarketSentimentResponse = {
      ...response,
      overall: { ...response.overall, score: -32, sentiment: 'bearish' },
      timeline: [
        { at: '2026-09-24T08:00:00.000Z', score: 20, mentions: 900 },
        { at: '2026-09-25T08:00:00.000Z', score: -20, mentions: 700 },
        { at: '2026-09-26T08:00:00.000Z', score: 0, mentions: 500 },
      ],
      tokens: [
        {
          ...response.tokens[1],
          id: 'ada',
          symbol: 'ADA',
          name: 'Cardano',
          mentions24h: 1500,
          mentionsChange24h: 0,
          trendingRank: undefined,
        },
        { ...response.tokens[0], mentionsChange24h: 0, trendingRank: 2 },
        {
          ...response.tokens[1],
          id: 'xrp',
          symbol: 'XRP',
          name: 'Ripple',
          mentions24h: 1100,
          mentionsChange24h: 0,
          trendingRank: undefined,
        },
        { ...response.tokens[1], mentionsChange24h: 0, trendingRank: 1 },
        {
          ...response.tokens[0],
          id: 'sol',
          symbol: 'SOL',
          name: 'Solana',
          score: 0,
          sentiment: 'neutral',
          mentions24h: 900,
          mentionsChange24h: 0,
          trendingRank: 3,
          topTopics: [],
        },
      ],
    };
    useMarketSentimentQuery.mockReturnValue(queryState({ data }));
    renderWithProviders(<MarketSentimentPage />);

    expect(screen.getByText('-32')).toBeInTheDocument();
    expect(screen.getByText('-20')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Theo token' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mentions' }));
    expect(
      screen
        .getAllByText(/^(Cardano|Ripple|Bitcoin|Ethereum|Solana)$/)
        .map((node) => node.textContent),
    ).toEqual(['Cardano', 'Ripple', 'Solana', 'Bitcoin', 'Ethereum']);

    fireEvent.click(screen.getByRole('button', { name: 'Trending' }));
    expect(
      screen
        .getAllByText(/^(Ethereum|Bitcoin|Solana|Cardano|Ripple)$/)
        .map((node) => node.textContent),
    ).toEqual(['Ethereum', 'Bitcoin', 'Solana', 'Cardano', 'Ripple']);
    expect(screen.getByText('Cardano')).not.toHaveTextContent('#');
    expect(screen.getByText('Solana')).not.toHaveTextContent('#');

    fireEvent.click(screen.getByRole('button', { name: 'Xu hướng' }));
    expect(screen.getAllByText('0.0%')).toHaveLength(data.tokens.length);
  });
});
