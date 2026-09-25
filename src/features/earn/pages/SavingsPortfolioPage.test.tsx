import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { EarnSnapshot } from '../model/earn-types';
import { SavingsPortfolioPage } from './SavingsPortfolioPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const snapshot: EarnSnapshot = {
  products: [
    {
      id: 'savings-product',
      domain: 'savings',
      type: 'flexible',
      name: 'Stable Savings',
      asset: 'USDT',
      apy: 5.5,
      minAmount: 10,
      remainingQuota: '100,000 USDT',
      participants: 100,
      totalStaked: '500000',
      color: '#10B981',
      riskLevel: 'low',
    },
    {
      id: 'staking-product',
      domain: 'staking',
      type: 'fixed',
      name: 'Validator Stake',
      asset: 'ATOM',
      apy: 8,
      minAmount: 1,
      remainingQuota: '1,000 ATOM',
      participants: 20,
      totalStaked: '5000',
      lockDays: 30,
      color: '#7C3AED',
      riskLevel: 'medium',
    },
  ],
  positions: [
    {
      id: 'savings-position',
      productId: 'savings-product',
      product: 'Stable Savings',
      asset: 'USDT',
      amount: 250,
      earned: 4.25,
      apy: 5.5,
      startDate: '2026-09-01T00:00:00.000Z',
      type: 'flexible',
      color: '#10B981',
      riskLevel: 'low',
    },
    {
      id: 'staking-position',
      productId: 'staking-product',
      product: 'Validator Stake',
      asset: 'ATOM',
      amount: 10,
      earned: 0.2,
      apy: 8,
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: '2026-10-01T00:00:00.000Z',
      type: 'fixed',
      color: '#7C3AED',
      riskLevel: 'medium',
      lockDays: 30,
    },
  ],
  balances: { USDT: 1_000, ATOM: 20 },
  summary: {
    totalDepositedUsd: 500,
    totalEarnedUsd: 5,
    averageApy: 6.75,
    activePositions: 2,
  },
};

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions },
    },
  };
}

describe('Savings portfolio contract page', () => {
  it('shows only savings positions and redeems through the idempotent API boundary', async () => {
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*/earn/redemptions', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ positionId: 'savings-position', amount: 100 });
        return HttpResponse.json(
          {
            id: 'redemption-receipt',
            operation: 'redeem',
            productId: 'savings-product',
            positionId: 'savings-position',
            asset: 'USDT',
            amount: 100,
            status: 'completed',
            createdAt: '2026-09-23T10:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<SavingsPortfolioPage />, {
      authAdapter: adapterWithPermissions(['earn:read', 'earn:redeem']),
    });

    expect(await screen.findByText('Stable Savings')).toBeInTheDocument();
    expect(screen.queryByText('Validator Stake')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rút vốn' }));
    fireEvent.change(screen.getByLabelText('Số lượng'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rút vốn' }));
    expect(await screen.findByText('Yêu cầu rút vốn đã được ghi nhận.')).toBeInTheDocument();
  });

  it('shows a clear empty state when the snapshot has no savings positions', async () => {
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json({ ...snapshot, positions: [] })),
    );

    renderWithProviders(<SavingsPortfolioPage />);

    expect(await screen.findByText('Chưa có vị thế tiết kiệm')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xem sản phẩm' })).toBeInTheDocument();
  });

  it('keeps redemption disabled for read-only sessions', async () => {
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)));

    renderWithProviders(<SavingsPortfolioPage />, {
      authAdapter: adapterWithPermissions(['earn:read']),
    });

    expect(await screen.findByText('Stable Savings')).toBeInTheDocument();
    expect(
      screen.getByText('Earn redemption permission is required to withdraw a flexible position.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rút vốn' })).toBeDisabled();
  });

  it('lets the user retry after a snapshot request fails', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/earn/snapshot', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
          : HttpResponse.json(snapshot);
      }),
    );

    renderWithProviders(<SavingsPortfolioPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Stable Savings')).toBeInTheDocument();
  });
});
