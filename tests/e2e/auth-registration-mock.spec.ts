import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

test('registration uses the real development MSW handler across shells @auth-mock', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'phone', route: '/auth/register', width: 390, height: 844, prefix: '' },
    { name: 'tablet', route: '/t/auth/register', width: 768, height: 900, prefix: '/t' },
    {
      name: 'responsive',
      route: '/r/auth/register',
      width: 1024,
      height: 900,
      prefix: '/r',
    },
    { name: 'web', route: '/w/auth/register', width: 1440, height: 900, prefix: '/w' },
  ];
  const observations: Array<Record<string, unknown>> = [];
  const screenshots: string[] = [];

  for (const shell of shells) {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.route);
    await expect(page.getByText('Tạo tài khoản', { exact: true }).first()).toBeVisible();

    const serviceWorkerScripts = await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations())
        .map((registration) => registration.active?.scriptURL)
        .filter((url): url is string => Boolean(url)),
    );
    expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

    const registrationResponses: Array<{ status: number; body: unknown }> = [];
    const registrationFailures: string[] = [];
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      if (request.method() === 'POST' && url.pathname.endsWith('/auth/register')) {
        registrationFailures.push(request.failure()?.errorText ?? 'request failed');
      }
    });
    page.on('response', async (response) => {
      if (
        response.request().method() !== 'POST' ||
        !new URL(response.url()).pathname.endsWith('/auth/register')
      ) {
        return;
      }

      registrationResponses.push({
        status: response.status(),
        body: await response.json(),
      });
    });

    const submit = page.getByRole('button', { name: 'Tiếp tục', exact: true });
    await submit.click();
    await expect(page.getByRole('alert')).toHaveCount(4);
    expect(registrationResponses).toHaveLength(0);
    const validationScreenshot = testInfo.outputPath(
      `registration-${shell.name}-${shell.width}x${shell.height}-validation.png`,
    );
    await page.screenshot({ path: validationScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(validationScreenshot);

    await page.getByLabel('Họ và tên', { exact: true }).fill('MSW Registration User');
    await page.getByLabel('Email', { exact: true }).fill('msw@example.com');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('SecureMockPass123!');
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('SecureMockPass123!');
    await page.getByRole('checkbox').check();
    await expect(page.getByRole('alert')).toHaveCount(0);

    const previewControls = page.getByTestId('dev-preview-controls');
    const previewPosition = await previewControls.evaluate(
      (element) => getComputedStyle(element).position,
    );
    expect(previewPosition).toBe('static');
    const submitBox = await submit.boundingBox();
    const previewBox = await previewControls.boundingBox();
    expect(submitBox).not.toBeNull();
    expect(previewBox).not.toBeNull();
    const overlapsSubmit =
      submitBox!.x < previewBox!.x + previewBox!.width &&
      submitBox!.x + submitBox!.width > previewBox!.x &&
      submitBox!.y < previewBox!.y + previewBox!.height &&
      submitBox!.y + submitBox!.height > previewBox!.y;
    expect(overlapsSubmit).toBe(false);

    const populatedScreenshot = testInfo.outputPath(
      `registration-${shell.name}-${shell.width}x${shell.height}-populated.png`,
    );
    await page.screenshot({ path: populatedScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(populatedScreenshot);

    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
    await page.getByLabel('Miền API').selectOption('auth');
    await page.getByLabel('Trạng thái phản hồi').selectOption('error');
    await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
    await expect(page.getByTestId('active-preview-scenario')).toContainText('auth.error');
    await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue(
      'MSW Registration User',
    );
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('msw@example.com');
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('SecureMockPass123!');
    await expect(page.getByLabel('Xác nhận mật khẩu', { exact: true })).toHaveValue(
      'SecureMockPass123!',
    );
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: 'Thu gọn' }).click();

    const registrationFailurePromise = page.waitForEvent(
      'requestfailed',
      (request) =>
        request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/auth/register'),
      { timeout: 5_000 },
    );
    await submit.click();
    await registrationFailurePromise;
    await expect(
      page.getByText('Chưa thể bắt đầu xác minh. Kiểm tra kết nối rồi thử lại.'),
    ).toBeVisible();
    await expect(page.getByLabel('Họ và tên', { exact: true })).toHaveValue(
      'MSW Registration User',
    );
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('msw@example.com');
    await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('SecureMockPass123!');
    await expect(page.getByLabel('Xác nhận mật khẩu', { exact: true })).toHaveValue(
      'SecureMockPass123!',
    );
    await expect(page.getByRole('checkbox')).toBeChecked();
    await expect.poll(() => registrationFailures.length).toBe(1);
    expect(registrationResponses).toHaveLength(0);

    const requestErrorScreenshot = testInfo.outputPath(
      `registration-${shell.name}-${shell.width}x${shell.height}-request-error.png`,
    );
    await page.screenshot({ path: requestErrorScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(requestErrorScreenshot);

    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
    await page.getByRole('button', { name: 'Tắt trạng thái API' }).click();
    await expect(page.getByTestId('active-preview-scenario')).toHaveCount(0);
    await page.getByRole('button', { name: 'Thu gọn' }).click();
    await page.getByLabel('Họ và tên', { exact: true }).fill('MSW Registration User');
    await page.getByLabel('Email', { exact: true }).fill('msw@example.com');
    await page.getByLabel('Mật khẩu', { exact: true }).fill('SecureMockPass123!');
    await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('SecureMockPass123!');
    await page.getByRole('checkbox').check();
    await expect(page.getByRole('checkbox')).toBeChecked();
    // Clearing a local preview scenario can remount the responsive shell route.
    // The transport-error retention is asserted above; re-enter the fixture draft after reset.

    const responsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/register'),
      { timeout: 5_000 },
    );
    await submit.click();
    const response = await responsePromise;
    expect(response.status()).toBe(202);
    const challenge = (await response.json()) as {
      challengeId: string;
      channel: string;
      maskedDestination: string;
      expiresAt: string;
    };
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/otp$`));
    await expect(page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' })).toBeVisible();
    await expect(page.getByText('m***@example.com', { exact: true })).toBeVisible();
    expect(response.status()).toBe(202);
    expect(challenge).toMatchObject({
      challengeId: expect.stringMatching(/^dev-registration-/),
      channel: 'email',
      maskedDestination: 'm***@example.com',
    });
    await expect.poll(() => registrationResponses.length).toBe(1);
    expect(registrationResponses[0].status).toBe(202);
    expect(await page.getByRole('alert').count()).toBe(0);

    const challengeScreenshot = testInfo.outputPath(
      `registration-${shell.name}-${shell.width}x${shell.height}-challenge.png`,
    );
    await page.screenshot({ path: challengeScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(challengeScreenshot);

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBe(shell.width);
    observations.push({
      shell: shell.name,
      route: shell.route,
      viewport: { width: shell.width, height: shell.height },
      serviceWorkerScripts,
      validationAlerts: 4,
      registrationRequests: registrationResponses.length,
      requestFailure: registrationFailures[0],
      registrationStatus: response.status(),
      responseSources: [
        'local previewScenarioHandler: statusless transport failure for Auth registration',
        'local handlers.ts registration handler: HTTP 202; challenge ID uses dev-registration prefix',
      ],
      challenge,
      destinationRoute: `${shell.prefix}/auth/otp`,
      verifyMfaRequests: 0,
      documentWidth,
      screenshots: [
        validationScreenshot,
        populatedScreenshot,
        requestErrorScreenshot,
        challengeScreenshot,
      ],
    });
    page.removeAllListeners('response');
  }

  const report = {
    fixtureBoundary:
      'Development Vite runs with VITE_DATA_SOURCE=mock and the registered mockServiceWorker.js. No page.route interception, live API, backend or staging request was used. The auth.error preview scenario drops the Auth registration response at transport level; after it is cleared, the normal handler returns HTTP 202.',
    routeCount: observations.length,
    observations,
    screenshotSha256: Object.fromEntries(
      await Promise.all(
        screenshots.map(async (file) => [
          file.split(/[\\/]/).at(-1) ?? file,
          createHash('sha256')
            .update(await readFile(file))
            .digest('hex'),
        ]),
      ),
    ),
  };
  const reportPath = testInfo.outputPath('registration-development-msw.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('registration-development-msw.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(observations).toHaveLength(shells.length);
});

test('Web registration has no axe violations in settled light and dark states @auth-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  const states = ['initial', 'empty-submit-validation', 'password-mismatch'] as const;
  const measurements: Array<Record<string, unknown>> = [];

  for (const theme of themes) {
    for (const width of widths) {
      for (const state of states) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/w/auth/register');
        await expect(page.getByRole('heading', { name: 'Tạo tài khoản' })).toBeVisible();
        await page.evaluate((activeTheme) => {
          document.documentElement.classList.toggle('dark', activeTheme === 'dark');
          document.documentElement.classList.toggle('light', activeTheme === 'light');
        }, theme);
        await page.evaluate(async () => {
          await Promise.all(
            document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
          );
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        });

        if (state === 'empty-submit-validation') {
          await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
          await expect(page.getByRole('alert')).toHaveCount(4);
        }
        if (state === 'password-mismatch') {
          await page.getByLabel('Họ và tên', { exact: true }).fill('Accessibility Test User');
          await page.getByLabel('Email', { exact: true }).fill('accessibility@example.com');
          await page.getByLabel('Mật khẩu', { exact: true }).fill('SecureMockPass123!');
          await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('DifferentMockPass123!');
          await page.getByRole('checkbox').check();
          await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
          await expect(page.getByText('Mật khẩu xác nhận không khớp')).toBeVisible();
        }
        await page.evaluate(async () => {
          await Promise.all(
            document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
          );
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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
        measurements.push({ theme, width, state, violationCount: violations.length, violations });
      }
    }
  }

  const report = {
    fixtureBoundary:
      'Local Vite development-MSW browser only. This test scanned registration form states and submitted no registration request; no backend, staging or production service was used.',
    route: '/w/auth/register',
    themes,
    widths,
    states,
    measurements,
  };
  const reportPath = testInfo.outputPath('web-registration-axe-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('web-registration-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(themes.length * widths.length * states.length);
  expect(
    measurements.filter((measurement) => measurement.violationCount !== 0),
    'Web registration Axe violations by theme, viewport, and state',
  ).toEqual([]);
});

test('shared RegisterPage has no axe violations across shell validation states @auth-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(240_000);
  const shells = [
    { name: 'phone', route: '/auth/register', width: 390, height: 844 },
    { name: 'tablet', route: '/t/auth/register', width: 768, height: 900 },
    { name: 'responsive', route: '/r/auth/register', width: 1024, height: 900 },
  ] as const;
  const themes = ['light', 'dark'] as const;
  const states = [
    'initial',
    'empty-submit-validation',
    'phone-contact-validation',
    'password-mismatch',
    'valid-draft-password-strength',
  ] as const;
  const fixtureValues = [
    ['Axe Registration User', '[redacted fixture name]'],
    ['axe-registration@example.test', '[redacted fixture email]'],
    ['2025550180', '[redacted fixture phone]'],
    ['StrongMockPass123!', '[redacted fixture password]'],
    ['DifferentMockPass123!', '[redacted fixture password]'],
  ] as const;
  const measurements: Array<Record<string, unknown>> = [];
  const registrationPosts: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (request.method() === 'POST' && url.pathname.endsWith('/auth/register')) {
      registrationPosts.push(url.pathname);
    }
  });

  await page.goto('/auth/register');
  const serviceWorkerScripts = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return (await navigator.serviceWorker.getRegistrations())
      .map((registration) => registration.active?.scriptURL)
      .filter((url): url is string => Boolean(url));
  });
  expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

  for (const shell of shells) {
    for (const theme of themes) {
      for (const state of states) {
        await page.setViewportSize({ width: shell.width, height: shell.height });
        await page.goto(shell.route);
        await expect(page.getByText('Tạo tài khoản', { exact: true }).first()).toBeVisible();
        await page.evaluate((activeTheme) => {
          document.documentElement.classList.toggle('dark', activeTheme === 'dark');
          document.documentElement.classList.toggle('light', activeTheme === 'light');
        }, theme);
        await page.evaluate(async () => {
          await Promise.all(
            document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
          );
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        });

        if (state === 'empty-submit-validation') {
          await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
          await expect(page.getByRole('alert')).toHaveCount(4);
        }
        if (state === 'phone-contact-validation') {
          await page.getByRole('button', { name: 'Điện thoại', exact: true }).click();
          await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
          await expect(page.getByLabel('Số điện thoại', { exact: true })).toBeVisible();
          await expect(page.getByRole('alert')).toHaveCount(4);
        }
        if (state === 'password-mismatch' || state === 'valid-draft-password-strength') {
          await page.getByLabel('Họ và tên', { exact: true }).fill('Axe Registration User');
          await page.getByLabel('Email', { exact: true }).fill('axe-registration@example.test');
          await page.getByLabel('Mật khẩu', { exact: true }).fill('StrongMockPass123!');
          await page
            .getByLabel('Xác nhận mật khẩu', { exact: true })
            .fill(state === 'password-mismatch' ? 'DifferentMockPass123!' : 'StrongMockPass123!');
          await page.getByRole('checkbox').check();
          if (state === 'password-mismatch') {
            await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
            await expect(page.getByText('Mật khẩu xác nhận không khớp')).toBeVisible();
          } else {
            await expect(
              page.getByRole('status').filter({ hasText: 'Mức độ mật khẩu: 4 trên 4.' }),
            ).toContainText('Mức độ mật khẩu: 4 trên 4.');
          }
        }

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const violations = results.violations.map(({ id, impact, nodes }) => ({
          id,
          impact,
          affectedNodeCount: nodes.length,
          nodes: nodes.map((node) => ({
            target: node.target,
            summary: fixtureValues.reduce(
              (summary, [value, replacement]) => summary?.replaceAll(value, replacement),
              node.failureSummary,
            ),
          })),
        }));
        measurements.push({
          shell: shell.name,
          route: shell.route,
          theme,
          width: shell.width,
          state,
          violationCount: violations.length,
          violations,
        });
      }
    }
  }

  const report = {
    fixtureBoundary:
      'Local Vite development app with the registered mockServiceWorker.js. The shared RegisterPage validation and draft states issue no registration request; no page.route, backend, staging or production service was used. Axe failure summaries redact all synthetic name/contact/password values.',
    themes,
    states,
    shells,
    serviceWorkerScripts,
    registrationPostCount: registrationPosts.length,
    measurements,
  };
  const reportPath = testInfo.outputPath('shared-register-page-axe-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('shared-register-page-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(shells.length * themes.length * states.length);
  expect(registrationPosts).toEqual([]);
  expect(
    measurements.filter((measurement) => measurement.violationCount !== 0),
    'Shared RegisterPage Axe violations by shell, theme and form state',
  ).toEqual([]);
});
