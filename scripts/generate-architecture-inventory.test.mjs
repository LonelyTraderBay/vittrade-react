import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  extractRouteFactoryBindings,
  extractRouteRecords,
  getStatus,
  loadProductionCertifications,
  resolveShellOverrideTarget,
  validateInventory,
  validateProductionEvidence,
} from './generate-architecture-inventory.mjs';

async function createCertificationWorkspace({
  stagingRoutePaths = ['markets'],
  stagingVerification = 'docs/architecture/staging-evidence/market-home.json',
} = {}) {
  const root = await mkdtemp(join(tmpdir(), 'vittrade-architecture-'));
  const evidenceFiles = [
    'contracts/openapi/market.yaml',
    'src/features/market/api/market-api.ts',
    'src/features/market/model/authorization.test.ts',
    'src/features/market/api/market-api.test.ts',
    'src/features/market/pages/MarketHomePage.tsx',
    'src/features/market/routes.ts',
    'docs/architecture/staging-evidence/market-home.json',
  ];
  for (const path of evidenceFiles) {
    const absolutePath = join(root, path);
    await mkdir(join(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, 'evidence', 'utf8');
  }

  await writeFile(
    join(root, 'docs/architecture/staging-evidence/market-home.json'),
    JSON.stringify({
      schemaVersion: 1,
      environment: 'staging',
      baseUrl: 'https://staging.vittrade.example',
      testRunUrl: 'https://ci.example/runs/123',
      verifiedAt: '2026-09-24T10:00:00.000Z',
      commitSha: 'a'.repeat(40),
      routePaths: stagingRoutePaths,
    }),
    'utf8',
  );
  const routeRecords = [
    {
      path: 'markets',
      component: 'MarketHomePage',
      pageTarget: 'src/features/market/pages/MarketHomePage.tsx',
      source: 'src/features/market/routes.ts',
    },
  ];
  execFileSync('git', ['init', '--quiet'], { cwd: root, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'architecture-test@example.invalid'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'Architecture Test'], { cwd: root });
  execFileSync('git', ['add', '--', '.'], { cwd: root });
  execFileSync('git', ['commit', '--quiet', '-m', 'staging source revision'], { cwd: root });
  const commitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  await writeFile(
    join(root, 'docs/architecture/staging-evidence/market-home.json'),
    JSON.stringify({
      schemaVersion: 1,
      environment: 'staging',
      baseUrl: 'https://staging.vittrade.example',
      testRunUrl: 'https://ci.example/runs/123',
      verifiedAt: '2026-09-24T10:00:00.000Z',
      commitSha,
      routePaths: stagingRoutePaths,
    }),
    'utf8',
  );
  const manifestPath = join(root, 'docs/architecture/production-page-certifications.json');
  await mkdir(join(root, 'docs/architecture'), { recursive: true });
  await writeFile(
    manifestPath,
    JSON.stringify({
      schemaVersion: 1,
      pages: [
        {
          path: 'src/features/market/pages/MarketHomePage.tsx',
          contract: 'contracts/openapi/market.yaml',
          adapter: 'src/features/market/api/market-api.ts',
          authorization: 'src/features/market/model/authorization.test.ts',
          integrationTest: 'src/features/market/api/market-api.test.ts',
          stagingVerification,
        },
      ],
    }),
    'utf8',
  );

  return { root, manifestPath, routeRecords };
}

describe('architecture inventory route evidence', () => {
  it('resolves market pair route slots to the shell override implementation', () => {
    const shellOverrideTargets = new Map([
      [
        'PairDetailPage',
        {
          path: '@/features/market/pages/PairDetailPage',
          developmentOnly: false,
        },
      ],
    ]);

    expect(
      resolveShellOverrideTarget(
        {
          component: 'pairDetail',
          componentSlot: 'pairDetail',
          routeFactory: 'createMarketPublicRoutes',
        },
        shellOverrideTargets,
      ),
    ).toEqual({
      path: '@/features/market/pages/PairDetailPage',
      developmentOnly: false,
    });
  });

  it('inherits the parent path for index routes and records injected component slots', () => {
    const source = `
      export function createMarketRoutes(components) {
        return [{
          path: 'markets',
          children: [
            { index: true, Component: components.marketList },
            {
              path: 'pair/:pairId',
              Component: components.pairDetail,
              children: [{ path: 'history', Component: components.pairHistory }],
            },
          ],
        }];
      }
    `;

    expect(extractRouteRecords('src/features/market/routes.ts', source)).toMatchObject([
      {
        path: 'markets',
        component: 'marketList',
        componentSlot: 'marketList',
        routeFactory: 'createMarketRoutes',
      },
      {
        path: 'markets/pair/:pairId',
        component: 'pairDetail',
        componentSlot: 'pairDetail',
        routeFactory: 'createMarketRoutes',
      },
      {
        path: 'markets/pair/:pairId/history',
        component: 'pairHistory',
        componentSlot: 'pairHistory',
        routeFactory: 'createMarketRoutes',
      },
    ]);
  });

  it('resolves injected feature, shim, inline and development-only route targets', () => {
    const source = `
      const PairDetailPage = lazy(() => import('@/features/market/pages/PairDetailPage'));
      const AdminHome = isDevelopmentBuild
        ? lazy(() => import('@/features/admin/pages/AdminOverviewContractPage'))
        : IntegrationPendingPage;
      const AssetDetailPage = lazy(() => import('./pages/wallet/AssetDetailPage'));

      createMarketRoutes({ pairDetail: PairDetailPage });
      createAdminRoutes({ home: AdminHome });
      createWalletRoutes({ assetDetail: AssetDetailPage });
      createArenaRoutes({
        join: lazy(() => import('@/features/arena/pages/ArenaContractPages')),
      });
    `;
    const sourcePaths = new Set([
      'src/features/market/pages/PairDetailPage.tsx',
      'src/features/admin/pages/AdminOverviewContractPage.tsx',
      'src/app/pages/wallet/AssetDetailPage.tsx',
      'src/features/arena/pages/ArenaContractPages.tsx',
    ]);

    expect(extractRouteFactoryBindings('src/app/routeConfig.ts', source, sourcePaths)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factory: 'createMarketRoutes',
          slot: 'pairDetail',
          component: 'PairDetailPage',
          target: '@/features/market/pages/PairDetailPage',
          developmentOnly: false,
        }),
        expect.objectContaining({
          factory: 'createAdminRoutes',
          slot: 'home',
          component: 'AdminHome',
          target: '@/features/admin/pages/AdminOverviewContractPage',
          developmentOnly: true,
        }),
        expect.objectContaining({
          factory: 'createWalletRoutes',
          slot: 'assetDetail',
          component: 'AssetDetailPage',
          target: '@/app/pages/wallet/AssetDetailPage',
          developmentOnly: false,
        }),
        expect.objectContaining({
          factory: 'createArenaRoutes',
          slot: 'join',
          component: 'ArenaContractPages',
          target: '@/features/arena/pages/ArenaContractPages',
          developmentOnly: false,
        }),
      ]),
    );
  });

  it('marks unrouted source files separately from routed integration-pending pages', () => {
    const pagePath = 'src/features/example/pages/UnroutedPage.tsx';

    expect(getStatus(pagePath, '', [], undefined, new Set(), new Set())).toBe('not-implemented');
    expect(
      getStatus(
        'src/dev/legacy/earn/UnroutedSavingsPage.tsx',
        '',
        [],
        undefined,
        new Set(),
        new Set(),
      ),
    ).toBe('not-implemented');
    expect(
      getStatus(
        pagePath,
        '',
        [{ path: 'example', component: 'UnroutedPage' }],
        undefined,
        new Set(),
        new Set(),
      ),
    ).toBe('integration-pending');
    expect(
      getStatus(
        pagePath,
        '',
        [{ path: 'example', component: 'UnroutedPage', developmentOnly: true }],
        undefined,
        new Set(),
        new Set(),
      ),
    ).toBe('demo');
  });

  it('marks route-less page re-exports as deprecated compatibility shims', () => {
    expect(
      getStatus(
        'src/app/pages/p2p/P2POrderCancelPage.tsx',
        "export { P2POrderCancelContractPage as P2POrderCancelPage } from '@/features/p2p/pages/P2POrderActionPages';",
        [],
        undefined,
        new Set(),
        new Set(),
      ),
    ).toBe('deprecated');

    expect(
      getStatus(
        'src/features/trading/pages/WebCopyEducationPage.tsx',
        "export { CopyEducationPage as WebCopyEducationPage } from './CopyEducationPage';",
        [],
        undefined,
        new Set(),
        new Set(),
      ),
    ).toBe('deprecated');

    expect(
      getStatus(
        'src/app/pages/earn/SavingsBacktestPage.tsx',
        "export * from '@/dev/legacy/earn/SavingsBacktestPage';",
        [],
        undefined,
        new Set(),
        new Set(),
      ),
    ).toBe('deprecated');
  });

  it('classifies routed compatibility pages from their route evidence', () => {
    const pagePath = 'src/features/auth/pages/Web2FASetupPage.tsx';
    const shim =
      "export { Web2FASetupFlow as Web2FASetupPage } from '../components/Web2FASetupFlow';";
    const productionRoute = [
      { path: '2fa-setup', component: 'Web2FASetupPage', pageTarget: pagePath },
    ];
    const developmentRoute = [
      {
        path: '2fa-setup',
        component: 'Web2FASetupPage',
        pageTarget: pagePath,
        developmentOnly: true,
      },
    ];

    expect(getStatus(pagePath, shim, productionRoute, undefined, new Set(), new Set())).toBe(
      'integration-pending',
    );
    expect(getStatus(pagePath, shim, developmentRoute, undefined, new Set(), new Set())).toBe(
      'demo',
    );
    expect(
      getStatus(
        pagePath,
        shim,
        productionRoute,
        { stagingVerification: 'verified' },
        new Set(),
        new Set(),
      ),
    ).toBe('integration-pending');
  });

  it('keeps production certification separate from route and development status', () => {
    const pagePath = 'src/features/market/pages/MarketHomePage.tsx';
    const route = { path: 'markets', component: 'MarketHomePage', pageTarget: pagePath };

    expect(
      getStatus(pagePath, '', [route], { stagingVerification: 'verified' }, new Set(), new Set()),
    ).toBe('integration-pending');
    expect(
      getStatus(
        pagePath,
        '',
        [{ ...route, developmentOnly: true }],
        { stagingVerification: 'verified' },
        new Set(),
        new Set(),
      ),
    ).toBe('demo');
  });

  it('certifies production only from validated staging evidence covering each route', async () => {
    const { root, routeRecords } = await createCertificationWorkspace();
    const pagePath = 'src/features/market/pages/MarketHomePage.tsx';
    const routes = routeRecords;
    const certifications = await loadProductionCertifications([pagePath], { root, routeRecords });
    const certification = certifications.get(pagePath);

    try {
      expect(getStatus(pagePath, '', routes, certification, new Set(), new Set())).toBe(
        'production',
      );
      expect(() =>
        validateProductionEvidence(
          pagePath,
          certification,
          routes,
          {
            mockReferences: [],
            directRuntimeAccess: { fetch: false, websocket: false, storage: false },
          },
          '',
        ),
      ).not.toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects production certification when the page source changed after staging', async () => {
    const { root } = await createCertificationWorkspace();
    await writeFile(
      join(root, 'src/features/market/pages/MarketHomePage.tsx'),
      'export const MarketHomePage = () => null; // changed after staging',
      'utf8',
    );

    try {
      await expect(
        loadProductionCertifications(['src/features/market/pages/MarketHomePage.tsx'], { root }),
      ).rejects.toThrow('differs from the verified staging revision');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects production certification when a certified route source changed after staging', async () => {
    const { root, routeRecords } = await createCertificationWorkspace();
    await writeFile(
      join(root, 'src/features/market/routes.ts'),
      "export const routes = [{ path: 'markets/new' }];",
      'utf8',
    );

    try {
      await expect(
        loadProductionCertifications(['src/features/market/pages/MarketHomePage.tsx'], {
          root,
          routeRecords,
        }),
      ).rejects.toThrow('differs from the verified staging revision');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects staging evidence for a commit missing from the local Git repository', async () => {
    const { root } = await createCertificationWorkspace();
    await writeFile(
      join(root, 'docs/architecture/staging-evidence/market-home.json'),
      JSON.stringify({
        schemaVersion: 1,
        environment: 'staging',
        baseUrl: 'https://staging.vittrade.example',
        testRunUrl: 'https://ci.example/runs/123',
        verifiedAt: '2026-09-24T10:00:00.000Z',
        commitSha: 'f'.repeat(40),
        routePaths: ['markets'],
      }),
      'utf8',
    );

    try {
      await expect(
        loadProductionCertifications(['src/features/market/pages/MarketHomePage.tsx'], { root }),
      ).rejects.toThrow('staging revision that is not available in Git');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects free-form staging claims without a structured evidence file', async () => {
    const { root } = await createCertificationWorkspace({ stagingVerification: 'verified' });

    try {
      await expect(
        loadProductionCertifications(['src/features/market/pages/MarketHomePage.tsx'], { root }),
      ).rejects.toThrow('must reference a staging evidence JSON file');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('rejects certification when staging evidence omits a production route', async () => {
    const { root } = await createCertificationWorkspace({
      stagingRoutePaths: ['markets/overview'],
    });
    const pagePath = 'src/features/market/pages/MarketHomePage.tsx';
    const route = { path: 'markets', component: 'MarketHomePage', pageTarget: pagePath };

    try {
      const certifications = await loadProductionCertifications([pagePath], { root });
      expect(() =>
        validateProductionEvidence(
          pagePath,
          certifications.get(pagePath),
          [route],
          {
            mockReferences: [],
            directRuntimeAccess: { fetch: false, websocket: false, storage: false },
          },
          '',
        ),
      ).toThrow('missing staging verification for routes: markets');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it('requires summary status counts to include truthful zero values', () => {
    const inventory = {
      pages: [
        {
          path: 'src/features/market/pages/MarketHomePage.tsx',
          owner: 'features/market',
          status: 'integration-pending',
          routePaths: ['markets'],
          dependencies: {
            directRuntimeAccess: { fetch: false, websocket: false, storage: false },
          },
        },
      ],
      routes: [{ path: 'markets' }],
      summary: {
        pageStatus: {
          production: 1,
          'integration-pending': 1,
          demo: 0,
          deprecated: 0,
          'not-implemented': 0,
        },
      },
    };

    expect(() => validateInventory(inventory)).toThrow(
      'Inventory pageStatus count for production is 1; expected 0.',
    );
    inventory.summary.pageStatus.production = 0;
    expect(() => validateInventory(inventory)).not.toThrow();
  });
});
