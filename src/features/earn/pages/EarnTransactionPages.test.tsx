import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter, testAuthSession } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import type { EarnSnapshot } from '../model/earn-types';
import type { EarnPosition } from '../model/earn-types';
import { EarnActionSheet, PositionCard, ProductCard } from '../components/EarnFeatureComponents';
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

function CurrentPath() {
  const location = useLocation();
  return <output aria-label="Current path">{location.pathname}</output>;
}

function adapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthSession,
      user: { ...testAuthSession.user, permissions },
    },
  };
}

function renderEarnRoute(initialEntry: string, authAdapter?: AuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/earn/savings/product/:productId" element={<EarnProductDetailPage />} />
      <Route path="/earn/savings/redeem/:positionId" element={<EarnRedeemPage />} />
      <Route path="/earn/:domain/receipt" element={<EarnReceiptPage />} />
      <Route path="/earn/:domain" element={<CurrentPath />} />
    </Routes>,
    { routerProps: { initialEntries: [initialEntry] }, authAdapter },
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
    renderEarnRoute('/earn/savings/product/product-1', adapterWithPermissions(['earn:subscribe']));

    await user.type(await screen.findByLabelText('Số lượng đăng ký'), '100');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng ký' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Subscription service unavailable');
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng ký' }));

    expect(
      await screen.findByRole('heading', { name: 'Giao dịch đã hoàn tất' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Hoàn tất');
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
                amount: 100,
                status: 'pending',
                createdAt: '2026-09-24T00:00:00.000Z',
              },
              { status: 201 },
            );
      }),
    );
    const user = userEvent.setup();
    renderEarnRoute('/earn/savings/redeem/position-1', adapterWithPermissions(['earn:redeem']));

    await user.type(await screen.findByLabelText('Số lượng rút'), '101');
    const submitButton = screen.getByRole('button', { name: 'Xác nhận rút vốn' });
    expect(submitButton).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'MAX' }));
    expect(screen.getByLabelText('Số lượng rút')).toHaveValue('100');
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);
    expect(await screen.findByRole('alert')).toHaveTextContent('Redemption service unavailable');
    await user.click(submitButton);

    expect(await screen.findByRole('heading', { name: 'Yêu cầu đang xử lý' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Đang xử lý');
    expect(
      screen.queryByRole('heading', { name: 'Giao dịch đã hoàn tất' }),
    ).not.toBeInTheDocument();
    expect(attempts).toBe(2);
    expect(keys[0]).toMatch(/^earn-redeem-/);
    expect(keys[1]).toBe(keys[0]);
  });

  it('shows an actionable empty state when a receipt is opened without navigation state', async () => {
    const user = userEvent.setup();
    renderEarnRoute('/earn/savings/receipt');

    expect(await screen.findByText('Không có biên nhận')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Về Earn' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/earn/savings');
  });

  it('shows the locked-term and zero-balance states without subscribe permission', async () => {
    const user = userEvent.setup();
    const lockedSnapshot: EarnSnapshot = {
      ...snapshot,
      products: snapshot.products.map((product) => ({ ...product, lockDays: 30 })),
      balances: {},
    };
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(lockedSnapshot)));
    renderEarnRoute('/earn/savings/product/product-1', adapterWithPermissions([]));

    expect(
      await screen.findByText(
        'Earn subscription permission is required to subscribe to a product.',
      ),
    ).toBeVisible();
    expect(screen.getByText('30 ngày')).toBeVisible();
    const amount = screen.getByLabelText('Số lượng đăng ký');
    expect(amount).toHaveValue('');
    await user.click(screen.getByRole('button', { name: 'Khả dụng 0 USDT' }));
    expect(amount).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Xác nhận đăng ký' })).toBeDisabled();
  });

  it('retries a failed product snapshot and remains actionable when the product is absent', async () => {
    let attempts = 0;
    server.use(
      http.get('*/earn/snapshot', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ message: 'Earn service unavailable' }, { status: 503 })
          : HttpResponse.json(snapshot);
      }),
    );
    const user = userEvent.setup();
    renderEarnRoute('/earn/savings/product/missing-product');

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    await user.click(retryButton);
    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    expect(attempts).toBeGreaterThan(1);
    expect(screen.queryByRole('button', { name: 'Xác nhận đăng ký' })).not.toBeInTheDocument();
  });

  it('rejects redemption when permission is absent and offers retry for a missing position', async () => {
    const user = userEvent.setup();
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)));
    renderEarnRoute('/earn/savings/redeem/missing-position', adapterWithPermissions([]));

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' });
    await user.click(retryButton);
    expect(await screen.findByText('Có lỗi xảy ra')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Xác nhận rút vốn' })).not.toBeInTheDocument();
  });

  it('disables redemption and explains the missing permission for an available position', async () => {
    server.use(http.get('*/earn/snapshot', () => HttpResponse.json(snapshot)));
    renderEarnRoute('/earn/savings/redeem/position-1', adapterWithPermissions([]));

    expect(
      await screen.findByText('Earn redemption permission is required to redeem a position.'),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Xác nhận rút vốn' })).toBeDisabled();
  });

  it('renders and returns from a completed staking redemption receipt', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/earn/:domain/receipt" element={<EarnReceiptPage />} />
        <Route path="/earn/:domain" element={<CurrentPath />} />
      </Routes>,
      {
        routerProps: {
          initialEntries: [
            {
              pathname: '/earn/staking/receipt',
              state: {
                receipt: {
                  id: 'staking-receipt',
                  operation: 'redeem',
                  productId: 'product-1',
                  positionId: 'position-1',
                  asset: 'USDT',
                  amount: 25,
                  status: 'completed',
                  createdAt: '2026-09-24T00:00:00.000Z',
                },
              },
            },
          ],
        },
      },
    );

    expect(await screen.findByRole('heading', { name: 'Giao dịch đã hoàn tất' })).toBeVisible();
    expect(screen.getByText('Rút vốn')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Hoàn tất');
    await user.click(screen.getByRole('button', { name: 'Về Staking' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/earn/staking');
  });
});

describe('Earn feature components', () => {
  it('renders product badges, lock terms, disabled state, and selection behavior', () => {
    const onDisabledSelect = vi.fn();
    const onSelect = vi.fn();
    const flexibleProduct = {
      ...snapshot.products[0],
      name: 'Flexible Savings',
      type: 'flexible' as const,
      lockDays: 0,
      isHot: false,
      isNew: false,
    };
    const defiProduct = {
      ...snapshot.products[0],
      name: 'DeFi Vault',
      type: 'defi' as const,
      isHot: false,
      isNew: false,
    };
    const fixedProduct = {
      ...snapshot.products[0],
      name: 'Fixed Savings',
      type: 'fixed' as const,
      lockDays: 30,
      isHot: true,
      isNew: true,
    };

    renderWithProviders(
      <>
        <ProductCard product={flexibleProduct} onSelect={onDisabledSelect} disabled />
        <ProductCard product={fixedProduct} onSelect={onSelect} />
        <ProductCard product={defiProduct} onSelect={vi.fn()} />
      </>,
    );

    expect(screen.getAllByText('Linh hoạt')).toHaveLength(2);
    expect(screen.getByText('30 ngày')).toBeInTheDocument();
    expect(screen.getByText('HOT')).toBeInTheDocument();
    expect(screen.getByText('MỚI')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Flexible Savings/ }));
    expect(onDisabledSelect).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Fixed Savings/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('formats missing and invalid position dates and honors redemption eligibility', () => {
    const onRedeem = vi.fn();
    const flexiblePosition = {
      ...snapshot.positions[0],
      product: 'Flexible position',
      startDate: '',
      endDate: undefined,
      type: 'flexible' as const,
    };
    const fixedPosition = {
      ...snapshot.positions[0],
      product: 'Fixed position',
      startDate: 'invalid-date',
      endDate: '2099-01-01T00:00:00.000Z',
      type: 'fixed' as const,
    };
    const datedPosition = {
      ...snapshot.positions[0],
      product: 'Dated position',
      startDate: '2026-09-01T00:00:00.000Z',
      endDate: undefined,
      type: 'fixed' as const,
    };

    renderWithProviders(
      <>
        <PositionCard position={flexiblePosition} onRedeem={onRedeem} />
        <PositionCard position={fixedPosition} onRedeem={onRedeem} canRedeem={false} />
        <PositionCard position={datedPosition} onRedeem={onRedeem} />
      </>,
    );

    expect(screen.getAllByText('Có thể rút linh hoạt')).toHaveLength(2);
    expect(screen.getByText(/invalid-date/)).toBeInTheDocument();
    expect(screen.getByText('Dated position').parentElement).toHaveTextContent(
      new Date(datedPosition.startDate).toLocaleDateString('vi-VN'),
    );
    expect(screen.getByText(/^Còn \d+ ngày$/)).toBeInTheDocument();
    const redeemButton = screen.getByRole('button', { name: 'Rút vốn' });
    expect(redeemButton).toBeEnabled();
    fireEvent.click(redeemButton);
    expect(onRedeem).toHaveBeenCalledTimes(1);
  });

  it('requires agreement before subscribing and submits the selected maximum', async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(
      <EarnActionSheet
        product={snapshot.products[0]}
        balance={250}
        pending={false}
        error="Quota refreshed"
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const amount = screen.getByLabelText('Số lượng');
    const submit = screen.getByRole('button', { name: 'Xác nhận đăng ký' });
    expect(screen.getByRole('alert')).toHaveTextContent('Quota refreshed');
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'MAX' }));
    expect(amount).toHaveValue('250');
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('checkbox'));
    expect(submit).toBeEnabled();
    await user.click(submit);
    expect(onSubmit).toHaveBeenCalledWith(250);
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('omits the action sheet without a target and uses defensive defaults for malformed positions', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    const empty = renderWithProviders(
      <EarnActionSheet balance={0} pending={false} onClose={onClose} onSubmit={onSubmit} />,
    );
    expect(empty.container.firstChild).toBeNull();
    empty.unmount();

    const incompletePosition = {
      ...snapshot.positions[0],
      amount: undefined,
      product: undefined,
    } as unknown as EarnPosition;
    renderWithProviders(
      <EarnActionSheet
        position={incompletePosition}
        balance={100}
        pending={false}
        onClose={onClose}
        onSubmit={onSubmit}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: 'Rút vốn' });
    expect(dialog).toHaveTextContent('USDT');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'MAX' }));
    expect(screen.getByLabelText('Số lượng')).toHaveValue('0');
    expect(screen.getByRole('button', { name: 'Xác nhận rút vốn' })).toBeDisabled();
  });
});
