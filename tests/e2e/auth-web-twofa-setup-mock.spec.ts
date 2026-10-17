import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const email = 'developer@vittrade.local';
const password = 'Preview-123!';
const otp = '123456';
const viewports = [
  { name: 'phone', width: 390, height: 844, loginHomeRoute: '/home' },
  { name: 'tablet', width: 768, height: 900, loginHomeRoute: '/t/home' },
  { name: 'responsive', width: 1024, height: 900, loginHomeRoute: '/w/home' },
  { name: 'desktop', width: 1440, height: 900, loginHomeRoute: '/w/home' },
];

test('Web MFA setup has no axe violations in settled light and dark states @auth-web-twofa-setup-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440] as const;
  const states = [
    'qr-step',
    'qr-key-copied',
    'verify-step',
    'backup-codes-step',
    'backup-codes-copied',
  ] as const;
  const measurements: Array<Record<string, unknown>> = [];

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/w/auth/login');
  await expect(page.getByTestId('auth-email')).toBeVisible();

  const serviceWorkerScripts = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return (await navigator.serviceWorker.getRegistrations())
      .map((registration) => registration.active?.scriptURL)
      .filter((url): url is string => Boolean(url));
  });
  expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/login') &&
      response.status() === 200,
  );
  await page.getByTestId('auth-email').fill(email);
  await page.getByTestId('auth-password').fill(password);
  await page.getByTestId('auth-submit').click();
  expect((await (await loginResponsePromise).json()).status).toBe('authenticated');
  await expect(page).toHaveURL('/w/home');

  const setupResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/mfa/setup'),
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/auth/2fa-setup');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(page).toHaveURL('/w/auth/2fa-setup');
  expect((await setupResponsePromise).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Quét mã QR' })).toBeVisible();

  const scanState = async (state: (typeof states)[number]) => {
    for (const theme of themes) {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate((activeTheme) => {
          document.documentElement.classList.toggle('dark', activeTheme === 'dark');
          document.documentElement.classList.toggle('light', activeTheme === 'light');
        }, theme);
        await page.evaluate(async () => {
          await Promise.all(
            document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
          );
          await new Promise<void>((resolve) => requestAnimationFrame(resolve));
        });

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const violations = results.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          affectedNodeCount: nodes.length,
          nodes: nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary
              ?.replaceAll('DEVONLYSECRET', '[redacted fixture secret]')
              .replaceAll('DEV-0001', '[redacted fixture backup code]')
              .replaceAll('DEV-0002', '[redacted fixture backup code]'),
          })),
        }));
        measurements.push({ theme, width, state, violationCount: violations.length, violations });
      }
    }
  };

  await scanState('qr-step');
  await page.getByRole('button', { name: 'Sao chép', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đã sao chép', exact: true })).toBeVisible();
  await scanState('qr-key-copied');
  await page.getByRole('button', { name: /Tiếp theo — Xác minh mã/ }).click();
  await expect(page.getByRole('heading', { name: 'Xác minh mã' })).toBeVisible();
  await scanState('verify-step');

  const otpGroup = page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
  for (const [index, digit] of [...otp].entries()) {
    await otpGroup
      .getByRole('textbox', { name: `Mã xác thực 2FA, chữ số ${index + 1} trên 6` })
      .fill(digit);
  }
  const confirmResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/mfa/setup/confirm'),
  );
  await page.getByRole('button', { name: 'Xác minh' }).click();
  expect((await confirmResponsePromise).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Lưu mã dự phòng' })).toBeVisible();
  await scanState('backup-codes-step');
  await page.getByRole('button', { name: 'Sao chép tất cả mã', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Đã sao chép tất cả mã', exact: true }),
  ).toBeVisible();
  await scanState('backup-codes-copied');

  const report = {
    fixtureBoundary:
      'Local Vite development MSW browser only. The registered mockServiceWorker.js and handlers.ts supplied developer login, setup challenge and confirmation. Axe scanned QR, verify and backup-code states; no page.route, backend, staging or production service was used. Synthetic QR/secret/backup values are redacted from failure summaries.',
    route: '/w/auth/2fa-setup',
    themes,
    widths,
    states,
    measurements,
  };
  const reportPath = testInfo.outputPath('web-twofa-setup-axe-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('web-twofa-setup-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(themes.length * widths.length * states.length);
  expect(
    measurements.filter((measurement) => measurement.violationCount !== 0),
    'Web MFA setup Axe violations by theme, viewport and step',
  ).toEqual([]);
});

test('Web MFA setup denies direct setup without a session @auth-web-twofa-setup-mock', async ({
  page,
}) => {
  const setupResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      new URL(response.url()).pathname.endsWith('/auth/mfa/setup'),
  );

  await page.goto('/w/auth/2fa-setup');
  const setupResponse = await setupResponsePromise;

  await expect(page).toHaveURL('/w/auth/2fa-setup');
  await expect(
    page.getByText('Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.', { exact: true }),
  ).toBeVisible();
  expect(setupResponse.status()).toBe(401);
  await expect(page.getByAltText('Mã QR xác thực hai bước')).toHaveCount(0);
  await expect(page.getByText('DEVONLYSECRET', { exact: true })).toHaveCount(0);
  await expect(page.getByText('DEV-0001', { exact: true })).toHaveCount(0);
});

for (const viewport of viewports) {
  test(`Web2FASetupPage uses actual MSW at ${viewport.width}px @auth-web-twofa-setup-mock`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/w/auth/login');
    await expect(page.getByTestId('auth-email')).toBeVisible();

    const serviceWorkerScripts = await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      return (await navigator.serviceWorker.getRegistrations())
        .map((registration) => registration.active?.scriptURL)
        .filter((url): url is string => Boolean(url));
    });
    expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

    const authRequests: Array<{ path: string; status?: number }> = [];
    const requestBodiesMatchAdapter = { login: false, confirmSetup: false };
    const trackRequest = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (request.method() === 'POST' && url.pathname.startsWith('/api/auth/')) {
        authRequests.push({ path: url.pathname });
      }
      if (url.pathname.endsWith('/auth/login')) {
        const body = request.postDataJSON() as Record<string, string> | null;
        requestBodiesMatchAdapter.login =
          JSON.stringify(body) ===
          JSON.stringify({ email: 'developer@vittrade.local', password: 'Preview-123!' });
      }
      if (url.pathname.endsWith('/auth/mfa/setup/confirm')) {
        const body = request.postDataJSON() as Record<string, string> | null;
        requestBodiesMatchAdapter.confirmSetup =
          JSON.stringify(body) === JSON.stringify({ code: '123456' });
      }
    };
    const trackResponse = (response: import('@playwright/test').Response) => {
      const request = response.request();
      const url = new URL(response.url());
      if (request.method() !== 'POST' || !url.pathname.startsWith('/api/auth/')) return;
      const record = authRequests.findLast(
        (item) => item.path === url.pathname && item.status === undefined,
      );
      if (record) record.status = response.status();
    };
    page.on('request', trackRequest);
    page.on('response', trackResponse);

    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login') &&
        response.status() === 200,
    );
    await page.getByTestId('auth-email').fill(email);
    await page.getByTestId('auth-password').fill(password);
    await page.getByTestId('auth-submit').click();
    const loginResponse = await loginResponsePromise;
    expect((await loginResponse.json()).status).toBe('authenticated');
    const { loginHomeRoute } = viewport;
    await expect(page).toHaveURL(loginHomeRoute);

    const setupResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/mfa/setup'),
    );
    await page.evaluate(() => {
      window.history.pushState({}, '', '/w/auth/2fa-setup');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await expect(page).toHaveURL('/w/auth/2fa-setup');
    const setupResponse = await setupResponsePromise;
    expect(setupResponse.status()).toBe(200);
    const challenge = (await setupResponse.json()) as {
      secret?: unknown;
      qrCodeUrl?: unknown;
      backupCodes?: unknown;
      expiresAt?: unknown;
    };
    const setupChallengeShape = {
      secretPresent: typeof challenge.secret === 'string' && challenge.secret.length > 0,
      qrCodePresent: typeof challenge.qrCodeUrl === 'string' && challenge.qrCodeUrl.length > 0,
      backupCodeCount: Array.isArray(challenge.backupCodes) ? challenge.backupCodes.length : 0,
      expiresAtPresent: typeof challenge.expiresAt === 'string' && challenge.expiresAt.length > 0,
    };
    expect(setupChallengeShape).toEqual({
      secretPresent: true,
      qrCodePresent: true,
      backupCodeCount: 2,
      expiresAtPresent: true,
    });
    await expect(page.getByRole('heading', { name: 'Quét mã QR' })).toBeVisible();
    await expect(page.getByAltText('Mã QR thiết lập xác thực hai bước')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tiếp theo — Xác minh mã/ })).toBeEnabled();

    const screenshots: string[] = [];
    const capture = async (state: string, maskChallenge = false, maskBackups = false) => {
      const path = testInfo.outputPath(
        `web-twofa-setup-${viewport.name}-${viewport.width}x${viewport.height}-${state}.png`,
      );
      const mask: import('@playwright/test').Locator[] = [];
      if (maskChallenge) {
        mask.push(
          page.getByAltText('Mã QR thiết lập xác thực hai bước'),
          page.getByText('DEVONLYSECRET', { exact: true }),
        );
      }
      if (maskBackups) {
        mask.push(
          page.getByText('DEV-0001', { exact: true }),
          page.getByText('DEV-0002', { exact: true }),
        );
      }
      await page.screenshot({ path, animations: 'disabled', mask, maskColor: '#6B7280' });
      screenshots.push(path);
    };

    await capture('qr-step', true);
    expect(await page.getByText('DEV-0001', { exact: true }).count()).toBe(0);

    await page.getByRole('button', { name: /Tiếp theo — Xác minh mã/ }).click();
    await expect(page.getByRole('heading', { name: 'Xác minh mã' })).toBeVisible();
    const otpGroup = page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
    await expect(otpGroup.getByRole('textbox')).toHaveCount(6);
    await capture('verify-step');
    for (const [index, digit] of [...otp].entries()) {
      await otpGroup
        .getByRole('textbox', { name: `Mã xác thực 2FA, chữ số ${index + 1} trên 6` })
        .fill(digit);
    }

    const confirmResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/mfa/setup/confirm'),
    );
    await page.getByRole('button', { name: 'Xác minh' }).click();
    const confirmResponse = await confirmResponsePromise;
    expect(confirmResponse.status()).toBe(200);
    const confirmSession = (await confirmResponse.json()) as {
      user?: { id?: unknown };
      accessToken?: unknown;
      accessTokenExpiresAt?: unknown;
    };
    const confirmSessionShape = {
      userIdPresent: typeof confirmSession.user?.id === 'string',
      accessTokenPresent: typeof confirmSession.accessToken === 'string',
      accessTokenExpiresAtPresent: typeof confirmSession.accessTokenExpiresAt === 'string',
    };
    expect(confirmSessionShape).toEqual({
      userIdPresent: true,
      accessTokenPresent: true,
      accessTokenExpiresAtPresent: true,
    });
    await expect(page.getByRole('heading', { name: 'Lưu mã dự phòng' })).toBeVisible();
    await expect(page.getByText('DEV-0001', { exact: true })).toBeVisible();
    await expect(page.getByText('DEV-0002', { exact: true })).toBeVisible();
    await capture('backup-codes-step', false, true);

    const savedCodes = page.getByRole('button', {
      name: 'Tôi đã lưu mã dự phòng ở nơi an toàn',
    });
    await expect(savedCodes).toHaveAttribute('aria-pressed', 'false');
    const finish = page.getByRole('button', { name: /Hoàn tất thiết lập/ });
    await expect(finish).toBeDisabled();
    await savedCodes.click();
    await expect(savedCodes).toHaveAttribute('aria-pressed', 'true');
    await expect(finish).toBeEnabled();
    await finish.click();
    await expect(page).toHaveURL('/w/auth/success');
    await expect(page.getByRole('heading', { name: 'Bảo mật đã được nâng cấp!' })).toBeVisible();
    await expect(page.getByText('2FA đã kích hoạt', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Dừng' }).click();
    await capture('success-after-acknowledgement');

    if (viewport.width === 1440) {
      const successMeasurements: Array<Record<string, unknown>> = [];
      for (const theme of ['light', 'dark'] as const) {
        for (const width of [320, 1440] as const) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate((activeTheme) => {
            document.documentElement.classList.toggle('dark', activeTheme === 'dark');
            document.documentElement.classList.toggle('light', activeTheme === 'light');
          }, theme);
          await page.evaluate(async () => {
            await Promise.all(
              document
                .getAnimations()
                .map((animation) => animation.finished.catch(() => undefined)),
            );
            await new Promise<void>((resolve) => requestAnimationFrame(resolve));
          });

          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();
          const violations = results.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            affectedNodeCount: nodes.length,
            nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
          }));
          successMeasurements.push({ theme, width, state: '2fa-setup-success-paused', violations });
        }
      }

      const report = {
        fixtureBoundary:
          'The 2FA success state followed the actual local development MSW login, setup challenge and confirmation flow. Axe scanned the paused WebAuthSuccessPage in light/dark themes at 320px and 1440px; no page.route, backend, staging or production service was used.',
        route: '/w/auth/success',
        purpose: '2fa-setup',
        themes: ['light', 'dark'],
        widths: [320, 1440],
        measurements: successMeasurements,
      };
      const reportPath = testInfo.outputPath('web-auth-success-axe-report.json');
      await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
      await testInfo.attach('web-auth-success-axe-report.json', {
        path: reportPath,
        contentType: 'application/json',
      });
      expect(successMeasurements).toHaveLength(4);
      expect(
        successMeasurements.filter(
          (measurement) => (measurement.violations as unknown[]).length !== 0,
        ),
        'Web auth-success Axe violations by theme and viewport',
      ).toEqual([]);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    }

    expect(requestBodiesMatchAdapter).toEqual({ login: true, confirmSetup: true });
    expect(authRequests).toEqual([
      { path: '/api/auth/login', status: 200 },
      { path: '/api/auth/mfa/setup', status: 200 },
      { path: '/api/auth/mfa/setup/confirm', status: 200 },
    ]);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(viewport.width);

    const primaryAction = page.getByRole('button', { name: 'Vào trang chủ' });
    await primaryAction.click();
    await expect(page).toHaveURL(viewport.loginHomeRoute);

    const screenshotSha256 = Object.fromEntries(
      await Promise.all(
        screenshots.map(async (file) => [
          file.split(/[\\/]/).at(-1) ?? file,
          createHash('sha256')
            .update(await readFile(file))
            .digest('hex'),
        ]),
      ),
    );
    const report = {
      fixtureBoundary:
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. Developer login, setup challenge HTTP 200 and setup confirmation HTTP 200 are local fixtures; QR/secret/backup-code values are synthetic and masked in screenshots, no page.route/backend/staging/external API was used. This does not verify server session-cookie enforcement or route authorization.',
      route: '/w/auth/2fa-setup',
      loginHomeRoute,
      viewport,
      serviceWorkerScripts,
      authRequests,
      requestBodiesMatchAdapter,
      setupChallengeShape,
      confirmSessionShape,
      backupCodesHiddenBeforeConfirmation: true,
      backupCodesShownAfterConfirmation: true,
      setupAcknowledgementRequired: true,
      successPurposeRendered: true,
      primaryActionDestination: new URL(page.url()).pathname,
      screenshotValuesMasked: true,
      screenshots: screenshots.map((file) => file.split(/[\\/]/).at(-1) ?? file),
      screenshotSha256,
      documentWidth,
    };
    const reportJson = JSON.stringify(report);
    expect(reportJson).not.toContain(email);
    expect(reportJson).not.toContain(password);
    expect(reportJson).not.toContain(otp);
    expect(reportJson).not.toContain('DEVONLYSECRET');
    expect(reportJson).not.toContain('DEV-0001');
    expect(reportJson).not.toContain('DEV-0002');
    const reportPath = testInfo.outputPath(`web-twofa-setup-${viewport.name}-development-msw.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('web-twofa-setup-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    page.removeListener('request', trackRequest);
    page.removeListener('response', trackResponse);
  });
}
