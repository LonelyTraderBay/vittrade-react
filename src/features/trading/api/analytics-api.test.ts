import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { tradingAnalyticsApi } from './analytics-api';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const response = {
  period: '1M',
  summary: {
    totalPnl: 100,
    totalTrades: 4,
    winRate: 75,
    profitFactor: 2,
    averageTradePnl: 25,
    maxDrawdown: 20,
    bestDay: 60,
    worstDay: -20,
    largestWin: 60,
    largestLoss: -20,
  },
  dailyPnl: [{ date: '01/03', pnl: 100, cumPnl: 100, trades: 4, wins: 3 }],
  bestTrades: [
    {
      id: 'best-1',
      pair: 'BTC/USDT',
      side: 'buy',
      entry: 100,
      exit: 110,
      quantity: 1,
      pnl: 10,
      roi: 10,
      date: '01/03',
    },
  ],
  worstTrades: [],
  assetBreakdown: [{ asset: 'BTC', color: '#F7931A', trades: 4, pnl: 100, winRate: 75 }],
  hourlyDistribution: [{ hour: '09-12', trades: 4, pnl: 100 }],
};

describe('trading analytics API contract', () => {
  it('loads the selected period and validates the response', async () => {
    server.use(
      http.get('*/trading/analytics', ({ request }) => {
        expect(new URL(request.url).searchParams.get('period')).toBe('1M');
        return HttpResponse.json(response);
      }),
    );

    await expect(tradingAnalyticsApi.getAnalytics({ period: '1M' })).resolves.toMatchObject({
      period: '1M',
      summary: { totalPnl: 100 },
    });
  });

  it('rejects a response with an invalid win rate', async () => {
    server.use(
      http.get('*/trading/analytics', () =>
        HttpResponse.json({ ...response, summary: { ...response.summary, winRate: 120 } }),
      ),
    );

    await expect(tradingAnalyticsApi.getAnalytics()).rejects.toThrow();
  });
});
