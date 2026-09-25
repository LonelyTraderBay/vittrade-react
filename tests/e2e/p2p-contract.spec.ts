import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'e2e-p2p-user',
    email: 'p2p@example.com',
    fullName: 'P2P E2E User',
    roles: ['user'],
    permissions: ['market:read', 'p2p:read', 'p2p:write', 'p2p:release'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'p2p-e2e-memory-token',
};

const paidOrder = {
  id: 'p2p-order-1',
  orderNumber: 'P2P-E2E-001',
  adId: 'ad-1',
  type: 'buy',
  asset: 'USDT',
  amount: 100,
  price: 25_000,
  total: 2_500_000,
  currency: 'VND',
  status: 'paid',
  merchant: 'Alpha Merchant',
  merchantId: 'merchant-1',
  counterparty: 'p2p-e2e-user',
  paymentMethod: 'Bank transfer',
  createdAt: '2026-09-22T10:00:00.000Z',
  expiresAt: '2026-09-22T10:30:00.000Z',
  paidAt: '2026-09-22T10:05:00.000Z',
  escrowAmount: 100,
  fee: 0,
};

const dispute = {
  id: 'p2p-dispute-1',
  orderId: paidOrder.id,
  orderNumber: paidOrder.orderNumber,
  reason: 'Payment not confirmed',
  description: 'The transfer was completed but the counterparty has not confirmed it.',
  evidence: ['transfer.png'],
  status: 'under_review',
  createdAt: '2026-09-22T10:00:00.000Z',
  timeline: [
    { time: '2026-09-22T10:00:00.000Z', event: 'Dispute submitted', detail: 'Initial report' },
  ],
  supportMessages: [],
  escalationLevel: 2,
};

test.describe('P2P escrow contract smoke on staging build', () => {
  test('serves the web order-room compatibility URL from the contract-backed orders page', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/p2p/orders**', (route) =>
      route.fulfill({ json: { items: [paidOrder], total: 1 } }),
    );

    for (const pathname of ['/w/p2p/my-orders', '/w/p2p/order-room']) {
      await page.goto(pathname);
      await expect(page.getByText('#P2P-E2E-001')).toBeVisible();
      await expect(page.getByText('My P2P orders')).toBeVisible();
    }
  });

  test('requires release verification and sends an idempotent release mutation', async ({
    page,
  }) => {
    let released = false;
    let releaseBody: Record<string, unknown> | undefined;
    let releaseIdempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/p2p/orders/p2p-order-1', (route) =>
      route.fulfill({ json: { ...paidOrder, status: released ? 'released' : 'paid' } }),
    );
    await page.route('https://e2e.invalid/p2p/orders/p2p-order-1/release/challenge', (route) =>
      route.fulfill({
        status: 201,
        json: {
          id: 'release-challenge-1',
          method: 'totp',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      }),
    );
    await page.route(
      'https://e2e.invalid/p2p/orders/p2p-order-1/release/challenge/release-challenge-1/verify',
      async (route) => {
        expect(route.request().postDataJSON()).toEqual({ code: '123456' });
        return route.fulfill({
          json: {
            verificationToken: 'release-verification-token',
            expiresAt: '2099-01-01T00:05:00.000Z',
          },
        });
      },
    );
    await page.route('https://e2e.invalid/p2p/orders/p2p-order-1/release', async (route) => {
      releaseBody = route.request().postDataJSON() as Record<string, unknown>;
      releaseIdempotencyKey = route.request().headers()['idempotency-key'];
      released = true;
      return route.fulfill({ json: { ...paidOrder, status: 'released' } });
    });

    await page.goto('/p2p/escrow/p2p-order-1');
    await expect(page.getByText('Order #P2P-E2E-001')).toBeVisible();
    await page.getByRole('button', { name: 'Start escrow release' }).click();
    await page.getByRole('textbox', { name: 'Release verification code' }).fill('123456');
    await page.waitForFunction(() => {
      const button = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Verify release code"]',
      );
      if (!button || button.disabled) return false;
      button.click();
      return true;
    });
    await page.waitForFunction(() => {
      const button = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Confirm escrow release"]',
      );
      if (!button || button.disabled) return false;
      button.click();
      return true;
    });

    await expect
      .poll(() => releaseBody)
      .toEqual({
        verificationToken: 'release-verification-token',
      });
    expect(releaseIdempotencyKey).toMatch(/^p2p-escrow-release-p2p-order-1-/);
    await expect(page.getByText('Đã release')).toBeVisible();
  });

  test('supports dispute escalation and messaging through the contract boundary', async ({
    page,
  }) => {
    let currentDispute = dispute;
    let escalationBody: Record<string, unknown> | undefined;
    let messageBody: Record<string, unknown> | undefined;
    let escalationIdempotencyKey: string | undefined;
    let messageIdempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('https://e2e.invalid/p2p/disputes/p2p-dispute-1', (route) =>
      route.fulfill({ json: currentDispute }),
    );
    await page.route('https://e2e.invalid/p2p/disputes/p2p-dispute-1/escalate', async (route) => {
      escalationBody = route.request().postDataJSON() as Record<string, unknown>;
      escalationIdempotencyKey = route.request().headers()['idempotency-key'];
      currentDispute = { ...currentDispute, escalationLevel: 3 };
      return route.fulfill({ json: currentDispute });
    });
    await page.route('https://e2e.invalid/p2p/disputes/p2p-dispute-1/messages', async (route) => {
      messageBody = route.request().postDataJSON() as Record<string, unknown>;
      messageIdempotencyKey = route.request().headers()['idempotency-key'];
      currentDispute = {
        ...currentDispute,
        supportMessages: [
          ...currentDispute.supportMessages,
          { sender: 'user', text: messageBody.text as string, time: '10:05' },
        ],
      };
      return route.fulfill({ json: currentDispute });
    });

    const sessionResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname.endsWith('/auth/session'),
    );
    await page.goto('/p2p/dispute/detail/p2p-dispute-1');
    await expect((await sessionResponse).ok()).toBeTruthy();
    await expect(page.getByText('Payment not confirmed')).toBeVisible();

    await page.getByRole('button', { name: 'Escalate dispute' }).click();
    await expect.poll(() => escalationBody).toEqual({ level: 3 });
    expect(escalationIdempotencyKey).toMatch(/^p2p-dispute-escalate-/);
    await expect(page.getByText('Cấp 3/4')).toBeVisible();

    const messageInput = page.getByRole('textbox', { name: 'Dispute support message' });
    await messageInput.fill('Additional context');
    await expect(messageInput).toHaveValue('Additional context');
    await expect(page.getByRole('button', { name: 'Send dispute message' })).toBeEnabled();
    await page.waitForFunction(() => {
      const button = document.querySelector<HTMLButtonElement>(
        'button[aria-label="Send dispute message"]',
      );
      if (!button || button.disabled) return false;
      button.click();
      return true;
    });
    await expect.poll(() => messageBody).toEqual({ text: 'Additional context' });
    expect(messageIdempotencyKey).toMatch(/^p2p-dispute-message-/);
    await expect(page.getByText('Additional context')).toBeVisible();
  });
});
