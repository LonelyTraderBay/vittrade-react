import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const email = 'locked@vittrade.local';
const password = 'Preview-123!';
const shells = [
  {
    name: 'phone',
    loginRoute: '/auth/login',
    lockedRoute: '/auth/account-locked',
    forgotRoute: '/auth/forgot-password',
    width: 390,
    height: 844,
  },
  {
    name: 'tablet',
    loginRoute: '/t/auth/login',
    lockedRoute: '/t/auth/account-locked',
    forgotRoute: '/t/auth/forgot-password',
    width: 768,
    height: 900,
  },
  {
    name: 'responsive',
    loginRoute: '/r/auth/login',
    lockedRoute: '/r/auth/account-locked',
    forgotRoute: '/r/auth/forgot-password',
    width: 1024,
    height: 900,
  },
  {
    name: 'responsive-wide',
    loginRoute: '/r/auth/login',
    lockedRoute: '/r/auth/account-locked',
    forgotRoute: '/r/auth/forgot-password',
    width: 1440,
    height: 900,
  },
];

for (const shell of shells) {
  test(`AccountLockedPage follows actual MSW login 423 through ${shell.name} alias @auth-account-locked-mock`, async ({
    page,
  }, testInfo) => {
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
    let requestBodyMatchesAdapter = false;
    const trackRequest = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (request.method() === 'POST' && url.pathname.startsWith('/api/auth/')) {
        authRequests.push({ path: url.pathname });
      }
      if (url.pathname.endsWith('/auth/login')) {
        const body = request.postDataJSON() as Record<string, string> | null;
        requestBodyMatchesAdapter =
          JSON.stringify(body) ===
          JSON.stringify({
            email: 'locked@vittrade.local',
            password: 'Preview-123!',
          });
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
        response.status() === 423,
    );
    await page.getByTestId('auth-email').fill(email);
    await page.getByTestId('auth-password').fill(password);
    await page.getByTestId('auth-submit').click();
    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(423);
    await expect(page).toHaveURL(shell.lockedRoute);

    const heading = page.getByRole('heading', { name: 'Tài khoản tạm khóa' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(
      page.locator('[role="status"]').filter({
        hasText: 'Hệ thống xác thực hiện chưa cho phép đăng nhập tài khoản này',
      }),
    ).toContainText('Hãy quay lại đăng nhập để kiểm tra trạng thái mới nhất.');
    await expect(page.getByText('Tài khoản đã mở khóa')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Gửi email mở khóa' })).toHaveCount(0);

    const screenshotPath = testInfo.outputPath(
      `account-locked-${shell.name}-${shell.width}x${shell.height}.png`,
    );
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(shell.width);

    await page.getByRole('button', { name: 'Quay lại đăng nhập' }).click();
    await expect(page).toHaveURL(shell.loginRoute);
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await page.goto(shell.lockedRoute);
    await page.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }).click();
    await expect(page).toHaveURL(shell.forgotRoute);

    expect(requestBodyMatchesAdapter).toBe(true);
    expect(authRequests).toEqual([{ path: '/api/auth/login', status: 423 }]);
    const screenshotSha256 = createHash('sha256')
      .update(await readFile(screenshotPath))
      .digest('hex');
    const report = {
      fixtureBoundary:
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. The locked persona login HTTP 423 is a local fixture; AccountLockedPage is static and makes no API request. No page.route/backend/staging/external API was used.',
      shell: shell.name,
      loginRoute: shell.loginRoute,
      lockedRoute: shell.lockedRoute,
      forgotRoute: shell.forgotRoute,
      viewport: { width: shell.width, height: shell.height },
      serviceWorkerScripts,
      authRequests,
      requestBodyMatchesAdapter,
      headingFocusedOnEntry: true,
      statusMessageRendered: true,
      noClientUnlockClaim: true,
      noUnlockEmailAction: true,
      loginReturnWorks: true,
      passwordResetRouteWorks: true,
      documentWidth,
      screenshot: screenshotPath.split(/[\\/]/).at(-1),
      screenshotSha256,
    };
    const reportJson = JSON.stringify(report);
    expect(reportJson).not.toContain(email);
    expect(reportJson).not.toContain(password);
    const reportPath = testInfo.outputPath(`account-locked-${shell.name}-development-msw.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('account-locked-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    page.removeListener('request', trackRequest);
    page.removeListener('response', trackResponse);
  });
}

test('AccountLockedPage passes light/dark Axe scans across supported shells @auth-account-locked-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const themes = ['light', 'dark'] as const;
  const measurements: Array<Record<string, unknown>> = [];
  const reportPath = testInfo.outputPath('account-locked-axe-report.json');

  for (const shell of shells) {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.loginRoute);
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await page.getByTestId('auth-email').fill(email);
    await page.getByTestId('auth-password').fill(password);
    const lockedResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login') &&
        response.status() === 423,
    );
    await page.getByTestId('auth-submit').click();
    expect((await lockedResponse).status()).toBe(423);
    await expect(page).toHaveURL(shell.lockedRoute);
    await expect(page.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();

    for (const theme of themes) {
      await page.evaluate((activeTheme) => {
        document.documentElement.classList.toggle('dark', activeTheme === 'dark');
        document.documentElement.classList.toggle('light', activeTheme === 'light');
      }, theme);
      await page.waitForTimeout(180);

      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const entry = {
        shell: shell.name,
        route: shell.lockedRoute,
        viewportWidth: shell.width,
        theme,
        status: 423,
        violationCount: result.violations.length,
        violations: result.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          affectedNodeCount: nodes.length,
        })),
      };
      measurements.push(entry);
      await writeFile(reportPath, `${JSON.stringify(measurements, null, 2)}\n`);
      expect(
        result.violations,
        `Axe violations for ${shell.name} ${theme}: ${JSON.stringify(entry.violations, null, 2)}`,
      ).toEqual([]);
    }
  }

  await testInfo.attach('account-locked-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
});
