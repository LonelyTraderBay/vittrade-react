import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAuth } from '@/shared/session/useAuth';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { DCASnapshot } from '../model/dca-types';
import { DCAMainPage } from './DCAMainPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
let restoreSvgPathLength: (() => void) | undefined;
afterEach(() => {
  server.resetHandlers();
  restoreSvgPathLength?.();
  restoreSvgPathLength = undefined;
});
afterAll(() => server.close());

const snapshot: DCASnapshot = {
  overview: {
    currentValue: 1_250_000,
    totalInvested: 1_000_000,
    profitLoss: 250_000,
    profitLossPercent: 25,
    activePlans: 1,
    pausedPlans: 0,
    errorPlans: 0,
    nextExecution: { relativeTime: '2 giờ', amount: 500_000 },
  },
  plans: [
    {
      id: 'plan-1',
      coinSymbol: 'BTC',
      coinName: 'Bitcoin',
      coinIcon: 'https://example.com/btc.png',
      frequency: 'weekly',
      amountPerPurchase: 500_000,
      nextExecution: new Date('2026-09-24T10:00:00.000Z'),
      status: 'active',
      totalInvested: 1_000_000,
      currentHoldings: 0.001,
      averageCost: 1_000_000_000,
      createdAt: new Date('2026-09-01T00:00:00.000Z'),
    },
  ],
  purchaseHistory: [],
  portfolioHistory: [],
};

const analytics = {
  trackEvent: vi.fn(),
  trackDeepLink: vi.fn(),
  trackPlanCreation: vi.fn(),
  trackPlanStatusChange: vi.fn(),
  trackPlanDeletion: vi.fn(),
};

function RouteStateProbe() {
  const location = useLocation();
  return (
    <>
      <output data-testid="route-state">{JSON.stringify(location.state ?? null)}</output>
      <output data-testid="route-path">{location.pathname}</output>
      <output data-testid="route-search">{location.search}</output>
    </>
  );
}

function RefreshSessionButton() {
  const { refreshSession } = useAuth();
  return <button onClick={() => void refreshSession()}>Refresh session</button>;
}

describe('DCAMainPage additional coverage', () => {
  it('shows portfolio history and timeframe performance in the expanded chart', async () => {
    const svgPathLengthDescriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      'getTotalLength',
    );
    Object.defineProperty(SVGElement.prototype, 'getTotalLength', {
      configurable: true,
      value: () => 100,
    });
    restoreSvgPathLength = () => {
      if (svgPathLengthDescriptor) {
        Object.defineProperty(SVGElement.prototype, 'getTotalLength', svgPathLengthDescriptor);
      } else {
        Reflect.deleteProperty(SVGElement.prototype, 'getTotalLength');
      }
    };
    const now = Date.now();
    const historySnapshot: DCASnapshot = {
      ...snapshot,
      overview: { ...snapshot.overview, profitLoss: -10_000, profitLossPercent: -1 },
      portfolioHistory: Array.from({ length: 60 }, (_, index) => ({
        date: new Date(now - (59 - index) * 24 * 60 * 60 * 1000),
        portfolioValue: Math.round((200_000 * index) / 59),
        totalInvested: 100_000 + index * 1_000,
        hasPurchase: index % 2 === 0,
      })),
    };
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(historySnapshot)));
    const user = userEvent.setup();

    renderWithProviders(
      <DCAMainPage
        isEnabled
        isDevelopment={false}
        analytics={analytics}
        funnels={{
          trackWalletPageView: vi.fn(),
          trackWalletCreateSheetOpened: vi.fn(),
          trackAssetCreateSheetOpened: vi.fn(),
          trackPreselectedCoinUsed: vi.fn(),
        }}
      />,
    );

    await screen.findByText('Kế hoạch (1)');
    await user.click(screen.getAllByRole('button', { name: 'Lịch sử' })[1]);
    expect(screen.queryByText('Chưa có lịch sử')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Biểu đồ' }));
    const chartDialog = await screen.findByRole('dialog', { name: 'Biểu đồ danh mục' });
    expect(within(chartDialog).getByText('Biến động 90 ngày qua')).toBeInTheDocument();

    await user.click(within(chartDialog).getByRole('button', { name: 'Tất cả' }));
    expect(within(chartDialog).getByText('Biến động Toàn bộ')).toBeInTheDocument();
    await user.click(within(chartDialog).getAllByRole('button', { name: 'Đóng' })[1]);
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Biểu đồ danh mục' })).not.toBeInTheDocument(),
    );
  });

  it('closes the create sheet and both delete-sheet close actions without sending mutations', async () => {
    let mutationCount = 0;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.delete('*/dca/plans/plan-1', () => {
        mutationCount += 1;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <DCAMainPage
        isEnabled
        isDevelopment={false}
        analytics={analytics}
        funnels={{
          trackWalletPageView: vi.fn(),
          trackWalletCreateSheetOpened: vi.fn(),
          trackAssetCreateSheetOpened: vi.fn(),
          trackPreselectedCoinUsed: vi.fn(),
        }}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Tạo kế hoạch mới' }));
    expect(await screen.findByText('Chọn Coin')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    await waitFor(() => expect(screen.queryByText('Chọn Coin')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Xóa kế hoạch' }));
    expect(
      await screen.findByText(
        'Bạn có chắc chắn muốn xóa kế hoạch DCA này? Hành động này không thể hoàn tác.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    await waitFor(() =>
      expect(
        screen.queryByText(
          'Bạn có chắc chắn muốn xóa kế hoạch DCA này? Hành động này không thể hoàn tác.',
        ),
      ).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Xóa kế hoạch' }));
    await screen.findByText(
      'Bạn có chắc chắn muốn xóa kế hoạch DCA này? Hành động này không thể hoàn tác.',
    );
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    await waitFor(() =>
      expect(
        screen.queryByText(
          'Bạn có chắc chắn muốn xóa kế hoạch DCA này? Hành động này không thể hoàn tác.',
        ),
      ).not.toBeInTheDocument(),
    );
    expect(mutationCount).toBe(0);
  });

  it('activates a paused plan with a server-confirmed status change', async () => {
    const pausedSnapshot: DCASnapshot = {
      ...snapshot,
      overview: { ...snapshot.overview, activePlans: 0, pausedPlans: 1 },
      plans: [{ ...snapshot.plans[0], status: 'paused' }],
    };
    let requestBody: unknown;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(pausedSnapshot)),
      http.patch('*/dca/plans/plan-1', async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({ ...pausedSnapshot.plans[0], status: 'active' });
      }),
    );
    analytics.trackPlanStatusChange.mockClear();
    const user = userEvent.setup();

    renderWithProviders(
      <DCAMainPage
        isEnabled
        isDevelopment={false}
        analytics={analytics}
        funnels={{
          trackWalletPageView: vi.fn(),
          trackWalletCreateSheetOpened: vi.fn(),
          trackAssetCreateSheetOpened: vi.fn(),
          trackPreselectedCoinUsed: vi.fn(),
        }}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Kích hoạt' }));
    await waitFor(() => expect(requestBody).toEqual({ status: 'active' }));
    expect(analytics.trackPlanStatusChange).toHaveBeenCalledWith('plan-1', 'active');
  });

  it('does not submit a delete after the DCA write permission is revoked', async () => {
    let permissions = ['dca:write'];
    let deleteRequests = 0;
    const initialSession = {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    };
    const revocableAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession,
      async refresh() {
        return {
          ...initialSession,
          user: { ...initialSession.user, permissions },
        };
      },
    };
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.delete('*/dca/plans/plan-1', () => {
        deleteRequests += 1;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(
      <>
        <DCAMainPage
          isEnabled
          isDevelopment={false}
          analytics={analytics}
          funnels={{
            trackWalletPageView: vi.fn(),
            trackWalletCreateSheetOpened: vi.fn(),
            trackAssetCreateSheetOpened: vi.fn(),
            trackPreselectedCoinUsed: vi.fn(),
          }}
        />
        <RefreshSessionButton />
      </>,
      { authAdapter: revocableAdapter },
    );

    await user.click(await screen.findByRole('button', { name: 'Xóa kế hoạch' }));
    await screen.findByRole('button', { name: /^Xóa$/ });
    permissions = [];
    await user.click(screen.getByRole('button', { name: 'Refresh session' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Xóa kế hoạch' })).toBeDisabled(),
    );
    await user.click(screen.getByRole('button', { name: /^Xóa$/ }));

    expect(deleteRequests).toBe(0);
  });

  it('supports the legacy coin query deep link without rewriting the URL', async () => {
    const trackDeepLink = vi.fn();
    const trackAssetCreateSheetOpened = vi.fn();
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)));

    renderWithProviders(
      <>
        <DCAMainPage
          isEnabled
          isDevelopment={false}
          analytics={{ ...analytics, trackDeepLink }}
          funnels={{
            trackWalletPageView: vi.fn(),
            trackWalletCreateSheetOpened: vi.fn(),
            trackAssetCreateSheetOpened,
            trackPreselectedCoinUsed: vi.fn(),
          }}
        />
        <RouteStateProbe />
      </>,
      { routerProps: { initialEntries: ['/w/wallet/dca?coin=eth'] } },
    );

    expect(await screen.findByText('Tạo Kế Hoạch DCA Mới')).toBeInTheDocument();
    expect(screen.getByTestId('route-search')).toHaveTextContent('?coin=eth');
    expect(trackDeepLink).toHaveBeenCalledWith('ETH', true);
    expect(trackAssetCreateSheetOpened).toHaveBeenCalledTimes(1);
  });
});
