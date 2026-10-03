import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { EarnSnapshot } from '../model/earn-types';
import { EarnPage } from './EarnPage';
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

function renderEarn(
  authAdapter: AuthAdapter = testAuthAdapter,
  domain: 'savings' | 'staking' = 'savings',
) {
  return renderWithProviders(
    <Routes>
      <Route path="/earn/:domain" element={<EarnPage domain={domain} />} />
      <Route path="/earn/:domain/receipt" element={<EarnReceiptPage />} />
    </Routes>,
    { authAdapter, routerProps: { initialEntries: [`/earn/${domain}`] } },
  );
}

describe('Earn page contract boundary', () => {
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
});
