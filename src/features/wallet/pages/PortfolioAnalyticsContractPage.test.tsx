import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { PortfolioAnalyticsContractPage } from './PortfolioAnalyticsContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const response = {
  period: '1M',
  history: [{ timestamp: '2026-09-21T10:00:00.000Z', value: 1_000, pnl: 50 }],
  monthlyPnl: [{ month: 'Sep', pnl: 50 }],
  topPerformers: [{ symbol: 'BTC', name: 'Bitcoin', change: 10, usd: 100, color: '#F7931A' }],
  worstPerformers: [],
  totalTrades: 2,
  totalFeesUsd: 1.25,
};

describe('Portfolio analytics contract page', () => {
  it('renders typed portfolio data and requests the selected period', async () => {
    server.use(
      http.get('*/wallet/analytics/portfolio', ({ request }) => {
        const period = new URL(request.url).searchParams.get('period');
        expect(period).toBeTruthy();
        return HttpResponse.json({ ...response, period });
      }),
    );

    renderWithProviders(<PortfolioAnalyticsContractPage />);

    expect(await screen.findByText('Portfolio summary')).toBeInTheDocument();
    expect(screen.getByText('Performance history')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '3M' }));
    expect(await screen.findByText('Period 3M')).toBeInTheDocument();
  });

  it('refetches through the shared error state when the contract is unavailable', async () => {
    server.use(
      http.get('*/wallet/analytics/portfolio', () =>
        HttpResponse.json({ code: 'PORTFOLIO_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<PortfolioAnalyticsContractPage />);

    expect(await screen.findByRole('button')).toBeInTheDocument();
    expect(screen.queryByText('Portfolio summary')).not.toBeInTheDocument();
    expect(screen.queryByText('BTC')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button'));
  });

  it('renders explicit empty states for a period without portfolio activity', async () => {
    server.use(
      http.get('*/wallet/analytics/portfolio', () =>
        HttpResponse.json({
          ...response,
          period: '1D',
          history: [],
          monthlyPnl: [],
          topPerformers: [],
          worstPerformers: [],
        }),
      ),
    );

    renderWithProviders(<PortfolioAnalyticsContractPage />);

    expect(await screen.findByText('No portfolio history for this period.')).toBeInTheDocument();
    expect(screen.getAllByText('No assets in this ranking for the selected period.')).toHaveLength(
      2,
    );
  });
});
