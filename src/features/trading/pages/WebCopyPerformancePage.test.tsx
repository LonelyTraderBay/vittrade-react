import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { WebCopyPerformancePage } from './WebCopyPerformancePage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('web copy performance page', () => {
  it('renders the selected relationship from the trading API', async () => {
    server.use(
      http.get('*/trading/copy/relationships', () =>
        HttpResponse.json({
          items: [
            {
              id: 'copy-1',
              provider: {
                id: 'provider-1',
                name: 'Provider One',
                avatar: 'P1',
                winRate: 66.7,
                totalPnl: 75,
                totalPnlPct: 7.5,
                aum: 250_000,
                copiers: 48,
                maxCopiers: 100,
                sharpeRatio: 1.8,
                maxDrawdown: 8.5,
                totalTrades: 120,
                avgHoldingTime: '4h',
                weeklyPnl: [1, 2, -1, 3],
                tags: ['swing'],
                isFollowing: true,
                riskLevel: 'medium',
                verified: true,
              },
              status: 'active',
              copyMode: 'mirror',
              positionSizing: 'percentage',
              copyRatio: 50,
              capital: 1_000,
              currentValue: 1_075,
              pnl: 75,
              pnlPct: 7.5,
              trades: 12,
              winRate: 66.7,
              hasCustomStopLoss: false,
              performanceHistory: [{ date: '2026-09-22', value: 1_075 }],
            },
          ],
        }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/trade/copy/performance/:copyId" element={<WebCopyPerformancePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/trade/copy/performance/copy-1'] } },
    );

    expect(await screen.findByText('Provider One')).toBeInTheDocument();
    expect(screen.getByText('7.50%')).toBeInTheDocument();
    expect(screen.getByText('$1,075')).toBeInTheDocument();
  });
});
