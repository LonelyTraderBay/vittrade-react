import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { useEffect } from 'react';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { useAuth } from '@/shared/session/useAuth';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { EarnSnapshot } from '../model/earn-types';
import { EarnPage, SavingsPage, StakingPage } from './EarnPage';
import { EarnReceiptPage } from './EarnTransactionPages';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const snapshot: EarnSnapshot = {
  products: [
    {
      id: 'product-1',
      domain: 'savings',
      type: 'flexible',
      name: 'Stable Savings',
      asset: 'USDT',
      apy: 8.5,
      minAmount: 10,
      remainingQuota: '1M USDT',
      participants: 100,
      totalStaked: '500000',
      color: '#10B981',
      riskLevel: 'low',
    },
  ],
  positions: [],
  balances: { USDT: 1_000 },
  summary: {
    totalDepositedUsd: 0,
    totalEarnedUsd: 0,
    averageApy: 8.5,
    activePositions: 0,
  },
};

const redemptionSnapshot: EarnSnapshot = {
  ...snapshot,
  positions: [
    {
      id: 'position-1',
      productId: 'product-1',
      product: 'Stable Savings',
      asset: 'USDT',
      amount: 500,
      earned: 12.5,
      apy: 8.5,
      startDate: '2026-09-01T00:00:00.000Z',
      type: 'flexible',
      color: '#10B981',
      riskLevel: 'low',
    },
  ],
  summary: { ...snapshot.summary, totalDepositedUsd: 500, activePositions: 1 },
};

const mixedSnapshot: EarnSnapshot = {
  ...redemptionSnapshot,
  products: [
    ...snapshot.products,
    {
      ...snapshot.products[0],
      id: 'product-defi',
      domain: 'staking',
      type: 'defi',
      name: 'DeFi Yield',
    },
  ],
  positions: [
    {
      ...redemptionSnapshot.positions[0],
      id: 'position-defi',
      productId: 'product-defi',
      product: 'DeFi Yield',
      type: 'flexible',
    },
  ],
};

type RefreshSession = ReturnType<typeof useAuth>['refreshSession'];

function AuthSessionRefreshProbe({ capture }: { capture: (refresh: RefreshSession) => void }) {
  const { refreshSession } = useAuth();
  useEffect(() => {
    capture(refreshSession);
  }, [capture, refreshSession]);
  return null;
}

function createMutableEarnAuthAdapter() {
  const initialSession = testAuthAdapter.initialSession!;
  const permissions = [...initialSession.user.permissions];
  const session = {
    ...initialSession,
    user: { ...initialSession.user, permissions },
  };
  return {
    adapter: {
      ...testAuthAdapter,
      initialSession: session,
      async refresh() {
        return session;
      },
    } satisfies AuthAdapter,
    setPermissions(next: string[]) {
      permissions.splice(0, permissions.length, ...next);
    },
  };
}

function renderEarn(
  authAdapter: AuthAdapter = testAuthAdapter,
  domain: 'savings' | 'staking' = 'savings',
) {
  let refreshFromProvider: RefreshSession = () => Promise.reject(new Error('No session'));
  const view = renderWithProviders(
    <>
      <Routes>
        <Route path="/earn/:domain" element={<EarnPage domain={domain} />} />
        <Route path="/earn/:domain/receipt" element={<EarnReceiptPage />} />
      </Routes>
      <AuthSessionRefreshProbe capture={(refresh) => (refreshFromProvider = refresh)} />
    </>,
    { authAdapter, routerProps: { initialEntries: [`/earn/${domain}`] } },
  );
  return { ...view, refreshSession: () => refreshFromProvider() };
}

describe('Earn page contract boundary', () => {
  it.each(['subscribe', 'redeem'] as const)(
    'guards synchronous duplicate %s and locks the pending action sheet',
    async (operation) => {
      let calls = 0;
      let release!: () => void;
      const pending = new Promise<void>((resolve) => {
        release = resolve;
      });
      server.use(
        http.get('*/earn/snapshot', () => HttpResponse.json(redemptionSnapshot)),
        http.post(
          `*/earn/${operation === 'subscribe' ? 'subscriptions' : 'redemptions'}`,
          async () => {
            calls += 1;
            await pending;
            return HttpResponse.json({
              id: 'receipt-guard',
              operation,
              productId: 'product-1',
              positionId: 'position-1',
              asset: 'USDT',
              amount: 100,
              status: 'completed',
              createdAt: '2026-10-13T10:00:00.000Z',
            });
          },
        ),
      );
      renderEarn();
      await screen.findByRole('button', { name: /Stable Savings/i });
      if (operation === 'redeem') {
        fireEvent.click(screen.getByRole('tab', { name: 'Của tôi (1)' }));
        fireEvent.click(screen.getByRole('button', { name: 'Rút vốn' }));
      } else {
        fireEvent.click(screen.getByRole('button', { name: /Stable Savings/i }));
        fireEvent.click(screen.getByRole('checkbox'));
      }
      fireEvent.change(screen.getByLabelText('Số lượng'), { target: { value: '100' } });
      const submit = screen.getByRole('button', {
        name: operation === 'subscribe' ? 'Xác nhận đăng ký' : 'Xác nhận rút vốn',
      });
      act(() => {
        fireEvent.click(submit);
        fireEvent.click(submit);
      });
      try {
        await waitFor(() => expect(calls).toBe(1));
        expect(screen.getByRole('button', { name: /^Đóng$/ })).toBeDisabled();
        expect(screen.getByLabelText('Số lượng')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'MAX' })).toBeDisabled();
      } finally {
        release();
      }
      expect(
        await screen.findByText(
          operation === 'subscribe'
            ? 'Đăng ký sản phẩm thành công.'
            : 'Yêu cầu rút vốn đã được ghi nhận.',
        ),
      ).toBeInTheDocument();
      expect(calls).toBe(1);
    },
  );

  it('filters each domain, browses back from an empty portfolio, and navigates between wrappers', async () => {
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(mixedSnapshot)));

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/earn/savings" element={<SavingsPage />} />
        <Route path="/earn/staking" element={<StakingPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/earn/savings'] } },
    );

    await screen.findByRole('button', { name: /Stable Savings/i });
    expect(screen.queryByRole('button', { name: /DeFi Yield/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Của tôi (0)' }));
    expect(screen.getByText('Chưa có vị thế')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xem sản phẩm' }));
    expect(screen.getByRole('tab', { name: 'Sản phẩm' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('button', { name: 'Cố định' }));
    expect(screen.queryByRole('button', { name: /Stable Savings/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tất cả' }));
    await user.click(screen.getByRole('button', { name: 'Khám phá Staking' }));

    expect(await screen.findByRole('button', { name: /DeFi Yield/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'DeFi' }));
    expect(screen.getByRole('button', { name: /DeFi Yield/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Khám phá Tiết kiệm' }));
    expect(await screen.findByRole('button', { name: /Stable Savings/i })).toBeInTheDocument();
  });

  it('shows product skeletons while the first snapshot request is pending', async () => {
    server.use(
      http.get('*/earn/snapshot', async () => {
        await new Promise((resolve) => setTimeout(resolve, 80));
        return HttpResponse.json(snapshot);
      }),
    );

    const view = renderEarn();
    expect(view.container.querySelectorAll('.animate-pulse')).toHaveLength(3);
    expect(await screen.findByText('Stable Savings')).toBeInTheDocument();
  });

  it('uses a zero available balance when the snapshot omits the selected asset', async () => {
    server.use(
      http.get('*/earn/snapshot', () =>
        HttpResponse.json({
          ...snapshot,
          products: [{ ...snapshot.products[0], asset: 'BTC', name: 'Bitcoin Savings' }],
          balances: {},
        }),
      ),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('button', { name: /Bitcoin Savings/i }));

    expect(screen.getByText('0 BTC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xác nhận đăng ký/i })).toBeDisabled();
  });

  it('retries a failed snapshot request and renders the recovered products', async () => {
    let attempts = 0;
    server.use(
      http.get('*/earn/snapshot', () => {
        attempts += 1;
        return attempts <= 3
          ? HttpResponse.json({ message: 'Snapshot unavailable' }, { status: 503 })
          : HttpResponse.json(snapshot);
      }),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Stable Savings')).toBeInTheDocument();
    expect(attempts).toBe(4);
  });

  it('subscribes through the typed API with an idempotency key', async () => {
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/earn/subscriptions', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ productId: 'product-1', amount: 100 });
        return HttpResponse.json(
          {
            id: 'receipt-1',
            operation: 'subscribe',
            productId: 'product-1',
            asset: 'USDT',
            amount: 100,
            status: 'completed',
            createdAt: '2026-09-23T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '100');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Xác nhận đăng ký/i }));
    expect(await screen.findByText('Đăng ký sản phẩm thành công.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đóng thông báo' }));
    expect(screen.queryByText('Đăng ký sản phẩm thành công.')).not.toBeInTheDocument();
  });

  it('shows a pending subscription receipt instead of reporting completion', async () => {
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/earn/subscriptions', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ productId: 'product-1', amount: 100 });
        return HttpResponse.json(
          {
            id: 'receipt-pending-subscription',
            operation: 'subscribe',
            productId: 'product-1',
            asset: 'USDT',
            amount: 100,
            status: 'pending',
            createdAt: '2026-09-30T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '100');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Xác nhận đăng ký/i }));

    expect(await screen.findByRole('heading', { name: 'Yêu cầu đang xử lý' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Đang xử lý');
    expect(screen.getByText('receipt-pending-subscription')).toBeInTheDocument();
    expect(screen.queryByText('Đăng ký sản phẩm thành công.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về Tiết kiệm' })).toBeInTheDocument();
  });

  it('shows a pending redemption receipt instead of reporting completion', async () => {
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(redemptionSnapshot)),
      http.post('*/earn/redemptions', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ positionId: 'position-1', amount: 50 });
        return HttpResponse.json(
          {
            id: 'receipt-pending-redemption',
            operation: 'redeem',
            productId: 'product-1',
            positionId: 'position-1',
            asset: 'USDT',
            amount: 50,
            status: 'pending',
            createdAt: '2026-09-30T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('tab', { name: 'Của tôi (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Rút vốn' }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '50');
    await user.click(screen.getByRole('button', { name: 'Xác nhận rút vốn' }));

    expect(await screen.findByRole('heading', { name: 'Yêu cầu đang xử lý' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Đang xử lý');
    expect(screen.getByText('receipt-pending-redemption')).toBeInTheDocument();
    expect(screen.queryByText('Yêu cầu rút vốn đã được ghi nhận.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về Tiết kiệm' })).toBeInTheDocument();
  });

  it('returns to Staking after showing a pending staking receipt', async () => {
    server.use(
      http.get('*/earn/snapshot', () =>
        HttpResponse.json({
          ...snapshot,
          products: snapshot.products.map((product) => ({ ...product, domain: 'staking' })),
        }),
      ),
      http.post('*/earn/subscriptions', () =>
        HttpResponse.json(
          {
            id: 'receipt-pending-staking',
            operation: 'subscribe',
            productId: 'product-1',
            asset: 'USDT',
            amount: 100,
            status: 'pending',
            createdAt: '2026-09-30T10:00:00.000Z',
          },
          { status: 201 },
        ),
      ),
    );

    const user = userEvent.setup();
    renderEarn(testAuthAdapter, 'staking');
    await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '100');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Xác nhận đăng ký/i }));

    expect(await screen.findByRole('heading', { name: 'Yêu cầu đang xử lý' })).toBeInTheDocument();
    expect(screen.getByText('receipt-pending-staking')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về Staking' })).toBeInTheDocument();
  });

  it('reuses the subscription idempotency key when retrying an unchanged amount', async () => {
    let attempts = 0;
    const keys: string[] = [];
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/earn/subscriptions', ({ request }) => {
        attempts += 1;
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        return attempts === 1
          ? HttpResponse.json({ message: 'Subscription service unavailable' }, { status: 503 })
          : HttpResponse.json(
              {
                id: 'receipt-1',
                operation: 'subscribe',
                productId: 'product-1',
                asset: 'USDT',
                amount: 100,
                status: 'completed',
                createdAt: '2026-09-23T10:00:00.000Z',
              },
              { status: 201 },
            );
      }),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '100');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /Xác nhận đăng ký/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Subscription service unavailable');
    await user.click(screen.getByRole('button', { name: /Xác nhận đăng ký/i }));

    expect(await screen.findByText('Đăng ký sản phẩm thành công.')).toBeInTheDocument();
    expect(attempts).toBe(2);
    expect(keys[0]).toMatch(/^earn-subscribe-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('prevents over-redemption and reuses the idempotency key when retrying', async () => {
    let attempts = 0;
    const keys: string[] = [];
    const requests: unknown[] = [];
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(redemptionSnapshot)),
      http.post('*/earn/redemptions', async ({ request }) => {
        attempts += 1;
        keys.push(request.headers.get('Idempotency-Key') ?? '');
        requests.push(await request.json());
        return attempts === 1
          ? HttpResponse.json({ message: 'Redemption service unavailable' }, { status: 503 })
          : HttpResponse.json(
              {
                id: 'receipt-2',
                operation: 'redeem',
                productId: 'product-1',
                positionId: 'position-1',
                asset: 'USDT',
                amount: 50,
                status: 'completed',
                createdAt: '2026-09-27T10:00:00.000Z',
              },
              { status: 201 },
            );
      }),
    );

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('tab', { name: 'Của tôi (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Rút vốn' }));

    const amount = screen.getByRole('textbox', { name: 'Số lượng' });
    const submit = screen.getByRole('button', { name: 'Xác nhận rút vốn' });
    await user.type(amount, '501');
    expect(submit).toBeDisabled();

    await user.clear(amount);
    await user.type(amount, '50');
    await user.click(submit);
    expect(await screen.findByRole('alert')).toHaveTextContent('Redemption service unavailable');
    await user.click(submit);

    expect(await screen.findByText('Yêu cầu rút vốn đã được ghi nhận.')).toBeInTheDocument();
    expect(attempts).toBe(2);
    expect(requests).toEqual([
      { positionId: 'position-1', amount: 50 },
      { positionId: 'position-1', amount: 50 },
    ]);
    expect(keys[0]).toMatch(/^earn-redeem-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('keeps product and redemption actions unavailable for read-only users', async () => {
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)));

    renderEarn({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['earn:read'] },
      },
    });

    expect(await screen.findByText('Stable Savings')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Earn actions require the corresponding subscription or redemption permission.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stable Savings/i })).toBeDisabled();
  });

  it('closes subscription and redemption sheets and clears their mutation state', async () => {
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(redemptionSnapshot)));

    const user = userEvent.setup();
    renderEarn();
    await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
    expect(screen.getByRole('dialog', { name: 'Đăng ký sản phẩm' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByRole('dialog', { name: 'Đăng ký sản phẩm' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Của tôi (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Rút vốn' }));
    expect(screen.getByRole('dialog', { name: 'Rút vốn' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByRole('dialog', { name: 'Rút vốn' })).not.toBeInTheDocument();
  });

  it('does not submit after subscription or redemption permission is revoked', async () => {
    let subscriptionAttempts = 0;
    let redemptionAttempts = 0;
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(redemptionSnapshot)),
      http.post('*/earn/subscriptions', () => {
        subscriptionAttempts += 1;
        return HttpResponse.json({ message: 'Must remain uncalled' }, { status: 403 });
      }),
      http.post('*/earn/redemptions', () => {
        redemptionAttempts += 1;
        return HttpResponse.json({ message: 'Must remain uncalled' }, { status: 403 });
      }),
    );

    const user = userEvent.setup();
    const mutableAuth = createMutableEarnAuthAdapter();
    const view = renderEarn(mutableAuth.adapter);
    await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '100');
    await user.click(screen.getByRole('checkbox'));
    mutableAuth.setPermissions(['earn:read']);
    // Session updates originate outside the modal; background fixture buttons must remain inert.
    await act(async () => void (await view.refreshSession()));
    await user.click(screen.getByRole('button', { name: /Xác nhận đăng ký/i }));
    expect(screen.getByRole('dialog', { name: 'Đăng ký sản phẩm' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    mutableAuth.setPermissions(['earn:write']);
    await act(async () => void (await view.refreshSession()));
    await user.click(screen.getByRole('tab', { name: 'Của tôi (1)' }));
    await user.click(await screen.findByRole('button', { name: 'Rút vốn' }));
    await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), '50');
    mutableAuth.setPermissions(['earn:read']);
    await act(async () => void (await view.refreshSession()));
    await user.click(screen.getByRole('button', { name: 'Xác nhận rút vốn' }));

    expect(screen.getByRole('dialog', { name: 'Rút vốn' })).toBeInTheDocument();
    expect(subscriptionAttempts).toBe(0);
    expect(redemptionAttempts).toBe(0);
  });
});
