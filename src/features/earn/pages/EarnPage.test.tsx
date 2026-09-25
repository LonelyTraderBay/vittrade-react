import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { EarnSnapshot } from '../model/earn-types';
import { EarnPage } from './EarnPage';

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

function renderEarn(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(<EarnPage domain="savings" />, { authAdapter });
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
