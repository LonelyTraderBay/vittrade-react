import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(evidenceDirectory, '../../../../..');
const planDirectory = path.join(root, 'docs/architecture/production-readiness');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const classification = readJson(
  path.join(evidenceDirectory, 'route-declaration-classification-2026-09-28.json'),
);
const runtime = readJson(path.join(evidenceDirectory, 'runtime-route-tree-2026-09-28.json'));
const runtimePath = path.join(evidenceDirectory, 'runtime-route-tree-2026-09-28.json');
for (const [source, expectedHash] of Object.entries(classification.sourceFileHashes)) {
  const actualHash = sha256(path.join(root, source));
  if (actualHash !== expectedHash) {
    throw new Error(
      `${source} changed since A07.01: expected ${expectedHash}, received ${actualHash}`,
    );
  }
}
const shellPrefixes = ['', 't', 'w', 'r'];
const authChildPaths = new Set([
  '2fa-setup',
  'login',
  'register',
  'otp',
  'forgot-password',
  'reset-password',
  'success',
  'account-locked',
  'session-expired',
  'device-trust',
]);
const tradingWebPaths = new Set([
  'trade/copy',
  'trade/copy/provider/:providerId',
  'trade/copy/provider/:providerId/assessment',
  'trade/copy/provider/:providerId/configuration',
  'trade/copy/provider/:providerId/confirmation',
  'trade/copy/active',
  'trade/orders',
  'trade/copy/performance/:copyId',
  'trade/copy/education',
  'trade/copy-trading/education',
  'trade/analytics',
]);
const walletWebPaths = new Set(['portfolio/analytics', 'profile/security/withdrawal-whitelist']);

function routeTemplates(route) {
  const declaredPath = String(route.path ?? '').replace(/^\/+|\/+$/g, '');

  if (route.source === 'src/app/routes.ts') {
    if (route.path === '/') return ['/'];
    if (
      ['t', 'w', 'r'].includes(declaredPath) &&
      ['TabletShell', 'WebShell', 'ResponsiveAppLayout'].includes(route.component)
    ) {
      return [`/${declaredPath}`];
    }
    if (route.component === 'ShellTemplatePage') return ['/r/shell'];
    if (declaredPath === 'onboarding') return ['/onboarding'];
    if (/^(dev\/|demo\/)/.test(declaredPath)) return [`/${declaredPath}`];
    if (authChildPaths.has(declaredPath)) return [`/w/auth/${declaredPath}`];
    return [`/w/${declaredPath}`];
  }

  if (route.source === 'src/app/routeConfig.ts' && authChildPaths.has(declaredPath)) {
    return shellPrefixes
      .filter((prefix) => prefix !== 'w')
      .map((prefix) => `/${prefix ? `${prefix}/` : ''}auth/${declaredPath}`);
  }
  if (route.source === 'src/app/routeConfig.ts' && declaredPath === 'auth') {
    return ['/auth', '/t/auth', '/r/auth'];
  }
  if (route.source === 'src/features/predictions/routes.ts') {
    return shellPrefixes.map(
      (prefix) => `/${prefix ? `${prefix}/` : ''}markets/predictions/${declaredPath}`,
    );
  }
  if (
    route.source === 'src/features/p2p/routes.ts' &&
    ['p2p/create-offer', 'p2p/order-room'].includes(declaredPath)
  ) {
    return [`/w/${declaredPath}`];
  }
  if (route.source === 'src/features/market/routes.ts' && declaredPath === 'scanner') {
    return ['/w/scanner'];
  }
  if (route.source === 'src/features/wallet/routes.ts' && walletWebPaths.has(declaredPath)) {
    return [`/w/${declaredPath}`];
  }
  if (route.source === 'src/features/trading/routes.ts' && tradingWebPaths.has(declaredPath)) {
    return [`/w/${declaredPath}`];
  }

  return shellPrefixes.map((prefix) => `/${prefix ? `${prefix}/` : ''}${declaredPath}`);
}

function fixtureFor(route, parameter) {
  const routePath = String(route.path);
  const fixtures = {
    pairId: ['btcusdt', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    txId: ['tx001', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    orderId: ['p2p001', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    merchantId: ['mc001', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    challengeId: ['ch001', 'mock-fixture', 'src/dev/mocks/arena-fixtures.ts'],
    creatorId: ['cr001', 'mock-fixture', 'src/dev/mocks/arena-fixtures.ts'],
    modeId: ['mode001', 'mock-fixture', 'src/dev/mocks/arena-fixtures.ts'],
    entryId: ['le001', 'mock-fixture', 'src/dev/mocks/arena-fixtures.ts'],
    caseId: ['rpt001', 'mock-fixture', 'src/dev/mocks/arena-fixtures.ts'],
    userId: ['cr001', 'mock-fixture-domain-candidate', 'src/dev/mocks/arena-fixtures.ts'],
    configId: ['plan-1', 'mock-fixture', 'src/dev/mocks/dca-fixtures.ts'],
    productId: ['sav001', 'mock-fixture', 'src/dev/mocks/earn-fixtures.ts'],
    eventId: ['pred-1', 'mock-fixture', 'src/dev/mocks/prediction-fixtures.ts'],
    copyId: [
      'relationship-1',
      'test-fixture-only',
      'src/features/trading/pages/TradingCopyPages.test.tsx',
    ],
    providerId: ['provider-1', 'test-fixture-only', 'src/features/trading/api/trading-api.test.ts'],
    traderId: ['trader-1', 'reserved-preview-id', null],
    assetId: ['btc', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    asset: ['BTC', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    alertId: ['alert001', 'mock-fixture', 'src/dev/mocks/trading-fixtures.ts'],
    deviceId: ['dev001', 'mock-fixture-domain-candidate', 'src/dev/mocks/trading-fixtures.ts'],
    friendId: ['rf-001', 'mock-fixture', 'src/dev/mocks/referral-fixtures.ts'],
    topicId: ['crypto', 'mock-fixture', 'src/dev/mocks/arena-prediction-topics.ts'],
    contractId: ['ac1', 'mock-fixture', 'src/dev/mocks/launchpad-fixtures.ts'],
    subId: ['sub1', 'mock-fixture', 'src/dev/mocks/launchpad-fixtures.ts'],
  };

  if (parameter === 'id') {
    if (routePath.includes('p2p/ad'))
      return {
        value: 'ad001',
        status: 'mock-fixture',
        source: 'src/dev/mocks/trading-fixtures.ts',
      };
    if (routePath.includes('p2p/dispute'))
      return {
        value: 'disp001',
        status: 'mock-fixture',
        source: 'src/dev/mocks/trading-fixtures.ts',
      };
    if (routePath.includes('p2p/payment-method'))
      return {
        value: 'pm001',
        status: 'mock-fixture',
        source: 'src/dev/mocks/trading-fixtures.ts',
      };
    if (routePath.includes('p2p/insurance/claim'))
      return { value: 'claim-001', status: 'reserved-preview-id', source: null };
    if (routePath.includes('launchpad'))
      return {
        value: 'proj1',
        status: 'mock-fixture',
        source: 'src/dev/mocks/launchpad-fixtures.ts',
      };
    return { value: 'item-001', status: 'reserved-preview-id', source: null };
  }
  if (parameter === 'positionId' && routePath.startsWith('earn/'))
    return {
      value: 'earn-position-1',
      status: 'mock-fixture',
      source: 'src/dev/mocks/earn-fixtures.ts',
    };
  if (parameter === 'positionId' && routePath.startsWith('launchpad/'))
    return { value: 'sp1', status: 'mock-fixture', source: 'src/dev/mocks/launchpad-fixtures.ts' };
  if (parameter === 'orderId' && route.source === 'src/features/predictions/routes.ts')
    return {
      value: 'po-1',
      status: 'mock-fixture',
      source: 'src/dev/mocks/prediction-fixtures.ts',
    };
  if (parameter === 'txId' && routePath.startsWith('launchpad/'))
    return { value: 'btx1', status: 'mock-fixture', source: 'src/dev/mocks/launchpad-fixtures.ts' };
  if (parameter === 'id' && routePath.includes('launchpad'))
    return {
      value: 'proj1',
      status: 'mock-fixture',
      source: 'src/dev/mocks/launchpad-fixtures.ts',
    };

  const [value, status, source] = fixtures[parameter] ?? [
    `preview-${parameter}-001`,
    'reserved-preview-id',
    null,
  ];
  return { value, status, source };
}

function previewUrl(template, parameters) {
  return template.replace(/:([A-Za-z0-9_]+)/g, (_, name) => {
    return parameters.find((parameter) => parameter.name === name)?.value ?? `preview-${name}-001`;
  });
}

const runtimeByPath = new Map();
for (const route of runtime.rows) {
  if (!runtimeByPath.has(route.fullPath)) runtimeByPath.set(route.fullPath, []);
  runtimeByPath.get(route.fullPath).push(route);
}

const routes = classification.routeRows.map((route) => {
  const urlTemplates = routeTemplates(route);
  const dynamicParams = [...String(route.path).matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => ({
    name: match[1],
    ...fixtureFor(route, match[1]),
  }));
  return {
    routeId: route.id,
    source: route.source,
    declarationPath: route.path,
    declaredComponent: route.component,
    pageTarget: route.pageTarget ?? null,
    routeFactory: route.routeFactory ?? null,
    classification: route.classification,
    developmentOnly: route.developmentOnly,
    urlTemplates,
    previewUrls: urlTemplates.map((template) => previewUrl(template, dynamicParams)),
    dynamicParams,
    runtimeRegistrations: urlTemplates.map((urlTemplate) => ({
      urlTemplate,
      nodeIds: (runtimeByPath.get(urlTemplate) ?? []).map((route) => route.id),
      ancestors: [
        ...new Set((runtimeByPath.get(urlTemplate) ?? []).flatMap((route) => route.ancestors)),
      ],
      elements: [
        ...new Set(
          (runtimeByPath.get(urlTemplate) ?? [])
            .map((route) => route.element?.name ?? route.component ?? route.element?.kind)
            .filter(Boolean),
        ),
      ],
    })),
  };
});

const unresolved = routes.filter((route) =>
  route.urlTemplates.some((url) => !runtimeByPath.has(url)),
);
if (unresolved.length) {
  throw new Error(
    `Route declarations without a runtime registration: ${unresolved
      .map(
        (route) =>
          `${route.routeId} ${route.urlTemplates.filter((url) => !runtimeByPath.has(url))}`,
      )
      .join('; ')}`,
  );
}

const routeIds = (source, declarationPath) =>
  routes
    .filter((route) => route.source === source && route.declarationPath === declarationPath)
    .map((route) => route.routeId);
const route = (source, declarationPath) =>
  routes.find((item) => item.source === source && item.declarationPath === declarationPath);
const queryStateVariants = [
  {
    id: 'QSV-01',
    routeIds: routeIds('src/features/trading/routes.ts', 'trade/copy-trading/comparison'),
    query: { ids: 'provider-1,provider-2' },
    urlTemplates:
      route('src/features/trading/routes.ts', 'trade/copy-trading/comparison')?.urlTemplates.map(
        (url) => `${url}?ids=provider-1%2Cprovider-2`,
      ) ?? [],
    behaviorSource: 'src/features/trading/pages/ProviderComparisonContractPage.tsx',
    fixtureStatus: 'test-fixture-only',
    notes:
      'Page reads ids; replace these test values with approved preview fixture IDs before UI acceptance.',
  },
  {
    id: 'QSV-02',
    routeIds: routeIds('src/features/p2p/routes.ts', 'p2p/express/confirm'),
    query: {
      type: 'buy',
      asset: 'USDT',
      fiat: '100000',
      adId: 'ad001',
      payment: 'Vietcombank',
    },
    urlTemplates:
      route('src/features/p2p/routes.ts', 'p2p/express/confirm')?.urlTemplates.map(
        (url) => `${url}?type=buy&asset=USDT&fiat=100000&adId=ad001&payment=Vietcombank`,
      ) ?? [],
    behaviorSource: 'src/features/p2p/pages/P2PExpressConfirmPage.tsx',
    fixtureStatus: 'mock-fixture',
    notes:
      'The page reads type, asset, fiat, adId and payment; sample values follow its query test and seeded P2P ad fixture.',
  },
  {
    id: 'QSV-03',
    routeIds: routeIds('src/features/p2p/routes.ts', 'p2p/payment-method/add'),
    query: { type: 'ewallet' },
    urlTemplates:
      route('src/features/p2p/routes.ts', 'p2p/payment-method/add')?.urlTemplates.map(
        (url) => `${url}?type=ewallet`,
      ) ?? [],
    behaviorSource: 'src/features/p2p/pages/P2PPaymentMethodAddPage.tsx',
    fixtureStatus: 'mock-fixture',
    notes: 'The page reads type; ewallet selects the non-default form branch.',
  },
];
const otpPhone = route('src/app/routeConfig.ts', 'otp');
const otpWeb = route('src/app/routes.ts', 'otp');
const navigationStateVariants = [
  {
    id: 'NSV-01',
    routeIds: routeIds('src/app/routeConfig.ts', 'otp'),
    urlTemplates: otpPhone?.urlTemplates ?? [],
    stateBuilder: {
      challengeId: 'preview-login-mfa-001',
      method: 'totp',
      maskedDestination: 'user@example.test',
      expiresAtExpression: 'new Date(Date.now() + 10 * 60_000).toISOString()',
    },
    source: 'src/features/auth/lib/login-mfa-route-state.ts',
    directLoadOutcome: 'Without location.state, the OTP page redirects to the shell login URL.',
  },
  {
    id: 'NSV-02',
    routeIds: routeIds('src/app/routeConfig.ts', 'otp'),
    urlTemplates: otpPhone?.urlTemplates ?? [],
    stateBuilder: {
      purpose: 'register',
      challengeId: 'preview-registration-001',
      channel: 'email',
      maskedDestination: 'u***@example.test',
      expiresAtExpression: 'new Date(Date.now() + 10 * 60_000).toISOString()',
    },
    source: 'src/features/auth/lib/registration-route-state.ts',
    directLoadOutcome: 'Without location.state, the OTP page redirects to the shell login URL.',
  },
  {
    id: 'NSV-03',
    routeIds: routeIds('src/app/routes.ts', 'otp'),
    urlTemplates: otpWeb?.urlTemplates ?? [],
    stateBuilder: {
      challengeId: 'preview-login-mfa-001',
      method: 'totp',
      maskedDestination: 'user@example.test',
      expiresAtExpression: 'new Date(Date.now() + 10 * 60_000).toISOString()',
    },
    source: 'src/features/auth/pages/WebOTPPage.tsx',
    directLoadOutcome: 'Without location.state, the web OTP page redirects to /w/auth/login.',
  },
];

const fixtureStatuses = {};
for (const route of routes) {
  for (const parameter of route.dynamicParams) {
    fixtureStatuses[parameter.status] = (fixtureStatuses[parameter.status] ?? 0) + 1;
  }
}
const payload = {
  schemaVersion: 1,
  taskId: 'A07',
  stepId: 'A07.02',
  evidenceId: 'EV-20260928-005',
  observedAt: new Date().toISOString(),
  sourceHead: runtime.sourceHead,
  environment: {
    os: 'Windows x64',
    shell: 'PowerShell',
    runtimeManifest: 'Vitest route tree captured from the registered router object.',
  },
  inputs: {
    classificationArtifact: `${planDirectory}/evidence/A07/route-declaration-classification-2026-09-28.json`,
    runtimeManifest: `${planDirectory}/evidence/A07/runtime-route-tree-2026-09-28.json`,
    runtimeManifestSha256: sha256(runtimePath),
    sourceFileHashes: classification.sourceFileHashes,
  },
  purpose:
    'Map tracked declarations to mounted URL templates, shell, dynamic sample values and route-owned query/navigation state. This is runtime route registration evidence, not browser/UI acceptance or backend certification.',
  resolutionRules: [
    {
      source: 'src/app/routes.ts',
      rule: 'Root and shell declarations use exact root paths; Web* declarations use /w; Web auth children use /w/auth; development showcase/demo paths stay on the phone shell; the legacy shell page uses /r/shell.',
    },
    {
      source: 'src/app/routeConfig.ts',
      rule: 'Shared public/protected routes map only to runtime shell registrations. AuthBlock and its auth children mount at /, /t and /r; web auth is separately declared in src/app/routes.ts.',
    },
    {
      source: 'src/features/predictions/routes.ts',
      rule: 'createPredictionRoutes is nested beneath markets/predictions inside createPublicRoutes for all four shells.',
    },
    {
      source: 'src/features/p2p/routes.ts',
      rule: 'Feature routes are shared through createP2PProtectedRoutes except p2p/create-offer and p2p/order-room, which are web-only aliases.',
    },
    {
      source: 'src/features/market/routes.ts',
      rule: 'scanner is registered by createMarketWebRoutes only; other declared templates are shared public/protected routes.',
    },
    {
      source: 'src/features/wallet/routes.ts',
      rule: 'portfolio/analytics and profile/security/withdrawal-whitelist are web aliases; createWalletRoutes templates are shared.',
    },
    {
      source: 'src/features/trading/routes.ts',
      rule: 'createTradingWebRoutes paths are web-only, except trade/positions which is also registered by createTradingRoutes; createTradingRoutes paths are shared.',
    },
    {
      source: 'other route modules',
      rule: 'The source module mount and actual runtime fullPath are both recorded; shell prefixes are emitted only when the route tree contains that exact template.',
    },
  ],
  counts: {
    routeDeclarations: routes.length,
    routeDeclarationsWithRuntimeUrls: routes.filter((route) => route.urlTemplates.length).length,
    routeDeclarationsMissingRuntimeUrls: routes.filter((route) => !route.urlTemplates.length)
      .length,
    totalUrlRegistrations: routes.reduce((count, route) => count + route.urlTemplates.length, 0),
    uniqueUrlTemplates: new Set(routes.flatMap((route) => route.urlTemplates)).size,
    dynamicRouteDeclarations: routes.filter((route) => route.dynamicParams.length).length,
    dynamicParameterOccurrences: Object.values(fixtureStatuses).reduce(
      (sum, count) => sum + count,
      0,
    ),
    dynamicFixtureStatuses: fixtureStatuses,
    queryStateVariants: queryStateVariants.length,
    otpRouteDeclarations: [otpPhone, otpWeb].filter(Boolean).length,
  },
  urlRecords: routes,
  queryStateVariants,
  navigationStateVariants,
  limitations: [
    'The runtime tree proves registered route templates only; HTTP reload fallback, page rendering, persona guards and browser history remain for A07.04/A07.05 and M2 UI checks.',
    'Dynamic sample IDs are split into existing mock fixtures, test-only examples and reserved preview IDs; no reserved ID is claimed as populated mock data.',
    'Query variants reflect parameters read by the named pages; stateful OTP requires navigation state and cannot be reproduced from a bare URL.',
    'Mock data and UI/API behavior remain separate from real backend/staging certification.',
  ],
};

fs.writeFileSync(
  path.join(evidenceDirectory, 'route-url-resolution-2026-09-28.json'),
  `${JSON.stringify(payload, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      routeDeclarations: payload.counts.routeDeclarations,
      mapped: payload.counts.routeDeclarationsWithRuntimeUrls,
      missing: payload.counts.routeDeclarationsMissingRuntimeUrls,
      urlRegistrations: payload.counts.totalUrlRegistrations,
      uniqueUrlTemplates: payload.counts.uniqueUrlTemplates,
      dynamicRouteDeclarations: payload.counts.dynamicRouteDeclarations,
      dynamicFixtureStatuses: payload.counts.dynamicFixtureStatuses,
      queryStateVariants: queryStateVariants.length,
      otpRouteDeclarations: payload.counts.otpRouteDeclarations,
    },
    null,
    2,
  ),
);
