import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

type RoleFlagCoverage = {
  status: string;
  personaId: string;
  expectedAccess: 'allow' | 'deny';
  requiredPermissions: string[];
  requiredRoles?: string[];
  featureFlags: { key: string; defaultEnabled: boolean }[];
};

type TrackedRoute = {
  id: string;
  lifecycle: string;
  path: string;
  resolvedUrls: string[];
  c06Coverage?: { roleAndFeatureFlags?: RoleFlagCoverage };
};

const tracking = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'docs/architecture/production-readiness/TRACKING.json'),
    'utf8',
  ),
) as { routes: TrackedRoute[] };

const developerRoutes = tracking.routes.filter(
  (route) =>
    route.lifecycle === 'active' &&
    route.c06Coverage?.roleAndFeatureFlags?.personaId === 'developer',
);

const shells = [
  {
    name: 'phone',
    matches: (url: string) => !/^\/(?:r|t|w)\//.test(url),
    viewport: { width: 390, height: 844 },
  },
  {
    name: 'responsive',
    matches: (url: string) => url.startsWith('/r/'),
    viewport: { width: 768, height: 900 },
  },
  {
    name: 'tablet',
    matches: (url: string) => url.startsWith('/t/'),
    viewport: { width: 1024, height: 900 },
  },
  {
    name: 'web',
    matches: (url: string) => url.startsWith('/w/'),
    viewport: { width: 1440, height: 900 },
  },
] as const;

test.describe.configure({ mode: 'parallel' });

async function authenticateDeveloper(page: Page, route: TrackedRoute, firstUrl: string) {
  await page.goto(firstUrl, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('auth-email').fill('developer@vittrade.local');
  await page.getByTestId('auth-password').fill('Preview-123!');
  await page.getByTestId('auth-submit').click();
  await expect.poll(() => route.resolvedUrls.includes(new URL(page.url()).pathname)).toBe(true);
  await expect(page.getByTestId('auth-email')).toHaveCount(0);
}

async function navigateWithinAuthenticatedApp(page: Page, url: string, resolvedUrls: string[]) {
  // Mock auth state lives in the current app context. Drive BrowserRouter through
  // its native history listener so the whole alias set uses the same developer session.
  await page.evaluate((nextUrl) => {
    const current = window.history.state ?? {};
    const idx = Number(current.idx ?? 0) + 1;
    const state = { ...current, idx, key: `c06-${idx}-${crypto.randomUUID()}` };
    window.history.pushState(state, '', nextUrl);
    window.dispatchEvent(new PopStateEvent('popstate', { state }));
  }, url);
  await expect.poll(() => resolvedUrls.includes(new URL(page.url()).pathname)).toBe(true);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

async function assertAccess(page: Page, expectedAccess: 'allow' | 'deny') {
  const denied = page.getByRole('heading', { name: 'Không có quyền truy cập', exact: true });
  if (expectedAccess === 'deny') {
    await expect(denied).toBeVisible();
    return;
  }

  await expect(page.getByTestId('auth-email')).toHaveCount(0);
  await expect(denied).toHaveCount(0);
  await expect(page.locator('#root')).not.toBeEmpty();
}

for (const shell of shells) {
  test(`developer role and flag route coverage: ${shell.name} shell @ui-mock`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(150_000);
    await page.setViewportSize(shell.viewport);

    const cases = developerRoutes.flatMap((route) =>
      route.resolvedUrls.filter(shell.matches).map((url) => ({
        routeId: route.id,
        path: route.path,
        url,
        resolvedUrls: route.resolvedUrls,
        expectedAccess: route.c06Coverage!.roleAndFeatureFlags!.expectedAccess,
      })),
    );
    expect(developerRoutes).toHaveLength(80);
    expect(cases).toHaveLength(shell.name === 'phone' ? 66 : shell.name === 'web' ? 81 : 66);

    expect(
      developerRoutes.filter(
        (route) => route.c06Coverage!.roleAndFeatureFlags!.expectedAccess === 'allow',
      ),
    ).toHaveLength(76);
    expect(
      developerRoutes.filter(
        (route) => route.c06Coverage!.roleAndFeatureFlags!.expectedAccess === 'deny',
      ),
    ).toHaveLength(4);

    const firstAllowed = cases.find((item) => item.expectedAccess === 'allow');
    expect(firstAllowed, `No allowed developer route is mapped for ${shell.name}`).toBeDefined();
    const firstAllowedRoute = developerRoutes.find((route) => route.id === firstAllowed!.routeId)!;
    await authenticateDeveloper(page, firstAllowedRoute, firstAllowed!.url);

    const observations = [];
    let currentUrl = firstAllowed!.url;
    let currentRouteId = firstAllowed!.routeId;
    for (const item of cases) {
      if (item.url !== currentUrl || item.routeId !== currentRouteId)
        await navigateWithinAuthenticatedApp(page, item.url, item.resolvedUrls);
      await assertAccess(page, item.expectedAccess);
      observations.push({
        ...item,
        actualPath: new URL(page.url()).pathname,
        outcome: item.expectedAccess,
      });
      currentUrl = item.url;
      currentRouteId = item.routeId;
    }

    await testInfo.attach(`developer-${shell.name}-route-observations.json`, {
      body: Buffer.from(
        JSON.stringify(
          {
            personaId: 'developer',
            shell: shell.name,
            viewport: shell.viewport,
            routeCount: developerRoutes.length,
            routeAliasRegistrations: cases.length,
            uniqueUrls: new Set(cases.map((item) => item.url)).size,
            observations,
          },
          null,
          2,
        ),
      ),
      contentType: 'application/json',
    });
  });
}

test('developer sees the default-enabled DCA route and asset action @ui-mock', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const dcaRoute = developerRoutes.find((route) => route.id === 'ROUTE-808a624106b9')!;
  const assetRoute = developerRoutes.find((route) => route.id === 'ROUTE-ca39c74ef725')!;
  await authenticateDeveloper(page, dcaRoute, '/dca');
  await expect(page.getByRole('heading', { name: 'Mua tự động (DCA)' })).toBeVisible();

  await navigateWithinAuthenticatedApp(page, '/w/wallet/asset/btc', assetRoute.resolvedUrls);
  await expect(page.getByRole('button', { name: 'DCA', exact: true })).toBeVisible();
});
