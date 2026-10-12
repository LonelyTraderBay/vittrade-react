import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const email = 'user@example.com';
const password = 'Reset-Preview-123!';
const directResetToken = 'direct-dev-reset-token';
const shells = [
  {
    name: 'phone',
    forgotRoute: '/auth/forgot-password',
    resetRoute: '/auth/reset-password',
    width: 390,
    height: 844,
  },
  {
    name: 'tablet',
    forgotRoute: '/t/auth/forgot-password',
    resetRoute: '/t/auth/reset-password',
    width: 768,
    height: 900,
  },
  {
    name: 'responsive',
    forgotRoute: '/r/auth/forgot-password',
    resetRoute: '/r/auth/reset-password',
    width: 1024,
    height: 900,
  },
  {
    name: 'web',
    forgotRoute: '/w/auth/forgot-password',
    resetRoute: '/w/auth/reset-password',
    width: 1440,
    height: 900,
  },
];
const axeThemes = ['light', 'dark'] as const;
const axeStates = [
  'request-step',
  'otp-step',
  'flow-reset-step',
  'flow-success-step',
  'direct-reset-step',
  'direct-success-step',
] as const;

for (const shell of shells) {
  test(`password reset uses actual MSW through ${shell.name} shell @auth-password-reset-mock`, async ({
    page,
  }, testInfo) => {
    const axeWidths = shell.name === 'web' ? ([320, 1440] as const) : [shell.width];
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.forgotRoute);
    await expect(page.getByLabel('Email đăng ký')).toBeVisible();

    const serviceWorkerScripts = await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      return (await navigator.serviceWorker.getRegistrations())
        .map((registration) => registration.active?.scriptURL)
        .filter((url): url is string => Boolean(url));
    });
    expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

    const authRequests: Array<{ path: string; status?: number }> = [];
    const requestBodyMatches = {
      requestCode: false,
      verifyCode: false,
      flowConfirm: false,
      directConfirm: false,
    };
    const trackRequest = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (request.method() === 'POST' && url.pathname.startsWith('/api/auth/')) {
        authRequests.push({ path: url.pathname });
      }
      const body = request.postDataJSON() as Record<string, string> | null;
      if (url.pathname.endsWith('/auth/password-reset/request')) {
        requestBodyMatches.requestCode =
          JSON.stringify(body) === JSON.stringify({ email: 'user@example.com' });
      }
      if (url.pathname.endsWith('/auth/password-reset/verify')) {
        requestBodyMatches.verifyCode =
          JSON.stringify(body) === JSON.stringify({ email: 'user@example.com', code: '123456' });
      }
      if (url.pathname.endsWith('/auth/password-reset/confirm')) {
        if (body?.resetToken === 'dev-reset-token') {
          requestBodyMatches.flowConfirm =
            JSON.stringify(body) ===
            JSON.stringify({
              email: 'user@example.com',
              resetToken: 'dev-reset-token',
              newPassword: 'Reset-Preview-123!',
            });
        }
        if (body?.resetToken === directResetToken) {
          requestBodyMatches.directConfirm =
            JSON.stringify(body) ===
            JSON.stringify({
              email: 'user@example.com',
              resetToken: directResetToken,
              newPassword: 'Reset-Preview-123!',
            });
        }
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

    const screenshots: string[] = [];
    const capture = async (state: string) => {
      const path = testInfo.outputPath(
        `password-reset-${shell.name}-${shell.width}x${shell.height}-${state}.png`,
      );
      await page.screenshot({ path, animations: 'disabled' });
      screenshots.push(path);
    };
    const axeMeasurements: Array<Record<string, unknown>> = [];
    const scanAxeState = async (state: (typeof axeStates)[number]) => {
      test.setTimeout(240_000);
      for (const theme of axeThemes) {
        for (const width of axeWidths) {
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
            nodes: nodes.map((node) => ({
              target: node.target,
              summary: node.failureSummary
                ?.replaceAll(email, '[redacted fixture email]')
                .replaceAll(password, '[redacted fixture password]')
                .replaceAll(directResetToken, '[redacted fixture reset token]')
                .replaceAll('dev-reset-token', '[redacted fixture reset token]')
                .replaceAll('123456', '[redacted fixture OTP]'),
            })),
          }));
          axeMeasurements.push({
            theme,
            width,
            state,
            violationCount: violations.length,
            violations,
          });
        }
      }
      await page.setViewportSize({ width: shell.width, height: shell.height });
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

    await capture('request-step');
    await scanAxeState('request-step');
    await page.getByLabel('Email đăng ký').fill(email);
    const requestResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/password-reset/request'),
    );
    await page.getByRole('button', { name: 'Gửi mã xác minh' }).click();
    const requestResponse = await requestResponsePromise;
    expect(requestResponse.status()).toBe(204);
    await expect(page.getByRole('heading', { name: 'Nhập mã OTP' })).toBeVisible();
    await capture('otp-step');
    await scanAxeState('otp-step');

    await page.getByLabel('Mã OTP').fill('123456');
    const verifyResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/password-reset/verify'),
    );
    await page.getByRole('button', { name: 'Xác nhận' }).click();
    const verifyResponse = await verifyResponsePromise;
    expect(verifyResponse.status()).toBe(200);
    expect((await verifyResponse.json()).resetToken).toBe('dev-reset-token');
    await expect(page.getByRole('heading', { name: 'Mật khẩu mới' })).toBeVisible();
    await capture('reset-step');
    await scanAxeState('flow-reset-step');

    await page.getByLabel('Mật khẩu mới').fill(password);
    await page.getByLabel('Nhập lại mật khẩu').fill(password);
    const flowConfirmResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/password-reset/confirm'),
    );
    await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
    const flowConfirmResponse = await flowConfirmResponsePromise;
    expect(flowConfirmResponse.status()).toBe(204);
    await expect(page.getByRole('heading', { name: 'Thành công!' })).toBeVisible();
    await capture('success-step');
    await scanAxeState('flow-success-step');

    const resetUrl =
      `${shell.resetRoute}?email=${encodeURIComponent(email)}` +
      `&resetToken=${encodeURIComponent(directResetToken)}`;
    await page.goto(resetUrl);
    await expect(page.getByRole('heading', { name: 'Mật khẩu mới' })).toBeVisible();
    await capture('direct-reset-step');
    await scanAxeState('direct-reset-step');
    await page.getByLabel('Mật khẩu mới').fill(password);
    await page.getByLabel('Nhập lại mật khẩu').fill(password);
    const directConfirmResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/password-reset/confirm'),
    );
    await page.getByRole('button', { name: 'Đặt lại mật khẩu' }).click();
    const directConfirmResponse = await directConfirmResponsePromise;
    expect(directConfirmResponse.status()).toBe(204);
    await expect(page.getByRole('heading', { name: 'Thành công!' })).toBeVisible();
    await capture('direct-reset-success');
    await scanAxeState('direct-success-step');

    expect(requestBodyMatches).toEqual({
      requestCode: true,
      verifyCode: true,
      flowConfirm: true,
      directConfirm: true,
    });
    expect(authRequests).toEqual([
      { path: '/api/auth/password-reset/request', status: 204 },
      { path: '/api/auth/password-reset/verify', status: 200 },
      { path: '/api/auth/password-reset/confirm', status: 204 },
      { path: '/api/auth/password-reset/confirm', status: 204 },
    ]);
    await expect(page).toHaveURL(resetUrl);

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
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. Password-reset request HTTP 204, verification HTTP 200 with a fixture reset token, and confirmation HTTP 204 are local fixtures; no page.route, backend, staging or external API was used.',
      shell: shell.name,
      forgotPasswordRoute: shell.forgotRoute,
      directResetRoute: shell.resetRoute,
      viewport: { width: shell.width, height: shell.height },
      serviceWorkerScripts,
      requestCodeStatus: requestResponse.status(),
      verifyCodeStatus: verifyResponse.status(),
      resetTokenReturned: true,
      flowConfirmStatus: flowConfirmResponse.status(),
      directConfirmStatus: directConfirmResponse.status(),
      authRequests,
      requestBodiesMatchAdapter: requestBodyMatches,
      screenshots: screenshots.map((file) => file.split(/[\\/]/).at(-1) ?? file),
      screenshotSha256,
      documentWidth,
    };
    const reportPath = testInfo.outputPath(`password-reset-${shell.name}-development-msw.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('password-reset-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    const axeReport = {
      fixtureBoundary:
        'Vite development app and registered MSW supplied the password-reset request, OTP verification and confirmation responses. Direct reset used the local query-token fixture. Axe scanned six visible workflow states; no page.route, backend, staging or external API was used. Fixture email, OTP and reset tokens are redacted from node summaries.',
      shell: shell.name,
      routes: [shell.forgotRoute, shell.resetRoute],
      themes: axeThemes,
      widths: axeWidths,
      states: axeStates,
      measurements: axeMeasurements,
    };
    const axeReportPath = testInfo.outputPath(`password-reset-${shell.name}-axe-report.json`);
    await writeFile(axeReportPath, `${JSON.stringify(axeReport, null, 2)}\n`);
    await testInfo.attach(`password-reset-${shell.name}-axe-report.json`, {
      path: axeReportPath,
      contentType: 'application/json',
    });
    expect(axeMeasurements).toHaveLength(axeThemes.length * axeWidths.length * axeStates.length);
    expect(
      axeMeasurements.filter((measurement) => measurement.violationCount !== 0),
      `${shell.name} password-reset Axe violations by theme, viewport and state`,
    ).toEqual([]);
    page.removeListener('request', trackRequest);
    page.removeListener('response', trackResponse);
  });
}
