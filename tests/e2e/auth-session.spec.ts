import { expect, test } from '@playwright/test';

const session = {
  user: {
    id: 'e2e-auth-user',
    email: 'auth@example.com',
    fullName: 'Auth E2E User',
    roles: ['user'],
    permissions: ['market:read', 'wallet:read', 'wallet:write'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'auth-e2e-memory-token',
};

const profile = {
  id: 'e2e-auth-user',
  email: 'auth@example.com',
  phone: '+84 900 000 000',
  fullName: 'Auth E2E User',
  username: 'auth-e2e',
  avatar: null,
  kycLevel: 2,
  kycStatus: 'verified',
  referralCode: 'E2E-AUTH',
  vipLevel: 1,
  joinDate: '2026-01-01',
  has2FA: true,
  totalBalance: 1_000,
};

test.describe('auth session smoke on staging build', () => {
  test('logs in through the auth contract and can sign out', async ({ page }) => {
    let loginBody: Record<string, unknown> | undefined;
    let logoutCalled = false;
    let authenticated = false;

    await page.route('**/auth/session', (route) =>
      route.fulfill({ json: authenticated ? session : null }),
    );
    await page.route('https://e2e.invalid/auth/login', async (route) => {
      loginBody = route.request().postDataJSON() as Record<string, unknown>;
      authenticated = true;
      return route.fulfill({ json: { status: 'authenticated', session } });
    });
    await page.route('**/auth/logout', async (route) => {
      logoutCalled = true;
      authenticated = false;
      return route.fulfill({ status: 204 });
    });
    await page.route('**/market/pairs**', (route) => route.fulfill({ json: { items: [] } }));
    await page.route('https://e2e.invalid/profile', (route) => route.fulfill({ json: profile }));

    await page.goto('/auth/login');
    await page.getByTestId('auth-email').fill('auth@example.com');
    await page.getByTestId('auth-password').fill('correct-password');
    await page.getByTestId('auth-submit').click();

    await expect
      .poll(() => loginBody)
      .toEqual({
        email: 'auth@example.com',
        password: 'correct-password',
      });
    await expect(page).toHaveURL(/\/w\/home$/);

    await page.goto('/w/profile');
    await expect(page.getByTestId('auth-sign-out')).toBeVisible();
    await page.getByTestId('auth-sign-out').click();

    await expect.poll(() => logoutCalled).toBe(true);
    await expect(page).toHaveURL(/\/auth\/login$/);
  });

  test('changes the password through current-password and MFA contract endpoints', async ({
    page,
  }) => {
    let verifyBody: Record<string, unknown> | undefined;
    let changeBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/auth/password/verify-current', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 204 });
    });
    await page.route('**/auth/password/change', async (route) => {
      changeBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({ status: 204 });
    });

    await page.goto('/w/profile/security/change-password');
    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('current-password');
    await page.getByRole('button', { name: 'Xác minh mật khẩu hiện tại' }).click();
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill('SecurePassword123');
    await page.getByLabel('Nhập lại mật khẩu mới', { exact: true }).fill('SecurePassword123');
    await page.getByLabel('Mã xác thực TOTP', { exact: true }).fill('654321');
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();

    await expect(page.getByText('Mật khẩu đã được đổi thành công.')).toBeVisible();
    expect(verifyBody).toEqual({ currentPassword: 'current-password' });
    expect(changeBody).toEqual({
      currentPassword: 'current-password',
      newPassword: 'SecurePassword123',
      mfaCode: '654321',
      mfaMethod: 'totp',
    });
    expect(idempotencyKey).toBeTruthy();
  });

  test('phone login requires the backend challenge before an authenticated session exists', async ({
    page,
  }) => {
    const challenge = {
      id: 'phone-login-challenge-e2e',
      method: 'totp',
      expiresAt: '2099-01-01T00:05:00.000Z',
    };
    let authenticated = false;
    let verifyBody: Record<string, unknown> | undefined;

    await page.route('**/auth/session', (route) =>
      route.fulfill({ json: authenticated ? session : null }),
    );
    await page.route('https://e2e.invalid/auth/login', (route) =>
      route.fulfill({ json: { status: 'mfa_required', challenge } }),
    );
    await page.route('https://e2e.invalid/auth/login/mfa/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      authenticated = true;
      return route.fulfill({ json: session });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/auth/login');
    await page.getByTestId('auth-email').fill('auth@example.com');
    await page.getByTestId('auth-password').fill('correct-password');
    await page.getByTestId('auth-submit').click();

    await expect(page).toHaveURL(/\/auth\/otp$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    const otpInputs = page.locator('input[aria-label^="Ký tự OTP"]');
    await expect(otpInputs).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) await otpInputs.nth(index).fill('1');

    await expect
      .poll(() => verifyBody)
      .toEqual({
        challengeId: challenge.id,
        code: '111111',
      });
    await expect(page).toHaveURL(/\/home$/);
  });

  test('web login requires the backend challenge before an authenticated session exists', async ({
    page,
  }) => {
    const challenge = {
      id: 'web-login-challenge-e2e',
      method: 'email',
      maskedDestination: 'a***@example.com',
      expiresAt: '2099-01-01T00:05:00.000Z',
    };
    let authenticated = false;
    let verifyBody: Record<string, unknown> | undefined;

    await page.route('**/auth/session', (route) =>
      route.fulfill({ json: authenticated ? session : null }),
    );
    await page.route('https://e2e.invalid/auth/login', (route) =>
      route.fulfill({ json: { status: 'mfa_required', challenge } }),
    );
    await page.route('https://e2e.invalid/auth/login/mfa/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      authenticated = true;
      return route.fulfill({ json: session });
    });

    await page.goto('/w/auth/login');
    await page.getByTestId('auth-email').fill('auth@example.com');
    await page.getByTestId('auth-password').fill('correct-password');
    await page.getByTestId('auth-submit').click();

    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    const otpInputs = page.locator('input[maxlength="1"]');
    await expect(otpInputs).toHaveCount(6);
    for (let index = 0; index < 6; index += 1) await otpInputs.nth(index).fill('1');

    await expect
      .poll(() => verifyBody)
      .toEqual({
        challengeId: challenge.id,
        code: '111111',
      });
    await expect(page).toHaveURL(/\/w\/home$/);
  });

  test('expired login challenge returns to login without verifying or authenticating', async ({
    page,
  }) => {
    let verifyCalled = false;
    await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
    await page.route('https://e2e.invalid/auth/login', (route) =>
      route.fulfill({
        json: {
          status: 'mfa_required',
          challenge: {
            id: 'expired-login-challenge-e2e',
            method: 'sms',
            maskedDestination: '+84 •••• 123',
            expiresAt: '2000-01-01T00:00:00.000Z',
          },
        },
      }),
    );
    await page.route('https://e2e.invalid/auth/login/mfa/verify', (route) => {
      verifyCalled = true;
      return route.fulfill({ json: session });
    });

    await page.goto('/auth/login');
    await page.getByTestId('auth-email').fill('auth@example.com');
    await page.getByTestId('auth-password').fill('correct-password');
    await page.getByTestId('auth-submit').click();

    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    expect(verifyCalled).toBe(false);
  });
});
