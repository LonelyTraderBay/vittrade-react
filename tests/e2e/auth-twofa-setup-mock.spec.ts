import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const email = 'developer@vittrade.local';
const password = 'Preview-123!';
const otp = '123456';
const axeThemes = ['light', 'dark'] as const;
const axeStates = [
  'qr-step',
  'verify-step',
  'backup-codes-step',
  'backup-codes-acknowledged',
] as const;
const shells = [
  {
    name: 'phone',
    loginRoute: '/auth/login',
    setupRoute: '/auth/2fa-setup',
    homeRoute: '/home',
    width: 390,
    height: 844,
  },
  {
    name: 'tablet',
    loginRoute: '/t/auth/login',
    setupRoute: '/t/auth/2fa-setup',
    homeRoute: '/t/home',
    width: 768,
    height: 900,
  },
  {
    name: 'responsive',
    loginRoute: '/r/auth/login',
    setupRoute: '/r/auth/2fa-setup',
    homeRoute: '/r/home',
    width: 1024,
    height: 900,
  },
];

for (const shell of shells) {
  test(`TwoFASetupPage uses actual MSW through ${shell.name} shell @auth-twofa-setup-mock`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.loginRoute);
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
    await expect(page).toHaveURL(shell.homeRoute);

    const setupResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/mfa/setup'),
    );
    await page.evaluate((route) => {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, shell.setupRoute);
    await expect(page).toHaveURL(shell.setupRoute);
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
    await expect(page.getByRole('heading', { name: 'Bước 1: Quét mã QR' })).toBeVisible();
    await expect(page.getByAltText('Mã QR thiết lập xác thực hai bước')).toBeVisible();
    await expect(page.getByRole('button', { name: /Tiếp theo/ })).toBeEnabled();

    const screenshots: string[] = [];
    const capture = async (state: string, maskChallenge = false, maskBackups = false) => {
      const path = testInfo.outputPath(
        `twofa-setup-${shell.name}-${shell.width}x${shell.height}-${state}.png`,
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
    const axeMeasurements: Array<Record<string, unknown>> = [];
    const scanAxeState = async (state: (typeof axeStates)[number]) => {
      for (const theme of axeThemes) {
        await page.setViewportSize({ width: shell.width, height: shell.height });
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
              ?.replaceAll(email, '[redacted fixture email]')
              .replaceAll(password, '[redacted fixture password]')
              .replaceAll(otp, '[redacted fixture OTP]')
              .replaceAll('DEVONLYSECRET', '[redacted fixture secret]')
              .replaceAll('DEV-0001', '[redacted fixture backup code]')
              .replaceAll('DEV-0002', '[redacted fixture backup code]'),
          })),
        }));
        axeMeasurements.push({
          shell: shell.name,
          route: shell.setupRoute,
          theme,
          width: shell.width,
          state,
          violationCount: violations.length,
          violations,
        });
      }
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      await page.evaluate(async () => {
        await Promise.all(
          document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
        );
        await new Promise<void>((resolve) => requestAnimationFrame(resolve));
      });
    };
    await capture('qr-step', true);
    await scanAxeState('qr-step');
    expect(await page.getByText('DEV-0001', { exact: true }).count()).toBe(0);

    await page.getByRole('button', { name: /Tiếp theo/ }).click();
    await expect(page.getByRole('heading', { name: 'Bước 2: Xác minh mã' })).toBeVisible();
    await capture('verify-step');
    await scanAxeState('verify-step');
    await page.getByLabel('Mã xác thực 6 chữ số').fill(otp);
    const confirmResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/mfa/setup/confirm'),
    );
    await page.getByRole('button', { name: 'Xác nhận' }).click();
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
    await expect(page.getByRole('heading', { name: 'Bước 3: Mã dự phòng' })).toBeVisible();
    await expect(page.getByText('DEV-0001', { exact: true })).toBeVisible();
    await expect(page.getByText('DEV-0002', { exact: true })).toBeVisible();
    await capture('backup-codes-step', false, true);
    await scanAxeState('backup-codes-step');

    const savedCodes = page.getByRole('button', { name: 'Tôi đã lưu các mã dự phòng' });
    await expect(savedCodes).toHaveAttribute('aria-pressed', 'false');
    const finish = page.getByRole('button', { name: /Hoàn tất thiết lập 2FA/ });
    await expect(finish).toBeDisabled();
    await savedCodes.click();
    await expect(savedCodes).toHaveAttribute('aria-pressed', 'true');
    await expect(finish).toBeEnabled();
    await scanAxeState('backup-codes-acknowledged');
    await finish.click();
    await expect(page).toHaveURL(shell.homeRoute);
    await capture('home-after-acknowledgement');

    expect(requestBodiesMatchAdapter).toEqual({ login: true, confirmSetup: true });
    expect(authRequests).toEqual([
      { path: '/api/auth/login', status: 200 },
      { path: '/api/auth/mfa/setup', status: 200 },
      { path: '/api/auth/mfa/setup/confirm', status: 200 },
    ]);
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(shell.width);

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
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. Developer login, setup challenge HTTP 200 and setup confirmation HTTP 200 are local fixtures; QR/secret/backup-code values are synthetic and masked in screenshots, no page.route/backend/staging/external API was used.',
      shell: shell.name,
      loginRoute: shell.loginRoute,
      setupRoute: shell.setupRoute,
      homeRoute: shell.homeRoute,
      viewport: { width: shell.width, height: shell.height },
      serviceWorkerScripts,
      authRequests,
      requestBodiesMatchAdapter,
      setupChallengeShape,
      confirmSessionShape,
      backupCodesHiddenBeforeConfirmation: true,
      backupCodesShownAfterConfirmation: true,
      setupAcknowledgementRequired: true,
      screenshotValuesMasked: true,
      screenshots: screenshots.map((file) => file.split(/[\\/]/).at(-1) ?? file),
      screenshotSha256,
      documentWidth,
    };
    const reportPath = testInfo.outputPath(`twofa-setup-${shell.name}-development-msw.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('twofa-setup-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    const axeReport = {
      fixtureBoundary:
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. Login and MFA setup responses are local fixtures; secret, OTP and backup-code values are redacted from violation summaries. Axe scanned four in-page states in light/dark; no backend, staging or external API was used.',
      shell: shell.name,
      route: shell.setupRoute,
      themes: axeThemes,
      width: shell.width,
      states: axeStates,
      measurements: axeMeasurements,
    };
    const axeReportPath = testInfo.outputPath(`twofa-setup-${shell.name}-axe-report.json`);
    await writeFile(axeReportPath, `${JSON.stringify(axeReport, null, 2)}\n`);
    await testInfo.attach(`twofa-setup-${shell.name}-axe-report.json`, {
      path: axeReportPath,
      contentType: 'application/json',
    });
    expect(axeMeasurements).toHaveLength(axeStates.length * axeThemes.length);
    expect(
      axeMeasurements.filter((measurement) => measurement.violationCount !== 0),
      `${shell.name} TwoFASetupPage Axe violations by state and theme`,
    ).toEqual([]);
    page.removeListener('request', trackRequest);
    page.removeListener('response', trackResponse);
  });
}

for (const shell of shells) {
  test(`TwoFASetupPage denies direct setup without a session in ${shell.name} shell @auth-twofa-setup-mock`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    const setupResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/mfa/setup'),
    );

    await page.goto(shell.setupRoute);
    const setupResponse = await setupResponsePromise;

    await expect(page).toHaveURL(shell.setupRoute);
    await expect(
      page.getByText('Không thể khởi tạo thiết lập 2FA. Vui lòng thử lại.', { exact: true }),
    ).toBeVisible();
    expect(setupResponse.status()).toBe(401);
    await expect(page.getByAltText('Mã QR thiết lập xác thực hai bước')).toHaveCount(0);
    await expect(page.getByText('DEVONLYSECRET', { exact: true })).toHaveCount(0);
    await expect(page.getByText('DEV-0001', { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(shell.width);
  });
}
