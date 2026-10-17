import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const shells = [
  {
    name: 'phone',
    login: '/auth/login',
    route: '/profile/security/change-password',
    width: 390,
    height: 844,
  },
  {
    name: 'tablet',
    login: '/t/auth/login',
    route: '/t/profile/security/change-password',
    width: 768,
    height: 900,
  },
  {
    name: 'responsive',
    login: '/r/auth/login',
    route: '/r/profile/security/change-password',
    width: 1024,
    height: 900,
  },
  {
    name: 'web',
    login: '/w/auth/login',
    route: '/w/profile/security/change-password',
    width: 1440,
    height: 900,
  },
];

for (const shell of shells) {
  test(`password change uses actual MSW through ${shell.name} shell @auth-password-change-mock`, async ({
    page,
  }, testInfo) => {
    const axeThemes = ['light', 'dark'] as const;
    const axeWidths = [shell.width] as const;
    const axeStates = ['verify-step', 'change-step', 'mismatch-error', 'success-step'] as const;
    const axeMeasurements: Array<Record<string, unknown>> = [];
    const scanAxeState = async (state: (typeof axeStates)[number]) => {
      test.setTimeout(240_000);
      for (const theme of axeThemes) {
        for (const width of axeWidths) {
          await page.setViewportSize({ width, height: shell.height });
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

          // Motion's route fade runs in JavaScript and may not appear in getAnimations().
          // Contrast checks describe the settled page, so wait for its actual ancestor opacity.
          await expect
            .poll(async () =>
              page
                .getByText('Đổi mật khẩu', { exact: true })
                .first()
                .evaluate((heading) => {
                  for (
                    let element: Element | null = heading;
                    element;
                    element = element.parentElement
                  ) {
                    if (Number(getComputedStyle(element).opacity) !== 1) return false;
                  }
                  return true;
                }),
            )
            .toBe(true);

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
                ?.replaceAll('developer@vittrade.local', '[redacted fixture email]')
                .replaceAll('Preview-123!', '[redacted fixture password]')
                .replaceAll('Current-Preview-123!', '[redacted fixture password]')
                .replaceAll('SecurePassword123', '[redacted fixture password]')
                .replaceAll('DifferentPassword123', '[redacted fixture password]')
                .replaceAll('654321', '[redacted fixture TOTP]'),
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

    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.login);
    await expect(page.getByTestId('auth-email')).toBeVisible();

    const serviceWorkerScripts = await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations())
        .map((registration) => registration.active?.scriptURL)
        .filter((url): url is string => Boolean(url)),
    );
    expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

    const authRequests: Array<{ path: string; status?: number }> = [];
    let idempotencyKeyPresent = false;
    let idempotencyKeyMatchesUuid = false;
    let currentPasswordBodyMatches = false;
    let passwordChangeBodyMatches = false;
    const trackRequest = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (request.method() === 'POST' && url.pathname.startsWith('/api/auth/')) {
        authRequests.push({ path: url.pathname });
      }
      if (url.pathname.endsWith('/auth/password/verify-current')) {
        currentPasswordBodyMatches =
          JSON.stringify(request.postDataJSON()) ===
          JSON.stringify({ currentPassword: 'Current-Preview-123!' });
      }
      if (url.pathname.endsWith('/auth/password/change')) {
        passwordChangeBodyMatches =
          JSON.stringify(request.postDataJSON()) ===
          JSON.stringify({
            currentPassword: 'Current-Preview-123!',
            newPassword: 'SecurePassword123',
            mfaCode: '654321',
            mfaMethod: 'totp',
          });
        const key = request.headers()['idempotency-key'];
        idempotencyKeyPresent = Boolean(key);
        idempotencyKeyMatchesUuid = Boolean(key && /^[0-9a-f-]{36}$/i.test(key));
      }
    };
    const trackResponse = (response: import('@playwright/test').Response) => {
      const request = response.request();
      const url = new URL(response.url());
      if (request.method() === 'POST' && url.pathname.startsWith('/api/auth/')) {
        const record = authRequests.findLast(
          (item) => item.path === url.pathname && item.status === undefined,
        );
        if (record) record.status = response.status();
      }
    };
    page.on('request', trackRequest);
    page.on('response', trackResponse);

    await page.getByTestId('auth-email').fill('developer@vittrade.local');
    await page.getByTestId('auth-password').fill('Preview-123!');
    const loginResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login') &&
        response.status() === 200,
    );
    await page.getByTestId('auth-submit').click();
    const loginResponse = await loginResponsePromise;
    const loginResult = (await loginResponse.json()) as { status: string; session?: unknown };
    expect(loginResult.status).toBe('authenticated');
    await expect(page).toHaveURL(/\/home$/);

    await page.evaluate((route) => {
      window.history.pushState({}, '', route);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, shell.route);
    await expect(page).toHaveURL(shell.route);
    await expect(page.getByLabel('Mật khẩu hiện tại')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Xác minh mật khẩu hiện tại' })).toBeDisabled();
    await scanAxeState('verify-step');
    const currentPasswordScreenshot = testInfo.outputPath(
      `password-${shell.name}-${shell.width}x${shell.height}-verify-step.png`,
    );
    await page.screenshot({ path: currentPasswordScreenshot, animations: 'disabled' });
    const currentPassword = page.getByLabel('Mật khẩu hiện tại');
    await currentPassword.fill('Current-Preview-123!');
    await expect(currentPassword).toHaveValue('Current-Preview-123!');
    await expect(page.getByRole('button', { name: 'Xác minh mật khẩu hiện tại' })).toBeEnabled();

    const verifyResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/password/verify-current'),
    );
    await page.getByRole('button', { name: 'Xác minh mật khẩu hiện tại' }).click();
    const verifyResponse = await verifyResponsePromise;
    expect(verifyResponse.status()).toBe(204);
    await expect(page.getByText('Mật khẩu hiện tại đã được xác minh')).toBeVisible();
    await scanAxeState('change-step');

    const changePasswordScreenshot = testInfo.outputPath(
      `password-${shell.name}-${shell.width}x${shell.height}-change-step.png`,
    );
    await page.screenshot({ path: changePasswordScreenshot, animations: 'disabled' });
    await page.getByLabel('Mật khẩu mới', { exact: true }).fill('SecurePassword123');
    await page.getByLabel('Nhập lại mật khẩu mới').fill('DifferentPassword123');
    await expect(page.getByText('Mật khẩu chưa khớp.')).toBeVisible();
    await scanAxeState('mismatch-error');
    await page.getByLabel('Nhập lại mật khẩu mới').fill('SecurePassword123');
    await page.getByLabel('Mã xác thực TOTP').fill('654321');
    await expect(page.getByRole('button', { name: 'Đổi mật khẩu' })).toBeEnabled();
    const changeResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/password/change'),
    );
    await page.getByRole('button', { name: 'Đổi mật khẩu' }).click();
    const changeResponse = await changeResponsePromise;
    expect(changeResponse.status()).toBe(204);
    await expect(
      page.getByRole('heading', { name: 'Mật khẩu đã được đổi thành công.' }),
    ).toBeVisible();
    await scanAxeState('success-step');
    expect(idempotencyKeyPresent).toBe(true);
    expect(idempotencyKeyMatchesUuid).toBe(true);
    expect(currentPasswordBodyMatches).toBe(true);
    expect(passwordChangeBodyMatches).toBe(true);
    expect(authRequests).toEqual([
      { path: '/api/auth/login', status: 200 },
      { path: '/api/auth/password/verify-current', status: 204 },
      { path: '/api/auth/password/change', status: 204 },
    ]);

    const successScreenshot = testInfo.outputPath(
      `password-${shell.name}-${shell.width}x${shell.height}-success.png`,
    );
    await page.screenshot({ path: successScreenshot, animations: 'disabled' });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(shell.width);

    const screenshots = [currentPasswordScreenshot, changePasswordScreenshot, successScreenshot];
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
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. Developer login, current-password HTTP 204 and password-change HTTP 204 are local fixtures; no page.route, backend, staging or external API was used.',
      shell: shell.name,
      loginRoute: shell.login,
      passwordChangeRoute: shell.route,
      viewport: { width: shell.width, height: shell.height },
      serviceWorkerScripts,
      loginStatus: loginResponse.status(),
      authenticatedLoginFixture: loginResult.status,
      verifyCurrentPasswordStatus: verifyResponse.status(),
      passwordChangeStatus: changeResponse.status(),
      authRequests,
      passwordChangeRequests: authRequests.length,
      requestBodiesMatchAdapter: {
        verifyCurrentPassword: currentPasswordBodyMatches,
        changePassword: passwordChangeBodyMatches,
      },
      idempotencyKeyPresent,
      idempotencyKeyMatchesUuid,
      screenshots: screenshots.map((file) => file.split(/[\\/]/).at(-1) ?? file),
      screenshotSha256,
      documentWidth,
    };
    const reportPath = testInfo.outputPath(`password-${shell.name}-development-msw.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('password-change-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    const axeReport = {
      fixtureBoundary:
        'Vite development app and registered MSW supplied login, current-password verification and password-change responses. Axe scanned four visible PasswordChangePage states; fixture credentials are redacted and no page.route, backend, staging or external API was used.',
      shell: shell.name,
      route: shell.route,
      themes: axeThemes,
      widths: axeWidths,
      states: axeStates,
      measurements: axeMeasurements,
    };
    const axeReportPath = testInfo.outputPath(`password-change-${shell.name}-axe-report.json`);
    await writeFile(axeReportPath, `${JSON.stringify(axeReport, null, 2)}\n`);
    await testInfo.attach(`password-change-${shell.name}-axe-report.json`, {
      path: axeReportPath,
      contentType: 'application/json',
    });
    expect(axeMeasurements).toHaveLength(axeThemes.length * axeWidths.length * axeStates.length);
    expect(
      axeMeasurements.filter((measurement) => measurement.violationCount !== 0),
      `${shell.name} password-change Axe violations by theme, viewport and state`,
    ).toEqual([]);
    page.removeListener('request', trackRequest);
    page.removeListener('response', trackResponse);
  });
}
