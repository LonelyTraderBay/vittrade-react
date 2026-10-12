import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';
import { resolve } from 'node:path';

process.env.VITE_DATA_SOURCE = 'mock';
process.env.VITE_API_BASE_URL = '';
process.env.VITE_WS_URL = '';

const root = process.cwd();
const evidenceDir = resolve(root, 'docs/architecture/production-readiness/evidence/U01');
const reportRelativePath =
  'docs/architecture/production-readiness/evidence/U01/u01-03-auth-dev-preview-2026-10-03.json';
const screenshotNames = [
  'u01-03-auth-login-preview.png',
  'u01-03-auth-mfa-challenge-preview.png',
  'u01-03-auth-mfa-invalid-preview.png',
  'u01-03-auth-mfa-authenticated-preview.png',
  'u01-03-auth-session-reload-preview.png',
  'u01-03-auth-locked-preview.png',
];
const sourcePaths = [
  'contracts/openapi/auth.yaml',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/features/auth/api/auth-api.ts',
  'src/features/auth/pages/WebLoginPage.tsx',
  'src/features/auth/pages/WebOTPPage.tsx',
  'src/shared/session/AuthContext.tsx',
  'tests/e2e/auth-session.spec.ts',
  'docs/architecture/production-readiness/evidence/U01/run-u01-03-auth-dev-preview.mjs',
];
const server = await createServer({
  configFile: resolve(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 0 },
  clearScreen: false,
});
let browser;

try {
  await server.listen();
  const baseUrl = server.resolvedUrls?.local?.[0];
  assert.ok(baseUrl, 'Vite must expose a local preview URL');

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  const authResponses = [];
  const apiResponses = [];
  const failedApiRequests = [];

  const observe = (observedPage) => {
    observedPage.on('pageerror', (error) => pageErrors.push(error.message));
    observedPage.on('requestfailed', (request) => {
      const url = new URL(request.url());
      if (url.pathname.startsWith('/api/')) {
        failedApiRequests.push({ method: request.method(), path: url.pathname });
      }
    });
    observedPage.on('response', async (response) => {
      const url = new URL(response.url());
      if (!url.pathname.startsWith('/api/')) return;
      const observed = {
        method: response.request().method(),
        path: url.pathname,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      };
      apiResponses.push(observed);
      if (url.pathname.startsWith('/api/auth/')) authResponses.push(observed);
    });
  };
  observe(page);

  await page.goto(new URL('/w/auth/login', baseUrl).href, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('auth-email')).toBeVisible();
  await page.screenshot({ path: resolve(evidenceDir, 'u01-03-auth-login-preview.png') });

  await page.getByTestId('auth-email').fill('mfa@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect(page).toHaveURL(/\/w\/auth\/otp$/);
  await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  await expect(page.getByText('m*••@vittrade.local', { exact: true })).toBeVisible();
  await page.screenshot({ path: resolve(evidenceDir, 'u01-03-auth-mfa-challenge-preview.png') });

  const otpInputs = page.locator('input[maxlength="1"]');
  await expect(otpInputs).toHaveCount(6);
  for (const [index, digit] of [...'000000'].entries()) {
    await otpInputs.nth(index).fill(digit);
  }
  await expect(page.getByText('Mã xác thực không đúng. Vui lòng kiểm tra lại.')).toBeVisible();
  await expect(page).toHaveURL(/\/w\/auth\/otp$/);
  await page.screenshot({ path: resolve(evidenceDir, 'u01-03-auth-mfa-invalid-preview.png') });

  for (const [index, digit] of [...'123456'].entries()) {
    await otpInputs.nth(index).fill(digit);
  }
  await expect(page).toHaveURL(/\/w\/home$/, { timeout: 10_000 });
  await page.screenshot({
    path: resolve(evidenceDir, 'u01-03-auth-mfa-authenticated-preview.png'),
  });

  const sessionAfterReload = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === '/api/auth/session' && response.request().method() === 'GET';
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  const reloadSessionResponse = await sessionAfterReload;
  assert.ok([200, 401].includes(reloadSessionResponse.status()));
  if (reloadSessionResponse.status() === 401) {
    await expect(page.getByRole('button', { name: /Chưa đăng nhập/ }).first()).toBeVisible();
    await expect(page.getByTestId('auth-sign-out')).toHaveCount(0);
  }
  await page.screenshot({
    path: resolve(evidenceDir, 'u01-03-auth-session-reload-preview.png'),
  });

  const lockedContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lockedPage = await lockedContext.newPage();
  observe(lockedPage);
  await lockedPage.goto(new URL('/w/auth/login', baseUrl).href, {
    waitUntil: 'domcontentloaded',
  });
  await lockedPage.getByTestId('auth-email').fill('locked@vittrade.local');
  await lockedPage.getByTestId('auth-password').fill('Preview-123!');
  await lockedPage.getByTestId('auth-submit').click();
  await expect(lockedPage).toHaveURL(/\/w\/auth\/account-locked$/);
  await expect(lockedPage.getByRole('heading', { name: 'Tài khoản tạm khóa' })).toBeVisible();
  await expect(lockedPage.getByTestId('auth-sign-out')).toHaveCount(0);
  await lockedPage.screenshot({ path: resolve(evidenceDir, 'u01-03-auth-locked-preview.png') });

  assert.deepEqual(pageErrors, [], 'the Auth preview must not raise page errors');
  assert.deepEqual(
    failedApiRequests,
    [],
    'the preview must not leave application API requests unmatched',
  );
  const observedAuthResponses = authResponses.map(
    ({ method, path, status }) => `${method} ${path} ${status}`,
  );
  for (const expectedResponse of [
    'GET /api/auth/session 401',
    'POST /api/auth/login 200',
    'POST /api/auth/login/mfa/verify 400',
    'POST /api/auth/login/mfa/verify 200',
    'POST /api/auth/login 423',
  ]) {
    assert.ok(
      observedAuthResponses.includes(expectedResponse),
      `missing MSW response: ${expectedResponse}`,
    );
  }
  assert.ok(
    authResponses.every((response) => response.fromServiceWorker),
    'every Auth API response must come from the development service worker',
  );
  assert.ok(
    apiResponses.every((response) => response.fromServiceWorker),
    'every observed application API response must come from the development service worker',
  );

  const tracking = JSON.parse(
    await readFile(resolve(root, 'docs/architecture/production-readiness/TRACKING.json'), 'utf8'),
  );
  const stepScopePaths = tracking.files
    .filter((file) => file.executionScope?.stepIds?.includes('U01.03'))
    .map((file) => file.path);
  const generatedOutputPaths = [
    reportRelativePath,
    ...screenshotNames.map(
      (name) => `${reportRelativePath.slice(0, reportRelativePath.lastIndexOf('/') + 1)}${name}`,
    ),
  ];
  const plannedInputPaths = stepScopePaths.filter((path) => !generatedOutputPaths.includes(path));
  const sourceHashes = Object.fromEntries(
    await Promise.all(
      sourcePaths.map(async (path) => [
        path,
        createHash('sha256')
          .update(await readFile(resolve(root, path)))
          .digest('hex'),
      ]),
    ),
  );
  const localDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Vientiane',
  }).format(new Date());
  assert.equal(localDate, '2026-10-03', 'Rename this evidence artifact on a later local date');
  const evidence = {
    schemaVersion: 1,
    id: 'EV-20261003-002',
    taskId: 'U01',
    stepId: 'U01.03',
    kind: 'shared-auth-development-msw-browser-preview',
    observedAt: new Date().toISOString(),
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    sourceBranch: execFileSync('git', ['branch', '--show-current'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    environment: `Windows; Node ${process.version}; Chromium ${browser.version()}; Vite development build with VITE_DATA_SOURCE=mock; loopback browser only.`,
    expected:
      'Use the shared Auth development personas to observe guest, MFA-required, invalid-code, authenticated, and locked states in Chromium. Exercise the login MFA 429 response only through the separate contract-backed API-mode browser case; do not use a guest registration verification fixture while security semantics remain unresolved.',
    actual: `Chromium opened ${baseUrl}. The shared mfa persona returned login 200 then verify 400 for the invalid code and 200 for 123456. A full-page reload then returned GET /api/auth/session ${reloadSessionResponse.status()}, and the UI showed the resulting session state. A fresh browser context using the shared locked persona returned login 423. All ${apiResponses.length} observed application API responses and all ${authResponses.length} Auth API responses came from MSW's service worker; ${failedApiRequests.length} application API requests failed and ${pageErrors.length} page errors occurred.`,
    result: 'pass',
    artifact: reportRelativePath,
    plannedInputPaths,
    reviewedInputPaths: sourcePaths,
    generatedOutputPaths,
    resultingStepScopePaths: stepScopePaths.length,
    sourceHashes,
    browser: {
      baseUrl,
      version: browser.version(),
      viewport: { width: 1440, height: 900 },
      scenarios: [
        'guest login page rendered',
        'mfa persona issued a login challenge without creating a session before verification',
        'invalid code returned HTTP 400 and remained on OTP',
        'valid code returned HTTP 200 and navigated to /w/home',
        `full-page reload returned HTTP ${reloadSessionResponse.status()} from GET /auth/session`,
        'locked persona returned HTTP 423 and rendered the account-locked page',
      ],
      apiResponses,
      authResponses,
      failedApiRequests,
      pageErrors,
      screenshots: screenshotNames.map(
        (name) => `docs/architecture/production-readiness/evidence/U01/${name}`,
      ),
    },
    findings: [
      {
        severity: 'P1',
        kind: 'security_contract_conflict',
        operationId: 'verifyMfa',
        disposition:
          'Do not add guest purpose=register verification until the API/security owner resolves inherited sessionCookie semantics.',
      },
      {
        severity: 'P2',
        kind: 'development_mock_session_reload_limit',
        sourceEvidence: `The shared MSW preview returned GET /api/auth/session ${reloadSessionResponse.status()} after a full document reload; the real cookie-backed session behavior remains unverified.`,
        disposition:
          'Keep this as local mock evidence. Do not add browser storage to simulate the backend session cookie.',
      },
    ],
    externalEvidence: {
      backendRequests: 0,
      stagingRequests: 0,
      browserRoutesOpened: ['/w/auth/login', '/w/auth/otp', '/w/home', '/w/auth/account-locked'],
      userAcceptance: 'not performed',
      backendOwnerAssignmentsFound: 0,
    },
    notes:
      'MSW preview and API-mode Playwright tests validate frontend behavior only. The login MFA 429 case is a separate status-only HTTP response test. Registration verification remains held; no backend, staging, cookie persistence or user acceptance is certified.',
  };
  await writeFile(resolve(root, reportRelativePath), `${JSON.stringify(evidence, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        reportPath: reportRelativePath,
        baseUrl,
        browserVersion: browser.version(),
        screenshots: screenshotNames,
        scenarios: [
          'guest login page rendered',
          'shared mfa persona issued login challenge without authenticating',
          'shared login challenge rejected an invalid code and stayed on OTP',
          'the same challenge accepted its valid code and authenticated',
          `full-page reload returned HTTP ${reloadSessionResponse.status()} for the session contract`,
          'shared locked persona in a fresh browser context routed to the account-locked page',
        ],
        pageErrors,
        failedApiRequests,
        apiResponses,
        authResponses,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await server.close();
}
