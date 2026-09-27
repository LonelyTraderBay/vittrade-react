import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { Route, Routes, useLocation } from 'react-router';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { TraderProfilePage } from './TraderProfilePage';

const server = setupServer();
const profile = {
  provider: {
    id: 'provider-1',
    name: 'Alpha',
    avatar: 'A',
    winRate: 78,
    totalPnl: 12_000,
    totalPnlPct: 42,
    aum: 100_000,
    copiers: 200,
    maxCopiers: 500,
    sharpeRatio: 2.1,
    maxDrawdown: -9,
    totalTrades: 100,
    avgHoldingTime: '4h',
    weeklyPnl: [1, 2],
    tags: ['Stable'],
    isFollowing: false,
    riskLevel: 'low',
    verified: true,
  },
  pnlHistory: [
    { day: 'Mon', pnl: 100, cumPnl: 100 },
    { day: 'Tue', pnl: -50, cumPnl: 50 },
  ],
  recentTrades: [
    {
      id: 'trade-1',
      pair: 'BTC/USDT',
      side: 'long',
      entry: 65_000,
      pnl: 100,
      pnlPct: 1.2,
      time: 'Today',
      status: 'open',
    },
    {
      id: 'trade-2',
      pair: 'ETH/USDT',
      side: 'short',
      entry: 2_200,
      exit: 2_100,
      pnl: -25,
      pnlPct: -1.1,
      time: 'Yesterday',
      status: 'closed',
    },
  ],
};

function CurrentPath() {
  return <output data-testid="current-path">{useLocation().pathname}</output>;
}

function renderProfile() {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/w/trader/:traderId" element={<TraderProfilePage />} />
        <Route
          path="/w/trade/copy-provider/:traderId/configuration"
          element={<p>Copy configuration</p>}
        />
      </Routes>
      <CurrentPath />
    </>,
    { routerProps: { initialEntries: ['/w/trader/provider-1'] } },
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TraderProfilePage', () => {
  it('renders provider metrics, trade outcomes, risk disclosure, and copy configuration navigation', async () => {
    server.use(
      http.get('http://localhost:3000/api/trading/copy/providers/provider-1', () =>
        HttpResponse.json(profile),
      ),
    );
    const user = userEvent.setup();
    renderProfile();

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('42.0%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
    expect(screen.getByText('PnL 7 ngày')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Giao dịch' }));
    expect(screen.getByText('BTC/USDT')).toBeInTheDocument();
    expect(screen.getByText('ETH/USDT')).toBeInTheDocument();
    expect(screen.getByText(/Đang mở/)).toBeInTheDocument();
    expect(screen.getByText(/Exit 2\.100/)).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Thống kê' }));
    expect(screen.getByText('Phân tích rủi ro')).toBeInTheDocument();
    expect(screen.getByText(/Hiệu suất quá khứ không đảm bảo/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xem cấu hình copy' }));
    expect(screen.getByText('Copy configuration')).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent(
      '/w/trade/copy-provider/provider-1/configuration',
    );
  });

  it('shows a retry action after a provider request fails', async () => {
    let requests = 0;
    let shouldFail = true;
    server.use(
      http.get('http://localhost:3000/api/trading/copy/providers/provider-1', () => {
        requests += 1;
        return shouldFail
          ? HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 })
          : HttpResponse.json(profile);
      }),
    );
    const user = userEvent.setup();
    renderProfile();

    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    shouldFail = false;
    await user.click(retry);
    await waitFor(() => expect(screen.getByText('Alpha')).toBeInTheDocument());
    expect(requests).toBe(4);
  });
});
