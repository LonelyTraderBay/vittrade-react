import { expect, test } from '@playwright/test';

const pair = {
  id: 'btc-usdt',
  symbol: 'BTC/USDT',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  price: 65_000,
  prevPrice: 64_000,
  change24h: 1.56,
  high24h: 66_000,
  low24h: 63_000,
  volume24h: 1_000_000_000,
  marketCap: 1_200_000_000_000,
  sparklineData: [64_000, 64_500, 65_000],
  logoColor: '#F7931A',
  isFavorite: false,
  category: 'Layer 1',
};

const assets = {
  items: [
    {
      id: 'asset-btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 1,
      available: 1,
      frozen: 0,
      inOrder: 0,
      usdValue: 65_000,
      change24h: 1.56,
      logoColor: '#F7931A',
    },
    {
      id: 'asset-usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 100_000,
      available: 100_000,
      frozen: 0,
      inOrder: 0,
      usdValue: 100_000,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: {
    totalUsd: 165_000,
    totalBtc: 1,
    availableUsd: 165_000,
    inOrderUsd: 0,
    frozenUsd: 0,
  },
};

const candles = {
  items: [
    { time: 1_700_000_000, open: 64_000, high: 65_000, low: 63_500, close: 64_500, volume: 100 },
    { time: 1_700_003_600, open: 64_500, high: 65_500, low: 64_000, close: 65_000, volume: 120 },
  ],
  updatedAt: '2026-09-22T10:00:00.000Z',
};

const session = {
  user: {
    id: 'e2e-user',
    email: 'e2e@example.com',
    fullName: 'E2E User',
    roles: ['user'],
    permissions: ['trade:read', 'trade:write'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'e2e-memory-token',
};

test.describe('trading contract smoke on staging build', () => {
  test('places an order through the production route and preserves the receipt transition', async ({
    page,
  }) => {
    let placedOrderBody: Record<string, unknown> | undefined;
    let placedOrderIdempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/market/pairs**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/market/pairs')) return route.fulfill({ json: { items: [pair] } });
      if (pathname.endsWith('/candles')) return route.fulfill({ json: candles });
      return route.fulfill({ json: pair });
    });
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/trading/orders**', async (route) => {
      const request = route.request();
      if (request.method() === 'GET') return route.fulfill({ json: { items: [] } });

      placedOrderBody = request.postDataJSON() as Record<string, unknown>;
      placedOrderIdempotencyKey = request.headerValue('Idempotency-Key') ?? undefined;
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-order-1',
          symbol: 'BTC/USDT',
          side: 'buy',
          type: 'limit',
          price: 65_000,
          amount: 0.1,
          filled: 0,
          status: 'open',
          createdAt: '2026-09-22T10:00:00.000Z',
          fee: 6.5,
        },
      });
    });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/auth/session'),
    );
    await page.goto('/w/trade/btc-usdt');
    await expect((await sessionResponse).ok()).toBeTruthy();
    await expect(page.getByText('BTC/USDT').first()).toBeVisible();

    const amountInput = page.getByTestId('trade-amount');
    await expect(amountInput).toBeVisible();
    await amountInput.fill('0.1');
    await expect(amountInput).toHaveValue('0.1');
    const placeButton = page.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i });
    await expect(placeButton).toBeEnabled();
    await page.waitForFunction(() => {
      const button = document.querySelector<HTMLButtonElement>('button[aria-label*="BTC/USDT"]');
      if (!button || button.disabled) return false;
      button.click();
      return true;
    });
    // The confirmation sheet uses a spring transform; dispatch the semantic click
    // from the browser event loop after the mounted button is attached and enabled.
    await expect(page.getByTestId('trade-confirm-submit')).toBeVisible();
    await page.waitForFunction(() => {
      const submit = document.querySelector<HTMLButtonElement>(
        '[data-testid="trade-confirm-submit"]',
      );
      if (!submit || submit.disabled) return false;
      submit.click();
      return true;
    });

    await expect
      .poll(() => placedOrderBody)
      .toMatchObject({
        symbol: 'BTC/USDT',
        side: 'buy',
        type: 'limit',
        amount: 0.1,
        price: 65_000,
      });
    expect(placedOrderIdempotencyKey).toBeTruthy();
    await expect(page).toHaveURL(/\/trade\/order-receipt$/);
  });

  test('cancels an open order with an idempotency key', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let cancelledOrderId: string | undefined;
    let idempotencyKey: string | undefined;
    const openOrder = {
      id: 'e2e-open-order',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      price: 65_000,
      amount: 0.1,
      filled: 0,
      status: 'open',
      createdAt: '2026-09-22T10:00:00.000Z',
      fee: 6.5,
    };

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/market/pairs**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/market/pairs')) return route.fulfill({ json: { items: [pair] } });
      if (pathname.endsWith('/candles')) return route.fulfill({ json: candles });
      return route.fulfill({ json: pair });
    });
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/trading/orders**', (route) =>
      route.fulfill({ json: { items: [openOrder] } }),
    );
    await page.route('https://e2e.invalid/trading/orders/e2e-open-order/cancel', async (route) => {
      cancelledOrderId = 'e2e-open-order';
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({ json: { ...openOrder, status: 'cancelled' } });
    });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/auth/session'),
    );
    await page.goto('/trade/btc-usdt');
    await expect((await sessionResponse).ok()).toBeTruthy();
    await expect(page.getByText('BTC/USDT').first()).toBeVisible();
    await page.getByRole('tab').nth(1).click();
    const cancelButton = page.getByTestId('cancel-order-e2e-open-order');
    await expect(cancelButton).toBeEnabled();
    await cancelButton.click();

    await expect.poll(() => cancelledOrderId).toBe('e2e-open-order');
    expect(idempotencyKey).toBeTruthy();
  });

  test('modifies an open order with positive values and an idempotency key', async ({ page }) => {
    page.on('pageerror', (error) => console.error(`[pageerror] ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') console.error(`[browser error] ${message.text()}`);
    });
    let modifiedOrderBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;
    const openOrder = {
      id: 'e2e-modify-order',
      symbol: 'BTC/USDT',
      side: 'buy',
      type: 'limit',
      price: 65_000,
      amount: 0.1,
      filled: 0,
      status: 'open',
      createdAt: '2026-09-22T10:00:00.000Z',
      fee: 6.5,
    };

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/market/pairs**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/market/pairs')) return route.fulfill({ json: { items: [pair] } });
      if (pathname.endsWith('/candles')) return route.fulfill({ json: candles });
      return route.fulfill({ json: pair });
    });
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/trading/orders**', (route) =>
      route.fulfill({ json: { items: [openOrder] } }),
    );
    await page.route('**/trading/orders/e2e-modify-order', async (route) => {
      if (route.request().method() !== 'PATCH') return route.continue();
      modifiedOrderBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({ json: { ...openOrder, ...modifiedOrderBody } });
    });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/auth/session'),
    );
    await page.goto('/trade/btc-usdt');
    await expect((await sessionResponse).ok()).toBeTruthy();
    await expect(page.getByText('BTC/USDT').first()).toBeVisible();
    await page.getByRole('tab', { name: /Đang mở/ }).click();
    await expect(page.getByRole('tab', { name: /Đang mở/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('button', { name: 'Sửa' }).click();
    await expect(page.getByRole('dialog', { name: 'Sửa lệnh' })).toBeVisible();

    await page.getByTestId('trade-modify-price').fill('66000');
    await expect(page.getByTestId('trade-modify-price')).toHaveValue('66000');
    await page.getByTestId('trade-modify-amount').fill('0.25');
    await expect(page.getByRole('dialog', { name: 'Sửa lệnh' })).toBeVisible();
    const saveButton = page.getByTestId('trade-modify-submit');
    await expect(saveButton).toBeEnabled();
    await saveButton.press('Enter');

    await expect.poll(() => modifiedOrderBody).toEqual({ price: 66_000, amount: 0.25 });
    expect(idempotencyKey).toBeTruthy();
  });

  test('stops a copy relationship through the contract boundary', async ({ page }) => {
    let stopBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;
    const provider = {
      id: 'e2e-provider-1',
      name: 'E2E Provider',
      avatar: 'EP',
      winRate: 62,
      totalPnl: 1_250,
      totalPnlPct: 12.5,
      aum: 250_000,
      copiers: 48,
      maxCopiers: 100,
      sharpeRatio: 1.8,
      maxDrawdown: 8.5,
      totalTrades: 120,
      avgHoldingTime: '4h',
      weeklyPnl: [1, 2, -1, 3],
      tags: ['swing'],
      isFollowing: true,
      riskLevel: 'medium',
      verified: true,
    };
    const relationship = {
      id: 'e2e-copy-relationship',
      provider,
      status: 'active',
      copyMode: 'mirror',
      positionSizing: 'percentage',
      copyRatio: 50,
      capital: 1_000,
      currentValue: 1_050,
      pnl: 50,
      pnlPct: 5,
      trades: 12,
      winRate: 62,
      hasCustomStopLoss: false,
      performanceHistory: [{ date: '2026-09-22T10:00:00.000Z', value: 1_050 }],
    };

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/trading/copy/relationships', (route) =>
      route.fulfill({ json: { items: [relationship] } }),
    );
    await page.route(
      'https://e2e.invalid/trading/copy/relationships/e2e-copy-relationship/stop',
      async (route) => {
        stopBody = route.request().postDataJSON() as Record<string, unknown>;
        idempotencyKey = route.request().headers()['idempotency-key'];
        return route.fulfill({ json: { ...relationship, status: 'stopped' } });
      },
    );

    await page.goto('/trade/copy-trading/active');
    await expect(page.getByText('E2E Provider')).toBeVisible();
    await page.getByLabel('Lý do dừng E2E Provider').fill('Reduce exposure');
    await page.getByRole('button', { name: 'Dừng' }).click();

    await expect
      .poll(() => stopBody)
      .toEqual({
        reason: 'Reduce exposure',
        closeOpenPositions: true,
      });
    expect(idempotencyKey).toBeTruthy();
  });

  test('completes the copy provider assessment and activation flow', async ({ page }) => {
    let configurationBody: Record<string, unknown> | undefined;
    let activationKey: string | undefined;
    let relationship: Record<string, unknown> | undefined;
    const provider = {
      id: 'e2e-flow-provider',
      name: 'Flow Provider',
      avatar: 'FP',
      winRate: 62,
      totalPnl: 1_250,
      totalPnlPct: 12.5,
      aum: 250_000,
      copiers: 48,
      maxCopiers: 100,
      sharpeRatio: 1.8,
      maxDrawdown: 8.5,
      totalTrades: 120,
      avgHoldingTime: '4h',
      weeklyPnl: [1, 2, -1, 3],
      tags: ['swing'],
      isFollowing: true,
      riskLevel: 'medium',
      verified: true,
    };
    const providerProfile = { provider, pnlHistory: [], recentTrades: [] };
    const makeRelationship = (status: string) => ({
      id: 'e2e-flow-relationship',
      provider,
      status,
      copyMode: 'mirror',
      positionSizing: 'percentage',
      copyRatio: 50,
      capital: 2_000,
      currentValue: 2_000,
      pnl: 0,
      pnlPct: 0,
      trades: 0,
      winRate: 0,
      hasCustomStopLoss: false,
      performanceHistory: [{ date: '2026-09-22T10:00:00.000Z', value: 2_000 }],
    });

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/trading/copy/providers**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      return route.fulfill({
        json: pathname.endsWith('/providers') ? { items: [provider] } : providerProfile,
      });
    });
    await page.route('https://e2e.invalid/trading/copy/relationships', async (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ json: { items: relationship ? [relationship] : [] } });
      }

      configurationBody = route.request().postDataJSON() as Record<string, unknown>;
      activationKey = route.request().headers()['idempotency-key'];
      relationship = makeRelationship('active');
      return route.fulfill({
        status: 201,
        json: { copyId: 'e2e-flow-relationship', status: 'active' },
      });
    });

    await page.goto('/trade/copy-trading');
    await page.getByRole('button', { name: 'Xem chi tiết' }).click();
    await page.getByRole('button', { name: /Đánh giá trước khi copy/ }).click();
    await expect(page.getByRole('heading', { name: 'Xác nhận hiểu rủi ro' })).toBeVisible();
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
    await page.getByRole('button', { name: 'Tiếp tục cấu hình' }).click();

    await page.getByLabel('Số vốn copy (USD)').fill('2000');
    await page.getByRole('button', { name: 'Xem xác nhận' }).click();
    await expect(page.getByText('Xác nhận bắt buộc')).toBeVisible();
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
    await page.getByRole('button', { name: 'Xác nhận & Bắt đầu Copy' }).click();

    await expect(page).toHaveURL(/\/trade\/copy-trading\/active$/);
    await expect(page.getByText('Flow Provider')).toBeVisible();
    await expect
      .poll(() => configurationBody)
      .toEqual({
        providerId: 'e2e-flow-provider',
        capital: 2_000,
        copyMode: 'mirror',
        positionSizing: 'percentage',
        copyRatio: 50,
      });
    expect(activationKey).toBeTruthy();

    await page.goto('/w/trade/copy/performance/e2e-flow-relationship');
    await expect(page.getByText('Lịch sử giá trị')).toBeVisible();
    await expect(page.getByText('$2,000')).toBeVisible();
  });
});
