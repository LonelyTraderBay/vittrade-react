import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import { fileURLToPath } from 'node:url';
import {
  classifySourceHead,
  compareRecordedSourceHashes,
  hasCurrentSourceProvenance,
} from './scenario-evidence-provenance.mjs';

const DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIRECTORY, '../../../../../');
const OUTPUT = path.join(DIRECTORY, 'scenario-matrix-2026-09-28.json');
const TRACKING_PATH = 'docs/architecture/production-readiness/TRACKING.json';
const OPERATION_MAP_PATH =
  'docs/architecture/production-readiness/evidence/A06/operation-mock-map-2026-09-28.json';
const RUNTIME_EVIDENCE_PATH =
  'docs/architecture/production-readiness/evidence/A06/preview-scenario-browser-check-market-empty-2026-09-28.json';
const args = process.argv.slice(2);
const mode = args[0] || '--write';

if (!['--write', '--check'].includes(mode) || args.length > 1) {
  console.error('Usage: node generate-scenario-matrix.mjs [--write|--check]');
  process.exit(2);
}

const readJson = (relativePath) =>
  JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const sha256 = (relativePath) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, relativePath)))
    .digest('hex');
const currentHead = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: ROOT,
  encoding: 'utf8',
}).trim();

const domainExpectations = {
  admin: {
    surface: 'Admin dashboards, moderation and privileged controls',
    empty:
      'Show an explicit no-results/no-activity state with the relevant filter or safe next action; preserve the distinction between no data and access denied.',
  },
  arena: {
    surface: 'Arena discovery, challenge detail and join flow',
    empty:
      'Show no available challenges without implying join failure; joining still requires an authenticated eligible persona.',
  },
  auth: {
    surface: 'Registration, login, MFA, session and recovery',
    empty: 'Use a form-ready state; do not show an empty data table for an authentication flow.',
  },
  dca: {
    surface: 'DCA overview and plan lifecycle',
    empty:
      'Show an empty-plan onboarding action; never imply a recurring purchase has executed when only a plan exists.',
  },
  discovery: {
    surface: 'Search and product discovery',
    empty:
      'Show no-results guidance and allow query/filter adjustment; keep it distinct from request failure.',
  },
  earn: {
    surface: 'Earn positions, subscriptions, redemptions and transactions',
    empty:
      'Show no-position guidance; do not imply funds are subscribed or redeemed without a receipt/status.',
  },
  launchpad: {
    surface: 'Launchpad project list and project detail',
    empty:
      'Show no eligible projects and the eligibility reason if known; do not invent purchase capabilities absent from the API contract.',
  },
  market: {
    surface: 'Market overview, instruments, charts, watchlist and alerts',
    empty:
      'Show a scoped no-data state; retain public market reads where allowed and keep private watchlist/alert access separate.',
  },
  p2p: {
    surface: 'P2P ads, escrow orders, payment methods, chat, dispute and security',
    empty:
      'Show an empty marketplace/order state; preserve escrow status and do not infer payment or release from a UI action alone.',
  },
  predictions: {
    surface: 'Prediction events, orders, receipts, positions and rewards',
    empty:
      'Show empty states for event, position, reward, leaderboard and activity collections; event detail, order placement and receipt status remain outside this empty-read scenario.',
  },
  profile: {
    surface: 'Profile, KYC, settings, credentials and account controls',
    empty:
      'Show explicit empty states for Profile collections without replacing the required Profile object; do not collapse missing permission or failed load into an empty result.',
  },
  referral: {
    surface: 'Referral overview and rewards',
    empty: 'Show zero referrals/rewards as an empty success state, not as a load error.',
  },
  support: {
    surface: 'Support tickets, FAQ and help',
    empty:
      'Show no-ticket guidance and a create-ticket action; keep FAQ content and ticket failures distinct.',
  },
  trading: {
    surface: 'Order entry, open orders, positions, order history and copy trading',
    empty:
      'Show no open orders/positions as a valid empty state; never treat it as proof that an order was cancelled or never submitted.',
  },
  wallet: {
    surface: 'Balances, transactions, transfers, deposit and withdrawal',
    empty:
      'Show an empty transaction/address state only after a successful read; preserve available balance and never report a transfer/withdrawal as complete without status evidence.',
  },
};

const sharedStates = {
  success:
    'A successful contract response renders the domain data and only actions allowed for the active persona.',
  empty:
    'A successful empty/list-filter response renders an explicit empty state and safe next action; it is not rendered as an error.',
  loading:
    'Show an observable loading state; do not flash a false empty state or stale conflicting data.',
  error:
    'Show a visible recoverable error and retry path; do not silently substitute fixtures or mutate the UI as if the request succeeded.',
  unauthorized:
    'For a secured operation returning 401, clear/restore protected session state and route to authentication; do not expose stale protected data.',
  forbidden:
    'For a secured operation returning 403, show an explicit permission-denied state; do not present it as an empty successful result.',
};

const financialCases = {
  pending:
    'Render only the pending/request-in-flight status defined by the contract; disable duplicate finalization while unresolved and show a stable receipt/reference when available.',
  unknown:
    'When a mutation response is lost, show outcome unconfirmed, neither success nor failure; reconcile using the listed read operation before offering a retry, and preserve the original idempotency key.',
  duplicate:
    'Replay the same intent with the same idempotency key; assert one visible resource and one balance effect, using the contract-defined replay result or conflict response.',
};

const financialFlows = {
  earn: {
    mutationIds: ['createEarnSubscription', 'redeemEarnPosition'],
    readId: 'listEarnTransactions',
  },
  p2p: {
    mutationIds: ['createP2POrder', 'markP2POrderPaid', 'releaseP2POrderEscrow'],
    readId: 'getP2POrder',
  },
  predictions: { mutationIds: ['placePredictionOrder'], readId: 'getPredictionOrderReceipt' },
  trading: {
    mutationIds: ['placeOrder', 'modifyOrder', 'cancelOrder'],
    readIds: ['listOpenOrders', 'listOrderHistory'],
  },
  wallet: {
    mutationIds: ['createWalletTransfer', 'createWalletWithdrawal'],
    readId: 'getWalletTransaction',
  },
};

const emptyOperationIdsByDomain = {
  admin: ['getAdminFunnel', 'listAdminAbTests'],
  arena: ['getArenaDiscovery'],
  discovery: ['searchDiscovery'],
  market: ['listMarketPairs'],
  earn: ['getEarnSnapshot', 'listEarnTransactions'],
  predictions: [
    'listPredictionEvents',
    'listPredictionPositions',
    'listPredictionRewards',
    'listPredictionLeaderboard',
    'listPredictionActivity',
  ],
  profile: ['listTrustedDevices', 'listProfileActivity', 'listSubAccounts'],
  trading: ['listOpenOrders', 'listOpenPositions', 'listOrderHistory'],
  wallet: ['getWalletAssets', 'getWalletTransactions'],
};
const loadingReadOperationIdsByDomain = {
  admin: ['getAdminOverview', 'getAdminFunnel', 'listAdminAbTests'],
  profile: ['getProfile', 'listTrustedDevices', 'listProfileActivity', 'listSubAccounts'],
  // Loading checks exercise reads only; do not mutate while these pages are pending.
  support: ['listNews', 'listNotifications', 'getHelpCenter', 'listSupportTickets'],
  trading: ['listOpenOrders', 'listOpenPositions', 'listOrderHistory'],
  predictions: [
    'listPredictionEvents',
    'getPredictionEvent',
    'listPredictionPositions',
    'listPredictionRewards',
    'listPredictionLeaderboard',
    'listPredictionActivity',
    'getPredictionOrderReceipt',
  ],
};
const errorReadOperationIdsByDomain = {
  // Error checks fail reads only; a failed write may have an unknown outcome.
  support: ['listNews', 'listNotifications', 'getHelpCenter', 'listSupportTickets'],
  // The Trading contract declares 503 only for positions; other operations are outside this error row.
  trading: ['listOpenPositions'],
};
const forbiddenOperationIdsByDomain = {
  // Trading declares 403 for these ten operations; the remaining three do not declare it.
  trading: [
    'listCopyRelationships',
    'createCopyRelationship',
    'stopCopyRelationship',
    'getTradingAnalytics',
    'listOpenOrders',
    'placeOrder',
    'listOpenPositions',
    'listOrderHistory',
    'modifyOrder',
    'cancelOrder',
  ],
};
const inFlightMutationOperationIdsByDomain = {
  support: ['createSupportTicket'],
};

const tracking = readJson(TRACKING_PATH);
const operationMap = readJson(OPERATION_MAP_PATH);
const runtimeEvidence = fs.existsSync(path.join(ROOT, RUNTIME_EVIDENCE_PATH))
  ? readJson(RUNTIME_EVIDENCE_PATH)
  : null;
const previousGeneratedAt = fs.existsSync(OUTPUT)
  ? JSON.parse(fs.readFileSync(OUTPUT, 'utf8')).generatedFrom?.generatedAt
  : null;
const mappedOperations = new Map(operationMap.operations.map((item) => [item.operationId, item]));
const trackedOperations = new Map(tracking.operations.map((item) => [item.operationId, item]));
const trackedDomains = [...new Set(tracking.operations.map((item) => item.domain))].sort();
const configuredDomains = Object.keys(domainExpectations).sort();
const inspectSourceHashes = (sourceHashes) =>
  compareRecordedSourceHashes(sourceHashes, (relativePath) => {
    const absolutePath = path.join(ROOT, relativePath);
    return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null;
  });
const observedOperationIds = (scenario) =>
  scenario.observedOperationIds ??
  scenario.operationIds ??
  (scenario.operationId ? [scenario.operationId] : []);
const errors = [];
const runtimeSourceHashCheck = inspectSourceHashes(runtimeEvidence?.sourceHashes ?? {});
const runtimeEvidenceFresh = hasCurrentSourceProvenance({
  sourceHead: runtimeEvidence?.sourceHead,
  currentHead,
  sourceHashCount: runtimeSourceHashCheck.sourceHashCount,
  sourceHashMismatches: runtimeSourceHashCheck.sourceHashMismatches,
});
const runtimeEvidenceRevision = classifySourceHead(
  runtimeEvidence?.sourceHead,
  currentHead,
  tracking.baseline.sourceHead,
);
const knownScenarioIds = new Set(
  configuredDomains.flatMap((domain) => [
    ...Object.keys(sharedStates).map((state) => `${domain}.${state}`),
    ...(financialFlows[domain]
      ? Object.keys(financialCases).map((state) => `${domain}.${state}`)
      : []),
    ...(inFlightMutationOperationIdsByDomain[domain] ? [`${domain}.pending`] : []),
  ]),
);
const runtimeScenariosById = new Map();
if (runtimeEvidenceFresh) {
  for (const scenario of runtimeEvidence.scenarios ?? []) {
    if (scenario.status === 'passed' && knownScenarioIds.has(scenario.id)) {
      runtimeScenariosById.set(scenario.id, {
        ...scenario,
        evidencePath: RUNTIME_EVIDENCE_PATH,
        evidenceKind: 'aggregate-report',
        evidenceSourceHashCount: Object.keys(runtimeEvidence.sourceHashes ?? {}).length,
      });
    }
  }
}

const scenarioEvidenceArtifacts = runtimeEvidence?.scenarioEvidenceArtifacts ?? [];
const scenarioEvidenceArtifactResults = [];
const registeredSidecarScenarioIds = new Set();
for (const artifact of scenarioEvidenceArtifacts) {
  if (registeredSidecarScenarioIds.has(artifact.id)) {
    errors.push(`${artifact.id}: duplicate sidecar evidence registration.`);
    continue;
  }
  registeredSidecarScenarioIds.add(artifact.id);
  if (!knownScenarioIds.has(artifact.id)) {
    errors.push(`${artifact.id}: sidecar evidence references an unknown scenario ID.`);
    continue;
  }
  if (typeof artifact.path !== 'string' || artifact.path.length === 0) {
    errors.push(`${artifact.id}: sidecar evidence path is missing.`);
    continue;
  }
  const resolvedPath = path.resolve(ROOT, artifact.path);
  const relativePath = path.relative(ROOT, resolvedPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    errors.push(`${artifact.id}: sidecar evidence path escapes the repository.`);
    continue;
  }
  if (!fs.existsSync(resolvedPath)) {
    errors.push(`${artifact.id}: sidecar evidence file is missing: ${artifact.path}`);
    continue;
  }
  const artifactHash = sha256(artifact.path);
  if (artifact.sha256 && artifact.sha256 !== artifactHash) {
    errors.push(`${artifact.id}: sidecar evidence file hash does not match its manifest entry.`);
    continue;
  }
  const sidecar = readJson(artifact.path);
  const scenario = sidecar.scenario;
  const sourceHashes = sidecar.sourceHashes ?? {};
  const sourceHashCheck = inspectSourceHashes(sourceHashes);
  const sourceHashMismatches = sourceHashCheck.sourceHashMismatches;
  const sourceHeadRevision = classifySourceHead(
    sidecar.sourceHead,
    currentHead,
    tracking.baseline.sourceHead,
  );
  const localPreview = (() => {
    try {
      return ['localhost', '127.0.0.1', '[::1]'].includes(new URL(sidecar.origin).hostname);
    } catch {
      return false;
    }
  })();
  const localMockEvidence =
    localPreview &&
    sidecar.fixtureBoundary?.serviceWorkerControlled === true &&
    (sidecar.fixtureBoundary?.allP2PResponsesFromServiceWorker === true ||
      sidecar.fixtureBoundary?.allObservedResponsesFromServiceWorker === true ||
      sidecar.fixtureBoundary?.transportFailureNoHttpResponse === true) &&
    sidecar.fixtureBoundary?.externalApiOrigins?.length === 0 &&
    (sidecar.fixtureBoundary?.realBackendMutationSent === false ||
      sidecar.fixtureBoundary?.realBackendRequestSent === false);
  const fresh =
    artifact.id === scenario?.id &&
    scenario?.status === 'passed' &&
    hasCurrentSourceProvenance({
      sourceHead: sidecar.sourceHead,
      currentHead,
      sourceHashCount: sourceHashCheck.sourceHashCount,
      sourceHashMismatches,
    });
  const historicalBaselineEvidence =
    artifact.id === scenario?.id &&
    scenario?.status === 'passed' &&
    sourceHeadRevision === 'historical_baseline' &&
    localMockEvidence;
  const result = {
    id: artifact.id,
    path: artifact.path,
    sourceHead: sidecar.sourceHead ?? null,
    sourceHeadRevision,
    sourceHashCount: sourceHashCheck.sourceHashCount,
    sourceHashesMatchCurrent:
      sourceHashMismatches.length === 0 && sourceHashCheck.sourceHashCount > 0,
    historicalBaselineEvidence,
    fresh,
    sourceHashMismatches,
    localPreview,
    localMockEvidence,
  };
  scenarioEvidenceArtifactResults.push(result);
  if (fresh) {
    runtimeScenariosById.set(artifact.id, {
      ...scenario,
      evidencePath: artifact.path,
      evidenceKind: 'scenario-sidecar',
      evidenceSourceHashCount: Object.keys(sourceHashes).length,
    });
  }
}
const runtimeVerifiedOperationIds = new Set(
  [...runtimeScenariosById.values()].flatMap(observedOperationIds),
);

if (JSON.stringify(trackedDomains) !== JSON.stringify(configuredDomains)) {
  errors.push(
    `Scenario domain inventory differs: tracked=${trackedDomains.join(',')} configured=${configuredDomains.join(',')}`,
  );
}
if (operationMap.summary.exactMethodPathMatches !== tracking.operations.length) {
  errors.push('The A06.01 handler map does not reconcile to the tracked operation count.');
}

const domains = configuredDomains.map((domain) => {
  const operations = operationMap.operations.filter((item) => item.domain === domain);
  const secured = operations.filter((item) => item.security?.length > 0);
  const directlyTested = operations.filter((item) => item.directTestReferences?.length > 0);
  const scenarios = Object.entries(sharedStates).map(([state, expectedUi]) => {
    const expectedOperations =
      state === 'empty' && emptyOperationIdsByDomain[domain]
        ? emptyOperationIdsByDomain[domain].map((operationId) =>
            operations.find((item) => item.operationId === operationId),
          )
        : state === 'loading' && loadingReadOperationIdsByDomain[domain]
          ? loadingReadOperationIdsByDomain[domain].map((operationId) =>
              operations.find((item) => item.operationId === operationId),
            )
          : state === 'error' && errorReadOperationIdsByDomain[domain]
            ? errorReadOperationIdsByDomain[domain].map((operationId) =>
                operations.find((item) => item.operationId === operationId),
              )
            : state === 'forbidden' && forbiddenOperationIdsByDomain[domain]
              ? forbiddenOperationIdsByDomain[domain].map((operationId) =>
                  operations.find((item) => item.operationId === operationId),
                )
              : state === 'unauthorized' || state === 'forbidden'
                ? secured
                : operations;
    if (expectedOperations.some((operation) => !operation)) {
      errors.push(`${domain}.${state}: an expected operation is not in the tracked domain.`);
    }
    const applicableOperations = expectedOperations.filter(Boolean);
    const runtimeScenario = runtimeScenariosById.get(`${domain}.${state}`);
    const runtimeOperationIds = runtimeScenario ? observedOperationIds(runtimeScenario) : [];
    if (runtimeScenario && !runtimeOperationIds.every((id) => mappedOperations.has(id))) {
      errors.push(`${runtimeScenario.id}: runtime evidence references an unknown operation ID.`);
    }
    const coveredOperationIds = runtimeOperationIds.filter((id) =>
      applicableOperations.some((operation) => operation.operationId === id),
    );
    if (runtimeScenario && coveredOperationIds.length !== runtimeOperationIds.length) {
      errors.push(
        `${runtimeScenario.id}: observed operation is outside the expected operation set.`,
      );
    }
    const fullyObserved =
      runtimeScenario && coveredOperationIds.length === applicableOperations.length;

    return {
      id: `${domain}.${state}`,
      state,
      applicability:
        ['unauthorized', 'forbidden'].includes(state) && secured.length === 0
          ? 'not_applicable'
          : 'required',
      operationIds: applicableOperations.map((item) => item.operationId),
      expectedUi:
        state === 'empty'
          ? domainExpectations[domain].empty
          : state === 'success'
            ? `${domainExpectations[domain].surface}: ${expectedUi}`
            : expectedUi,
      executionStatus: !runtimeScenario
        ? 'not_verified'
        : fullyObserved
          ? 'browser_verified'
          : 'representative_browser_observed',
      ...(runtimeScenario
        ? {
            runtimeEvidence: runtimeScenario.evidencePath,
            runtimeRoute: runtimeScenario.route ?? null,
            runtimeObservedOperationIds: coveredOperationIds,
            runtimeEvidenceKind: runtimeScenario.evidenceKind,
            runtimeEvidenceFresh: true,
            runtimeEvidenceSourceHashCount: runtimeScenario.evidenceSourceHashCount,
          }
        : {}),
    };
  });

  const inFlightOperationIds = inFlightMutationOperationIdsByDomain[domain];
  if (inFlightOperationIds) {
    const pendingOperations = inFlightOperationIds.map((operationId) =>
      operations.find((item) => item.operationId === operationId),
    );
    if (pendingOperations.some((operation) => !operation)) {
      errors.push(`${domain}.pending: an in-flight operation is not in the tracked domain.`);
    }
    const expectedOperationIds = pendingOperations.filter(Boolean).map((item) => item.operationId);
    const runtimeScenario = runtimeScenariosById.get(`${domain}.pending`);
    const runtimeOperationIds = runtimeScenario ? observedOperationIds(runtimeScenario) : [];
    if (runtimeScenario && !runtimeOperationIds.every((id) => mappedOperations.has(id))) {
      errors.push(`${runtimeScenario.id}: runtime evidence references an unknown operation ID.`);
    }
    const coveredOperationIds = runtimeOperationIds.filter((id) =>
      expectedOperationIds.includes(id),
    );
    if (runtimeScenario && coveredOperationIds.length !== runtimeOperationIds.length) {
      errors.push(
        `${runtimeScenario.id}: observed operation is outside the pending operation set.`,
      );
    }
    scenarios.push({
      id: `${domain}.pending`,
      state: 'pending',
      applicability: 'required',
      pendingKind: 'client_request_in_flight',
      operationIds: expectedOperationIds,
      contractStatusSemantics:
        'OpenAPI declares HTTP 201 after ticket creation; it does not declare a durable server-side pending status.',
      expectedUi:
        'While createSupportTicket is in flight, show the submitting state and prevent edits or duplicate submission; after HTTP 201, render the created ticket. This verifies client request-in-flight behavior only.',
      executionStatus: !runtimeScenario
        ? 'not_verified'
        : coveredOperationIds.length === expectedOperationIds.length
          ? 'browser_verified'
          : 'representative_browser_observed',
      ...(runtimeScenario
        ? {
            runtimeEvidence: runtimeScenario.evidencePath,
            runtimeRoute: runtimeScenario.route ?? null,
            runtimeObservedOperationIds: coveredOperationIds,
            runtimeEvidenceKind: runtimeScenario.evidenceKind,
            runtimeEvidenceFresh: true,
            runtimeEvidenceSourceHashCount: runtimeScenario.evidenceSourceHashCount,
          }
        : {}),
    });
  }

  const flow = financialFlows[domain];
  if (flow) {
    const readIds = flow.readIds ?? [flow.readId];
    const reconciliationOperations = readIds.map((id) =>
      operations.find((item) => item.operationId === id),
    );
    const mutationOperations = flow.mutationIds.map((id) =>
      operations.find((item) => item.operationId === id),
    );
    if (
      reconciliationOperations.some((item) => !item) ||
      mutationOperations.some((item) => !item)
    ) {
      errors.push(
        `${domain}: one or more configured financial operations are not in the tracked contract inventory.`,
      );
    }
    for (const [state, expectedUi] of Object.entries(financialCases)) {
      const runtimeScenario = runtimeScenariosById.get(`${domain}.${state}`);
      const expectedOperationIds = [...flow.mutationIds, ...readIds];
      const runtimeOperationIds = runtimeScenario ? observedOperationIds(runtimeScenario) : [];
      if (runtimeScenario && !runtimeOperationIds.every((id) => mappedOperations.has(id))) {
        errors.push(`${runtimeScenario.id}: runtime evidence references an unknown operation ID.`);
      }
      const coveredOperationIds = runtimeOperationIds.filter((id) =>
        expectedOperationIds.includes(id),
      );
      if (runtimeScenario && coveredOperationIds.length !== runtimeOperationIds.length) {
        errors.push(
          `${runtimeScenario.id}: observed operation is outside the expected financial operation set.`,
        );
      }
      scenarios.push({
        id: `${domain}.${state}`,
        state,
        applicability: 'required',
        operationIds: expectedOperationIds,
        contractStatusSemantics:
          'Derive from the linked OpenAPI operation; transport-level unknown is not a server status enum.',
        idempotencyContract: mutationOperations.map((item) => ({
          operationId: item.operationId,
          required: trackedOperations.get(item.operationId)?.observed?.idempotencyRequired ?? null,
        })),
        expectedUi:
          domain === 'p2p' && state === 'duplicate'
            ? 'For createP2POrder, markP2POrderPaid, and releaseP2POrderEscrow HTTP 409 responses, show explicit conflict guidance, keep each route, and do not resubmit automatically; refresh the affected order after mark-paid and release conflicts. This does not prove same-key replay, reconciliation, or backend behavior.'
            : expectedUi,
        executionStatus: !runtimeScenario
          ? 'not_verified'
          : coveredOperationIds.length === expectedOperationIds.length
            ? 'browser_verified'
            : 'representative_browser_observed',
        ...(runtimeScenario
          ? {
              runtimeEvidence: runtimeScenario.evidencePath,
              runtimeRoute: runtimeScenario.route ?? null,
              runtimeObservedOperationIds: coveredOperationIds,
              runtimeEvidenceKind: runtimeScenario.evidenceKind,
              runtimeEvidenceFresh: true,
              runtimeEvidenceSourceHashCount: runtimeScenario.evidenceSourceHashCount,
            }
          : {}),
      });
    }
  }

  return {
    domain,
    surface: domainExpectations[domain].surface,
    operationCount: operations.length,
    securedOperationCount: secured.length,
    operationIds: operations.map((item) => item.operationId),
    directSharedHandlerTestOperationIds: directlyTested.map((item) => item.operationId),
    scenarioCount: scenarios.length,
    scenarios,
  };
});

const scenarioCount = domains.reduce((total, domain) => total + domain.scenarioCount, 0);
const scenarioRowsWithRuntimeEvidence = domains
  .flatMap((domain) => domain.scenarios)
  .filter((scenario) => scenario.executionStatus !== 'not_verified');
const fullyVerifiedScenarioRows = scenarioRowsWithRuntimeEvidence.filter(
  (scenario) => scenario.executionStatus === 'browser_verified',
);
const report = {
  schemaVersion: 1,
  generatedFrom: {
    tracking: TRACKING_PATH,
    operationMap: OPERATION_MAP_PATH,
    sourceHead: currentHead,
    generatedAt: mode === '--check' ? previousGeneratedAt : new Date().toISOString(),
    operationMapSha256: sha256(OPERATION_MAP_PATH),
    runtimeEvidenceSha256: runtimeEvidence ? sha256(RUNTIME_EVIDENCE_PATH) : null,
  },
  scope:
    'Scenario expectations for the 15 tracked product domains. Runtime status is included only when the aggregate report or the scenario-specific sidecar has a matching source HEAD and current source hashes; it is not user acceptance or backend certification.',
  summary: {
    domains: domains.length,
    trackedOperations: tracking.operations.length,
    exactHandlerMappings: operationMap.summary.exactMethodPathMatches,
    operationsWithDirectSharedHandlerTestReferences:
      operationMap.summary.operationsWithDirectTestReferences,
    scenariosDefined: scenarioCount,
    scenarioRowsWithFreshBrowserEvidence: scenarioRowsWithRuntimeEvidence.length,
    scenarioRowsFullyCoveredByFreshBrowserEvidence: fullyVerifiedScenarioRows.length,
    uniqueOperationsWithFreshBrowserEvidence: runtimeVerifiedOperationIds.size,
    runtimeEvidenceFresh,
    currentHead,
    runtimeEvidenceRevision,
    freshScenarioEvidenceSidecars: scenarioEvidenceArtifactResults.filter((item) => item.fresh)
      .length,
    registeredScenarioEvidenceSidecars: scenarioEvidenceArtifactResults.length,
    historicalBaselineScenarioEvidenceSidecars: scenarioEvidenceArtifactResults.filter(
      (item) => item.historicalBaselineEvidence,
    ).length,
    historicalBaselineSidecarsWithCurrentSourceHashes: scenarioEvidenceArtifactResults.filter(
      (item) => item.historicalBaselineEvidence && item.sourceHashesMatchCurrent,
    ).length,
    sourceHashStaleScenarioEvidenceSidecars: scenarioEvidenceArtifactResults.filter(
      (item) => item.sourceHashMismatches.length > 0,
    ).length,
    financialDomainsWithPendingUnknownDuplicateCases: Object.keys(financialFlows).sort(),
  },
  stateDefinitions: {
    success: 'Successful response with populated data or receipt.',
    empty: 'Successful response with zero applicable records.',
    loading: 'Request remains in flight and the UI communicates that state.',
    error: 'Recoverable transport/server failure with a visible retry path.',
    unauthorized: 'HTTP 401 for secured operations.',
    forbidden: 'HTTP 403 for secured operations.',
    pending:
      'A contract-supported pending status or an in-flight mutation; keep these semantics distinct.',
    unknown:
      'Transport response loss after a mutation; outcome remains unconfirmed until a read reconciliation.',
    duplicate:
      'Repeated logical intent; no duplicate resource or balance effect, according to the operation contract.',
  },
  limitations: [
    'Scenario definitions are not evidence that current mocks, pages or tests implement the expected state.',
    'Direct shared-handler test references identify mapped test call sites, not response-branch coverage.',
    'Unknown outcome is a client-observed transport ambiguity, not a value added to server status enums.',
    'Backend owners must confirm idempotency and reconciliation semantics before any operation is certified.',
    'Current browser evidence requires source HEAD to equal the executing Git HEAD and every recorded source file hash to match. Baseline-SHA evidence remains historical, even when its source hashes still match.',
    'Empty scenarios name only contract-applicable collection GET operations; reads outside each mapped empty state remain outside that scenario.',
    'No user acceptance, staging or production evidence is claimed.',
  ],
  domains,
  reconciliation: {
    runtimeEvidence: runtimeEvidence ? RUNTIME_EVIDENCE_PATH : null,
    runtimeEvidenceFresh,
    runtimeEvidenceRevision,
    currentHead,
    scenarioEvidenceArtifacts: scenarioEvidenceArtifactResults,
    errors,
  },
};

if (errors.length > 0) {
  console.error(JSON.stringify({ errors }, null, 2));
  process.exit(1);
}

const prettierOptions = (await prettier.resolveConfig(OUTPUT)) ?? {};
const serialized = await prettier.format(`${JSON.stringify(report, null, 2)}\n`, {
  ...prettierOptions,
  parser: 'json',
});
if (mode === '--check') {
  if (!fs.existsSync(OUTPUT) || fs.readFileSync(OUTPUT, 'utf8') !== serialized) {
    console.error('A06 scenario matrix is stale. Run with --write to refresh it.');
    process.exit(1);
  }
  console.log(
    `A06 scenario matrix is current: ${domains.length} domains, ${tracking.operations.length} operations, ${scenarioCount} expectations.`,
  );
} else {
  fs.writeFileSync(OUTPUT, serialized);
  console.log(
    `Wrote ${path.relative(ROOT, OUTPUT)}: ${domains.length} domains, ${tracking.operations.length} operations, ${scenarioCount} expectations.`,
  );
}
