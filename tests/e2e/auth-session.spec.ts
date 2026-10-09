import { expect, test, type Page } from '@playwright/test';

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

async function openWebLoginMfaChallenge(page: Page, challengeId: string): Promise<void> {
  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/login', (route) =>
    route.fulfill({
      json: {
        status: 'mfa_required',
        challenge: {
          id: challengeId,
          method: 'email',
          maskedDestination: 'a***@example.com',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      },
    }),
  );

  await page.goto('/w/auth/login');
  await page.getByTestId('auth-email').fill('auth@example.com');
  await page.getByTestId('auth-password').fill('correct-password');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/w\/auth\/otp$/);
  await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
}

async function submitWebOtp(page: Page, code: string): Promise<void> {
  const otpInputs = page.locator('input[maxlength="1"]');
  await expect(otpInputs).toHaveCount(6);
  for (let index = 0; index < code.length; index += 1) {
    await otpInputs.nth(index).fill(code[index]);
  }
}

test.describe('auth session smoke on staging build', () => {
  test('logs in through the auth contract and can sign out', async ({ page }) => {
    let loginBody: Record<string, unknown> | undefined;
    let logoutCalled = false;
    let authenticated = false;

    await page.route('**/auth/session', (route) =>
      route.fulfill({ json: authenticated ? session : null }),
    );
    await page.route('https://e2e.test/auth/login', async (route) => {
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
    await page.route('https://e2e.test/profile', (route) => route.fulfill({ json: profile }));

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

  test('session HTTP 401 initializes the browser as a guest without an auth error', async ({
    page,
  }) => {
    let sessionCalls = 0;
    await page.route('https://e2e.test/auth/session', async (route) => {
      sessionCalls += 1;
      return route.fulfill({ status: 401 });
    });

    await page.goto('/w/auth/login');

    await expect.poll(() => sessionCalls).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Đăng nhập', exact: true })).toBeVisible();
    await expect(page.getByText('Không thể đăng nhập lúc này. Vui lòng thử lại.')).toHaveCount(0);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    await expect(page).toHaveURL(/\/w\/auth\/login$/);
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
    await page.route('https://e2e.test/auth/login', (route) =>
      route.fulfill({ json: { status: 'mfa_required', challenge } }),
    );
    await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
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
    await page.route('https://e2e.test/auth/login', (route) =>
      route.fulfill({ json: { status: 'mfa_required', challenge } }),
    );
    await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
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
    await page.route('https://e2e.test/auth/login', (route) =>
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
    await page.route('https://e2e.test/auth/login/mfa/verify', (route) => {
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

  test('server-expired login MFA challenge returns to login without authenticating', async ({
    page,
  }) => {
    let verifyBody: Record<string, unknown> | undefined;
    await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 410 });
    });

    await openWebLoginMfaChallenge(page, 'server-expired-login-challenge-e2e');
    await submitWebOtp(page, '111111');

    await expect
      .poll(() => verifyBody)
      .toEqual({
        challengeId: 'server-expired-login-challenge-e2e',
        code: '111111',
      });
    await expect(page).toHaveURL(/\/w\/auth\/login$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });

  test('invalid login MFA code stays on OTP and does not authenticate', async ({ page }) => {
    let verifyBody: Record<string, unknown> | undefined;
    await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 400 });
    });

    await openWebLoginMfaChallenge(page, 'invalid-login-challenge-e2e');
    await submitWebOtp(page, '111111');

    await expect
      .poll(() => verifyBody)
      .toEqual({
        challengeId: 'invalid-login-challenge-e2e',
        code: '111111',
      });
    await expect(page.getByText('Mã xác thực không đúng. Vui lòng kiểm tra lại.')).toBeVisible();
    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });

  test('status-only login MFA rate limit shows retry guidance without claiming an invalid code', async ({
    page,
  }) => {
    let verifyBody: Record<string, unknown> | undefined;
    await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 429 });
    });

    await openWebLoginMfaChallenge(page, 'rate-limited-login-challenge-e2e');
    await submitWebOtp(page, '123456');

    await expect
      .poll(() => verifyBody)
      .toEqual({
        challengeId: 'rate-limited-login-challenge-e2e',
        code: '123456',
      });
    await expect(page.getByText(/Quá nhiều lần xác thực/)).toBeVisible();
    await expect(page.getByText(/Mã xác thực không đúng/)).toHaveCount(0);
    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });

  test('locked login MFA response routes to the account-locked page without authenticating', async ({
    page,
  }) => {
    let verifyBody: Record<string, unknown> | undefined;
    await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 423 });
    });

    await openWebLoginMfaChallenge(page, 'locked-login-challenge-e2e');
    await submitWebOtp(page, '123456');

    await expect
      .poll(() => verifyBody)
      .toEqual({
        challengeId: 'locked-login-challenge-e2e',
        code: '123456',
      });
    await expect(page).toHaveURL(/\/w\/auth\/account-locked$/);
    await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });

  test('unauthorized login response stays on the form without creating a session', async ({
    page,
  }) => {
    let loginBody: Record<string, unknown> | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
    await page.route('https://e2e.test/auth/login', async (route) => {
      loginBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 401 });
    });

    await page.goto('/w/auth/login');
    await page.getByTestId('auth-email').fill('wrong-password@example.com');
    await page.getByTestId('auth-password').fill('incorrect-password');
    await page.getByTestId('auth-submit').click();

    await expect
      .poll(() => loginBody)
      .toEqual({
        email: 'wrong-password@example.com',
        password: 'incorrect-password',
      });
    await expect(page.getByText('Không thể đăng nhập lúc này. Vui lòng thử lại.')).toBeVisible();
    await expect(page).toHaveURL(/\/w\/auth\/login$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    await expect(page.locator('input[maxlength="1"]')).toHaveCount(0);
  });

  test('locked login response routes to the account-locked page without authenticating', async ({
    page,
  }) => {
    await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
    await page.route('https://e2e.test/auth/login', (route) => route.fulfill({ status: 423 }));

    await page.goto('/w/auth/login');
    await page.getByTestId('auth-email').fill('locked@example.com');
    await page.getByTestId('auth-password').fill('correct-password');
    await page.getByTestId('auth-submit').click();

    await expect(page).toHaveURL(/\/w\/auth\/account-locked$/);
    await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });

  test('password reset requests a code, verifies it, and uses the server token', async ({
    page,
  }) => {
    const email = 'reset-user@example.com';
    const code = '123456';
    const resetToken = 'server-issued-reset-token-e2e';
    const newPassword = 'strong-password-123';
    let requestBody: Record<string, unknown> | undefined;
    let verifyBody: Record<string, unknown> | undefined;
    let confirmBody: Record<string, unknown> | undefined;

    await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
    await page.route('https://e2e.test/auth/password-reset/request', async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 204 });
    });
    await page.route('https://e2e.test/auth/password-reset/verify', async (route) => {
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ json: { resetToken } });
    });
    await page.route('https://e2e.test/auth/password-reset/confirm', async (route) => {
      confirmBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 204 });
    });

    await page.goto('/w/auth/forgot-password');
    await page.getByLabel('Email đăng ký').fill(email);
    await page.getByRole('button', { name: 'Gửi mã xác minh' }).click();
    await expect.poll(() => requestBody).toEqual({ email });
    await expect(page.getByRole('heading', { name: 'Nhập mã OTP' })).toBeVisible();

    await page.getByLabel('Mã OTP').fill(code);
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    await expect.poll(() => verifyBody).toEqual({ email, code });

    await page.getByLabel('Mật khẩu mới').fill(newPassword);
    await page.getByLabel('Nhập lại mật khẩu').fill(newPassword);
    await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
    await expect.poll(() => confirmBody).toEqual({ email, resetToken, newPassword });
    await expect(page.getByText('Thành công!')).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  });
});

interface RegistrationE2EProbe {
  requestBody?: Record<string, unknown>;
  idempotencyKey?: string;
  verifyMfaCalls: number;
}

async function submitRegistration(
  page: Page,
  options: {
    channel: 'email' | 'phone';
    contact: string;
    responseStatus: number;
    responseBody?: Record<string, unknown>;
  },
): Promise<RegistrationE2EProbe> {
  const probe: RegistrationE2EProbe = { verifyMfaCalls: 0 };
  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/register', async (route) => {
    probe.requestBody = route.request().postDataJSON() as Record<string, unknown>;
    probe.idempotencyKey = route.request().headers()['idempotency-key'];
    return options.responseBody
      ? route.fulfill({ status: options.responseStatus, json: options.responseBody })
      : route.fulfill({ status: options.responseStatus });
  });
  await page.route('https://e2e.test/auth/mfa/verify', async (route) => {
    probe.verifyMfaCalls += 1;
    return route.fulfill({ status: 401 });
  });

  await page.goto('/w/auth/register');
  if (options.channel === 'phone') {
    await page.getByRole('button', { name: 'Điện thoại', exact: true }).click();
  }
  await page.getByLabel('Họ và tên', { exact: true }).fill('Nguyen An');
  await page
    .getByLabel(options.channel === 'email' ? 'Email' : 'Số điện thoại', { exact: true })
    .fill(options.contact);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('StrongPassword123!');
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('StrongPassword123!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  return probe;
}

test.describe('registration challenge in development API mode', () => {
  test.beforeEach(() => {
    test.skip(
      process.env.VITTRADE_E2E_DEV_AUTH !== 'true',
      'Registration is intentionally pending in the staging and production route trees.',
    );
  });

  test('email registration creates a challenge without starting an authenticated session', async ({
    page,
  }) => {
    const maskedDestination = 'a***@example.com';
    const probe = await submitRegistration(page, {
      channel: 'email',
      contact: 'an@example.com',
      responseStatus: 202,
      responseBody: {
        challengeId: 'email-registration-challenge-e2e',
        channel: 'email',
        maskedDestination,
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });

    expect(probe.requestBody).toEqual({
      fullName: 'Nguyen An',
      channel: 'email',
      contact: 'an@example.com',
      password: 'StrongPassword123!',
      acceptedTerms: true,
    });
    expect(probe.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    await expect(page.getByText(maskedDestination, { exact: true })).toBeVisible();
    await expect(page.locator('input[maxlength="1"]')).toHaveCount(6);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    expect(probe.verifyMfaCalls).toBe(0);
  });

  test('phone registration creates a challenge using the server-masked destination', async ({
    page,
  }) => {
    const maskedDestination = '+84 •••• 0123';
    const probe = await submitRegistration(page, {
      channel: 'phone',
      contact: '+84900000123',
      responseStatus: 202,
      responseBody: {
        challengeId: 'phone-registration-challenge-e2e',
        channel: 'phone',
        maskedDestination,
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });

    expect(probe.requestBody).toEqual({
      fullName: 'Nguyen An',
      channel: 'phone',
      contact: '+84900000123',
      password: 'StrongPassword123!',
      acceptedTerms: true,
    });
    expect(probe.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    await expect(page.getByText(maskedDestination, { exact: true })).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    expect(probe.verifyMfaCalls).toBe(0);
  });

  test('contract-declared registration rejection stays on the registration form', async ({
    page,
  }) => {
    const probe = await submitRegistration(page, {
      channel: 'email',
      contact: 'an@example.com',
      responseStatus: 400,
    });

    expect(probe.requestBody?.channel).toBe('email');
    await expect(page).toHaveURL(/\/w\/auth\/register$/);
    await expect(
      page.getByText('Chưa thể bắt đầu xác minh. Kiểm tra kết nối rồi thử lại.'),
    ).toBeVisible();
    expect(probe.verifyMfaCalls).toBe(0);
  });

  test('registration rate limit gives wait guidance without verifying an OTP', async ({ page }) => {
    const probe = await submitRegistration(page, {
      channel: 'email',
      contact: 'an@example.com',
      responseStatus: 429,
    });

    expect(probe.requestBody?.channel).toBe('email');
    await expect(page).toHaveURL(/\/w\/auth\/register$/);
    await expect(
      page.getByText('Bạn đã gửi quá nhiều yêu cầu. Hãy chờ một lúc rồi thử lại.'),
    ).toBeVisible();
    expect(probe.verifyMfaCalls).toBe(0);
  });
});
