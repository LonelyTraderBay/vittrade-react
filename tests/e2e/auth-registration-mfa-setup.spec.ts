import { expect, test, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';

const session = {
  user: {
    id: 'e2e-registration-user',
    email: 'register@example.com',
    fullName: 'Registration E2E User',
    roles: ['user'],
    permissions: ['market:read', 'wallet:read', 'wallet:write'],
    kycStatus: 'verified',
    kycLevel: 2,
    accountStatus: 'active',
  },
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'registration-e2e-memory-token',
};

async function measureHorizontalVisibility(element: Locator) {
  return element.evaluate((node) => {
    const visibleBounds = {
      left: 0,
      right: document.documentElement.clientWidth,
    };
    const clippingAncestors: Array<{
      tagName: string;
      className: string;
      overflowX: string;
      left: number;
      right: number;
    }> = [];
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const overflowX = getComputedStyle(ancestor).overflowX;
      if (overflowX === 'visible') continue;
      const bounds = ancestor.getBoundingClientRect();
      visibleBounds.left = Math.max(visibleBounds.left, bounds.left);
      visibleBounds.right = Math.min(visibleBounds.right, bounds.right);
      clippingAncestors.push({
        tagName: ancestor.tagName.toLowerCase(),
        className: String(ancestor.className),
        overflowX,
        left: bounds.left,
        right: bounds.right,
      });
    }
    const bounds = node.getBoundingClientRect();
    return {
      visible: bounds.left >= visibleBounds.left && bounds.right <= visibleBounds.right,
      element: {
        tagName: node.tagName.toLowerCase(),
        className: String(node.className),
        left: bounds.left,
        right: bounds.right,
        width: bounds.width,
      },
      visibleBounds,
      clippingAncestors,
    };
  });
}

async function isFullyVisibleHorizontally(element: Locator): Promise<boolean> {
  return (await measureHorizontalVisibility(element)).visible;
}

test.beforeEach(({ baseURL }) => {
  test.skip(
    baseURL === 'http://127.0.0.1:4173',
    'Registration is intentionally disabled in the staging E2E profile.',
  );
});
test('completes registration through cookie-backed OTP and MFA setup confirmation @auth-api', async ({
  page,
}, testInfo) => {
  const pendingCookie = 'vittrade_session=registration-full-flow-e2e';
  let verifyRequest:
    { body: Record<string, unknown>; cookie?: string; authorization?: string } | undefined;
  let setupRequest: { cookie?: string; authorization?: string } | undefined;
  let confirmationRequest:
    { body: Record<string, unknown>; cookie?: string; authorization?: string } | undefined;
  let verifyCalls = 0;
  let setupCalls = 0;
  let confirmationCalls = 0;

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/register', (route) =>
    route.fulfill({
      status: 202,
      headers: {
        // Fixture-only cross-origin cookie attributes; they do not define production
        // cookie, CORS, or CSRF policy.
        'Set-Cookie':
          'vittrade_session=registration-full-flow-e2e; Path=/; HttpOnly; Secure; SameSite=None',
      },
      json: {
        challengeId: 'registration-full-flow-challenge-e2e',
        channel: 'email',
        maskedDestination: 'r***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );
  await page.route('https://e2e.test/auth/mfa/verify', async (route) => {
    verifyCalls += 1;
    verifyRequest = {
      body: route.request().postDataJSON() as Record<string, unknown>,
      cookie: route.request().headers().cookie,
      authorization: route.request().headers().authorization,
    };
    return route.fulfill({ status: 200, json: session });
  });
  await page.route('https://e2e.test/auth/mfa/setup', async (route) => {
    setupCalls += 1;
    setupRequest = {
      cookie: route.request().headers().cookie,
      authorization: route.request().headers().authorization,
    };
    return route.fulfill({
      status: 200,
      json: {
        secret: 'registration-setup-secret-e2e',
        qrCodeUrl: 'data:image/png;base64,registration-setup-e2e',
        backupCodes: ['registration-backup-code-e2e'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });
  });
  await page.route('https://e2e.test/auth/mfa/setup/confirm', async (route) => {
    confirmationCalls += 1;
    confirmationRequest = {
      body: route.request().postDataJSON() as Record<string, unknown>,
      cookie: route.request().headers().cookie,
      authorization: route.request().headers().authorization,
    };
    return route.fulfill({ status: 200, json: session });
  });

  await page.goto('/w/auth/register');
  await page.getByLabel('Họ và tên').fill('Registration E2E User');
  await page.getByLabel('Email').fill('register@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('StrongPass1!');
  await page.getByLabel('Xác nhận mật khẩu').fill('StrongPass1!');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await expect(page).toHaveURL(/\/w\/auth\/otp$/);
  await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);

  const registrationOtpInputs = page.locator('input[maxlength="1"]');
  await expect(registrationOtpInputs).toHaveCount(6);
  for (const [index, digit] of [...'123456'].entries()) {
    await registrationOtpInputs.nth(index).fill(digit);
  }

  await expect(page).toHaveURL(/\/w\/auth\/2fa-setup$/);
  await expect(page.getByText('registration-setup-secret-e2e')).toBeVisible();
  await expect
    .poll(() => verifyRequest?.body)
    .toEqual({
      challengeId: 'registration-full-flow-challenge-e2e',
      code: '123456',
      purpose: 'register',
    });
  expect(verifyCalls).toBe(1);
  expect(verifyRequest?.cookie).toContain(pendingCookie);
  expect(verifyRequest?.authorization).toBeUndefined();
  await expect.poll(() => setupRequest?.authorization).toBe('Bearer registration-e2e-memory-token');
  expect(setupCalls).toBe(1);
  expect(setupRequest?.cookie).toContain(pendingCookie);

  await page.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }).click();
  const setupOtpInputs = page.locator('input[inputmode="numeric"]');
  await expect(setupOtpInputs).toHaveCount(6);
  for (const [index, digit] of [...'654321'].entries()) {
    await setupOtpInputs.nth(index).fill(digit);
  }
  await page.getByRole('button', { name: 'Xác minh' }).click();

  await expect(page.getByRole('heading', { name: 'Lưu mã dự phòng' })).toBeVisible();
  await expect(page.getByText('registration-backup-code-e2e')).toBeVisible();
  await expect.poll(() => confirmationRequest?.body).toEqual({ code: '654321' });
  expect(confirmationCalls).toBe(1);
  expect(confirmationRequest?.cookie).toContain(pendingCookie);
  expect(confirmationRequest?.authorization).toBe('Bearer registration-e2e-memory-token');

  await page.getByRole('button', { name: /Tôi đã lưu mã dự phòng/ }).click();
  await page.getByRole('button', { name: /Hoàn tất thiết lập/ }).click();
  await expect(page).toHaveURL(/\/w\/auth\/success$/);
  await expect(page.getByRole('heading', { name: 'Bảo mật đã được nâng cấp!' })).toBeVisible();
  await expect(
    page.getByText('Xác thực hai bước đã kích hoạt thành công.', {
      exact: false,
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Dừng' }).click();
  const successMeasurements: Array<Record<string, unknown>> = [];
  const successHeading = page.getByRole('heading', {
    name: 'Bảo mật đã được nâng cấp!',
  });
  const successSummary = page.getByText('2FA đã kích hoạt', { exact: true });
  const successAction = page.getByRole('button', { name: 'Vào trang chủ' });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, `2FA success document overflows at ${width}px`).toBeLessThanOrEqual(
      viewportWidth,
    );
    const visible = {
      heading: await isFullyVisibleHorizontally(successHeading),
      securitySummary: await isFullyVisibleHorizontally(successSummary),
      primaryAction: await isFullyVisibleHorizontally(successAction),
    };
    expect(visible, `2FA success content is clipped at ${width}px`).toEqual({
      heading: true,
      securitySummary: true,
      primaryAction: true,
    });
    successMeasurements.push({
      path: '/w/auth/success',
      purpose: '2fa-setup',
      viewportWidth: width,
      viewportHeight: 900,
      documentWidth,
      visible,
    });

    if (width === 320 || width === 1440) {
      const screenshotPath = testInfo.outputPath(`web-auth-success-2fa-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-auth-success-2fa-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }
  const successMeasurementPath = testInfo.outputPath('web-auth-success-2fa-responsive.json');
  await writeFile(successMeasurementPath, JSON.stringify(successMeasurements, null, 2));
  await testInfo.attach('web-auth-success-2fa-responsive.json', {
    path: successMeasurementPath,
    contentType: 'application/json',
  });

  const accessTokenPersisted = await page.evaluate((token) => {
    const values = [window.localStorage, window.sessionStorage].flatMap((storage) =>
      Array.from({ length: storage.length }, (_, index) =>
        storage.getItem(storage.key(index) ?? ''),
      ),
    );
    return values.some((value) => value?.includes(token));
  }, session.accessToken);
  expect(accessTokenPersisted).toBe(false);

  await successAction.click();
  await expect(page).toHaveURL(/\/w\/home$/);
});

test('reports Web MFA clipboard failures for setup and backup codes @auth-api', async ({
  page,
}, testInfo) => {
  const observations: Record<string, unknown> = {
    route: '/w/auth/2fa-setup',
    clipboard: 'navigator.clipboard.writeText rejects in the local browser fixture',
    scenarios: [],
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const testWindow = window as Window & { __clipboardWriteAttempts?: number };
    testWindow.__clipboardWriteAttempts = 0;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async () => {
          testWindow.__clipboardWriteAttempts = (testWindow.__clipboardWriteAttempts ?? 0) + 1;
          throw new Error('clipboard permission denied');
        },
      },
    });
  });
  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', (route) =>
    route.fulfill({
      json: {
        secret: 'web-setup-secret-e2e',
        qrCodeUrl:
          'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22180%22%20height=%22180%22%20viewBox=%220%200%20180%20180%22%3E%3Crect%20width=%22180%22%20height=%22180%22%20fill=%22white%22/%3E%3Ctext%20x=%2290%22%20y=%2295%22%20text-anchor=%22middle%22%20font-family=%22sans-serif%22%20font-size=%2214%22%20fill=%22%236b7280%22%3ELocal%20test%3C/text%3E%3C/svg%3E',
        backupCodes: ['web-backup-code-001', 'web-backup-code-002'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );
  await page.route('https://e2e.test/auth/mfa/setup/confirm', (route) =>
    route.fulfill({ json: session }),
  );

  await page.goto('/w/auth/2fa-setup');
  await expect(page.getByText('web-setup-secret-e2e')).toBeVisible();
  await page.getByRole('button', { name: 'Sao chép' }).click();
  const secretCopyError = page.getByRole('alert');
  await expect(secretCopyError).toHaveText(
    'Không thể sao chép khóa thiết lập. Hãy chọn và sao chép khóa hiển thị thủ công.',
  );
  const secretErrorColor = await secretCopyError.evaluate(
    (element) => getComputedStyle(element).color,
  );
  expect(secretErrorColor).toBe('rgb(17, 24, 39)');
  await expect(page.getByRole('button', { name: 'Sao chép' })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __clipboardWriteAttempts?: number }).__clipboardWriteAttempts,
    ),
  ).toBe(1);
  expect(await isFullyVisibleHorizontally(secretCopyError)).toBe(true);
  const secretBounds = await secretCopyError.boundingBox();
  expect(secretBounds).not.toBeNull();
  expect(secretBounds!.y).toBeGreaterThanOrEqual(0);
  expect(secretBounds!.y + secretBounds!.height).toBeLessThanOrEqual(844);
  observations.scenarios = [
    {
      name: 'setup-secret',
      viewport: { width: 390, height: 844 },
      alertRole: 'alert',
      alertText: await secretCopyError.innerText(),
      alertTextColor: secretErrorColor,
      copyButtonText: await page.getByRole('button', { name: 'Sao chép' }).innerText(),
      clipboardWriteAttempts: 1,
      alertBounds: secretBounds,
      alertFullyWithinViewport:
        secretBounds!.y >= 0 && secretBounds!.y + secretBounds!.height <= 844,
      documentWidth: await page.evaluate(() => document.documentElement.scrollWidth),
      viewportWidth: await page.evaluate(() => window.innerWidth),
    },
  ];
  const secretErrorScreenshot = testInfo.outputPath(
    'web-2fa-setup-secret-copy-failure-390x844.png',
  );
  await secretCopyError.locator('xpath=..').screenshot({ path: secretErrorScreenshot });
  await testInfo.attach('web-2fa-setup-secret-copy-failure-390x844', {
    path: secretErrorScreenshot,
    contentType: 'image/png',
  });

  await page.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }).click();
  const otpInputs = page.locator('input[inputmode="numeric"]');
  for (let index = 0; index < 6; index += 1) await otpInputs.nth(index).fill(String(index + 1));
  await page.getByRole('button', { name: 'Xác minh' }).click();
  await expect(page.getByRole('heading', { name: 'Lưu mã dự phòng' })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Sao chép tất cả mã' }).click();
  const backupCopyError = page.getByRole('alert');
  await expect(backupCopyError).toHaveText(
    'Không thể sao chép mã dự phòng. Hãy chọn và lưu các mã hiển thị thủ công.',
  );
  const backupErrorColor = await backupCopyError.evaluate(
    (element) => getComputedStyle(element).color,
  );
  expect(backupErrorColor).toBe('rgb(17, 24, 39)');
  await expect(page.getByRole('button', { name: 'Sao chép tất cả mã' })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __clipboardWriteAttempts?: number }).__clipboardWriteAttempts,
    ),
  ).toBe(2);
  expect(await isFullyVisibleHorizontally(backupCopyError)).toBe(true);
  const backupBounds = await backupCopyError.boundingBox();
  expect(backupBounds).not.toBeNull();
  expect(backupBounds!.y).toBeGreaterThanOrEqual(0);
  expect(backupBounds!.y + backupBounds!.height).toBeLessThanOrEqual(900);
  (observations.scenarios as Array<Record<string, unknown>>).push({
    name: 'backup-codes',
    viewport: { width: 1440, height: 900 },
    alertRole: 'alert',
    alertText: await backupCopyError.innerText(),
    alertTextColor: backupErrorColor,
    copyButtonText: await page.getByRole('button', { name: 'Sao chép tất cả mã' }).innerText(),
    clipboardWriteAttempts: 2,
    alertBounds: backupBounds,
    alertFullyWithinViewport: backupBounds!.y >= 0 && backupBounds!.y + backupBounds!.height <= 900,
    documentWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    viewportWidth: await page.evaluate(() => window.innerWidth),
  });
  const observationPath = testInfo.outputPath('web-2fa-setup-clipboard-failure-observations.json');
  await writeFile(observationPath, `${JSON.stringify(observations, null, 2)}\n`);
  await testInfo.attach('web-2fa-setup-clipboard-failure-observations', {
    path: observationPath,
    contentType: 'application/json',
  });
  const backupErrorScreenshot = testInfo.outputPath(
    'web-2fa-setup-backup-copy-failure-1440x900.png',
  );
  await page.waitForTimeout(1400);
  await page.screenshot({ path: backupErrorScreenshot, fullPage: true });
  await testInfo.attach('web-2fa-setup-backup-copy-failure-1440x900', {
    path: backupErrorScreenshot,
    contentType: 'image/png',
  });
});

test('announces Web MFA setup loading until the local challenge arrives @auth-api', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let setupCalls = 0;
  let fixtureDelayMs = 0;
  let releaseSetupResponse: () => void = () => {};
  const setupResponseGate = new Promise<void>((resolve) => {
    releaseSetupResponse = resolve;
  });
  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', async (route) => {
    setupCalls += 1;
    const startedAt = Date.now();
    await setupResponseGate;
    fixtureDelayMs = Date.now() - startedAt;
    await route.fulfill({
      json: {
        secret: 'web-loading-secret-e2e',
        qrCodeUrl:
          'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22180%22%20height=%22180%22%20viewBox=%220%200%20180%20180%22%3E%3Crect%20width=%22180%22%20height=%22180%22%20fill=%22white%22/%3E%3Ctext%20x=%2290%22%20y=%2295%22%20text-anchor=%22middle%22%20font-family=%22sans-serif%22%20font-size=%2214%22%20fill=%22%236b7280%22%3ELocal%20test%3C/text%3E%3C/svg%3E',
        backupCodes: ['web-loading-code-001', 'web-loading-code-002'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });
  });

  await page.goto('/w/auth/2fa-setup');
  await expect.poll(() => setupCalls).toBe(1);
  const loadingStatus = page.getByRole('status');
  await expect(loadingStatus).toHaveText('Đang tải mã QR thiết lập 2FA...');
  const nextButton = page.getByRole('button', {
    name: 'Tiếp theo — Xác minh mã',
  });
  await expect(nextButton).toBeDisabled();
  expect(setupCalls).toBe(1);
  const loadingBounds = await loadingStatus.boundingBox();
  expect(loadingBounds).not.toBeNull();
  const loadingTextColor = await loadingStatus.evaluate(
    (element) => getComputedStyle(element).color,
  );
  const loadingScreenshot = testInfo.outputPath('web-2fa-setup-loading-status-390x844.png');
  await loadingStatus.screenshot({ path: loadingScreenshot });
  await testInfo.attach('web-2fa-setup-loading-status-390x844', {
    path: loadingScreenshot,
    contentType: 'image/png',
  });

  releaseSetupResponse();
  await expect(page.getByText('web-loading-secret-e2e')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(nextButton).toBeEnabled();
  const observations = {
    route: '/w/auth/2fa-setup',
    viewport: { width: 390, height: 844 },
    setupCalls,
    fixtureDelayMs,
    pending: {
      role: 'status',
      text: 'Đang tải mã QR thiết lập 2FA...',
      textColor: loadingTextColor,
      bounds: loadingBounds,
      nextButtonDisabled: true,
    },
    resolved: {
      secretVisible: true,
      statusCount: 0,
      nextButtonEnabled: true,
    },
    documentWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    viewportWidth: await page.evaluate(() => window.innerWidth),
  };
  const observationPath = testInfo.outputPath('web-2fa-setup-loading-observations.json');
  await writeFile(observationPath, `${JSON.stringify(observations, null, 2)}\n`);
  await testInfo.attach('web-2fa-setup-loading-observations', {
    path: observationPath,
    contentType: 'application/json',
  });
});

test('keeps Web MFA setup neutral after an aborted confirmation and allows a fixture retry @auth-api', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let setupCalls = 0;
  const confirmationRequests: Array<{ authorizationHeaderPresent: boolean }> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', async (route) => {
    setupCalls += 1;
    await route.fulfill({
      json: {
        secret: 'web-confirm-recovery-secret-e2e',
        qrCodeUrl:
          'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22180%22%20height=%22180%22%20viewBox=%220%200%20180%20180%22%3E%3Crect%20width=%22180%22%20height=%22180%22%20fill=%22white%22/%3E%3C/svg%3E',
        backupCodes: ['web-confirm-recovery-backup-e2e'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });
  });
  await page.route('https://e2e.test/auth/mfa/setup/confirm', async (route) => {
    confirmationRequests.push({
      authorizationHeaderPresent: Boolean(route.request().headers().authorization),
    });
    if (confirmationRequests.length === 1) {
      await route.abort('failed');
      return;
    }
    await route.fulfill({ status: 200, json: session });
  });

  await page.goto('/w/auth/2fa-setup');
  await expect(page.getByText('web-confirm-recovery-secret-e2e')).toBeVisible();
  await page.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }).click();
  const otpInputs = page.locator('input[inputmode="numeric"]');
  await expect(otpInputs).toHaveCount(6);
  for (const [index, digit] of [...'123456'].entries()) {
    await otpInputs.nth(index).fill(digit);
  }

  await page.getByRole('button', { name: 'Xác minh' }).click();
  const recoveryAlert = page.getByRole('alert');
  await expect(recoveryAlert).toHaveText('Không thể xác minh lúc này. Vui lòng thử lại.');
  const recoveryMessage = await recoveryAlert.textContent();
  expect(
    await otpInputs.evaluateAll((inputs) =>
      inputs.map((input) => (input as HTMLInputElement).value),
    ),
  ).toEqual(['1', '2', '3', '4', '5', '6']);
  await expect(page.getByRole('heading', { name: 'Xác minh mã' })).toBeVisible();
  await expect(page.getByText('web-confirm-recovery-backup-e2e')).toHaveCount(0);
  expect(confirmationRequests).toHaveLength(1);

  await page.getByRole('button', { name: 'Xác minh' }).click();
  await expect(page.getByRole('heading', { name: 'Lưu mã dự phòng' })).toBeVisible();
  await expect(page.getByText('web-confirm-recovery-backup-e2e')).toBeVisible();
  expect(confirmationRequests).toHaveLength(2);
  expect(
    confirmationRequests.every(({ authorizationHeaderPresent }) => authorizationHeaderPresent),
  ).toBe(true);

  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  const observation = {
    path: '/w/auth/2fa-setup',
    viewport: { width: 1440, height: 900 },
    setupCalls,
    confirmationCalls: confirmationRequests.length,
    firstConfirmationOutcome: 'local Playwright route.abort(failed)',
    recoveryMessage,
    otpRetainedAfterAbortedRequest: true,
    backupCodesVisibleAfterAbortedRequest: false,
    backupCodesVisibleAfterFixture200: true,
    authorizationHeaderPresent: confirmationRequests.every(
      ({ authorizationHeaderPresent }) => authorizationHeaderPresent,
    ),
    documentWidth,
    viewportWidth,
  };
  const report = {
    browserVersion: page.context().browser()?.version(),
    project: testInfo.project.name,
    fixtureBoundary:
      'The first confirmation was deliberately aborted after dispatch and the second confirmation was fulfilled by a local Playwright fixture. This shows frontend recovery only; server outcome, retry safety and backend idempotency are not established.',
    observation,
  };
  const reportPath = testInfo.outputPath('web-2fa-confirm-recovery-observations.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('web-2fa-confirm-recovery-observations', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('measures every Web MFA setup step from narrow phone to desktop @auth-api', async ({
  page,
}, testInfo) => {
  const viewports = [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1024, height: 900 },
    { width: 1440, height: 900 },
  ];
  const measurements: Array<Record<string, unknown>> = [];
  const secret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
  const backupCodes = [
    'BACKUP-CODE-1234567890',
    'BACKUP-CODE-2345678901',
    'BACKUP-CODE-3456789012',
    'BACKUP-CODE-4567890123',
  ];

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', (route) =>
    route.fulfill({
      json: {
        secret,
        qrCodeUrl:
          'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22180%22%20height=%22180%22%20viewBox=%220%200%20180%20180%22%3E%3Crect%20width=%22180%22%20height=%22180%22%20fill=%22white%22/%3E%3C/svg%3E',
        backupCodes,
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );
  await page.route('https://e2e.test/auth/mfa/setup/confirm', (route) =>
    route.fulfill({ status: 200, json: session }),
  );
  await page.goto('/w/auth/2fa-setup');
  await expect(page.getByText(secret, { exact: true })).toBeVisible();

  const recordStep = async (step: string, controls: Array<[string, Locator]>) => {
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const controlMeasurements = await Promise.all(
      controls.map(async ([name, locator]) => ({
        name,
        bounds: await locator.boundingBox(),
        computedCssWidth: await locator.evaluate((element) => getComputedStyle(element).width),
        fullyVisibleHorizontally: await isFullyVisibleHorizontally(locator),
      })),
    );
    measurements.push({
      path: '/w/auth/2fa-setup',
      step,
      viewportWidth,
      viewportHeight: await page.evaluate(() => document.documentElement.clientHeight),
      documentWidth,
      controlMeasurements,
    });
  };

  const qrControls: Array<[string, Locator]> = [
    ['secret', page.getByText(secret, { exact: true })],
    ['copySecret', page.getByRole('button', { name: 'Sao chép' })],
    ['next', page.getByRole('button', { name: 'Tiếp theo — Xác minh mã' })],
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await recordStep('qr', qrControls);
  }

  await page.getByRole('button', { name: 'Tiếp theo — Xác minh mã' }).click();
  const otpGroup = page.getByRole('group', {
    name: 'Mã xác thực gồm 6 chữ số',
  });
  const otpInputs = page.locator('input[inputmode="numeric"]');
  await expect(otpInputs).toHaveCount(6);
  const verifyControls: Array<[string, Locator]> = [
    ['otpGroup', otpGroup],
    ['firstOtp', otpInputs.nth(0)],
    ['lastOtp', otpInputs.nth(5)],
    ['back', page.getByRole('button', { name: 'Quay lại' })],
    ['verify', page.getByRole('button', { name: 'Xác minh' })],
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await recordStep('verify', verifyControls);
  }

  for (const [index, digit] of [...'123456'].entries()) {
    await otpInputs.nth(index).fill(digit);
  }
  await page.getByRole('button', { name: 'Xác minh' }).click();
  await expect(page.getByRole('heading', { name: 'Lưu mã dự phòng' })).toBeVisible();
  const backupControls: Array<[string, Locator]> = [
    ['firstCode', page.getByText(backupCodes[0], { exact: true })],
    ['lastCode', page.getByText(backupCodes[3], { exact: true })],
    ['copyCodes', page.getByRole('button', { name: 'Sao chép tất cả mã' })],
    ['acknowledgement', page.getByRole('button', { name: /Tôi đã lưu mã dự phòng/ })],
    ['complete', page.getByRole('button', { name: /Hoàn tất thiết lập/ })],
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await recordStep('backup', backupControls);
  }

  const report = {
    browserVersion: page.context().browser()?.version(),
    project: testInfo.project.name,
    fixtureBoundary:
      'The MFA setup challenge and confirmation were supplied by local Playwright route fixtures. These measurements do not establish backend behavior or human/device acceptance.',
    measurements,
  };
  const reportPath = testInfo.outputPath('web-2fa-setup-responsive-observations.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('web-2fa-setup-responsive-observations', {
    path: reportPath,
    contentType: 'application/json',
  });

  for (const measurement of measurements) {
    const { step, viewportWidth, documentWidth, controlMeasurements } = measurement as {
      step: string;
      viewportWidth: number;
      documentWidth: number;
      controlMeasurements: Array<{
        name: string;
        fullyVisibleHorizontally: boolean;
      }>;
    };
    expect(documentWidth, `${step} document width at ${viewportWidth}px`).toBeLessThanOrEqual(
      viewportWidth,
    );
    for (const control of controlMeasurements) {
      expect(
        control.fullyVisibleHorizontally,
        `${step} ${control.name} should be visible at ${viewportWidth}px`,
      ).toBe(true);
    }
  }
});

test('recovers from a Web MFA setup transport failure and retries the challenge @auth-api', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let setupCalls = 0;
  let retryDelayMs = 0;
  let releaseRetryResponse: () => void = () => {};
  const retryResponseGate = new Promise<void>((resolve) => {
    releaseRetryResponse = resolve;
  });

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', async (route) => {
    setupCalls += 1;
    if (setupCalls === 1) return route.abort('failed');

    const startedAt = Date.now();
    await retryResponseGate;
    retryDelayMs = Date.now() - startedAt;
    return route.fulfill({
      json: {
        secret: 'web-retry-secret-e2e',
        qrCodeUrl:
          'data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22180%22%20height=%22180%22%20viewBox=%220%200%20180%20180%22%3E%3Crect%20width=%22180%22%20height=%22180%22%20fill=%22white%22/%3E%3Ctext%20x=%2290%22%20y=%2295%22%20text-anchor=%22middle%22%20font-family=%22sans-serif%22%20font-size=%2214%22%20fill=%22%236b7280%22%3ELocal%20test%3C/text%3E%3C/svg%3E',
        backupCodes: ['web-retry-backup-code-e2e'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });
  });

  await page.goto('/w/auth/2fa-setup');
  const error = page.getByRole('alert');
  await expect(error).toContainText('Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.');
  const errorText = await error.textContent();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByText('Khóa bảo mật chưa khả dụng')).toBeVisible();
  const nextButton = page.getByRole('button', {
    name: 'Tiếp theo — Xác minh mã',
  });
  await expect(nextButton).toBeDisabled();
  const errorBounds = await error.boundingBox();
  expect(errorBounds).not.toBeNull();
  const stepper = page.getByRole('list', { name: 'Tiến trình thiết lập 2FA' });
  const steps = stepper.getByRole('listitem');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toHaveAccessibleName('Bước 1 trên 3: Quét mã QR');
  await expect(steps.nth(1)).toHaveAccessibleName('Bước 2 trên 3: Xác minh');
  await expect(steps.nth(2)).toHaveAccessibleName('Bước 3 trên 3: Mã dự phòng');
  await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step');
  const indicatorVisibleAt390 = await isFullyVisibleHorizontally(stepper);
  expect(indicatorVisibleAt390).toBe(true);
  const indicatorBoundsAt390 = await stepper.boundingBox();
  expect(indicatorBoundsAt390).not.toBeNull();
  await page.setViewportSize({ width: 320, height: 844 });
  const indicatorVisibleAt320 = await isFullyVisibleHorizontally(stepper);
  expect(indicatorVisibleAt320).toBe(true);
  const indicatorBoundsAt320 = await stepper.boundingBox();
  expect(indicatorBoundsAt320).not.toBeNull();
  await page.setViewportSize({ width: 390, height: 844 });

  const errorScreenshot = testInfo.outputPath('web-2fa-setup-transport-error-390x844.png');
  await page.screenshot({ path: errorScreenshot, fullPage: true });
  await testInfo.attach('web-2fa-setup-transport-error-390x844', {
    path: errorScreenshot,
    contentType: 'image/png',
  });

  await page.getByRole('button', { name: 'Thử lại thiết lập 2FA' }).click();
  await expect.poll(() => setupCalls).toBe(2);
  const retryStatus = page.getByRole('status');
  await expect(retryStatus).toHaveText('Đang tải mã QR thiết lập 2FA...');
  await expect(error).toHaveCount(0);
  await expect(nextButton).toBeDisabled();
  const retryBounds = await retryStatus.boundingBox();
  expect(retryBounds).not.toBeNull();

  releaseRetryResponse();
  await expect(page.getByText('web-retry-secret-e2e')).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(nextButton).toBeEnabled();
  const observations = {
    route: '/w/auth/2fa-setup',
    viewport: { width: 390, height: 844 },
    setupCalls,
    firstAttempt: {
      outcome: 'local route.abort(failed)',
      alertRole: 'alert',
      alertText: errorText,
      alertBounds: errorBounds,
      statusCount: 0,
      unavailableSecretVisible: true,
      nextButtonDisabled: true,
    },
    stepIndicator: {
      visibleWithinViewport: {
        '320': indicatorVisibleAt320,
        '390': indicatorVisibleAt390,
      },
      bounds: { '320': indicatorBoundsAt320, '390': indicatorBoundsAt390 },
      accessibleStepNames: [
        'Bước 1 trên 3: Quét mã QR',
        'Bước 2 trên 3: Xác minh',
        'Bước 3 trên 3: Mã dự phòng',
      ],
    },
    retryPending: {
      role: 'status',
      text: 'Đang tải mã QR thiết lập 2FA...',
      bounds: retryBounds,
      nextButtonDisabled: true,
    },
    retryResolved: {
      secretVisible: true,
      statusCount: 0,
      nextButtonEnabled: true,
      retryDelayMs,
    },
    documentWidth: await page.evaluate(() => document.documentElement.scrollWidth),
    viewportWidth: await page.evaluate(() => window.innerWidth),
  };
  const observationPath = testInfo.outputPath('web-2fa-setup-transport-retry-observations.json');
  await writeFile(observationPath, `${JSON.stringify(observations, null, 2)}\n`);
  await testInfo.attach('web-2fa-setup-transport-retry-observations', {
    path: observationPath,
    contentType: 'application/json',
  });
});

test('supports accessible keyboard registration across Web widths @auth-api', async ({
  page,
}, testInfo) => {
  const viewports = [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 768, height: 900 },
    { width: 1440, height: 900 },
  ];
  const measurements: Array<Record<string, unknown>> = [];
  let registerCalls = 0;
  let verificationCalls = 0;
  let registrationRequest:
    | {
        body: Record<string, unknown>;
        authorization?: string;
        idempotencyKey?: string;
      }
    | undefined;

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/register', async (route) => {
    registerCalls += 1;
    registrationRequest = {
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
      idempotencyKey: route.request().headers()['idempotency-key'],
    };
    return route.fulfill({
      status: 202,
      headers: {
        'Set-Cookie':
          'vittrade_session=registration-keyboard-e2e; Path=/; HttpOnly; Secure; SameSite=None',
      },
      json: {
        challengeId: 'registration-keyboard-challenge-e2e',
        channel: 'email',
        maskedDestination: 'k***@example.com',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });
  });
  await page.route('https://e2e.test/auth/mfa/verify', async (route) => {
    verificationCalls += 1;
    return route.fulfill({ status: 400 });
  });

  const expectedTabOrder = [
    'Email channel',
    'Phone channel',
    'Họ và tên',
    'Email',
    'Mật khẩu',
    'Hiện mật khẩu',
    'Xác nhận mật khẩu',
    'Mã giới thiệu (tuỳ chọn)',
    'Điều khoản dịch vụ và Chính sách bảo mật',
    'Tiếp tục',
    'Đăng nhập',
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/w/auth/register');
    await expect(page.getByText('Web', { exact: true })).toHaveCount(0);

    const channelGroup = page.getByRole('group', { name: 'Kênh đăng ký' });
    const emailChannel = channelGroup.getByRole('button', { name: 'Email' });
    const phoneChannel = channelGroup.getByRole('button', {
      name: 'Điện thoại',
    });
    const name = page.getByRole('textbox', { name: 'Họ và tên' });
    const email = page.getByRole('textbox', { name: 'Email' });
    const password = page.getByLabel('Mật khẩu', { exact: true });
    const confirmation = page.getByRole('textbox', {
      name: 'Xác nhận mật khẩu',
    });
    const referral = page.getByRole('textbox', {
      name: 'Mã giới thiệu (tuỳ chọn)',
    });
    const terms = page.getByRole('checkbox');
    const submit = page.getByRole('button', { name: 'Tiếp tục' });
    const login = page.getByRole('button', { name: 'Đăng nhập' });
    const primaryControls = [
      { name: 'registration channel group', locator: channelGroup },
      { name: 'full name', locator: name },
      { name: 'email', locator: email },
      { name: 'password', locator: password },
      { name: 'password confirmation', locator: confirmation },
      { name: 'terms checkbox', locator: terms },
      { name: 'continue action', locator: submit },
    ];

    await expect(emailChannel).toHaveAttribute('aria-pressed', 'true');
    await expect(phoneChannel).toHaveAttribute('aria-pressed', 'false');
    const document = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    const visibility = await Promise.all(
      primaryControls.map(({ locator }) => measureHorizontalVisibility(locator)),
    );
    expect(
      document.scrollWidth,
      `Web registration overflows at ${viewport.width}px`,
    ).toBeLessThanOrEqual(document.width);
    const clippedControls = primaryControls
      .filter((_, index) => !visibility[index].visible)
      .map(({ name: controlName }) => controlName);
    const clippingDiagnostics = primaryControls.flatMap(({ name }, index) =>
      visibility[index].visible ? [] : [{ name, ...visibility[index] }],
    );
    expect(
      clippedControls,
      `Web registration controls clip at ${viewport.width}px: ${clippedControls.join(', ') || 'none'}; geometry=${JSON.stringify(clippingDiagnostics)}`,
    ).toEqual([]);

    if (viewport.width === 320 || viewport.width === 1440) {
      const screenshotPath = testInfo.outputPath(
        `web-register-${viewport.width}x${viewport.height}.png`,
      );
      await page.screenshot({ path: screenshotPath, animations: 'disabled' });
      await testInfo.attach(`web-register-${viewport.width}x${viewport.height}`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }

    const tabStops = [
      emailChannel,
      phoneChannel,
      name,
      email,
      password,
      page.getByRole('button', { name: 'Hiện mật khẩu' }),
      confirmation,
      referral,
      terms,
      submit,
      login,
    ];
    for (const stop of tabStops) {
      await page.keyboard.press('Tab');
      await expect(stop).toBeFocused();
    }
    measurements.push({
      route: '/w/auth/register',
      viewport,
      document,
      clippedPrimaryControlCount: visibility.filter((measurement) => !measurement.visible).length,
      focusOrder: expectedTabOrder,
      selectedChannel: 'email',
    });
  }

  const email = page.getByRole('textbox', { name: 'Email' });
  await email.press('Enter');
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  const emailDescriptionIds = (await email.getAttribute('aria-describedby'))?.split(/\s+/) ?? [];
  expect(emailDescriptionIds).toContain('input-email-helper');
  const emailErrorId = emailDescriptionIds.find((id) => id.endsWith('-error'));
  expect(emailErrorId).toBeTruthy();
  await expect(page.locator(`[id="${emailErrorId}"]`)).toHaveText('Vui lòng nhập email');
  await expect(page.getByText('Vui lòng đồng ý điều khoản dịch vụ', { exact: true })).toBeVisible();
  expect(registerCalls).toBe(0);

  await page.getByRole('textbox', { name: 'Họ và tên' }).fill('Keyboard Registration');
  await email.fill('keyboard-register@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('StrongPass1!');
  await page.getByRole('textbox', { name: 'Xác nhận mật khẩu' }).fill('StrongPass1!');
  await page.getByRole('checkbox').check();
  await email.press('Enter');

  await expect(page).toHaveURL(/\/w\/auth\/otp$/);
  await expect(page.getByRole('heading', { name: 'Xác thực tài khoản' })).toBeVisible();
  await expect(page.getByText('k***@example.com', { exact: true })).toBeVisible();
  expect(registerCalls).toBe(1);
  expect(registrationRequest?.body).toEqual({
    fullName: 'Keyboard Registration',
    channel: 'email',
    contact: 'keyboard-register@example.com',
    password: 'StrongPass1!',
    acceptedTerms: true,
  });
  expect(registrationRequest?.authorization).toBeUndefined();
  expect(registrationRequest?.idempotencyKey).toMatch(/^[\da-f-]{36}$/i);
  expect(verificationCalls).toBe(0);
  await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);

  const reportPath = testInfo.outputPath('web-register-keyboard-responsive.json');
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        route: '/w/auth/register',
        measurements,
        emptySubmit: {
          emailInvalid: true,
          emailErrorAssociated: true,
          termsErrorShown: true,
          registerRequestCount: 0,
        },
        keyboardSubmit: {
          destination: '/w/auth/otp',
          registrationRequestCount: registerCalls,
          requestFields: Object.keys(registrationRequest?.body ?? {}).sort(),
          acceptedTerms: registrationRequest?.body.acceptedTerms,
          authorizationHeaderPresent: Boolean(registrationRequest?.authorization),
          idempotencyKeyPresent: Boolean(registrationRequest?.idempotencyKey),
          verificationRequestCount: verificationCalls,
          authenticatedMarkerCount: await page.getByTestId('auth-sign-out').count(),
        },
        apiFixtureBoundary:
          'GET /auth/session, POST /auth/register and POST /auth/mfa/verify use local Playwright route fixtures; OTP verification is not submitted.',
      },
      null,
      2,
    ),
  );
  await testInfo.attach('web-register-keyboard-responsive.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('opens Web auth success without route state using neutral recovery @auth-api', async ({
  page,
}, testInfo) => {
  const viewportWidths = [320, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.setViewportSize({ width: viewportWidths[0], height: 900 });
  await page.goto('/w/auth/success');
  await expect(page).toHaveURL(/\/w\/auth\/success$/);
  const heading = page.getByRole('heading', {
    name: 'Không có thông tin xác nhận',
  });
  await expect(heading).toBeVisible();
  await expect(heading).toBeFocused();
  await expect(
    page.getByText(
      'Không tìm thấy trạng thái xác nhận cho yêu cầu này. Hãy đăng nhập để tiếp tục.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Về trang đăng nhập' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dừng' })).toHaveCount(0);
  await expect(page.getByText('Thao tác thành công!')).toHaveCount(0);

  const primaryAction = page.getByRole('button', {
    name: 'Về trang đăng nhập',
  });
  const summary = page.getByText(
    'Không tìm thấy trạng thái xác nhận cho yêu cầu này. Hãy đăng nhập để tiếp tục.',
  );
  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 900 });
    await expect(heading).toBeFocused();
    const headingFocused = await heading.evaluate((element) => document.activeElement === element);
    expect(headingFocused, `recovery heading lost focus at ${width}px`).toBe(true);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth, `Neutral recovery document overflows at ${width}px`).toBeLessThanOrEqual(
      viewportWidth,
    );
    const visible = {
      heading: await isFullyVisibleHorizontally(heading),
      summary: await isFullyVisibleHorizontally(summary),
      primaryAction: await isFullyVisibleHorizontally(primaryAction),
    };
    expect(visible, `Neutral recovery content is clipped at ${width}px`).toEqual({
      heading: true,
      summary: true,
      primaryAction: true,
    });
    const keyBounds = await Promise.all(
      [heading, summary, primaryAction].map((item) => item.boundingBox()),
    );
    for (const [index, bounds] of keyBounds.entries()) {
      expect(
        bounds,
        `neutral recovery element ${index} has no bounds at ${width}px`,
      ).not.toBeNull();
      expect(
        bounds!.y,
        `neutral recovery element ${index} starts above ${width}px viewport`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        bounds!.y + bounds!.height,
        `neutral recovery element ${index} ends below ${width}px viewport`,
      ).toBeLessThanOrEqual(900);
    }
    const headingPaint = await heading.evaluate((element) => {
      const chain: Array<{
        tagName: string;
        opacity: string;
        visibility: string;
      }> = [];
      let current: HTMLElement | null = element;
      while (current) {
        const style = window.getComputedStyle(current);
        chain.push({
          tagName: current.tagName,
          opacity: style.opacity,
          visibility: style.visibility,
        });
        current = current.parentElement;
      }
      return chain;
    });
    measurements.push({
      path: '/w/auth/success',
      routeState: null,
      expectedPurpose: 'neutral recovery, no success claim or automatic redirect',
      viewportWidth: width,
      viewportHeight: 900,
      headingFocused,
      keyBounds,
      headingPaint,
      documentWidth,
      visible,
    });

    if (width === 320 || width === 1440) {
      if (width === 1440) {
        await expect(page.getByText('Đăng nhập để tiếp tục sử dụng nền tảng.')).toHaveCSS(
          'opacity',
          '1',
        );
        await expect(
          page.getByText('Open Arena', { exact: true }).locator('xpath=../../..'),
        ).toHaveCSS('opacity', '1');
      }
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const screenshotPath = testInfo.outputPath(`web-auth-success-neutral-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-auth-success-neutral-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }

  await page.keyboard.press('Tab');
  await expect(primaryAction).toBeFocused();
  const measurementPath = testInfo.outputPath('web-auth-success-neutral-responsive.json');
  await writeFile(measurementPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-auth-success-neutral-responsive.json', {
    path: measurementPath,
    contentType: 'application/json',
  });

  await primaryAction.click();
  await expect(page).toHaveURL(/\/w\/auth\/login$/);
});

test('Web auth-success neutral recovery has no Axe violations in both themes @auth-api', async ({
  page,
}, testInfo) => {
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  const measurements: Array<Record<string, unknown>> = [];
  const reportPath = testInfo.outputPath('web-auth-success-neutral-axe-report.json');

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));

  for (const theme of themes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/w/auth/success');
      await expect(
        page.getByRole('heading', { name: 'Không có thông tin xác nhận' }),
      ).toBeVisible();
      await page.evaluate((activeTheme) => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.classList.toggle('light', activeTheme === 'light');
      }, theme);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const supportLink = page.getByRole('button', {
        name: 'Liên hệ hỗ trợ',
      });
      await expect
        .poll(() => supportLink.evaluate((element) => getComputedStyle(element).color))
        .toBe(theme === 'dark' ? 'rgb(96, 165, 250)' : 'rgb(29, 78, 216)');

      const themeState = await page.evaluate(() => {
        const link = document.querySelector<HTMLButtonElement>('.hover\\:underline[type="button"]');
        return {
          rootClasses: document.documentElement.className,
          bodyClasses: document.body.className,
          linkToken: getComputedStyle(document.documentElement)
            .getPropertyValue('--tr-link')
            .trim(),
          linkColor: link ? getComputedStyle(link).color : null,
          linkOpacity: link ? getComputedStyle(link).opacity : null,
          background: getComputedStyle(document.body).backgroundColor,
        };
      });
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const violations = results.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        affectedNodeCount: nodes.length,
        affectedNodes: nodes.map((node) => ({
          target: node.target,
          html: node.html,
          contrast: node.any
            .filter((check) => check.id === 'color-contrast')
            .map((check) => check.data),
        })),
      }));
      measurements.push({
        route: '/w/auth/success',
        routeState: null,
        theme,
        viewportWidth: width,
        themeState,
        scanCount: 1,
        violationCount: violations.length,
        violations,
      });
      await writeFile(reportPath, JSON.stringify(measurements, null, 2));
      expect(
        violations,
        `Axe violations in ${theme} theme at ${width}px: ${JSON.stringify(violations, null, 2)}`,
      ).toEqual([]);
    }
  }

  await testInfo.attach('web-auth-success-neutral-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('routes Web auth-success support actions to registered Web pages @auth-api', async ({
  page,
}, testInfo) => {
  let sessionRequests = 0;
  let ticketRequests = 0;
  let helpRequests = 0;
  await page.route('**/auth/session', async (route) => {
    sessionRequests += 1;
    await route.fulfill({ json: session });
  });
  await page.route('**/support/tickets', async (route) => {
    ticketRequests += 1;
    await route.fulfill({ json: { items: [] } });
  });
  await page.route('**/support/help', async (route) => {
    helpRequests += 1;
    await route.fulfill({ json: { categories: [], articles: [] } });
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/auth/success');
  await page.getByRole('button', { name: 'Liên hệ hỗ trợ' }).click();
  await expect(page).toHaveURL(/\/w\/support$/);
  await expect(page.getByRole('heading', { name: 'Tạo yêu cầu hỗ trợ' })).toBeVisible();
  await expect.poll(() => ticketRequests).toBe(1);
  const supportDestination = new URL(page.url()).pathname;

  await page.goto('/w/auth/success');
  await page.getByRole('button', { name: 'Trung tâm trợ giúp' }).click();
  await expect(page).toHaveURL(/\/w\/support\/help$/);
  await expect(page.getByText('Trung tâm trợ giúp', { exact: true })).toBeVisible();
  await expect.poll(() => helpRequests).toBe(1);
  await expect(page.getByRole('status')).toContainText('Không tìm thấy bài viết phù hợp.');
  const reportPath = testInfo.outputPath('web-auth-success-support-navigation.json');
  const report = {
    initialRoute: '/w/auth/success',
    routeState: null,
    viewport: { width: 1440, height: 900 },
    destinations: [
      {
        action: 'Liên hệ hỗ trợ',
        route: supportDestination,
        contentVisible: true,
        fixtureRequests: ticketRequests,
      },
      {
        action: 'Trung tâm trợ giúp',
        route: new URL(page.url()).pathname,
        contentVisible: true,
        fixtureRequests: helpRequests,
      },
    ],
    sessionFixtureRequests: sessionRequests,
    fixtureBoundary:
      'Session, support-ticket list and help article responses were fulfilled by local Playwright route fixtures.',
  };
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  await testInfo.attach('web-auth-success-support-navigation.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('opens Tablet 2FA setup and supports OTP entry across responsive viewports @auth-api', async ({
  page,
}, testInfo) => {
  const viewportWidths = [390, 768, 1440];
  await page.setViewportSize({ width: viewportWidths[0], height: 844 });

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', (route) =>
    route.fulfill({
      json: {
        secret: 'TABLET-SETUP-SECRET-1234567890',
        qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        backupCodes: ['backup-1234', 'backup-5678'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );
  let confirmationBody: Record<string, unknown> | undefined;
  await page.route('https://e2e.test/auth/mfa/setup/confirm', async (route) => {
    confirmationBody = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: session });
  });

  await page.goto('/t/auth/2fa-setup');
  await expect(page).toHaveURL(/\/t\/auth\/2fa-setup$/);
  await expect(page.getByRole('heading', { name: 'Bước 1: Quét mã QR' })).toBeVisible();
  await expect(page.getByAltText('Mã QR thiết lập xác thực hai bước')).toBeVisible();
  const setupSecret = page.getByText('TABLET-SETUP-SECRET-1234567890', {
    exact: true,
  });
  const copySecretButton = page.getByRole('button', { name: 'Sao chép' });
  await expect(setupSecret).toBeVisible();

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 844 });
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(contentWidth, `QR step overflows at ${width}px`).toBeLessThanOrEqual(pageWidth);
    expect(
      await isFullyVisibleHorizontally(setupSecret),
      `Setup secret is clipped at ${width}px`,
    ).toBe(true);
    expect(
      await isFullyVisibleHorizontally(copySecretButton),
      `Copy action is clipped at ${width}px`,
    ).toBe(true);
    const secretAndButtonAreSeparated = await setupSecret.evaluate((secret) => {
      const button = secret.parentElement?.querySelector('button');
      if (!button) return false;
      const secretBounds = secret.getBoundingClientRect();
      const buttonBounds = button.getBoundingClientRect();
      return (
        secretBounds.right <= buttonBounds.left ||
        buttonBounds.right <= secretBounds.left ||
        secretBounds.bottom <= buttonBounds.top ||
        buttonBounds.bottom <= secretBounds.top
      );
    });
    expect(secretAndButtonAreSeparated, `Secret overlaps copy action at ${width}px`).toBe(true);
  }

  await page.setViewportSize({ width: viewportWidths[0], height: 844 });
  await page.getByRole('button', { name: /Tiếp theo/ }).click();
  const otpGroup = page.getByRole('group', {
    name: 'Mã xác thực gồm 6 chữ số',
  });
  const otpInput = page.getByRole('textbox', { name: 'Mã xác thực 6 chữ số' });
  await expect(otpInput).toBeFocused();
  await expect(otpInput).toHaveAttribute('aria-describedby', 'setup-otp-instructions');
  await expect(otpGroup).toHaveCSS('outline-style', 'solid');
  const otpCells = otpGroup.locator('[aria-hidden="true"] > div');
  await expect(otpCells).toHaveCount(6);
  const screenshotPath = testInfo.outputPath('tablet-2fa-otp-focused-390x844.png');
  await page.screenshot({ path: screenshotPath });
  await testInfo.attach('tablet-2fa-otp-focused-390x844', {
    path: screenshotPath,
    contentType: 'image/png',
  });

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 844 });
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(contentWidth, `OTP step overflows at ${width}px`).toBeLessThanOrEqual(pageWidth);
    const cellsFitVisibleContent = await otpGroup.evaluate((group) => {
      const groupBounds = group.getBoundingClientRect();
      const visibleBounds = {
        left: 0,
        right: document.documentElement.clientWidth,
      };
      for (let ancestor = group.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (getComputedStyle(ancestor).overflowX === 'visible') continue;
        const bounds = ancestor.getBoundingClientRect();
        visibleBounds.left = Math.max(visibleBounds.left, bounds.left);
        visibleBounds.right = Math.min(visibleBounds.right, bounds.right);
      }
      const cells = Array.from(group.querySelectorAll('[aria-hidden="true"] > div'));
      return (
        cells.length === 6 &&
        groupBounds.left >= visibleBounds.left &&
        groupBounds.right <= visibleBounds.right &&
        cells.every((cell) => {
          const bounds = cell.getBoundingClientRect();
          return (
            bounds.left >= visibleBounds.left &&
            bounds.right <= visibleBounds.right &&
            bounds.left >= groupBounds.left &&
            bounds.right <= groupBounds.right
          );
        })
      );
    });
    expect(cellsFitVisibleContent, `OTP cells are clipped at ${width}px`).toBe(true);
  }

  await page.setViewportSize({ width: viewportWidths[0], height: 844 });
  await otpInput.pressSequentially('654321');
  await expect(otpInput).toHaveValue('654321');
  await page.getByRole('button', { name: 'Xác nhận' }).click();
  await expect(page.getByRole('heading', { name: 'Bước 3: Mã dự phòng' })).toBeVisible();
  const backupCode = page.getByText('backup-1234', { exact: true });
  await expect(backupCode).toBeVisible();
  await expect.poll(() => confirmationBody).toEqual({ code: '654321' });

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 844 });
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(contentWidth, `Backup-code step overflows at ${width}px`).toBeLessThanOrEqual(pageWidth);
    expect(
      await isFullyVisibleHorizontally(backupCode),
      `Backup code is clipped at ${width}px`,
    ).toBe(true);
  }
});

test('opens shared 2FA setup through the Auth and Responsive aliases @auth-api', async ({
  page,
}, testInfo) => {
  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', (route) =>
    route.fulfill({
      json: {
        secret: 'TABLET-SETUP-SECRET-1234567890',
        qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        backupCodes: ['backup-1234'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );

  for (const path of ['/auth/2fa-setup', '/r/auth/2fa-setup']) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`));
      await expect(page.getByRole('heading', { name: 'Bước 1: Quét mã QR' })).toBeVisible();
      await expect(page.getByAltText('Mã QR thiết lập xác thực hai bước')).toBeVisible();
      const setupSecret = page.getByText('TABLET-SETUP-SECRET-1234567890', {
        exact: true,
      });
      const copySecretButton = page.getByRole('button', { name: 'Sao chép' });
      await expect(setupSecret).toBeVisible();
      await expect(copySecretButton).toBeVisible();
      expect(
        await isFullyVisibleHorizontally(setupSecret),
        `${path} clips secret at ${width}px`,
      ).toBe(true);
      expect(
        await isFullyVisibleHorizontally(copySecretButton),
        `${path} clips copy action at ${width}px`,
      ).toBe(true);

      await page.getByRole('button', { name: /Tiếp theo/ }).click();
      const otpGroup = page.getByRole('group', {
        name: 'Mã xác thực gồm 6 chữ số',
      });
      const otpInput = page.getByRole('textbox', {
        name: 'Mã xác thực 6 chữ số',
      });
      await expect(otpInput).toBeFocused();
      await expect(otpInput).toHaveAttribute('aria-describedby', 'setup-otp-instructions');
      const otpCells = otpGroup.locator('[aria-hidden="true"] > div');
      await expect(otpCells).toHaveCount(6);
      for (let index = 0; index < 6; index += 1) {
        expect(
          await isFullyVisibleHorizontally(otpCells.nth(index)),
          `${path} clips OTP cell ${index + 1} at ${width}px`,
        ).toBe(true);
      }
      if (width === 390) {
        const alias = path.startsWith('/r/') ? 'responsive' : 'auth';
        const screenshotPath = testInfo.outputPath(`${alias}-2fa-otp-focused-390x844.png`);
        await page.screenshot({ path: screenshotPath });
        await testInfo.attach(`${alias}-2fa-otp-focused-390x844`, {
          path: screenshotPath,
          contentType: 'image/png',
        });
      }
    }
  }
});

test('recovers shared 2FA setup from setup and confirmation transport failures @auth-api', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'auth', prefix: '', width: 390, height: 844 },
    { name: 'tablet', prefix: '/t', width: 768, height: 900 },
    { name: 'responsive', prefix: '/r', width: 1024, height: 900 },
  ];
  const confirmationRequests: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];
  const observations: Array<Record<string, unknown>> = [];
  let setupCalls = 0;
  let releasePendingResponse: (() => void) | undefined;
  let signalPendingRequest: (() => void) | undefined;

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', async (route) => {
    setupCalls += 1;
    if (setupCalls % 2 === 1) {
      await route.abort();
      return;
    }
    await route.fulfill({
      json: {
        secret: 'PENDING-SETUP-SECRET-1234567890',
        qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        backupCodes: ['pending-setup-backup-e2e'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    });
  });
  await page.route('https://e2e.test/auth/mfa/setup/confirm', async (route) => {
    confirmationRequests.push({
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    });
    if (confirmationRequests.length % 2 === 1) {
      await new Promise<void>((resolve) => {
        releasePendingResponse = resolve;
        signalPendingRequest?.();
      });
      await route.abort();
      return;
    }
    await route.fulfill({ status: 200, json: session });
  });

  for (const shell of shells) {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    const firstSetupCallIndex = setupCalls;
    await page.goto(`${shell.prefix}/auth/2fa-setup`);
    await expect(
      page.getByRole('alert').getByText('Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.', {
        exact: true,
      }),
    ).toBeVisible();
    expect(setupCalls).toBe(firstSetupCallIndex + 1);
    await page.getByRole('button', { name: 'Thử lại thiết lập 2FA' }).click();
    await expect(page.getByText('PENDING-SETUP-SECRET-1234567890')).toBeVisible();
    expect(setupCalls).toBe(firstSetupCallIndex + 2);
    await page.getByRole('button', { name: /Tiếp theo/ }).click();
    await expect(page.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();

    const otpInput = page.getByRole('textbox', {
      name: 'Mã xác thực 6 chữ số',
    });
    await otpInput.fill('123456');
    const verifyButton = page.getByRole('button', { name: 'Xác nhận' });
    const firstCallIndex = confirmationRequests.length;
    let resolvePendingRequest!: () => void;
    const pendingRequestStarted = new Promise<void>((resolve) => {
      resolvePendingRequest = resolve;
    });
    signalPendingRequest = resolvePendingRequest;

    await verifyButton.click();
    await pendingRequestStarted;
    const pendingButton = page.locator('button[aria-busy="true"]');
    await expect(pendingButton).toBeDisabled();
    await expect(pendingButton).toHaveCount(1);
    expect(confirmationRequests).toHaveLength(firstCallIndex + 1);

    await pendingButton.dispatchEvent('click');
    expect(confirmationRequests).toHaveLength(firstCallIndex + 1);
    releasePendingResponse?.();
    releasePendingResponse = undefined;

    const transportError = page.getByText('Không thể xác minh lúc này. Vui lòng thử lại.', {
      exact: true,
    });
    await expect(transportError).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();
    await expect(otpInput).toHaveValue('123456');
    await expect(page.getByText('pending-setup-backup-e2e')).toHaveCount(0);
    await expect(verifyButton).toBeEnabled();

    await verifyButton.click();
    await expect(page.getByRole('heading', { name: 'Bước 3: Mã dự phòng' })).toBeVisible();
    await expect(page.getByText('pending-setup-backup-e2e')).toBeVisible();
    expect(confirmationRequests).toHaveLength(firstCallIndex + 2);
    expect(confirmationRequests.slice(firstCallIndex).map(({ body }) => body)).toEqual([
      { code: '123456' },
      { code: '123456' },
    ]);

    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
    observations.push({
      shell: shell.name,
      path: `${shell.prefix}/auth/2fa-setup`,
      viewport: { width: shell.width, height: shell.height },
      setupRequestsForShell: setupCalls - firstSetupCallIndex,
      setupTransportErrorVisible: true,
      setupRetrySucceeded: true,
      pendingSubmitDisabled: true,
      pendingAriaBusy: 'true',
      duplicateEventAddedRequest: false,
      transportErrorVisible: true,
      codeRetainedForRecovery: true,
      backupCodesHiddenAfterTransportFailure: true,
      retrySucceededWithLocalFixture: true,
      confirmationRequestsForShell: 2,
      confirmationBodies: confirmationRequests.slice(firstCallIndex).map(({ body }) => body),
      authorizationHeaderPresent: confirmationRequests
        .slice(firstCallIndex)
        .some(({ authorization }) => Boolean(authorization)),
      documentWidth,
    });
  }

  const reportPath = testInfo.outputPath('shared-2fa-confirm-transport-recovery.json');
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        browserVersion: page.context().browser()?.version(),
        project: testInfo.project.name,
        fixtureBoundary:
          'Setup challenge and successful confirmation were local Playwright fixtures; the first confirmation response was deliberately aborted after dispatch. This does not establish server outcome, replay safety, or backend idempotency.',
        observations,
      },
      null,
      2,
    ),
  );
  await testInfo.attach('shared-2fa-confirm-transport-recovery.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('measures shared 2FA setup dark-theme keyboard focus and backup-code contrast @auth-api', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'phone', prefix: '', width: 390, height: 844 },
    { name: 'tablet', prefix: '/t', width: 768, height: 900 },
    { name: 'responsive', prefix: '/r', width: 1024, height: 900 },
  ];
  const observations: Array<Record<string, unknown>> = [];
  const failures: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', (route) =>
    route.fulfill({
      json: {
        secret: 'DARK-SETUP-SECRET-1234567890',
        qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        backupCodes: ['dark-backup-1234', 'dark-backup-5678'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );
  const confirmationRequests: Array<Record<string, unknown>> = [];
  await page.route('https://e2e.test/auth/mfa/setup/confirm', async (route) => {
    confirmationRequests.push(route.request().postDataJSON() as Record<string, unknown>);
    return route.fulfill({ json: session });
  });

  const reachByTab = async (locator: Locator, label: string) => {
    const traversed: string[] = [];
    for (let index = 0; index < 20; index += 1) {
      await page.keyboard.press('Tab');
      const activeLabel = await page.evaluate(() => {
        const active = document.activeElement;
        if (!(active instanceof HTMLElement)) return '';
        return active.getAttribute('aria-label') || active.innerText?.trim() || active.tagName;
      });
      traversed.push(activeLabel);
      if (await locator.evaluate((element) => element === document.activeElement)) {
        return traversed;
      }
    }
    failures.push({
      issue: 'keyboard target unreachable',
      target: label,
      traversed,
    });
    return traversed;
  };
  const sampleContrast = (locator: Locator) =>
    locator.evaluate((element) => {
      const channels = (color: string) => {
        const values = color.match(/[\d.]+/g)?.map(Number) ?? [];
        return values.length >= 3 ? values.slice(0, 3) : [0, 0, 0];
      };
      const luminance = (color: string) => {
        const linear = channels(color).map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const foreground = getComputedStyle(element).color;
      let background = getComputedStyle(document.body).backgroundColor;
      let backgroundOwner = 'body';
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const candidate = getComputedStyle(ancestor).backgroundColor;
        const alpha = Number(candidate.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/)?.[1] ?? 1);
        if (alpha >= 0.99) {
          background = candidate;
          backgroundOwner = `${ancestor.tagName.toLowerCase()}.${String(ancestor.className).trim().replace(/\s+/g, '.')}`;
          break;
        }
      }
      const first = luminance(foreground);
      const second = luminance(background);
      return {
        foreground,
        background,
        backgroundOwner,
        ratio: Number(
          ((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)).toFixed(2),
        ),
      };
    });
  const sampleFocus = (locator: Locator) =>
    locator.evaluate((element) => {
      const style = getComputedStyle(element);
      const parentStyle = getComputedStyle(element.parentElement ?? element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
        parentOutlineStyle: parentStyle.outlineStyle,
        parentOutlineWidth: parentStyle.outlineWidth,
        parentOutlineColor: parentStyle.outlineColor,
      };
    });
  const checkFocusIndicator = (focus: Record<string, string>, shell: string, target: string) => {
    const width = Number.parseFloat(focus.outlineWidth ?? '0');
    const hasVisibleOutline = focus.outlineStyle !== 'none' && width >= 2;
    const hasVisibleShadow =
      focus.boxShadow !== 'none' && !focus.boxShadow.startsWith('rgba(0, 0, 0, 0)');
    if (!hasVisibleOutline && !hasVisibleShadow) {
      failures.push({
        issue: 'keyboard focus indicator missing',
        shell,
        target,
        focus,
      });
    }
  };

  for (const shell of shells) {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(`${shell.prefix}/auth/2fa-setup`);
    await expect(page.getByRole('heading', { name: 'Bước 1: Quét mã QR' })).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });

    const stepper = page.locator('div.flex.items-center.px-5.py-4.gap-2');
    const inactiveStepMarker = stepper.getByText('3', { exact: true });
    const stepOneProgressContrast = await sampleContrast(inactiveStepMarker);
    if (Number(stepOneProgressContrast.ratio) < 4.5) {
      failures.push({
        issue: 'inactive step indicator contrast below 4.5:1',
        shell: shell.name,
        state: 'setup QR',
        progressContrast: stepOneProgressContrast,
      });
    }

    const copyButton = page.getByRole('button', { name: 'Sao chép' });
    const continueButton = page.getByRole('button', { name: /Tiếp theo/ });
    const stepOneTraversal = await reachByTab(copyButton, 'Sao chép');
    await page.keyboard.press('Tab');
    await expect(continueButton).toBeFocused();
    const continueFocus = await sampleFocus(continueButton);
    checkFocusIndicator(continueFocus, shell.name, 'Continue from setup QR');
    await page.keyboard.press('Enter');

    const otpInput = page.getByRole('textbox', {
      name: 'Mã xác thực 6 chữ số',
    });
    const otpGroup = page.getByRole('group', {
      name: 'Mã xác thực gồm 6 chữ số',
    });
    const helper = page.getByText('Chạm vào đây để nhập mã', { exact: true });
    await expect(page.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();
    await expect(otpInput).toBeFocused();
    const otpFocus = await sampleFocus(otpGroup);
    checkFocusIndicator(otpFocus, shell.name, 'OTP input group');
    const helperContrast = await sampleContrast(helper);
    const stepTwoProgressContrast = await sampleContrast(inactiveStepMarker);
    if (Number(helperContrast.ratio) < 4.5) {
      failures.push({
        issue: 'OTP helper contrast below 4.5:1',
        shell: shell.name,
        helperContrast,
      });
    }
    if (Number(stepTwoProgressContrast.ratio) < 4.5) {
      failures.push({
        issue: 'inactive step indicator contrast below 4.5:1',
        shell: shell.name,
        state: 'OTP confirmation',
        progressContrast: stepTwoProgressContrast,
      });
    }

    const otpScreenshotPath = testInfo.outputPath(`${shell.name}-2fa-otp-dark-focus.png`);
    await page.screenshot({
      path: otpScreenshotPath,
      fullPage: true,
      animations: 'disabled',
    });
    await testInfo.attach(`${shell.name}-2fa-otp-dark-focus`, {
      path: otpScreenshotPath,
      contentType: 'image/png',
    });
    const otpDocumentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(otpDocumentWidth, `${shell.name} OTP screen overflows`).toBeLessThanOrEqual(shell.width);

    await otpInput.pressSequentially('246810');
    await expect(otpInput).toHaveValue('246810');
    const confirmButton = page.getByRole('button', { name: 'Xác nhận' });
    await page.keyboard.press('Tab');
    await expect(confirmButton).toBeFocused();
    const confirmFocus = await sampleFocus(confirmButton);
    checkFocusIndicator(confirmFocus, shell.name, 'Confirm OTP');
    await page.keyboard.press('Enter');
    const backupHeading = page.getByRole('heading', {
      name: 'Bước 3: Mã dự phòng',
    });
    await expect(backupHeading).toBeVisible();
    await expect(backupHeading).toBeFocused();
    await expect(page.getByText('dark-backup-1234', { exact: true })).toBeVisible();
    const focusAfterConfirmation = await page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLElement
        ? { tagName: active.tagName, text: active.innerText?.trim() ?? '' }
        : null;
    });
    const backupHeadingFocus = await sampleFocus(backupHeading);
    checkFocusIndicator(backupHeadingFocus, shell.name, 'Backup-code step heading');
    const headingScreenshotPath = testInfo.outputPath(
      `${shell.name}-2fa-backup-dark-heading-focus.png`,
    );
    await page.screenshot({
      path: headingScreenshotPath,
      fullPage: true,
      animations: 'disabled',
    });
    await testInfo.attach(`${shell.name}-2fa-backup-dark-heading-focus`, {
      path: headingScreenshotPath,
      contentType: 'image/png',
    });
    const backupDocumentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(backupDocumentWidth, `${shell.name} backup screen overflows`).toBeLessThanOrEqual(
      shell.width,
    );

    const codeIndex = page.getByText('1.', { exact: true });
    const backupIndexContrast = await sampleContrast(codeIndex);
    if (Number(backupIndexContrast.ratio) < 4.5) {
      failures.push({
        issue: 'backup-code index contrast below 4.5:1',
        shell: shell.name,
        backupIndexContrast,
      });
    }

    const savedCodesButton = page.getByRole('button', {
      name: 'Tôi đã lưu các mã dự phòng',
    });
    const stepThreeTraversal = await reachByTab(savedCodesButton, 'Tôi đã lưu các mã dự phòng');
    const savedCodesFocus = await sampleFocus(savedCodesButton);
    checkFocusIndicator(savedCodesFocus, shell.name, 'Confirm backup-code retention');
    await page.keyboard.press('Space');
    await expect(savedCodesButton).toHaveAttribute('aria-pressed', 'true');
    const backupScreenshotPath = testInfo.outputPath(`${shell.name}-2fa-backup-dark-keyboard.png`);
    await page.screenshot({
      path: backupScreenshotPath,
      fullPage: true,
      animations: 'disabled',
    });
    await testInfo.attach(`${shell.name}-2fa-backup-dark-keyboard`, {
      path: backupScreenshotPath,
      contentType: 'image/png',
    });

    const finishButton = page.getByRole('button', {
      name: /Hoàn tất thiết lập 2FA/,
    });
    await page.keyboard.press('Tab');
    await expect(finishButton).toBeFocused();
    const finishFocus = await sampleFocus(finishButton);
    checkFocusIndicator(finishFocus, shell.name, 'Finish 2FA setup');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/home$`));

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    observations.push({
      shell: shell.name,
      route: `${shell.prefix}/auth/2fa-setup`,
      viewport: { width: shell.width, height: shell.height },
      theme: 'dark',
      stepOneTabSequence: stepOneTraversal,
      continueFocus,
      stepOneProgressContrast,
      otpFocus,
      otpDocumentWidth,
      helperContrast,
      stepTwoProgressContrast,
      submittedCode: '246810',
      confirmationBody: confirmationRequests.at(-1),
      confirmFocus,
      backupHeadingFocus,
      backupIndexContrast,
      backupDocumentWidth,
      stepThreeTabSequence: stepThreeTraversal,
      focusAfterConfirmation,
      savedCodesFocus,
      savedCodesActivatedWithSpace: true,
      finishFocus,
      finishActivatedWithEnter: true,
      finalRoute: new URL(page.url()).pathname,
      documentWidth,
      horizontalOverflow: documentWidth > shell.width,
      fixtureBoundary:
        'Session, setup challenge and confirmation success use local Playwright route fixtures.',
    });
    expect(
      documentWidth,
      `${shell.name} dark setup overflows at ${shell.width}px`,
    ).toBeLessThanOrEqual(shell.width);
  }

  const report = {
    browserVersion: page.context().browser()?.version(),
    project: testInfo.project.name,
    contrastThreshold: '4.5:1 for small text',
    observations,
    failures,
    fixtureBoundary:
      'This is local Chromium/Vite evidence using route fixtures; it does not verify the backend, MFA policy or human/screen-reader acceptance.',
  };
  const reportPath = testInfo.outputPath('shared-2fa-dark-keyboard-focus.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  await testInfo.attach('shared-2fa-dark-keyboard-focus.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});

test('measures Web 2FA setup dark-theme keyboard focus and contrast @auth-api', async ({
  page,
}, testInfo) => {
  const viewport = { width: 1440, height: 900 };
  const failures: Array<Record<string, unknown>> = [];
  await page.setViewportSize(viewport);
  await page.route('**/auth/session', (route) => route.fulfill({ json: session }));
  await page.route('https://e2e.test/auth/mfa/setup', (route) =>
    route.fulfill({
      json: {
        secret: 'dark-web-setup-secret-123456',
        qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
        backupCodes: ['dark-web-backup-1234', 'dark-web-backup-5678'],
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    }),
  );
  await page.route('https://e2e.test/auth/mfa/setup/confirm', (route) =>
    route.fulfill({ json: session }),
  );
  await page.goto('/w/auth/2fa-setup');
  await expect(page.getByText('dark-web-setup-secret-123456', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  });

  const contrast = (locator: Locator) =>
    locator.evaluate((element) => {
      const luminance = (color: string) => {
        const channels = color
          .match(/[\d.]+/g)
          ?.map(Number)
          .slice(0, 3) ?? [0, 0, 0];
        const linear = channels.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const foreground = getComputedStyle(element).color;
      let background = getComputedStyle(document.body).backgroundColor;
      let backgroundOwner = 'body';
      for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
        const candidate = getComputedStyle(ancestor).backgroundColor;
        const alpha = Number(candidate.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/)?.[1] ?? 1);
        if (alpha >= 0.99) {
          background = candidate;
          backgroundOwner =
            ancestor.tagName.toLowerCase() +
            '.' +
            String(ancestor.className).trim().split(' ').join('.');
          break;
        }
      }
      const first = luminance(foreground);
      const second = luminance(background);
      return {
        foreground,
        background,
        backgroundOwner,
        ratio: Number(
          ((Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)).toFixed(3),
        ),
      };
    });
  const focusStyle = (locator: Locator) =>
    locator.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        boxShadow: style.boxShadow,
      };
    });
  const checkFocus = (target: string, style: Record<string, string>) => {
    const outlined = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2;
    const shadowed = style.boxShadow !== 'none' && !style.boxShadow.startsWith('rgba(0, 0, 0, 0)');
    if (!outlined && !shadowed)
      failures.push({
        issue: 'missing visible focus indicator',
        target,
        style,
      });
  };
  const checkContrast = (target: string, sample: Record<string, unknown>) => {
    if (Number(sample.ratio) < 4.5)
      failures.push({
        issue: 'small-text contrast below 4.5:1',
        target,
        sample,
      });
  };
  const stepper = page.getByRole('list', { name: 'Tiến trình thiết lập 2FA' });
  const inactiveLabel = stepper.getByRole('listitem').nth(1).getByText('Xác minh', { exact: true });
  const inactiveNumber = stepper.getByRole('listitem').nth(1).locator('[aria-hidden="true"] span');
  const manualKeyLabel = page.getByText('Hoặc nhập thủ công khóa bí mật:', {
    exact: true,
  });
  const stepOneContrast = {
    inactiveLabel: await contrast(inactiveLabel),
    inactiveNumber: await contrast(inactiveNumber),
    manualKeyLabel: await contrast(manualKeyLabel),
  };
  for (const [target, sample] of Object.entries(stepOneContrast)) checkContrast(target, sample);
  const qrScreenshot = testInfo.outputPath('web-2fa-setup-qr-dark.png');
  await page.screenshot({
    path: qrScreenshot,
    fullPage: true,
    animations: 'disabled',
  });
  await testInfo.attach('web-2fa-setup-qr-dark', {
    path: qrScreenshot,
    contentType: 'image/png',
  });

  const skipButton = page.getByRole('button', { name: 'Bỏ qua thiết lập' });
  const copyButton = page.getByRole('button', { name: 'Sao chép' });
  const nextButton = page.getByRole('button', {
    name: 'Tiếp theo — Xác minh mã',
  });
  await page.keyboard.press('Tab');
  await expect(skipButton).toBeFocused();
  const skipFocus = await focusStyle(skipButton);
  checkFocus('Skip setup', skipFocus);
  await page.keyboard.press('Tab');
  await expect(copyButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(nextButton).toBeFocused();
  const nextFocus = await focusStyle(nextButton);
  checkFocus('Continue to code verification', nextFocus);
  await page.keyboard.press('Enter');

  const otpGroup = page.getByRole('group', {
    name: 'Mã xác thực gồm 6 chữ số',
  });
  const otpInputs = otpGroup.getByRole('textbox');
  await expect(otpInputs).toHaveCount(6);
  await expect(otpInputs.nth(0)).toBeFocused();
  await page.waitForTimeout(250);
  const otpFocus = await focusStyle(otpInputs.nth(0));
  checkFocus('First verification code input', otpFocus);
  await otpInputs.nth(0).pressSequentially('246810');
  await expect(otpInputs.nth(5)).toHaveValue('0');
  const backButton = page.getByRole('button', { name: 'Quay lại' });
  const verifyButton = page.getByRole('button', { name: 'Xác minh' });
  await page.keyboard.press('Tab');
  await expect(backButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(verifyButton).toBeFocused();
  const verifyFocus = await focusStyle(verifyButton);
  checkFocus('Verify setup code', verifyFocus);
  await page.keyboard.press('Enter');

  const backupHeading = page.getByRole('heading', { name: 'Lưu mã dự phòng' });
  await expect(backupHeading).toBeVisible();
  const backupHeadingFocused = await backupHeading.evaluate(
    (element) => element === document.activeElement,
  );
  const backupHeadingFocus = await focusStyle(backupHeading);
  if (!backupHeadingFocused)
    failures.push({
      issue: 'verification transition did not move focus to the backup-code heading',
    });
  else checkFocus('Backup-code heading', backupHeadingFocus);
  const backupIndex = await contrast(page.getByText('1.', { exact: true }));
  checkContrast('Backup-code index', backupIndex);
  const backupScreenshot = testInfo.outputPath('web-2fa-setup-backup-dark.png');
  await page.screenshot({
    path: backupScreenshot,
    fullPage: true,
    animations: 'disabled',
  });
  await testInfo.attach('web-2fa-setup-backup-dark', {
    path: backupScreenshot,
    contentType: 'image/png',
  });

  const copyCodes = page.getByRole('button', { name: 'Sao chép tất cả mã' });
  await page.keyboard.press('Tab');
  await expect(copyCodes).toBeFocused();
  const savedCodesButton = page.getByRole('button', {
    name: 'Tôi đã lưu mã dự phòng ở nơi an toàn',
  });
  await page.keyboard.press('Tab');
  await expect(savedCodesButton).toBeFocused();
  const savedCodesFocus = await focusStyle(savedCodesButton);
  checkFocus('Acknowledge saved backup codes', savedCodesFocus);
  await page.keyboard.press('Space');
  const savedCodesPressed = await savedCodesButton.getAttribute('aria-pressed');
  if (savedCodesPressed !== 'true')
    failures.push({
      issue: 'backup-code acknowledgement state is not exposed with aria-pressed',
      savedCodesPressed,
    });
  const finishButton = page.getByRole('button', { name: /Hoàn tất thiết lập/ });
  await page.keyboard.press('Tab');
  await expect(finishButton).toBeFocused();
  const finishFocus = await focusStyle(finishButton);
  checkFocus('Complete setup', finishFocus);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/w\/auth\/success$/);

  const report = {
    browserVersion: page.context().browser()?.version(),
    route: '/w/auth/2fa-setup',
    viewport,
    theme: 'dark',
    contrastThreshold: 4.5,
    stepOneContrast,
    backupIndexContrast: backupIndex,
    focus: {
      skipFocus,
      nextFocus,
      otpFocus,
      verifyFocus,
      backupHeadingFocused,
      backupHeadingFocus,
      savedCodesFocus,
      finishFocus,
    },
    savedCodesPressed,
    fixtureBoundary:
      'Session, setup challenge and confirmation success are local Playwright fixtures; no live MFA backend or owner policy is tested.',
    failures,
  };
  const reportPath = testInfo.outputPath('web-2fa-setup-dark-keyboard-focus.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n');
  await testInfo.attach('web-2fa-setup-dark-keyboard-focus.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
test('keeps login MFA OTP usable through Auth, Tablet and Responsive shells @auth-api', async ({
  page,
}, testInfo) => {
  const loginPrefixes = ['', '/t', '/r'];
  const viewportWidths = [390, 768, 1440];
  const viewportMeasurements: Array<Record<string, unknown>> = [];
  let challengeId = '';
  let verificationRequest: { body: Record<string, unknown>; authorization?: string } | undefined;

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/login', (route) =>
    route.fulfill({
      json: {
        status: 'mfa_required',
        challenge: {
          id: challengeId,
          method: 'totp',
          maskedDestination: 'ứng dụng xác thực',
          expiresAt: '2099-01-01T00:05:00.000Z',
        },
      },
    }),
  );
  await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
    verificationRequest = {
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    };
    return route.fulfill({ status: 400 });
  });

  for (const prefix of loginPrefixes) {
    const shell = prefix === '/t' ? 'tablet' : prefix === '/r' ? 'responsive' : 'auth';
    for (const width of viewportWidths) {
      challengeId = `${shell}-login-mfa-${width}`;
      verificationRequest = undefined;
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`${prefix}/auth/login`);
      await expect(page.getByTestId('auth-email')).toBeVisible();
      await expect(page.getByText(/^\d{2}:\d{2}$/).filter({ visible: true })).toHaveCount(1);
      await page.getByTestId('auth-email').fill(`${shell}-${width}@example.com`);
      await page.getByTestId('auth-password').fill('valid-test-password');
      await page.getByTestId('auth-submit').click();

      const otpPath = `${prefix}/auth/otp`;
      await expect(page).toHaveURL(new RegExp(`${otpPath.replaceAll('/', '\\/')}$`));
      await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
      const otpGroup = page.getByRole('group', {
        name: 'Mã xác thực gồm 6 chữ số',
      });
      await expect(otpGroup).toHaveAttribute('aria-describedby', 'otp-instructions');
      const otpInputs = Array.from({ length: 6 }, (_, index) =>
        page.getByRole('textbox', { name: `Ký tự OTP ${index + 1}` }),
      );
      await expect(otpInputs[0]).toBeFocused();
      for (let index = 0; index < otpInputs.length; index += 1) {
        expect(
          await isFullyVisibleHorizontally(otpInputs[index]),
          `${otpPath} clips OTP cell ${index + 1} at ${width}px`,
        ).toBe(true);
      }
      const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(contentWidth, `${otpPath} document overflows at ${width}px`).toBeLessThanOrEqual(
        pageWidth,
      );
      const layout = await otpGroup.evaluate((group) => {
        const groupBounds = group.getBoundingClientRect();
        const clipBounds = {
          left: 0,
          right: document.documentElement.clientWidth,
        };
        for (let ancestor = group.parentElement; ancestor; ancestor = ancestor.parentElement) {
          if (getComputedStyle(ancestor).overflowX === 'visible') continue;
          const bounds = ancestor.getBoundingClientRect();
          clipBounds.left = Math.max(clipBounds.left, bounds.left);
          clipBounds.right = Math.min(clipBounds.right, bounds.right);
        }
        return {
          group: {
            left: groupBounds.left,
            right: groupBounds.right,
            width: groupBounds.width,
          },
          clip: {
            left: clipBounds.left,
            right: clipBounds.right,
            width: clipBounds.right - clipBounds.left,
          },
          cells: Array.from(group.querySelectorAll<HTMLInputElement>('input')).map((input) => {
            const bounds = input.getBoundingClientRect();
            return {
              left: bounds.left,
              right: bounds.right,
              width: bounds.width,
            };
          }),
          document: {
            width: document.documentElement.scrollWidth,
            viewportWidth: document.documentElement.clientWidth,
          },
        };
      });
      viewportMeasurements.push({
        shell,
        path: otpPath,
        viewportWidth: width,
        ...layout,
      });

      if (width === 390) {
        const screenshotPath = testInfo.outputPath(`${shell}-login-otp-focused-390x844.png`);
        await page.screenshot({ path: screenshotPath });
        await testInfo.attach(`${shell}-login-otp-focused-390x844`, {
          path: screenshotPath,
          contentType: 'image/png',
        });
      }

      for (const input of otpInputs) await input.fill('1');
      await expect
        .poll(() => verificationRequest)
        .toEqual({
          body: { challengeId, code: '111111' },
          authorization: undefined,
        });
      await expect(page.getByRole('alert')).toHaveText('Mã OTP không đúng. Vui lòng thử lại.');
      await expect(page).toHaveURL(new RegExp(`${otpPath.replaceAll('/', '\\/')}$`));
      await expect(otpInputs[0]).toBeFocused();
      await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    }
  }

  const measurementPath = testInfo.outputPath('login-mfa-otp-responsive-measurements.json');
  await writeFile(measurementPath, JSON.stringify(viewportMeasurements, null, 2));
  await testInfo.attach('login-mfa-otp-responsive-measurements.json', {
    path: measurementPath,
    contentType: 'application/json',
  });
});

test('keeps Web login MFA OTP usable at narrow and desktop widths @auth-api', async ({
  page,
}, testInfo) => {
  const viewportWidths = [320, 360, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];
  let challengeId = '';
  let verificationRequest: { body: Record<string, unknown>; authorization?: string } | undefined;

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
  await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
    verificationRequest = {
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    };
    await new Promise((resolve) => setTimeout(resolve, 200));
    return route.fulfill({ status: 400 });
  });

  for (const width of viewportWidths) {
    challengeId = `web-login-mfa-${width}`;
    verificationRequest = undefined;
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/w/auth/login');
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await page.getByTestId('auth-email').fill(`web-${width}@example.com`);
    await page.getByTestId('auth-password').fill('valid-test-password');
    await page.getByTestId('auth-submit').click();

    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    const otpGroup = page.getByRole('group', {
      name: 'Mã xác thực gồm 6 chữ số',
    });
    await expect(otpGroup).toHaveAttribute('aria-describedby', 'otp-instructions');
    const otpInputs = otpGroup.locator('input[maxlength="1"]');
    await expect(otpInputs).toHaveCount(6);
    await expect(otpInputs.nth(0)).toBeFocused();
    for (let index = 0; index < 6; index += 1) {
      expect(
        await isFullyVisibleHorizontally(otpInputs.nth(index)),
        `/w/auth/otp clips OTP cell ${index + 1} at ${width}px`,
      ).toBe(true);
    }
    const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const contentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(contentWidth, `Web OTP document overflows at ${width}px`).toBeLessThanOrEqual(pageWidth);
    measurements.push(
      await otpGroup.evaluate((group) => {
        const groupBounds = group.getBoundingClientRect();
        const clipBounds = {
          left: 0,
          right: document.documentElement.clientWidth,
        };
        for (let ancestor = group.parentElement; ancestor; ancestor = ancestor.parentElement) {
          if (getComputedStyle(ancestor).overflowX === 'visible') continue;
          const bounds = ancestor.getBoundingClientRect();
          clipBounds.left = Math.max(clipBounds.left, bounds.left);
          clipBounds.right = Math.min(clipBounds.right, bounds.right);
        }
        const cells = Array.from(group.querySelectorAll<HTMLInputElement>('input')).map((input) => {
          const bounds = input.getBoundingClientRect();
          return {
            left: bounds.left,
            right: bounds.right,
            width: bounds.width,
          };
        });
        return {
          viewportWidth: document.documentElement.clientWidth,
          group: {
            left: groupBounds.left,
            right: groupBounds.right,
            width: groupBounds.width,
          },
          row: {
            left: cells[0].left,
            right: cells[cells.length - 1].right,
            width: cells[cells.length - 1].right - cells[0].left,
          },
          clip: {
            left: clipBounds.left,
            right: clipBounds.right,
            width: clipBounds.right - clipBounds.left,
          },
          cells,
        };
      }),
    );
    if (width === 320 || width === 390 || width === 1440) {
      const screenshotPath = testInfo.outputPath(`web-login-otp-focused-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-login-otp-focused-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }

    for (let index = 0; index < 6; index += 1) await otpInputs.nth(index).fill('1');
    const loadingStatus = page.getByRole('status');
    await expect(loadingStatus).toHaveText('Đang xác thực...');
    await expect(otpInputs.nth(0)).toBeDisabled();
    Object.assign(measurements[measurements.length - 1], {
      verificationPending: {
        role: await loadingStatus.getAttribute('role'),
        text: (await loadingStatus.textContent())?.trim(),
        disabledOtpInputs: await otpInputs.evaluateAll(
          (inputs) => inputs.filter((input) => (input as HTMLInputElement).disabled).length,
        ),
      },
    });
    if (width === 320 || width === 1440) {
      const screenshotPath = testInfo.outputPath(`web-login-otp-pending-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-login-otp-pending-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
    await expect
      .poll(() => verificationRequest)
      .toEqual({
        body: { challengeId, code: '111111' },
        authorization: undefined,
      });
    await expect(page.getByRole('alert')).toHaveText(
      'Mã xác thực không đúng. Vui lòng kiểm tra lại.',
    );
    for (let index = 0; index < 6; index += 1) {
      await expect(otpInputs.nth(index)).toHaveAttribute('aria-invalid', 'true');
      await expect(otpInputs.nth(index)).toHaveAttribute('aria-describedby', 'otp-error');
    }
    await expect(otpInputs.nth(0)).toBeFocused();
    await expect(page).toHaveURL(/\/w\/auth\/otp$/);
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  }

  const measurementPath = testInfo.outputPath('web-login-mfa-otp-responsive-measurements.json');
  await writeFile(measurementPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-login-mfa-otp-responsive-measurements.json', {
    path: measurementPath,
    contentType: 'application/json',
  });
});

test('exposes Web login fields accessibly without horizontal clipping @auth-api', async ({
  page,
}, testInfo) => {
  const viewportWidths = [320, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const width of viewportWidths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/w/auth/login');

    const email = page.getByRole('textbox', { name: 'Email' });
    const password = page.getByTestId('auth-password');
    const submit = page.getByRole('button', { name: 'Đăng nhập' });
    await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(password).toHaveAccessibleName('Mật khẩu');
    await expect(submit).toBeVisible();

    const document = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    const visible = {
      email: await isFullyVisibleHorizontally(email),
      password: await isFullyVisibleHorizontally(password),
      submit: await isFullyVisibleHorizontally(submit),
    };
    expect(document.documentWidth, `Web login overflows at ${width}px`).toBeLessThanOrEqual(
      document.viewportWidth,
    );
    expect(visible, `Web login controls are clipped at ${width}px`).toEqual({
      email: true,
      password: true,
      submit: true,
    });
    measurements.push({
      path: '/w/auth/login',
      viewportWidth: width,
      viewportHeight: 900,
      ...document,
      visible,
    });

    if (width === 320 || width === 1440) {
      if (width === 1440) await page.waitForTimeout(1600);
      const screenshotPath = testInfo.outputPath(`web-auth-login-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-auth-login-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }

  const reportPath = testInfo.outputPath('web-auth-login-responsive.json');
  await writeFile(reportPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-auth-login-responsive.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('submits Web login from the keyboard with one contract request @auth-api', async ({
  page,
}, testInfo) => {
  const loginRequests: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];
  let authenticated = false;

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/auth/session', (route) =>
    route.fulfill({ json: authenticated ? session : null }),
  );
  await page.route('https://e2e.test/auth/login', async (route) => {
    loginRequests.push({
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    });
    authenticated = true;
    return route.fulfill({ json: { status: 'authenticated', session } });
  });
  await page.route('**/market/pairs**', (route) => route.fulfill({ json: { items: [] } }));
  await page.route('**/market/watchlist', (route) => route.fulfill({ json: { items: [] } }));

  await page.goto('/w/auth/login');
  const email = page.getByRole('textbox', { name: 'Email' });
  const forgotPassword = page.getByRole('button', { name: 'Quên mật khẩu?' });
  const password = page.getByTestId('auth-password');

  await page.getByTestId('auth-submit').click();
  await expect(page.getByRole('alert')).toHaveText('Vui lòng nhập email.');
  expect(loginRequests).toHaveLength(0);

  await email.fill('keyboard@example.com');
  await email.press('Enter');
  await expect(page.getByRole('alert')).toContainText('Vui lòng nhập mật khẩu.');
  expect(loginRequests).toHaveLength(0);

  await page.keyboard.press('Tab');
  await expect(forgotPassword).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();
  await page.keyboard.type('correct-password');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/w\/home$/);
  await expect(page.locator('[data-platform="web"]')).toBeVisible();
  expect(loginRequests).toEqual([
    {
      body: { email: 'keyboard@example.com', password: 'correct-password' },
      authorization: undefined,
    },
  ]);

  const reportPath = testInfo.outputPath('web-auth-login-keyboard.json');
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        route: '/w/auth/login',
        viewport: { width: 1440, height: 900 },
        emptyEmailSubmit: {
          emailRequiredErrorShown: true,
          loginRequestCount: 0,
        },
        emailEnter: { missingPasswordErrorShown: true, loginRequestCount: 0 },
        focusOrder: ['Email', 'Quên mật khẩu?', 'Mật khẩu'],
        passwordEnter: {
          destination: '/w/home',
          loginRequestCount: loginRequests.length,
          platform: (await page.locator('[data-platform="web"]').count()) === 1 ? 'web' : 'unknown',
          requestBody: loginRequests[0]?.body,
          authorization: loginRequests[0]?.authorization,
        },
        apiFixtureBoundary:
          'GET /auth/session and POST /auth/login use local Playwright route fixtures.',
      },
      null,
      2,
    ),
  );
  await testInfo.attach('web-auth-login-keyboard.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('keeps Web login recoverable after a transport failure @auth-api', async ({
  page,
}, testInfo) => {
  const loginAttempts: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];
  let authenticated = false;

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/auth/session', (route) =>
    route.fulfill({ json: authenticated ? session : null }),
  );
  await page.route('https://e2e.test/auth/login', async (route) => {
    loginAttempts.push({
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    });

    if (loginAttempts.length === 1) {
      await route.abort('failed');
      return;
    }

    authenticated = true;
    await route.fulfill({ json: { status: 'authenticated', session } });
  });
  await page.route('**/market/pairs**', (route) => route.fulfill({ json: { items: [] } }));
  await page.route('**/market/watchlist', (route) => route.fulfill({ json: { items: [] } }));

  await page.goto('/w/auth/login');
  const email = page.getByRole('textbox', { name: 'Email' });
  const password = page.getByTestId('auth-password');
  await email.fill('retry@example.com');
  await password.fill('correct-password');
  await page.getByTestId('auth-submit').click();

  await expect(page.getByRole('alert')).toHaveText(
    'Không thể đăng nhập lúc này. Vui lòng thử lại.',
  );
  await expect(page).toHaveURL(/\/w\/auth\/login$/);
  const emailRetained = await email.inputValue();
  const passwordRetained = await password.inputValue();

  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/w\/home$/);
  await expect(page.locator('[data-platform="web"]')).toBeVisible();
  expect(loginAttempts).toHaveLength(2);
  expect(loginAttempts[0]?.body).toEqual(loginAttempts[1]?.body);
  expect(loginAttempts.every((attempt) => !attempt.authorization)).toBe(true);
  expect(emailRetained).toBe('retry@example.com');
  expect(passwordRetained).toBe('correct-password');

  const reportPath = testInfo.outputPath('web-auth-login-recoverable-error.json');
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        route: '/w/auth/login',
        viewport: { width: 1440, height: 900 },
        firstAttempt: {
          transportFailure: 'request-aborted',
          recoverableAlertShown: true,
          destination: '/w/auth/login',
          credentialValuesRetained:
            emailRetained === 'retry@example.com' && passwordRetained === 'correct-password',
        },
        retry: {
          destination: '/w/home',
          platform: 'web',
          requestCount: loginAttempts.length,
          requestBodiesIdentical:
            JSON.stringify(loginAttempts[0]?.body) === JSON.stringify(loginAttempts[1]?.body),
          authorizationHeaderPresent: loginAttempts.some((attempt) =>
            Boolean(attempt.authorization),
          ),
        },
        apiFixtureBoundary:
          'GET /auth/session and POST /auth/login use local Playwright route fixtures; the first login request is deliberately aborted.',
      },
      null,
      2,
    ),
  );
  await testInfo.attach('web-auth-login-recoverable-error.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('keeps password recovery usable across Auth shells and responsive widths @auth-api', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'auth', prefix: '' },
    { name: 'tablet', prefix: '/t' },
    { name: 'responsive', prefix: '/r' },
    { name: 'web', prefix: '/w' },
  ];
  const viewportWidths = [320, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];
  const passwordResetRequests: Array<{
    path: string;
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/password-reset/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().postDataJSON() as Record<string, unknown>;
    passwordResetRequests.push({
      path,
      body,
      authorization: route.request().headers().authorization,
    });

    if (path.endsWith('/request')) return route.fulfill({ status: 204 });
    if (path.endsWith('/verify')) {
      if (body.code === '000000') return route.fulfill({ status: 400 });
      return route.fulfill({ json: { resetToken: 'fixture-reset-token' } });
    }
    if (path.endsWith('/confirm')) return route.fulfill({ status: 204 });
    return route.fulfill({ status: 404 });
  });

  const measureVisibleLayout = async () =>
    page.evaluate(() => {
      const main = document.querySelector('[role="main"]');
      if (!main) throw new Error('Auth page main landmark is missing');
      const elements = Array.from(main.querySelectorAll('input, button, [role="alert"], h1, h2'));
      const visibleBounds = (element: Element) => {
        const bounds = { left: 0, right: document.documentElement.clientWidth };
        for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
          if (getComputedStyle(ancestor).overflowX === 'visible') continue;
          const rect = ancestor.getBoundingClientRect();
          bounds.left = Math.max(bounds.left, rect.left);
          bounds.right = Math.min(bounds.right, rect.right);
        }
        return bounds;
      };
      const items = elements
        .filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const clip = visibleBounds(element);
          return {
            tag: element.tagName.toLowerCase(),
            label:
              element.getAttribute('aria-label') ||
              element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 64) ||
              (element as HTMLInputElement).type,
            left: rect.left,
            right: rect.right,
            width: rect.width,
            clipLeft: clip.left,
            clipRight: clip.right,
            clipped: rect.left < clip.left || rect.right > clip.right,
          };
        });
      return {
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        items,
        clippedItems: items.filter((item) => item.clipped),
      };
    });

  for (const shell of shells) {
    for (const width of viewportWidths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${shell.prefix}/auth/forgot-password`);
      await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu' })).toBeVisible();

      let layout = await measureVisibleLayout();
      expect(
        layout.documentWidth,
        `${shell.name} request step overflows at ${width}px`,
      ).toBeLessThanOrEqual(layout.viewportWidth as number);
      expect(layout.clippedItems, `${shell.name} request step clips content at ${width}px`).toEqual(
        [],
      );
      measurements.push({
        shell: shell.name,
        path: page.url(),
        step: 'request',
        ...layout,
      });

      await page.getByLabel('Email đăng ký').fill(`reset-${shell.name}-${width}@example.com`);
      await page.getByRole('button', { name: 'Gửi mã xác minh' }).click();
      await expect(page.getByRole('heading', { name: 'Nhập mã OTP' })).toBeVisible();
      const otp = page.getByRole('textbox', { name: 'Mã OTP' });
      await expect(otp).toBeVisible();
      layout = await measureVisibleLayout();
      expect(
        layout.documentWidth,
        `${shell.name} OTP step overflows at ${width}px`,
      ).toBeLessThanOrEqual(layout.viewportWidth as number);
      expect(layout.clippedItems, `${shell.name} OTP step clips content at ${width}px`).toEqual([]);
      measurements.push({
        shell: shell.name,
        path: page.url(),
        step: 'otp',
        ...layout,
      });
      if (width === 320) {
        const screenshotPath = testInfo.outputPath(`${shell.name}-password-reset-otp-320x900.png`);
        await page.screenshot({ path: screenshotPath });
        await testInfo.attach(`${shell.name}-password-reset-otp-320x900`, {
          path: screenshotPath,
          contentType: 'image/png',
        });
      }

      await otp.fill('000000');
      await page.getByRole('button', { name: 'Xác nhận' }).click();
      await expect(page.getByRole('alert')).toHaveText('Mã xác minh không đúng hoặc đã hết hạn.');
      await expect(page.getByRole('heading', { name: 'Nhập mã OTP' })).toBeVisible();
      expect(
        passwordResetRequests.at(-1),
        `${shell.name} invalid-code request at ${width}px`,
      ).toMatchObject({
        path: '/auth/password-reset/verify',
        body: {
          email: `reset-${shell.name}-${width}@example.com`,
          code: '000000',
        },
      });

      await otp.fill('123456');
      await page.getByRole('button', { name: 'Xác nhận' }).click();
      await expect(page.getByRole('heading', { name: 'Mật khẩu mới' })).toBeVisible();
      const newPassword = page.getByLabel('Mật khẩu mới');
      const confirmPassword = page.getByLabel('Nhập lại mật khẩu');
      await expect(newPassword).toBeVisible();
      await expect(confirmPassword).toBeVisible();
      layout = await measureVisibleLayout();
      expect(
        layout.documentWidth,
        `${shell.name} reset step overflows at ${width}px`,
      ).toBeLessThanOrEqual(layout.viewportWidth as number);
      expect(layout.clippedItems, `${shell.name} reset step clips content at ${width}px`).toEqual(
        [],
      );
      measurements.push({
        shell: shell.name,
        path: page.url(),
        step: 'reset',
        ...layout,
      });
      if (width === 320) {
        const screenshotPath = testInfo.outputPath(`${shell.name}-password-reset-form-320x900.png`);
        await page.screenshot({ path: screenshotPath });
        await testInfo.attach(`${shell.name}-password-reset-form-320x900`, {
          path: screenshotPath,
          contentType: 'image/png',
        });
      }

      await newPassword.fill('EnterprisePass123');
      await confirmPassword.fill('EnterprisePass123');
      await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
      await expect(page.getByRole('heading', { name: 'Thành công!' })).toBeVisible();
      await expect(
        page.getByText('Mật khẩu đã được cập nhật. Vui lòng đăng nhập với mật khẩu mới.'),
      ).toBeVisible();
      expect(passwordResetRequests.at(-1)).toMatchObject({
        path: '/auth/password-reset/confirm',
        body: {
          email: `reset-${shell.name}-${width}@example.com`,
          resetToken: 'fixture-reset-token',
          newPassword: 'EnterprisePass123',
        },
      });
      await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
      expect(
        passwordResetRequests.filter((request) => request.authorization !== undefined),
      ).toEqual([]);
      measurements.push({
        shell: shell.name,
        path: page.url(),
        step: 'success',
        viewportWidth: width,
      });
    }
  }

  const measurementPath = testInfo.outputPath('password-reset-responsive-measurements.json');
  await writeFile(
    measurementPath,
    JSON.stringify({ measurements, passwordResetRequests }, null, 2),
  );
  await testInfo.attach('password-reset-responsive-measurements.json', {
    path: measurementPath,
    contentType: 'application/json',
  });
});

test('opens direct password-reset links safely through every Auth shell @auth-api', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'auth', prefix: '' },
    { name: 'tablet', prefix: '/t' },
    { name: 'responsive', prefix: '/r' },
    { name: 'web', prefix: '/w' },
  ];
  const viewportWidths = [320, 390, 768, 1440];
  const successWidths = [390, 768, 1024, 1440];
  const measurements: Array<Record<string, unknown>> = [];
  const resetRequests: Array<{
    path: string;
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/password-reset/**', async (route) => {
    const request = route.request();
    resetRequests.push({
      path: new URL(request.url()).pathname,
      body: request.postDataJSON() as Record<string, unknown>,
      authorization: request.headers().authorization,
    });
    return route.fulfill({ status: 204 });
  });

  for (const shell of shells) {
    for (const width of viewportWidths) {
      const email = 'direct-reset-' + shell.name + '-' + width + '@example.com';
      const path = shell.prefix + '/auth/reset-password?email=' + encodeURIComponent(email);
      const requestCountBeforeMissingToken = resetRequests.length;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page).toHaveURL(new URL(path, page.url()).href);
      await expect(page.getByRole('alert')).toHaveText(
        'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      );
      await expect(page.getByRole('heading', { name: 'Mật khẩu mới' })).toBeVisible();
      const newPassword = page.getByLabel('Mật khẩu mới');
      const confirmPassword = page.getByLabel('Nhập lại mật khẩu');
      await newPassword.fill('strong-password-123');
      await confirmPassword.fill('strong-password-123');
      const submit = page.getByRole('button', { name: 'Đặt lại mật khẩu' });
      await expect(submit).toBeDisabled();
      await confirmPassword.press('Enter');
      expect(resetRequests).toHaveLength(requestCountBeforeMissingToken);
      const layout = await page.getByRole('main').evaluate((main) => {
        const viewportWidth = document.documentElement.clientWidth;
        const visibleBounds = (element: Element) => {
          const bounds = { left: 0, right: viewportWidth };
          for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
            if (getComputedStyle(ancestor).overflowX === 'visible') continue;
            const rect = ancestor.getBoundingClientRect();
            bounds.left = Math.max(bounds.left, rect.left);
            bounds.right = Math.min(bounds.right, rect.right);
          }
          return bounds;
        };
        const items = Array.from(main.querySelectorAll('h1, h2, input, button, [role=alert]'))
          .filter((element) => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const clip = visibleBounds(element);
            return {
              label: element.getAttribute('aria-label') || element.textContent?.trim(),
              clipped: rect.left < clip.left || rect.right > clip.right,
            };
          });
        return {
          viewportWidth,
          documentWidth: document.documentElement.scrollWidth,
          clippedItems: items.filter((item) => item.clipped),
        };
      });
      expect(layout.documentWidth, path + ' overflows at ' + width + 'px').toBeLessThanOrEqual(
        layout.viewportWidth as number,
      );
      expect(layout.clippedItems, path + ' clips content at ' + width + 'px').toEqual([]);
      measurements.push({
        shell: shell.name,
        path,
        state: 'missing-token',
        ...layout,
      });
    }

    const email = 'valid-reset-' + shell.name + '@example.com';
    const path =
      shell.prefix +
      '/auth/reset-password?email=' +
      encodeURIComponent(email) +
      '&resetToken=fixture-direct-reset-token';
    const width = successWidths[shells.indexOf(shell)];
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await expect(page).toHaveURL(new URL(path, page.url()).href);
    await page.getByLabel('Mật khẩu mới').fill('strong-password-123');
    await page.getByLabel('Nhập lại mật khẩu').fill('strong-password-123');
    await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
    await expect(page.getByRole('heading', { name: 'Thành công!' })).toBeVisible();
    expect(resetRequests.at(-1)).toMatchObject({
      path: '/auth/password-reset/confirm',
      body: {
        email,
        resetToken: 'fixture-direct-reset-token',
        newPassword: 'strong-password-123',
      },
    });
    expect(resetRequests.filter((request) => request.authorization !== undefined)).toEqual([]);
    measurements.push({
      shell: shell.name,
      path,
      state: 'valid-token-success',
      viewportWidth: width,
    });
    await page.getByRole('button', { name: 'Đến trang đăng nhập' }).click();
    await expect(page).toHaveURL(new URL(shell.prefix + '/auth/login', page.url()).href);
    await expect(page.getByTestId('auth-email')).toBeVisible();
  }

  expect(resetRequests).toHaveLength(shells.length);
  const reportPath = testInfo.outputPath('password-reset-direct-route-matrix.json');
  await writeFile(reportPath, JSON.stringify({ measurements, resetRequests }, null, 2));
  await testInfo.attach('password-reset-direct-route-matrix.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('renders the shared account-locked route without clipping across Auth shells @auth-api', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'auth', prefix: '' },
    { name: 'tablet', prefix: '/t' },
    { name: 'responsive', prefix: '/r' },
  ];
  const viewportWidths = [320, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const shell of shells) {
    for (const width of viewportWidths) {
      const path = `${shell.prefix}/auth/account-locked`;
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
      await expect(
        page.getByText(/Hệ thống xác thực hiện chưa cho phép đăng nhập tài khoản này/),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Quay lại đăng nhập' })).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Không phải bạn\? Đặt lại mật khẩu/ }),
      ).toBeVisible();
      await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);

      const layout = await page.getByRole('main').evaluate((main) => {
        const viewportWidth = document.documentElement.clientWidth;
        const visibleBounds = (element: Element) => {
          const bounds = { left: 0, right: viewportWidth };
          for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
            if (getComputedStyle(ancestor).overflowX === 'visible') continue;
            const rect = ancestor.getBoundingClientRect();
            bounds.left = Math.max(bounds.left, rect.left);
            bounds.right = Math.min(bounds.right, rect.right);
          }
          return bounds;
        };
        const items = Array.from(main.querySelectorAll('h1, p, button'))
          .filter((element) => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            const clip = visibleBounds(element);
            return {
              label: element.getAttribute('aria-label') || element.textContent?.trim(),
              left: rect.left,
              right: rect.right,
              clipLeft: clip.left,
              clipRight: clip.right,
              clipped: rect.left < clip.left || rect.right > clip.right,
            };
          });
        return {
          viewportWidth,
          documentWidth: document.documentElement.scrollWidth,
          items,
          clippedItems: items.filter((item) => item.clipped),
        };
      });
      expect(layout.documentWidth, `${path} overflows at ${width}px`).toBeLessThanOrEqual(
        layout.viewportWidth as number,
      );
      expect(layout.clippedItems, `${path} clips content at ${width}px`).toEqual([]);

      if (width === 320) {
        const screenshotPath = testInfo.outputPath(`${shell.name}-account-locked-320x900.png`);
        await page.screenshot({ path: screenshotPath });
        await testInfo.attach(`${shell.name}-account-locked-320x900`, {
          path: screenshotPath,
          contentType: 'image/png',
        });
      }

      const securityTips = page.getByRole('region', { name: 'Gợi ý bảo mật' });
      await securityTips.scrollIntoViewIfNeeded();
      const verticalAccess = await securityTips.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top,
          bottom: rect.bottom,
          viewportHeight: document.documentElement.clientHeight,
        };
      });
      expect(
        verticalAccess.top,
        `${path} cannot scroll security guidance into view at ${width}px`,
      ).toBeGreaterThanOrEqual(0);
      expect(
        verticalAccess.bottom,
        `${path} cannot scroll security guidance into view at ${width}px`,
      ).toBeLessThanOrEqual(verticalAccess.viewportHeight);
      measurements.push({
        shell: shell.name,
        path,
        viewportWidth: width,
        ...layout,
        verticalAccess,
      });
    }

    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${shell.prefix}/auth/account-locked`);
    await page.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }).click();
    await expect(page).toHaveURL(new URL(shell.prefix + '/auth/forgot-password', page.url()).href);
    await expect(page.getByRole('heading', { name: 'Đặt lại mật khẩu' })).toBeVisible();

    await page.goto(`${shell.prefix}/auth/account-locked`);
    await page.getByRole('button', { name: 'Quay lại đăng nhập' }).click();
    await expect(page).toHaveURL(new URL(shell.prefix + '/auth/login', page.url()).href);
    await expect(page.getByTestId('auth-email')).toBeVisible();
  }

  const measurementPath = testInfo.outputPath('account-locked-responsive-measurements.json');
  await writeFile(measurementPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('account-locked-responsive-measurements.json', {
    path: measurementPath,
    contentType: 'application/json',
  });
});

test('routes login and login-MFA 423 responses to the shared locked page @auth-api', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'auth', prefix: '' },
    { name: 'tablet', prefix: '/t' },
    { name: 'responsive', prefix: '/r' },
  ];
  let challengeId = '';
  const flowObservations: Array<Record<string, unknown>> = [];
  const loginRequests: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];
  const verifyRequests: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/login', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    loginRequests.push({
      body,
      authorization: route.request().headers().authorization,
    });
    if (String(body.email).startsWith('mfa-')) {
      return route.fulfill({
        json: {
          status: 'mfa_required',
          challenge: {
            id: challengeId,
            method: 'totp',
            maskedDestination: 'ứng dụng xác thực',
            expiresAt: '2099-01-01T00:05:00.000Z',
          },
        },
      });
    }
    return route.fulfill({ status: 423, json: { code: 'AccountLocked' } });
  });
  await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
    verifyRequests.push({
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    });
    return route.fulfill({ status: 423, json: { code: 'AccountLocked' } });
  });

  for (const shell of shells) {
    const path = `${shell.prefix}/auth/login`;
    await page.goto(path);
    await page.getByTestId('auth-email').fill(`locked-${shell.name}@example.com`);
    await page.getByTestId('auth-password').fill('fixture-password');
    await page.getByTestId('auth-submit').click();
    await expect(page).toHaveURL(new URL(shell.prefix + '/auth/account-locked', page.url()).href);
    await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    const loginFlow = {
      responseStatus: 423,
      destination: new URL(page.url()).pathname,
      authenticatedMarkerCount: await page.getByTestId('auth-sign-out').count(),
    };

    challengeId = `locked-mfa-${shell.name}`;
    await page.goto(path);
    await page.getByTestId('auth-email').fill(`mfa-${shell.name}@example.com`);
    await page.getByTestId('auth-password').fill('fixture-password');
    await page.getByTestId('auth-submit').click();
    await expect(page).toHaveURL(new URL(shell.prefix + '/auth/otp', page.url()).href);
    for (let index = 1; index <= 6; index += 1) {
      await page.getByRole('textbox', { name: `Ký tự OTP ${index}` }).fill('1');
    }
    await expect(page).toHaveURL(new URL(shell.prefix + '/auth/account-locked', page.url()).href);
    await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    flowObservations.push({
      shell: shell.name,
      login: loginFlow,
      loginMfa: {
        challengeIssued: true,
        verifyResponseStatus: 423,
        destination: new URL(page.url()).pathname,
        authenticatedMarkerCount: await page.getByTestId('auth-sign-out').count(),
      },
    });
  }

  expect(loginRequests).toHaveLength(6);
  expect(verifyRequests).toHaveLength(3);
  expect(
    loginRequests
      .filter(({ body }) => String(body.email).startsWith('locked-'))
      .map(({ body }) => body.email),
  ).toEqual([
    'locked-auth@example.com',
    'locked-tablet@example.com',
    'locked-responsive@example.com',
  ]);
  expect(verifyRequests.map(({ body }) => body)).toEqual(
    shells.map((shell) => ({
      challengeId: `locked-mfa-${shell.name}`,
      code: '111111',
    })),
  );
  expect(loginRequests.every(({ authorization }) => authorization === undefined)).toBe(true);
  expect(verifyRequests.every(({ authorization }) => authorization === undefined)).toBe(true);

  const reportPath = testInfo.outputPath('account-locked-423-browser.json');
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        environment: {
          browser: 'Chromium, local Playwright API-mode profile',
          authSessionFixture: null,
          fixtureApiOrigin: 'https://e2e.test',
        },
        flowObservations,
        requests: {
          loginCount: loginRequests.length,
          loginMfaVerifyCount: verifyRequests.length,
          authorizationHeaderPresent: false,
        },
      },
      null,
      2,
    ),
  );
  await testInfo.attach('account-locked-423-browser.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('opens the Web session-expired route and returns to login at responsive widths @auth-api', async ({
  page,
}, testInfo) => {
  const widths = [320, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/w/auth/session-expired');

    await expect(page).toHaveURL(/\/w\/auth\/session-expired$/);
    const recoveryHeading = page.getByRole('heading', {
      name: 'Phiên đăng nhập cần được xác thực lại',
    });
    await expect(recoveryHeading).toBeVisible();
    await expect(recoveryHeading).toBeFocused();
    const initialFocus = await page.evaluate(() => ({
      tagName: document.activeElement?.tagName ?? null,
      text: document.activeElement?.textContent?.trim() ?? null,
    }));
    if (width === 1440) {
      await expect(
        page.getByText(
          'Phiên của bạn đã kết thúc. Đăng nhập lại để tiếp tục sử dụng nền tảng an toàn.',
        ),
      ).toHaveCSS('opacity', '1');
      await expect(
        page.getByText('Open Arena', { exact: true }).locator('xpath=../../..'),
      ).toHaveCSS('opacity', '1');
    }
    if (width === 320 || width === 1440) {
      const focusedScreenshotPath = testInfo.outputPath(
        `web-session-expired-focused-${width}x900.png`,
      );
      await page.screenshot({ path: focusedScreenshotPath });
      await testInfo.attach(`web-session-expired-focused-${width}x900`, {
        path: focusedScreenshotPath,
        contentType: 'image/png',
      });
    }
    await page.keyboard.press('Tab');
    const loginButton = page.getByRole('button', { name: 'Đăng nhập lại' });
    await expect(loginButton).toBeFocused();
    await expect(
      page.getByText(
        'Vui lòng đăng nhập lại để tiếp tục. Nếu bạn gặp sự cố, hãy liên hệ bộ phận hỗ trợ.',
      ),
    ).toBeVisible();

    const guidanceToggle = page.getByRole('button', { name: /Cần trợ giúp/ });
    await expect(guidanceToggle).toHaveAttribute('aria-expanded', 'false');
    await guidanceToggle.click();
    await expect(guidanceToggle).toHaveAttribute('aria-expanded', 'true');
    const tip = page.getByText('Nếu bạn gặp sự cố khi đăng nhập lại, hãy liên hệ bộ phận hỗ trợ.');
    await expect(tip).toBeVisible();

    const keyElements = [
      page.getByRole('heading', {
        name: 'Phiên đăng nhập cần được xác thực lại',
      }),
      page.getByRole('button', { name: 'Đăng nhập lại' }),
      tip,
    ];
    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    const clippedItems = [];
    for (const [index, element] of keyElements.entries()) {
      if (!(await isFullyVisibleHorizontally(element))) clippedItems.push(index);
    }
    expect(layout.documentWidth, `document overflows at ${width}px`).toBe(layout.viewportWidth);
    expect(clippedItems, `heading, primary action or guidance clips at ${width}px`).toEqual([]);

    const primaryAction = keyElements[1];
    await primaryAction.scrollIntoViewIfNeeded();
    const actionBounds = await primaryAction.boundingBox();
    expect(actionBounds, `primary action has no bounds at ${width}px`).not.toBeNull();
    expect(actionBounds!.y).toBeGreaterThanOrEqual(0);
    expect(actionBounds!.y + actionBounds!.height).toBeLessThanOrEqual(900);

    const tipBounds = await tip.boundingBox();
    expect(tipBounds, `session guidance has no bounds at ${width}px`).not.toBeNull();
    expect(tipBounds!.y).toBeGreaterThanOrEqual(0);
    expect(tipBounds!.y + tipBounds!.height).toBeLessThanOrEqual(900);

    measurements.push({
      route: '/w/auth/session-expired',
      viewportWidth: width,
      viewportHeight: 900,
      initialFocus,
      firstTabTarget: 'Đăng nhập lại',
      ...layout,
      clippedItems,
      primaryActionBounds: actionBounds,
    });

    if (width === 320 || width === 1440) {
      const screenshotPath = testInfo.outputPath(`web-session-expired-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-session-expired-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }

  await page.getByRole('button', { name: 'Đăng nhập lại' }).click();
  await expect(page).toHaveURL(/\/w\/auth\/login$/);
  await expect(page.getByTestId('auth-email')).toBeVisible();

  const reportPath = testInfo.outputPath('web-session-expired-responsive-measurements.json');
  await writeFile(reportPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-session-expired-responsive-measurements.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('Web session-expired recovery has no serious or critical axe violations @auth-api', async ({
  page,
}, testInfo) => {
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  const measurements: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const theme of themes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/w/auth/session-expired');
      await page.evaluate((activeTheme) => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.classList.toggle('light', activeTheme === 'light');
      }, theme);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const supportCopy = page.getByText('Liên hệ hỗ trợ', { exact: true });
      await expect
        .poll(() => supportCopy.evaluate((element) => getComputedStyle(element).color))
        .toBe(theme === 'dark' ? 'rgb(167, 175, 191)' : 'rgb(52, 64, 84)');
      const colorState = await supportCopy.evaluate((element) => ({
        rootClasses: document.documentElement.className,
        text2Token: getComputedStyle(document.documentElement)
          .getPropertyValue('--tr-text-2')
          .trim(),
        foreground: getComputedStyle(element).color,
        background: getComputedStyle(document.querySelector('.h-full > .flex')!).backgroundColor,
      }));

      for (const state of ['help-collapsed', 'help-expanded'] as const) {
        if (state === 'help-expanded') {
          await page.getByRole('button', { name: /Cần trợ giúp/ }).click();
        }

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const seriousViolations = results.violations.filter((violation) =>
          ['critical', 'serious'].includes(violation.impact ?? ''),
        );

        measurements.push({
          theme,
          colorState,
          viewportWidth: width,
          state,
          violationCount: results.violations.length,
          seriousOrCriticalViolationCount: seriousViolations.length,
          violations: results.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            affectedNodeCount: nodes.length,
          })),
        });
        await writeFile(
          testInfo.outputPath('web-session-expired-axe-report.json'),
          JSON.stringify(measurements, null, 2),
        );
        expect(
          seriousViolations,
          `serious/critical violations in ${theme} theme at ${width}px (${state}): ${JSON.stringify(seriousViolations, null, 2)}`,
        ).toEqual([]);
      }
    }
  }

  const reportPath = testInfo.outputPath('web-session-expired-axe-report.json');
  await writeFile(reportPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-session-expired-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('Web session-expired reason variants have no axe violations @auth-api', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  const reasons = [
    {
      value: 'timeout',
      heading: 'Phiên đã hết hạn',
      tip: 'Vì sao phiên hết hạn?',
    },
    {
      value: 'token',
      heading: 'Phiên đăng nhập đã hết hạn',
      tip: 'Đây là hoạt động bình thường',
    },
    {
      value: 'security',
      heading: 'Đã đăng xuất vì lý do bảo mật',
      tip: 'Các thay đổi có thể gây đăng xuất',
    },
    {
      value: 'concurrent',
      heading: 'Đã đăng nhập từ thiết bị khác',
      tip: 'Không phải bạn đăng nhập?',
    },
    {
      value: 'unrecognized-server-reason',
      heading: 'Phiên đăng nhập cần được xác thực lại',
      tip: 'Cần trợ giúp?',
    },
  ] as const;
  const measurements: Array<Record<string, unknown>> = [];
  const reportPath = testInfo.outputPath('web-session-expired-reason-axe-report.json');

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const theme of themes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      for (const reason of reasons) {
        await page.goto('/w/auth/session-expired');
        await page.evaluate((value) => {
          const state = {
            ...(window.history.state ?? {}),
            usr: { reason: value },
          };
          window.history.replaceState(state, '', window.location.href);
          window.dispatchEvent(new PopStateEvent('popstate', { state }));
        }, reason.value);
        await expect(page.getByRole('heading', { name: reason.heading })).toBeVisible();
        await page.evaluate((activeTheme) => {
          document.documentElement.classList.toggle('dark', activeTheme === 'dark');
          document.documentElement.classList.toggle('light', activeTheme === 'light');
        }, theme);
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        await page.waitForTimeout(180);

        const guidanceToggle = page.getByRole('button', { name: reason.tip });
        if ((await guidanceToggle.getAttribute('aria-expanded')) === 'true') {
          await guidanceToggle.click();
        }
        for (const state of ['help-collapsed', 'help-expanded'] as const) {
          if (state === 'help-expanded') await guidanceToggle.click();
          await expect(guidanceToggle).toHaveAttribute(
            'aria-expanded',
            state === 'help-expanded' ? 'true' : 'false',
          );

          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();
          measurements.push({
            theme,
            viewportWidth: width,
            reason: reason.value,
            state,
            violationCount: result.violations.length,
            violations: result.violations.map(({ id, impact, nodes }) => ({
              id,
              impact,
              affectedNodeCount: nodes.length,
            })),
          });
          await writeFile(reportPath, JSON.stringify(measurements, null, 2));
          expect(
            result.violations,
            `axe violations for ${reason.value} in ${theme} theme at ${width}px (${state})`,
          ).toEqual([]);
        }
      }
    }
  }

  await writeFile(reportPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-session-expired-reason-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('renders the Web account-locked route without clipping and supports recovery actions @auth-api', async ({
  page,
}, testInfo) => {
  const widths = [320, 390, 768, 1440];
  const measurements: Array<Record<string, unknown>> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/w/auth/account-locked');

    await expect(page).toHaveURL(/\/w\/auth\/account-locked$/);
    await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText(
      'Hãy quay lại đăng nhập để kiểm tra trạng thái mới nhất.',
    );
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);

    const keyElements = [
      page.getByRole('heading', { name: 'Tài khoản tạm khóa' }),
      page.getByRole('button', { name: 'Quay lại đăng nhập' }),
      page.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }),
      page.getByRole('status'),
    ];
    const layout = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    const clippedItems = [];
    for (const [index, element] of keyElements.entries()) {
      if (!(await isFullyVisibleHorizontally(element))) clippedItems.push(index);
    }
    expect(layout.documentWidth, `document overflows at ${width}px`).toBe(layout.viewportWidth);
    expect(clippedItems, `key locked-page content clips at ${width}px`).toEqual([]);

    const securityTips = page.getByText('Gợi ý bảo mật', { exact: true });
    await securityTips.scrollIntoViewIfNeeded();
    const securityTipsBounds = await securityTips.boundingBox();
    expect(securityTipsBounds, `security tips have no bounds at ${width}px`).not.toBeNull();
    expect(securityTipsBounds!.y).toBeGreaterThanOrEqual(0);
    expect(securityTipsBounds!.y + securityTipsBounds!.height).toBeLessThanOrEqual(900);

    measurements.push({
      route: '/w/auth/account-locked',
      viewportWidth: width,
      viewportHeight: 900,
      ...layout,
      clippedItems,
      securityTipsBounds,
    });

    if (width === 320 || width === 1440) {
      if (width === 1440) {
        await expect(
          page.getByText(
            'Tài khoản đang bị từ chối theo chính sách bảo mật. Trạng thái đăng nhập được hệ thống xác thực quyết định.',
          ),
        ).toHaveCSS('opacity', '1');
        await expect(
          page.getByText('Open Arena', { exact: true }).locator('xpath=../../..'),
        ).toHaveCSS('opacity', '1');
      }
      const screenshotPath = testInfo.outputPath(`web-account-locked-${width}x900.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`web-account-locked-${width}x900`, {
        path: screenshotPath,
        contentType: 'image/png',
      });
    }
  }

  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/w/auth/account-locked');
  await page.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }).click();
  await expect(page).toHaveURL(/\/w\/auth\/forgot-password$/);

  await page.goto('/w/auth/account-locked');
  await page.getByRole('button', { name: 'Quay lại đăng nhập' }).click();
  await expect(page).toHaveURL(/\/w\/auth\/login$/);
  await expect(page.getByTestId('auth-email')).toBeVisible();

  const reportPath = testInfo.outputPath('web-account-locked-responsive-measurements.json');
  await writeFile(reportPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-account-locked-responsive-measurements.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('routes Web login and login-MFA HTTP 423 responses to Web account locked @auth-api', async ({
  page,
}, testInfo) => {
  const challengeId = 'locked-mfa-web-e2e';
  const loginRequests: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];
  const verifyRequests: Array<{
    body: Record<string, unknown>;
    authorization?: string;
  }> = [];

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));
  await page.route('https://e2e.test/auth/login', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    loginRequests.push({
      body,
      authorization: route.request().headers().authorization,
    });
    if (String(body.email).startsWith('mfa-')) {
      return route.fulfill({
        json: {
          status: 'mfa_required',
          challenge: {
            id: challengeId,
            method: 'totp',
            maskedDestination: 'ứng dụng xác thực',
            expiresAt: '2099-01-01T00:05:00.000Z',
          },
        },
      });
    }
    return route.fulfill({ status: 423, json: { code: 'AccountLocked' } });
  });
  await page.route('https://e2e.test/auth/login/mfa/verify', async (route) => {
    verifyRequests.push({
      body: route.request().postDataJSON() as Record<string, unknown>,
      authorization: route.request().headers().authorization,
    });
    return route.fulfill({ status: 423, json: { code: 'AccountLocked' } });
  });

  await page.goto('/w/auth/login');
  await page.getByTestId('auth-email').fill('locked-web@example.com');
  await page.getByTestId('auth-password').fill('fixture-password');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/w\/auth\/account-locked$/);
  await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
  await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);

  await page.goto('/w/auth/login');
  await page.getByTestId('auth-email').fill('mfa-web@example.com');
  await page.getByTestId('auth-password').fill('fixture-password');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/w\/auth\/otp$/);
  for (let index = 1; index <= 6; index += 1) {
    await page.getByRole('textbox', { name: `Mã xác thực, chữ số ${index} trên 6` }).fill('1');
  }
  await expect(page).toHaveURL(/\/w\/auth\/account-locked$/);
  await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
  await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);

  expect(loginRequests.map(({ body }) => body.email)).toEqual([
    'locked-web@example.com',
    'mfa-web@example.com',
  ]);
  expect(verifyRequests.map(({ body }) => body)).toEqual([{ challengeId, code: '111111' }]);
  expect(loginRequests.every(({ authorization }) => authorization === undefined)).toBe(true);
  expect(verifyRequests.every(({ authorization }) => authorization === undefined)).toBe(true);

  const reportPath = testInfo.outputPath('web-account-locked-423-browser.json');
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        environment: {
          browser: 'Chromium, local Playwright API-mode profile',
          authSessionFixture: null,
          fixtureApiOrigin: 'https://e2e.test',
        },
        loginRequests,
        loginMfaVerifyRequests: verifyRequests,
        observations: {
          loginStatus: 423,
          loginDestination: '/w/auth/account-locked',
          loginMfaVerifyStatus: 423,
          loginMfaDestination: '/w/auth/account-locked',
          authenticatedMarkerCount: await page.getByTestId('auth-sign-out').count(),
          authorizationHeaderPresent: false,
        },
      },
      null,
      2,
    ),
  );
  await testInfo.attach('web-account-locked-423-browser.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('Web account-locked page has no axe violations in both themes @auth-api', async ({
  page,
}, testInfo) => {
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  const measurements: Array<Record<string, unknown>> = [];
  const reportPath = testInfo.outputPath('web-account-locked-axe-report.json');

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const theme of themes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/w/auth/account-locked');
      await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
      await page.evaluate((activeTheme) => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.classList.toggle('light', activeTheme === 'light');
      }, theme);
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );

      const statusText = page.getByRole('status').locator('p');
      await expect
        .poll(() => statusText.evaluate((element) => getComputedStyle(element).color))
        .toBe(theme === 'dark' ? 'rgb(167, 175, 191)' : 'rgb(52, 64, 84)');
      const resetButton = page.getByRole('button', {
        name: 'Không phải bạn? Đặt lại mật khẩu',
      });
      await expect
        .poll(() => resetButton.evaluate((element) => getComputedStyle(element).color))
        .toBe(theme === 'dark' ? 'rgb(245, 247, 250)' : 'rgb(17, 24, 39)');
      await expect
        .poll(() => resetButton.evaluate((element) => getComputedStyle(element).backgroundColor))
        .toBe(theme === 'dark' ? 'rgb(16, 20, 27)' : 'rgb(255, 255, 255)');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const summarized = results.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        affectedNodeCount: nodes.length,
        affectedNodes: nodes.map((node) => ({
          target: node.target,
          html: node.html,
          contrast: node.any
            .filter((check) => check.id === 'color-contrast')
            .map((check) => check.data),
        })),
      }));
      measurements.push({
        theme,
        viewportWidth: width,
        violations: summarized.length,
        findings: summarized,
      });
      await writeFile(reportPath, JSON.stringify(measurements, null, 2));
      expect(
        summarized,
        `axe violations in ${theme} theme at ${width}px: ${JSON.stringify(summarized, null, 2)}`,
      ).toEqual([]);
    }
  }

  await writeFile(reportPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach('web-account-locked-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});

test('Web account-locked CTA keeps text contrast during theme changes @auth-api', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const widths = [320, 1440];
  const transitions = [
    { from: 'light', to: 'dark' },
    { from: 'dark', to: 'light' },
  ] as const;
  const measurements: Array<Record<string, unknown>> = [];
  const reportPath = testInfo.outputPath('web-account-locked-theme-transition-contrast.json');

  await page.route('**/auth/session', (route) => route.fulfill({ json: null }));

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/w/auth/account-locked');
    const recoveryButton = page.getByRole('button', {
      name: 'Không phải bạn? Đặt lại mật khẩu',
    });
    await expect(recoveryButton).toBeVisible();

    for (const transition of transitions) {
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.classList.toggle('light', theme === 'light');
      }, transition.from);
      await page.waitForTimeout(180);

      const samples = await page.evaluate((targetTheme) => {
        const root = document.documentElement;
        const button = Array.from(document.querySelectorAll('button')).find((element) =>
          element.textContent?.includes('Không phải bạn? Đặt lại mật khẩu'),
        );
        if (!button) throw new Error('Password-reset recovery button was not found');
        root.classList.toggle('dark', targetTheme === 'dark');
        root.classList.toggle('light', targetTheme === 'light');
        // Resolve the target styles before the first animation-frame sample.
        const initialColor = getComputedStyle(button).color;
        if (!initialColor) throw new Error('Recovery button has no computed text color');
        const deadline = performance.now() + 190;
        const observations: Array<{
          elapsedMs: number;
          foreground: string;
          background: string;
          contrastRatio: number;
        }> = [];

        return new Promise<typeof observations>((resolve) => {
          const sample = () => {
            const style = getComputedStyle(button);
            const channels = (value: string) =>
              value
                .match(/[\d.]+/g)
                ?.slice(0, 3)
                .map(Number) ?? [];
            const luminance = (value: string) => {
              const [red, green, blue] = channels(value).map((channel) => {
                const normalized = channel / 255;
                return normalized <= 0.04045
                  ? normalized / 12.92
                  : ((normalized + 0.055) / 1.055) ** 2.4;
              });
              return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
            };
            const foreground = style.color;
            const background = style.backgroundColor;
            const foregroundLuminance = luminance(foreground);
            const backgroundLuminance = luminance(background);
            observations.push({
              elapsedMs: Math.round(performance.now() - (deadline - 190)),
              foreground,
              background,
              contrastRatio:
                (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
                (Math.min(foregroundLuminance, backgroundLuminance) + 0.05),
            });
            if (performance.now() < deadline) requestAnimationFrame(sample);
            else resolve(observations);
          };
          requestAnimationFrame(sample);
        });
      }, transition.to);

      measurements.push({ width, ...transition, samples });
      await writeFile(reportPath, JSON.stringify(measurements, null, 2));
      const minimumContrast = Math.min(...samples.map((sample) => sample.contrastRatio));
      expect(samples.length, `no animation-frame contrast samples at ${width}px`).toBeGreaterThan(
        2,
      );
      expect(
        minimumContrast,
        `${transition.from}->${transition.to} at ${width}px minimum contrast: ${minimumContrast.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }

  await testInfo.attach('web-account-locked-theme-transition-contrast.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});
