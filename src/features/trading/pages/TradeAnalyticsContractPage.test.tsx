import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { TradeAnalyticsContractPage } from './TradeAnalyticsContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

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
  dailyPnl: [
    { date: '01/03', pnl: 245.5, cumPnl: 245.5, trades: 8, wins: 5 },
    { date: '02/03', pnl: -42.25, cumPnl: 203.25, trades: 3, wins: 1 },
  ],
  bestTrades: [
    {
      id: 'best-trade',
      pair: 'BTCUSDT',
      side: 'buy',
      entry: 50_000,
      exit: 52_000,
      quantity: 0.1,
      pnl: 200,
      roi: 4,
      date: '01/03',
    },
  ],
  worstTrades: [
    {
      id: 'worst-trade',
      pair: 'ETHUSDT',
      side: 'sell',
      entry: 3_000,
      exit: 3_050,
      quantity: 1,
      pnl: -50,
      roi: -1.67,
      date: '02/03',
    },
  ],
  assetBreakdown: [
    { asset: 'BTC', color: '#F7931A', trades: 28, pnl: 680.5, winRate: 67.8 },
    { asset: 'ETH', color: '#627EEA', trades: 14, pnl: -75.25, winRate: 42.1 },
  ],
  hourlyDistribution: [{ hour: '09-12', trades: 28, pnl: 520 }],
};

describe('Trade analytics contract page', () => {
  it('renders server-owned summary and switches to asset view', async () => {
    server.use(http.get('*/trading/analytics', () => HttpResponse.json(response)));

    renderWithProviders(<TradeAnalyticsContractPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Performance summary')).toBeInTheDocument();
    expect(screen.getByText('+$1,259.35')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'assets' }));
    expect(screen.getByText('Asset breakdown')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
  });

  it('renders the shared error state for an unavailable analytics contract', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/trading/analytics', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ code: 'ANALYTICS_UNAVAILABLE' }, { status: 503 })
          : HttpResponse.json(response);
      }),
    );

    renderWithProviders(<TradeAnalyticsContractPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    expect(screen.queryByText('Performance summary')).not.toBeInTheDocument();
    expect(requestCount).toBe(3);

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Performance summary')).toBeInTheDocument();
    expect(requestCount).toBe(4);
  });

  it('requests each selected period and displays the negative daily result', async () => {
    const requestedPeriods: string[] = [];
    server.use(
      http.get('*/trading/analytics', ({ request }) => {
        const period = new URL(request.url).searchParams.get('period') ?? '1M';
        requestedPeriods.push(period);
        return HttpResponse.json({ ...response, period });
      }),
    );

    renderWithProviders(<TradeAnalyticsContractPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Period 1M')).toBeInTheDocument();
    expect(screen.getByText('-$42.25')).toBeInTheDocument();

    for (const period of ['7D', '3M', '1Y']) {
      await userEvent.click(screen.getByRole('button', { name: period }));
      expect(await screen.findByText(`Period ${period}`)).toBeInTheDocument();
    }

    expect(requestedPeriods).toEqual(['1M', '7D', '3M', '1Y']);
  });

  it('renders best and worst trades with their signed outcomes', async () => {
    server.use(http.get('*/trading/analytics', () => HttpResponse.json(response)));

    renderWithProviders(<TradeAnalyticsContractPage />, {
      authAdapter: adapterWithPermissions(['trade:read']),
    });

    expect(await screen.findByText('Performance summary')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'trades' }));

    expect(screen.getByRole('heading', { name: 'Best trades' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Worst trades' })).toBeInTheDocument();
    expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    expect(screen.getByText('ETHUSDT')).toBeInTheDocument();
    expect(screen.getByText('BUY · 01/03 · 4.00% ROI')).toBeInTheDocument();
    expect(screen.getByText('SELL · 02/03 · -1.67% ROI')).toBeInTheDocument();
    expect(screen.getByText('+$200.00')).toBeInTheDocument();
    expect(screen.getByText('-$50.00')).toBeInTheDocument();
  });

  it('does not request or render account analytics without trade read permission', () => {
    let requestCount = 0;
    server.use(
      http.get('*/trading/analytics', () => {
        requestCount += 1;
        return HttpResponse.json(response);
      }),
    );

    renderWithProviders(<TradeAnalyticsContractPage />, {
      authAdapter: adapterWithPermissions([]),
    });

    expect(screen.getByRole('alert')).toHaveTextContent('không có quyền xem dữ liệu giao dịch');
    expect(screen.queryByText('Performance summary')).not.toBeInTheDocument();
    expect(requestCount).toBe(0);
  });
});
