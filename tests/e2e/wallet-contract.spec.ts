import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'e2e-wallet-user',
    email: 'wallet@example.com',
    fullName: 'Wallet E2E User',
    roles: ['user'],
    permissions: ['market:read', 'wallet:read', 'wallet:write'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'wallet-e2e-memory-token',
};

const accounts = {
  items: [
    { id: 'spot', name: 'Spot wallet', balanceUsd: 1_000 },
    { id: 'funding', name: 'Funding wallet', balanceUsd: 500 },
    { id: 'futures', name: 'Futures wallet', balanceUsd: 250 },
  ],
};

const assets = {
  items: [
    {
      id: 'asset-usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 1_000,
      available: 750,
      frozen: 250,
      inOrder: 250,
      usdValue: 1_000,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: {
    totalUsd: 1_000,
    totalBtc: 0.015,
    availableUsd: 750,
    inOrderUsd: 250,
    frozenUsd: 0,
  },
};

const depositNetworks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: '0.00 ETH',
      minDeposit: 10,
      address: '0x1234567890abcdef1234567890abcdef12345678',
      arrivalTime: '~5 minutes',
      confirmations: 12,
    },
  ],
};

const withdrawalNetworks = {
  networks: [
    {
      id: 'ethereum',
      name: 'Ethereum',
      fee: 0.5,
      minWithdraw: 5,
      maxWithdraw: 50,
    },
  ],
};

const addressBookResponse = {
  items: [
    {
      id: 'server-address-1',
      label: 'Contract-owned destination',
      address: 'bc1qserverownedaddress000000000000000000000',
      network: 'Bitcoin',
      asset: 'BTC',
      isFavorite: false,
      createdAt: '2026-09-22T10:00:00.000Z',
      isWhitelisted: true,
    },
  ],
  total: 1,
  whitelistEnabled: true,
};

test.describe('wallet contract smoke on staging build', () => {
  test('submits an internal transfer with an idempotency key', async ({ page }) => {
    let transferBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/accounts', (route) => route.fulfill({ json: accounts }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/wallet/transfers', async (route) => {
      transferBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-transfer-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 25,
          status: 'completed',
          createdAt: '2026-09-22T10:00:00.000Z',
        },
      });
    });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/auth/session'),
    );
    await page.goto('/wallet/transfer');
    await expect((await sessionResponse).ok()).toBeTruthy();
    await expect(page.getByText('Internal transfer').first()).toBeVisible();
    await page.getByTestId('wallet-transfer-amount').fill('25');
    const transferResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/wallet/transfers'),
    );
    await page.getByTestId('wallet-transfer-submit').click();

    await expect((await transferResponse).status()).toBe(201);
    await expect(page.getByRole('status')).toContainText('Transfer submitted');
    expect(transferBody).toEqual({
      fromWallet: 'spot',
      toWallet: 'funding',
      asset: 'USDT',
      amount: 25,
    });
    expect(idempotencyKey).toBeTruthy();
  });

  test('renders server-owned deposit instructions and QR data', async ({ page }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/deposit/networks**', (route) =>
      route.fulfill({ json: depositNetworks }),
    );

    await page.goto('/wallet/deposit/USDT');

    await expect(page.getByLabel('Deposit network')).toHaveValue('ethereum');
    await expect(page.getByLabel('Deposit QR code')).toBeVisible();
    await expect(page.getByText(depositNetworks.networks[0].address)).toBeVisible();
    await expect(page.getByText('12 confirmations')).toBeVisible();
  });

  test('submits a network-limited withdrawal after MFA verification', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let challengeBody: Record<string, unknown> | undefined;
    let verificationBody: Record<string, unknown> | undefined;
    let withdrawalBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/assets', (route) => route.fulfill({ json: assets }));
    await page.route('**/wallet/withdrawal/networks**', (route) =>
      route.fulfill({ json: withdrawalNetworks }),
    );
    await page.route('**/wallet/withdrawals/challenge', async (route) => {
      challengeBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-withdrawal-challenge',
          method: 'totp',
          maskedDestination: 'Authenticator app',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      });
    });
    await page.route('**/wallet/withdrawals/challenge/*/verify', async (route) => {
      verificationBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        json: {
          verificationToken: 'e2e-withdrawal-verification-token',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      });
    });
    await page.route('**/wallet/withdrawals', async (route) => {
      withdrawalBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({
        status: 201,
        json: {
          id: 'e2e-withdrawal-1',
          transactionId: 'e2e-transaction-1',
          asset: 'USDT',
          amount: 50,
          status: 'pending',
          createdAt: '2026-09-24T09:00:00.000Z',
        },
      });
    });

    await page.goto('/wallet/withdraw/USDT');
    await expect(page.getByLabel('Mạng lưới')).toHaveValue('ethereum');
    await page
      .locator('#withdraw-address')
      .fill('wallet-address-long-enough-for-validation-123456');
    await page.getByRole('button', { name: 'Tất cả' }).click();
    await expect(page.locator('#withdraw-amount')).toHaveValue('50.000000');
    await page.getByRole('button', { name: /Tiếp tục/ }).click();
    await page.getByRole('button', { name: /Xác minh 2FA/ }).click({ force: true });

    await expect(page.getByLabel(/Mã xác minh/i)).toBeVisible();
    expect(challengeBody).toEqual({
      asset: 'USDT',
      networkId: 'ethereum',
      address: 'wallet-address-long-enough-for-validation-123456',
      amount: 50,
    });
    await page.getByLabel(/Mã xác minh/i).fill('123456');
    const withdrawalResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/wallet/withdrawals'),
    );
    await page.getByRole('button', { name: /Xác nhận rút tiền/ }).click();

    await expect((await withdrawalResponse).status()).toBe(201);
    await expect(page.getByText('Yêu cầu đã gửi')).toBeVisible({ timeout: 10_000 });
    expect(verificationBody).toEqual({ code: '123456' });
    expect(withdrawalBody).toEqual({
      asset: 'USDT',
      networkId: 'ethereum',
      address: 'wallet-address-long-enough-for-validation-123456',
      amount: 50,
      verificationToken: 'e2e-withdrawal-verification-token',
    });
    expect(idempotencyKey).toBeTruthy();
  });

  test('web address book renders contract data instead of local sample destinations', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/wallet/address-book', (route) =>
      route.fulfill({ json: addressBookResponse }),
    );

    const addressBookResponseReceived = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/wallet/address-book'),
    );
    await page.goto('/w/address-book');

    await expect((await addressBookResponseReceived).ok()).toBeTruthy();
    await expect(page.getByText('Contract-owned destination')).toBeVisible();
    await expect(page.getByText('Binance Main Wallet')).toHaveCount(0);
  });
});
