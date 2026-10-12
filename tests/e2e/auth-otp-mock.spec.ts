import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const shells = [
  { name: 'phone', login: '/auth/login', otp: '/auth/otp', prefix: '', width: 390, height: 844 },
  {
    name: 'tablet',
    login: '/t/auth/login',
    otp: '/t/auth/otp',
    prefix: '/t',
    width: 768,
    height: 900,
  },
  {
    name: 'responsive',
    login: '/r/auth/login',
    otp: '/r/auth/otp',
    prefix: '/r',
    width: 1024,
    height: 900,
  },
  {
    name: 'web',
    login: '/w/auth/login',
    otp: '/w/auth/otp',
    prefix: '/w',
    width: 1440,
    height: 900,
  },
];

for (const shell of shells) {
  test(`login OTP uses actual MSW through ${shell.name} shell @auth-otp-mock`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.login);
    await expect(page.getByTestId('auth-email')).toBeVisible();

    const serviceWorkerScripts = await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations())
        .map((registration) => registration.active?.scriptURL)
        .filter((url): url is string => Boolean(url)),
    );
    expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

    const authRequests: string[] = [];
    const trackRequest = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (
        request.method() === 'POST' &&
        ['/api/auth/login', '/api/auth/login/mfa/verify', '/api/auth/mfa/verify'].includes(
          url.pathname,
        )
      ) {
        authRequests.push(url.pathname);
      }
    };
    page.on('request', trackRequest);

    await page.getByTestId('auth-email').fill('mfa@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login') &&
        response.status() === 200,
    );
    await page.getByTestId('auth-submit').click();
    const loginResponse = await loginResponsePromise;
    const loginResult = (await loginResponse.json()) as {
      status: string;
      challenge: { id: string; expiresAt: string };
    };
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/otp$`));
    const otpGroup = page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' });
    await expect(otpGroup).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    expect(loginResult).toMatchObject({
      status: 'mfa_required',
      challenge: { id: expect.stringMatching(/^dev-login-mfa-/) },
    });
    const otpInputs =
      shell.name === 'web'
        ? page.locator('input[aria-label^="Mã xác thực, chữ số"]')
        : page.locator('input[aria-label^="Ký tự OTP"]');
    await expect(otpInputs).toHaveCount(6);
    const challengeScreenshot = testInfo.outputPath(
      `otp-${shell.name}-${shell.width}x${shell.height}-challenge.png`,
    );
    await page.screenshot({ path: challengeScreenshot, fullPage: true, animations: 'disabled' });

    const invalidCodePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login/mfa/verify') &&
        response.status() === 400,
    );
    for (let index = 0; index < 6; index += 1) await otpInputs.nth(index).fill('0');
    const invalidCodeResponse = await invalidCodePromise;
    expect(invalidCodeResponse.status()).toBe(400);
    await expect(page).toHaveURL(shell.otp);
    await expect(page.getByRole('alert')).toHaveText(
      shell.name === 'web'
        ? 'Mã xác thực không đúng. Vui lòng kiểm tra lại.'
        : 'Mã OTP không đúng. Vui lòng thử lại.',
    );
    await expect(otpInputs.nth(0)).toHaveValue('');
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
    const invalidCodeScreenshot = testInfo.outputPath(
      `otp-${shell.name}-${shell.width}x${shell.height}-invalid-code.png`,
    );
    await page.screenshot({ path: invalidCodeScreenshot, fullPage: true, animations: 'disabled' });

    const validCodePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login/mfa/verify') &&
        response.status() === 200,
    );
    for (const [index, digit] of [...'123456'].entries()) await otpInputs.nth(index).fill(digit);
    const validCodeResponse = await validCodePromise;
    expect(validCodeResponse.status()).toBe(200);
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/home$`));
    expect(authRequests.filter((pathname) => pathname.endsWith('/auth/login'))).toHaveLength(1);
    expect(
      authRequests.filter((pathname) => pathname.endsWith('/auth/login/mfa/verify')),
    ).toHaveLength(2);
    expect(authRequests.filter((pathname) => pathname.endsWith('/auth/mfa/verify'))).toHaveLength(
      0,
    );
    expect(authRequests).toEqual([
      '/api/auth/login',
      '/api/auth/login/mfa/verify',
      '/api/auth/login/mfa/verify',
    ]);

    const storageAuthKeys = await page.evaluate(() =>
      [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter((key) =>
        /auth|token|session/i.test(key),
      ),
    );
    expect(storageAuthKeys).toEqual([]);
    const homeScreenshot = testInfo.outputPath(
      `otp-${shell.name}-${shell.width}x${shell.height}-verified-home.png`,
    );
    await page.screenshot({ path: homeScreenshot, fullPage: true, animations: 'disabled' });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(shell.width);
    const screenshots = [challengeScreenshot, invalidCodeScreenshot, homeScreenshot];
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
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. Login MFA code 400/200 responses are local fixtures; no page.route, backend, staging or external API was used.',
      shell: shell.name,
      loginRoute: shell.login,
      otpRoute: shell.otp,
      viewport: { width: shell.width, height: shell.height },
      serviceWorkerScripts,
      loginStatus: loginResponse.status(),
      challengeIdPrefix: 'dev-login-mfa-',
      loginMfaVerificationStatuses: [invalidCodeResponse.status(), validCodeResponse.status()],
      loginMfaVerificationRequests: 2,
      registrationVerifyMfaRequests: 0,
      signOutVisibleBeforeVerification: false,
      authTokenOrSessionStorageKeys: storageAuthKeys,
      destinationRoute: `${shell.prefix}/home`,
      documentWidth,
      screenshots,
      screenshotSha256,
    };
    const reportPath = testInfo.outputPath(`otp-${shell.name}-development-msw.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('login-otp-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    page.removeListener('request', trackRequest);
  });
}

test('Web login OTP has no axe violations in settled light and dark states @auth-otp-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  const states = ['challenge', 'invalid-code'] as const;
  const measurements: Array<Record<string, unknown>> = [];

  for (const theme of themes) {
    for (const width of widths) {
      for (const state of states) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/w/auth/login');
        await page.getByTestId('auth-email').fill('mfa@vittrade.local');
        await page.getByTestId('auth-password').fill('Preview-123!');
        const loginResponse = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith('/auth/login') &&
            response.status() === 200,
        );
        await page.getByTestId('auth-submit').click();
        await loginResponse;
        await expect(page).toHaveURL(/\/w\/auth\/otp$/);
        await expect(page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' })).toBeVisible();

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

        if (state === 'invalid-code') {
          const invalidCodeResponse = page.waitForResponse(
            (response) =>
              response.request().method() === 'POST' &&
              new URL(response.url()).pathname.endsWith('/auth/login/mfa/verify') &&
              response.status() === 400,
          );
          const inputs = page.locator('input[aria-label^="Mã xác thực, chữ số"]');
          for (let index = 0; index < 6; index += 1) await inputs.nth(index).fill('0');
          await invalidCodeResponse;
          await expect(page.getByRole('alert')).toHaveText(
            'Mã xác thực không đúng. Vui lòng kiểm tra lại.',
          );
        }

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const violations = results.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          affectedNodeCount: nodes.length,
          nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
        }));
        measurements.push({ theme, width, state, violationCount: violations.length, violations });
        expect(
          violations,
          `Axe violations in Web login OTP ${theme} theme at ${width}px (${state})`,
        ).toEqual([]);
      }
    }
  }

  const report = {
    fixtureBoundary:
      'Local Vite development MSW: Web login returns its registered MFA challenge and local invalid-code handler returns HTTP 400. No page.route interception, backend, staging or production service was used.',
    route: '/w/auth/otp',
    themes,
    widths,
    states,
    measurements,
  };
  const reportPath = testInfo.outputPath('web-login-otp-axe-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('web-login-otp-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(themes.length * widths.length * states.length);
});

test('Shared OTPPage passes challenge and invalid-code Axe states @auth-otp-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const shells = [
    { name: 'phone', login: '/auth/login', otp: '/auth/otp', prefix: '', width: 390 },
    { name: 'tablet', login: '/t/auth/login', otp: '/t/auth/otp', prefix: '/t', width: 768 },
    {
      name: 'responsive',
      login: '/r/auth/login',
      otp: '/r/auth/otp',
      prefix: '/r',
      width: 1024,
    },
    {
      name: 'responsive-wide',
      login: '/r/auth/login',
      otp: '/r/auth/otp',
      prefix: '/r',
      width: 1440,
    },
  ];
  const themes = ['light', 'dark'] as const;
  const states = ['challenge', 'invalid-code-400', 'rate-limited-429'] as const;
  const measurements: Array<Record<string, unknown>> = [];

  for (const shell of shells) {
    for (const theme of themes) {
      for (const state of states) {
        await page.setViewportSize({ width: shell.width, height: 900 });
        await page.goto(shell.login);
        await expect(page.getByTestId('auth-email')).toBeVisible();
        const serviceWorkerScripts = await page.evaluate(async () => {
          await navigator.serviceWorker.ready;
          return (await navigator.serviceWorker.getRegistrations())
            .map((registration) => registration.active?.scriptURL)
            .filter((url): url is string => Boolean(url));
        });
        expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(
          true,
        );

        await page
          .getByTestId('auth-email')
          .fill(
            state === 'rate-limited-429' ? 'mfa-rate-limited@vittrade.local' : 'mfa@vittrade.local',
          );
        await page.getByTestId('auth-password').fill('Preview-123!');
        const loginResponsePromise = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            new URL(response.url()).pathname.endsWith('/auth/login') &&
            response.status() === 200,
        );
        await page.getByTestId('auth-submit').click();
        expect((await loginResponsePromise).status()).toBe(200);
        await expect(page).toHaveURL(shell.otp);
        await expect(page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' })).toBeVisible();

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

        if (state === 'invalid-code-400') {
          const verifyResponsePromise = page.waitForResponse(
            (response) =>
              response.request().method() === 'POST' &&
              new URL(response.url()).pathname.endsWith('/auth/login/mfa/verify') &&
              response.status() === 400,
          );
          const inputs = page.locator('input[aria-label^="Ký tự OTP"]');
          for (let index = 0; index < 6; index += 1) await inputs.nth(index).fill('0');
          expect((await verifyResponsePromise).status()).toBe(400);
          await expect(page.getByRole('alert')).toHaveText('Mã OTP không đúng. Vui lòng thử lại.');
        }
        if (state === 'rate-limited-429') {
          const verifyResponsePromise = page.waitForResponse(
            (response) =>
              response.request().method() === 'POST' &&
              new URL(response.url()).pathname.endsWith('/auth/login/mfa/verify') &&
              response.status() === 429,
          );
          const inputs = page.locator('input[aria-label^="Ký tự OTP"]');
          for (let index = 0; index < 6; index += 1) await inputs.nth(index).fill('1');
          expect((await verifyResponsePromise).status()).toBe(429);
          await expect(page.getByRole('alert')).toContainText('Quá nhiều lần xác thực.');
          await expect(page.getByRole('button', { name: 'Quay lại đăng nhập' })).toBeVisible();
        }

        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const entry = {
          shell: shell.name,
          loginRoute: shell.login,
          otpRoute: shell.otp,
          viewportWidth: shell.width,
          theme,
          state,
          loginStatus: 200,
          verifyStatus:
            state === 'invalid-code-400' ? 400 : state === 'rate-limited-429' ? 429 : null,
          violationCount: result.violations.length,
          violations: result.violations.map(({ id, impact, nodes }) => ({
            id,
            impact,
            affectedNodeCount: nodes.length,
            nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
          })),
        };
        measurements.push(entry);
        await writeFile(
          testInfo.outputPath('otp-page-shared-axe-report.json'),
          `${JSON.stringify(measurements, null, 2)}\n`,
        );
        expect(result.violations, `Axe violations for ${shell.name} ${theme} ${state}`).toEqual([]);
      }
    }
  }

  const reportPath = testInfo.outputPath('otp-page-shared-axe-report.json');
  await testInfo.attach('otp-page-shared-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(shells.length * themes.length * states.length);
});
