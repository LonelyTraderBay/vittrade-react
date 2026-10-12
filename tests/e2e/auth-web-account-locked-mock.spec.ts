import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const email = 'locked@vittrade.local';
const password = 'Preview-123!';
const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 900 },
  { name: 'responsive', width: 1024, height: 900 },
  { name: 'desktop', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`WebAccountLockedPage follows actual MSW login 423 at ${viewport.width}px @auth-web-account-locked-mock`, async ({
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
          JSON.stringify({ email: 'locked@vittrade.local', password: 'Preview-123!' });
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
    await expect(page).toHaveURL('/w/auth/account-locked');

    const heading = page.getByRole('heading', { name: 'Tài khoản tạm khóa' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.locator('main').getByRole('status')).toContainText(
      'Hãy quay lại đăng nhập để kiểm tra trạng thái mới nhất.',
    );
    await expect(page.getByText('Tài khoản đã mở khóa')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Gửi email mở khóa' })).toHaveCount(0);

    const screenshotPath = testInfo.outputPath(
      `web-account-locked-${viewport.name}-${viewport.width}x${viewport.height}.png`,
    );
    await page.screenshot({ path: screenshotPath, animations: 'disabled' });
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(viewport.width);

    await page.getByRole('button', { name: 'Quay lại đăng nhập' }).click();
    await expect(page).toHaveURL('/w/auth/login');
    await expect(page.getByTestId('auth-email')).toBeVisible();
    await page.goto('/w/auth/account-locked');
    await page.getByRole('button', { name: 'Không phải bạn? Đặt lại mật khẩu' }).click();
    await expect(page).toHaveURL('/w/auth/forgot-password');

    expect(requestBodyMatchesAdapter).toBe(true);
    expect(authRequests).toEqual([{ path: '/api/auth/login', status: 423 }]);
    const screenshotSha256 = createHash('sha256')
      .update(await readFile(screenshotPath))
      .digest('hex');
    const report = {
      fixtureBoundary:
        'Vite development app uses the registered mockServiceWorker.js and actual handlers.ts. The locked persona login HTTP 423 is a local fixture; the static account-locked page makes no backend request. No page.route/backend/staging/external API was used.',
      route: '/w/auth/account-locked',
      loginRoute: '/w/auth/login',
      forgotPasswordRoute: '/w/auth/forgot-password',
      viewport,
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
    const reportPath = testInfo.outputPath(
      `web-account-locked-${viewport.name}-development-msw.json`,
    );
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    await testInfo.attach('web-account-locked-development-msw.json', {
      path: reportPath,
      contentType: 'application/json',
    });
    page.removeListener('request', trackRequest);
    page.removeListener('response', trackResponse);
  });
}
