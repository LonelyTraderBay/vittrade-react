import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { EarnSnapshot } from '../model/earn-types';
import { SavingsComparisonContractPage } from './SavingsContractPages';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function product(
  id: string,
  domain: 'savings' | 'staking',
  name: string,
  apy: number,
  riskLevel: 'low' | 'medium' | 'high',
): EarnSnapshot['products'][number] {
  return {
    id,
    domain,
    type: 'flexible',
    name,
    asset: 'USDT',
    apy,
    minAmount: 10,
    remainingQuota: '100K USDT',
    participants: 100,
    totalStaked: '500000',
    color: '#10B981',
    riskLevel,
  };
}

const snapshot: EarnSnapshot = {
  products: [
    product('save-1', 'savings', 'Flexible Savings', 8.5, 'low'),
    product('save-2', 'savings', 'Fixed Savings', 11.2, 'medium'),
    product('save-3', 'savings', 'Stable Savings', 5.4, 'low'),
    product('save-4', 'savings', 'Premium Savings', 13.4, 'high'),
    product('stake-1', 'staking', 'Validator Staking', 18, 'high'),
  ],
  positions: [],
  balances: { USDT: 1_000 },
  summary: {
    totalDepositedUsd: 0,
    totalEarnedUsd: 0,
    averageApy: 0,
    activePositions: 0,
  },
};

function installSnapshot() {
  server.use(http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)));
}

function renderComparison() {
  return renderWithProviders(<SavingsComparisonContractPage />);
}

describe('Savings comparison contract page', () => {
  it('compares only savings products and limits selection to three', async () => {
    installSnapshot();
    const user = userEvent.setup();
    renderComparison();

    expect(await screen.findByText('Chọn tối đa 3 sản phẩm để so sánh.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Validator Staking' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Flexible Savings' }));
    await user.click(screen.getByRole('button', { name: 'Fixed Savings' }));
    await user.click(screen.getByRole('button', { name: 'Stable Savings' }));
    expect(screen.getByText('8.5%')).toBeVisible();
    expect(screen.getByText('11.2%')).toBeVisible();
    expect(screen.getByText('5.4%')).toBeVisible();
    expect(screen.getByText('medium')).toBeVisible();
    expect(screen.getAllByText('10 USDT')).toHaveLength(3);
    expect(screen.getAllByText('100')).toHaveLength(3);

    await user.click(screen.getByRole('button', { name: 'Premium Savings' }));
    expect(screen.queryByText('13.4%')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Flexible Savings' }));
    expect(screen.queryByText('8.5%')).not.toBeInTheDocument();
  });

  it('shows the API error and retries the snapshot request', async () => {
    let requestCount = 0;
    server.use(
      http.get('*/earn/snapshot', () => {
        requestCount += 1;
        return requestCount <= 3
          ? HttpResponse.json({ message: 'Snapshot unavailable' }, { status: 503 })
          : HttpResponse.json(snapshot);
      }),
    );
    renderComparison();

    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    expect(requestCount).toBe(3);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('button', { name: 'Flexible Savings' })).toBeVisible();
    expect(requestCount).toBe(4);
  });
});
