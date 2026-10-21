import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen, waitFor, within } from '@testing-library/react';
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
  it('keeps the selected period focused while its new read is pending', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get('*/wallet/analytics/portfolio', async ({ request }) => {
        const period = new URL(request.url).searchParams.get('period') ?? '1M';
        if (period === '1W') await pending;
        return HttpResponse.json({ ...response, period });
      }),
    );
    renderWithProviders(<PortfolioAnalyticsContractPage />);
    const user = userEvent.setup();
    await screen.findByText('Period 1M');
    const control = screen.getByRole('button', { name: '1W' });
    control.focus();
    try {
      await user.keyboard('{Enter}');
      expect(control).toHaveFocus();
      expect(screen.getByRole('status')).toHaveTextContent('Loading portfolio analytics API…');
      expect(screen.queryByText('Period 1M')).not.toBeInTheDocument();
      await act(async () => {
        release();
      });
      await screen.findByText('Period 1W');
      expect(control).toHaveFocus();
    } finally {
      release();
    }
  });

  it('retains controls on a period error and recovers by choosing another period', async () => {
    server.use(
      http.get('*/wallet/analytics/portfolio', ({ request }) => {
        const period = new URL(request.url).searchParams.get('period') ?? '1M';
        return period === '1W'
          ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
          : HttpResponse.json({ ...response, period });
      }),
    );
    renderWithProviders(<PortfolioAnalyticsContractPage />);
    const user = userEvent.setup();
    await screen.findByText('Period 1M');
    const control = screen.getByRole('button', { name: '1W' });
    control.focus();
    await user.keyboard('{Enter}');
    await screen.findByText('Có lỗi xảy ra', {}, { timeout: 10000 });
    expect(control).toHaveFocus();
    expect(screen.queryByText('Portfolio summary')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '1Y' }));
    await screen.findByText('Period 1Y');
    expect(screen.getByRole('button', { name: '1Y' })).toHaveFocus();
  });

  it('cancels the replaced period read and ignores its late result', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    let oldSignal: AbortSignal | undefined;
    let oldHandlerFinished = false;
    server.use(
      http.get('*/wallet/analytics/portfolio', async ({ request }) => {
        const period = new URL(request.url).searchParams.get('period') ?? '1M';
        if (period === '1W') {
          oldSignal = request.signal;
          await pending;
          oldHandlerFinished = true;
        }
        return HttpResponse.json({
          ...response,
          period,
          history: [{ ...response.history[0], value: period === '1W' ? 99999 : 1050 }],
        });
      }),
    );
    renderWithProviders(<PortfolioAnalyticsContractPage />);
    const user = userEvent.setup();
    await screen.findByText('Period 1M');
    try {
      await user.click(screen.getByRole('button', { name: '1W' }));
      await waitFor(() => expect(oldSignal).toBeDefined());
      await user.click(screen.getByRole('button', { name: '1Y' }));
      await screen.findByText('Period 1Y');
      await waitFor(() => expect(oldSignal?.aborted).toBe(true));
      await act(async () => {
        release();
      });
      await waitFor(() => expect(oldHandlerFinished).toBe(true));
      expect(screen.queryByText('Period 1W')).not.toBeInTheDocument();
      const summary = screen
        .getByText('Portfolio summary')
        .closest('[data-slot="tr-card"]') as HTMLElement;
      expect(within(summary).getByText('$1,050.00')).toBeInTheDocument();
      expect(within(summary).queryByText('$99,999.00')).not.toBeInTheDocument();
    } finally {
      release();
    }
  });

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
    const periods = screen.getByRole('group', { name: 'Analytics period' });
    expect(within(periods).getByRole('button', { name: '1M' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: '3M' }));
    expect(await screen.findByText('Period 3M')).toBeInTheDocument();
    expect(
      within(screen.getByRole('group', { name: 'Analytics period' })).getByRole('button', {
        name: '3M',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
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
