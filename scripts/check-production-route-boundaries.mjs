import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const repositoryRoot = process.cwd();
const routeConfigPath = join(repositoryRoot, 'src', 'app', 'routeConfig.ts');
const routesPath = join(repositoryRoot, 'src', 'app', 'routes.ts');
const p2pRoutesPath = join(repositoryRoot, 'src', 'app', 'routes', 'p2pProtectedRoutes.ts');
const tradingRoutesPath = join(repositoryRoot, 'src', 'app', 'routes', 'tradingProtectedRoutes.ts');
const walletProfileRoutesPath = join(
  repositoryRoot,
  'src',
  'app',
  'routes',
  'walletProfileProtectedRoutes.ts',
);
const inventoryPath = join(repositoryRoot, 'docs', 'architecture', 'page-inventory.json');
const source = await readFile(routeConfigPath, 'utf8');
const routesSource = await readFile(routesPath, 'utf8');
const p2pRoutesSource = await readFile(p2pRoutesPath, 'utf8');
const tradingRoutesSource = await readFile(tradingRoutesPath, 'utf8');
const walletProfileRoutesSource = await readFile(walletProfileRoutesPath, 'utf8');
const protectedRouteBindings = `${source}\n${p2pRoutesSource}\n${tradingRoutesSource}\n${walletProfileRoutesSource}`;
const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));

// Những page này còn dùng mock/simulation hoặc chưa có contract giao dịch hoàn chỉnh.
// Route vẫn tồn tại để không phá public URL, nhưng production chỉ được trỏ tới boundary an toàn.
const protectedPages = [
  'AdminHome',
  'AnalyticsDashboard',
  'ABTestDashboard',
  'FunnelDashboard',
  'ConvertPage',
  'FuturesPage',
  'LeveragePage',
  'RiskManagementDemoPage',
  'ExecutionQualityDemoPage',
  'AdvancedToolsDemoPage',
  'MarginTradingPage',
  'AdvancedTradingDemoPage',
  'MarketDataAnalyticsPage',
  'MarginTradingHubPage',
  'LiveMarketDataAnalyticsPage',
  'AdvancedAnalyticsPage',
  'PositionDashboardPage',
  'WalletMultiManagerPage',
  'WalletTokenApprovalPage',
  'BuyCryptoPage',
  'WalletGasOptimizerPage',
  'WalletHealthScorePage',
  'PendingDepositsPage',
  'NetworkStatusPage',
  'P2POrderBookPage',
  'P2PWalletTransferPage',
  'P2PMerchantApplyPage',
  'P2PDisputePage',
  'P2PDisputeEvidencePage',
  'P2PDisputeResolutionPage',
  'P2PInsurancePolicyPage',
  'P2PInsuranceScorePage',
  'P2PInsuranceCertificatePage',
  'P2PSettingsPage',
  'P2PNotificationsSettingsPage',
  'P2PE2EInfoPage',
  'P2PSelfieVerificationPage',
  'P2PVideoVerificationPage',
  'P2PSuspiciousActivityPage',
  'P2PFundLockHistoryPage',
  'P2PTransactionLimitsPage',
  'P2PLimitTrackerPage',
  'P2PAMLScreeningPage',
  'P2PSourceOfFundsPage',
  'P2PLargeTransactionJustificationPage',
  'P2PPaymentMethodVerificationPage',
  'P2PPaymentMethodOwnershipPage',
  'P2PPaymentMethodCoolingPeriodPage',
  'P2PPaymentMethodHistoryPage',
  'P2PRiskAssessmentPage',
  'P2PComplianceOverviewPage',
  'PredictionPortfolioAnalyzerPage',
  'PredictionTournamentsPage',
  'LaunchpadStakingPage',
  'LaunchpadReceiptPage',
  'LaunchpadSwapAggregatorPage',
  'P2PInsuranceFundPage',
  'P2PClaimDetailPage',
  'P2PContributionHistoryPage',
  'P2PKYCStatusPage',
  'P2PIdentityVerificationPage',
  'P2PAddressProofPage',
  'P2PSecurityCenterPage',
  'P2PDeviceManagementPage',
  'P2PAntiPhishingCodePage',
  'P2PLoginHistoryPage',
  'P2PWalletPage',
  'P2PEscrowBalancePage',
  'P2PTaxReportingPage',
  'CopyPerformancePage',
  'CopyNotificationsPage',
  'PerformanceAttributionPage',
  'CopyAuditLogPage',
  'ProviderApplicationPage',
  'CopySettingsPage',
  'SafetyEducationPage',
  'ProviderGovernancePage',
  'DisputeResolutionPage',
  'CopySafetyCenterPage',
  'RegulatoryDisclosuresPage',
  'RegulatoryReportsDashboardPage',
  'ARMIntegrationStatusPage',
  'BestExecutionReportsPage',
  'ExecutionVenueAnalysisPage',
  'ClientCategorizationPage',
  'ProductGovernancePage',
  'TargetMarketDefinitionPage',
  'ClientMoneyProtectionPage',
  'CASSReconciliationPage',
  'InvestorCompensationPage',
  'ExAnteCostsPage',
  'RIYCalculatorPage',
  'ExPostCostsReportPage',
  'KIDGeneratorPage',
  'PerformanceScenariosPage',
  'RiskIndicatorExplainerPage',
  'ComplaintsHandlingPage',
  'ComplaintSubmissionPage',
  'ComplaintTrackingPage',
  'OmbudsmanReferralPage',
  'AuditTrailPage',
  'RegulatoryInspectionReadyPage',
  'TradeHistoryExportPage',
  'BotRiskDashboardPage',
  'BotHistoryPage',
  'BotPerformanceAnalyticsPage',
  'BotBacktestingPage',
  'BotStrategyComparePage',
  'BotOptimizationPage',
  'BotPortfolioDashboardPage',
  'BotDrawdownAnalyzerPage',
  'BotEquityCurvePage',
  'BotGuidePage',
  'BotFAQPage',
  'BotTaxReportingPage',
  'BotAPIDocumentationPage',
  'TradingBotsPage',
  'UnifiedPortfolioDashboard',
  'CrossModuleAnalytics',
  'SmartAlertCenter',
  'TaxReportCenter',
  'EnterpriseStatesPage',
  'PortfolioRiskAnalysisPage',
  'TransactionReportingPage',
  'SlippageMonitoringPage',
  'WithdrawLimitsPage',
  'ApiManagementPage',
  'ApiKeyCreatePage',
  'KYCPage',
  'SettingsPage',
  'VIPPage',
  'ReferralRewardsPage',
  'RewardsHubPage',
  'BotEmergencyStopPage',
  'BotSecuritySettingsPage',
  'PredictionMarketMakerPage',
  'PredictionEventCalendarPage',
  'PredictionSocialPage',
  'PredictionDataIntegrationPage',
  'LaunchpadPortfolioPage',
  'LaunchpadPerformancePage',
  'LaunchpadIDOBridgePage',
  'LaunchpadClaimReceiptPage',
  'LaunchpadBridgeOrderPage',
  'LaunchpadBatchClaimPage',
  'LaunchpadNotifSoundPage',
  'LaunchpadWebhooksPage',
  'LaunchpadBridgeComparePage',
  'LaunchpadEventLogPage',
  'LaunchpadABIDiffPage',
  'LaunchpadAddressBookPage',
  'LaunchpadGasTrackerPage',
  'LaunchpadRebalancePage',
  'LaunchpadMultisigPage',
  'LaunchpadLimitOrdersPage',
  'LaunchpadDCABuilderPage',
  'LaunchpadRiskAnalyticsPage',
];

const protectedShellPages = [
  'WebTradingBotsPage',
  'OnboardingFlow',
  'ShellTemplatePage',
  'WebBotFAQPage',
  'WebBotGuidePage',
  'WebBotBacktestingPage',
  'WebBotHistoryPage',
  'WebBotPerformanceAnalyticsPage',
  'WebBotRiskDashboardPage',
  'WebBotPortfolioDashboardPage',
  'WebBotStrategyComparePage',
  'WebBotOptimizationPage',
  'WebBotDrawdownAnalyzerPage',
  'WebBotEquityCurvePage',
  'WebBotTaxReportingPage',
  'WebBotAPIDocumentationPage',
  'WebRegisterPage',
  'WebBotRiskDisclosurePage',
  'WebBotTermsOfServicePage',
  'WebBotSuitabilityAssessmentPage',
  'WebBotEmergencyStopPage',
  'WebBotSecuritySettingsPage',
  'WebDeviceTrustPage',
  'WebAntiPhishingSetupPage',
  'WebPasskeySetupPage',
  'WebLoginActivityPage',
  'WebSessionManagementPage',
  'WebSecurityAlertDetailPage',
  'WebSecurityAlertListPage',
  'WebTwoFAManagementPage',
  'WebDeviceTrustDetailPage',
  'WebArenaHomePage',
  'WebSecurityAuditPage',
  'WebSecurityNotificationsPage',
];

// Một số web-shell route dùng tên component khác tên file legacy.
const protectedInventoryAliases = new Set(['P2POrderPage']);

async function isDevelopmentCompatibilityShim(page) {
  if (!page.path.startsWith('src/app/pages/')) return false;
  const relativePath = page.path.slice('src/app/pages/'.length).replace(/\.(?:tsx?|jsx?)$/, '');
  const extension = page.path.match(/\.[^.]+$/)?.[0] ?? '';
  const expectedTarget = `src/dev/legacy/${relativePath}${extension}`;
  if (!page.developmentTargets?.includes(expectedTarget)) return false;

  const compatibilityPath = `@/dev/legacy/${relativePath}`;
  const pageSource = await readFile(join(repositoryRoot, page.path), 'utf8');
  const exports = [
    ...pageSource.matchAll(/export\s+(?:\*|\{\s*default\s*\})\s+from\s+['"]([^'"]+)['"]/g),
  ].map((match) => match[1]);
  return (
    exports.length >= 1 &&
    exports.length <= 2 &&
    exports.every((target) => target === compatibilityPath) &&
    exports.includes(compatibilityPath) &&
    /export\s+\*\s+from\s+['"]@\/dev\/legacy\//.test(pageSource)
  );
}

const developmentCompatibilityShims = new Set(
  (
    await Promise.all(
      inventory.pages
        .filter(
          (page) =>
            page.status === 'demo' &&
            page.path.startsWith('src/app/pages/') &&
            page.developmentTargets?.some((target) => target.startsWith('src/dev/legacy/')),
        )
        .map(async (page) =>
          (await isDevelopmentCompatibilityShim(page)) ? page.path : undefined,
        ),
    )
  ).filter(Boolean),
);

const violations = protectedPages.filter((pageName) => {
  const declaration = new RegExp(
    `const ${pageName}\\s*=\\s*(?:import\\.meta\\.env\\.DEV|isDevelopmentBuild)[\\s\\S]*?IntegrationPendingPage;`,
  );
  return !declaration.test(protectedRouteBindings);
});

for (const [sourcePath, routeSource] of [
  ['src/app/routeConfig.ts', source],
  ['src/app/routes.ts', routesSource],
  ['src/app/routes/p2pProtectedRoutes.ts', p2pRoutesSource],
  ['src/app/routes/tradingProtectedRoutes.ts', tradingRoutesSource],
]) {
  for (const match of routeSource.matchAll(/import\(\s*(['"])([^'"]+)\1\s*\)/g)) {
    const target = match[2];
    if (!target.startsWith('./pages/')) continue;
    const developmentOnlyRoute = inventory.routes.find(
      (route) => route.source === sourcePath && route.target === target && route.developmentOnly,
    );
    if (developmentOnlyRoute) {
      violations.push(
        `development-only route must import its dev implementation directly: ${sourcePath} -> ${target}`,
      );
    }
  }
}

const advancedDcaPaths = [
  'dca/rebalance/config',
  'dca/rebalance/:configId',
  'dca/schedule/config',
  'dca/schedule/:configId',
  'dca/portfolio-optimizer',
  'dca/dynamic-amount',
  'dca/backtester',
  'dca/multi-asset',
  'dca/performance-compare',
  'dca/smart-rules',
];
const dcaDevelopmentStart = source.indexOf('const dcaDevelopmentRoutes: RouteObject[]');
const dcaProductionStart = source.indexOf('const dcaProductionPendingRoutes: RouteObject[]');
const dcaDevelopmentBlock =
  dcaDevelopmentStart >= 0 && dcaProductionStart > dcaDevelopmentStart
    ? source.slice(dcaDevelopmentStart, dcaProductionStart)
    : '';
const dcaProductionBlock = source.match(
  /const dcaProductionPendingRoutes:\s*RouteObject\[\]\s*=\s*isDevelopmentBuild\s*\?\s*\[\]\s*:\s*\[([\s\S]*?)\n\s*\];/,
)?.[1];

if (!dcaProductionBlock || !source.includes('...dcaProductionPendingRoutes')) {
  violations.push('advanced DCA route production composition');
}
for (const routePath of advancedDcaPaths) {
  const routeLiteral = `path: '${routePath}'`;
  if (!dcaDevelopmentBlock.includes(routeLiteral)) {
    violations.push(`advanced DCA development route ${routePath}`);
  }
  if (!dcaProductionBlock?.includes(`${routeLiteral}, Component: IntegrationPendingPage`)) {
    violations.push(`advanced DCA production boundary ${routePath}`);
  }
}

for (const pageName of protectedShellPages) {
  const declaration = new RegExp(
    `const ${pageName}\\s*=\\s*(?:import\\.meta\\.env\\.DEV|isDevelopmentBuild)[\\s\\S]*?IntegrationPendingPage;`,
  );
  if (!declaration.test(`${routesSource}\n${walletProfileRoutesSource}`)) violations.push(pageName);
}

const protectedPageNames = new Set([...protectedPages, ...protectedShellPages]);
const routedMockPagesWithoutBoundary = inventory.pages
  .filter(
    (page) =>
      page.path.startsWith('src/app/pages/') &&
      !developmentCompatibilityShims.has(page.path) &&
      page.routePaths.length > 0 &&
      page.dependencies.mockReferences.length > 0,
  )
  .filter((page) => {
    const routes = inventory.routes.filter((route) => page.routePaths.includes(route.path));
    if (routes.length > 0 && routes.every((route) => route.developmentOnly)) return false;

    const fileName = page.path
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    return !protectedPageNames.has(fileName) && !protectedInventoryAliases.has(fileName);
  })
  .map((page) => page.path);

const routedMockPagesWithoutDevelopmentBoundary = inventory.pages
  .filter((page) => page.routePaths.length > 0 && page.dependencies.mockReferences.length > 0)
  .filter((page) => {
    const fileName = page.path
      .split('/')
      .pop()
      ?.replace(/\.[^.]+$/, '');
    const routes = inventory.routes.filter(
      (route) => route.component === fileName || route.target?.split('/').pop() === fileName,
    );
    return routes.length === 0 || routes.some((route) => !route.developmentOnly);
  })
  .map((page) => `routed mock page is not development-only: ${page.path}`);
violations.push(...routedMockPagesWithoutDevelopmentBoundary);

const routedDemoPagesWithoutDevelopmentBoundary = inventory.pages
  .filter((page) => page.status === 'demo' && page.routePaths.length > 0)
  .flatMap((page) => {
    const routes = inventory.routes.filter(
      (route) =>
        route.pageTarget === page.path || route.compositionTargets?.includes(page.path) === true,
    );
    if (routes.length === 0) {
      return [`routed demo page has no exact route evidence: ${page.path}`];
    }
    return routes
      .filter((route) => !route.developmentOnly)
      .map((route) => `demo page has a non-development route ${route.path}: ${page.path}`);
  });
violations.push(...routedDemoPagesWithoutDevelopmentBoundary);

for (const pagePath of routedMockPagesWithoutBoundary) {
  violations.push(`routed mock page missing boundary: ${pagePath}`);
}

if (!source.includes("from './pages/system/IntegrationPendingPage'")) {
  violations.push('IntegrationPendingPage import');
}
if (!routesSource.includes("from './pages/system/IntegrationPendingPage'")) {
  violations.push('routes.ts IntegrationPendingPage import');
}
if (!source.includes("from './config/env'") || !source.includes('isDevelopmentBuild')) {
  violations.push('routeConfig.ts environment boundary import');
}
if (!routesSource.includes("from './config/env'") || !routesSource.includes('isDevelopmentBuild')) {
  violations.push('routes.ts environment boundary import');
}
if (
  !routesSource.includes("import('@/features/auth/pages/PasswordResetPages')") ||
  routesSource.includes("import('./pages/web/WebForgotPasswordPage')") ||
  routesSource.includes("import('./pages/web/WebResetPasswordPage')")
) {
  violations.push('web password-reset routes must use the contract-backed auth feature');
}

if (violations.length > 0) {
  console.error('Production route boundary check failed:');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Production route boundary check passed: ${protectedPages.length + protectedShellPages.length} explicit route guards, ${inventory.pages.filter((page) => page.routePaths.length > 0 && page.dependencies.mockReferences.length > 0).length} routed mock pages and ${inventory.pages.filter((page) => page.status === 'demo' && page.routePaths.length > 0).length} routed demo pages are development-only.`,
);
