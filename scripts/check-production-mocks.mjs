import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const distRoot = join(process.cwd(), 'dist');
const forbiddenMarkers = [
  // Các marker này bảo vệ production artifact khỏi legacy data/demo bị import
  // lại qua một route mới trong tương lai.
  'arenaData',
  'marketOverviewData',
  'marketP1Data',
  'marketP2Data',
  'marketP3Data',
  'referralData',
  'launchpadData',
  'launchpad-legacy-fixtures',
  'mockData',
  'predictionMockData',
  'ACTIVE_BOTS',
  'CopyAuditLogPage',
  'SLIPPAGE_DATA',
  'COST_ATTRIBUTION',
  'TRADE_COMPARISON',
  'PerformanceAttributionPage',
  'PositionDashboardPage',
  'LaunchpadAirdropClaimPage',
  'LaunchpadLPMonitorPage',
  'LaunchpadVestingTrackerPage',
  'LaunchpadWhitelistCheckerPage',
  'PreCopyAssessmentPage',
  'ProviderComparisonPage',
  'RegisterPage',
  'WebRegisterForm',
  'DerivativesOverviewPage',
  'MarketCalendarPage',
  'MarketCorrelationsPage',
  'MarketNewsPage',
  'PortfolioTrackerPage',
  'SocialSentimentPage',
  'SocialSignalsPage',
  'TokenUnlocksPage',
  'P2PContributionHistoryPage',
  'P2PInsuranceFundPage',
  'P2PKYCStatusPage',
  'P2POrderPage',
  'P2PSecurityCenterPage',
  'P2PWalletPage',
  'ChartTestPage',
  'SavingsBacktestPage',
  'WebArenaHomePage',
  'RouteChecker',
  'PerformanceMonitor',
  'DCAPortfolioOptimizer',
  'DEVONLYSECRET',
  'dev-only-in-memory-token',
  'msw/browser',
  'setupWorker',
  'INITIAL_DCA_PLANS',
  'TEST_PRICES',
  'generateTestPurchaseHistory',
  'generateTestPortfolioHistory',
  'getTestDcaSnapshot',
  'DCA test runtime is not initialized',
];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(path)));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) files.push(path);
  }
  return files;
}

const files = await collectFiles(distRoot);
const violations = [];
for (const file of files) {
  const contents = await readFile(file, 'utf8');
  for (const marker of forbiddenMarkers) {
    if (contents.includes(marker)) violations.push(`${file}: ${marker}`);
  }
}

if (violations.length > 0) {
  console.error('Production mock gate failed: development mock markers were found in dist.');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Production mock gate passed: ${files.length} JavaScript files inspected.`);
