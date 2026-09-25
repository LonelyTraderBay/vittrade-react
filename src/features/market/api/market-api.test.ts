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
