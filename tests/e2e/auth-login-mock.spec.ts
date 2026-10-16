import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

test('login uses the real development MSW handler across shells @auth-login-mock', async ({
  page,
}, testInfo) => {
  const shells = [
    { name: 'phone', route: '/auth/login', width: 390, height: 844, prefix: '' },
    { name: 'tablet', route: '/t/auth/login', width: 768, height: 900, prefix: '/t' },
    {
      name: 'responsive',
      route: '/r/auth/login',
      width: 1024,
      height: 900,
      prefix: '/r',
    },
    { name: 'web', route: '/w/auth/login', width: 1440, height: 900, prefix: '/w' },
  ];
  const observations: Array<Record<string, unknown>> = [];
  const screenshots: string[] = [];

  for (const shell of shells) {
    await page.setViewportSize({ width: shell.width, height: shell.height });
    await page.goto(shell.route);
    await expect(page.getByTestId('auth-email')).toBeVisible();

    const serviceWorkerScripts = await page.evaluate(async () =>
      (await navigator.serviceWorker.getRegistrations())
        .map((registration) => registration.active?.scriptURL)
        .filter((url): url is string => Boolean(url)),
    );
    expect(serviceWorkerScripts.some((url) => url.endsWith('/mockServiceWorker.js'))).toBe(true);

    const loginRequests: string[] = [];
    const authRequests: string[] = [];
    const requestFailures: string[] = [];
    const trackRequest = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (
        request.method() === 'POST' &&
        (url.pathname.endsWith('/auth/login') || url.pathname.endsWith('/auth/login/mfa/verify'))
      ) {
        authRequests.push(url.pathname);
      }
      if (request.method() === 'POST' && url.pathname.endsWith('/auth/login')) {
        loginRequests.push(url.pathname);
      }
    };
    const trackFailure = (request: import('@playwright/test').Request) => {
      const url = new URL(request.url());
      if (request.method() === 'POST' && url.pathname.endsWith('/auth/login')) {
        requestFailures.push(request.failure()?.errorText ?? 'request failed');
      }
    };
    page.on('request', trackRequest);
    page.on('requestfailed', trackFailure);

    const email = page.getByTestId('auth-email');
    const password = page.getByTestId('auth-password');
    const submit = page.getByTestId('auth-submit');
    await submit.click();
    await expect(page.getByText('Vui lòng nhập email.', { exact: true })).toBeVisible();
    expect(loginRequests).toHaveLength(0);
    const validationScreenshot = testInfo.outputPath(
      `login-${shell.name}-${shell.width}x${shell.height}-validation.png`,
    );
    await page.screenshot({ path: validationScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(validationScreenshot);

    await email.fill('mfa@vittrade.local');
    await password.fill('Preview-123!');
    await expect(email).toHaveValue('mfa@vittrade.local');
    const previewControls = page.getByTestId('dev-preview-controls');
    expect(await previewControls.evaluate((element) => getComputedStyle(element).position)).toBe(
      'static',
    );
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
      `login-${shell.name}-${shell.width}x${shell.height}-populated.png`,
    );
    await page.screenshot({ path: populatedScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(populatedScreenshot);

    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
    await page.getByLabel('Miền API').selectOption('auth');
    await page.getByLabel('Trạng thái phản hồi').selectOption('error');
    await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
    await expect(page.getByTestId('active-preview-scenario')).toContainText('auth.error');
    await page.getByRole('button', { name: 'Thu gọn' }).click();

    await submit.click();
    await expect.poll(() => requestFailures.length).toBe(1);
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(email).toHaveValue('mfa@vittrade.local');
    expect(loginRequests).toHaveLength(1);
    expect(new URL(page.url()).pathname).toBe(shell.route);
    const transportScreenshot = testInfo.outputPath(
      `login-${shell.name}-${shell.width}x${shell.height}-transport-error.png`,
    );
    await page.screenshot({ path: transportScreenshot, fullPage: true, animations: 'disabled' });
    screenshots.push(transportScreenshot);

    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
    await page.getByRole('button', { name: 'Tắt trạng thái API' }).click();
    await expect(page.getByTestId('active-preview-scenario')).toHaveCount(0);
    await page.getByRole('button', { name: 'Thu gọn' }).click();
    await expect(email).toHaveValue('mfa@vittrade.local');

    await password.fill('incorrect-preview-password');
    const invalidCredentialsPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login') &&
        response.status() === 401,
    );
    await submit.click();
    const invalidCredentialsResponse = await invalidCredentialsPromise;
    await expect(page.getByRole('alert')).toHaveText(
      'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.',
    );
    expect(loginRequests).toHaveLength(2);
    expect(invalidCredentialsResponse.status()).toBe(401);
    await expect(email).toHaveValue('mfa@vittrade.local');
    expect(new URL(page.url()).pathname).toBe(shell.route);
    const invalidCredentialsScreenshot = testInfo.outputPath(
      `login-${shell.name}-${shell.width}x${shell.height}-invalid-credentials.png`,
    );
    await page.screenshot({
      path: invalidCredentialsScreenshot,
      fullPage: true,
      animations: 'disabled',
    });
    screenshots.push(invalidCredentialsScreenshot);

    // Start the independent MFA scenario from a clean guest form after the 401 flow.
    await page.goto(shell.route);
    await expect(email).toBeVisible();
    await email.fill('mfa@vittrade.local');
    await password.fill('Preview-123!');
    await expect(email).toHaveValue('mfa@vittrade.local');
    const mfaRequiredPromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname.endsWith('/auth/login') &&
        response.status() === 200,
    );
    await submit.click();
    const mfaRequiredResponse = await mfaRequiredPromise;
    const result = (await mfaRequiredResponse.json()) as {
      status: string;
      challenge: { id: string; method: string; maskedDestination: string; expiresAt: string };
    };
    await expect(page).toHaveURL(new RegExp(`${shell.prefix}/auth/otp$`));
    await expect(page.getByRole('group', { name: 'Mã xác thực gồm 6 chữ số' })).toBeVisible();
    const maskedDestination = page.getByText(/@vittrade\.local/).first();
    await expect(maskedDestination).toBeVisible();
    expect(await maskedDestination.textContent()).not.toBe('mfa@vittrade.local');
    expect(result).toMatchObject({
      status: 'mfa_required',
      challenge: {
        id: expect.stringMatching(/^dev-login-mfa-/),
        method: 'email',
        maskedDestination: 'm***@vittrade.local',
      },
    });
    expect(loginRequests).toHaveLength(3);
    expect(loginRequests).toEqual(['/api/auth/login', '/api/auth/login', '/api/auth/login']);
    expect(requestFailures).toHaveLength(1);
    const verificationRequests = authRequests.filter((pathname) =>
      pathname.endsWith('/auth/login/mfa/verify'),
    );
    expect(verificationRequests).toHaveLength(0);
    const challengeScreenshot = testInfo.outputPath(
      `login-${shell.name}-${shell.width}x${shell.height}-mfa-challenge.png`,
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
      emptyValidationRequests: 0,
      loginResponses: [
        { status: 'transport failure', source: 'local auth.error preview scenario' },
        {
          status: invalidCredentialsResponse.status(),
          source: 'local handlers.ts invalid credentials',
        },
        { status: mfaRequiredResponse.status(), source: 'local handlers.ts MFA persona' },
      ],
      loginRequestCount: loginRequests.length,
      failedRequestCount: requestFailures.length,
      loginChallengeIdPrefix: 'dev-login-mfa-',
      destinationRoute: `${shell.prefix}/auth/otp`,
      verifyMfaRequests: verificationRequests.length,
      documentWidth,
      previewPosition: 'static',
      previewOverlapsSubmit: overlapsSubmit,
      screenshots: [
        validationScreenshot,
        populatedScreenshot,
        transportScreenshot,
        invalidCredentialsScreenshot,
        challengeScreenshot,
      ],
    });
    page.removeListener('request', trackRequest);
    page.removeListener('requestfailed', trackFailure);
  }

  const report = {
    fixtureBoundary:
      'Vite dev uses VITE_DATA_SOURCE=mock and the registered mockServiceWorker.js. No page.route interception, live API, backend or staging request was used. auth.error is a local transport-failure scenario; normal handlers.ts returns contract-declared HTTP 401 for invalid credentials and 200 mfa_required for the MFA persona. No OTP verification request is sent.',
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
  const reportPath = testInfo.outputPath('login-development-msw.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('login-development-msw.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(observations).toHaveLength(shells.length);
});

test('Web login has no axe violations in settled light and dark states @auth-login-mock', async ({
  page,
}, testInfo) => {
  const themes = ['light', 'dark'] as const;
  const widths = [320, 1440];
  test.setTimeout(60_000);
  const states = ['initial', 'empty-submit-validation', 'invalid-email-blur'] as const;
  const measurements: Array<Record<string, unknown>> = [];

  for (const theme of themes) {
    for (const width of widths) {
      for (const state of states) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/w/auth/login');
        await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
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

        if (state === 'empty-submit-validation') {
          await page.getByTestId('auth-submit').click();
          await expect(page.getByRole('alert')).toHaveText('Vui lòng nhập email.');
        }
        if (state === 'invalid-email-blur') {
          const email = page.getByTestId('auth-email');
          await email.fill('invalid-email');
          await email.blur();
          await expect(email).toHaveAttribute('aria-invalid', 'true');
          await expect(email).toHaveAccessibleDescription('Định dạng email không hợp lệ');
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
            summary: node.failureSummary,
          })),
        }));

        measurements.push({ theme, width, state, violationCount: violations.length, violations });
      }
    }
  }

  const report = {
    fixtureBoundary:
      'Local Vite development MSW browser only. Axe ran on Web login initial and client-validation states; no live API, backend, staging, screen reader or physical device was used.',
    routes: ['/w/auth/login'],
    themes,
    widths,
    states,
    measurements,
  };
  const reportPath = testInfo.outputPath('web-login-axe-report.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('web-login-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(themes.length * widths.length * states.length);
  expect(
    measurements.filter((measurement) => measurement.violationCount !== 0),
    'Web login Axe violations by theme, viewport, and state',
  ).toEqual([]);
});

test('LoginPage shared shells pass light/dark Axe states @auth-login-mock', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const shells = [
    { name: 'phone', route: '/auth/login', width: 390 },
    { name: 'tablet', route: '/t/auth/login', width: 768 },
    { name: 'responsive', route: '/r/auth/login', width: 1024 },
    { name: 'responsive-wide', route: '/r/auth/login', width: 1440 },
  ];
  const themes = ['light', 'dark'] as const;
  const states = [
    'initial',
    'empty-submit-validation',
    'invalid-email-validation',
    'invalid-credentials-401',
  ] as const;
  const measurements: Array<Record<string, unknown>> = [];

  for (const shell of shells) {
    for (const theme of themes) {
      for (const state of states) {
        await page.setViewportSize({ width: shell.width, height: 900 });
        await page.goto(shell.route);
        await expect(page.getByRole('heading', { name: 'VitTrade' })).toBeVisible();
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

        if (state === 'empty-submit-validation') {
          await page.getByTestId('auth-submit').click();
          await expect(page.getByText('Vui lòng nhập email.', { exact: true })).toBeVisible();
        }
        if (state === 'invalid-email-validation') {
          const email = page.getByTestId('auth-email');
          await email.fill('invalid-email');
          await page.getByTestId('auth-password').fill('Preview-123!');
          await page.getByTestId('auth-submit').click();
          await expect(
            page.getByText('Định dạng email không hợp lệ', { exact: true }),
          ).toBeVisible();
          const tokenBorderColor = await email.evaluate((element) => {
            const wrapper = element.parentElement;
            if (!wrapper) throw new Error('Email input has no shared field wrapper.');

            const probe = document.createElement('div');
            probe.style.cssText =
              'position: fixed; visibility: hidden; border-top: 1.5px solid var(--input-border-error)';
            wrapper.append(probe);
            const tokenBorderColor = getComputedStyle(probe).borderTopColor;
            probe.remove();

            return tokenBorderColor;
          });
          await expect
            .poll(() =>
              email.evaluate((element) => {
                if (!element.parentElement)
                  throw new Error('Email input has no shared field wrapper.');
                return getComputedStyle(element.parentElement).borderTopColor;
              }),
            )
            .toBe(tokenBorderColor);
        }
        if (state === 'invalid-credentials-401') {
          await page.getByTestId('auth-email').fill('mfa@vittrade.local');
          await page.getByTestId('auth-password').fill('incorrect-preview-password');
          const responsePromise = page.waitForResponse(
            (response) =>
              response.request().method() === 'POST' &&
              new URL(response.url()).pathname.endsWith('/auth/login') &&
              response.status() === 401,
          );
          await page.getByTestId('auth-submit').click();
          expect((await responsePromise).status()).toBe(401);
          await expect(page.getByRole('alert')).toHaveText(
            'Đăng nhập thất bại. Vui lòng kiểm tra thông tin và thử lại.',
          );
        }

        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const entry = {
          shell: shell.name,
          route: shell.route,
          viewportWidth: shell.width,
          theme,
          state,
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
          testInfo.outputPath('login-page-shared-axe-report.json'),
          `${JSON.stringify(measurements, null, 2)}\n`,
        );
        expect(result.violations, `Axe violations for ${shell.name} ${theme} ${state}`).toEqual([]);
      }
    }
  }

  const reportPath = testInfo.outputPath('login-page-shared-axe-report.json');
  await testInfo.attach('login-page-shared-axe-report.json', {
    path: reportPath,
    contentType: 'application/json',
  });
  expect(measurements).toHaveLength(shells.length * themes.length * states.length);
});
