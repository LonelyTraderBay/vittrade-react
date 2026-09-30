import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ApiError } from '@/shared/api/api-error';
import { marketApi } from './market-api';

const server = setupServer();

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  prevPrice: 64_000,
  change24h: 1.56,
  high24h: 66_000,
  low24h: 63_000,
  volume24h: 1_000_000,
  marketCap: 1_200_000_000,
  sparklineData: [64_000, 64_500, 65_000],
  logoColor: '#F7931A',
  isFavorite: false,
  category: 'Layer 1',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('market API contract', () => {
  it('loads and validates the market pair response through the shared HTTP client', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [pair], nextCursor: 'next-page' }),
      ),
    );

    const marketPair = Object.fromEntries(
      Object.entries(pair).filter(([key]) => key !== 'isFavorite'),
    );
    await expect(marketApi.listPairs({ category: 'Layer 1', limit: 20 })).resolves.toEqual({
      items: [marketPair],
      nextCursor: 'next-page',
    });
  });

  it('does not treat a legacy public-market favorite flag as watchlist state', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [{ ...pair, isFavorite: true }] }),
      ),
    );

    const result = await marketApi.listPairs();

    expect(result.items[0]).not.toHaveProperty('isFavorite');
  });

  it('maps backend errors to ApiError with a request ID', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs/btc-usdt', () =>
        HttpResponse.json(
          { code: 'MARKET_UNAVAILABLE', message: 'Market temporarily unavailable' },
          { status: 503, headers: { 'X-Request-ID': 'market-request-1' } },
        ),
      ),
    );

    const error = await marketApi.getPair('btc-usdt').catch((value: unknown) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      code: 'MARKET_UNAVAILABLE',
      requestId: 'market-request-1',
    });
  });

  it('rejects a response that violates the contract', async () => {
    server.use(
      http.get('http://localhost:3000/api/market/pairs', () =>
        HttpResponse.json({ items: [{ ...pair, price: '65000' }] }),
      ),
    );

    await expect(marketApi.listPairs()).rejects.toThrow();
  });

  it('loads and mutates the user watchlist with idempotency keys', async () => {
    const item = { id: 'watch-1', pairId: 'btc-usdt', addedAt: '2026-09-21T10:00:00.000Z' };
    server.use(
      http.get('http://localhost:3000/api/market/watchlist', () =>
        HttpResponse.json({ items: [item] }),
      ),
      http.patch('http://localhost:3000/api/market/watchlist/watch-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('watchlist-key-001');
        return HttpResponse.json({ ...item, note: 'Theo dõi vùng hỗ trợ' });
      }),
      http.delete('http://localhost:3000/api/market/watchlist/watch-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('watchlist-key-002');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(marketApi.getWatchlist()).resolves.toEqual({ items: [item] });
    await expect(
      marketApi.updateWatchlistItem(
        'watch-1',
        { note: 'Theo dõi vùng hỗ trợ' },
        'watchlist-key-001',
      ),
    ).resolves.toMatchObject({ note: 'Theo dõi vùng hỗ trợ' });
    await expect(
      marketApi.deleteWatchlistItem('watch-1', 'watchlist-key-002'),
    ).resolves.toBeUndefined();
  });

  it('creates a watchlist item with an idempotency key', async () => {
    const item = { id: 'watch-2', pairId: 'btc-usdt', addedAt: '2026-09-21T10:00:00.000Z' };
    server.use(
      http.post('http://localhost:3000/api/market/watchlist', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('watchlist-key-003');
        expect(await request.json()).toEqual({ pairId: 'btc-usdt' });
        return HttpResponse.json(item, { status: 201 });
      }),
    );

    await expect(
      marketApi.createWatchlistItem({ pairId: 'btc-usdt' }, 'watchlist-key-003'),
    ).resolves.toEqual(item);
  });

  it('loads typed order book and recent trades for a pair', async () => {
    const orderBook = {
      bids: [{ price: 64_999, amount: 0.1, total: 6_499.9, depth: 0.5 }],
      asks: [{ price: 65_001, amount: 0.08, total: 5_200.08, depth: 0.5 }],
      updatedAt: '2026-09-21T10:00:00.000Z',
    };
    const trades = {
      items: [
        {
          id: 'trade-1',
          price: 65_000,
          amount: 0.02,
          side: 'buy',
          time: '2026-09-21T10:00:00.000Z',
        },
      ],
    };
    server.use(
      http.get('http://localhost:3000/api/market/pairs/btc-usdt/orderbook', () =>
        HttpResponse.json(orderBook),
      ),
      http.get('http://localhost:3000/api/market/pairs/btc-usdt/trades', () =>
        HttpResponse.json(trades),
      ),
    );

    await expect(marketApi.getOrderBook('btc-usdt')).resolves.toEqual(orderBook);
    await expect(marketApi.getRecentTrades('btc-usdt')).resolves.toEqual(trades);
  });

  it('loads and validates OHLCV candles through the market contract', async () => {
    const candles = {
      items: [
        {
          time: 1_758_442_800,
          open: 64_900,
          high: 65_100,
          low: 64_800,
          close: 65_000,
          volume: 12_345.67,
        },
      ],
      updatedAt: '2026-09-21T10:00:00.000Z',
    };
    server.use(
      http.get('http://localhost:3000/api/market/pairs/btc-usdt/candles', ({ request }) => {
        expect(new URL(request.url).searchParams.get('interval')).toBe('1h');
        expect(new URL(request.url).searchParams.get('limit')).toBe('24');
        return HttpResponse.json(candles);
      }),
    );

    await expect(marketApi.getCandles('btc-usdt', { interval: '1h', limit: 24 })).resolves.toEqual(
      candles,
    );
  });

  it('rejects OHLCV candles with an invalid price envelope or unordered timestamps', async () => {
    let response = {
      items: [
        {
          time: 1_758_442_800,
          open: 64_900,
          high: 64_950,
          low: 64_800,
          close: 65_000,
          volume: 12_345.67,
        },
      ],
      updatedAt: '2026-09-21T10:00:00.000Z',
    };
    server.use(
      http.get('http://localhost:3000/api/market/pairs/btc-usdt/candles', () =>
        HttpResponse.json(response),
      ),
    );

    await expect(marketApi.getCandles('btc-usdt', { interval: '1h' })).rejects.toThrow();

    response = {
      items: [
        {
          time: 1_758_442_800,
          open: 64_900,
          high: 65_100,
          low: 64_800,
          close: 65_000,
          volume: 12_345.67,
        },
        {
          time: 1_758_439_200,
          open: 64_800,
          high: 65_000,
          low: 64_700,
          close: 64_900,
          volume: 10_000,
        },
      ],
      updatedAt: '2026-09-21T10:00:00.000Z',
    };

    await expect(marketApi.getCandles('btc-usdt', { interval: '1h' })).rejects.toThrow();
  });

  it('loads and validates the aggregated market overview contract', async () => {
    const overview = {
      stats: {
        totalMarketCap: 2_000_000,
        totalMarketCapChange24h: 1.2,
        total24hVolume: 500_000,
        total24hVolumeChange: -0.4,
        btcDominance: 52.1,
        ethDominance: 18.4,
        totalCoins: 120,
        totalExchanges: 30,
        fearGreedIndex: 62,
        fearGreedLabel: 'Greed',
        activeCryptocurrencies: 100,
        defiTVL: 80_000,
        defiTVLChange24h: 0.7,
        stablecoinVolume24h: 200_000,
      },
      breadth: { advancing: 60, declining: 30, unchanged: 10, newATH: 2, dropping10Pct: 1 },
      fearGreedHistory: [{ date: 'today', value: 62, label: 'Greed' }],
      sectors: [
        {
          id: 'layer1',
          name: 'Layer 1',
          nameVi: 'Layer 1',
          color: '#3B82F6',
          icon: 'L1',
          totalMarketCap: 1_000_000,
          change24h: 2.4,
          change7d: 4.1,
          change30d: 8.2,
          volume24h: 250_000,
          topCoins: ['BTC'],
          coinCount: 10,
          dominance: 50,
        },
      ],
      topGainers: [],
      topLosers: [],
      updatedAt: '2026-09-21T10:00:00.000Z',
    };
    server.use(
      http.get('http://localhost:3000/api/market/overview', () => HttpResponse.json(overview)),
    );

    await expect(marketApi.getOverview()).resolves.toEqual(overview);
  });

  it('sends typed mover filters and validates the filtered response', async () => {
    const mover = {
      id: 'sol',
      symbol: 'SOL',
      name: 'Solana',
      price: 178.32,
      change1h: 1.2,
      change24h: 8.07,
      change7d: 12.34,
      volume24h: 3_456_789_000,
      volumeChange24h: 45.2,
      marketCap: 78_456_789_000,
      category: 'Layer 1',
      color: '#9945FF',
      sparkline: [165, 168, 170, 172, 175, 178],
    };
    server.use(
      http.get('http://localhost:3000/api/market/movers', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('view')).toBe('gainers');
        expect(url.searchParams.get('timeframe')).toBe('24h');
        expect(url.searchParams.get('category')).toBe('Layer 1');
        return HttpResponse.json({ items: [mover], updatedAt: '2026-09-21T10:00:00.000Z' });
      }),
    );

    await expect(
      marketApi.getMovers({ view: 'gainers', timeframe: '24h', category: 'Layer 1' }),
    ).resolves.toEqual({ items: [mover], updatedAt: '2026-09-21T10:00:00.000Z' });
  });

  it('loads filtered market news and rejects non-HTTPS article links', async () => {
    const item = {
      id: 'news-1',
      title: 'Market update',
      summary: 'Summary from the configured source.',
      category: 'market',
      sentiment: 'neutral',
      source: 'Market Source',
      articleUrl: 'https://news.example.com/article',
      publishedAt: '2026-09-26T08:00:00.000Z',
      relatedPairs: [{ pairId: 'btc-usdt', symbol: 'BTC/USDT' }],
      isBreaking: false,
    } as const;
    const updatedAt = '2026-09-26T08:01:00.000Z';
    server.use(
      http.get('http://localhost:3000/api/market/news', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('category')).toBe('market');
        expect(url.searchParams.get('sentiment')).toBe('neutral');
        expect(url.searchParams.get('limit')).toBe('20');
        return HttpResponse.json({ items: [item], updatedAt });
      }),
    );

    await expect(
      marketApi.getNews({ category: 'market', sentiment: 'neutral', limit: 20 }),
    ).resolves.toEqual({ items: [item], updatedAt });

    server.use(
      http.get('http://localhost:3000/api/market/news', () =>
        HttpResponse.json({
          items: [{ ...item, articleUrl: 'http://news.example.com/article' }],
          updatedAt,
        }),
      ),
    );
    await expect(marketApi.getNews()).rejects.toThrow();
  });

  it('loads ordered market calendar events and rejects out-of-order results', async () => {
    const event = {
      id: 'event-1',
      title: 'Token unlock schedule',
      type: 'unlock',
      eventAt: '2026-10-01T08:00:00.000Z',
      symbol: 'ABC',
      impact: 'high',
      description: 'An upcoming token unlock event.',
      sourceUrl: 'https://events.example.com/unlock',
      confirmed: true,
    } as const;
    const updatedAt = '2026-09-26T08:01:00.000Z';
    server.use(
      http.get('http://localhost:3000/api/market/calendar', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('type')).toBe('unlock');
        expect(url.searchParams.get('impact')).toBe('high');
        return HttpResponse.json({ items: [event], updatedAt });
      }),
    );

    await expect(marketApi.getCalendar({ type: 'unlock', impact: 'high' })).resolves.toEqual({
      items: [event],
      updatedAt,
    });

    server.use(
      http.get('http://localhost:3000/api/market/calendar', () =>
        HttpResponse.json({
          items: [event, { ...event, id: 'event-2', eventAt: '2026-09-30T08:00:00.000Z' }],
          updatedAt,
        }),
      ),
    );
    await expect(marketApi.getCalendar()).rejects.toThrow();
  });

  it('loads correlations for the requested window and validates pair invariants', async () => {
    const response = {
      window: '7d',
      method: 'pearson',
      provider: 'Market Source',
      items: [
        { assetA: 'BTC', assetB: 'ETH', coefficient: 0.82, observations: 168 },
        { assetA: 'BTC', assetB: 'SOL', coefficient: -0.24, observations: 168 },
      ],
      updatedAt: '2026-09-26T08:00:00.000Z',
    } as const;
    server.use(
      http.get('http://localhost:3000/api/market/correlations', ({ request }) => {
        expect(new URL(request.url).searchParams.get('window')).toBe('7d');
        return HttpResponse.json(response);
      }),
    );

    await expect(marketApi.getCorrelations({ window: '7d' })).resolves.toEqual(response);

    server.use(
      http.get('http://localhost:3000/api/market/correlations', () =>
        HttpResponse.json({
          ...response,
          items: [
            ...response.items,
            { assetA: 'ETH', assetB: 'BTC', coefficient: 0.81, observations: 168 },
          ],
        }),
      ),
    );
    await expect(marketApi.getCorrelations({ window: '7d' })).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/correlations', () =>
        HttpResponse.json({ ...response, window: '30d' }),
      ),
    );
    await expect(marketApi.getCorrelations({ window: '7d' })).rejects.toThrow(/window/);
  });

  it('loads token unlocks for the requested window and validates source data', async () => {
    const response = {
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
    } as const;
    server.use(
      http.get('http://localhost:3000/api/market/unlocks', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('window')).toBe('30d');
        expect(url.searchParams.get('category')).toBe('investor');
        return HttpResponse.json(response);
      }),
    );

    await expect(
      marketApi.getTokenUnlocks({ window: '30d', category: 'investor' }),
    ).resolves.toEqual(response);

    server.use(
      http.get('http://localhost:3000/api/market/unlocks', () =>
        HttpResponse.json({
          ...response,
          items: [
            ...response.items,
            { ...response.items[0], id: 'unlock-2', eventAt: '2026-09-30T08:00:00.000Z' },
          ],
        }),
      ),
    );
    await expect(marketApi.getTokenUnlocks({ window: '30d' })).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/unlocks', () =>
        HttpResponse.json({ ...response, window: '90d' }),
      ),
    );
    await expect(marketApi.getTokenUnlocks({ window: '30d' })).rejects.toThrow(/window/);
  });

  it('loads derivatives snapshots and validates IDs and ordered liquidation buckets', async () => {
    const response = {
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
    } as const;
    server.use(
      http.get('http://localhost:3000/api/market/derivatives', () => HttpResponse.json(response)),
    );

    await expect(marketApi.getDerivatives()).resolves.toEqual(response);

    server.use(
      http.get('http://localhost:3000/api/market/derivatives', () =>
        HttpResponse.json({
          ...response,
          pairs: [response.pairs[0], { ...response.pairs[0], symbol: 'BTC-PERP' }],
        }),
      ),
    );
    await expect(marketApi.getDerivatives()).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/derivatives', () =>
        HttpResponse.json({
          ...response,
          liquidationHistory: [...response.liquidationHistory].reverse(),
        }),
      ),
    );
    await expect(marketApi.getDerivatives()).rejects.toThrow();
  });

  it('loads sentiment for the requested window and validates source distributions', async () => {
    const response = {
      window: '7d',
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
      ],
      trendingTopics: [{ topic: 'ETF flows', mentions24h: 340, change24h: 21.2 }],
    } as const;
    server.use(
      http.get('http://localhost:3000/api/market/sentiment', ({ request }) => {
        expect(new URL(request.url).searchParams.get('window')).toBe('7d');
        return HttpResponse.json(response);
      }),
    );

    await expect(marketApi.getSentiment({ window: '7d' })).resolves.toEqual(response);

    server.use(
      http.get('http://localhost:3000/api/market/sentiment', () =>
        HttpResponse.json({
          ...response,
          tokens: [
            {
              ...response.tokens[0],
              sentimentSharePercent: { bullish: 60, neutral: 25, bearish: 20 },
            },
          ],
        }),
      ),
    );
    await expect(marketApi.getSentiment({ window: '7d' })).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/sentiment', () =>
        HttpResponse.json({
          ...response,
          window: '24h',
          timeline: [...response.timeline].reverse(),
        }),
      ),
    );
    await expect(marketApi.getSentiment({ window: '7d' })).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/sentiment', () =>
        HttpResponse.json({ ...response, window: '24h' }),
      ),
    );
    await expect(marketApi.getSentiment({ window: '7d' })).rejects.toThrow(/window/);
  });

  it('loads source-attributed signals and validates ordering, links and expiry', async () => {
    const response = {
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
    } as const;
    server.use(
      http.get('http://localhost:3000/api/market/signals', () => HttpResponse.json(response)),
    );

    await expect(marketApi.getSignals()).resolves.toEqual(response);

    server.use(
      http.get('http://localhost:3000/api/market/signals', () =>
        HttpResponse.json({ ...response, items: [response.items[0], response.items[0]] }),
      ),
    );
    await expect(marketApi.getSignals()).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/signals', () =>
        HttpResponse.json({ ...response, items: [...response.items].reverse() }),
      ),
    );
    await expect(marketApi.getSignals()).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/signals', () =>
        HttpResponse.json({
          ...response,
          items: [{ ...response.items[0], sourceUrl: 'http://signals.example.com/1' }],
        }),
      ),
    );
    await expect(marketApi.getSignals()).rejects.toThrow();

    server.use(
      http.get('http://localhost:3000/api/market/signals', () =>
        HttpResponse.json({
          ...response,
          items: [{ ...response.items[0], expiresAt: '2026-09-26T06:00:00.000Z' }],
        }),
      ),
    );
    await expect(marketApi.getSignals()).rejects.toThrow();
  });

  it('uses idempotent mutations for price alerts', async () => {
    const alert = {
      id: 'alert-1',
      pairId: 'btc-usdt',
      symbol: 'BTC/USDT',
      condition: 'above',
      targetPrice: 70_000,
      currentPrice: 65_000,
      isActive: true,
      createdAt: '2026-09-21T10:00:00.000Z',
    } as const;
    server.use(
      http.get('http://localhost:3000/api/market/price-alerts', () =>
        HttpResponse.json({ items: [alert] }),
      ),
      http.post('http://localhost:3000/api/market/price-alerts', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('alert-create-001');
        return HttpResponse.json(alert, { status: 201 });
      }),
      http.patch('http://localhost:3000/api/market/price-alerts/alert-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('alert-update-001');
        return HttpResponse.json({ ...alert, isActive: false });
      }),
      http.delete('http://localhost:3000/api/market/price-alerts/alert-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('alert-delete-001');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(marketApi.listPriceAlerts()).resolves.toEqual({ items: [alert] });
    await expect(
      marketApi.createPriceAlert(
        { pairId: 'btc-usdt', condition: 'above', targetPrice: 70_000 },
        'alert-create-001',
      ),
    ).resolves.toEqual(alert);
    await expect(
      marketApi.updatePriceAlert('alert-1', { isActive: false }, 'alert-update-001'),
    ).resolves.toMatchObject({ isActive: false });
    await expect(
      marketApi.deletePriceAlert('alert-1', 'alert-delete-001'),
    ).resolves.toBeUndefined();
  });
});
