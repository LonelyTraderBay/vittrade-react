import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../');
const TRACKING_PATH = 'docs/architecture/production-readiness/TRACKING.json';
const CLASSIFICATION_PATH =
  'docs/architecture/production-readiness/evidence/A07/route-declaration-classification-2026-09-28.json';
const URL_PATH =
  'docs/architecture/production-readiness/evidence/A07/route-url-resolution-2026-09-28.json';
const OUTPUT_PATH =
  'docs/architecture/production-readiness/evidence/A07/route-page-ownership-2026-09-28.json';
const acceptedModes = ['--preview', '--apply', '--check'];
const requestedModes = process.argv.slice(2);
const mode = requestedModes[0] || '--preview';

if (!acceptedModes.includes(mode) || requestedModes.length > 1) {
  console.error('Usage: node generate-route-page-ownership.mjs [--preview|--apply|--check]');
  process.exit(2);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  fs.writeFileSync(path.join(ROOT, relativePath), JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function hashBytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function hashFile(relativePath) {
  return hashBytes(fs.readFileSync(path.join(ROOT, relativePath)));
}

function unique(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function addUnique(array, values) {
  const known = new Set(array);
  for (const value of values) if (!known.has(value)) array.push(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function routePath(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

const routeOwners = [
  ['U03', 'trading', (value) => value.startsWith('trade/') || value === 'tax-reports'],
  ['U05', 'p2p', (value) => value.startsWith('p2p/')],
  ['U04', 'wallet', (value) => value.startsWith('wallet/') || value === 'unified-portfolio'],
  ['U08', 'profile', (value) => value.startsWith('profile/')],
  ['U06', 'dca', (value) => value.startsWith('dca/')],
  ['U07', 'earn-staking', (value) => value.startsWith('earn/') || value.startsWith('staking/')],
  ['U11', 'launchpad', (value) => value.startsWith('launchpad/')],
  [
    'U13',
    'prediction-markets',
    (value) => value.startsWith('markets/predictions/') || value.startsWith('predictions/'),
  ],
  ['U14', 'referral-rewards', (value) => value.startsWith('referral/') || value === 'rewards'],
  [
    'U10',
    'discovery-search',
    (value) =>
      value.startsWith('search/') || value.startsWith('discover/') || value.startsWith('topic/'),
  ],
  ['U09', 'support-help', (value) => value.startsWith('support/') || value.startsWith('help/')],
  [
    'U02',
    'market-research',
    (value) =>
      value.startsWith('market/') || value.startsWith('markets/') || value === 'smart-alerts',
  ],
];

const featureDirs = {
  U01: 'src/features/auth/pages',
  U02: 'src/features/market/pages',
  U03: 'src/features/trading/pages',
  U04: 'src/features/wallet/pages',
  U05: 'src/features/p2p/pages',
  U06: 'src/features/dca/pages',
  U07: 'src/features/earn/pages',
  U08: 'src/features/profile/pages',
  U09: 'src/features/support/pages',
  U10: 'src/features/discovery/pages',
  U11: 'src/features/launchpad/pages',
  U12: 'src/features/arena/pages',
  U13: 'src/features/predictions/pages',
  U14: 'src/features/referral/pages',
  U15: 'src/app/pages/analytics',
  A07: 'src/app/pages/platform',
};

const ownerLabels = {
  U01: 'features/auth',
  U02: 'features/market',
  U03: 'features/trading',
  U04: 'features/wallet',
  U05: 'features/p2p',
  U06: 'features/dca',
  U07: 'features/earn',
  U08: 'features/profile',
  U09: 'features/support',
  U10: 'features/discovery',
  U11: 'features/launchpad',
  U12: 'features/arena',
  U13: 'features/predictions',
  U14: 'features/referral',
  U15: 'app/analytics',
  A07: 'app/platform',
};

const domainNames = {
  U01: 'auth',
  U02: 'market',
  U03: 'trading',
  U04: 'wallet',
  U05: 'p2p',
  U06: 'dca',
  U07: 'earn',
  U08: 'profile',
  U09: 'support',
  U10: 'discovery',
  U11: 'launchpad',
  U12: 'arena',
  U13: 'predictions',
  U14: 'referral',
  U15: 'analytics',
  A07: 'platform',
};

function ownerFor(route, source) {
  const cleanPath = routePath(route.path);
  if (source.classification === 'shell-or-guard')
    return { taskId: 'A07', ruleId: 'shared-app-shell-or-guard' };
  if (source.developmentOnly || source.classification === 'development-only')
    return { taskId: 'A07', ruleId: 'development-only-kept-in-a07' };
  if (cleanPath === 'enterprise-states')
    return { taskId: 'A07', ruleId: 'cross-cutting-platform-page' };
  if (route.component === 'MyArenaPage')
    return { taskId: 'U12', ruleId: 'shared-myarena-alias-owned-by-arena' };
  if (cleanPath === 'arena' || cleanPath.startsWith('arena/'))
    return { taskId: 'U12', ruleId: 'arena-route-family' };
  if (cleanPath === 'onboarding' || cleanPath === 'device-trust')
    return { taskId: 'U01', ruleId: 'auth-onboarding-and-device-trust' };
  if (cleanPath === 'cross-module-analytics')
    return { taskId: 'U15', ruleId: 'cross-module-analytics' };
  const match = routeOwners.find((item) => item[2](cleanPath));
  assert(match, 'No owner rule for route ' + route.id + ' (' + cleanPath + ')');
  return { taskId: match[0], ruleId: match[1] };
}

function pascalSegment(value) {
  const abbreviations = {
    api: 'API',
    dca: 'DCA',
    id: 'ID',
    kyc: 'KYC',
    kyb: 'KYB',
    mfa: 'MFA',
    nft: 'NFT',
    otp: 'OTP',
    p2p: 'P2P',
    vip: 'VIP',
  };
  const normalized = value.toLowerCase();
  return abbreviations[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function routeName(route, taskId) {
  const cleanPath = routePath(route.path);
  const segments = cleanPath
    .split('/')
    .filter(Boolean)
    .filter((part) => !part.startsWith(':'));
  const prefixes = {
    U01: ['auth'],
    U02: ['market'],
    U03: ['trade'],
    U04: ['wallet'],
    U05: ['p2p'],
    U06: ['dca'],
    U07: ['earn'],
    U08: ['profile'],
    U09: ['support'],
    U10: ['discovery'],
    U11: ['launchpad'],
    U12: ['arena'],
    U13: ['predictions'],
    U14: ['referral'],
    U15: [],
    A07: [],
  };
  if (taskId === 'U13' && segments[0] === 'markets' && segments[1] === 'predictions')
    segments.splice(0, 2);
  else if (prefixes[taskId].includes(segments[0])) segments.shift();
  if (taskId === 'U02' && segments[0] === 'markets') segments.shift();
  if (taskId === 'U10' && ['discover', 'search', 'topic'].includes(segments[0])) segments.shift();
  if (taskId === 'U07' && segments[0] === 'staking') segments.shift();
  if (['tax-reports', 'unified-portfolio', 'rewards'].includes(cleanPath))
    return cleanPath.split('-').map(pascalSegment).join('');
  if (cleanPath === 'cross-module-analytics') return 'CrossModuleAnalytics';
  if (cleanPath === 'enterprise-states') return 'EnterpriseStates';
  return segments.length
    ? segments
        .map((segment) => segment.split(/[-_]+/).filter(Boolean).map(pascalSegment).join(''))
        .join('')
    : 'Home';
}

function proposedPath(route, source, taskId) {
  const alias = source.aliasChain && source.aliasChain[0] && source.aliasChain[0].symbol;
  let name = alias && alias !== 'IntegrationPendingPage' ? alias : routeName(route, taskId);
  name = name.replace(/[^A-Za-z0-9_$]/g, '');
  if (!name) name = 'Home';
  if (!name.endsWith('Page')) name += 'Page';
  return featureDirs[taskId] + '/' + name + '.tsx';
}

function checkSourceHashes(classification, urls) {
  for (const input of [classification.sourceFileHashes, urls.inputs.sourceFileHashes]) {
    for (const [file, expected] of Object.entries(input)) {
      assert(fs.existsSync(path.join(ROOT, file)), 'Missing source file ' + file);
      assert(
        hashFile(file) === expected,
        'Source hash changed; refresh route evidence before mapping: ' + file,
      );
    }
  }
  const runtimeTree =
    'docs/architecture/production-readiness/evidence/A07/runtime-route-tree-2026-09-28.json';
  assert(
    hashFile(runtimeTree) === urls.inputs.runtimeManifestSha256,
    'A07.02 runtime route tree hash changed.',
  );
}

function loadInputs() {
  const tracking = readJson(TRACKING_PATH);
  const classification = readJson(CLASSIFICATION_PATH);
  const urls = readJson(URL_PATH);
  const routeById = new Map(tracking.routes.map((item) => [item.id, item]));
  const classById = new Map(classification.routeRows.map((item) => [item.id, item]));
  const urlById = new Map(urls.urlRecords.map((item) => [item.routeId, item]));
  assert(classification.routeRows.length === 428, 'Expected 428 route classifications.');
  assert(urls.urlRecords.length === 428, 'Expected 428 route URL records.');
  assert(routeById.size === tracking.routes.length, 'Duplicate route IDs in TRACKING.json.');
  assert(
    classById.size === classification.routeRows.length,
    'Duplicate route IDs in classification.',
  );
  assert(urlById.size === urls.urlRecords.length, 'Duplicate route IDs in URL evidence.');
  checkSourceHashes(classification, urls);
  for (const source of classification.routeRows) {
    const route = routeById.get(source.id);
    const urlRecord = urlById.get(source.id);
    assert(
      route && route.inventoryKey === source.inventoryKey,
      'Route inventory drift at ' + source.id,
    );
    assert(urlRecord && urlRecord.previewUrls.length, 'Missing concrete URL at ' + source.id);
  }
  return { tracking, classification, urls, routeById, classById, urlById };
}

function buildMapping(input) {
  const missing = input.classification.routeRows.filter((item) => item.pageTarget == null);
  assert(
    missing.length === 224,
    'Expected 224 baseline pageTarget omissions; got ' + missing.length,
  );
  const existingByUrl = new Map();
  for (const source of input.classification.routeRows.filter((item) => item.pageTarget != null)) {
    const route = input.routeById.get(source.id);
    for (const url of input.urlById.get(source.id).previewUrls) {
      const matches = existingByUrl.get(url) || [];
      matches.push({
        routeId: source.id,
        declarationPath: source.path,
        component: source.component,
        pageTarget: route.pageTarget,
        taskId: route.taskId,
      });
      existingByUrl.set(url, matches);
    }
  }

  const routeMappings = missing.map((source) => {
    const route = input.routeById.get(source.id);
    const owner = ownerFor(route, source);
    const previews = input.urlById.get(source.id).previewUrls.map((url) => {
      const matches = existingByUrl.get(url) || [];
      const targets = unique(matches.map((item) => item.pageTarget));
      assert(targets.length <= 1, source.id + ' has multiple page targets for ' + url);
      return { url, existingMatches: matches, effectivePageTarget: targets[0] || null };
    });
    const matched = previews.filter((item) => item.effectivePageTarget).length;
    const targets = unique(previews.map((item) => item.effectivePageTarget).filter(Boolean));
    const isShell = source.classification === 'shell-or-guard';
    const isDev = Boolean(source.developmentOnly) || source.classification === 'development-only';
    let disposition;
    let effectivePageTarget = null;
    let proposedPageTarget = null;
    if (isShell) disposition = 'shell-or-guard';
    else if (isDev) disposition = 'development-only';
    else if (matched === previews.length && targets.length === 1) {
      disposition = 'resolved-existing-target';
      effectivePageTarget = targets[0];
    } else {
      disposition = matched ? 'partial-existing-target-plus-planned-ui' : 'planned-ui';
      proposedPageTarget = proposedPath(route, source, owner.taskId);
    }
    return {
      routeId: source.id,
      inventoryKey: source.inventoryKey,
      declaredPath: source.path,
      source: source.source,
      declaredComponent: source.component,
      sourceClassification: source.classification,
      sourceTraits: source.traits,
      sourcePageTarget: null,
      sourceTarget: source.target,
      sourceAliasChain: source.aliasChain,
      sourceResolvedTargets: source.resolvedTargets,
      ownerTaskId: owner.taskId,
      ownerRuleId: owner.ruleId,
      disposition,
      effectivePageTarget,
      proposedPageTarget,
      urlCoverage: { matched, total: previews.length },
      urls: previews,
    };
  });

  const plannedGroups = new Map();
  for (const row of routeMappings.filter((item) => item.proposedPageTarget)) {
    const group = plannedGroups.get(row.proposedPageTarget) || [];
    group.push(row);
    plannedGroups.set(row.proposedPageTarget, group);
  }
  const plannedPages = [...plannedGroups.entries()]
    .map(([pagePath, rows]) => {
      const owners = unique(rows.map((row) => row.ownerTaskId));
      assert(owners.length === 1, 'One proposed path has multiple owners: ' + pagePath);
      const existingPage = input.tracking.pages.find((page) => page.path === pagePath);
      const expectedId = 'PAGE-' + hashBytes(Buffer.from(pagePath)).slice(0, 12);
      assert(
        !existingPage || (existingPage.lifecycle === 'planned' && existingPage.id === expectedId),
        'Tracked page path already exists with a different disposition: ' + pagePath,
      );
      assert(
        !fs.existsSync(path.join(ROOT, pagePath)),
        'Proposed source path already exists: ' + pagePath,
      );
      return {
        id: 'PAGE-' + hashBytes(Buffer.from(pagePath)).slice(0, 12),
        path: pagePath,
        taskId: owners[0],
        owner: ownerLabels[owners[0]],
        domain: domainNames[owners[0]],
        routeIds: unique(rows.map((row) => row.routeId)),
        routePaths: unique(rows.map((row) => row.declaredPath)),
        proposedPathBasis: unique(
          rows.map((row) => {
            const alias =
              row.sourceAliasChain && row.sourceAliasChain[0] && row.sourceAliasChain[0].symbol;
            return alias ? 'component alias ' + alias : 'route path ' + row.declaredPath;
          }),
        ),
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));

  for (const row of routeMappings) {
    if (row.effectivePageTarget) {
      const pages = input.tracking.pages.filter((page) => page.path === row.effectivePageTarget);
      assert(
        pages.length === 1,
        'Existing target must map to one tracked page: ' + row.effectivePageTarget,
      );
      row.effectivePageId = pages[0].id;
    }
    if (row.proposedPageTarget) {
      const page = plannedPages.find((item) => item.path === row.proposedPageTarget);
      row.proposedPageId = page.id;
    }
    for (const url of row.urls) {
      for (const match of url.existingMatches) {
        const targetRoute = input.routeById.get(match.routeId);
        assert(
          targetRoute.taskId === row.ownerTaskId,
          'Existing target owner differs for ' + row.routeId + ' at ' + url.url,
        );
      }
    }
  }

  const dispositions = {};
  for (const row of routeMappings)
    dispositions[row.disposition] = (dispositions[row.disposition] || 0) + 1;
  assert(dispositions['shell-or-guard'] === 5, 'Expected 5 shell/guard routes.');
  assert(dispositions['development-only'] === 5, 'Expected 5 development-only routes.');
  assert(
    dispositions['resolved-existing-target'] === 10,
    'Expected 10 fully resolved existing targets.',
  );
  assert(
    dispositions['partial-existing-target-plus-planned-ui'] === 1,
    'Expected one partially covered Arena route.',
  );
  assert(dispositions['planned-ui'] === 203, 'Expected 203 unmatched product routes.');
  assert(plannedPages.length === 201, 'Expected 201 unique planned pages.');
  const pagesByOwner = {};
  for (const page of plannedPages) pagesByOwner[page.taskId] = (pagesByOwner[page.taskId] || 0) + 1;
  return {
    routeMappings,
    plannedPages,
    summary: {
      baselineRouteDeclarations: 428,
      baselineWithoutPageTarget: 224,
      dispositions,
      plannedRouteDeclarations: 204,
      uniquePlannedPages: plannedPages.length,
      plannedPagesByOwner: pagesByOwner,
      plannedUrlsWithoutExistingTarget: routeMappings.reduce(
        (total, row) => total + row.urls.filter((url) => !url.effectivePageTarget).length,
        0,
      ),
      partialRouteCoverage: routeMappings
        .filter((row) => row.disposition === 'partial-existing-target-plus-planned-ui')
        .map((row) => ({
          routeId: row.routeId,
          matched: row.urlCoverage.matched,
          total: row.urlCoverage.total,
        })),
    },
  };
}

function stage() {
  return { status: 'todo', evidenceIds: [], notes: '' };
}

function plannedPageRecord(page) {
  const checklist = {};
  for (let index = 1; index <= 8; index++)
    checklist['P' + String(index).padStart(2, '0')] = stage();
  return {
    id: page.id,
    path: page.path,
    domain: page.domain,
    owner: page.owner,
    taskId: page.taskId,
    lifecycle: 'planned',
    baselineStatus: 'planned',
    routeIds: page.routeIds,
    operationIds: [],
    checklist,
    ui: stage(),
    connection: stage(),
    backend: stage(),
    uiReview: 'pending',
    userAcceptance: { status: 'pending', reviewer: null, reviewedAt: null, evidenceIds: [] },
    fileChanges: [],
    blockers: [],
    notes:
      'Planned screen only; source file and UI acceptance do not exist. See evidence/A07/route-page-ownership-2026-09-28.json for route and URL ownership.',
  };
}

function artifactFor(input, mapping, observedAt) {
  return {
    schemaVersion: 1,
    taskId: 'A07',
    stepId: 'A07.03',
    evidenceId: 'EV-20260928-007',
    observedAt,
    sourceHead: input.tracking.baseline.sourceHead,
    environment: {
      os: process.platform,
      node: process.version,
      method:
        'Source-hash-guarded mapping from A07.01 TypeScript classification and A07.02 runtime URL registrations; no browser UI or backend execution.',
    },
    inputs: {
      tracking: TRACKING_PATH,
      classification: CLASSIFICATION_PATH,
      urlResolution: URL_PATH,
    },
    ownerRules: [
      {
        id: 'shared-app-shell-or-guard',
        taskId: 'A07',
        basis: 'Application layouts/guards are not standalone product screens.',
      },
      {
        id: 'development-only-kept-in-a07',
        taskId: 'A07',
        basis: 'Development routes remain tooling scope, not product UI.',
      },
      {
        id: 'cross-cutting-platform-page',
        taskId: 'A07',
        basis: 'Enterprise states are app/platform state handling.',
      },
      {
        id: 'shared-myarena-alias-owned-by-arena',
        taskId: 'U12',
        basis: 'One MyArenaPage alias appears under arena and profile routes.',
      },
      ...routeOwners.map((item) => ({
        id: item[1],
        taskId: item[0],
        basis: 'The declared path is in this product route family.',
      })),
      {
        id: 'arena-route-family',
        taskId: 'U12',
        basis: 'Arena root and nested routes are Arena-owned.',
      },
      {
        id: 'auth-onboarding-and-device-trust',
        taskId: 'U01',
        basis: 'Onboarding/device trust are account access journeys.',
      },
      {
        id: 'cross-module-analytics',
        taskId: 'U15',
        basis: 'Cross-module analytics is owned by admin/analytics/flags delivery.',
      },
    ],
    summary: mapping.summary,
    limitations: [
      'A planned page record/path is a backlog target only; it does not mean a source file or UI exists.',
      'Static route registrations are not browser UI acceptance, direct reload certification, or backend verification.',
      'The 224 null-pageTarget count is a baseline declaration count; 5 shell/guard and 5 development-only routes do not need product page records.',
      'The 10 DCA declarations are fully covered by exact URL registrations to the existing feature page; their source declaration remains an IntegrationPendingPage placeholder.',
      'Arena has an existing target for /w/arena in 1 of 4 URL contexts; the other contexts remain planned.',
    ],
    routeMappings: mapping.routeMappings,
    plannedPages: mapping.plannedPages,
    verification: { status: 'mapping-generated; ledger-check-pending' },
  };
}

function applyTracking(input, mapping, artifact, previousArtifact) {
  const tracking = input.tracking;
  const originalOwners = new Map(tracking.routes.map((route) => [route.id, route.taskId]));
  const routesById = new Map(tracking.routes.map((route) => [route.id, route]));
  const pagesByPath = new Map(tracking.pages.map((page) => [page.path, page]));
  const previousRouteIds = new Set(
    (previousArtifact?.routeMappings || []).map((row) => row.routeId),
  );
  const previousPageIds = new Set((previousArtifact?.plannedPages || []).map((page) => page.id));
  const previousPagePaths = new Set(
    (previousArtifact?.plannedPages || []).map((page) => page.path),
  );

  if (previousArtifact) {
    for (const routeId of previousRouteIds) {
      const route = routesById.get(routeId);
      if (route) route.pageIds = [];
      for (const page of tracking.pages)
        page.routeIds = page.routeIds.filter((id) => id !== routeId);
    }
    tracking.pages = tracking.pages.filter((page) => !previousPageIds.has(page.id));
    tracking.files = tracking.files.filter(
      (file) =>
        !(
          previousPagePaths.has(file.path) &&
          file.lifecycle === 'planned' &&
          file.evidenceIds.includes(artifact.evidenceId)
        ),
    );
    for (const task of tracking.tasks) {
      task.pageIds = task.pageIds.filter((id) => !previousPageIds.has(id));
      task.proposedPaths = task.proposedPaths.filter(
        (pagePath) => !previousPagePaths.has(pagePath),
      );
    }
    tracking.evidence = tracking.evidence.filter((item) => item.id !== artifact.evidenceId);
    tracking.changes = tracking.changes.filter(
      (item) => !['CHANGE-20260928-012', 'CHANGE-20260928-013'].includes(item.id),
    );
  }

  for (const row of mapping.routeMappings) {
    const route = routesById.get(row.routeId);
    const linkedPaths = unique(
      [
        row.effectivePageTarget,
        ...row.urls.flatMap((url) => url.existingMatches.map((match) => match.pageTarget)),
      ].filter(Boolean),
    );
    const linkedPageIds = [];
    for (const targetPath of linkedPaths) {
      const page = pagesByPath.get(targetPath);
      assert(page, 'Existing effective page is untracked: ' + targetPath);
      linkedPageIds.push(page.id);
      addUnique(page.routeIds, [row.routeId]);
    }
    if (row.proposedPageId) linkedPageIds.push(row.proposedPageId);
    route.taskId = row.ownerTaskId;
    route.pageTarget = row.effectivePageTarget || row.proposedPageTarget || null;
    route.pageIds = unique(linkedPageIds);
    route.dispositionReason =
      row.disposition +
      '; see route-page-ownership-2026-09-28.json for exact URL contexts and owner basis.';
    const targetMeaning =
      row.disposition === 'resolved-existing-target'
        ? 'pageTarget is the effective registered export; the source declaration still aliases the recorded placeholder.'
        : row.proposedPageTarget
          ? 'pageTarget is a proposed path only; its page/file lifecycle is planned and no source implementation exists.'
          : 'No standalone product page target applies to this shell/guard or development-only route.';
    route.notes =
      'A07.03 mapping; source classification remains ' +
      row.sourceClassification +
      '. ' +
      targetMeaning +
      ' This is not UI acceptance.';
  }

  for (const page of mapping.plannedPages) {
    tracking.pages.push(plannedPageRecord(page));
    tracking.files.push({
      path: page.path,
      baselineSha256: null,
      lifecycle: 'planned',
      taskIds: [page.taskId],
      disposition: 'planned',
      reason:
        'Proposed page target for ' +
        page.routeIds.length +
        ' route declaration(s); source file has not been created.',
      evidenceIds: [artifact.evidenceId],
      changeIds: [],
    });
    const task = tracking.tasks.find((item) => item.id === page.taskId);
    assert(task, 'Unknown planned page owner ' + page.taskId);
    addUnique(task.pageIds, [page.id]);
    addUnique(task.proposedPaths, [page.path]);
  }

  const ownerRoutes = new Map();
  for (const row of mapping.routeMappings) {
    const ids = ownerRoutes.get(row.ownerTaskId) || [];
    ids.push(row.routeId);
    ownerRoutes.set(row.ownerTaskId, ids);
  }
  for (const task of tracking.tasks) {
    task.routeIds = task.routeIds.filter((id) => !ownerRoutesHasRoute(ownerRoutes, id));
    if (ownerRoutes.has(task.id)) addUnique(task.routeIds, ownerRoutes.get(task.id));
  }
  for (const row of mapping.routeMappings) {
    const oldOwner = originalOwners.get(row.routeId);
    if (oldOwner && oldOwner !== row.ownerTaskId) {
      const task = tracking.tasks.find((item) => item.id === oldOwner);
      if (task) task.routeIds = task.routeIds.filter((id) => id !== row.routeId);
    }
  }

  const step = tracking.tasks
    .find((task) => task.id === 'A07')
    .steps.find((item) => item.id === 'A07.03');
  assert(step.status !== 'done', 'A07.03 is already done; use --check.');
  tracking.evidence.push({
    id: artifact.evidenceId,
    taskId: 'A07',
    stepId: 'A07.03',
    kind: 'source',
    commandOrSteps:
      'node docs/architecture/production-readiness/evidence/A07/generate-route-page-ownership.mjs --apply',
    environment:
      'Windows ' +
      process.arch +
      '; Node ' +
      process.version +
      '; source-hash-guarded static route mapping.',
    observedAt: artifact.observedAt,
    sourceHead: artifact.sourceHead,
    dirtyFileHashes: currentDirtyHashes(input.classification.sourceFileHashes),
    expected:
      'All 224 baseline null-pageTarget declarations have a source-backed disposition and owner; planned records exist only for product UI without full existing route coverage.',
    actual:
      mapping.routeMappings.length +
      ' mapped: ' +
      mapping.summary.dispositions['shell-or-guard'] +
      ' shell/guard, ' +
      mapping.summary.dispositions['development-only'] +
      ' development-only, ' +
      mapping.summary.dispositions['resolved-existing-target'] +
      ' full existing targets, ' +
      mapping.summary.dispositions['partial-existing-target-plus-planned-ui'] +
      ' partial target, and ' +
      mapping.summary.dispositions['planned-ui'] +
      ' planned UI; ' +
      mapping.plannedPages.length +
      ' unique planned page records; no UI source files created.',
    result: 'pass',
    artifact: OUTPUT_PATH,
    notes:
      'Exact per-URL mapping is separated from source aliases. Browser/UI acceptance and backend verification are not claimed; ledger validation is recorded before step closure.',
  });

  const generatorPath =
    'docs/architecture/production-readiness/evidence/A07/generate-route-page-ownership.mjs';
  for (const task of tracking.tasks) {
    if (task.id === 'A07')
      addUnique(task.changeIds, ['CHANGE-20260928-012', 'CHANGE-20260928-013']);
  }
  tracking.changes.push(
    {
      id: 'CHANGE-20260928-012',
      taskId: 'A07',
      stepId: 'A07.03',
      path: generatorPath,
      action: 'add',
      oldPath: null,
      reason: 'Add reproducible A07.03 page-owner/URL mapping with source-hash guards.',
      beforeHash: null,
      afterHash: hashFile(generatorPath),
      evidenceIds: [artifact.evidenceId],
      commit: null,
    },
    {
      id: 'CHANGE-20260928-013',
      taskId: 'A07',
      stepId: 'A07.03',
      path: OUTPUT_PATH,
      action: 'add',
      oldPath: null,
      reason:
        'Record every baseline targetless route, URL disposition, domain owner and planned page target.',
      beforeHash: null,
      afterHash: null,
      evidenceIds: [artifact.evidenceId],
      commit: null,
    },
  );
  for (const file of [
    {
      path: generatorPath,
      reason: 'Reproducible source-hash-guarded A07.03 route-to-page mapping generator.',
      changeId: 'CHANGE-20260928-012',
    },
    {
      path: OUTPUT_PATH,
      reason: 'Per-route and per-URL ownership evidence for the 224 baseline declarations.',
      changeId: 'CHANGE-20260928-013',
    },
  ]) {
    const record = {
      path: file.path,
      baselineSha256: null,
      lifecycle: 'active',
      taskIds: ['A07'],
      disposition: 'changed',
      reason: file.reason,
      evidenceIds: [artifact.evidenceId],
      changeIds: [file.changeId],
    };
    const current = tracking.files.find((entry) => entry.path === file.path);
    if (current) Object.assign(current, record);
    else tracking.files.push(record);
  }
  return tracking;
}

function ownerRoutesHasRoute(ownerRoutes, routeId) {
  for (const ids of ownerRoutes.values()) if (ids.includes(routeId)) return true;
  return false;
}

function currentDirtyHashes(sourceHashes) {
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  const dirty = new Set();
  if (status.status === 0) {
    for (const line of status.stdout.split(/\r?\n/)) {
      if (line.length > 3) dirty.add(line.slice(3).trim().replace(/^"|"$/g, ''));
    }
  }
  return Object.fromEntries(Object.entries(sourceHashes).filter(([file]) => dirty.has(file)));
}

function checkTracking(input, mapping, artifact) {
  const pagesByPath = new Map(input.tracking.pages.map((page) => [page.path, page]));
  const routesById = new Map(input.tracking.routes.map((route) => [route.id, route]));
  const filesByPath = new Map(input.tracking.files.map((file) => [file.path, file]));
  assert(artifact.evidenceId === 'EV-20260928-007', 'Unexpected A07.03 evidence ID.');
  assert(
    JSON.stringify(artifact.routeMappings) === JSON.stringify(mapping.routeMappings),
    'Route mapping artifact is stale.',
  );
  assert(
    JSON.stringify(artifact.plannedPages) === JSON.stringify(mapping.plannedPages),
    'Planned page artifact is stale.',
  );
  for (const row of mapping.routeMappings) {
    const route = routesById.get(row.routeId);
    assert(route && route.taskId === row.ownerTaskId, row.routeId + ': owner mapping mismatch.');
    assert(
      route.pageTarget === (row.effectivePageTarget || row.proposedPageTarget || null),
      row.routeId + ': pageTarget mismatch.',
    );
    const pageIds = unique(
      [
        row.effectivePageId,
        row.proposedPageId,
        ...row.urls.flatMap((url) =>
          url.existingMatches.map((match) => pagesByPath.get(match.pageTarget)?.id),
        ),
      ].filter(Boolean),
    );
    assert(
      JSON.stringify(unique(route.pageIds)) === JSON.stringify(pageIds),
      row.routeId + ': pageIds mismatch.',
    );
    assert(
      input.tracking.tasks.find((task) => task.id === route.taskId)?.routeIds.includes(route.id),
      row.routeId + ': missing owner reverse reference.',
    );
    for (const pageId of pageIds) {
      assert(
        input.tracking.pages.find((page) => page.id === pageId)?.routeIds.includes(route.id),
        row.routeId + ': missing page reverse reference.',
      );
    }
  }
  for (const page of mapping.plannedPages) {
    const tracked = pagesByPath.get(page.path);
    assert(
      tracked && tracked.id === page.id && tracked.lifecycle === 'planned',
      'Missing planned page ' + page.path,
    );
    assert(
      JSON.stringify(unique(tracked.routeIds)) === JSON.stringify(page.routeIds),
      page.path + ': planned page route links mismatch.',
    );
    assert(
      filesByPath.get(page.path)?.lifecycle === 'planned',
      page.path + ': planned file entry missing.',
    );
  }
}

try {
  const input = loadInputs();
  const mapping = buildMapping(input);
  const existing = fs.existsSync(path.join(ROOT, OUTPUT_PATH)) ? readJson(OUTPUT_PATH) : null;
  const artifact = artifactFor(
    input,
    mapping,
    existing ? existing.observedAt : new Date().toISOString(),
  );

  if (mode === '--preview') {
    console.log(JSON.stringify(mapping.summary, null, 2));
    console.log(
      'Preview only; would add ' + mapping.plannedPages.length + ' planned page/file records.',
    );
  } else if (mode === '--apply') {
    const tracking = applyTracking(input, mapping, artifact, existing);
    writeJson(OUTPUT_PATH, artifact);
    const artifactChange = tracking.changes.find((item) => item.id === 'CHANGE-20260928-013');
    artifactChange.afterHash = hashFile(OUTPUT_PATH);
    writeJson(TRACKING_PATH, tracking);
    console.log(JSON.stringify(mapping.summary, null, 2));
    console.log(
      'Mapping applied; A07.03 remains open until --check and check-tracking are recorded.',
    );
  } else {
    assert(existing, 'Missing route map; inspect --preview, then run --apply.');
    artifact.verification = existing.verification;
    checkTracking(input, mapping, existing);
    const expected = { ...artifact, verification: undefined };
    const actual = { ...existing, verification: undefined };
    assert(
      JSON.stringify(actual) === JSON.stringify(expected),
      'Generated evidence differs from current source/tracking.',
    );
    console.log('A07.03 route mapping, source hashes and TRACKING cross-links pass.');
    console.log(JSON.stringify(mapping.summary, null, 2));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
