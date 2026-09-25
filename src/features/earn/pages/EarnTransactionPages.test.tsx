import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { EarnSnapshot } from '../model/earn-types';
import { EarnProductDetailPage, EarnReceiptPage, EarnRedeemPage } from './EarnTransactionPages';

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
  positions: [
    {
      id: 'position-1',
      productId: 'product-1',
      product: 'Stable Savings',
      asset: 'USDT',
      amount: 100,
      earned: 2,
      apy: 8.5,
      startDate: '2026-09-01T00:00:00.000Z',
      type: 'flexible',
      color: '#10B981',
      riskLevel: 'low',
    },
  ],
  balances: { USDT: 1_000 },
  summary: {
    totalDepositedUsd: 100,
    totalEarnedUsd: 2,
    averageApy: 8.5,
    activePositions: 1,
  },
};

function renderEarnRoute(initialEntry: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/earn/savings/product/:productId" element={<EarnProductDetailPage />} />
      <Route path="/earn/savings/redeem/:positionId" element={<EarnRedeemPage />} />
      <Route path="/earn/savings/receipt" element={<EarnReceiptPage />} />
    </Routes>,
    { routerProps: { initialEntries: [initialEntry] } },
  );
}

describe('Earn transaction pages', () => {
  it('preserves the subscription idempotency key across a retry and shows the receipt', async () => {
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
                createdAt: '2026-09-24T00:00:00.000Z',
              },
              { status: 201 },
            );
      }),
    );
    const user = userEvent.setup();
    renderEarnRoute('/earn/savings/product/product-1');

    await user.type(await screen.findByLabelText('Số lượng đăng ký'), '100');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng ký' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Subscription service unavailable');
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng ký' }));

    expect(await screen.findByText('Giao dịch đã ghi nhận')).toBeInTheDocument();
    expect(attempts).toBe(2);
    expect(keys[0]).toMatch(/^earn-subscribe-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('preserves the redemption idempotency key across a retry and shows the receipt', async () => {
    let attempts = 0;
    const keys: string[] = [];
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/earn/redemptions', ({ request }) => {
        attempts += 1;
        keys.push(request.headers.get('Idempotency-Key') ?? '');
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
                status: 'pending',
                createdAt: '2026-09-24T00:00:00.000Z',
              },
              { status: 201 },
            );
      }),
    );
    const user = userEvent.setup();
    renderEarnRoute('/earn/savings/redeem/position-1');

    await user.type(await screen.findByLabelText('Số lượng rút'), '50');
    await user.click(screen.getByRole('button', { name: 'Xác nhận rút vốn' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Redemption service unavailable');
    await user.click(screen.getByRole('button', { name: 'Xác nhận rút vốn' }));

    expect(await screen.findByText('Giao dịch đã ghi nhận')).toBeInTheDocument();
    expect(attempts).toBe(2);
    expect(keys[0]).toMatch(/^earn-redeem-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('shows an actionable empty state when a receipt is opened without navigation state', async () => {
    renderEarnRoute('/earn/savings/receipt');

    expect(await screen.findByText('Không có biên nhận')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Về Earn' })).toBeVisible();
  });
});
