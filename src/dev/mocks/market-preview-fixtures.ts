import type {
  MarketCalendarEvent,
  MarketCalendarResponse,
  MarketCorrelationsResponse,
  MarketDerivativesResponse,
  MarketNewsItem,
  MarketNewsResponse,
  MarketSentimentResponse,
  MarketSignalsResponse,
  MarketTokenUnlock,
  MarketTokenUnlocksResponse,
} from '@/features/market/model/market-types';

const previewProvider = 'VitTrade demo preview';
const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

function queryEnum<const T extends readonly string[]>(
  value: string | null,
  allowed: T,
  fallback: T[number],
): T[number] {
  return allowed.find((item) => item === value) ?? fallback;
}

function isoAt(nowMs: number, offsetMs = 0): string {
  return new Date(nowMs + offsetMs).toISOString();
}

function newsItems(nowMs: number): MarketNewsItem[] {
  return [
    {
      id: 'preview-market-btc-volume',
      title: 'Khối lượng BTC tăng trong dữ liệu xem trước',
      summary: 'Bản ghi minh họa để kiểm tra thẻ tin, bộ lọc và liên kết cặp giao dịch.',
      category: 'market',
      sentiment: 'bullish',
      source: previewProvider,
      articleUrl: 'https://example.invalid/preview/market-btc-volume',
      publishedAt: isoAt(nowMs, -hourMs),
      relatedPairs: [{ pairId: 'btcusdt', symbol: 'BTC/USDT' }],
      isBreaking: true,
    },
    {
      id: 'preview-macro-rates',
      title: 'Sự kiện vĩ mô mẫu cho bộ lọc tin',
      summary: 'Nội dung tổng hợp giả lập; không đại diện cho một nguồn tin hoặc thị trường thực.',
      category: 'macro',
      sentiment: 'neutral',
      source: previewProvider,
      articleUrl: 'https://example.invalid/preview/macro-rates',
      publishedAt: isoAt(nowMs, -2 * hourMs),
      relatedPairs: [],
      isBreaking: false,
    },
  ];
}

function calendarItems(nowMs: number): MarketCalendarEvent[] {
  return [
    {
      id: 'preview-event-eth-unlock',
      title: 'Lịch mở khóa ETH mẫu',
      type: 'unlock',
      eventAt: isoAt(nowMs, 2 * dayMs),
      symbol: 'ETH',
      impact: 'high',
      description: 'Sự kiện mẫu để kiểm tra phân loại và mức ảnh hưởng.',
      sourceUrl: 'https://example.invalid/preview/eth-unlock',
      confirmed: true,
    },
    {
      id: 'preview-event-sol-upgrade',
      title: 'Nâng cấp mạng SOL mẫu',
      type: 'upgrade',
      eventAt: isoAt(nowMs, 5 * dayMs),
      symbol: 'SOL',
      impact: 'medium',
      description: 'Dữ liệu trình diễn cục bộ, không phải lịch sự kiện thực.',
      sourceUrl: 'https://example.invalid/preview/sol-upgrade',
      confirmed: false,
    },
  ];
}

function unlockItems(nowMs: number): MarketTokenUnlock[] {
  return [
    {
      id: 'preview-unlock-eth-investor',
      symbol: 'ETH',
      name: 'Ethereum',
      eventAt: isoAt(nowMs, 3 * dayMs),
      amount: 125_000,
      circulatingSupplyPercent: 0.1,
      category: 'investor',
      scheduleType: 'cliff',
      status: 'confirmed',
      sourceUrl: 'https://example.invalid/preview/eth-investor-unlock',
    },
    {
      id: 'preview-unlock-sol-ecosystem',
      symbol: 'SOL',
      name: 'Solana',
      eventAt: isoAt(nowMs, 12 * dayMs),
      amount: 250_000,
      circulatingSupplyPercent: 0.2,
      category: 'ecosystem',
      scheduleType: 'linear',
      status: 'estimated',
      sourceUrl: 'https://example.invalid/preview/sol-ecosystem-unlock',
    },
  ];
}

function marketSuccessFixture(pathname: string, search: URLSearchParams, nowMs: number): unknown {
  const updatedAt = isoAt(nowMs);

  if (pathname.endsWith('/market/news')) {
    const category = search.get('category');
    const sentiment = search.get('sentiment');
    const limit = Math.max(1, Math.min(Number(search.get('limit')) || 50, 100));
    const items = newsItems(nowMs)
      .filter((item) => !category || item.category === category)
      .filter((item) => !sentiment || item.sentiment === sentiment)
      .slice(0, limit);
    return { items, updatedAt } satisfies MarketNewsResponse;
  }

  if (pathname.endsWith('/market/calendar')) {
    const type = search.get('type');
    const impact = search.get('impact');
    const items = calendarItems(nowMs)
      .filter((item) => !type || item.type === type)
      .filter((item) => !impact || item.impact === impact);
    return { items, updatedAt } satisfies MarketCalendarResponse;
  }

  if (pathname.endsWith('/market/correlations')) {
    const window = queryEnum(search.get('window'), ['7d', '30d', '90d'], '30d');
    return {
      window,
      method: 'pearson',
      provider: previewProvider,
      items: [
        { assetA: 'BTC', assetB: 'ETH', coefficient: 0.82, observations: 90 },
        { assetA: 'BTC', assetB: 'SOL', coefficient: 0.61, observations: 90 },
        { assetA: 'ETH', assetB: 'SOL', coefficient: 0.72, observations: 90 },
      ],
      updatedAt,
    } satisfies MarketCorrelationsResponse;
  }

  if (pathname.endsWith('/market/unlocks')) {
    const window = queryEnum(search.get('window'), ['7d', '30d', '90d'], '30d');
    const category = search.get('category');
    const items = unlockItems(nowMs).filter((item) => !category || item.category === category);
    return {
      window,
      provider: previewProvider,
      items,
      updatedAt,
    } satisfies MarketTokenUnlocksResponse;
  }

  if (pathname.endsWith('/market/derivatives')) {
    return {
      provider: previewProvider,
      updatedAt,
      stats: {
        totalOpenInterest: 42_500_000_000,
        openInterestChange24h: 2.4,
        totalVolume24h: 86_000_000_000,
        volumeChange24h: 4.8,
        totalLiquidations24h: 125_000_000,
        longLiquidations24h: 75_000_000,
        shortLiquidations24h: 50_000_000,
        averageFundingRate8h: 0.012,
        btcLongShortRatio: 1.08,
      },
      pairs: [
        {
          id: 'preview-btc-perpetual',
          symbol: 'BTCUSDT',
          name: 'BTC Perpetual',
          price: 62_500,
          change24h: 1.8,
          fundingRate: 0.012,
          openInterest: 24_000_000_000,
          openInterestChange24h: 1.2,
          volume24h: 38_000_000_000,
          longSharePercent: 51.8,
          liquidations24h: { long: 42_000_000, short: 31_000_000 },
        },
        {
          id: 'preview-eth-perpetual',
          symbol: 'ETHUSDT',
          name: 'ETH Perpetual',
          price: 3_400,
          change24h: -0.6,
          fundingRate: -0.004,
          openInterest: 12_000_000_000,
          openInterestChange24h: -0.8,
          volume24h: 22_000_000_000,
          longSharePercent: 48.5,
          liquidations24h: { long: 18_000_000, short: 14_000_000 },
        },
      ],
      liquidationHistory: [
        { bucketAt: isoAt(nowMs, -2 * hourMs), long: 8_000_000, short: 5_000_000 },
        { bucketAt: isoAt(nowMs, -hourMs), long: 12_000_000, short: 7_000_000 },
        { bucketAt: updatedAt, long: 9_000_000, short: 6_000_000 },
      ],
    } satisfies MarketDerivativesResponse;
  }

  if (pathname.endsWith('/market/sentiment')) {
    const window = queryEnum(search.get('window'), ['24h', '7d', '30d'], '24h');
    return {
      window,
      provider: previewProvider,
      updatedAt,
      overall: {
        score: 24,
        sentiment: 'bullish',
        totalMentions24h: 125_000,
        mentionsChange24h: 8.5,
        trendingTokenCount: 2,
        socialDominance: { btcPercent: 48, ethPercent: 31, otherPercent: 21 },
      },
      timeline: [
        { at: isoAt(nowMs, -2 * hourMs), score: 18, mentions: 4_200 },
        { at: isoAt(nowMs, -hourMs), score: 21, mentions: 4_800 },
        { at: updatedAt, score: 24, mentions: 5_100 },
      ],
      tokens: [
        {
          id: 'preview-btc-sentiment',
          symbol: 'BTC',
          name: 'Bitcoin',
          score: 31,
          sentiment: 'bullish',
          mentions24h: 58_000,
          mentionsChange24h: 12,
          sentimentSharePercent: { bullish: 55, neutral: 28, bearish: 17 },
          trendingRank: 1,
          topTopics: ['ETF', 'on-chain'],
        },
        {
          id: 'preview-eth-sentiment',
          symbol: 'ETH',
          name: 'Ethereum',
          score: 8,
          sentiment: 'neutral',
          mentions24h: 32_000,
          mentionsChange24h: 2,
          sentimentSharePercent: { bullish: 39, neutral: 42, bearish: 19 },
          trendingRank: 2,
          topTopics: ['staking', 'layer-2'],
        },
      ],
      trendingTopics: [
        { topic: 'ETF', mentions24h: 18_000, change24h: 14 },
        { topic: 'layer-2', mentions24h: 9_500, change24h: 6 },
      ],
    } satisfies MarketSentimentResponse;
  }

  if (pathname.endsWith('/market/signals')) {
    return {
      provider: previewProvider,
      updatedAt,
      items: [
        {
          id: 'preview-signal-btc-swing',
          providerName: previewProvider,
          symbol: 'BTC/USDT',
          direction: 'long',
          category: 'swing',
          status: 'active',
          publishedAt: isoAt(nowMs, -15 * 60 * 1000),
          expiresAt: isoAt(nowMs, 6 * hourMs),
          rationale: 'Tín hiệu giả lập để kiểm tra giao diện; không tạo lệnh.',
          sourceUrl: 'https://example.invalid/preview/btc-signal',
        },
        {
          id: 'preview-signal-eth-closed',
          providerName: previewProvider,
          symbol: 'ETH/USDT',
          direction: 'short',
          category: 'position',
          status: 'closed',
          publishedAt: isoAt(nowMs, -4 * hourMs),
          expiresAt: isoAt(nowMs, -hourMs),
          rationale: 'Bản ghi mẫu đã đóng để kiểm tra bộ lọc trạng thái.',
          sourceUrl: 'https://example.invalid/preview/eth-signal',
        },
      ],
    } satisfies MarketSignalsResponse;
  }

  return undefined;
}

export function getMarketSuccessPreviewFixture(
  request: Request,
  nowMs: number,
): unknown | undefined {
  const url = new URL(request.url);
  if (request.method !== 'GET') return undefined;
  return marketSuccessFixture(url.pathname, url.searchParams, nowMs);
}
