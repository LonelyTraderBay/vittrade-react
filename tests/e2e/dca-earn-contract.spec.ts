import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'e2e-yield-user',
    email: 'yield@example.com',
    fullName: 'Yield E2E User',
    roles: ['user'],
    permissions: ['dca:read', 'dca:write', 'earn:read', 'earn:subscribe', 'earn:redeem'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'yield-e2e-memory-token',
};

const dcaPlan = {
  id: 'dca-plan-1',
  coinSymbol: 'BTC',
  coinName: 'Bitcoin',
  coinIcon: '₿',
  frequency: 'weekly',
  amountPerPurchase: 100_000,
  nextExecution: '2026-09-24T10:00:00.000Z',
  status: 'active',
  totalInvested: 1_000_000,
  currentHoldings: 0.01,
  averageCost: 100_000_000,
  createdAt: '2026-09-01T10:00:00.000Z',
};

const earnProduct = {
  id: 'earn-product-1',
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
};

test.describe('DCA and Earn contract smoke on staging build', () => {
  test('creates, pauses and cancels a DCA plan through the contract boundary', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let currentPlan: typeof dcaPlan | undefined = dcaPlan;
    let createBody: Record<string, unknown> | undefined;
    let updateBody: Record<string, unknown> | undefined;
    let deleteCalled = false;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/dca/snapshot', (route) =>
      route.fulfill({
        json: {
          overview: {
            currentValue: 1_050_000,
            totalInvested: 1_000_000,
            profitLoss: 50_000,
            profitLossPercent: 5,
            activePlans: currentPlan?.status === 'active' ? 1 : 0,
            pausedPlans: currentPlan?.status === 'paused' ? 1 : 0,
            errorPlans: 0,
            nextExecution: currentPlan ? { relativeTime: 'tomorrow', amount: 100_000 } : null,
          },
          plans: currentPlan ? [currentPlan] : [],
          purchaseHistory: [],
          portfolioHistory: [],
        },
      }),
    );
    await page.route('https://e2e.invalid/dca/plans', async (route) => {
      createBody = route.request().postDataJSON() as Record<string, unknown>;
      currentPlan = { ...dcaPlan, amountPerPurchase: createBody.amountPerPurchase as number };
      return route.fulfill({ status: 201, json: currentPlan });
    });
    await page.route('https://e2e.invalid/dca/plans/dca-plan-1', async (route) => {
      if (route.request().method() === 'PATCH') {
        updateBody = route.request().postDataJSON() as Record<string, unknown>;
        currentPlan = { ...currentPlan!, status: updateBody.status as 'paused' };
        return route.fulfill({ json: currentPlan });
      }
      deleteCalled = true;
      currentPlan = undefined;
      return route.fulfill({ status: 204 });
    });

    await page.goto('/earn/savings/dca');
    await expect(page.getByText('Bitcoin').first()).toBeVisible();
    await page.getByLabel('DCA amount').fill('250000');
    await page.getByRole('button', { name: 'Create DCA plan' }).click();
    await expect
      .poll(() => createBody)
      .toMatchObject({
        coinSymbol: 'BTC',
        frequency: 'weekly',
        amountPerPurchase: 250_000,
      });
    await page.getByRole('button', { name: 'Pause' }).click();
    await expect.poll(() => updateBody).toEqual({ status: 'paused' });
    await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    const confirmCancellation = page.getByRole('button', { name: 'Xác nhận hủy' });
    await expect(confirmCancellation).toBeVisible();
    await confirmCancellation.click({ force: true });
    await expect.poll(() => deleteCalled).toBe(true);
  });

  test('subscribes and redeems through the Earn contract boundary', async ({ page }) => {
    let currentPosition: Record<string, unknown> | undefined;
    let subscribeBody: Record<string, unknown> | undefined;
    let redeemBody: Record<string, unknown> | undefined;
    const snapshot = () => ({
      products: [earnProduct],
      positions: currentPosition ? [currentPosition] : [],
      balances: { USDT: 1_000 },
      summary: {
        totalDepositedUsd: currentPosition ? 100 : 0,
        totalEarnedUsd: 0,
        averageApy: 8.5,
        activePositions: currentPosition ? 1 : 0,
      },
    });

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/earn/snapshot', (route) =>
      route.fulfill({ json: snapshot() }),
    );
    await page.route('https://e2e.invalid/earn/subscriptions', async (route) => {
      subscribeBody = route.request().postDataJSON() as Record<string, unknown>;
      currentPosition = {
        id: 'earn-position-1',
        productId: 'earn-product-1',
        product: 'Stable Savings',
        asset: 'USDT',
        amount: subscribeBody.amount as number,
        earned: 0,
        apy: 8.5,
        startDate: '2026-09-23T10:00:00.000Z',
        type: 'flexible',
        color: '#10B981',
        riskLevel: 'low',
      };
      return route.fulfill({
        status: 201,
        json: {
          id: 'earn-receipt-1',
          operation: 'subscribe',
          productId: 'earn-product-1',
          asset: 'USDT',
          amount: subscribeBody.amount,
          status: 'completed',
          createdAt: '2026-09-23T10:00:00.000Z',
        },
      });
    });
    await page.route('https://e2e.invalid/earn/redemptions', async (route) => {
      redeemBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 201,
        json: {
          id: 'earn-receipt-2',
          operation: 'redeem',
          productId: 'earn-product-1',
          positionId: 'earn-position-1',
          asset: 'USDT',
          amount: redeemBody.amount,
          status: 'completed',
          createdAt: '2026-09-23T10:01:00.000Z',
        },
      });
    });

    await page.goto('/earn/savings');
    await page.getByRole('button', { name: /Stable Savings/i }).click();
    await page.getByRole('textbox', { name: 'Số lượng' }).fill('100');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: /Xác nhận đăng ký/i }).click();
    await expect.poll(() => subscribeBody).toEqual({ productId: 'earn-product-1', amount: 100 });
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.getByRole('tab', { name: /Của tôi/i }).click();
    await expect(page.getByRole('tab', { name: /Của tôi/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByRole('button', { name: /Rút vốn/i })).toBeVisible();
    await page.getByRole('button', { name: /Rút vốn/i }).click();
    await page.getByRole('textbox', { name: 'Số lượng' }).fill('50');
    await page.getByRole('button', { name: /Xác nhận rút vốn/i }).click();
    await expect.poll(() => redeemBody).toEqual({ positionId: 'earn-position-1', amount: 50 });
  });

  test('loads and paginates domain-scoped transactions through the Earn history contract', async ({
    page,
  }) => {
    const receivedCursors: Array<string | null> = [];
    const receivedDomains: Array<string | null> = [];
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/earn/transactions**', async (route) => {
      const url = new URL(route.request().url());
      receivedCursors.push(url.searchParams.get('cursor'));
      const domain = url.searchParams.get('domain');
      receivedDomains.push(domain);
      if (domain === 'staking') {
        return route.fulfill({
          json: {
            items: [
              {
                id: 'staking-history-tx-1',
                domain: 'staking',
                operation: 'subscribe',
                productId: 'stake-product-1',
                product: 'ETH Staking',
                asset: 'ETH',
                amount: 0.1,
                status: 'completed',
                createdAt: '2026-09-22T10:00:00.000Z',
              },
            ],
          },
        });
      }
      expect(domain).toBe('savings');
      return route.fulfill({
        json: url.searchParams.has('cursor')
          ? {
              items: [
                {
                  id: 'history-tx-2',
                  domain: 'savings',
                  operation: 'redeem',
                  productId: 'earn-product-1',
                  product: 'Stable Savings',
                  asset: 'USDT',
                  amount: 50,
                  status: 'completed',
                  createdAt: '2026-09-22T10:00:00.000Z',
                },
              ],
            }
          : {
              items: [
                {
                  id: 'history-tx-1',
                  domain: 'savings',
                  operation: 'subscribe',
                  productId: 'earn-product-1',
                  product: 'Stable Savings',
                  asset: 'USDT',
                  amount: 100,
                  status: 'completed',
                  createdAt: '2026-09-21T10:00:00.000Z',
                },
              ],
              nextCursor: 'history-cursor-2',
            },
      });
    });

    await page.goto('/earn/savings/history');
    await expect(page.getByText('Đăng ký · Stable Savings')).toBeVisible();
    await page.getByRole('button', { name: 'Tải thêm giao dịch' }).click();
    await expect(page.getByText('Rút vốn · Stable Savings')).toBeVisible();
    await expect.poll(() => receivedCursors).toContain('history-cursor-2');

    await page.goto('/earn/history');
    await expect(page.getByText('Lịch sử staking')).toBeVisible();
    await expect(page.getByText('Đăng ký · ETH Staking')).toBeVisible();
    expect(receivedDomains).toContain('staking');
  });
});
