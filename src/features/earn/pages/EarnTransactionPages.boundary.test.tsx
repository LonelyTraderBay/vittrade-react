import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { EarnSnapshot } from '../model/earn-types';
import { EarnProductDetailPage, EarnRedeemPage } from './EarnTransactionPages';
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

const cases = [
  {
    operation: 'subscribe',
    endpoint: '/earn/subscriptions',
    route: '/earn/savings/product/product-1',
    path: '/earn/savings/product/:productId',
    label: 'Xác nhận đăng ký',
    input: 'Số lượng đăng ký',
    element: <EarnProductDetailPage />,
  },
  {
    operation: 'redeem',
    endpoint: '/earn/redemptions',
    route: '/earn/savings/redeem/position-1',
    path: '/earn/savings/redeem/:positionId',
    label: 'Xác nhận rút vốn',
    input: 'Số lượng rút',
    element: <EarnRedeemPage />,
  },
];
function renderIntent(item: (typeof cases)[number]) {
  return renderWithProviders(
    <Routes>
      <Route path={item.path} element={item.element} />
    </Routes>,
    { routerProps: { initialEntries: [item.route] } },
  );
}
async function prepare(item: (typeof cases)[number]) {
  await userEvent.type(await screen.findByLabelText(item.input), '100');
  if (item.operation === 'subscribe') await userEvent.click(screen.getByRole('checkbox'));
}
describe('Earn direct intent boundaries', () => {
  it.each(cases)('serializes a same-turn $operation and freezes its input', async (item) => {
    let releaseResponse!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    let posts = 0;
    server.use(
      http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
      http.post('*' + item.endpoint, async () => {
        posts += 1;
        await gate;
        return HttpResponse.json({ message: 'Temporary failure' }, { status: 503 });
      }),
    );
    renderIntent(item);
    await prepare(item);
    const button = screen.getByRole('button', { name: item.label });
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    try {
      await waitFor(() => expect(posts).toBeGreaterThan(0));
      expect(screen.getByLabelText(item.input)).toBeDisabled();
      if (item.operation === 'subscribe') expect(screen.getByRole('checkbox')).toBeDisabled();
      else expect(screen.getByRole('button', { name: 'MAX' })).toBeDisabled();
    } finally {
      releaseResponse();
    }
    await screen.findByRole('alert');
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(posts).toBe(1);
  });
  it.each(cases)(
    'reuses the $operation key when returning to an unconfirmed amount',
    async (item) => {
      const keys: string[] = [];
      server.use(
        http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)),
        http.post('*' + item.endpoint, ({ request }) => {
          keys.push(request.headers.get('Idempotency-Key')!);
          return HttpResponse.error();
        }),
      );
      renderIntent(item);
      await prepare(item);
      const button = screen.getByRole('button', { name: item.label });
      await userEvent.click(button);
      await screen.findByRole('alert');
      await waitFor(() => expect(button).not.toBeDisabled());
      const amount = screen.getByLabelText(item.input);
      await userEvent.clear(amount);
      await userEvent.type(amount, '50');
      await userEvent.clear(amount);
      await userEvent.type(amount, '100');
      await userEvent.click(button);
      await waitFor(() => expect(keys).toHaveLength(2));
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(keys[1]).toBe(keys[0]);
    },
  );
  it('rejects a snapshot whose minimum amount violates the contract', async () => {
    server.use(
      http.get('*/earn/snapshot', () =>
        HttpResponse.json({
          ...snapshot,
          products: snapshot.products.map((p) => ({ ...p, minAmount: 0 })),
        }),
      ),
    );
    renderIntent(cases[0]);
    await screen.findByRole('button', { name: 'Thử lại' });
    expect(screen.queryByLabelText(cases[0].input)).not.toBeInTheDocument();
  });
});
