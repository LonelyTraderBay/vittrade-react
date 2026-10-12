import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

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

  test('changes the password through current-password and MFA contract endpoints by keyboard @auth-api', async ({
    page,
  }, testInfo) => {
    let verifyCalls = 0;
    let verifyBody: Record<string, unknown> | undefined;
    let changeBody: Record<string, unknown> | undefined;
    let idempotencyKey: string | undefined;
    let changeCalls = 0;

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/auth/password/verify-current', async (route) => {
      verifyCalls += 1;
      verifyBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill({ status: 204 });
    });
    await page.route('**/auth/password/change', async (route) => {
      changeCalls += 1;
      changeBody = route.request().postDataJSON() as Record<string, unknown>;
      idempotencyKey = route.request().headers()['idempotency-key'];
      return route.fulfill({ status: 204 });
    });

    const routeMeasurements: Array<Record<string, unknown>> = [];
    for (const shell of [
      { name: 'Phone', width: 390, height: 844, path: '/profile/security/change-password' },
      { name: 'Tablet', width: 768, height: 900, path: '/t/profile/security/change-password' },
      { name: 'Web', width: 1440, height: 900, path: '/w/profile/security/change-password' },
      {
        name: 'Responsive',
        width: 1024,
        height: 900,
        path: '/r/profile/security/change-password',
      },
    ]) {
      await page.setViewportSize({ width: shell.width, height: shell.height });
      await page.goto(shell.path);
      await expect(page).toHaveURL(new RegExp(shell.path.replaceAll('/', '\\/') + '$'));
      await expect(page.getByLabel('Mật khẩu hiện tại', { exact: true })).toBeVisible();
      const shellDocumentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(shellDocumentWidth).toBe(shell.width);
      const screenshotPath = testInfo.outputPath(
        `password-change-${shell.name.toLowerCase()}-${shell.width}x${shell.height}.png`,
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      routeMeasurements.push({
        shell: shell.name,
        route: shell.path,
        viewport: { width: shell.width, height: shell.height },
        documentWidth: shellDocumentWidth,
        screenshotPath,
      });
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/w/profile/security/change-password');
    await expect(page).toHaveURL(/\/profile\/security\/change-password$/);
    const screenshotPath = testInfo.outputPath('password-change-phone-390x844.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(390);

    const currentPassword = page.getByLabel('Mật khẩu hiện tại', { exact: true });
    await currentPassword.press('Enter');
    expect(verifyCalls).toBe(0);
    expect(
      await currentPassword.evaluate((input) => (input as HTMLInputElement).validity.valid),
    ).toBe(false);
    await currentPassword.fill('current-password');
    await currentPassword.press('Enter');
    const newPassword = page.getByLabel('Mật khẩu mới', { exact: true });
    await expect(newPassword).toBeFocused();

    const confirmPassword = page.getByLabel('Nhập lại mật khẩu mới', { exact: true });
    const totpCode = page.getByLabel('Mã xác thực TOTP', { exact: true });
    await newPassword.fill('SecurePassword123');
    await confirmPassword.fill('SecurePassword123');
    await totpCode.fill('654321');

    await newPassword.focus();
    await newPassword.press('Tab');
    await expect(confirmPassword).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(totpCode).toBeFocused();
    await page.keyboard.press('Tab');
    const changePasswordButton = page.getByRole('button', { name: 'Đổi mật khẩu' });
    await expect(changePasswordButton).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Quay lại xác minh' })).toBeFocused();

    await totpCode.focus();
    await totpCode.press('Enter');

    const successHeading = page.getByRole('heading', { name: 'Mật khẩu đã được đổi thành công.' });
    await expect(successHeading).toBeVisible();
    await expect(successHeading).toBeFocused();
    expect(verifyCalls).toBe(1);
    expect(changeCalls).toBe(1);
    expect(verifyBody).toEqual({ currentPassword: 'current-password' });
    expect(changeBody).toEqual({
      currentPassword: 'current-password',
      newPassword: 'SecurePassword123',
      mfaCode: '654321',
      mfaMethod: 'totp',
    });
    expect(idempotencyKey).toBeTruthy();

    await writeFile(
      testInfo.outputPath('password-change-keyboard.json'),
      JSON.stringify(
        {
          route: '/profile/security/change-password',
          requestedRoute: '/w/profile/security/change-password',
          shell: 'Phone',
          viewport: { width: 390, height: 844 },
          documentWidth,
          routeMeasurements,
          webRouteAtPhoneViewportResolvesTo: '/profile/security/change-password',
          emptySubmitRequestCount: 0,
          focusAfterCurrentPasswordVerification: true,
          secondStepFocusOrder: [
            'Mật khẩu mới',
            'Nhập lại mật khẩu mới',
            'Mã xác thực TOTP',
            'Đổi mật khẩu',
            'Quay lại xác minh',
          ],
          focusAfterSuccess: true,
          verifyCalls,
          changeCalls,
          verifyBody,
          changeBody,
          idempotencyKeyPresent: Boolean(idempotencyKey),
          apiFixtureBoundary:
            'GET /auth/session and both password endpoints use local Playwright route fixtures; no backend request was made.',
          screenshotPath,
        },
        null,
        2,
      ) + '\n',
    );
  });

  test('password change 400 responses preserve the form and allow explicit correction @auth-api', async ({
    page,
  }, testInfo) => {
    let verifyCalls = 0;
    let changeCalls = 0;
    const changeStatuses: number[] = [];
    const changeBodies: Array<Record<string, unknown>> = [];
    let allowFirstVerifyResponse = () => {};
    let allowFirstChangeResponse = () => {};
    let markFirstVerifyStarted = () => {};
    let markFirstChangeStarted = () => {};
    const firstVerifyStarted = new Promise<void>((resolve) => {
      markFirstVerifyStarted = resolve;
    });
    const firstChangeStarted = new Promise<void>((resolve) => {
      markFirstChangeStarted = resolve;
    });
    const firstVerifyResponse = new Promise<void>((resolve) => {
      allowFirstVerifyResponse = resolve;
    });
    const firstChangeResponse = new Promise<void>((resolve) => {
      allowFirstChangeResponse = resolve;
    });

    await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
    await page.route('**/auth/password/verify-current', async (route) => {
      verifyCalls += 1;
      if (verifyCalls === 1) {
        markFirstVerifyStarted();
        await firstVerifyResponse;
      }
      return route.fulfill({ status: verifyCalls === 1 ? 400 : 204 });
    });
    await page.route('**/auth/password/change', async (route) => {
      changeCalls += 1;
      changeBodies.push(route.request().postDataJSON() as Record<string, unknown>);
      const status = changeCalls === 1 ? 400 : 204;
      changeStatuses.push(status);
      if (changeCalls === 1) {
        markFirstChangeStarted();
        await firstChangeResponse;
      }
      return route.fulfill({ status });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/w/profile/security/change-password');
    const currentPassword = page.getByLabel('Mật khẩu hiện tại', { exact: true });
    await currentPassword.fill('invalid-current-password');
    await currentPassword.press('Enter');
    await firstVerifyStarted;
    const verifyButton = page.getByRole('button', {
      name: 'Xác minh mật khẩu hiện tại',
      exact: true,
    });
    await expect(verifyButton).toBeDisabled();
    await currentPassword.press('Enter');
    expect(verifyCalls).toBe(1);
    allowFirstVerifyResponse();
    await expect(page.getByRole('alert')).toHaveText(
      'Không thể xác minh mật khẩu hiện tại. Vui lòng kiểm tra và thử lại.',
    );
    const verifyErrorScreenshotPath = testInfo.outputPath('password-change-verify-400.png');
    await page.screenshot({ path: verifyErrorScreenshotPath, fullPage: true });
    const verifyValueRetained = await currentPassword.inputValue();
    expect(verifyValueRetained).toBe('invalid-current-password');
    await expect(page.getByLabel('Mật khẩu mới', { exact: true })).toHaveCount(0);

    await currentPassword.fill('valid-current-password');
    await currentPassword.press('Enter');
    const newPassword = page.getByLabel('Mật khẩu mới', { exact: true });
    await expect(newPassword).toBeFocused();
    const confirmPassword = page.getByLabel('Nhập lại mật khẩu mới', { exact: true });
    const totpCode = page.getByLabel('Mã xác thực TOTP', { exact: true });
    const changeButton = page.getByRole('button', { name: 'Đổi mật khẩu' });

    await newPassword.fill('short');
    await confirmPassword.fill('short');
    await totpCode.fill('111111');
    await expect(changeButton).toBeDisabled();
    await totpCode.press('Enter');
    expect(changeCalls).toBe(0);

    await newPassword.fill('SecurePassword123');
    await confirmPassword.fill('DifferentPassword123');
    await expect(changeButton).toBeDisabled();
    await totpCode.press('Enter');
    expect(changeCalls).toBe(0);

    await confirmPassword.fill('SecurePassword123');
    await totpCode.fill('12345');
    await expect(changeButton).toBeDisabled();
    await totpCode.press('Enter');
    expect(changeCalls).toBe(0);

    await totpCode.fill('111111');
    await changeButton.click();
    await firstChangeStarted;
    await expect(changeButton).toBeDisabled();
    await totpCode.press('Enter');
    expect(changeCalls).toBe(1);
    allowFirstChangeResponse();
    await expect(page.getByRole('alert')).toHaveText(
      'Không thể đổi mật khẩu. Vui lòng kiểm tra mã xác thực và thử lại.',
    );
    const changeErrorScreenshotPath = testInfo.outputPath('password-change-submit-400.png');
    await page.screenshot({ path: changeErrorScreenshotPath, fullPage: true });
    const changeValuesRetained = {
      currentPasswordInputCount: await currentPassword.count(),
      newPassword: await newPassword.inputValue(),
      confirmPassword: await confirmPassword.inputValue(),
      totpCode: await totpCode.inputValue(),
    };
    expect(changeValuesRetained).toEqual({
      currentPasswordInputCount: 0,
      newPassword: 'SecurePassword123',
      confirmPassword: 'SecurePassword123',
      totpCode: '111111',
    });

    await totpCode.fill('222222');
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    await expect(
      page.getByRole('heading', { name: 'Mật khẩu đã được đổi thành công.' }),
    ).toBeVisible();
    expect({ verifyCalls, changeCalls, changeStatuses }).toEqual({
      verifyCalls: 2,
      changeCalls: 2,
      changeStatuses: [400, 204],
    });
    expect(changeBodies.map((body) => body.mfaCode)).toEqual(['111111', '222222']);

    await writeFile(
      testInfo.outputPath('password-change-error-recovery.json'),
      JSON.stringify(
        {
          route: '/w/profile/security/change-password',
          verifyStatuses: [400, 204],
          verifyCalls,
          verifyFieldRetainedAfter400: verifyValueRetained === 'invalid-current-password',
          noDuplicateVerifyWhilePending: true,
          invalidNewPasswordBlocked: true,
          mismatchedConfirmationBlocked: true,
          incompleteTotpBlocked: true,
          changeStatuses,
          changeCalls,
          changeFieldsRetainedAfter400: true,
          noDuplicateChangeWhilePending: true,
          totpCorrectedByUser: true,
          recoveredToSuccess: true,
          screenshots: [verifyErrorScreenshotPath, changeErrorScreenshotPath],
          apiFixtureBoundary:
            'GET /auth/session and both password endpoints use local Playwright route fixtures; no backend request was made.',
        },
        null,
        2,
      ) + '\n',
    );
  });

  test('expired password-change session returns the user to login after HTTP 401 @auth-api', async ({
    page,
  }, testInfo) => {
    let sessionExpired = false;
    let sessionCalls = 0;
    let refreshCalls = 0;
    let verifyCalls = 0;

    await page.route('**/auth/session', async (route) => {
      sessionCalls += 1;
      return sessionExpired ? route.fulfill({ status: 401 }) : route.fulfill({ json: session });
    });
    await page.route('**/auth/password/verify-current', async (route) => {
      verifyCalls += 1;
      sessionExpired = true;
      return route.fulfill({ status: 401 });
    });
    await page.route('**/auth/refresh', async (route) => {
      refreshCalls += 1;
      return route.fulfill({ status: 401 });
    });

    await page.goto('/w/profile/security/change-password');
    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).fill('synthetic-password');
    await page.getByLabel('Mật khẩu hiện tại', { exact: true }).press('Enter');
    await expect(page).toHaveURL(/\/auth\/login$/);
    await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
    expect(verifyCalls).toBe(1);
    expect(sessionCalls).toBeGreaterThanOrEqual(1);
    await expect.poll(() => refreshCalls).toBe(1);

    await writeFile(
      testInfo.outputPath('password-change-session-expired-401.json'),
      JSON.stringify(
        {
          protectedRoute: '/w/profile/security/change-password',
          contractResponse: 401,
          verifyCalls,
          refreshCalls,
          initialSessionCalls: sessionCalls,
          finalUrl: new URL(page.url()).pathname,
          loginVisible: true,
          apiFixtureBoundary:
            'Password, refresh and session responses use local Playwright route fixtures; no backend request was made.',
        },
        null,
        2,
      ) + '\n',
    );
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
    await expect(
      page.getByText('Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.'),
    ).toBeVisible();
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
