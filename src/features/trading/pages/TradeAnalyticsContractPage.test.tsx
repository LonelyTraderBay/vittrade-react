import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { TradeAnalyticsContractPage } from './TradeAnalyticsContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const response = {
  period: '1M',
  summary: {
    totalPnl: 1259.35,
    totalTrades: 104,
    winRate: 62.5,
    profitFactor: 1.86,
    averageTradePnl: 12.11,
    maxDrawdown: 340.2,
    bestDay: 520.85,
    worstDay: -340.2,
    largestWin: 193.8,
    largestLoss: -124,
  },
  dailyPnl: [{ date: '01/03', pnl: 245.5, cumPnl: 245.5, trades: 8, wins: 5 }],
  bestTrades: [],
  worstTrades: [],
  assetBreakdown: [{ asset: 'BTC', color: '#F7931A', trades: 28, pnl: 680.5, winRate: 67.8 }],
  hourlyDistribution: [{ hour: '09-12', trades: 28, pnl: 520 }],
};

describe('Trade analytics contract page', () => {
  it('renders server-owned summary and switches to asset view', async () => {
    server.use(http.get('*/trading/analytics', () => HttpResponse.json(response)));

    renderWithProviders(<TradeAnalyticsContractPage />);

    expect(await screen.findByText('Performance summary')).toBeInTheDocument();
    expect(screen.getByText('+$1,259.35')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'assets' }));
    expect(screen.getByText('Asset breakdown')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('renders the shared error state for an unavailable analytics contract', async () => {
    server.use(
      http.get('*/trading/analytics', () =>
        HttpResponse.json({ code: 'ANALYTICS_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<TradeAnalyticsContractPage />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Performance summary')).not.toBeInTheDocument();
  });
});
