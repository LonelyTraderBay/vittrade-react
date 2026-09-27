import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useLocation } from 'react-router';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { DCASnapshot } from '../model/dca-types';
import { DCAMainPage } from './DCAMainPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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
  return <output data-testid="route-state">{JSON.stringify(location.state ?? null)}</output>;
}

describe('DCA feature page', () => {
  it('does not request private DCA data while the feature flag is disabled', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/dca/snapshot', () => {
        requestCount += 1;
        return HttpResponse.json(snapshot);
      }),
    );

    renderWithProviders(
      <DCAMainPage
        isEnabled={false}
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

    expect(screen.getByText('Tính năng DCA tạm thời không khả dụng')).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(requestCount).toBe(0);
  });

  it('renders the API snapshot and reports the page-view funnel event', async () => {
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)));
    const trackWalletPageView = vi.fn();

    renderWithProviders(
      <DCAMainPage
        isEnabled
        isDevelopment={false}
        analytics={analytics}
        funnels={{
          trackWalletPageView,
          trackWalletCreateSheetOpened: vi.fn(),
          trackAssetCreateSheetOpened: vi.fn(),
          trackPreselectedCoinUsed: vi.fn(),
        }}
      />,
    );

    expect(await screen.findByText('Mua tự động (DCA)')).toBeInTheDocument();
    expect(await screen.findByText('Tổng danh mục DCA (VND)')).toBeInTheDocument();
    expect(trackWalletPageView).toHaveBeenCalledTimes(1);
  });

  it('refreshes the snapshot and reports the refresh time and count', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/dca/snapshot', () => {
        requestCount += 1;
        return HttpResponse.json(snapshot);
      }),
    );
    const { container } = renderWithProviders(
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

    await screen.findByText('Mua tự động (DCA)');
    const refreshSurface = container.querySelector('.relative.flex-1')!;
    fireEvent.touchStart(refreshSurface, { touches: [{ clientY: 0 }] });
    fireEvent.touchMove(refreshSurface, { touches: [{ clientY: 160 }] });
    fireEvent.touchEnd(refreshSurface);

    await waitFor(() => expect(requestCount).toBe(2));
    expect(await screen.findByText(/^Cập nhật:/)).toBeInTheDocument();
  });

  it('shows the empty state and tracks overview actions without mutating when no plan is active', async () => {
    const emptySnapshot = {
      ...snapshot,
      overview: { ...snapshot.overview, activePlans: 0, pausedPlans: 0, nextExecution: null },
      plans: [],
    };
    let updateRequests = 0;
    let resolveSnapshot: (() => void) | undefined;
    const trackWalletCreateSheetOpened = vi.fn();
    analytics.trackEvent.mockClear();
    server.use(
      http.get(
        '*/dca/snapshot',
        () =>
          new Promise((resolve) => {
            resolveSnapshot = () => resolve(HttpResponse.json(emptySnapshot));
          }),
      ),
      http.patch('*/dca/plans/:planId', () => {
        updateRequests += 1;
        return HttpResponse.json(snapshot.plans[0]);
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
          trackWalletCreateSheetOpened,
          trackAssetCreateSheetOpened: vi.fn(),
          trackPreselectedCoinUsed: vi.fn(),
        }}
      />,
    );

    await waitFor(() => expect(resolveSnapshot).toBeTypeOf('function'));
    expect(screen.queryByText('Chưa có kế hoạch DCA')).not.toBeInTheDocument();
    await act(async () => resolveSnapshot?.());
    expect(await screen.findByText('Chưa có kế hoạch DCA')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tạm dừng' }));
    expect(updateRequests).toBe(0);
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    expect(await screen.findByText('Tạo Kế Hoạch DCA Mới')).toBeInTheDocument();
    expect(trackWalletCreateSheetOpened).toHaveBeenCalledTimes(1);
    expect(analytics.trackEvent).toHaveBeenCalledWith('dca_create_sheet_opened', {
      source: 'overview_card',
    });
  });

  it('opens chart history from the overview action and the plan tab', async () => {
    server.use(http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)));
    analytics.trackEvent.mockClear();
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
    await user.click(screen.getAllByRole('button', { name: 'Lịch sử' })[0]);
    expect(await screen.findByText('Chưa có lịch sử')).toBeInTheDocument();
    expect(analytics.trackEvent).toHaveBeenCalledWith('dca_tab_switched', { tab: 'history' });

    await user.click(screen.getByRole('button', { name: 'Kế hoạch (1)' }));
    await user.click(screen.getAllByRole('button', { name: 'Lịch sử' })[1]);
    expect(screen.getByText('Chưa có lịch sử')).toBeInTheDocument();
  });

  it('consumes a wallet DCA deep link and creates the normalized preselected coin', async () => {
    let createRequestBody: unknown;
    const trackDeepLink = vi.fn();
    const trackAssetCreateSheetOpened = vi.fn();
    const trackPreselectedCoinUsed = vi.fn();
    const trackPlanCreation = vi.fn();
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/dca/plans', async ({ request }) => {
        createRequestBody = await request.json();
        return HttpResponse.json({ ...snapshot.plans[0], id: 'plan-created-1' }, { status: 201 });
      }),
    );

    renderWithProviders(
      <>
        <DCAMainPage
          isEnabled
          isDevelopment={false}
          analytics={{ ...analytics, trackDeepLink, trackPlanCreation }}
          funnels={{
            trackWalletPageView: vi.fn(),
            trackWalletCreateSheetOpened: vi.fn(),
            trackAssetCreateSheetOpened,
            trackPreselectedCoinUsed,
          }}
        />
        <RouteStateProbe />
      </>,
      {
        routerProps: {
          initialEntries: [{ pathname: '/w/wallet/dca', state: { preselectedCoin: ' eth ' } }],
        },
      },
    );

    expect(await screen.findByText('Tạo Kế Hoạch DCA Mới')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('route-state')).toHaveTextContent('null'));
    expect(trackDeepLink).toHaveBeenCalledWith('ETH', true);
    expect(trackAssetCreateSheetOpened).toHaveBeenCalledTimes(1);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Tạo Kế Hoạch' }));

    await waitFor(() =>
      expect(createRequestBody).toEqual({
        coinSymbol: 'ETH',
        frequency: 'weekly',
        amountPerPurchase: 500_000,
      }),
    );
    expect(trackPlanCreation).toHaveBeenCalledWith(
      'plan-created-1',
      'ETH',
      'weekly',
      500_000,
      'asset_detail',
    );
    expect(trackPreselectedCoinUsed).toHaveBeenCalledTimes(1);
  });

  it('recovers from a snapshot failure after the user retries', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/dca/snapshot', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ message: 'Snapshot unavailable' }, { status: 503 })
          : HttpResponse.json(snapshot);
      }),
    );

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

    expect(await screen.findByText('Có lỗi xảy ra')).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Mua tự động (DCA)')).toBeInTheDocument();
    expect(requestCount).toBe(4);
  });

  it('pauses an active plan through the API with an idempotency key', async () => {
    let requestBody: unknown;
    let idempotencyKey: string | null = null;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.patch('*/dca/plans/plan-1', async ({ request }) => {
        requestBody = await request.json();
        idempotencyKey = request.headers.get('Idempotency-Key');
        return HttpResponse.json({ ...snapshot.plans[0], status: 'paused' });
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

    const pauseButtons = await screen.findAllByRole('button', { name: 'Tạm dừng' });
    await user.click(pauseButtons[1]);

    await waitFor(() => expect(requestBody).toEqual({ status: 'paused' }));
    expect(idempotencyKey).toEqual(expect.any(String));
    expect(analytics.trackPlanStatusChange).toHaveBeenCalledWith('plan-1', 'paused');
  });

  it('reuses the pause idempotency key after a transient update failure', async () => {
    const idempotencyKeys: string[] = [];
    let updateRequests = 0;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.patch('*/dca/plans/plan-1', ({ request }) => {
        updateRequests += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (updateRequests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...snapshot.plans[0], status: 'paused' });
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

    const pauseButtons = await screen.findAllByRole('button', { name: 'Tạm dừng' });
    await user.click(pauseButtons[1]);
    await waitFor(() => expect(updateRequests).toBe(1));
    await waitFor(() => expect(pauseButtons[1]).toBeEnabled());
    await user.click(pauseButtons[1]);

    await waitFor(() => expect(updateRequests).toBe(2));
    expect(idempotencyKeys[0]).toEqual(expect.any(String));
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('confirms deletion and reuses its idempotency key after a transient failure', async () => {
    let deleteRequestCount = 0;
    const idempotencyKeys: string[] = [];
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.delete('*/dca/plans/plan-1', ({ request }) => {
        deleteRequestCount += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (deleteRequestCount === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ success: true });
      }),
    );
    analytics.trackPlanDeletion.mockClear();
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

    await user.click(await screen.findByRole('button', { name: 'Xóa kế hoạch' }));
    expect(
      await screen.findByText(
        'Bạn có chắc chắn muốn xóa kế hoạch DCA này? Hành động này không thể hoàn tác.',
      ),
    ).toBeInTheDocument();
    expect(deleteRequestCount).toBe(0);

    await user.click(screen.getByRole('button', { name: /^Xóa$/ }));

    await waitFor(() => expect(deleteRequestCount).toBe(1));
    const confirmDeleteButton = screen.getByRole('button', { name: /^Xóa$/ });
    await waitFor(() => expect(confirmDeleteButton).toBeEnabled());
    await user.click(confirmDeleteButton);

    await waitFor(() => expect(deleteRequestCount).toBe(2));
    expect(idempotencyKeys[0]).toEqual(expect.any(String));
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
    expect(analytics.trackPlanDeletion).toHaveBeenCalledWith('plan-1', 'user_initiated');
  });

  it('reuses the create idempotency key when retrying unchanged form data', async () => {
    const idempotencyKeys: string[] = [];
    let createRequests = 0;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/dca/plans', ({ request }) => {
        createRequests += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (createRequests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({ ...snapshot.plans[0], id: 'plan-created-1' }, { status: 201 });
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
    const submitButton = await screen.findByRole('button', { name: 'Tạo Kế Hoạch' });
    await user.click(submitButton);
    await waitFor(() => expect(createRequests).toBe(1));
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => expect(createRequests).toBe(2));
    expect(idempotencyKeys[0]).toEqual(expect.any(String));
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('keeps DCA plans readable while disabling mutations without dca:write', async () => {
    let mutationCount = 0;
    server.use(
      http.get('*/dca/snapshot', () => HttpResponse.json(snapshot)),
      http.patch('*/dca/plans/plan-1', () => {
        mutationCount += 1;
        return HttpResponse.json({ ...snapshot.plans[0], status: 'paused' });
      }),
      http.delete('*/dca/plans/plan-1', () => {
        mutationCount += 1;
        return HttpResponse.json({ success: true });
      }),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read'],
        },
      },
    };

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
      { authAdapter: readOnlyAdapter },
    );

    expect(await screen.findByText('Mua tự động (DCA)')).toBeInTheDocument();
    await screen.findByRole('button', { name: 'Xóa kế hoạch' });
    expect(screen.getByRole('button', { name: 'Tạo mới' })).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Tạm dừng' })) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Xóa kế hoạch' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Tạo kế hoạch mới' })).not.toBeInTheDocument();
    expect(mutationCount).toBe(0);
  });
});
