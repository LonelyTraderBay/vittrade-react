import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { EarnSnapshot } from '../model/earn-types';
import { EarnPage } from './EarnPage';
import { EarnReceiptPage } from './EarnTransactionPages';

const { successHaptic } = vi.hoisted(() => ({ successHaptic: vi.fn() }));
vi.mock('@/shared/hooks/useHaptic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/hooks/useHaptic')>();
  return {
    ...actual,
    useHaptic: () => ({ ...actual.useHaptic(), hapticSuccess: successHaptic }),
  };
});

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  successHaptic.mockClear();
});
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
      amount: 500,
      earned: 12.5,
      apy: 8.5,
      startDate: '2026-09-01T00:00:00.000Z',
      type: 'flexible',
      color: '#10B981',
      riskLevel: 'low',
    },
  ],
  balances: { USDT: 1_000 },
  summary: { totalDepositedUsd: 500, totalEarnedUsd: 12.5, averageApy: 8.5, activePositions: 1 },
};

describe('Earn receipt completion feedback', () => {
  it.each([
    { operation: 'subscribe', status: 'pending' },
    { operation: 'redeem', status: 'pending' },
    { operation: 'subscribe', status: 'completed' },
  ] as const)(
    'emits completion feedback only for $operation/$status',
    async ({ operation, status }) => {
      const redemption = operation === 'redeem';
      server.use(
        http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
        http.post(`*/earn/${redemption ? 'redemptions' : 'subscriptions'}`, async ({ request }) => {
          expect(request.headers.get('Idempotency-Key')).toBeTruthy();
          expect(await request.json()).toEqual(
            redemption
              ? { positionId: 'position-1', amount: 50 }
              : { productId: 'product-1', amount: 100 },
          );
          return HttpResponse.json(
            {
              id: 'receipt-feedback',
              operation,
              productId: 'product-1',
              ...(redemption ? { positionId: 'position-1' } : {}),
              asset: 'USDT',
              amount: redemption ? 50 : 100,
              status,
              createdAt: '2026-09-30T10:00:00.000Z',
            },
            { status: 201 },
          );
        }),
      );
      renderWithProviders(
        <Routes>
          <Route path="/earn/savings" element={<EarnPage domain="savings" />} />
          <Route path="/earn/:domain/receipt" element={<EarnReceiptPage />} />
        </Routes>,
        { routerProps: { initialEntries: ['/earn/savings'] } },
      );
      const user = userEvent.setup();
      if (redemption) {
        await user.click(await screen.findByRole('tab', { name: 'Của tôi (1)' }));
        await user.click(await screen.findByRole('button', { name: 'Rút vốn' }));
      } else {
        await user.click(await screen.findByRole('button', { name: /Stable Savings/i }));
      }
      await user.type(screen.getByRole('textbox', { name: 'Số lượng' }), redemption ? '50' : '100');
      if (!redemption) await user.click(screen.getByRole('checkbox'));
      await user.click(
        screen.getByRole('button', { name: redemption ? 'Xác nhận rút vốn' : /Xác nhận đăng ký/i }),
      );
      if (status === 'pending') {
        expect(
          await screen.findByRole('heading', { name: 'Yêu cầu đang xử lý' }),
        ).toBeInTheDocument();
        expect(screen.getByText('receipt-feedback')).toBeInTheDocument();
        expect(successHaptic).not.toHaveBeenCalled();
      } else {
        expect(await screen.findByText('Đăng ký sản phẩm thành công.')).toBeInTheDocument();
        expect(successHaptic).toHaveBeenCalledTimes(1);
      }
    },
  );
});
