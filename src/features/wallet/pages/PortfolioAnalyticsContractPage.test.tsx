import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { PortfolioAnalyticsContractPage } from './PortfolioAnalyticsContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const noWalletReadAdapter: AuthAdapter = {
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
  },
};

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
  it('does not request analytics without wallet read permission', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/analytics/portfolio', () => {
        requests += 1;
        return HttpResponse.json(response);
      }),
    );

    renderWithProviders(<PortfolioAnalyticsContractPage />, { authAdapter: noWalletReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(requests).toBe(0);
  });

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

  it('refetches after a contract permission error through the shared error state', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/analytics/portfolio', () => {
        requests += 1;
        return requests === 1
          ? HttpResponse.json({ code: 'FORBIDDEN', message: 'Permission denied' }, { status: 403 })
          : HttpResponse.json(response);
      }),
    );

    renderWithProviders(<PortfolioAnalyticsContractPage />);

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    expect(screen.queryByText('Portfolio summary')).not.toBeInTheDocument();
    expect(screen.queryByText('BTC')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Portfolio summary')).toBeInTheDocument();
    expect(requests).toBe(2);
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

  it('renders negative period results and worst performers', async () => {
    server.use(
      http.get('*/wallet/analytics/portfolio', () =>
        HttpResponse.json({
          ...response,
          history: [{ timestamp: '2026-09-21T10:00:00.000Z', value: 900, pnl: -100 }],
          monthlyPnl: [{ month: 'Sep', pnl: -100 }],
          worstPerformers: [
            { symbol: 'ETH', name: 'Ether', change: -2.5, usd: 50, color: '#627EEA' },
          ],
        }),
      ),
    );

    renderWithProviders(<PortfolioAnalyticsContractPage />);

    expect(await screen.findAllByText('-$100.00')).toHaveLength(2);
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('-2.50%')).toBeInTheDocument();
  });
});
