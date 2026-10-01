import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const originUrl = new URL(origin);
assert(
  ['localhost', '127.0.0.1', '[::1]'].includes(originUrl.hostname),
  'Preview must use loopback.',
);

const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const reportPath = path.join(evidenceDirectory, 'wallet-success-browser-check-2026-10-02.json');
const screenshotPath = path.join(evidenceDirectory, 'preview-wallet-success-2026-10-02.png');
const sourcePaths = [
  'contracts/openapi/wallet.yaml',
  'src/app/routes.ts',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/wallet/api/wallet-api.ts',
  'src/features/wallet/model/wallet-queries.ts',
  'src/features/wallet/model/wallet-types.ts',
  'src/features/wallet/pages/WalletOverviewContractPage.tsx',
  'src/features/wallet/pages/WalletOverviewContractPage.test.tsx',
  'src/features/wallet/routes.ts',
  'src/shared/api/app-client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/navigation/useRoutePrefix.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/session/useAuth.ts',
  'src/shared/ui/layout/Header.tsx',
  'src/shared/ui/layout/PageContent.tsx',
  'src/shared/ui/layout/PageLayout.tsx',
  'docs/architecture/production-readiness/evidence/A06/run-wallet-success-browser-check.mjs',
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);

const apiRequests = [];
const apiResponses = [];
const allApiRequests = [];
const externalApiOrigins = new Set();
const pageErrors = [];

page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('request', (request) => {
  const url = new URL(request.url());
  const isApi =
    url.pathname.startsWith('/api/') || request.headers().accept?.includes('application/json');
  if (url.protocol.startsWith('http') && url.origin !== origin && isApi) {
    externalApiOrigins.add(url.origin);
  }
  if (url.pathname.startsWith('/api/')) {
    allApiRequests.push({ method: request.method(), path: url.pathname });
  }
  if (url.pathname.startsWith('/api/wallet/')) {
    apiRequests.push({ method: request.method(), path: url.pathname });
  }
});
page.on('response', (response) => {
  const url = new URL(response.url());
  if (url.pathname.startsWith('/api/')) {
    apiResponses.push({
      method: response.request().method(),
      path: url.pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  }
});

try {
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');

  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.success').waitFor();

  const assetsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/assets') &&
      response.request().method() === 'GET',
  );
  const transactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transactions') &&
      response.request().method() === 'GET',
  );
  const startedAt = Date.now();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/wallet');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL((url) => url.pathname === '/w/wallet');
  let assetsResponse;
  let transactionsResponse;
  try {
    [assetsResponse, transactionsResponse] = await Promise.all([
      assetsResponsePromise,
      transactionsResponsePromise,
    ]);
  } catch (error) {
    const diagnostics = {
      url: page.url(),
      text: (
        await page
          .locator('body')
          .innerText()
          .catch(() => '')
      ).slice(0, 2500),
      allApiRequests,
      apiRequests,
      apiResponses,
      externalApiOrigins: [...externalApiOrigins],
      pageErrors,
      serviceWorkerControlled: await page
        .evaluate(() => Boolean(navigator.serviceWorker.controller))
        .catch(() => false),
    };
    process.stderr.write(`${JSON.stringify({ diagnostics }, null, 2)}\n`);
    throw error;
  }
  const [assetsPayload, transactionsPayload] = await Promise.all([
    assetsResponse.json(),
    transactionsResponse.json(),
  ]);

  await page.getByText('Total balance', { exact: true }).waitFor();
  await page.getByText('$16,754.32', { exact: true }).first().waitFor();
  await page.getByText('Recent activity', { exact: true }).waitFor();
  await page.waitForTimeout(150);

  const screenshotRoute = new URL(page.url()).pathname;
  const ui = {
    totalBalanceVisible: (await page.getByText('$16,754.32', { exact: true }).count()) > 0,
    recentActivityVisible: (await page.getByText('Recent activity', { exact: true }).count()) === 1,
    depositVisible:
      (await page.getByRole('button', { name: 'Deposit', exact: true }).count()) === 1,
    transactionHistoryVisible:
      (await page.getByRole('button', { name: 'Transaction history', exact: true }).count()) === 1,
    withdrawVisible:
      (await page.getByRole('button', { name: 'Withdraw', exact: true }).count()) > 0,
    transferVisible:
      (await page.getByRole('button', { name: 'Transfer', exact: true }).count()) > 0,
    errorVisible: (await page.getByText('Unable to load wallet', { exact: true }).count()) > 0,
  };

  assert.equal(screenshotRoute, '/w/wallet');
  assert.equal(assetsResponse.status(), 200);
  assert.equal(transactionsResponse.status(), 200);
  assert.equal(assetsResponse.fromServiceWorker(), true);
  assert.equal(transactionsResponse.fromServiceWorker(), true);
  assert.equal(assetsPayload.summary.totalUsd, 16_754.32);
  assert.equal(transactionsPayload.items.length, 6);
  apiRequests.sort((left, right) => left.path.localeCompare(right.path));
  assert.deepEqual(apiRequests, [
    { method: 'GET', path: '/api/wallet/assets' },
    { method: 'GET', path: '/api/wallet/transactions' },
  ]);
  assert.equal(
    apiRequests.some((request) => request.method !== 'GET'),
    false,
  );
  assert.equal(externalApiOrigins.size, 0);
  assert.equal(
    apiResponses.every((response) => response.fromServiceWorker),
    true,
  );
  assert.deepEqual(pageErrors, []);
  assert.equal(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), true);
  assert.deepEqual(ui, {
    totalBalanceVisible: true,
    recentActivityVisible: true,
    depositVisible: true,
    transactionHistoryVisible: true,
    withdrawVisible: false,
    transferVisible: false,
    errorVisible: false,
  });

  await page.getByRole('button', { name: 'Thu gọn', exact: true }).click();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  const sourceHashes = Object.fromEntries(
    sourcePaths.map((sourcePath) => {
      const bytes = fsSync.readFileSync(sourcePath);
      return [sourcePath, crypto.createHash('sha256').update(bytes).digest('hex')];
    }),
  );
  const sourceHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const report = {
    schemaVersion: 1,
    checkedAt: new Date().toISOString(),
    sourceHead,
    sourceHashes,
    origin,
    route: screenshotRoute,
    viewport: { width: 1440, height: 900 },
    persona: { id: 'developer', permissions: ['wallet:read'] },
    scenario: {
      id: 'wallet.success',
      status: 'passed',
      operationIds: ['getWalletAssets', 'getWalletTransactions'],
      expectedOperationCount: 19,
      observedOperationCount: 2,
      observedOperationIds: ['getWalletAssets', 'getWalletTransactions'],
      elapsedMs: Date.now() - startedAt,
    },
    requests: apiRequests.map((request) => ({
      operationId:
        request.path === '/api/wallet/assets' ? 'getWalletAssets' : 'getWalletTransactions',
      ...request,
      status: apiResponses.find((response) => response.path === request.path)?.status ?? null,
      fromServiceWorker:
        apiResponses.find((response) => response.path === request.path)?.fromServiceWorker ?? false,
    })),
    responseData: {
      totalUsd: assetsPayload.summary.totalUsd,
      assetCount: assetsPayload.items.length,
      transactionCount: transactionsPayload.items.length,
    },
    ui,
    pageErrors,
    fixtureBoundary: {
      serviceWorkerControlled: true,
      allObservedResponsesFromServiceWorker:
        apiResponses.length > 0 && apiResponses.every((item) => item.fromServiceWorker),
      externalApiOrigins: [...externalApiOrigins],
      realBackendRequestSent: false,
      writesSent: apiRequests.filter((request) => request.method !== 'GET').length,
    },
    screenshots: [path.basename(screenshotPath)],
    notes:
      'Representative local MSW read evidence only: Developer can read Wallet but has no write permissions. Two of 19 linked operations were observed; address book, analytics, dust conversion, networks, transfer and withdrawal flows were not exercised.',
  };
  const options = (await prettier.resolveConfig(reportPath)) ?? {};
  const content = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
    ...options,
    parser: 'json',
  });
  await fs.writeFile(reportPath, content);
  process.stdout.write(
    `${JSON.stringify({ reportPath, screenshotPath, sourceHead, apiRequests: apiRequests.length, observedOperations: report.scenario.observedOperationIds, elapsedMs: report.scenario.elapsedMs, totalUsd: report.responseData.totalUsd, transactionCount: report.responseData.transactionCount, serviceWorkerResponses: apiResponses.length, externalApiOrigins: externalApiOrigins.size }, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
