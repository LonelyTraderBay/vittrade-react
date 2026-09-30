import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative, sep } from 'node:path';

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
  // Mock login credentials and demo controls are development-only data too.
  'Preview-123!',
  'developer@vittrade.local',
  'mfa@vittrade.local',
  'locked@vittrade.local',
  'demo@vittrade.vn',
  'wrong@test.com',
  'device@test.com',
  'Trải nghiệm Demo',
  'Đăng nhập Demo',
  'Demo flows:',
  'DỮ LIỆU MÔ PHỎNG',
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
    else files.push(path);
  }
  return files;
}

const files = await collectFiles(distRoot);
const violations = [];
const javascriptFiles = files.filter((file) => /\.(?:m?js)$/i.test(file));
for (const file of files) {
  const relativePath = relative(distRoot, file).split(sep).join('/');
  if (basename(file).toLowerCase() === 'mockserviceworker.js') {
    violations.push(`${relativePath}: forbidden development worker file path`);
  }

  if (/\.(?:m?js)$/i.test(file)) {
    const contents = await readFile(file, 'utf8');
    for (const marker of forbiddenMarkers) {
      if (contents.includes(marker)) violations.push(`${relativePath}: ${marker}`);
    }
  }

  if (basename(file).toLowerCase() === 'manifest.json') {
    const contents = await readFile(file, 'utf8');
    try {
      JSON.parse(contents);
    } catch {
      violations.push(
        `${relativePath}: invalid JSON manifest; development references cannot be checked`,
      );
      continue;
    }
    if (/mockserviceworker\.js/i.test(contents)) {
      violations.push(`${relativePath}: references forbidden mockServiceWorker.js`);
    }
  }
}

if (violations.length > 0) {
  console.error('Production mock gate failed: development files or markers were found in dist.');
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Production mock gate passed: ${files.length} output files inventoried, ${javascriptFiles.length} JavaScript files and ${files.filter((file) => basename(file).toLowerCase() === 'manifest.json').length} manifests inspected.`,
);
