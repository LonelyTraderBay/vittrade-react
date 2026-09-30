import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import prettier from 'prettier';

const origin = process.env.PREVIEW_BASE_URL || 'http://127.0.0.1:4173';
const evidenceDirectory = path.dirname(fileURLToPath(import.meta.url));
const screenshotPath = path.join(evidenceDirectory, 'preview-market-error-empty-2026-09-28.png');
const emptyScreenshotPath = path.join(evidenceDirectory, 'preview-market-empty-2026-09-28.png');
const forbiddenScreenshotPath = path.join(
  evidenceDirectory,
  'preview-market-forbidden-2026-09-28.png',
);
const earnEmptyScreenshotPath = path.join(evidenceDirectory, 'preview-earn-empty-2026-09-28.png');
const earnPendingSubscribeScreenshotPath = path.join(
  evidenceDirectory,
  'preview-earn-pending-subscribe-2026-09-28.png',
);
const earnPendingRedeemScreenshotPath = path.join(
  evidenceDirectory,
  'preview-earn-pending-redeem-2026-09-28.png',
);
const discoveryEmptyScreenshotPath = path.join(
  evidenceDirectory,
  'preview-discovery-empty-2026-09-28.png',
);
const discoverySuccessScreenshotPath = path.join(
  evidenceDirectory,
  'preview-discovery-success-2026-09-28.png',
);
const discoveryLoadingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-discovery-loading-2026-09-28.png',
);
const discoveryForbiddenScreenshotPath = path.join(
  evidenceDirectory,
  'preview-discovery-forbidden-2026-09-28.png',
);
const referralEmptyScreenshotPath = path.join(
  evidenceDirectory,
  'preview-referral-empty-2026-09-28.png',
);
const p2pEscrowPaidScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-escrow-paid-2026-09-28.png',
);
const p2pEscrowForbiddenScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-escrow-forbidden-2026-09-28.png',
);
const p2pAdOrderCreatedScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-ad-order-created-2026-09-28.png',
);
const p2pAdOrderConflictScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-ad-order-conflict-2026-09-28.png',
);
const p2pMarkPaidConflictScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-mark-paid-conflict-2026-09-28.png',
);
const p2pReleaseConflictScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-release-conflict-2026-09-28.png',
);
const p2pPendingCreateScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-pending-create-2026-09-28.png',
);
const p2pPendingMarkPaidScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-pending-mark-paid-2026-09-28.png',
);
const p2pEscrowPendingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-escrow-pending-2026-09-28.png',
);
const p2pEscrowUnauthorizedScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-escrow-unauthorized-2026-09-28.png',
);
const p2pOrdersLoadingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-orders-loading-2026-09-28.png',
);
const p2pOrdersErrorScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-orders-error-2026-09-28.png',
);
const p2pOrdersEmptyScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-orders-empty-2026-09-28.png',
);
const p2pMyOrdersAliasScreenshotPath = path.join(
  evidenceDirectory,
  'preview-p2p-my-orders-alias-empty-2026-09-28.png',
);
const walletUnauthorizedScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-unauthorized-2026-09-28.png',
);
const walletForbiddenScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-forbidden-2026-09-28.png',
);
const walletLoadingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-loading-2026-09-28.png',
);
const walletErrorScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-error-2026-09-28.png',
);
const walletSuccessScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-success-2026-09-28.png',
);
const walletEmptyScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-empty-2026-09-28.png',
);
const walletPendingTransferScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-pending-transfer-2026-09-28.png',
);
const walletPendingWithdrawalScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-pending-withdrawal-2026-09-28.png',
);
const walletPendingTransactionScreenshotPath = path.join(
  evidenceDirectory,
  'preview-wallet-pending-transaction-2026-09-28.png',
);
const tradingPendingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-pending-in-flight-2026-09-28.png',
);
const tradingEmptyOpenOrdersScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-empty-open-orders-2026-09-29.png',
);
const tradingEmptyHistoryScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-empty-history-2026-09-29.png',
);
const tradingEmptyPositionsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-empty-positions-2026-09-29.png',
);
const tradingLoadingOpenOrdersScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-loading-open-orders-2026-09-29.png',
);
const tradingLoadingHistoryScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-loading-history-2026-09-29.png',
);
const tradingLoadingPositionsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-loading-positions-2026-09-29.png',
);
const tradingLoadingPositionsErrorScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-loading-positions-error-2026-09-29.png',
);
const tradingErrorPositionsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-error-positions-2026-09-29.png',
);
const tradingUnauthorizedLoginScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-unauthorized-login-2026-09-29.png',
);
const tradingForbiddenPositionsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-trading-forbidden-positions-2026-09-29.png',
);
const adminOverviewScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-success-overview-2026-09-29.png',
);
const adminFunnelScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-success-funnel-2026-09-29.png',
);
const adminAbTestsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-success-ab-tests-2026-09-29.png',
);
const adminEmptyFunnelScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-empty-funnel-2026-09-29.png',
);
const adminEmptyAbTestsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-empty-ab-tests-2026-09-29.png',
);
const adminLoadingOverviewScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-loading-overview-2026-09-29.png',
);
const adminLoadingFunnelScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-loading-funnel-2026-09-29.png',
);
const adminLoadingAbTestsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-loading-ab-tests-2026-09-29.png',
);
const adminErrorOverviewScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-error-overview-2026-09-29.png',
);
const adminErrorFunnelScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-error-funnel-2026-09-29.png',
);
const adminErrorAbTestsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-error-ab-tests-2026-09-29.png',
);
const adminUnauthorizedLoginScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-unauthorized-login-2026-09-29.png',
);
const adminForbiddenOverviewScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-forbidden-overview-2026-09-29.png',
);
const adminForbiddenFunnelScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-forbidden-funnel-2026-09-29.png',
);
const adminForbiddenAbTestsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-forbidden-ab-tests-2026-09-29.png',
);
const adminForbiddenBeforeFixScreenshotPath = path.join(
  evidenceDirectory,
  'preview-admin-forbidden-before-fix-2026-09-29.png',
);
const arenaDiscoveryScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-success-discovery-2026-09-29.png',
);
const arenaModeScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-success-mode-2026-09-29.png',
);
const arenaChallengeScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-success-joined-challenge-2026-09-29.png',
);
const arenaEmptyChallengesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-empty-challenges-2026-09-29.png',
);
const arenaEmptyModesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-empty-modes-2026-09-29.png',
);
const arenaLoadingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-loading-discovery-2026-09-29.png',
);
const arenaErrorScreenshotPath = path.join(
  evidenceDirectory,
  'preview-arena-error-discovery-2026-09-29.png',
);
const predictionsPendingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-pending-in-flight-2026-09-28.png',
);
const predictionsSuccessEventsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-success-events-2026-09-28.png',
);
const predictionsSuccessReceiptScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-success-receipt-2026-09-28.png',
);
const predictionsEmptyEventsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-empty-events-2026-09-28.png',
);
const predictionsEmptyPortfolioScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-empty-portfolio-2026-09-28.png',
);
const predictionsLoadingScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-loading-2026-09-28.png',
);
const predictionsErrorScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-error-2026-09-28.png',
);
const predictionsUnauthorizedScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-unauthorized-2026-09-28.png',
);
const predictionsForbiddenScreenshotPath = path.join(
  evidenceDirectory,
  'preview-predictions-forbidden-2026-09-28.png',
);
const profileSuccessEditPermissionScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-success-edit-permission-2026-09-28.png',
);
const profileSuccessDevicesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-success-devices-2026-09-28.png',
);
const profileSuccessActivityScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-success-activity-2026-09-28.png',
);
const profileSuccessSubAccountsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-success-subaccounts-2026-09-28.png',
);
const profileEmptyDevicesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-empty-devices-2026-09-28.png',
);
const profileEmptyActivityScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-empty-activity-2026-09-28.png',
);
const profileEmptySubAccountsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-empty-subaccounts-2026-09-28.png',
);
const profileLoadingProfileScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-loading-profile-2026-09-28.png',
);
const profileLoadingDevicesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-loading-devices-2026-09-28.png',
);
const profileLoadingActivityScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-loading-activity-2026-09-28.png',
);
const profileLoadingSubAccountsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-loading-subaccounts-2026-09-28.png',
);
const profileErrorProfileScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-error-profile-2026-09-28.png',
);
const profileErrorDevicesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-error-devices-2026-09-28.png',
);
const profileErrorActivityScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-error-activity-2026-09-28.png',
);
const profileErrorSubAccountsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-error-subaccounts-2026-09-28.png',
);
const profileUnauthorizedProfileScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-unauthorized-profile-2026-09-28.png',
);
const profileUnauthorizedDevicesScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-unauthorized-devices-2026-09-28.png',
);
const profileUnauthorizedActivityScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-unauthorized-activity-2026-09-28.png',
);
const profileUnauthorizedSubAccountsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-profile-unauthorized-subaccounts-2026-09-28.png',
);
const supportSuccessNewsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-success-news-2026-09-28.png',
);
const supportSuccessNotificationsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-success-notifications-2026-09-28.png',
);
const supportSuccessHelpScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-success-help-2026-09-28.png',
);
const supportSuccessTicketsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-success-tickets-2026-09-28.png',
);
const supportEmptyTicketsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-empty-tickets-2026-09-28.png',
);
const supportEmptyCreatedTicketScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-empty-created-ticket-2026-09-28.png',
);
const supportLoadingNewsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-loading-news-2026-09-28.png',
);
const supportLoadingNotificationsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-loading-notifications-2026-09-28.png',
);
const supportLoadingHelpScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-loading-help-2026-09-28.png',
);
const supportLoadingTicketsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-loading-tickets-2026-09-28.png',
);
const supportErrorNewsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-error-news-2026-09-28.png',
);
const supportErrorNotificationsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-error-notifications-2026-09-28.png',
);
const supportErrorHelpScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-error-help-2026-09-28.png',
);
const supportErrorTicketsScreenshotPath = path.join(
  evidenceDirectory,
  'preview-support-error-tickets-2026-09-28.png',
);
const reportPath = path.join(
  evidenceDirectory,
  'preview-scenario-browser-check-market-empty-2026-09-28.json',
);
const sourceFiles = [
  'docs/architecture/production-readiness/evidence/A06/run-preview-scenario-browser-check.mjs',
  'docs/architecture/production-readiness/evidence/A06/run-trading-success-browser-check.mjs',
  'docs/architecture/production-readiness/evidence/A06/trading-success-browser-check-2026-09-28.json',
  'docs/architecture/production-readiness/evidence/A06/generate-scenario-matrix.mjs',
  'src/dev/PreviewControls.tsx',
  'src/dev/mocks/browser.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/dev/mocks/scenario-runtime.ts',
  'src/features/market/api/market-api.ts',
  'src/features/market/model/market-queries.ts',
  'src/features/market/pages/MarketOverviewPage.tsx',
  'src/features/market/pages/MarketScreenerPage.tsx',
  'src/features/market/pages/WatchlistPage.tsx',
  'src/features/market/routes.ts',
  'contracts/openapi/earn.yaml',
  'contracts/openapi/predictions.yaml',
  'src/features/predictions/model/prediction-queries.ts',
  'src/features/predictions/model/prediction-types.ts',
  'src/features/predictions/pages/PredictionContractPages.tsx',
  'src/features/predictions/pages/PredictionContractPages.test.tsx',
  'src/app/routeConfig.ts',
  'src/app/router/route-contract.test.ts',
  'src/features/earn/api/earn-api.ts',
  'src/features/earn/pages/EarnHistoryPage.tsx',
  'src/features/earn/pages/EarnTransactionPages.tsx',
  'src/features/earn/pages/SavingsPortfolioPage.tsx',
  'src/features/earn/model/earn-queries.ts',
  'src/dev/mocks/earn-fixtures.ts',
  'src/features/earn/routes.ts',
  'contracts/openapi/discovery.yaml',
  'src/dev/mocks/handlers.ts',
  'src/dev/mocks/prediction-fixtures.ts',
  'src/dev/mocks/arena-fixtures.ts',
  'src/dev/mocks/arena-prediction-topics.ts',
  'contracts/openapi/arena.yaml',
  'src/features/arena/api/arena-api.ts',
  'src/features/arena/model/arena-queries.ts',
  'src/features/arena/pages/ArenaDiscoveryPage.tsx',
  'src/features/arena/pages/ArenaContractPages.tsx',
  'src/features/arena/pages/ArenaDiscoveryPage.test.tsx',
  'src/features/arena/pages/ArenaJoinContractPage.test.tsx',
  'src/features/arena/routes.ts',
  'src/features/arena/routes.test.ts',
  'src/features/discovery/api/discovery-api.ts',
  'src/features/discovery/pages/DiscoveryContractPages.tsx',
  'src/features/discovery/routes.ts',
  'src/dev/mocks/referral-fixtures.ts',
  'src/features/referral/api/referral-api.ts',
  'src/features/referral/model/referral-queries.ts',
  'src/features/referral/pages/ReferralContractPage.tsx',
  'contracts/openapi/p2p.yaml',
  'src/features/p2p/api/p2p-api-contract.ts',
  'src/features/p2p/api/p2p-api.ts',
  'src/features/p2p/api/p2p-api.test.ts',
  'src/features/p2p/model/p2p-order-action-queries.ts',
  'src/features/p2p/model/p2p-queries.ts',
  'src/features/p2p/model/p2p-queries.test.tsx',
  'src/features/p2p/model/p2p-order-queries.ts',
  'src/features/p2p/pages/P2POrdersContractPage.tsx',
  'src/features/p2p/pages/P2POrdersContractPage.test.tsx',
  'src/features/p2p/pages/P2PEscrowDetailPage.tsx',
  'src/features/p2p/pages/P2PEscrowDetailPage.test.tsx',
  'src/features/p2p/pages/P2PAdDetailContractPage.tsx',
  'src/features/p2p/pages/P2PAdDetailContractPage.test.tsx',
  'src/features/p2p/model/p2p-order-creation-queries.ts',
  'src/features/p2p/routes.ts',
  'src/app/routes/p2pProtectedRoutes.ts',
  'src/dev/PreviewControls.test.tsx',
  'src/dev/mocks/preview-scenario-handler.test.ts',
  'src/features/profile/pages/ActivityLogContractPage.test.tsx',
  'src/features/profile/pages/SubAccountContractPage.test.tsx',
  'src/features/p2p/routes.ts',
  'src/dev/mocks/trading-fixtures.ts',
  'src/app/routes.ts',
  'src/app/routes/walletProfileProtectedRoutes.ts',
  'contracts/openapi/wallet.yaml',
  'src/features/wallet/api/wallet-api.ts',
  'src/features/wallet/model/wallet-queries.ts',
  'src/features/wallet/pages/WalletOverviewContractPage.tsx',
  'src/features/wallet/pages/WalletOverviewContractPage.test.tsx',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/preview-scenario-handler.ts',
  'src/features/wallet/pages/WalletTransferContractPage.tsx',
  'src/features/wallet/pages/WithdrawPage.tsx',
  'src/features/wallet/components/WithdrawSections.tsx',
  'src/features/wallet/pages/TransactionDetailPage.tsx',
  'src/features/wallet/routes.ts',
  'contracts/openapi/profile.yaml',
  'src/features/profile/api/profile-api.ts',
  'src/features/profile/model/profile-queries.ts',
  'src/features/profile/model/profile-types.ts',
  'src/features/profile/pages/ProfileContractPage.tsx',
  'src/features/profile/pages/EditProfileContractPage.tsx',
  'src/features/profile/pages/SecurityContractPage.tsx',
  'src/features/profile/pages/ActivityLogContractPage.tsx',
  'src/features/profile/pages/DeviceManagementContractPage.tsx',
  'src/features/profile/pages/SubAccountContractPage.tsx',
  'src/features/profile/routes.ts',
  'contracts/openapi/support.yaml',
  'src/features/support/api/support-api.ts',
  'src/features/support/model/support-queries.ts',
  'src/features/support/model/support-types.ts',
  'src/features/support/pages/NewsContractPage.tsx',
  'src/features/support/pages/NotificationsContractPage.tsx',
  'src/features/support/pages/HelpCenterContractPage.tsx',
  'src/features/support/pages/SupportContractPage.tsx',
  'src/features/support/routes.ts',
  'src/dev/mocks/auth-handlers.test.ts',
  'src/features/support/pages/SupportContractPages.test.tsx',
  'src/features/support/pages/SupportWriteBoundary.test.tsx',
  'src/features/support/api/support-api.test.ts',
  'src/shared/api/query-client.ts',
  'src/shared/api/http-client.ts',
  'src/shared/session/AuthContext.tsx',
  'src/shared/ui/ErrorState.tsx',
  'contracts/openapi/trading.yaml',
  'src/features/trading/components/TradeTerminal.tsx',
  'src/features/trading/components/OpenOrdersPanel.tsx',
  'src/features/trading/components/OrderHistoryPanel.tsx',
  'src/features/trading/components/OrderModifySheet.tsx',
  'src/features/trading/model/trading-queries.ts',
  'src/features/trading/api/trading-api.ts',
  'src/features/trading/components/OrderConfirmationSheet.tsx',
  'src/features/trading/pages/OrderReceiptPage.tsx',
  'src/features/trading/pages/OrdersHistoryPage.tsx',
  'src/features/trading/pages/OpenPositionsPage.tsx',
  'contracts/openapi/admin.yaml',
  'src/dev/mocks/personas.ts',
  'src/dev/mocks/auth-handlers.test.ts',
  'src/features/admin/api/admin-api.ts',
  'src/features/admin/model/admin-queries.ts',
  'src/features/admin/routes.ts',
  'src/features/admin/pages/AdminOverviewContractPage.tsx',
  'src/features/admin/pages/AdminFunnelContractPage.tsx',
  'src/features/admin/pages/AdminAbTestsContractPage.tsx',
  'src/features/admin/pages/AdminQueryErrorState.tsx',
  'src/features/admin/pages/AdminContractPages.test.tsx',
];
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(10_000);
const externalApiOrigins = new Set();
const externalAssetOrigins = new Set();

page.on('request', (request) => {
  const url = new URL(request.url());
  if (url.protocol.startsWith('http') && url.origin !== origin) {
    if (request.headers().accept?.includes('application/json') || url.pathname.includes('/api/')) {
      externalApiOrigins.add(url.origin);
    } else {
      externalAssetOrigins.add(url.origin);
    }
  }
});

async function signInDeveloperThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function signInDemoThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('demo');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function signInSupportThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('support');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function signInAdminThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('admin');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function signInArenaThroughPreview() {
  if ((await page.getByLabel('Tài khoản xem trước').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('arena');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
}

async function navigateWithinSpa(route) {
  await page.evaluate((nextRoute) => {
    window.history.pushState({}, '', nextRoute);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, route);
  await page.waitForURL((url) => url.pathname === route);
}

try {
  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('market');

  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('market.loading').waitFor();

  const loadingResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/overview') &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/markets/overview`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Đang tải dữ liệu thị trường…').waitFor();
  const loadingResponse = await loadingResponsePromise;
  await page.getByText('Tổng vốn hóa thị trường').waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByTestId('active-preview-scenario').getByText('market.loading').waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('error');

  const errorResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/overview') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const errorResponse = await errorResponsePromise;
  try {
    await page.getByRole('button', { name: 'Thử lại' }).waitFor({ timeout: 8_000 });
  } catch (error) {
    const activeScenario = await page
      .getByTestId('active-preview-scenario')
      .innerText()
      .catch(() => 'missing');
    const storedScenario = await page.evaluate(() =>
      localStorage.getItem('vittrade.dev-preview.scenario'),
    );
    process.stderr.write(
      `Scenario debug: ${JSON.stringify({
        status: errorResponse.status(),
        activeScenario,
        storedScenario,
        body: await page.locator('body').innerText(),
      })}\n`,
    );
    throw error;
  }
  await page.getByTestId('active-preview-scenario').getByText('market.error').waitFor();
  await page.screenshot({ path: screenshotPath, fullPage: true });

  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('market.empty').waitFor();

  const emptyResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/pairs') &&
      response.request().method() === 'GET',
  );
  await page.goto(`${origin}/w/markets/screener`, { waitUntil: 'domcontentloaded' });
  const emptyResponse = await emptyResponsePromise;
  const emptyPayload = await emptyResponse.json();
  await page.getByText('Không có tài sản phù hợp.').waitFor();
  await page.getByText('0 tài sản').waitFor();
  const emptyVisibleResultCount = await page.getByText('0 tài sản').innerText();
  await page.screenshot({ path: emptyScreenshotPath, fullPage: true });
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByTestId('active-preview-scenario').getByText('market.empty').waitFor();

  const successResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/pairs') &&
      response.request().method() === 'GET',
  );
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const successResponse = await successResponsePromise;
  await page.getByText('BTC/USDT').waitFor();
  await page.getByTestId('active-preview-scenario').getByText('market.success').waitFor();

  const resetResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/pairs') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Tắt trạng thái API' }).click();
  const resetResponse = await resetResponsePromise;
  await page.getByText('BTC/USDT').waitFor();

  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');

  await page.getByLabel('Miền API').selectOption('earn');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('earn.empty').waitFor();
  await page.getByLabel('Kịch bản màn hình').selectOption('earn');

  const earnSnapshotResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/earn/snapshot') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/earn/savings/portfolio');
  const earnSnapshotResponse = await earnSnapshotResponsePromise;
  const earnSnapshotPayload = await earnSnapshotResponse.json();
  await page.getByText('Chưa có vị thế tiết kiệm').waitFor();
  await page.screenshot({ path: earnEmptyScreenshotPath, fullPage: true });

  const earnTransactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/earn/transactions') &&
      response.request().method() === 'GET',
  );
  await page.getByLabel('Kịch bản màn hình').selectOption('earnHistory');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/earn/savings/history');
  const earnTransactionsResponse = await earnTransactionsResponsePromise;
  const earnTransactionsPayload = await earnTransactionsResponse.json();
  await page.getByText('Chưa có giao dịch tiết kiệm').waitFor();

  const earnPendingHistoryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/earn/transactions') &&
      response.request().method() === 'GET',
  );
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('earn.pending').waitFor();
  const earnPendingHistoryResponse = await earnPendingHistoryResponsePromise;
  const earnPendingHistoryPayload = await earnPendingHistoryResponse.json();
  await page.getByText('Rút vốn · USDT Linh hoạt').waitFor();
  await page.getByText('Đang xử lý', { exact: true }).waitFor();

  const earnPendingSubscribeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/earn/subscriptions') &&
      response.request().method() === 'POST',
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/earn/savings/product/sav001');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/earn/savings/product/sav001');
  await page.getByLabel('Số lượng đăng ký').fill('100');
  await page.getByRole('checkbox').check();
  const subscribeButton = page.getByRole('button', { name: 'Xác nhận đăng ký' });
  if (!(await subscribeButton.isEnabled())) {
    throw new Error(`Earn subscription is not enabled: ${await page.locator('body').innerText()}`);
  }
  await subscribeButton.click();
  const earnPendingSubscribeResponse = await earnPendingSubscribeResponsePromise;
  const earnPendingSubscribePayload = await earnPendingSubscribeResponse.json();
  await page.waitForURL('**/w/earn/savings/receipt');
  await page.getByRole('heading', { name: 'Yêu cầu đang xử lý' }).waitFor();
  await page.getByRole('status').getByText('Đang xử lý').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: earnPendingSubscribeScreenshotPath, fullPage: true });

  const earnPendingRedeemResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/earn/redemptions') &&
      response.request().method() === 'POST',
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/earn/savings/redeem/earn-position-1');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/earn/savings/redeem/earn-position-1');
  await page.getByLabel('Số lượng rút').fill('50');
  const redeemButton = page.getByRole('button', { name: 'Xác nhận rút vốn' });
  if (!(await redeemButton.isEnabled())) {
    throw new Error(`Earn redemption is not enabled: ${await page.locator('body').innerText()}`);
  }
  await redeemButton.click();
  const earnPendingRedeemResponse = await earnPendingRedeemResponsePromise;
  const earnPendingRedeemPayload = await earnPendingRedeemResponse.json();
  await page.waitForURL('**/w/earn/savings/receipt');
  await page.getByRole('heading', { name: 'Yêu cầu đang xử lý' }).waitFor();
  await page.getByRole('status').getByText('Đang xử lý').waitFor();
  await page.screenshot({ path: earnPendingRedeemScreenshotPath, fullPage: true });

  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/earn/savings/history');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/earn/savings/history');
  await page.getByText('Rút vốn · USDT Linh hoạt').waitFor();
  await page.getByText('Đang xử lý', { exact: true }).waitFor();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('discovery');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  assert.equal(await page.getByLabel('Miền API').inputValue(), 'discovery');
  assert.equal(await page.getByLabel('Trạng thái phản hồi').inputValue(), 'empty');
  await page.getByLabel('Kịch bản màn hình').selectOption('discovery');
  const discoverySearchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/search') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/search');
  await page.getByPlaceholder('Tìm market, mode, creator hoặc pair…').fill('zz');
  const discoverySearchResponse = await discoverySearchResponsePromise;
  const discoverySearchPayload = await discoverySearchResponse.json();
  assert.equal(discoverySearchResponse.status(), 200);
  assert.equal(discoverySearchResponse.fromServiceWorker(), true);
  assert.deepEqual(discoverySearchPayload, {
    query: 'zz',
    predictions: [],
    arenaModes: [],
    arenaRooms: [],
    creators: [],
    tradingPairs: [],
  });
  await page.getByText('Không tìm thấy kết quả phù hợp.').waitFor();
  await page.screenshot({ path: discoveryEmptyScreenshotPath, fullPage: true });

  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('discovery.success').waitFor();
  const discoverySuccessSearchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/search') &&
      new URL(response.url()).searchParams.get('query') === 'Bitcoin' &&
      response.request().method() === 'GET',
  );
  await page.getByPlaceholder('Tìm market, mode, creator hoặc pair…').fill('Bitcoin');
  const discoverySuccessSearchResponse = await discoverySuccessSearchResponsePromise;
  const discoverySuccessSearchPayload = await discoverySuccessSearchResponse.json();
  assert.equal(discoverySuccessSearchResponse.status(), 200);
  assert.equal(discoverySuccessSearchResponse.fromServiceWorker(), true);
  assert.equal(discoverySuccessSearchPayload.query, 'bitcoin');
  assert.ok(discoverySuccessSearchPayload.predictions.length > 0);
  assert.ok(discoverySuccessSearchPayload.predictions.some((item) => /bitcoin/i.test(item.title)));
  await page.getByText(/Bitcoin reaches \$150K before July 2026/).waitFor();

  const discoveryTopicResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/topics/crypto') &&
      response.request().method() === 'GET',
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/topic/crypto');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/topic/crypto');
  const discoveryTopicResponse = await discoveryTopicResponsePromise;
  const discoveryTopicPayload = await discoveryTopicResponse.json();
  assert.equal(discoveryTopicResponse.status(), 200);
  assert.equal(discoveryTopicResponse.fromServiceWorker(), true);
  assert.equal(discoveryTopicPayload.topic.id, 'crypto');
  assert.ok(discoveryTopicPayload.predictions.length > 0);
  await page.getByRole('heading', { name: 'Crypto' }).waitFor();
  await page.getByText(/^Prediction markets \(\d+\)$/).waitFor();
  await page.screenshot({ path: discoverySuccessScreenshotPath, fullPage: true });

  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/search');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/search');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('discovery.loading').waitFor();
  const discoveryLoadingSearchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/search') &&
      new URL(response.url()).searchParams.get('query') === 'Solana' &&
      response.request().method() === 'GET',
  );
  await page.getByPlaceholder('Tìm market, mode, creator hoặc pair…').fill('Solana');
  await page.getByText('Đang tải dữ liệu Discovery API…').waitFor();
  await page.screenshot({ path: discoveryLoadingScreenshotPath, fullPage: true });
  const discoveryLoadingSearchResponse = await discoveryLoadingSearchResponsePromise;
  const discoveryLoadingSearchPayload = await discoveryLoadingSearchResponse.json();
  assert.equal(discoveryLoadingSearchResponse.status(), 200);
  assert.equal(discoveryLoadingSearchResponse.fromServiceWorker(), true);
  await page.getByText(/Solana price above \$500 by March 2026/).waitFor();

  const discoveryLoadingTopicResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/topics/macro') &&
      response.request().method() === 'GET',
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/topic/macro');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/topic/macro');
  await page.getByText('Đang tải dữ liệu Discovery API…').waitFor();
  const discoveryLoadingTopicResponse = await discoveryLoadingTopicResponsePromise;
  const discoveryLoadingTopicPayload = await discoveryLoadingTopicResponse.json();
  assert.equal(discoveryLoadingTopicResponse.status(), 200);
  assert.equal(discoveryLoadingTopicResponse.fromServiceWorker(), true);
  assert.equal(discoveryLoadingTopicPayload.topic.id, 'macro');
  await page.getByRole('heading', { name: 'Macro' }).waitFor();

  const discoveryErrorTopicResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/topics/macro') &&
      response.request().method() === 'GET' &&
      response.status() === 503,
  );
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('discovery.error').waitFor();
  const discoveryErrorTopicResponse = await discoveryErrorTopicResponsePromise;
  assert.equal(discoveryErrorTopicResponse.fromServiceWorker(), true);
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();

  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/search');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/search');
  const discoveryErrorSearchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/search') &&
      new URL(response.url()).searchParams.get('query') === 'Ethereum' &&
      response.request().method() === 'GET' &&
      response.status() === 503,
  );
  await page.getByPlaceholder('Tìm market, mode, creator hoặc pair…').fill('Ethereum');
  const discoveryErrorSearchResponse = await discoveryErrorSearchResponsePromise;
  assert.equal(discoveryErrorSearchResponse.fromServiceWorker(), true);
  await page.getByText('Có lỗi xảy ra').waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  const discoveryForbiddenSearchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/search') &&
      new URL(response.url()).searchParams.get('query') === 'Ethereum' &&
      response.request().method() === 'GET' &&
      response.status() === 403,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const discoveryForbiddenSearchResponse = await discoveryForbiddenSearchResponsePromise;
  assert.equal(discoveryForbiddenSearchResponse.fromServiceWorker(), true);
  await page.getByRole('alert').getByText('Không có quyền truy cập Discovery').waitFor();

  const discoveryForbiddenTopicResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/topics/ai') &&
      response.request().method() === 'GET' &&
      response.status() === 403,
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/topic/ai');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/topic/ai');
  const discoveryForbiddenTopicResponse = await discoveryForbiddenTopicResponsePromise;
  assert.equal(discoveryForbiddenTopicResponse.fromServiceWorker(), true);
  await page.getByRole('alert').getByText('Không có quyền truy cập Discovery').waitFor();
  await page.screenshot({ path: discoveryForbiddenScreenshotPath, fullPage: true });

  await page.getByLabel('Miền API').selectOption('market');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByLabel('Kịch bản màn hình').selectOption('markets');
  await page.getByRole('button', { name: 'Mở màn hình' }).click();
  await page.waitForURL('**/w/markets');
  await page.getByRole('button', { name: 'Theo dõi', exact: true }).click();
  await page.waitForURL('**/w/markets/watchlist');
  await page.getByText('Danh sách theo dõi').waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  const publicPairsForbiddenResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/pairs') &&
      response.request().method() === 'GET',
  );
  const forbiddenWatchlistResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/watchlist') &&
      response.request().method() === 'GET' &&
      response.status() === 403,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const [publicPairsForbiddenResponse, forbiddenWatchlistResponse] = await Promise.all([
    publicPairsForbiddenResponsePromise,
    forbiddenWatchlistResponsePromise,
  ]);
  await page.getByRole('alert').getByText('Không có quyền xem danh sách theo dõi').waitFor();
  await page.screenshot({ path: forbiddenScreenshotPath, fullPage: true });

  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  const unauthorizedWatchlistResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/market/watchlist') &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  );
  const unauthorizedRefreshResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  const [unauthorizedWatchlistResponse, unauthorizedRefreshResponse] = await Promise.all([
    unauthorizedWatchlistResponsePromise,
    unauthorizedRefreshResponsePromise,
  ]);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  const marketUnauthorizedLoginRoute = new URL(page.url()).pathname;

  await page.getByRole('button', { name: 'Tắt trạng thái API' }).click();
  await signInDeveloperThroughPreview();
  await page.getByLabel('Miền API').selectOption('discovery');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('discovery.unauthorized').waitFor();

  const discoveryUnauthorizedTopicResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/topics/community') &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  );
  const discoveryUnauthorizedTopicRefreshPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST' &&
      response.status() === 401,
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/topic/community');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/topic/community');
  const [discoveryUnauthorizedTopicResponse, discoveryUnauthorizedTopicRefresh] = await Promise.all(
    [discoveryUnauthorizedTopicResponsePromise, discoveryUnauthorizedTopicRefreshPromise],
  );
  assert.equal(discoveryUnauthorizedTopicResponse.status(), 401);
  assert.equal(discoveryUnauthorizedTopicResponse.fromServiceWorker(), true);
  assert.equal(discoveryUnauthorizedTopicRefresh.status(), 401);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  const discoveryUnauthorizedTopicLoginRoute = new URL(page.url()).pathname;

  await signInDeveloperThroughPreview();
  const discoveryUnauthorizedSearchResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/discovery/search') &&
      new URL(response.url()).searchParams.get('query') === 'Cardano' &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  );
  const discoveryUnauthorizedSearchRefreshPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST' &&
      response.status() === 401,
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/search');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/search');
  await page.getByPlaceholder('Tìm market, mode, creator hoặc pair…').fill('Cardano');
  const [discoveryUnauthorizedSearchResponse, discoveryUnauthorizedSearchRefresh] =
    await Promise.all([
      discoveryUnauthorizedSearchResponsePromise,
      discoveryUnauthorizedSearchRefreshPromise,
    ]);
  assert.equal(discoveryUnauthorizedSearchResponse.status(), 401);
  assert.equal(discoveryUnauthorizedSearchResponse.fromServiceWorker(), true);
  assert.equal(discoveryUnauthorizedSearchRefresh.status(), 401);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  const discoveryUnauthorizedSearchLoginRoute = new URL(page.url()).pathname;

  await signInDeveloperThroughPreview();
  await page.getByLabel('Miền API').selectOption('referral');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.loading').waitFor();

  const referralLoadingResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/referral/overview') &&
      response.request().method() === 'GET',
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/w/referral');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.waitForURL('**/w/referral');
  await page.getByText('Đang tải dữ liệu Referral API…').waitFor();
  const referralLoadingResponse = await referralLoadingResponsePromise;
  await page.getByText('Tháng 3 Bùng Nổ').waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  const referralSuccessResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/referral/overview') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.success').waitFor();
  const referralSuccessResponse = await referralSuccessResponsePromise;
  const referralSuccessPayload = await referralSuccessResponse.json();
  await page.getByText('Tháng 3 Bùng Nổ').waitFor();
  await page.getByText('Nguyễn Thanh T.').waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  const referralEmptyResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/referral/overview') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.empty').waitFor();
  const referralEmptyResponse = await referralEmptyResponsePromise;
  const referralEmptyPayload = await referralEmptyResponse.json();
  await page
    .getByRole('status')
    .getByText(/Chưa có người được giới thiệu/)
    .waitFor();
  await page.getByText('Tháng 3 Bùng Nổ').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: referralEmptyScreenshotPath, fullPage: true });
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();

  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  const referralErrorResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/referral/overview') &&
      response.request().method() === 'GET' &&
      response.status() === 503,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.error').waitFor();
  const referralErrorResponse = await referralErrorResponsePromise;
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  const referralForbiddenResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/referral/overview') &&
      response.request().method() === 'GET' &&
      response.status() === 403,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.forbidden').waitFor();
  const referralForbiddenResponse = await referralForbiddenResponsePromise;
  await page.getByRole('alert').getByText('Không có quyền truy cập Referral').waitFor();

  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  const referralUnauthorizedResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/referral/overview') &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  );
  const referralUnauthorizedRefreshPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST' &&
      response.status() === 401,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('referral.unauthorized').waitFor();
  const [referralUnauthorizedResponse, referralUnauthorizedRefresh] = await Promise.all([
    referralUnauthorizedResponsePromise,
    referralUnauthorizedRefreshPromise,
  ]);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  const referralUnauthorizedLoginRoute = new URL(page.url()).pathname;

  await signInDeveloperThroughPreview();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.success').waitFor();

  const p2pOrderResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/p2p/escrow/p2p002');
  await page.getByRole('button', { name: 'Start escrow release' }).waitFor();
  const p2pOrderResponse = await p2pOrderResponsePromise;
  await page.getByText('Đã thanh toán · Chờ release').waitFor();
  const p2pOrderPayload = await p2pOrderResponse.json();
  const previewPanelToggle = page.getByRole('button', { name: 'Thu gọn' });
  if ((await previewPanelToggle.count()) > 0) await previewPanelToggle.click();
  await page.screenshot({ path: p2pEscrowPaidScreenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  const p2pForbiddenFollowupRequests = [];
  const collectP2PForbiddenFollowup = (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      request.method() === 'POST' &&
      (pathname.includes('/release/challenge/') || pathname.endsWith('/release'))
    ) {
      p2pForbiddenFollowupRequests.push(pathname);
    }
  };
  page.on('request', collectP2PForbiddenFollowup);
  const p2pReleaseChallengeForbiddenResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002/release/challenge') &&
      response.request().method() === 'POST' &&
      response.status() === 403,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.forbidden').waitFor();
  await page.getByText('Đã thanh toán · Chờ release').waitFor();
  await page.getByRole('button', { name: 'Start escrow release' }).click();
  const p2pReleaseChallengeForbiddenResponse = await p2pReleaseChallengeForbiddenResponsePromise;
  const p2pReleaseChallengeForbiddenPayload = await p2pReleaseChallengeForbiddenResponse.json();
  const p2pReleaseChallengeForbiddenMessage = await page.getByRole('alert').innerText();
  await page.waitForTimeout(100);
  page.off('request', collectP2PForbiddenFollowup);
  const p2pReleaseChallengeForbiddenVerificationRequests = p2pForbiddenFollowupRequests.filter(
    (pathname) => pathname.includes('/release/challenge/'),
  );
  const p2pReleaseChallengeForbiddenReleaseRequests = p2pForbiddenFollowupRequests.filter(
    (pathname) => pathname.endsWith('/release'),
  );
  const p2pReleaseChallengeForbiddenRoute = new URL(page.url()).pathname;
  const p2pForbiddenPreviewPanelClose = page.getByRole('button', { name: 'Thu gọn' });
  if ((await p2pForbiddenPreviewPanelClose.count()) > 0)
    await p2pForbiddenPreviewPanelClose.click();
  await page.screenshot({ path: p2pEscrowForbiddenScreenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.success').waitFor();
  const p2pAdResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/ads/ad001') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/p2p/ad/ad001');
  const p2pAdResponse = await p2pAdResponsePromise;
  const p2pAdPayload = await p2pAdResponse.json();
  assert.equal(p2pAdResponse.status(), 200);
  assert.equal(p2pAdResponse.fromServiceWorker(), true);
  assert.equal(p2pAdPayload.id, 'ad001');
  await page.getByText('CryptoKing_VN', { exact: true }).waitFor();

  await page.getByLabel('Fiat amount').fill('500000');
  await page.getByRole('button', { name: 'Xem xác nhận đơn P2P' }).click();
  const p2pOrderCreateResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'POST',
  );
  const p2pCreatedOrderResponsePromise = page.waitForResponse(
    (response) =>
      /^\/api\/p2p\/orders\/dev-p2p-order-/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  );
  const p2pOrderCreateRequests = [];
  const collectP2POrderCreates = (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname.endsWith('/api/p2p/orders')
    ) {
      p2pOrderCreateRequests.push(request);
    }
  };
  page.on('request', collectP2POrderCreates);
  await page.getByRole('button', { name: 'Confirm P2P order' }).click();
  const p2pOrderCreateResponse = await p2pOrderCreateResponsePromise;
  const p2pOrderCreatePayload = await p2pOrderCreateResponse.json();
  const p2pOrderCreateRequest = p2pOrderCreateResponse.request();
  const p2pOrderCreateRequestBody = p2pOrderCreateRequest.postDataJSON();
  const p2pOrderCreateIdempotencyKey = p2pOrderCreateRequest.headers()['idempotency-key'] ?? '';
  const p2pCreatedOrderResponse = await p2pCreatedOrderResponsePromise;
  const p2pCreatedOrderPayload = await p2pCreatedOrderResponse.json();
  await page.waitForURL(`**/w/p2p/order/${p2pOrderCreatePayload.orderId}`);
  await page.getByText(`Order #${p2pCreatedOrderPayload.orderNumber}`, { exact: true }).waitFor();
  const p2pAdOrderCreatedRoute = new URL(page.url()).pathname;
  page.off('request', collectP2POrderCreates);
  assert.equal(p2pOrderCreateResponse.status(), 201);
  assert.equal(p2pOrderCreateResponse.fromServiceWorker(), true);
  assert.equal(p2pOrderCreatePayload.status, 'created');
  assert.equal(typeof p2pOrderCreatePayload.orderId, 'string');
  assert.equal(typeof p2pOrderCreatePayload.expiresAt, 'string');
  assert.equal(p2pOrderCreateRequestBody.adId, 'ad001');
  assert.equal(p2pOrderCreateRequestBody.asset, 'USDT');
  assert.equal(p2pOrderCreateRequestBody.currency, 'VND');
  assert.equal(p2pOrderCreateRequestBody.fiatAmount, 500000);
  assert.equal(p2pOrderCreateRequestBody.paymentMethod, 'Vietcombank');
  assert.ok(Math.abs(p2pOrderCreateRequestBody.amount - 500000 / 25350) < 1e-10);
  assert.match(p2pOrderCreateIdempotencyKey, /^p2p-ad-order-/);
  assert.equal(p2pOrderCreateRequests.length, 1);
  assert.equal(p2pCreatedOrderResponse.status(), 200);
  assert.equal(p2pCreatedOrderResponse.fromServiceWorker(), true);
  assert.equal(p2pCreatedOrderPayload.id, p2pOrderCreatePayload.orderId);
  assert.equal(p2pAdOrderCreatedRoute, `/w/p2p/order/${p2pOrderCreatePayload.orderId}`);
  const p2pOrderCreatedPreviewPanelClose = page.getByRole('button', { name: 'Thu gọn' });
  if ((await p2pOrderCreatedPreviewPanelClose.count()) > 0)
    await p2pOrderCreatedPreviewPanelClose.click();
  await page.screenshot({ path: p2pAdOrderCreatedScreenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('duplicate');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.duplicate').waitFor();
  const p2pConflictAdResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/ads/ad001') &&
      response.request().method() === 'GET',
  );
  const p2pOrderConflictRequests = [];
  const collectP2POrderConflicts = (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname.endsWith('/api/p2p/orders')
    ) {
      p2pOrderConflictRequests.push(request);
    }
  };
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await navigateWithinSpa('/w/p2p/ad/ad001');
  const p2pConflictAdResponse = await p2pConflictAdResponsePromise;
  assert.equal(p2pConflictAdResponse.status(), 200);
  assert.equal(p2pConflictAdResponse.fromServiceWorker(), true);
  await page.getByText('CryptoKing_VN', { exact: true }).waitFor();
  await page.getByLabel('Fiat amount').fill('500000');
  await page.getByRole('button', { name: 'Xem xác nhận đơn P2P' }).click();
  const p2pOrderConflictResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'POST',
  );
  page.on('request', collectP2POrderConflicts);
  await page.getByRole('button', { name: 'Confirm P2P order' }).click();
  const p2pOrderConflictResponse = await p2pOrderConflictResponsePromise;
  const p2pOrderConflictPayload = await p2pOrderConflictResponse.json();
  const p2pOrderConflictRequest = p2pOrderConflictResponse.request();
  const p2pOrderConflictIdempotencyKey = p2pOrderConflictRequest.headers()['idempotency-key'] ?? '';
  const p2pOrderConflictMessage =
    'Yêu cầu tạo đơn P2P bị trùng hoặc xung đột (HTTP 409). Hãy kiểm tra danh sách đơn trước khi gửi yêu cầu mới.';
  await page.getByRole('alert').getByText(p2pOrderConflictMessage, { exact: true }).waitFor();
  await page.waitForTimeout(500);
  const p2pOrderConflictRoute = new URL(page.url()).pathname;
  page.off('request', collectP2POrderConflicts);
  assert.equal(p2pOrderConflictResponse.status(), 409);
  assert.equal(p2pOrderConflictResponse.fromServiceWorker(), true);
  assert.equal(p2pOrderConflictPayload.code, 'P2P_ORDER_CONFLICT');
  assert.match(p2pOrderConflictIdempotencyKey, /^p2p-ad-order-/);
  assert.equal(p2pOrderConflictRequests.length, 1);
  assert.equal(p2pOrderConflictRoute, '/w/p2p/ad/ad001');
  const previewPanelCloseAfterConflict = page.getByRole('button', { name: 'Thu gọn' });
  if ((await previewPanelCloseAfterConflict.count()) > 0)
    await previewPanelCloseAfterConflict.click();
  await page.screenshot({ path: p2pAdOrderConflictScreenshotPath, fullPage: true });

  const p2pMarkPaidConflictRequests = [];
  const collectP2PMarkPaidConflicts = (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname.endsWith('/api/p2p/orders/p2p001/mark-paid')
    ) {
      p2pMarkPaidConflictRequests.push(request);
    }
  };
  const p2pMarkPaidConflictResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p001/mark-paid') &&
      response.request().method() === 'POST',
  );
  page.on('request', collectP2PMarkPaidConflicts);
  await navigateWithinSpa('/w/p2p/escrow/p2p001');
  await page.getByText('Chờ thanh toán').waitFor();
  await page.getByRole('button', { name: 'Mark order paid' }).waitFor();
  const p2pMarkPaidOrderRefreshResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p001') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Mark order paid' }).click();
  const p2pMarkPaidConflictResponse = await p2pMarkPaidConflictResponsePromise;
  const p2pMarkPaidConflictPayload = await p2pMarkPaidConflictResponse.json();
  const p2pMarkPaidOrderRefreshResponse = await p2pMarkPaidOrderRefreshResponsePromise;
  const p2pMarkPaidOrderRefreshPayload = await p2pMarkPaidOrderRefreshResponse.json();
  const p2pMarkPaidConflictIdempotencyKey =
    p2pMarkPaidConflictResponse.request().headers()['idempotency-key'] ?? '';
  const p2pMarkPaidConflictMessage =
    'Đơn hàng không thể chuyển sang trạng thái đã thanh toán (HTTP 409). Hãy kiểm tra trạng thái mới nhất trước khi thử lại.';
  await page.getByRole('alert').getByText(p2pMarkPaidConflictMessage, { exact: true }).waitFor();
  await page.waitForTimeout(500);
  const p2pMarkPaidConflictRoute = new URL(page.url()).pathname;
  page.off('request', collectP2PMarkPaidConflicts);
  assert.equal(p2pMarkPaidConflictResponse.status(), 409);
  assert.equal(p2pMarkPaidConflictResponse.fromServiceWorker(), true);
  assert.equal(p2pMarkPaidConflictPayload.code, 'P2P_ORDER_CONFLICT');
  assert.equal(p2pMarkPaidOrderRefreshResponse.status(), 200);
  assert.equal(p2pMarkPaidOrderRefreshResponse.fromServiceWorker(), true);
  assert.equal(p2pMarkPaidOrderRefreshPayload.status, 'pending_payment');
  assert.match(p2pMarkPaidConflictIdempotencyKey, /^p2p-mark-paid-p2p001-/);
  assert.equal(p2pMarkPaidConflictRequests.length, 1);
  assert.equal(p2pMarkPaidConflictRoute, '/w/p2p/escrow/p2p001');
  await page.screenshot({ path: p2pMarkPaidConflictScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/p2p/escrow/p2p002');
  await page.getByText('Đã thanh toán · Chờ release').waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.duplicate').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  const p2pReleaseConflictRequests = [];
  const collectP2PReleaseConflicts = (request) => {
    if (
      request.method() === 'POST' &&
      new URL(request.url()).pathname.endsWith('/api/p2p/orders/p2p002/release')
    ) {
      p2pReleaseConflictRequests.push(request);
    }
  };
  const p2pReleaseConflictOrderRefreshRequests = [];
  const collectP2PReleaseOrderRefreshes = (request) => {
    if (
      request.method() === 'GET' &&
      new URL(request.url()).pathname.endsWith('/api/p2p/orders/p2p002')
    ) {
      p2pReleaseConflictOrderRefreshRequests.push(request);
    }
  };
  const p2pDuplicateReleaseChallengeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002/release/challenge') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Start escrow release' }).click();
  const p2pDuplicateReleaseChallengeResponse = await p2pDuplicateReleaseChallengeResponsePromise;
  await page.getByLabel('Release verification code').fill('000000');
  const p2pDuplicateReleaseVerificationResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.includes('/api/p2p/orders/p2p002/release/challenge/') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Verify release code' }).click();
  const p2pDuplicateReleaseVerificationResponse =
    await p2pDuplicateReleaseVerificationResponsePromise;
  await page.getByRole('button', { name: 'Confirm escrow release' }).waitFor();
  page.on('request', collectP2PReleaseConflicts);
  page.on('request', collectP2PReleaseOrderRefreshes);
  const p2pReleaseConflictResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002/release') &&
      response.request().method() === 'POST',
  );
  const p2pReleaseConflictOrderRefreshPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Confirm escrow release' }).click();
  const p2pReleaseConflictResponse = await p2pReleaseConflictResponsePromise;
  const p2pReleaseConflictPayload = await p2pReleaseConflictResponse.json();
  const p2pReleaseConflictOrderRefreshResponse = await p2pReleaseConflictOrderRefreshPromise;
  const p2pReleaseConflictOrderRefreshPayload = await p2pReleaseConflictOrderRefreshResponse.json();
  const p2pReleaseConflictIdempotencyKey =
    p2pReleaseConflictResponse.request().headers()['idempotency-key'] ?? '';
  const p2pReleaseConflictMessage =
    'Đơn hàng không thể chuyển sang trạng thái đã release (HTTP 409). Hãy kiểm tra trạng thái mới nhất trước khi thử lại.';
  await page.getByRole('alert').getByText(p2pReleaseConflictMessage, { exact: true }).waitFor();
  await page.getByText('Đã thanh toán · Chờ release').waitFor();
  await page.waitForTimeout(500);
  const p2pReleaseConflictRoute = new URL(page.url()).pathname;
  page.off('request', collectP2PReleaseConflicts);
  page.off('request', collectP2PReleaseOrderRefreshes);
  assert.equal(p2pDuplicateReleaseChallengeResponse.status(), 201);
  assert.equal(p2pDuplicateReleaseVerificationResponse.status(), 200);
  assert.equal(p2pReleaseConflictResponse.status(), 409);
  assert.equal(p2pReleaseConflictResponse.fromServiceWorker(), true);
  assert.equal(p2pReleaseConflictPayload.code, 'P2P_ORDER_CONFLICT');
  assert.match(p2pReleaseConflictIdempotencyKey, /^p2p-escrow-release-p2p002-/);
  assert.equal(p2pReleaseConflictOrderRefreshResponse.status(), 200);
  assert.equal(p2pReleaseConflictOrderRefreshResponse.fromServiceWorker(), true);
  assert.equal(p2pReleaseConflictOrderRefreshPayload.status, 'paid');
  assert.equal(p2pReleaseConflictRequests.length, 1);
  assert.ok(p2pReleaseConflictOrderRefreshRequests.length >= 1);
  assert.equal(p2pReleaseConflictRoute, '/w/p2p/escrow/p2p002');
  await page.screenshot({ path: p2pReleaseConflictScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/p2p/order-room');
  await page.waitForURL('**/w/p2p/order-room');
  await page.getByText('My P2P orders', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Confirm escrow release' }).waitFor({ state: 'detached' });
  await navigateWithinSpa('/w/p2p/escrow/p2p002');
  await page.getByText('Đã thanh toán · Chờ release').waitFor();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.pending').waitFor();
  await page.getByText('Đã thanh toán · Chờ release').waitFor();

  await navigateWithinSpa('/w/p2p/ad/ad001');
  await page.getByRole('spinbutton', { name: 'Fiat amount' }).fill('500000');
  await page.getByRole('button', { name: 'Xem xác nhận đơn P2P' }).click();
  const p2pPendingCreateResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirm P2P order' }).click();
  await page.getByText('Đang tạo…').waitFor();
  const p2pPendingCreateButtonDisabled = await page
    .getByRole('button', { name: 'Confirm P2P order' })
    .isDisabled();
  await page.screenshot({ path: p2pPendingCreateScreenshotPath, fullPage: true });
  const p2pPendingCreateResponse = await p2pPendingCreateResponsePromise;
  const p2pPendingCreateReceipt = await p2pPendingCreateResponse.json();
  const p2pPendingCreateIdempotencyKey =
    p2pPendingCreateResponse.request().headers()['idempotency-key'] ?? '';
  await page.waitForURL(/\/w\/p2p\/order\/[^/]+$/);
  const p2pPendingCreatedOrderId = new URL(page.url()).pathname.split('/').at(-1);
  await page.getByRole('button', { name: 'Mark order paid' }).waitFor();
  const p2pPendingMarkPaidResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(
        `/api/p2p/orders/${p2pPendingCreatedOrderId}/mark-paid`,
      ) && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Mark order paid' }).click();
  await page.getByText('Đang cập nhật…').waitFor();
  const p2pPendingMarkPaidButtonDisabled = await page
    .getByRole('button', { name: 'Mark order paid' })
    .isDisabled();
  await page.screenshot({ path: p2pPendingMarkPaidScreenshotPath, fullPage: true });
  const p2pPendingMarkPaidResponse = await p2pPendingMarkPaidResponsePromise;
  const p2pPendingMarkPaidOrder = await p2pPendingMarkPaidResponse.json();
  const p2pPendingMarkPaidIdempotencyKey =
    p2pPendingMarkPaidResponse.request().headers()['idempotency-key'] ?? '';
  await page.getByText('Đã thanh toán · Chờ release').waitFor();
  await navigateWithinSpa('/w/p2p/escrow/p2p002');
  await page.getByText('Đã thanh toán · Chờ release').waitFor();

  const p2pStartReleaseButton = page.getByRole('button', { name: 'Start escrow release' });
  if (!(await p2pStartReleaseButton.isVisible().catch(() => false))) {
    const pageText = await page
      .locator('main')
      .innerText()
      .catch(() => 'main landmark unavailable');
    const visibleButtons = await page.getByRole('button').allTextContents();
    throw new Error(
      `Expected a fresh release challenge after changing order; route=${new URL(page.url()).pathname}; main=${pageText}; buttons=${JSON.stringify(visibleButtons)}`,
    );
  }
  const p2pChallengeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002/release/challenge') &&
      response.request().method() === 'POST',
  );
  await p2pStartReleaseButton.click();
  const p2pChallengeResponse = await p2pChallengeResponsePromise;
  await page.getByLabel('Release verification code').fill('000000');
  const p2pVerificationResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.includes('/api/p2p/orders/p2p002/release/challenge/') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Verify release code' }).click();
  const p2pVerificationResponse = await p2pVerificationResponsePromise;
  await page.getByRole('button', { name: 'Confirm escrow release' }).waitFor();
  const previewPanelClose = page.getByRole('button', { name: 'Thu gọn' });
  if ((await previewPanelClose.count()) > 0) await previewPanelClose.click();
  const p2pReleaseResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002/release') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirm escrow release' }).click();
  await page.getByText('Đang release…').waitFor();
  const p2pReleaseButtonDisabled = await page
    .getByRole('button', { name: 'Confirm escrow release' })
    .isDisabled();
  await page.screenshot({ path: p2pEscrowPendingScreenshotPath, fullPage: true });
  const p2pReleaseResponse = await p2pReleaseResponsePromise;
  const p2pReleasePayload = await p2pReleaseResponse.json();
  const p2pReleaseIdempotencyKey = p2pReleaseResponse.request().headers()['idempotency-key'] ?? '';
  await page.getByText('Đã release').waitFor();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  const p2pUnauthorizedOrderResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders/p2p002') &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  );
  const p2pUnauthorizedRefreshResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST' &&
      response.status() === 401,
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.unauthorized').waitFor();
  const [p2pUnauthorizedOrderResponse, p2pUnauthorizedRefreshResponse] = await Promise.all([
    p2pUnauthorizedOrderResponsePromise,
    p2pUnauthorizedRefreshResponsePromise,
  ]);
  assert.equal(p2pUnauthorizedOrderResponse.fromServiceWorker(), true);
  assert.equal(p2pUnauthorizedRefreshResponse.fromServiceWorker(), true);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  const p2pUnauthorizedLoginRoute = new URL(page.url()).pathname;
  const staleP2POrderVisible =
    (await page.getByText(`Order #${p2pOrderPayload.orderNumber}`, { exact: true }).count()) > 0;
  await page.screenshot({ path: p2pEscrowUnauthorizedScreenshotPath, fullPage: true });

  await signInDeveloperThroughPreview();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.error').waitFor();

  const isP2POrderListError = (response) =>
    new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
    response.request().method() === 'GET' &&
    response.status() === 503;
  const p2pOrderListResponses = [];
  page.on('response', (response) => {
    if (
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'GET'
    ) {
      p2pOrderListResponses.push({
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  });
  const p2pOrdersInitialErrorResponsePromise = page.waitForResponse(isP2POrderListError);
  await navigateWithinSpa('/w/p2p/order-room');
  const p2pOrdersInitialErrorResponse = await p2pOrdersInitialErrorResponsePromise;
  await page.getByText('Unable to load P2P orders', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  const initialErrorAttemptCount = p2pOrderListResponses.length;
  assert.ok(initialErrorAttemptCount > 0, 'P2P error should be returned by the order-list API.');
  const p2pErrorPreviewPanelClose = page.getByRole('button', { name: 'Thu gọn' });
  if ((await p2pErrorPreviewPanelClose.count()) > 0) await p2pErrorPreviewPanelClose.click();
  await page.screenshot({ path: p2pOrdersErrorScreenshotPath, fullPage: true });

  assert.equal(p2pOrdersInitialErrorResponse.fromServiceWorker(), true);
  assert.equal(p2pOrdersInitialErrorResponse.status(), 503);

  const p2pOrdersRetryResponsePromise = page.waitForResponse(isP2POrderListError);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  const p2pOrdersRetryResponse = await p2pOrdersRetryResponsePromise;
  await page.getByText('Unable to load P2P orders', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Retry', exact: true }).waitFor();
  const retryResponsesExpected = initialErrorAttemptCount * 2;
  const retryResponsesDeadline = Date.now() + 10_000;
  while (
    p2pOrderListResponses.length < retryResponsesExpected &&
    Date.now() < retryResponsesDeadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.ok(
    p2pOrderListResponses.length >= retryResponsesExpected,
    'Retry should complete the same bounded request-retry cycle as the initial list load.',
  );
  const p2pOrdersRetryAttemptStatuses = p2pOrderListResponses
    .slice(initialErrorAttemptCount)
    .map((response) => response.status);
  assert.ok(
    p2pOrdersRetryAttemptStatuses.every((status) => status === 503),
    'Every retry response should continue to surface the configured 503 failure.',
  );
  const p2pOrdersRetryRoute = new URL(page.url()).pathname;
  assert.equal(p2pOrdersRetryResponse.fromServiceWorker(), true);
  assert.equal(p2pOrdersRetryResponse.status(), 503);
  assert.equal(p2pOrdersRetryRoute, '/w/p2p/order-room');

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  const p2pOrderListStartedAt = Date.now();
  const p2pOrdersResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.loading').waitFor();
  await page.getByText('Loading P2P orders API…', { exact: true }).waitFor();
  const p2pOrdersLoadingStateVisible = true;
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: p2pOrdersLoadingScreenshotPath, fullPage: true });

  const p2pOrdersResponse = await p2pOrdersResponsePromise;
  const p2pOrdersElapsedMs = Date.now() - p2pOrderListStartedAt;
  const p2pOrdersPayload = await p2pOrdersResponse.json();
  assert.equal(p2pOrdersResponse.status(), 200);
  assert.equal(p2pOrdersResponse.fromServiceWorker(), true);
  assert.equal(p2pOrdersResponse.request().method(), 'GET');
  assert.ok(p2pOrdersElapsedMs >= 1_800, 'P2P loading override should delay the read response.');
  assert.ok(Array.isArray(p2pOrdersPayload.items));
  const visibleProcessingOrder = p2pOrdersPayload.items.find((order) =>
    ['pending_payment', 'paid'].includes(order.status),
  );
  assert.ok(visibleProcessingOrder, 'P2P order list fixture should include a processing order.');
  await page.getByText('Total orders', { exact: true }).waitFor();
  await page.getByText(`#${visibleProcessingOrder.orderNumber}`, { exact: true }).waitFor();

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  const p2pOrdersEmptyResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  const p2pOrdersEmptyMutationRequests = [];
  const collectP2POrderListMutations = (request) => {
    if (new URL(request.url()).pathname.endsWith('/api/p2p/orders') && request.method() !== 'GET') {
      p2pOrdersEmptyMutationRequests.push(request.method());
    }
  };
  page.on('request', collectP2POrderListMutations);
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.empty').waitFor();
  const p2pOrdersEmptyResponse = await p2pOrdersEmptyResponsePromise;
  const p2pOrdersEmptyPayload = await p2pOrdersEmptyResponse.json();
  assert.equal(p2pOrdersEmptyResponse.fromServiceWorker(), true);
  assert.equal(p2pOrdersEmptyResponse.request().method(), 'GET');
  assert.deepEqual(p2pOrdersEmptyPayload, { items: [], total: 0 });
  await page.getByText('No P2P orders yet.', { exact: true }).waitFor();
  await page.getByText('0 orders · contract-backed', { exact: true }).waitFor();
  const p2pOrdersEmptyRoute = new URL(page.url()).pathname;
  assert.deepEqual(p2pOrdersEmptyMutationRequests, []);
  assert.equal(p2pOrdersEmptyRoute, '/w/p2p/order-room');
  page.off('request', collectP2POrderListMutations);
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: p2pOrdersEmptyScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/p2p/my-orders');
  await page.getByText('My P2P orders', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('p2p');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  const p2pMyOrdersAliasResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/p2p/orders') &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  const p2pMyOrdersAliasMutationRequests = [];
  const collectP2PMyOrdersAliasMutations = (request) => {
    if (new URL(request.url()).pathname.endsWith('/api/p2p/orders') && request.method() !== 'GET') {
      p2pMyOrdersAliasMutationRequests.push(request.method());
    }
  };
  page.on('request', collectP2PMyOrdersAliasMutations);
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('p2p.empty').waitFor();
  const p2pMyOrdersAliasResponse = await p2pMyOrdersAliasResponsePromise;
  const p2pMyOrdersAliasPayload = await p2pMyOrdersAliasResponse.json();
  assert.equal(p2pMyOrdersAliasResponse.fromServiceWorker(), true);
  assert.equal(p2pMyOrdersAliasResponse.request().method(), 'GET');
  assert.deepEqual(p2pMyOrdersAliasPayload, { items: [], total: 0 });
  await page.getByText('No P2P orders yet.', { exact: true }).waitFor();
  await page.getByText('0 orders · contract-backed', { exact: true }).waitFor();
  const p2pMyOrdersAliasRoute = new URL(page.url()).pathname;
  assert.deepEqual(p2pMyOrdersAliasMutationRequests, []);
  assert.equal(p2pMyOrdersAliasRoute, '/w/p2p/my-orders');
  page.off('request', collectP2PMyOrdersAliasMutations);
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.screenshot({ path: p2pMyOrdersAliasScreenshotPath, fullPage: true });

  await signInDeveloperThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.unauthorized').waitFor();

  const walletAssetsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/assets') &&
      response.request().method() === 'GET',
  );
  const walletTransactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transactions') &&
      response.request().method() === 'GET',
  );
  const walletUnauthorizedRefreshResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST',
  );
  await navigateWithinSpa('/w/wallet');
  const [walletAssetsResponse, walletTransactionsResponse, walletUnauthorizedRefreshResponse] =
    await Promise.all([
      walletAssetsResponsePromise,
      walletTransactionsResponsePromise,
      walletUnauthorizedRefreshResponsePromise,
    ]);
  const [walletAssetsError, walletTransactionsError] = await Promise.all([
    walletAssetsResponse.json(),
    walletTransactionsResponse.json(),
  ]);
  const walletUnauthorizedRefreshError = await walletUnauthorizedRefreshResponse.json();
  await page.waitForURL((url) => url.pathname.endsWith('/auth/login'));
  const walletUnauthorizedLoginRoute = new URL(page.url()).pathname;
  const walletStaleBalanceVisible =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletUnauthorizedScreenshotPath, fullPage: true });

  await signInDeveloperThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.forbidden').waitFor();

  const walletForbiddenAssetsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/assets') &&
      response.request().method() === 'GET' &&
      response.status() === 403,
  );
  const walletForbiddenTransactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transactions') &&
      response.request().method() === 'GET' &&
      response.status() === 403,
  );
  const walletForbiddenRefreshRequests = [];
  const collectWalletForbiddenRefresh = (request) => {
    const url = new URL(request.url());
    if (url.pathname.endsWith('/api/auth/refresh') && request.method() === 'POST') {
      walletForbiddenRefreshRequests.push(request);
    }
  };
  page.on('request', collectWalletForbiddenRefresh);
  await navigateWithinSpa('/w/wallet');
  const [walletForbiddenAssetsResponse, walletForbiddenTransactionsResponse] = await Promise.all([
    walletForbiddenAssetsResponsePromise,
    walletForbiddenTransactionsResponsePromise,
  ]);
  const [walletForbiddenAssetsError, walletForbiddenTransactionsError] = await Promise.all([
    walletForbiddenAssetsResponse.json(),
    walletForbiddenTransactionsResponse.json(),
  ]);
  await page.getByText('Unable to load wallet', { exact: true }).waitFor();
  await page.waitForTimeout(100);
  const walletForbiddenRoute = new URL(page.url()).pathname;
  const walletForbiddenBalanceVisible =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  const walletForbiddenErrorVisible = true;
  page.off('request', collectWalletForbiddenRefresh);
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletForbiddenScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.loading').waitFor();

  const walletLoadingResponses = [];
  const collectWalletLoadingResponses = (response) => {
    const url = new URL(response.url());
    if (
      response.request().method() === 'GET' &&
      (url.pathname.endsWith('/api/wallet/assets') ||
        url.pathname.endsWith('/api/wallet/transactions'))
    ) {
      walletLoadingResponses.push({
        path: url.pathname,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('response', collectWalletLoadingResponses);
  const walletLoadingAssetsRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith('/api/wallet/assets') && request.method() === 'GET',
  );
  const walletLoadingTransactionsRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith('/api/wallet/transactions') &&
      request.method() === 'GET',
  );
  const walletLoadingAssetsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/assets') &&
      response.request().method() === 'GET',
  );
  const walletLoadingTransactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transactions') &&
      response.request().method() === 'GET',
  );
  const walletLoadingStartedAt = Date.now();
  await navigateWithinSpa('/w/wallet');
  await Promise.all([walletLoadingAssetsRequestPromise, walletLoadingTransactionsRequestPromise]);
  const walletLoadingText = page.getByText('Loading wallet API…', { exact: true });
  await walletLoadingText.waitFor({ state: 'visible' });
  const walletLoadingVisibleBeforeResponses = walletLoadingResponses.length === 0;
  const walletLoadingBalanceVisibleBeforeResponses =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  await page.waitForTimeout(100);
  const walletStillLoadingBeforeResponses = await walletLoadingText.isVisible();
  const walletLoadingResponseCountBeforeResponses = walletLoadingResponses.length;
  await page.screenshot({ path: walletLoadingScreenshotPath, fullPage: true });
  const [walletLoadingAssetsResponse, walletLoadingTransactionsResponse] = await Promise.all([
    walletLoadingAssetsResponsePromise,
    walletLoadingTransactionsResponsePromise,
  ]);
  const [walletLoadingAssetsPayload, walletLoadingTransactionsPayload] = await Promise.all([
    walletLoadingAssetsResponse.json(),
    walletLoadingTransactionsResponse.json(),
  ]);
  const walletLoadingElapsedMs = Date.now() - walletLoadingStartedAt;
  await page.getByText('$16,754.32', { exact: true }).first().waitFor({ state: 'visible' });
  const walletLoadingVisibleAfterResponses = await walletLoadingText.isVisible();
  const walletLoadingBalanceVisibleAfterResponses =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  const walletLoadingFalseEmptyStateVisible =
    (await page.getByText('No assets match this filter.', { exact: true }).count()) > 0;
  const walletLoadingErrorVisibleAfterResponses =
    (await page.getByText('Unable to load wallet', { exact: true }).count()) > 0;
  const walletLoadingRoute = new URL(page.url()).pathname;
  page.off('response', collectWalletLoadingResponses);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.error').waitFor();

  const walletErrorRequests = [];
  const walletErrorResponses = [];
  const walletErrorRefreshRequests = [];
  const collectWalletErrorRequest = (request) => {
    const url = new URL(request.url());
    if (
      request.method() === 'GET' &&
      (url.pathname.endsWith('/api/wallet/assets') ||
        url.pathname.endsWith('/api/wallet/transactions'))
    ) {
      walletErrorRequests.push({ path: url.pathname, method: request.method() });
    }
    if (url.pathname.endsWith('/api/auth/refresh') && request.method() === 'POST') {
      walletErrorRefreshRequests.push(request);
    }
  };
  const collectWalletErrorResponse = (response) => {
    const url = new URL(response.url());
    if (
      response.request().method() === 'GET' &&
      (url.pathname.endsWith('/api/wallet/assets') ||
        url.pathname.endsWith('/api/wallet/transactions'))
    ) {
      walletErrorResponses.push({
        path: url.pathname,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  const countWalletErrorResponses = (responses, pathname) =>
    responses.filter((response) => response.path.endsWith(pathname)).length;
  page.on('request', collectWalletErrorRequest);
  page.on('response', collectWalletErrorResponse);
  const walletErrorInitialResponsesPromise = new Promise((resolve) => {
    const waitForInitialRetries = () => {
      const assetsRetries = countWalletErrorResponses(walletErrorResponses, '/api/wallet/assets');
      const transactionRetries = countWalletErrorResponses(
        walletErrorResponses,
        '/api/wallet/transactions',
      );
      if (assetsRetries >= 2 && transactionRetries >= 2) {
        page.off('response', waitForInitialRetries);
        resolve();
      }
    };
    page.on('response', waitForInitialRetries);
  });
  const walletErrorStartedAt = Date.now();
  await navigateWithinSpa('/w/wallet');
  await Promise.all([
    walletErrorInitialResponsesPromise,
    page.getByText('Unable to load wallet', { exact: true }).waitFor(),
    page.getByRole('button', { name: 'Thử lại', exact: true }).waitFor(),
  ]);
  const walletErrorInitialElapsedMs = Date.now() - walletErrorStartedAt;
  await page.waitForTimeout(100);
  const walletErrorInitialResponses = [...walletErrorResponses];
  const walletErrorInitialErrorVisible =
    (await page.getByText('Unable to load wallet', { exact: true }).count()) === 1;
  const walletErrorRetryActionVisible =
    (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) === 1;
  const walletErrorStaleBalanceVisibleBeforeRetry =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  const walletErrorSummaryVisibleBeforeRetry =
    (await page.getByText('Total balance', { exact: true }).count()) > 0;
  const walletErrorRouteBeforeRetry = new URL(page.url()).pathname;
  const walletErrorRetryResponseCountBefore = walletErrorResponses.length;
  const walletErrorAssetRetryTarget =
    countWalletErrorResponses(walletErrorResponses, '/api/wallet/assets') + 6;
  const walletErrorTransactionRetryTarget =
    countWalletErrorResponses(walletErrorResponses, '/api/wallet/transactions') + 6;
  const walletErrorRetryResponsesPromise = new Promise((resolve) => {
    const waitForManualRetry = () => {
      const assetsRetries = countWalletErrorResponses(walletErrorResponses, '/api/wallet/assets');
      const transactionRetries = countWalletErrorResponses(
        walletErrorResponses,
        '/api/wallet/transactions',
      );
      if (
        assetsRetries >= walletErrorAssetRetryTarget &&
        transactionRetries >= walletErrorTransactionRetryTarget
      ) {
        page.off('response', waitForManualRetry);
        resolve();
      }
    };
    page.on('response', waitForManualRetry);
  });
  const walletErrorTitle = page.getByText('Unable to load wallet', { exact: true });
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
  const walletErrorVisibleDuringRetry = await walletErrorTitle.isVisible();
  await walletErrorRetryResponsesPromise;
  await walletErrorTitle.waitFor({ state: 'visible' });
  await page.waitForTimeout(100);
  const walletErrorRetryResponses = walletErrorResponses.slice(walletErrorRetryResponseCountBefore);
  const walletErrorRetryErrorVisible =
    (await page.getByText('Unable to load wallet', { exact: true }).count()) === 1;
  const walletErrorRetryActionStillVisible =
    (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) === 1;
  const walletErrorStaleBalanceVisibleAfterRetry =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  const walletErrorSummaryVisibleAfterRetry =
    (await page.getByText('Total balance', { exact: true }).count()) > 0;
  const walletErrorRouteAfterRetry = new URL(page.url()).pathname;
  page.off('request', collectWalletErrorRequest);
  page.off('response', collectWalletErrorResponse);
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletErrorScreenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  const walletSuccessAssetsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/assets') &&
      response.request().method() === 'GET',
  );
  const walletSuccessTransactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transactions') &&
      response.request().method() === 'GET',
  );
  const walletSuccessStartedAt = Date.now();
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.success').waitFor();
  const [walletSuccessAssetsResponse, walletSuccessTransactionsResponse] = await Promise.all([
    walletSuccessAssetsResponsePromise,
    walletSuccessTransactionsResponsePromise,
  ]);
  const [walletSuccessAssetsPayload, walletSuccessTransactionsPayload] = await Promise.all([
    walletSuccessAssetsResponse.json(),
    walletSuccessTransactionsResponse.json(),
  ]);
  await page.getByText('Total balance', { exact: true }).waitFor();
  await page.getByText('$16,754.32', { exact: true }).first().waitFor();
  await page.getByText('Recent activity', { exact: true }).waitFor();
  const walletSuccessRoute = new URL(page.url()).pathname;
  const walletSuccessTotalBalanceVisible =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  const walletSuccessRecentActivityVisible =
    (await page.getByText('Recent activity', { exact: true }).count()) === 1;
  const walletSuccessDepositActionVisible =
    (await page.getByRole('button', { name: 'Deposit', exact: true }).count()) === 1;
  const walletSuccessHistoryActionVisible =
    (await page.getByRole('button', { name: 'Transaction history', exact: true }).count()) === 1;
  const walletSuccessWithdrawActionVisible =
    (await page.getByRole('button', { name: 'Withdraw', exact: true }).count()) > 0;
  const walletSuccessTransferActionVisible =
    (await page.getByRole('button', { name: 'Transfer', exact: true }).count()) > 0;
  const walletSuccessErrorVisible =
    (await page.getByText('Unable to load wallet', { exact: true }).count()) > 0;
  const walletSuccessElapsedMs = Date.now() - walletSuccessStartedAt;
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletSuccessScreenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  const walletEmptyAssetsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/assets') &&
      response.request().method() === 'GET',
  );
  const walletEmptyTransactionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transactions') &&
      response.request().method() === 'GET',
  );
  const walletEmptyStartedAt = Date.now();
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.empty').waitFor();
  const [walletEmptyAssetsResponse, walletEmptyTransactionsResponse] = await Promise.all([
    walletEmptyAssetsResponsePromise,
    walletEmptyTransactionsResponsePromise,
  ]);
  const [walletEmptyAssetsPayload, walletEmptyTransactionsPayload] = await Promise.all([
    walletEmptyAssetsResponse.json(),
    walletEmptyTransactionsResponse.json(),
  ]);
  await page.getByText('No wallet activity yet.', { exact: true }).waitFor();
  const walletEmptyRoute = new URL(page.url()).pathname;
  const walletEmptyBalanceVisible =
    (await page.getByText('$16,754.32', { exact: true }).count()) > 0;
  const walletEmptyActivityVisible =
    (await page.getByText('No wallet activity yet.', { exact: true }).count()) === 1;
  const walletEmptyFalseAssetEmptyVisible =
    (await page.getByText('No assets match this filter.', { exact: true }).count()) > 0;
  const walletEmptyErrorVisible =
    (await page.getByText('Unable to load wallet', { exact: true }).count()) > 0;
  const walletEmptyElapsedMs = Date.now() - walletEmptyStartedAt;
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletEmptyScreenshotPath, fullPage: true });

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Tài khoản xem trước').selectOption('wallet');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('wallet');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('wallet.pending').waitFor();

  let walletPendingTransferRequestCount = 0;
  const collectWalletPendingTransferRequest = (request) => {
    if (
      new URL(request.url()).pathname.endsWith('/api/wallet/transfers') &&
      request.method() === 'POST'
    ) {
      walletPendingTransferRequestCount += 1;
    }
  };
  page.on('request', collectWalletPendingTransferRequest);
  const walletPendingTransferResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/transfers') &&
      response.request().method() === 'POST',
  );
  const walletPendingStartedAt = Date.now();
  await navigateWithinSpa('/w/wallet/transfer');
  await page.getByLabel('Transfer amount').fill('12.5');
  await page.getByRole('button', { name: 'Confirm transfer' }).click();
  const walletPendingTransferResponse = await walletPendingTransferResponsePromise;
  const walletPendingTransferPayload = await walletPendingTransferResponse.json();
  await page.getByText('Transfer pending', { exact: true }).waitFor();
  const walletPendingTransferReference = String(walletPendingTransferPayload.id);
  const walletPendingTransferAmount = await page.getByLabel('Transfer amount').inputValue();
  const walletPendingTransferButtonDisabled = await page
    .getByRole('button', { name: 'Confirm transfer' })
    .isDisabled();
  await page.waitForTimeout(250);
  page.off('request', collectWalletPendingTransferRequest);
  const walletPendingRoute = new URL(page.url()).pathname;
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletPendingTransferScreenshotPath, fullPage: true });

  const walletPendingChallengeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/withdrawals/challenge') &&
      response.request().method() === 'POST',
  );
  await navigateWithinSpa('/w/wallet/withdraw/USDT');
  await page.locator('#withdraw-amount').fill('12.5');
  await page.locator('#withdraw-address').fill('0x1234567890abcdef1234567890abcdef12345678');
  await page.getByRole('button', { name: /Tiếp tục/ }).click();
  await page.getByRole('button', { name: 'Xác minh 2FA' }).click();
  const walletPendingChallengeResponse = await walletPendingChallengeResponsePromise;
  const walletPendingVerificationResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/wallet\/withdrawals\/challenge\/[^/]+\/verify$/.test(
        new URL(response.url()).pathname,
      ) && response.request().method() === 'POST',
  );
  const walletPendingWithdrawalResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/wallet/withdrawals') &&
      response.request().method() === 'POST',
  );
  await page.getByLabel(/Mã xác minh/i).fill('000000');
  await page.getByRole('button', { name: 'Xác nhận rút tiền' }).click();
  const [walletPendingVerificationResponse, walletPendingWithdrawalResponse] = await Promise.all([
    walletPendingVerificationResponsePromise,
    walletPendingWithdrawalResponsePromise,
  ]);
  const walletPendingWithdrawalPayload = await walletPendingWithdrawalResponse.json();
  const walletPendingWithdrawalReference = String(walletPendingWithdrawalPayload.id);
  const walletPendingTransactionId = String(walletPendingWithdrawalPayload.transactionId);
  await page.getByText(walletPendingWithdrawalReference, { exact: true }).waitFor();
  await page.getByText(walletPendingTransactionId, { exact: true }).waitFor();
  const walletPendingWithdrawalRoute = new URL(page.url()).pathname;
  const walletPendingWithdrawalStatusVisible =
    (await page.getByText('Đang xử lý', { exact: true }).count()) > 0;
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletPendingWithdrawalScreenshotPath, fullPage: true });

  const walletPendingTransactionResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(
        `/api/wallet/transactions/${walletPendingTransactionId}`,
      ) && response.request().method() === 'GET',
  );
  const walletPendingTransactionRoute = `/w/wallet/transaction/${walletPendingTransactionId}`;
  await navigateWithinSpa(walletPendingTransactionRoute);
  const walletPendingTransactionResponse = await walletPendingTransactionResponsePromise;
  const walletPendingTransactionPayload = await walletPendingTransactionResponse.json();
  await page.getByText('Rút tiền', { exact: true }).waitFor();
  await page.getByText('Đang xử lý', { exact: true }).first().waitFor();
  const walletPendingTransactionStatusVisible =
    (await page.getByText('Đang xử lý', { exact: true }).count()) > 0;
  if ((await page.getByRole('button', { name: 'Thu gọn' }).count()) > 0) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: walletPendingTransactionScreenshotPath, fullPage: true });
  const walletPendingElapsedMs = Date.now() - walletPendingStartedAt;

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.pending').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const tradingPendingOperationRequestCounts = {
    placeOrder: 0,
    modifyOrder: 0,
    cancelOrder: 0,
    listOpenOrders: 0,
    listOrderHistory: 0,
  };
  const collectTradingPendingOperations = (request) => {
    const requestUrl = new URL(request.url());
    const requestPath = requestUrl.pathname;
    const requestMethod = request.method();
    if (requestPath.endsWith('/api/trading/orders') && requestMethod === 'POST') {
      tradingPendingOperationRequestCounts.placeOrder += 1;
    } else if (requestPath.endsWith('/api/trading/orders') && requestMethod === 'GET') {
      tradingPendingOperationRequestCounts.listOpenOrders += 1;
    } else if (requestPath.endsWith('/api/trading/orders/history') && requestMethod === 'GET') {
      tradingPendingOperationRequestCounts.listOrderHistory += 1;
    } else if (/\/api\/trading\/orders\/[^/]+$/.test(requestPath) && requestMethod === 'PATCH') {
      tradingPendingOperationRequestCounts.modifyOrder += 1;
    } else if (/\/api\/trading\/orders\/[^/]+\/cancel$/.test(requestPath)) {
      tradingPendingOperationRequestCounts.cancelOrder += 1;
    }
  };
  page.on('request', collectTradingPendingOperations);
  const tradingPendingOpenOrdersResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders') &&
      response.request().method() === 'GET',
  );
  const tradingPendingInitialHistoryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders/history') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/trade/btcusdt');
  await page.getByText('BTC/USDT', { exact: true }).first().waitFor();
  const [tradingPendingOpenOrdersResponse, tradingPendingInitialHistoryResponse] =
    await Promise.all([
      tradingPendingOpenOrdersResponsePromise,
      tradingPendingInitialHistoryResponsePromise,
    ]);
  await page.getByTestId('trade-amount').fill('0.01');
  await page.getByRole('button', { name: /Đặt lệnh mua BTC\/USDT/i }).click();
  await page.getByText('Xác nhận lệnh', { exact: true }).waitFor();
  const tradingPendingRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith('/api/trading/orders') &&
      request.method() === 'POST',
  );
  const tradingPendingResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders') &&
      response.request().method() === 'POST',
  );
  const tradingPendingStartedAt = Date.now();
  await page.getByTestId('trade-confirm-submit').click();
  const tradingPendingRequest = await tradingPendingRequestPromise;
  await page.getByTestId('trade-confirm-submit').getByText('Đang đặt lệnh...').waitFor();
  const tradingPendingSubmitDisabled = await page.getByTestId('trade-confirm-submit').isDisabled();
  const tradingPendingUiObservedMs = Date.now() - tradingPendingStartedAt;
  const tradingPendingResponseStillWaiting = await Promise.race([
    tradingPendingResponsePromise.then(() => false),
    page.waitForTimeout(250).then(() => true),
  ]);
  await page.screenshot({ path: tradingPendingScreenshotPath, fullPage: true });
  const tradingPendingResponse = await tradingPendingResponsePromise;
  const tradingPendingOrder = await tradingPendingResponse.json();
  const tradingPendingResponseElapsedMs = Date.now() - tradingPendingStartedAt;
  await page.waitForURL('**/w/trade/order-receipt');
  await page.getByText(String(tradingPendingOrder.id), { exact: true }).waitFor();
  const tradingPendingReceiptRoute = new URL(page.url()).pathname;

  await navigateWithinSpa('/w/trade/btcusdt');
  await page.getByRole('tab', { name: /Đang mở/ }).click();
  await page.getByTestId(`cancel-order-${tradingPendingOrder.id}`).waitFor();
  await page.getByRole('button', { name: 'Sửa', exact: true }).click();
  await page.getByText('Sửa lệnh', { exact: true }).waitFor();
  await page.getByTestId('trade-modify-price').fill('65100');
  const tradingPendingModifyRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith(`/api/trading/orders/${tradingPendingOrder.id}`) &&
      request.method() === 'PATCH',
  );
  const tradingPendingModifyResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(`/api/trading/orders/${tradingPendingOrder.id}`) &&
      response.request().method() === 'PATCH',
  );
  const tradingPendingModifyOpenOrdersResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders') &&
      response.request().method() === 'GET',
  );
  const tradingPendingModifyStartedAt = Date.now();
  await page.getByTestId('trade-modify-submit').click();
  const tradingPendingModifyRequest = await tradingPendingModifyRequestPromise;
  await page.waitForFunction(() => {
    const button = document.querySelector('[data-testid="trade-modify-submit"]');
    return button instanceof HTMLButtonElement && button.disabled;
  });
  const tradingPendingModifyDisabledWhileInFlight = await page
    .getByTestId('trade-modify-submit')
    .isDisabled();
  const tradingPendingModifyResponseStillWaiting = await Promise.race([
    tradingPendingModifyResponsePromise.then(() => false),
    page.waitForTimeout(250).then(() => true),
  ]);
  const tradingPendingModifyResponse = await tradingPendingModifyResponsePromise;
  const tradingPendingModifiedOrder = await tradingPendingModifyResponse.json();
  const tradingPendingModifyResponseElapsedMs = Date.now() - tradingPendingModifyStartedAt;
  await page.getByText('Sửa lệnh', { exact: true }).waitFor({ state: 'hidden' });
  const tradingPendingModifyOpenOrdersResponse =
    await tradingPendingModifyOpenOrdersResponsePromise;
  const tradingPendingModifiedOpenOrdersPayload =
    await tradingPendingModifyOpenOrdersResponse.json();
  const tradingPendingModifiedOrderInOpenOrders =
    tradingPendingModifiedOpenOrdersPayload.items.some(
      (order) =>
        order.id === tradingPendingOrder.id && order.price === 65_100 && order.status === 'open',
    );
  await page.getByTestId(`cancel-order-${tradingPendingOrder.id}`).waitFor();

  const tradingPendingCancelHistoryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders/history') &&
      response.request().method() === 'GET',
  );
  const tradingPendingCancelRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith(
        `/api/trading/orders/${tradingPendingOrder.id}/cancel`,
      ) && request.method() === 'POST',
  );
  const tradingPendingCancelResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(
        `/api/trading/orders/${tradingPendingOrder.id}/cancel`,
      ) && response.request().method() === 'POST',
  );
  const tradingPendingCancelStartedAt = Date.now();
  await page.getByTestId(`cancel-order-${tradingPendingOrder.id}`).click();
  const tradingPendingCancelRequest = await tradingPendingCancelRequestPromise;
  await page.waitForFunction((testId) => {
    const button = document.querySelector(`[data-testid="${testId}"]`);
    return button instanceof HTMLButtonElement && button.disabled;
  }, `cancel-order-${tradingPendingOrder.id}`);
  const tradingPendingCancelDisabledWhileInFlight = await page
    .getByTestId(`cancel-order-${tradingPendingOrder.id}`)
    .isDisabled();
  const tradingPendingCancelResponseStillWaiting = await Promise.race([
    tradingPendingCancelResponsePromise.then(() => false),
    page.waitForTimeout(250).then(() => true),
  ]);
  const tradingPendingCancelResponse = await tradingPendingCancelResponsePromise;
  const tradingPendingCancelledOrder = await tradingPendingCancelResponse.json();
  const tradingPendingCancelResponseElapsedMs = Date.now() - tradingPendingCancelStartedAt;
  const tradingPendingCancelHistoryResponse = await tradingPendingCancelHistoryResponsePromise;
  const tradingPendingHistoryPayload = await tradingPendingCancelHistoryResponse.json();
  await page.getByRole('tab', { name: 'Lịch sử' }).click();
  await page.getByText('Đã hủy', { exact: true }).waitFor();
  const tradingPendingHistoryCancelledOrderVisible =
    (await page.getByText('Đã hủy', { exact: true }).count()) > 0;
  const tradingPendingOperationIds = Object.entries(tradingPendingOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectTradingPendingOperations);

  await page
    .getByText(`Đã hủy lệnh #${tradingPendingCancelledOrder.id.slice(-6).toUpperCase()}`, {
      exact: true,
    })
    .waitFor({ state: 'hidden' });

  const predictionsPendingOperationRequestCounts = {
    placePredictionOrder: 0,
    getPredictionOrderReceipt: 0,
  };
  const collectPredictionsPendingOperations = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath.endsWith('/api/predictions/orders') && request.method() === 'POST') {
      predictionsPendingOperationRequestCounts.placePredictionOrder += 1;
    } else if (
      /\/api\/predictions\/orders\/[^/]+$/.test(requestPath) &&
      request.method() === 'GET'
    ) {
      predictionsPendingOperationRequestCounts.getPredictionOrderReceipt += 1;
    }
  };
  page.on('request', collectPredictionsPendingOperations);
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('pending');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.pending').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const predictionsPendingEventResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/events/pred-1') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/event/pred-1');
  const predictionsPendingEventResponse = await predictionsPendingEventResponsePromise;
  const predictionsPendingEvent = await predictionsPendingEventResponse.json();
  const predictionsPendingSubmit = page.getByRole('button', { name: 'Mua Yes' });
  await predictionsPendingSubmit.waitFor();
  const predictionsPendingRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith('/api/predictions/orders') &&
      request.method() === 'POST',
  );
  const predictionsPendingResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/orders') &&
      response.request().method() === 'POST',
  );
  const predictionsPendingReceiptResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/predictions\/orders\/[^/]+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  );
  const predictionsPendingStartedAt = Date.now();
  await predictionsPendingSubmit.click();
  const predictionsPendingRequest = await predictionsPendingRequestPromise;
  await page.getByRole('button', { name: 'Đang gửi…' }).waitFor();
  const predictionsPendingSubmitDisabled = await page
    .getByRole('button', { name: 'Đang gửi…' })
    .isDisabled();
  const predictionsPendingUiObservedMs = Date.now() - predictionsPendingStartedAt;
  const predictionsPendingResponseStillWaiting = await Promise.race([
    predictionsPendingResponsePromise.then(() => false),
    page.waitForTimeout(250).then(() => true),
  ]);
  await page.screenshot({ path: predictionsPendingScreenshotPath, fullPage: true });
  const predictionsPendingResponse = await predictionsPendingResponsePromise;
  const predictionsPendingReceipt = await predictionsPendingResponse.json();
  const predictionsPendingResponseElapsedMs = Date.now() - predictionsPendingStartedAt;
  await page.waitForURL(`**/w/markets/predictions/receipt/${predictionsPendingReceipt.id}`);
  const predictionsPendingReceiptResponse = await predictionsPendingReceiptResponsePromise;
  const predictionsPendingReceiptPayload = await predictionsPendingReceiptResponse.json();
  await page.getByText(predictionsPendingReceiptPayload.status, { exact: true }).waitFor();
  const predictionsPendingReceiptRoute = new URL(page.url()).pathname;
  page.off('request', collectPredictionsPendingOperations);
  const predictionsPendingOperationIds = Object.entries(predictionsPendingOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.success').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const predictionsSuccessOperationRequestCounts = {
    listPredictionEvents: 0,
    getPredictionEvent: 0,
    listPredictionPositions: 0,
    listPredictionRewards: 0,
    listPredictionLeaderboard: 0,
    listPredictionActivity: 0,
    placePredictionOrder: 0,
    getPredictionOrderReceipt: 0,
  };
  const collectPredictionsSuccessOperations = (request) => {
    const requestPath = new URL(request.url()).pathname;
    const method = request.method();
    if (requestPath.endsWith('/api/predictions/events') && method === 'GET') {
      predictionsSuccessOperationRequestCounts.listPredictionEvents += 1;
    } else if (/\/api\/predictions\/events\/[^/]+$/.test(requestPath) && method === 'GET') {
      predictionsSuccessOperationRequestCounts.getPredictionEvent += 1;
    } else if (requestPath.endsWith('/api/predictions/positions') && method === 'GET') {
      predictionsSuccessOperationRequestCounts.listPredictionPositions += 1;
    } else if (requestPath.endsWith('/api/predictions/rewards') && method === 'GET') {
      predictionsSuccessOperationRequestCounts.listPredictionRewards += 1;
    } else if (requestPath.endsWith('/api/predictions/leaderboard') && method === 'GET') {
      predictionsSuccessOperationRequestCounts.listPredictionLeaderboard += 1;
    } else if (requestPath.endsWith('/api/predictions/activity') && method === 'GET') {
      predictionsSuccessOperationRequestCounts.listPredictionActivity += 1;
    } else if (requestPath.endsWith('/api/predictions/orders') && method === 'POST') {
      predictionsSuccessOperationRequestCounts.placePredictionOrder += 1;
    } else if (/\/api\/predictions\/orders\/[^/]+$/.test(requestPath) && method === 'GET') {
      predictionsSuccessOperationRequestCounts.getPredictionOrderReceipt += 1;
    }
  };
  page.on('request', collectPredictionsSuccessOperations);
  const predictionsSuccessStartedAt = Date.now();
  const predictionsSuccessEventsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/events') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions');
  const predictionsSuccessEventsResponse = await predictionsSuccessEventsResponsePromise;
  const predictionsSuccessEventsPayload = await predictionsSuccessEventsResponse.json();
  const predictionsSuccessEvent = predictionsSuccessEventsPayload.items.find(
    (item) => item.id === 'pred-1',
  );
  if (!predictionsSuccessEvent) throw new Error('Prediction success fixture pred-1 is missing.');
  await page.getByRole('button', { name: /Bitcoin reaches \$150K before July 2026/ }).waitFor();
  await page.screenshot({ path: predictionsSuccessEventsScreenshotPath, fullPage: true });
  await page.getByRole('button', { name: /Bitcoin reaches \$150K before July 2026/ }).click();
  await page.waitForURL('**/w/markets/predictions/event/pred-1');

  const predictionsSuccessEventResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/events/pred-1') &&
      response.request().method() === 'GET',
  );
  const predictionsSuccessEventResponse = await predictionsSuccessEventResponsePromise;
  const predictionsSuccessEventPayload = await predictionsSuccessEventResponse.json();
  await page.getByRole('heading', { name: predictionsSuccessEventPayload.title }).waitFor();
  const predictionsSuccessEventVisible = await page
    .getByRole('heading', { name: predictionsSuccessEventPayload.title })
    .isVisible();

  const predictionsSuccessOrderRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname.endsWith('/api/predictions/orders') &&
      request.method() === 'POST',
  );
  const predictionsSuccessOrderResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/orders') &&
      response.request().method() === 'POST',
  );
  const predictionsSuccessReceiptResponsePromise = page.waitForResponse(
    (response) =>
      /\/api\/predictions\/orders\/[^/]+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Mua Yes' }).click();
  const predictionsSuccessOrderRequest = await predictionsSuccessOrderRequestPromise;
  const predictionsSuccessOrderResponse = await predictionsSuccessOrderResponsePromise;
  const predictionsSuccessOrderPayload = await predictionsSuccessOrderResponse.json();
  await page.waitForURL(`**/w/markets/predictions/receipt/${predictionsSuccessOrderPayload.id}`);
  const predictionsSuccessReceiptResponse = await predictionsSuccessReceiptResponsePromise;
  const predictionsSuccessReceiptPayload = await predictionsSuccessReceiptResponse.json();
  await page.getByText(predictionsSuccessReceiptPayload.status, { exact: true }).waitFor();
  const predictionsSuccessReceiptRoute = new URL(page.url()).pathname;
  const predictionsSuccessReceiptStatusVisible = await page
    .getByText(predictionsSuccessReceiptPayload.status, { exact: true })
    .isVisible();
  await page.screenshot({ path: predictionsSuccessReceiptScreenshotPath, fullPage: true });

  const predictionsSuccessPositionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/positions') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/portfolio');
  const predictionsSuccessPositionsResponse = await predictionsSuccessPositionsResponsePromise;
  const predictionsSuccessPositionsPayload = await predictionsSuccessPositionsResponse.json();
  const predictionsSuccessFirstPosition = predictionsSuccessPositionsPayload.items[0];
  if (!predictionsSuccessFirstPosition) throw new Error('Prediction positions fixture is empty.');
  const predictionsSuccessPositionLabel = `${predictionsSuccessFirstPosition.eventId} · ${predictionsSuccessFirstPosition.outcome}`;
  await page.getByText(predictionsSuccessPositionLabel, { exact: true }).waitFor();
  const predictionsSuccessPositionVisible = await page
    .getByText(predictionsSuccessPositionLabel, { exact: true })
    .isVisible();

  const predictionsSuccessRewardsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/rewards') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/rewards');
  const predictionsSuccessRewardsResponse = await predictionsSuccessRewardsResponsePromise;
  const predictionsSuccessRewardsPayload = await predictionsSuccessRewardsResponse.json();
  const predictionsSuccessFirstReward = predictionsSuccessRewardsPayload.items[0];
  if (!predictionsSuccessFirstReward) throw new Error('Prediction rewards fixture is empty.');
  const predictionsSuccessRewardLabel = `${predictionsSuccessFirstReward.category} · ${predictionsSuccessFirstReward.eventId}`;
  await page.getByText(predictionsSuccessRewardLabel, { exact: true }).waitFor();
  const predictionsSuccessRewardVisible = await page
    .getByText(predictionsSuccessRewardLabel, { exact: true })
    .isVisible();

  const predictionsSuccessLeaderboardResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/leaderboard') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/leaderboard');
  const predictionsSuccessLeaderboardResponse = await predictionsSuccessLeaderboardResponsePromise;
  const predictionsSuccessLeaderboardPayload = await predictionsSuccessLeaderboardResponse.json();
  const predictionsSuccessFirstLeader = predictionsSuccessLeaderboardPayload.items[0];
  if (!predictionsSuccessFirstLeader) throw new Error('Prediction leaderboard fixture is empty.');
  await page.getByText(predictionsSuccessFirstLeader.user, { exact: false }).first().waitFor();
  const predictionsSuccessLeaderboardVisible = await page
    .getByText(predictionsSuccessFirstLeader.user, { exact: false })
    .first()
    .isVisible();

  const predictionsSuccessActivityResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/activity') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/activity');
  const predictionsSuccessActivityResponse = await predictionsSuccessActivityResponsePromise;
  const predictionsSuccessActivityPayload = await predictionsSuccessActivityResponse.json();
  const predictionsSuccessFirstActivity = predictionsSuccessActivityPayload.items[0];
  if (!predictionsSuccessFirstActivity) throw new Error('Prediction activity fixture is empty.');
  await page.getByText(predictionsSuccessFirstActivity.user, { exact: false }).first().waitFor();
  const predictionsSuccessActivityVisible =
    (await page.getByText(predictionsSuccessFirstActivity.user, { exact: false }).count()) > 0;
  const predictionsSuccessOperationIds = Object.entries(predictionsSuccessOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const predictionsSuccessElapsedMs = Date.now() - predictionsSuccessStartedAt;
  page.off('request', collectPredictionsSuccessOperations);

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.empty').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const predictionsEmptyOperationRequestCounts = {
    listPredictionEvents: 0,
    listPredictionPositions: 0,
    listPredictionRewards: 0,
    listPredictionLeaderboard: 0,
    listPredictionActivity: 0,
  };
  let predictionsEmptyUnexpectedPredictionRequestCount = 0;
  const collectPredictionsEmptyOperations = (request) => {
    const requestPath = new URL(request.url()).pathname;
    const method = request.method();
    if (requestPath.endsWith('/api/predictions/events') && method === 'GET') {
      predictionsEmptyOperationRequestCounts.listPredictionEvents += 1;
    } else if (requestPath.endsWith('/api/predictions/positions') && method === 'GET') {
      predictionsEmptyOperationRequestCounts.listPredictionPositions += 1;
    } else if (requestPath.endsWith('/api/predictions/rewards') && method === 'GET') {
      predictionsEmptyOperationRequestCounts.listPredictionRewards += 1;
    } else if (requestPath.endsWith('/api/predictions/leaderboard') && method === 'GET') {
      predictionsEmptyOperationRequestCounts.listPredictionLeaderboard += 1;
    } else if (requestPath.endsWith('/api/predictions/activity') && method === 'GET') {
      predictionsEmptyOperationRequestCounts.listPredictionActivity += 1;
    } else if (requestPath.includes('/api/predictions/')) {
      predictionsEmptyUnexpectedPredictionRequestCount += 1;
    }
  };
  page.on('request', collectPredictionsEmptyOperations);
  const predictionsEmptyStartedAt = Date.now();
  const predictionsEmptyEventsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/events') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions');
  const predictionsEmptyEventsResponse = await predictionsEmptyEventsResponsePromise;
  const predictionsEmptyEventsPayload = await predictionsEmptyEventsResponse.json();
  await page.getByText('Không có prediction market phù hợp.').waitFor();
  const predictionsEmptyEventsVisible = await page
    .getByText('Không có prediction market phù hợp.')
    .isVisible();
  await page.screenshot({ path: predictionsEmptyEventsScreenshotPath, fullPage: true });

  const predictionsEmptyPositionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/positions') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/portfolio');
  const predictionsEmptyPositionsResponse = await predictionsEmptyPositionsResponsePromise;
  const predictionsEmptyPositionsPayload = await predictionsEmptyPositionsResponse.json();
  await page.getByText('Chưa có vị thế.').waitFor();
  const predictionsEmptyPositionsVisible = await page.getByText('Chưa có vị thế.').isVisible();
  await page.screenshot({ path: predictionsEmptyPortfolioScreenshotPath, fullPage: true });

  const predictionsEmptyRewardsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/rewards') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/rewards');
  const predictionsEmptyRewardsResponse = await predictionsEmptyRewardsResponsePromise;
  const predictionsEmptyRewardsPayload = await predictionsEmptyRewardsResponse.json();
  await page.getByText('Chưa có phần thưởng.').waitFor();
  const predictionsEmptyRewardsVisible = await page.getByText('Chưa có phần thưởng.').isVisible();

  const predictionsEmptyLeaderboardResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/leaderboard') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/leaderboard');
  const predictionsEmptyLeaderboardResponse = await predictionsEmptyLeaderboardResponsePromise;
  const predictionsEmptyLeaderboardPayload = await predictionsEmptyLeaderboardResponse.json();
  await page.getByText('Chưa có dữ liệu bảng xếp hạng.').waitFor();
  const predictionsEmptyLeaderboardVisible = await page
    .getByText('Chưa có dữ liệu bảng xếp hạng.')
    .isVisible();

  const predictionsEmptyActivityResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/activity') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/markets/predictions/activity');
  const predictionsEmptyActivityResponse = await predictionsEmptyActivityResponsePromise;
  const predictionsEmptyActivityPayload = await predictionsEmptyActivityResponse.json();
  await page.getByText('Chưa có hoạt động dự đoán.').waitFor();
  const predictionsEmptyActivityVisible = await page
    .getByText('Chưa có hoạt động dự đoán.')
    .isVisible();
  const predictionsEmptyOperationIds = Object.entries(predictionsEmptyOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const predictionsEmptyElapsedMs = Date.now() - predictionsEmptyStartedAt;
  page.off('request', collectPredictionsEmptyOperations);

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.loading').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  // The previous success/empty checks populated React Query's cache. A full reload
  // clears that in-memory cache while keeping the selected preview scenario. The
  // mock persona is re-applied after reload because auth state is memory-backed.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await signInDeveloperThroughPreview();
  await page.getByText('developer@vittrade.local', { exact: true }).waitFor({ state: 'visible' });
  await page.getByTestId('active-preview-scenario').getByText('predictions.loading').waitFor();
  const predictionsLoadingOperationRequestCounts = {
    listPredictionEvents: 0,
    getPredictionEvent: 0,
    listPredictionPositions: 0,
    listPredictionRewards: 0,
    listPredictionLeaderboard: 0,
    listPredictionActivity: 0,
    getPredictionOrderReceipt: 0,
    placePredictionOrder: 0,
  };
  let predictionsLoadingUnexpectedPredictionRequestCount = 0;
  const predictionsLoadingObservedRequests = [];
  const collectPredictionsLoadingOperations = (request) => {
    const requestPath = new URL(request.url()).pathname;
    const method = request.method();
    if (requestPath.includes('/api/predictions/')) {
      predictionsLoadingObservedRequests.push({ method, path: requestPath });
    }
    if (requestPath.endsWith('/api/predictions/events') && method === 'GET') {
      predictionsLoadingOperationRequestCounts.listPredictionEvents += 1;
    } else if (/\/api\/predictions\/events\/[^/]+$/.test(requestPath) && method === 'GET') {
      predictionsLoadingOperationRequestCounts.getPredictionEvent += 1;
    } else if (requestPath.endsWith('/api/predictions/positions') && method === 'GET') {
      predictionsLoadingOperationRequestCounts.listPredictionPositions += 1;
    } else if (requestPath.endsWith('/api/predictions/rewards') && method === 'GET') {
      predictionsLoadingOperationRequestCounts.listPredictionRewards += 1;
    } else if (requestPath.endsWith('/api/predictions/leaderboard') && method === 'GET') {
      predictionsLoadingOperationRequestCounts.listPredictionLeaderboard += 1;
    } else if (requestPath.endsWith('/api/predictions/activity') && method === 'GET') {
      predictionsLoadingOperationRequestCounts.listPredictionActivity += 1;
    } else if (/\/api\/predictions\/orders\/[^/]+$/.test(requestPath) && method === 'GET') {
      predictionsLoadingOperationRequestCounts.getPredictionOrderReceipt += 1;
    } else if (requestPath.endsWith('/api/predictions/orders') && method === 'POST') {
      predictionsLoadingOperationRequestCounts.placePredictionOrder += 1;
      predictionsLoadingUnexpectedPredictionRequestCount += 1;
    } else if (requestPath.includes('/api/predictions/')) {
      predictionsLoadingUnexpectedPredictionRequestCount += 1;
    }
  };
  page.on('request', collectPredictionsLoadingOperations);
  const predictionsLoadingSteps = [
    {
      operationId: 'listPredictionEvents',
      route: '/w/markets/predictions',
      matches: (response) => response.url().includes('/api/predictions/events'),
    },
    {
      operationId: 'getPredictionEvent',
      route: '/w/markets/predictions/event/pred-1',
      matches: (response) => response.url().includes('/api/predictions/events/pred-1'),
    },
    {
      operationId: 'listPredictionPositions',
      route: '/w/markets/predictions/portfolio',
      matches: (response) => response.url().includes('/api/predictions/positions'),
    },
    {
      operationId: 'listPredictionRewards',
      route: '/w/markets/predictions/rewards',
      matches: (response) => response.url().includes('/api/predictions/rewards'),
    },
    {
      operationId: 'listPredictionLeaderboard',
      route: '/w/markets/predictions/leaderboard',
      matches: (response) => response.url().includes('/api/predictions/leaderboard'),
    },
    {
      operationId: 'listPredictionActivity',
      route: '/w/markets/predictions/activity',
      matches: (response) => response.url().includes('/api/predictions/activity'),
    },
    {
      operationId: 'getPredictionOrderReceipt',
      route: '/w/markets/predictions/receipt/po-1',
      matches: (response) => response.url().endsWith('/api/predictions/orders/po-1'),
    },
  ];
  const predictionsLoadingRouteResults = [];
  for (const [index, step] of predictionsLoadingSteps.entries()) {
    const responseOutcomePromise = page
      .waitForResponse(
        (response) => step.matches(response) && response.request().method() === 'GET',
      )
      .then(
        (response) => ({ response }),
        (error) => ({ error }),
      );
    const startedAt = Date.now();
    await navigateWithinSpa(step.route);
    const loadingText = page.getByText('Đang tải dữ liệu từ Prediction API…', { exact: true });
    try {
      await loadingText.waitFor({ state: 'visible' });
    } catch (error) {
      process.stderr.write(
        `Prediction loading UI missing for ${step.operationId}; observed=${JSON.stringify(predictionsLoadingObservedRequests)}; page=${page.url()}; scenario=${await page.evaluate(() => localStorage.getItem('vittrade.dev-preview.scenario'))}; body=${(await page.locator('body').innerText()).slice(-700)}\n`,
      );
      throw error;
    }
    const loadingResponseStillWaiting = await Promise.race([
      responseOutcomePromise.then(() => false),
      page.waitForTimeout(250).then(() => true),
    ]);
    const visibleLoadingState = await loadingText.isVisible();
    if (index === 0) {
      await page.screenshot({ path: predictionsLoadingScreenshotPath, fullPage: true });
    }
    const responseOutcome = await responseOutcomePromise;
    if ('error' in responseOutcome) {
      process.stderr.write(
        `Prediction loading response missing for ${step.operationId} at ${step.route}; observed=${JSON.stringify(predictionsLoadingObservedRequests)}; page=${page.url()}; body=${(await page.locator('body').innerText()).slice(0, 500)}\n`,
      );
      throw responseOutcome.error;
    }
    const response = responseOutcome.response;
    const payload = await response.json();
    let terminalContent;
    if (step.operationId === 'listPredictionEvents') {
      const event = payload.items.find((item) => item.id === 'pred-1');
      assert(event, 'Prediction loading event list must render fixture pred-1 after loading.');
      terminalContent = page.getByRole('button', { name: event.title, exact: false });
    } else if (step.operationId === 'getPredictionEvent') {
      terminalContent = page.getByRole('heading', { name: payload.title });
    } else if (step.operationId === 'listPredictionPositions') {
      const position = payload.items[0];
      assert(position, 'Prediction loading positions must render fixture content after loading.');
      terminalContent = page.getByText(`${position.eventId} · ${position.outcome}`, {
        exact: true,
      });
    } else if (step.operationId === 'listPredictionRewards') {
      const reward = payload.items[0];
      assert(reward, 'Prediction loading rewards must render fixture content after loading.');
      terminalContent = page.getByText(`${reward.category} · ${reward.eventId}`, { exact: true });
    } else if (step.operationId === 'listPredictionLeaderboard') {
      assert(payload.items[0], 'Prediction loading leaderboard fixture must be present.');
      terminalContent = page.getByText(payload.items[0].user, { exact: false }).first();
    } else if (step.operationId === 'listPredictionActivity') {
      assert(payload.items[0], 'Prediction loading activity fixture must be present.');
      terminalContent = page.getByText(payload.items[0].user, { exact: false }).first();
    } else {
      terminalContent = page.getByText(payload.status, { exact: true });
    }
    await terminalContent.waitFor({ state: 'visible' });
    predictionsLoadingRouteResults.push({
      operationId: step.operationId,
      route: step.route,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      elapsedMs: Date.now() - startedAt,
      loadingVisibleWhilePending: visibleLoadingState && loadingResponseStillWaiting,
      finalContentVisible: await terminalContent.isVisible(),
      itemCount: Array.isArray(payload.items) ? payload.items.length : undefined,
      finalReceiptStatus:
        step.operationId === 'getPredictionOrderReceipt' ? payload.status : undefined,
    });
  }
  const predictionsLoadingOperationIds = Object.entries(predictionsLoadingOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectPredictionsLoadingOperations);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.error').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const predictionsErrorOperationRequestCounts = { listPredictionEvents: 0 };
  const predictionsErrorRequests = [];
  const predictionsErrorFailures = [];
  const predictionsErrorResponses = [];
  let predictionsErrorUnexpectedPredictionRequestCount = 0;
  const collectPredictionsErrorOperations = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.includes('/api/predictions/')) return;
    predictionsErrorRequests.push({ method: request.method(), path: requestPath });
    if (requestPath.endsWith('/api/predictions/events') && request.method() === 'GET') {
      predictionsErrorOperationRequestCounts.listPredictionEvents += 1;
    } else {
      predictionsErrorUnexpectedPredictionRequestCount += 1;
    }
  };
  const collectPredictionsErrorFailures = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath.endsWith('/api/predictions/events') && request.method() === 'GET') {
      predictionsErrorFailures.push({
        method: request.method(),
        path: requestPath,
        failure: request.failure()?.errorText ?? null,
      });
    }
  };
  const collectPredictionsErrorResponses = (response) => {
    if (new URL(response.url()).pathname.endsWith('/api/predictions/events')) {
      predictionsErrorResponses.push({ status: response.status() });
    }
  };
  page.on('request', collectPredictionsErrorOperations);
  page.on('requestfailed', collectPredictionsErrorFailures);
  page.on('response', collectPredictionsErrorResponses);
  const predictionsErrorStartedAt = Date.now();
  await navigateWithinSpa('/w/markets/predictions');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const predictionsErrorRetryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
  await predictionsErrorRetryButton.waitFor({ state: 'visible' });
  const predictionsErrorVisibleErrorState = await page
    .getByText('Có lỗi xảy ra', { exact: true })
    .isVisible();
  const predictionsErrorVisibleRetryAction = await predictionsErrorRetryButton.isVisible();
  const predictionsErrorInitialElapsedMs = Date.now() - predictionsErrorStartedAt;
  const predictionsErrorInitialFailureCount = predictionsErrorFailures.length;
  await page.screenshot({ path: predictionsErrorScreenshotPath, fullPage: true });
  const predictionsErrorRetryStartedAt = Date.now();
  await predictionsErrorRetryButton.click();
  const predictionsErrorRetryDeadline = Date.now() + 10_000;
  while (predictionsErrorFailures.length < 12 && Date.now() < predictionsErrorRetryDeadline) {
    await page.waitForTimeout(25);
  }
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const predictionsErrorRetryElapsedMs = Date.now() - predictionsErrorRetryStartedAt;
  const predictionsErrorRouteAfterRetry = new URL(page.url()).pathname;
  const predictionsErrorVisibleEventCount = await page
    .getByText('Không có prediction market phù hợp.', {
      exact: true,
    })
    .count();
  const predictionsErrorOperationIds = Object.entries(predictionsErrorOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectPredictionsErrorOperations);
  page.off('requestfailed', collectPredictionsErrorFailures);
  page.off('response', collectPredictionsErrorResponses);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.unauthorized').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const predictionsUnauthorizedOperationRequestCounts = { listPredictionEvents: 0 };
  const predictionsUnauthorizedRefreshRequests = [];
  const predictionsUnauthorizedRefreshResponses = [];
  let predictionsUnauthorizedUnexpectedPredictionRequestCount = 0;
  const collectPredictionsUnauthorizedOperations = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.includes('/api/predictions/')) return;
    if (requestPath.endsWith('/api/predictions/events') && request.method() === 'GET') {
      predictionsUnauthorizedOperationRequestCounts.listPredictionEvents += 1;
    } else {
      predictionsUnauthorizedUnexpectedPredictionRequestCount += 1;
    }
  };
  const collectPredictionsUnauthorizedRefreshRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath.endsWith('/api/auth/refresh') && request.method() === 'POST') {
      predictionsUnauthorizedRefreshRequests.push(request);
    }
  };
  const collectPredictionsUnauthorizedRefreshResponses = (response) => {
    const responsePath = new URL(response.url()).pathname;
    if (responsePath.endsWith('/api/auth/refresh') && response.request().method() === 'POST') {
      predictionsUnauthorizedRefreshResponses.push({
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectPredictionsUnauthorizedOperations);
  page.on('request', collectPredictionsUnauthorizedRefreshRequests);
  page.on('response', collectPredictionsUnauthorizedRefreshResponses);
  const predictionsUnauthorizedEventResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/events') &&
      response.request().method() === 'GET' &&
      response.status() === 401,
  );
  const predictionsUnauthorizedRefreshResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/auth/refresh') &&
      response.request().method() === 'POST',
  );
  const predictionsUnauthorizedStartedAt = Date.now();
  await navigateWithinSpa('/w/markets/predictions');
  const [predictionsUnauthorizedEventResponse, predictionsUnauthorizedRefreshResponse] =
    await Promise.all([
      predictionsUnauthorizedEventResponsePromise,
      predictionsUnauthorizedRefreshResponsePromise,
    ]);
  await page.waitForURL(/\/(?:w\/)?auth\/login$/);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  await page.waitForTimeout(500);
  const predictionsUnauthorizedLoginRoute = new URL(page.url()).pathname;
  const predictionsUnauthorizedElapsedMs = Date.now() - predictionsUnauthorizedStartedAt;
  const predictionsUnauthorizedVisibleStaleEventCount = await page
    .getByRole('button', { name: predictionsSuccessEvent.title, exact: false })
    .count();
  const predictionsUnauthorizedEventRequestCounts = {
    listPredictionEvents: predictionsUnauthorizedOperationRequestCounts.listPredictionEvents,
    refreshSession: predictionsUnauthorizedRefreshRequests.length,
  };
  const predictionsUnauthorizedRefreshResponseCount =
    predictionsUnauthorizedRefreshResponses.length;
  const predictionsUnauthorizedOperationIds = Object.entries(
    predictionsUnauthorizedOperationRequestCounts,
  )
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectPredictionsUnauthorizedOperations);
  page.off('request', collectPredictionsUnauthorizedRefreshRequests);
  page.off('response', collectPredictionsUnauthorizedRefreshResponses);
  await page.screenshot({ path: predictionsUnauthorizedScreenshotPath, fullPage: true });

  await signInDemoThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('predictions');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('predictions.success').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const predictionsForbiddenOperationRequestCounts = { getPredictionEvent: 0 };
  let predictionsForbiddenOrderRequestCount = 0;
  let predictionsForbiddenUnexpectedPredictionRequestCount = 0;
  const collectPredictionsForbiddenRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.includes('/api/predictions/')) return;
    if (requestPath.endsWith('/api/predictions/events/pred-1') && request.method() === 'GET') {
      predictionsForbiddenOperationRequestCounts.getPredictionEvent += 1;
    } else if (requestPath.endsWith('/api/predictions/orders') && request.method() === 'POST') {
      predictionsForbiddenOrderRequestCount += 1;
    } else {
      predictionsForbiddenUnexpectedPredictionRequestCount += 1;
    }
  };
  page.on('request', collectPredictionsForbiddenRequests);
  const predictionsForbiddenEventResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/predictions/events/pred-1') &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  const predictionsForbiddenStartedAt = Date.now();
  await navigateWithinSpa('/w/markets/predictions/event/pred-1');
  const predictionsForbiddenEventResponse = await predictionsForbiddenEventResponsePromise;
  await page
    .getByText('Prediction trading permission is required to place an order.', { exact: true })
    .waitFor({ state: 'visible' });
  const predictionsForbiddenBuyButton = page.getByRole('button', { name: /Mua Yes/i });
  await predictionsForbiddenBuyButton.waitFor({ state: 'visible' });
  const predictionsForbiddenPermissionMessageVisible = await page
    .getByText('Prediction trading permission is required to place an order.', { exact: true })
    .isVisible();
  const predictionsForbiddenBuyButtonDisabled = await predictionsForbiddenBuyButton.isDisabled();
  await page.waitForTimeout(500);
  const predictionsForbiddenRoute = new URL(page.url()).pathname;
  const predictionsForbiddenElapsedMs = Date.now() - predictionsForbiddenStartedAt;
  const predictionsForbiddenOperationIds = Object.entries(
    predictionsForbiddenOperationRequestCounts,
  )
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectPredictionsForbiddenRequests);
  await page.screenshot({ path: predictionsForbiddenScreenshotPath, fullPage: true });

  await signInDeveloperThroughPreview();
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.success').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const profileSuccessOperationRequestCounts = {
    getProfile: 0,
    updateProfile: 0,
    listTrustedDevices: 0,
    revokeDevice: 0,
    setDeviceTrust: 0,
    listProfileActivity: 0,
    listSubAccounts: 0,
  };
  const profileSuccessResponses = [];
  let profileSuccessUnexpectedRequestCount = 0;
  const profileSuccessOperationForRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    const method = request.method();
    if (requestPath === '/api/profile' && method === 'GET') return 'getProfile';
    if (requestPath === '/api/profile' && method === 'PATCH') return 'updateProfile';
    if (requestPath === '/api/profile/devices' && method === 'GET') return 'listTrustedDevices';
    if (/^\/api\/profile\/devices\/[^/]+\/revoke$/.test(requestPath) && method === 'POST') {
      return 'revokeDevice';
    }
    if (/^\/api\/profile\/devices\/[^/]+\/trust$/.test(requestPath) && method === 'PATCH') {
      return 'setDeviceTrust';
    }
    if (requestPath === '/api/profile/activity' && method === 'GET') return 'listProfileActivity';
    if (requestPath === '/api/profile/sub-accounts' && method === 'GET') return 'listSubAccounts';
    return null;
  };
  const collectProfileSuccessRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/profile')) return;
    const operationId = profileSuccessOperationForRequest(request);
    if (!operationId) {
      profileSuccessUnexpectedRequestCount += 1;
      return;
    }
    profileSuccessOperationRequestCounts[operationId] += 1;
  };
  const collectProfileSuccessResponses = (response) => {
    const operationId = profileSuccessOperationForRequest(response.request());
    if (operationId) {
      profileSuccessResponses.push({
        operationId,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectProfileSuccessRequests);
  page.on('response', collectProfileSuccessResponses);

  const profileSuccessStartedAt = Date.now();
  const profileSuccessInitialReadPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile' && response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/profile');
  const profileSuccessInitialReadResponse = await profileSuccessInitialReadPromise;
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }).click();
  await page.waitForURL((url) => url.pathname === '/w/profile/edit');
  const profileSuccessNameInput = page.getByLabel('Họ và tên');
  const profileSuccessPhoneInput = page.getByLabel('Số điện thoại');
  const profileSuccessSaveButton = page.getByRole('button', { name: 'Lưu thay đổi' });
  await profileSuccessNameInput.waitFor({ state: 'visible' });
  const profileSuccessEditDisabled =
    (await profileSuccessNameInput.isDisabled()) &&
    (await profileSuccessPhoneInput.isDisabled()) &&
    (await profileSuccessSaveButton.isDisabled());
  const profileSuccessEditPermissionMessageVisible = await page
    .getByText('Profile edit permission is required to update account details.', { exact: true })
    .isVisible();
  await page.screenshot({ path: profileSuccessEditPermissionScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/profile/security');
  const profileSuccessDeviceListResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile/devices' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Quản lý thiết bị' }).click();
  await page.waitForURL((url) => url.pathname === '/w/profile/devices');
  const profileSuccessDeviceListResponse = await profileSuccessDeviceListResponsePromise;
  const profileSuccessTrustDeviceCard = page
    .getByRole('heading', { name: 'iPhone 15 Pro', exact: true })
    .locator('xpath=../../..');
  const profileSuccessRevokeDeviceCard = page
    .getByRole('heading', { name: 'Unknown Device', exact: true })
    .locator('xpath=../../..');
  const profileSuccessTrustDisabled = await profileSuccessTrustDeviceCard
    .getByRole('button', { name: 'Bỏ tin cậy' })
    .isDisabled();
  const profileSuccessRevokeDisabled = await profileSuccessRevokeDeviceCard
    .getByRole('button', { name: 'Thu hồi' })
    .isDisabled();
  const profileSuccessSecurityPermissionMessageVisible = await page
    .getByText('Profile security permission is required to manage trusted devices.', {
      exact: true,
    })
    .isVisible();
  await page.screenshot({ path: profileSuccessDevicesScreenshotPath, fullPage: true });

  const profileSuccessActivityResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile/activity' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/profile/activity');
  const profileSuccessActivityResponse = await profileSuccessActivityResponsePromise;
  const profileSuccessActivityEntries = page.getByText('Đăng nhập thành công', { exact: true });
  await profileSuccessActivityEntries.first().waitFor({ state: 'visible' });
  const profileSuccessActivityVisible =
    (await profileSuccessActivityEntries.count()) > 0 &&
    (await profileSuccessActivityEntries.first().isVisible());
  await page.screenshot({ path: profileSuccessActivityScreenshotPath, fullPage: true });

  const profileSuccessSubAccountsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile/sub-accounts' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/profile/sub-accounts');
  const profileSuccessSubAccountsResponse = await profileSuccessSubAccountsResponsePromise;
  await page
    .getByRole('heading', { name: 'Bot Trading #1', exact: true })
    .waitFor({ state: 'visible' });
  const profileSuccessSubAccountVisible = await page
    .getByRole('heading', { name: 'Bot Trading #1', exact: true })
    .isVisible();
  await page.screenshot({ path: profileSuccessSubAccountsScreenshotPath, fullPage: true });
  const profileSuccessFinalRoute = new URL(page.url()).pathname;

  const profileSuccessElapsedMs = Date.now() - profileSuccessStartedAt;
  const profileSuccessOperationIds = Object.entries(profileSuccessOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectProfileSuccessRequests);
  page.off('response', collectProfileSuccessResponses);

  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');

  const profileEmptyOperationRequestCounts = {
    listTrustedDevices: 0,
    listProfileActivity: 0,
    listSubAccounts: 0,
  };
  const profileEmptyResponses = [];
  let profileEmptyUnexpectedRequestCount = 0;
  const profileEmptyOperationForRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath === '/api/profile/devices' && request.method() === 'GET') {
      return 'listTrustedDevices';
    }
    if (requestPath === '/api/profile/activity' && request.method() === 'GET') {
      return 'listProfileActivity';
    }
    if (requestPath === '/api/profile/sub-accounts' && request.method() === 'GET') {
      return 'listSubAccounts';
    }
    return null;
  };
  const collectProfileEmptyRequests = (request) => {
    if (!new URL(request.url()).pathname.startsWith('/api/profile/')) return;
    const operationId = profileEmptyOperationForRequest(request);
    if (!operationId) {
      profileEmptyUnexpectedRequestCount += 1;
      return;
    }
    profileEmptyOperationRequestCounts[operationId] += 1;
  };
  const collectProfileEmptyResponses = (response) => {
    const operationId = profileEmptyOperationForRequest(response.request());
    if (operationId) {
      profileEmptyResponses.push({
        operationId,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectProfileEmptyRequests);
  page.on('response', collectProfileEmptyResponses);

  const profileEmptyStartedAt = Date.now();
  const profileEmptySubAccountsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile/sub-accounts' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.empty').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  const profileEmptySubAccountsResponse = await profileEmptySubAccountsResponsePromise;
  const profileEmptySubAccountsPayload = await profileEmptySubAccountsResponse.json();
  await page.getByRole('status').getByText('Chưa có tài khoản phụ nào.', { exact: true }).waitFor();
  const profileEmptySubAccountsVisible = await page
    .getByRole('status')
    .getByText('Chưa có tài khoản phụ nào.', { exact: true })
    .isVisible();
  const profileEmptySubAccountCountVisible = await page
    .getByText('0 tài khoản phụ', { exact: true })
    .isVisible();
  await page.screenshot({ path: profileEmptySubAccountsScreenshotPath, fullPage: true });

  const profileEmptyDeviceListResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile/devices' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/profile/devices');
  const profileEmptyDeviceListResponse = await profileEmptyDeviceListResponsePromise;
  const profileEmptyDevicesPayload = await profileEmptyDeviceListResponse.json();
  await page
    .getByRole('status')
    .getByText('Chưa có thiết bị nào được ghi nhận.', { exact: true })
    .waitFor();
  const profileEmptyDevicesVisible = await page
    .getByRole('status')
    .getByText('Chưa có thiết bị nào được ghi nhận.', { exact: true })
    .isVisible();
  await page.screenshot({ path: profileEmptyDevicesScreenshotPath, fullPage: true });

  const profileEmptyActivityResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/profile/activity' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/profile/activity');
  const profileEmptyActivityResponse = await profileEmptyActivityResponsePromise;
  const profileEmptyActivityPayload = await profileEmptyActivityResponse.json();
  await page
    .getByRole('status')
    .getByText('Chưa có hoạt động tài khoản nào.', { exact: true })
    .waitFor();
  const profileEmptyActivityVisible = await page
    .getByRole('status')
    .getByText('Chưa có hoạt động tài khoản nào.', { exact: true })
    .isVisible();
  await page.screenshot({ path: profileEmptyActivityScreenshotPath, fullPage: true });

  const profileEmptyElapsedMs = Date.now() - profileEmptyStartedAt;
  const profileEmptyFinalRoute = new URL(page.url()).pathname;
  const profileEmptyOperationIds = Object.entries(profileEmptyOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  page.off('request', collectProfileEmptyRequests);
  page.off('response', collectProfileEmptyResponses);

  await signInDeveloperThroughPreview();
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.loading').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const profileLoadingOperationRequestCounts = {
    getProfile: 0,
    updateProfile: 0,
    listTrustedDevices: 0,
    revokeDevice: 0,
    setDeviceTrust: 0,
    listProfileActivity: 0,
    listSubAccounts: 0,
  };
  const profileLoadingResponses = [];
  let profileLoadingUnexpectedRequestCount = 0;
  const profileLoadingOperationForRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    const method = request.method();
    if (requestPath === '/api/profile' && method === 'GET') return 'getProfile';
    if (requestPath === '/api/profile' && method === 'PATCH') return 'updateProfile';
    if (requestPath === '/api/profile/devices' && method === 'GET') return 'listTrustedDevices';
    if (/^\/api\/profile\/devices\/[^/]+\/revoke$/.test(requestPath) && method === 'POST') {
      return 'revokeDevice';
    }
    if (/^\/api\/profile\/devices\/[^/]+\/trust$/.test(requestPath) && method === 'PATCH') {
      return 'setDeviceTrust';
    }
    if (requestPath === '/api/profile/activity' && method === 'GET') return 'listProfileActivity';
    if (requestPath === '/api/profile/sub-accounts' && method === 'GET') return 'listSubAccounts';
    return null;
  };
  const collectProfileLoadingRequests = (request) => {
    if (!new URL(request.url()).pathname.startsWith('/api/profile')) return;
    const operationId = profileLoadingOperationForRequest(request);
    if (!operationId) {
      profileLoadingUnexpectedRequestCount += 1;
      return;
    }
    profileLoadingOperationRequestCounts[operationId] += 1;
  };
  const collectProfileLoadingResponses = (response) => {
    const operationId = profileLoadingOperationForRequest(response.request());
    if (operationId) {
      profileLoadingResponses.push({
        operationId,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectProfileLoadingRequests);
  page.on('response', collectProfileLoadingResponses);

  const profileLoadingStartedAt = Date.now();
  const runProfileLoadingRead = async ({
    operationId,
    route,
    loadingMessage,
    loadedContent,
    screenshotPath,
  }) => {
    const responsePromise = page.waitForResponse(
      (response) =>
        profileLoadingOperationForRequest(response.request()) === operationId &&
        response.request().method() === 'GET',
    );
    const readStartedAt = Date.now();
    await navigateWithinSpa(route);
    const loadingLocator = page.getByText(loadingMessage, { exact: true });
    await loadingLocator.waitFor({ state: 'visible' });
    const loadingVisible = await loadingLocator.isVisible();
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const response = await responsePromise;
    await loadedContent.waitFor({ state: 'visible' });
    return {
      operationId,
      route,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      loadingVisible,
      responseElapsedMs: Date.now() - readStartedAt,
    };
  };
  const profileLoadingReads = [];
  profileLoadingReads.push(
    await runProfileLoadingRead({
      operationId: 'getProfile',
      route: '/w/profile',
      loadingMessage: 'Đang tải profile…',
      loadedContent: page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }),
      screenshotPath: profileLoadingProfileScreenshotPath,
    }),
  );
  profileLoadingReads.push(
    await runProfileLoadingRead({
      operationId: 'listTrustedDevices',
      route: '/w/profile/devices',
      loadingMessage: 'Đang tải thiết bị…',
      loadedContent: page.getByRole('heading', { name: 'iPhone 15 Pro', exact: true }),
      screenshotPath: profileLoadingDevicesScreenshotPath,
    }),
  );
  profileLoadingReads.push(
    await runProfileLoadingRead({
      operationId: 'listProfileActivity',
      route: '/w/profile/activity',
      loadingMessage: 'Đang tải activity…',
      loadedContent: page.getByText('Đăng nhập thành công', { exact: true }).first(),
      screenshotPath: profileLoadingActivityScreenshotPath,
    }),
  );
  profileLoadingReads.push(
    await runProfileLoadingRead({
      operationId: 'listSubAccounts',
      route: '/w/profile/sub-accounts',
      loadingMessage: 'Đang tải tài khoản phụ…',
      loadedContent: page.getByRole('heading', { name: 'Bot Trading #1', exact: true }),
      screenshotPath: profileLoadingSubAccountsScreenshotPath,
    }),
  );
  const profileLoadingOperationIds = Object.entries(profileLoadingOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const profileLoadingElapsedMs = Date.now() - profileLoadingStartedAt;
  const profileLoadingFinalRoute = new URL(page.url()).pathname;
  page.off('request', collectProfileLoadingRequests);
  page.off('response', collectProfileLoadingResponses);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.error').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await signInDeveloperThroughPreview();
  await page.getByText('developer@vittrade.local', { exact: true }).waitFor({ state: 'visible' });
  await page.getByTestId('active-preview-scenario').getByText('profile.error').waitFor();

  const profileErrorOperationRequestCounts = {
    getProfile: 0,
    updateProfile: 0,
    listTrustedDevices: 0,
    revokeDevice: 0,
    setDeviceTrust: 0,
    listProfileActivity: 0,
    listSubAccounts: 0,
  };
  const profileErrorResponses = [];
  let profileErrorUnexpectedRequestCount = 0;
  const collectProfileErrorRequests = (request) => {
    if (!new URL(request.url()).pathname.startsWith('/api/profile')) return;
    const operationId = profileLoadingOperationForRequest(request);
    if (operationId) profileErrorOperationRequestCounts[operationId] += 1;
    else profileErrorUnexpectedRequestCount += 1;
  };
  const collectProfileErrorResponses = (response) => {
    const operationId = profileLoadingOperationForRequest(response.request());
    if (operationId) {
      profileErrorResponses.push({
        operationId,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectProfileErrorRequests);
  page.on('response', collectProfileErrorResponses);

  const profileErrorStartedAt = Date.now();
  const profileErrorSteps = [
    {
      operationId: 'getProfile',
      route: '/w/profile',
      screenshotPath: profileErrorProfileScreenshotPath,
      successContent: page.getByRole('button', { name: 'Chỉnh sửa hồ sơ' }),
    },
    {
      operationId: 'listTrustedDevices',
      route: '/w/profile/devices',
      screenshotPath: profileErrorDevicesScreenshotPath,
      successContent: page.getByRole('heading', { name: 'iPhone 15 Pro', exact: true }),
    },
    {
      operationId: 'listProfileActivity',
      route: '/w/profile/activity',
      screenshotPath: profileErrorActivityScreenshotPath,
      successContent: page.getByText('Đăng nhập thành công', { exact: true }).first(),
    },
    {
      operationId: 'listSubAccounts',
      route: '/w/profile/sub-accounts',
      screenshotPath: profileErrorSubAccountsScreenshotPath,
      successContent: page.getByRole('heading', { name: 'Bot Trading #1', exact: true }),
    },
  ];
  const profileErrorReads = [];
  for (const step of profileErrorSteps) {
    const readStartedAt = Date.now();
    await navigateWithinSpa(step.route);
    const errorState = page.getByText('Có lỗi xảy ra', { exact: true });
    const retryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
    await errorState.waitFor({ state: 'visible' });
    await retryButton.waitFor({ state: 'visible' });
    const initialRequestCount = profileErrorOperationRequestCounts[step.operationId];
    const initialResponseCount = profileErrorResponses.filter(
      (response) => response.operationId === step.operationId,
    ).length;
    const initialElapsedMs = Date.now() - readStartedAt;
    await page.screenshot({ path: step.screenshotPath, fullPage: true });

    const retryStartedAt = Date.now();
    await retryButton.click();
    const retryTargetCount = initialRequestCount * 2;
    const retryDeadline = Date.now() + 10_000;
    while (
      profileErrorOperationRequestCounts[step.operationId] < retryTargetCount &&
      Date.now() < retryDeadline
    ) {
      await page.waitForTimeout(25);
    }
    await errorState.waitFor({ state: 'visible' });
    const finalRequestCount = profileErrorOperationRequestCounts[step.operationId];
    const finalResponseCount = profileErrorResponses.filter(
      (response) => response.operationId === step.operationId,
    ).length;
    profileErrorReads.push({
      operationId: step.operationId,
      route: step.route,
      initialRequestCount,
      initialResponseCount,
      initialElapsedMs,
      retryRequestCount: finalRequestCount - initialRequestCount,
      retryResponseCount: finalResponseCount - initialResponseCount,
      retryElapsedMs: Date.now() - retryStartedAt,
      responseStatuses: profileErrorResponses
        .filter((response) => response.operationId === step.operationId)
        .map((response) => response.status),
      responsesFromServiceWorker: profileErrorResponses
        .filter((response) => response.operationId === step.operationId)
        .every((response) => response.fromServiceWorker),
      errorVisible: await errorState.isVisible(),
      retryVisible: await retryButton.isVisible(),
      successContentVisibleAfterError: (await step.successContent.count()) > 0,
      routeAfterRetry: new URL(page.url()).pathname,
    });
  }
  const profileErrorOperationIds = Object.entries(profileErrorOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const profileErrorElapsedMs = Date.now() - profileErrorStartedAt;
  const profileErrorFinalRoute = new URL(page.url()).pathname;
  page.off('request', collectProfileErrorRequests);
  page.off('response', collectProfileErrorResponses);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.success').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const profileUnauthorizedSteps = [
    {
      operationId: 'getProfile',
      route: '/w/profile',
      successContent: page.getByText('nguyenvana@email.com', { exact: true }),
      screenshotPath: profileUnauthorizedProfileScreenshotPath,
    },
    {
      operationId: 'listTrustedDevices',
      route: '/w/profile/devices',
      successContent: page.getByRole('heading', { name: 'iPhone 15 Pro', exact: true }),
      screenshotPath: profileUnauthorizedDevicesScreenshotPath,
    },
    {
      operationId: 'listProfileActivity',
      route: '/w/profile/activity',
      successContent: page.getByText('Đăng nhập thành công', { exact: true }).first(),
      screenshotPath: profileUnauthorizedActivityScreenshotPath,
    },
    {
      operationId: 'listSubAccounts',
      route: '/w/profile/sub-accounts',
      successContent: page.getByRole('heading', { name: 'Bot Trading #1', exact: true }),
      screenshotPath: profileUnauthorizedSubAccountsScreenshotPath,
    },
  ];
  for (const step of profileUnauthorizedSteps) {
    await navigateWithinSpa(step.route);
    await step.successContent.waitFor({ state: 'visible' });
  }

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('profile');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('profile.unauthorized').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const profileUnauthorizedOperationRequestCounts = {
    getProfile: 0,
    updateProfile: 0,
    listTrustedDevices: 0,
    revokeDevice: 0,
    setDeviceTrust: 0,
    listProfileActivity: 0,
    listSubAccounts: 0,
  };
  const profileUnauthorizedResponses = [];
  const profileUnauthorizedRefreshRequests = [];
  const profileUnauthorizedRefreshResponses = [];
  let profileUnauthorizedUnexpectedRequestCount = 0;
  const collectProfileUnauthorizedRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath === '/api/auth/refresh' && request.method() === 'POST') {
      profileUnauthorizedRefreshRequests.push(request);
      return;
    }
    if (!requestPath.startsWith('/api/profile')) return;
    const operationId = profileLoadingOperationForRequest(request);
    if (operationId) profileUnauthorizedOperationRequestCounts[operationId] += 1;
    else profileUnauthorizedUnexpectedRequestCount += 1;
  };
  const collectProfileUnauthorizedResponses = (response) => {
    const operationId = profileLoadingOperationForRequest(response.request());
    if (operationId) {
      profileUnauthorizedResponses.push({
        operationId,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
      return;
    }
    const responsePath = new URL(response.url()).pathname;
    if (responsePath === '/api/auth/refresh' && response.request().method() === 'POST') {
      profileUnauthorizedRefreshResponses.push({
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectProfileUnauthorizedRequests);
  page.on('response', collectProfileUnauthorizedResponses);

  const profileUnauthorizedStartedAt = Date.now();
  const profileUnauthorizedReads = [];
  for (const [index, step] of profileUnauthorizedSteps.entries()) {
    const readCountBefore = profileUnauthorizedOperationRequestCounts[step.operationId];
    const refreshCountBefore = profileUnauthorizedRefreshRequests.length;
    const responseCountBefore = profileUnauthorizedResponses.length;
    const refreshResponseCountBefore = profileUnauthorizedRefreshResponses.length;
    const readResponsePromise = page.waitForResponse(
      (response) =>
        profileLoadingOperationForRequest(response.request()) === step.operationId &&
        response.status() === 401,
    );
    const refreshResponsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/auth/refresh' &&
        response.request().method() === 'POST',
    );
    const readStartedAt = Date.now();
    await navigateWithinSpa(step.route);
    const [readResponse, refreshResponse] = await Promise.all([
      readResponsePromise,
      refreshResponsePromise,
    ]);
    await page.waitForURL(/\/(?:w\/)?auth\/login$/);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
    await page.waitForTimeout(500);
    const staleSuccessContentVisible = await step.successContent.isVisible().catch(() => false);
    const readResponses = profileUnauthorizedResponses.slice(responseCountBefore);
    const refreshResponses = profileUnauthorizedRefreshResponses.slice(refreshResponseCountBefore);
    profileUnauthorizedReads.push({
      operationId: step.operationId,
      route: step.route,
      readRequestCount:
        profileUnauthorizedOperationRequestCounts[step.operationId] - readCountBefore,
      readResponseCount: readResponses.length,
      readStatuses: readResponses.map((response) => response.status),
      readResponsesFromServiceWorker: readResponses.every((response) => response.fromServiceWorker),
      refreshRequestCount: profileUnauthorizedRefreshRequests.length - refreshCountBefore,
      refreshResponseCount: refreshResponses.length,
      refreshStatuses: refreshResponses.map((response) => response.status),
      refreshResponsesFromServiceWorker: refreshResponses.every(
        (response) => response.fromServiceWorker,
      ),
      responseElapsedMs: Date.now() - readStartedAt,
      redirectedToLogin: new URL(page.url()).pathname.endsWith('/auth/login'),
      staleSuccessContentVisible,
    });
    await page.screenshot({ path: step.screenshotPath, fullPage: true });

    if (index < profileUnauthorizedSteps.length - 1) {
      await signInDeveloperThroughPreview();
    }
  }
  const profileUnauthorizedOperationIds = Object.entries(profileUnauthorizedOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const profileUnauthorizedElapsedMs = Date.now() - profileUnauthorizedStartedAt;
  const profileUnauthorizedFinalRoute = new URL(page.url()).pathname;
  page.off('request', collectProfileUnauthorizedRequests);
  page.off('response', collectProfileUnauthorizedResponses);

  await signInSupportThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('support');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.success').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const supportOperationIds = [
    'listNews',
    'listNotifications',
    'markNotificationRead',
    'getHelpCenter',
    'listSupportTickets',
    'createSupportTicket',
  ];
  const supportOperationRequestCounts = Object.fromEntries(
    supportOperationIds.map((operationId) => [operationId, 0]),
  );
  const supportResponses = [];
  let supportUnexpectedRequestCount = 0;
  const supportOperationForRequest = (request) => {
    const url = new URL(request.url());
    const requestPath = url.pathname;
    const method = request.method();
    if (method === 'GET' && requestPath.endsWith('/content/news')) return 'listNews';
    if (method === 'GET' && requestPath.endsWith('/notifications')) return 'listNotifications';
    if (method === 'POST' && /\/notifications\/[^/]+\/read$/.test(requestPath)) {
      return 'markNotificationRead';
    }
    if (method === 'GET' && requestPath.endsWith('/support/help')) return 'getHelpCenter';
    if (method === 'GET' && requestPath.endsWith('/support/tickets')) return 'listSupportTickets';
    if (method === 'POST' && requestPath.endsWith('/support/tickets')) {
      return 'createSupportTicket';
    }
    return null;
  };
  const collectSupportRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (
      requestPath.startsWith('/api/content/') ||
      requestPath.startsWith('/api/notifications') ||
      requestPath.startsWith('/api/support/')
    ) {
      const operationId = supportOperationForRequest(request);
      if (operationId) supportOperationRequestCounts[operationId] += 1;
      else supportUnexpectedRequestCount += 1;
    }
  };
  const collectSupportResponses = (response) => {
    const operationId = supportOperationForRequest(response.request());
    if (!operationId) return;
    supportResponses.push({
      operationId,
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      idempotencyKey: response.request().headers()['idempotency-key'] ?? null,
    });
  };
  page.on('request', collectSupportRequests);
  page.on('response', collectSupportResponses);

  const supportSuccessStartedAt = Date.now();
  await navigateWithinSpa('/w/news');
  await page.getByRole('heading', { name: 'Phí giao dịch 0% cho BTC/USDT' }).waitFor();
  await page.screenshot({ path: supportSuccessNewsScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/notifications');
  await page.getByText('Lệnh đã khớp', { exact: true }).waitFor();
  const unreadCountBefore = Number(
    (await page.getByText(/^\d+ chưa đọc$/).innerText()).match(/^\d+/)?.[0],
  );
  const markNotificationReadResponsePromise = page.waitForResponse(
    (response) =>
      supportOperationForRequest(response.request()) === 'markNotificationRead' &&
      new URL(response.url()).pathname.endsWith('/notifications/notif001/read'),
  );
  await page.getByRole('button', { name: 'Đã đọc' }).first().click();
  const markNotificationReadResponse = await markNotificationReadResponsePromise;
  await page.getByText('Đã đánh dấu thông báo là đã đọc.').waitFor();
  const unreadCountAfter = Number(
    (await page.getByText(/^\d+ chưa đọc$/).innerText()).match(/^\d+/)?.[0],
  );
  await page.screenshot({ path: supportSuccessNotificationsScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/support/help');
  await page.getByRole('heading', { name: 'Cách tạo tài khoản VitTrade' }).waitFor();
  await page.screenshot({ path: supportSuccessHelpScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/support');
  await page.getByRole('heading', { name: 'Rút USDT bị pending quá lâu' }).waitFor();
  await page.getByLabel('Tiêu đề ticket').fill('A06 preview support ticket');
  await page.getByLabel('Nội dung ticket').fill('Local mock UI acceptance; no backend request.');
  const createSupportTicketResponsePromise = page.waitForResponse(
    (response) =>
      supportOperationForRequest(response.request()) === 'createSupportTicket' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Gửi ticket' }).click();
  const createSupportTicketResponse = await createSupportTicketResponsePromise;
  const createdSupportTicket = await createSupportTicketResponse.json();
  await page.getByRole('heading', { name: 'A06 preview support ticket' }).waitFor();
  await page.getByText('Đã gửi yêu cầu hỗ trợ.').last().waitFor();
  await page.screenshot({ path: supportSuccessTicketsScreenshotPath, fullPage: true });
  const supportSuccessElapsedMs = Date.now() - supportSuccessStartedAt;
  const supportFinalRoute = new URL(page.url()).pathname;
  page.off('request', collectSupportRequests);
  page.off('response', collectSupportResponses);

  const supportResponseCounts = Object.fromEntries(
    supportOperationIds.map((operationId) => [
      operationId,
      supportResponses.filter((response) => response.operationId === operationId).length,
    ]),
  );
  const supportRequiredStatuses = {
    listNews: [200],
    listNotifications: [200],
    markNotificationRead: [204],
    getHelpCenter: [200],
    listSupportTickets: [200],
    createSupportTicket: [201],
  };
  assert.equal(supportUnexpectedRequestCount, 0, 'Support made an unclassified API request');
  assert.equal(supportOperationRequestCounts.listNews, 1);
  assert.equal(supportOperationRequestCounts.listNotifications, 2);
  assert.equal(supportOperationRequestCounts.markNotificationRead, 1);
  assert.equal(supportOperationRequestCounts.getHelpCenter, 1);
  assert.equal(supportOperationRequestCounts.listSupportTickets, 2);
  assert.equal(supportOperationRequestCounts.createSupportTicket, 1);
  assert.equal(
    supportResponses.length,
    Object.values(supportResponseCounts).reduce((a, b) => a + b, 0),
  );
  assert.ok(
    supportResponses.every(
      (response) =>
        response.fromServiceWorker &&
        supportRequiredStatuses[response.operationId].includes(response.status),
    ),
    'Support response was not a contract-expected local service-worker response',
  );
  assert.match(
    markNotificationReadResponse.request().headers()['idempotency-key'] ?? '',
    /^notification-read-notif001-/,
  );
  assert.match(
    createSupportTicketResponse.request().headers()['idempotency-key'] ?? '',
    /^support-ticket-/,
  );
  assert.equal(markNotificationReadResponse.status(), 204);
  assert.equal(createSupportTicketResponse.status(), 201);
  assert.equal(unreadCountAfter, unreadCountBefore - 1);
  assert.equal(createdSupportTicket.subject, 'A06 preview support ticket');
  assert.equal(createdSupportTicket.status, 'open');
  assert.equal(supportFinalRoute, '/w/support');

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('support');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.empty').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const supportEmptyOperationRequestCounts = Object.fromEntries(
    supportOperationIds.map((operationId) => [operationId, 0]),
  );
  const supportEmptyResponses = [];
  let supportEmptyUnexpectedRequestCount = 0;
  const collectSupportEmptyRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (
      requestPath.startsWith('/api/content/') ||
      requestPath.startsWith('/api/notifications') ||
      requestPath.startsWith('/api/support/')
    ) {
      const operationId = supportOperationForRequest(request);
      if (operationId) supportEmptyOperationRequestCounts[operationId] += 1;
      else supportEmptyUnexpectedRequestCount += 1;
    }
  };
  const collectSupportEmptyResponses = (response) => {
    const operationId = supportOperationForRequest(response.request());
    if (!operationId) return;
    supportEmptyResponses.push({
      operationId,
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      idempotencyKey: response.request().headers()['idempotency-key'] ?? null,
    });
  };
  page.on('request', collectSupportEmptyRequests);
  page.on('response', collectSupportEmptyResponses);

  const supportEmptyStartedAt = Date.now();
  await navigateWithinSpa('/w/news');
  await page.getByRole('heading', { name: 'Phí giao dịch 0% cho BTC/USDT' }).waitFor();
  await navigateWithinSpa('/w/notifications');
  await page.getByText('Lệnh đã khớp', { exact: true }).waitFor();
  const supportEmptyUnreadBefore = Number(
    (await page.getByText(/^\d+ chưa đọc$/).innerText()).match(/^\d+/)?.[0],
  );
  const supportEmptyMarkReadResponsePromise = page.waitForResponse(
    (response) => supportOperationForRequest(response.request()) === 'markNotificationRead',
  );
  await page.getByRole('button', { name: 'Đã đọc' }).first().click();
  const supportEmptyMarkReadResponse = await supportEmptyMarkReadResponsePromise;
  await page.getByText('Đã đánh dấu thông báo là đã đọc.').waitFor();
  const supportEmptyUnreadAfter = Number(
    (await page.getByText(/^\d+ chưa đọc$/).innerText()).match(/^\d+/)?.[0],
  );

  await navigateWithinSpa('/w/support/help');
  await page.getByRole('heading', { name: 'Cách tạo tài khoản VitTrade' }).waitFor();
  const emptyTicketListResponsePromise = page.waitForResponse(
    (response) =>
      supportOperationForRequest(response.request()) === 'listSupportTickets' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/support');
  const emptyTicketListResponse = await emptyTicketListResponsePromise;
  const emptyTicketListPayload = await emptyTicketListResponse.json();
  await page.getByText('Bạn chưa có yêu cầu hỗ trợ nào.', { exact: true }).waitFor();
  assert.equal(emptyTicketListResponse.status(), 200);
  assert.deepEqual(emptyTicketListPayload, { items: [] });
  assert.equal(await page.getByRole('button', { name: 'Thử lại' }).count(), 0);
  await page.getByLabel('Tiêu đề ticket').fill('A06 preview empty ticket');
  await page
    .getByLabel('Nội dung ticket')
    .fill('Create from the contract-valid empty Support preview.');
  await page.getByRole('button', { name: 'Gửi ticket' }).waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('button', { name: 'Gửi ticket' }).isEnabled(), true);
  await page.screenshot({ path: supportEmptyTicketsScreenshotPath, fullPage: true });

  const supportEmptyCreateResponsePromise = page.waitForResponse(
    (response) => supportOperationForRequest(response.request()) === 'createSupportTicket',
  );
  const refreshedTicketListResponsePromise = page.waitForResponse(
    (response) =>
      supportOperationForRequest(response.request()) === 'listSupportTickets' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Gửi ticket' }).click();
  const [supportEmptyCreateResponse, refreshedTicketListResponse] = await Promise.all([
    supportEmptyCreateResponsePromise,
    refreshedTicketListResponsePromise,
  ]);
  const supportEmptyCreatedTicket = await supportEmptyCreateResponse.json();
  const refreshedTicketListPayload = await refreshedTicketListResponse.json();
  await page.getByRole('heading', { name: 'A06 preview empty ticket' }).waitFor();
  await page.getByText('Đã gửi yêu cầu hỗ trợ.').last().waitFor();
  await page.screenshot({ path: supportEmptyCreatedTicketScreenshotPath, fullPage: true });

  const supportEmptyObservedOperationIds = Object.entries(supportEmptyOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const supportEmptyResponseCounts = Object.fromEntries(
    supportOperationIds.map((operationId) => [
      operationId,
      supportEmptyResponses.filter((response) => response.operationId === operationId).length,
    ]),
  );
  const supportEmptyRequiredStatuses = {
    listNews: [200],
    listNotifications: [200],
    markNotificationRead: [204],
    getHelpCenter: [200],
    listSupportTickets: [200],
    createSupportTicket: [201],
  };
  assert.equal(supportEmptyUnexpectedRequestCount, 0);
  assert.deepEqual(supportEmptyObservedOperationIds, supportOperationIds);
  assert.equal(supportEmptyOperationRequestCounts.listNews, 1);
  assert.equal(supportEmptyOperationRequestCounts.listNotifications, 2);
  assert.equal(supportEmptyOperationRequestCounts.markNotificationRead, 1);
  assert.equal(supportEmptyOperationRequestCounts.getHelpCenter, 1);
  assert.equal(supportEmptyOperationRequestCounts.listSupportTickets, 2);
  assert.equal(supportEmptyOperationRequestCounts.createSupportTicket, 1);
  assert.ok(
    supportEmptyResponses.every(
      (response) =>
        response.fromServiceWorker &&
        supportEmptyRequiredStatuses[response.operationId].includes(response.status),
    ),
  );
  assert.equal(supportEmptyMarkReadResponse.status(), 204);
  assert.equal(supportEmptyCreateResponse.status(), 201);
  assert.match(
    supportEmptyMarkReadResponse.request().headers()['idempotency-key'] ?? '',
    /^notification-read-/,
  );
  assert.match(
    supportEmptyCreateResponse.request().headers()['idempotency-key'] ?? '',
    /^support-ticket-/,
  );
  assert.ok(supportEmptyUnreadAfter < supportEmptyUnreadBefore);
  assert.deepEqual(emptyTicketListPayload, { items: [] });
  assert.equal(refreshedTicketListPayload.items.length, 1);
  assert.equal(refreshedTicketListPayload.items[0].id, supportEmptyCreatedTicket.id);
  assert.equal(supportEmptyCreatedTicket.subject, 'A06 preview empty ticket');
  assert.equal(supportEmptyCreatedTicket.status, 'open');
  const supportEmptyFinalRoute = new URL(page.url()).pathname;
  assert.equal(supportEmptyFinalRoute, '/w/support');
  const supportEmptyElapsedMs = Date.now() - supportEmptyStartedAt;
  page.off('request', collectSupportEmptyRequests);
  page.off('response', collectSupportEmptyResponses);

  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await signInSupportThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('support');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.loading').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const supportLoadingOperationRequestCounts = Object.fromEntries(
    supportOperationIds.map((operationId) => [operationId, 0]),
  );
  const supportLoadingResponses = [];
  let supportLoadingUnexpectedRequestCount = 0;
  const collectSupportLoadingRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (
      requestPath.startsWith('/api/content/') ||
      requestPath.startsWith('/api/notifications') ||
      requestPath.startsWith('/api/support/')
    ) {
      const operationId = supportOperationForRequest(request);
      if (operationId) supportLoadingOperationRequestCounts[operationId] += 1;
      else supportLoadingUnexpectedRequestCount += 1;
    }
  };
  const collectSupportLoadingResponses = (response) => {
    const operationId = supportOperationForRequest(response.request());
    if (!operationId) return;
    supportLoadingResponses.push({
      operationId,
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectSupportLoadingRequests);
  page.on('response', collectSupportLoadingResponses);
  const supportLoadingStartedAt = Date.now();
  const supportLoadingReads = [];
  const runSupportLoadingRead = async ({
    operationId,
    route,
    loadingMessage,
    loadedContent,
    screenshotPath,
  }) => {
    const readStartedAt = Date.now();
    const responsePromise = page.waitForResponse(
      (response) =>
        supportOperationForRequest(response.request()) === operationId &&
        response.request().method() === 'GET',
    );
    await navigateWithinSpa(route);
    const loadingLocator = page.getByText(loadingMessage, { exact: true });
    await loadingLocator.waitFor({ state: 'visible' });
    const loadingVisible = await loadingLocator.isVisible();
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const response = await responsePromise;
    await loadedContent.waitFor({ state: 'visible' });
    return {
      operationId,
      route,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      loadingVisible,
      responseElapsedMs: Date.now() - readStartedAt,
    };
  };
  supportLoadingReads.push(
    await runSupportLoadingRead({
      operationId: 'listNews',
      route: '/w/news',
      loadingMessage: 'Đang tải nội dung…',
      loadedContent: page.getByRole('heading', { name: 'Phí giao dịch 0% cho BTC/USDT' }),
      screenshotPath: supportLoadingNewsScreenshotPath,
    }),
  );
  supportLoadingReads.push(
    await runSupportLoadingRead({
      operationId: 'listNotifications',
      route: '/w/notifications',
      loadingMessage: 'Đang tải thông báo…',
      loadedContent: page.getByText('Lệnh đã khớp', { exact: true }),
      screenshotPath: supportLoadingNotificationsScreenshotPath,
    }),
  );
  supportLoadingReads.push(
    await runSupportLoadingRead({
      operationId: 'getHelpCenter',
      route: '/w/support/help',
      loadingMessage: 'Đang tải help center…',
      loadedContent: page.getByRole('heading', { name: 'Cách tạo tài khoản VitTrade' }),
      screenshotPath: supportLoadingHelpScreenshotPath,
    }),
  );
  supportLoadingReads.push(
    await runSupportLoadingRead({
      operationId: 'listSupportTickets',
      route: '/w/support',
      loadingMessage: 'Đang tải ticket…',
      loadedContent: page.getByRole('heading', { name: 'Rút USDT bị pending quá lâu' }),
      screenshotPath: supportLoadingTicketsScreenshotPath,
    }),
  );
  const supportLoadingOperationIds = Object.entries(supportLoadingOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const supportLoadingElapsedMs = Date.now() - supportLoadingStartedAt;
  const supportLoadingFinalRoute = new URL(page.url()).pathname;
  assert.deepEqual(supportLoadingOperationIds, [
    'listNews',
    'listNotifications',
    'getHelpCenter',
    'listSupportTickets',
  ]);
  assert.equal(supportLoadingUnexpectedRequestCount, 0);
  assert.equal(supportLoadingReads.length, 4);
  assert.equal(supportLoadingOperationRequestCounts.listNews, 1);
  assert.equal(supportLoadingOperationRequestCounts.listNotifications, 1);
  assert.equal(supportLoadingOperationRequestCounts.getHelpCenter, 1);
  assert.equal(supportLoadingOperationRequestCounts.listSupportTickets, 1);
  assert.equal(supportLoadingOperationRequestCounts.markNotificationRead, 0);
  assert.equal(supportLoadingOperationRequestCounts.createSupportTicket, 0);
  assert.ok(supportLoadingReads.every((read) => read.loadingVisible && read.status === 200));
  assert.ok(
    supportLoadingResponses.every(
      (response) => response.status === 200 && response.fromServiceWorker,
    ),
  );
  assert.equal(supportLoadingFinalRoute, '/w/support');
  page.off('request', collectSupportLoadingRequests);
  page.off('response', collectSupportLoadingResponses);

  await page.goto(`${origin}/w/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('status', { name: 'Mock data warning' }).waitFor();
  await signInSupportThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('support');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('support.error').waitFor();
  await page.getByRole('button', { name: 'Thu gọn' }).click();

  const supportErrorOperationRequestCounts = Object.fromEntries(
    supportOperationIds.map((operationId) => [operationId, 0]),
  );
  const supportErrorResponses = [];
  let supportErrorUnexpectedRequestCount = 0;
  const collectSupportErrorRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (
      requestPath.startsWith('/api/content/') ||
      requestPath.startsWith('/api/notifications') ||
      requestPath.startsWith('/api/support/')
    ) {
      const operationId = supportOperationForRequest(request);
      if (operationId) supportErrorOperationRequestCounts[operationId] += 1;
      else supportErrorUnexpectedRequestCount += 1;
    }
  };
  const collectSupportErrorResponses = (response) => {
    const operationId = supportOperationForRequest(response.request());
    if (!operationId) return;
    supportErrorResponses.push({
      operationId,
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectSupportErrorRequests);
  page.on('response', collectSupportErrorResponses);
  const supportErrorStartedAt = Date.now();
  const supportErrorReads = [];
  const waitForSupportErrorAttempts = async (operationId, expectedCount) => {
    const deadline = Date.now() + 10_000;
    while (
      supportErrorResponses.filter((response) => response.operationId === operationId).length <
        expectedCount &&
      Date.now() < deadline
    ) {
      await page.waitForTimeout(25);
    }
    const responseCount = supportErrorResponses.filter(
      (response) => response.operationId === operationId,
    ).length;
    assert.equal(
      responseCount,
      expectedCount,
      `${operationId} expected ${expectedCount} responses`,
    );
  };
  const runSupportErrorRead = async ({ operationId, route, successMarker, screenshotPath }) => {
    const startedAt = Date.now();
    await navigateWithinSpa(route);
    const retryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
    await retryButton.waitFor({ state: 'visible' });
    assert.equal(await page.getByText(successMarker, { exact: true }).count(), 0);
    await waitForSupportErrorAttempts(operationId, 6);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    await retryButton.click();
    await waitForSupportErrorAttempts(operationId, 12);
    await retryButton.waitFor({ state: 'visible' });
    return {
      operationId,
      route,
      initialAttempts: 6,
      retryAttempts: 6,
      status: 503,
      errorStateVisible: true,
      retryActionVisibleAfterRetry: true,
      responseElapsedMs: Date.now() - startedAt,
    };
  };
  supportErrorReads.push(
    await runSupportErrorRead({
      operationId: 'listNews',
      route: '/w/news',
      successMarker: 'Phí giao dịch 0% cho BTC/USDT',
      screenshotPath: supportErrorNewsScreenshotPath,
    }),
  );
  supportErrorReads.push(
    await runSupportErrorRead({
      operationId: 'listNotifications',
      route: '/w/notifications',
      successMarker: 'Lệnh đã khớp',
      screenshotPath: supportErrorNotificationsScreenshotPath,
    }),
  );
  supportErrorReads.push(
    await runSupportErrorRead({
      operationId: 'getHelpCenter',
      route: '/w/support/help',
      successMarker: 'Cách tạo tài khoản VitTrade',
      screenshotPath: supportErrorHelpScreenshotPath,
    }),
  );
  supportErrorReads.push(
    await runSupportErrorRead({
      operationId: 'listSupportTickets',
      route: '/w/support',
      successMarker: 'Rút USDT bị pending quá lâu',
      screenshotPath: supportErrorTicketsScreenshotPath,
    }),
  );
  const supportErrorOperationIds = Object.entries(supportErrorOperationRequestCounts)
    .filter(([, requestCount]) => requestCount > 0)
    .map(([operationId]) => operationId);
  const supportErrorElapsedMs = Date.now() - supportErrorStartedAt;
  const supportErrorFinalRoute = new URL(page.url()).pathname;
  assert.deepEqual(supportErrorOperationIds, [
    'listNews',
    'listNotifications',
    'getHelpCenter',
    'listSupportTickets',
  ]);
  assert.equal(supportErrorUnexpectedRequestCount, 0);
  assert.equal(supportErrorOperationRequestCounts.listNews, 12);
  assert.equal(supportErrorOperationRequestCounts.listNotifications, 12);
  assert.equal(supportErrorOperationRequestCounts.getHelpCenter, 12);
  assert.equal(supportErrorOperationRequestCounts.listSupportTickets, 12);
  assert.equal(supportErrorOperationRequestCounts.markNotificationRead, 0);
  assert.equal(supportErrorOperationRequestCounts.createSupportTicket, 0);
  assert.ok(
    supportErrorResponses.every(
      (response) => response.status === 503 && response.fromServiceWorker,
    ),
  );
  assert.equal(supportErrorFinalRoute, '/w/support');
  page.off('request', collectSupportErrorRequests);
  page.off('response', collectSupportErrorResponses);

  await signInDeveloperThroughPreview();
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.empty').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const tradingEmptyOperationIds = ['listOpenOrders', 'listOpenPositions', 'listOrderHistory'];
  const tradingEmptyRequestCounts = Object.fromEntries(
    tradingEmptyOperationIds.map((operationId) => [operationId, 0]),
  );
  const tradingEmptyRequests = [];
  const tradingEmptyResponses = [];
  const unexpectedTradingEmptyRequests = [];
  const tradingEmptyOperationForRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (request.method() === 'GET' && requestPath.endsWith('/api/trading/orders/history')) {
      return 'listOrderHistory';
    }
    if (request.method() === 'GET' && requestPath.endsWith('/api/trading/orders')) {
      return 'listOpenOrders';
    }
    if (request.method() === 'GET' && requestPath.endsWith('/api/trading/positions')) {
      return 'listOpenPositions';
    }
    return null;
  };
  const collectTradingEmptyRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/trading/')) return;
    const operationId = tradingEmptyOperationForRequest(request);
    if (!operationId) {
      unexpectedTradingEmptyRequests.push({ method: request.method(), path: requestPath });
      return;
    }
    tradingEmptyRequestCounts[operationId] += 1;
    tradingEmptyRequests.push({
      operationId,
      method: request.method(),
      path: requestPath,
      query: new URL(request.url()).search,
    });
  };
  const collectTradingEmptyResponses = (response) => {
    const operationId = tradingEmptyOperationForRequest(response.request());
    if (!operationId) return;
    tradingEmptyResponses.push({
      operationId,
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectTradingEmptyRequests);
  page.on('response', collectTradingEmptyResponses);

  const tradingEmptyStartedAt = Date.now();
  const openOrdersResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/trade/orders-history');
  const openOrdersResponse = await openOrdersResponsePromise;
  const openOrdersPayload = await openOrdersResponse.json();
  await page.getByText('Không có lệnh đang mở', { exact: true }).waitFor();
  await page.screenshot({ path: tradingEmptyOpenOrdersScreenshotPath, fullPage: true });

  const orderHistoryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/orders/history') &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
  const orderHistoryResponse = await orderHistoryResponsePromise;
  const orderHistoryPayload = await orderHistoryResponse.json();
  await page.getByText('Chưa có lịch sử giao dịch', { exact: true }).waitFor();
  await page.screenshot({ path: tradingEmptyHistoryScreenshotPath, fullPage: true });

  const positionsResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/positions') &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/trade/positions');
  const positionsResponse = await positionsResponsePromise;
  const positionsPayload = await positionsResponse.json();
  await page.getByText('Không có vị thế phù hợp.', { exact: true }).waitFor();
  assert.equal(
    await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true }).count(),
    0,
  );
  await page.screenshot({ path: tradingEmptyPositionsScreenshotPath, fullPage: true });

  const tradingEmptyElapsedMs = Date.now() - tradingEmptyStartedAt;
  const tradingEmptyFinalRoute = new URL(page.url()).pathname;
  assert.equal(openOrdersResponse.status(), 200);
  assert.equal(openOrdersResponse.fromServiceWorker(), true);
  assert.deepEqual(openOrdersPayload, { items: [] });
  assert.equal(orderHistoryResponse.status(), 200);
  assert.equal(orderHistoryResponse.fromServiceWorker(), true);
  assert.deepEqual(orderHistoryPayload, { items: [] });
  assert.equal(positionsResponse.status(), 200);
  assert.equal(positionsResponse.fromServiceWorker(), true);
  assert.deepEqual(positionsPayload.items, []);
  assert.ok(Number.isFinite(Date.parse(positionsPayload.updatedAt)));
  assert.deepEqual(
    Object.keys(tradingEmptyRequestCounts).filter(
      (operationId) => tradingEmptyRequestCounts[operationId] > 0,
    ),
    tradingEmptyOperationIds,
  );
  assert.ok(
    tradingEmptyOperationIds.every((operationId) => tradingEmptyRequestCounts[operationId] === 1),
  );
  assert.deepEqual(unexpectedTradingEmptyRequests, []);
  assert.equal(tradingEmptyFinalRoute, '/w/trade/positions');
  page.off('request', collectTradingEmptyRequests);
  page.off('response', collectTradingEmptyResponses);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.loading').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const tradingLoadingOperationIds = [...tradingEmptyOperationIds];
  const tradingLoadingRequestCounts = Object.fromEntries(
    tradingLoadingOperationIds.map((operationId) => [operationId, 0]),
  );
  const tradingLoadingRequests = [];
  const tradingLoadingResponses = [];
  const unexpectedTradingLoadingRequests = [];
  const collectTradingLoadingRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/trading/')) return;
    const operationId = tradingEmptyOperationForRequest(request);
    if (!operationId) {
      unexpectedTradingLoadingRequests.push({ method: request.method(), path: requestPath });
      return;
    }
    tradingLoadingRequestCounts[operationId] += 1;
    tradingLoadingRequests.push({
      operationId,
      method: request.method(),
      path: requestPath,
      query: new URL(request.url()).search,
    });
  };
  const collectTradingLoadingResponses = (response) => {
    const operationId = tradingEmptyOperationForRequest(response.request());
    if (!operationId) return;
    tradingLoadingResponses.push({
      operationId,
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectTradingLoadingRequests);
  page.on('response', collectTradingLoadingResponses);

  const tradingLoadingStartedAt = Date.now();
  const observeTradingLoadingRead = async ({
    operationId,
    route,
    loadingText,
    emptyText,
    screenshotPath,
  }) => {
    const startedAt = Date.now();
    await navigateWithinSpa(route);
    await page.getByText(loadingText, { exact: true }).waitFor();
    const responsePromise = page.waitForResponse(
      (response) => tradingEmptyOperationForRequest(response.request()) === operationId,
      { timeout: 60_000 },
    );
    const loadingObservedAfterMs = Date.now() - startedAt;
    const responsePendingWhenLoadingObserved = await Promise.race([
      responsePromise.then(() => false),
      page.waitForTimeout(0).then(() => true),
    ]);
    assert.equal(responsePendingWhenLoadingObserved, true);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const response = await responsePromise;
    const payload = await response.json();
    assert.ok(Array.isArray(payload.items));
    await page.getByText(loadingText, { exact: true }).waitFor({ state: 'detached' });
    if (payload.items.length === 0) {
      await page.getByText(emptyText, { exact: true }).waitFor();
    } else {
      const visiblePair = payload.items[0].pair ?? payload.items[0].symbol;
      assert.equal(typeof visiblePair, 'string');
      await page.getByText(visiblePair, { exact: false }).first().waitFor();
    }

    return {
      operationId,
      route,
      method: response.request().method(),
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      itemCount: payload.items.length,
      loadingObservedAfterMs,
      responseElapsedMs: Date.now() - startedAt,
      responsePendingWhenLoadingObserved,
      visibleEmptyState: payload.items.length === 0,
      visibleFixtureData: payload.items.length > 0,
      screenshot: path.basename(screenshotPath),
    };
  };
  const tradingLoadingReads = [];
  tradingLoadingReads.push(
    await observeTradingLoadingRead({
      operationId: 'listOpenOrders',
      route: '/w/trade/orders-history',
      loadingText: 'Đang tải dữ liệu lệnh…',
      emptyText: 'Không có lệnh đang mở',
      screenshotPath: tradingLoadingOpenOrdersScreenshotPath,
    }),
  );
  const tradingLoadingHistoryStartedAt = Date.now();
  await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
  await page.getByText('Đang tải dữ liệu lệnh…', { exact: true }).waitFor();
  const tradingLoadingHistoryResponsePromise = page.waitForResponse(
    (response) => tradingEmptyOperationForRequest(response.request()) === 'listOrderHistory',
    { timeout: 60_000 },
  );
  const tradingLoadingHistoryLoadingObservedAt = Date.now();
  const historyResponsePendingWhenLoadingObserved = await Promise.race([
    tradingLoadingHistoryResponsePromise.then(() => false),
    page.waitForTimeout(0).then(() => true),
  ]);
  assert.equal(historyResponsePendingWhenLoadingObserved, true);
  await page.screenshot({ path: tradingLoadingHistoryScreenshotPath, fullPage: true });
  const tradingLoadingHistoryResponse = await tradingLoadingHistoryResponsePromise;
  const tradingLoadingHistoryPayload = await tradingLoadingHistoryResponse.json();
  assert.ok(Array.isArray(tradingLoadingHistoryPayload.items));
  await page.getByText('Đang tải dữ liệu lệnh…', { exact: true }).waitFor({ state: 'detached' });
  if (tradingLoadingHistoryPayload.items.length === 0) {
    await page.getByText('Chưa có lịch sử giao dịch', { exact: true }).waitFor();
  } else {
    const visiblePair =
      tradingLoadingHistoryPayload.items[0].pair ?? tradingLoadingHistoryPayload.items[0].symbol;
    assert.equal(typeof visiblePair, 'string');
    await page.getByText(visiblePair, { exact: false }).first().waitFor();
  }
  tradingLoadingReads.push({
    operationId: 'listOrderHistory',
    route: '/w/trade/orders-history (tab Lịch sử)',
    method: tradingLoadingHistoryResponse.request().method(),
    status: tradingLoadingHistoryResponse.status(),
    fromServiceWorker: tradingLoadingHistoryResponse.fromServiceWorker(),
    itemCount: tradingLoadingHistoryPayload.items.length,
    loadingObservedAfterMs: tradingLoadingHistoryLoadingObservedAt - tradingLoadingHistoryStartedAt,
    responseElapsedMs: Date.now() - tradingLoadingHistoryStartedAt,
    responsePendingWhenLoadingObserved: historyResponsePendingWhenLoadingObserved,
    visibleEmptyState: tradingLoadingHistoryPayload.items.length === 0,
    visibleFixtureData: tradingLoadingHistoryPayload.items.length > 0,
    screenshot: path.basename(tradingLoadingHistoryScreenshotPath),
  });

  const tradingLoadingPositionsStartedAt = Date.now();
  await navigateWithinSpa('/w/trade/positions');
  await page.getByText('Đang tải vị thế…', { exact: true }).waitFor();
  const tradingLoadingPositionsResponsePromise = page.waitForResponse(
    (response) => tradingEmptyOperationForRequest(response.request()) === 'listOpenPositions',
    { timeout: 60_000 },
  );
  const tradingLoadingPositionsLoadingObservedAfterMs =
    Date.now() - tradingLoadingPositionsStartedAt;
  const tradingLoadingPositionsResponsePendingWhenLoadingObserved = await Promise.race([
    tradingLoadingPositionsResponsePromise.then(() => false),
    page.waitForTimeout(0).then(() => true),
  ]);
  assert.equal(tradingLoadingPositionsResponsePendingWhenLoadingObserved, true);
  await page.screenshot({ path: tradingLoadingPositionsScreenshotPath, fullPage: true });
  const tradingLoadingPositionsResponse = await tradingLoadingPositionsResponsePromise;
  const tradingLoadingPositionsPayload = await tradingLoadingPositionsResponse.json();
  assert.equal(tradingLoadingPositionsResponse.status(), 503);
  assert.equal(tradingLoadingPositionsPayload.code, 'positions_source_unavailable');
  await page
    .getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true })
    .waitFor({ timeout: 60_000 });
  await page.screenshot({ path: tradingLoadingPositionsErrorScreenshotPath, fullPage: true });
  tradingLoadingReads.push({
    operationId: 'listOpenPositions',
    route: '/w/trade/positions',
    method: tradingLoadingPositionsResponse.request().method(),
    status: tradingLoadingPositionsResponse.status(),
    fromServiceWorker: tradingLoadingPositionsResponse.fromServiceWorker(),
    errorCode: tradingLoadingPositionsPayload.code,
    loadingObservedAfterMs: tradingLoadingPositionsLoadingObservedAfterMs,
    responseElapsedMs: Date.now() - tradingLoadingPositionsStartedAt,
    responsePendingWhenLoadingObserved: tradingLoadingPositionsResponsePendingWhenLoadingObserved,
    finalUnavailableStateVisible: true,
    screenshot: path.basename(tradingLoadingPositionsScreenshotPath),
    finalScreenshot: path.basename(tradingLoadingPositionsErrorScreenshotPath),
  });

  const tradingLoadingElapsedMs = Date.now() - tradingLoadingStartedAt;
  const tradingLoadingFinalRoute = new URL(page.url()).pathname;
  const tradingLoadingResponseCounts = Object.fromEntries(
    tradingLoadingOperationIds.map((operationId) => [
      operationId,
      tradingLoadingResponses.filter((response) => response.operationId === operationId).length,
    ]),
  );
  assert.deepEqual(
    Object.keys(tradingLoadingRequestCounts).filter(
      (operationId) => tradingLoadingRequestCounts[operationId] > 0,
    ),
    tradingLoadingOperationIds,
  );
  assert.equal(tradingLoadingRequestCounts.listOpenOrders, 1);
  assert.equal(tradingLoadingRequestCounts.listOrderHistory, 1);
  assert.ok(tradingLoadingRequestCounts.listOpenPositions >= 1);
  assert.deepEqual(unexpectedTradingLoadingRequests, []);
  assert.equal(tradingLoadingFinalRoute, '/w/trade/positions');
  assert.ok(tradingLoadingResponses.every((response) => response.fromServiceWorker));
  page.off('request', collectTradingLoadingRequests);
  page.off('response', collectTradingLoadingResponses);

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.error').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const tradingErrorRequests = [];
  const tradingErrorResponses = [];
  const unexpectedTradingErrorRequests = [];
  const collectTradingErrorRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/trading/')) return;
    if (request.method() !== 'GET' || !requestPath.endsWith('/api/trading/positions')) {
      unexpectedTradingErrorRequests.push({ method: request.method(), path: requestPath });
      return;
    }
    tradingErrorRequests.push({
      operationId: 'listOpenPositions',
      method: request.method(),
      path: requestPath,
    });
  };
  const collectTradingErrorResponse = (response) => {
    if (!new URL(response.url()).pathname.endsWith('/api/trading/positions')) return;
    tradingErrorResponses.push({
      operationId: 'listOpenPositions',
      method: response.request().method(),
      path: new URL(response.url()).pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectTradingErrorRequest);
  page.on('response', collectTradingErrorResponse);

  const waitForTradingErrorIdle = async () => {
    const deadline = Date.now() + 60_000;
    let lastCount = tradingErrorRequests.length;
    let lastChangeAt = Date.now();
    while (Date.now() < deadline) {
      await page.waitForTimeout(250);
      if (tradingErrorRequests.length !== lastCount) {
        lastCount = tradingErrorRequests.length;
        lastChangeAt = Date.now();
      }
      if (Date.now() - lastChangeAt >= 2_000) return;
    }
    throw new Error('Trading positions retry cycle did not settle within 60 seconds.');
  };

  const tradingErrorStartedAt = Date.now();
  await navigateWithinSpa('/w/trade/positions');
  await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true }).waitFor({
    timeout: 60_000,
  });
  await page
    .getByText('Frontend chưa có backend cung cấp dữ liệu tài khoản.', { exact: true })
    .waitFor();
  const tradingErrorRetryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
  await tradingErrorRetryButton.waitFor();
  assert.equal(await page.getByText('Không có vị thế phù hợp.', { exact: true }).count(), 0);
  await waitForTradingErrorIdle();
  const tradingErrorInitialRequestCount = tradingErrorRequests.length;
  const tradingErrorInitialResponseCount = tradingErrorResponses.length;
  assert.ok(tradingErrorInitialRequestCount > 0);
  assert.ok(
    tradingErrorResponses.every(
      (response) => response.status === 503 && response.fromServiceWorker,
    ),
  );
  await page.screenshot({ path: tradingErrorPositionsScreenshotPath, fullPage: true });

  const tradingErrorRetryStartedAt = Date.now();
  const retryPositionResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/positions') &&
      response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  await tradingErrorRetryButton.click();
  const retryPositionResponse = await retryPositionResponsePromise;
  const retryPositionPayload = await retryPositionResponse.json();
  assert.equal(retryPositionResponse.status(), 503);
  assert.equal(retryPositionPayload.code, 'positions_source_unavailable');
  await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true }).waitFor({
    timeout: 60_000,
  });
  await tradingErrorRetryButton.waitFor();
  await waitForTradingErrorIdle();
  const tradingErrorRetryRequestCount =
    tradingErrorRequests.length - tradingErrorInitialRequestCount;
  const tradingErrorElapsedMs = Date.now() - tradingErrorStartedAt;
  const tradingErrorFinalRoute = new URL(page.url()).pathname;
  assert.ok(tradingErrorRetryRequestCount > 0);
  assert.deepEqual(unexpectedTradingErrorRequests, []);
  assert.equal(tradingErrorFinalRoute, '/w/trade/positions');
  assert.ok(
    tradingErrorResponses.every(
      (response) => response.status === 503 && response.fromServiceWorker,
    ),
  );
  page.off('request', collectTradingErrorRequest);
  page.off('response', collectTradingErrorResponse);
  const tradingErrorEvidence = {
    scenario: {
      id: 'trading.error',
      domain: 'trading',
      state: 'error',
      status: 'passed',
      persona: 'developer',
      route: tradingErrorFinalRoute,
      operationIds: ['listOpenPositions'],
      visibleError: true,
      visibleRetryAction: true,
      falseEmptyStateVisible: false,
      responseStatus: retryPositionResponse.status(),
      responseCode: retryPositionPayload.code,
      initialRequestCount: tradingErrorInitialRequestCount,
      initialResponseCount: tradingErrorInitialResponseCount,
      retryRequestCount: tradingErrorRetryRequestCount,
      requests: tradingErrorRequests,
      responses: tradingErrorResponses,
      unexpectedTradingRequestCount: unexpectedTradingErrorRequests.length,
      writeRequestCount: unexpectedTradingErrorRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      retryActionUsed: true,
      retryElapsedMs: Date.now() - tradingErrorRetryStartedAt,
      elapsedMs: tradingErrorElapsedMs,
      screenshot: path.basename(tradingErrorPositionsScreenshotPath),
      note: 'Representative Trading error evidence is limited to listOpenPositions, the only Trading operation declaring HTTP 503. Order/history/copy operations are not covered by this row. The selected scenario falls through to the existing local MSW handler, which returns positions_source_unavailable; this is not backend availability, staging or user-acceptance evidence.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.unauthorized').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const tradingUnauthorizedRequests = [];
  const tradingUnauthorizedResponses = [];
  const tradingUnauthorizedRefreshRequests = [];
  const tradingUnauthorizedRefreshResponses = [];
  const unexpectedTradingUnauthorizedRequests = [];
  const collectTradingUnauthorizedRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath === '/api/auth/refresh' && request.method() === 'POST') {
      tradingUnauthorizedRefreshRequests.push({ method: request.method(), path: requestPath });
      return;
    }
    if (!requestPath.startsWith('/api/trading/')) return;
    if (request.method() === 'GET' && requestPath.endsWith('/api/trading/positions')) {
      tradingUnauthorizedRequests.push({
        operationId: 'listOpenPositions',
        method: request.method(),
        path: requestPath,
      });
    } else {
      unexpectedTradingUnauthorizedRequests.push({ method: request.method(), path: requestPath });
    }
  };
  const collectTradingUnauthorizedResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    if (responsePath === '/api/auth/refresh' && response.request().method() === 'POST') {
      tradingUnauthorizedRefreshResponses.push({
        method: response.request().method(),
        path: responsePath,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
      return;
    }
    if (responsePath.endsWith('/api/trading/positions')) {
      tradingUnauthorizedResponses.push({
        operationId: 'listOpenPositions',
        method: response.request().method(),
        path: responsePath,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectTradingUnauthorizedRequest);
  page.on('response', collectTradingUnauthorizedResponse);

  const tradingUnauthorizedStartedAt = Date.now();
  const loginNavigationPromise = page.waitForURL(/\/(?:w\/)?auth\/login$/, {
    timeout: 60_000,
  });
  const tradingUnauthorizedReadPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/positions') &&
      response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  const tradingUnauthorizedRefreshPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/refresh' &&
      response.request().method() === 'POST',
    { timeout: 60_000 },
  );
  await page.evaluate((route) => {
    window.history.pushState({}, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, '/w/trade/positions');
  const [tradingUnauthorizedRead, tradingUnauthorizedRefresh] = await Promise.all([
    tradingUnauthorizedReadPromise,
    tradingUnauthorizedRefreshPromise,
    loginNavigationPromise,
  ]);
  const tradingUnauthorizedReadPayload = await tradingUnauthorizedRead.json();
  const tradingUnauthorizedRefreshPayload = await tradingUnauthorizedRefresh.json();
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  await page.waitForTimeout(500);
  const tradingUnauthorizedStalePositionsVisible =
    (await page.getByText('Nguồn dữ liệu vị thế chưa được kết nối', { exact: true }).count()) > 0 ||
    (await page.getByText('Không có vị thế phù hợp.', { exact: true }).count()) > 0;
  const tradingUnauthorizedFinalRoute = new URL(page.url()).pathname;
  const tradingUnauthorizedElapsedMs = Date.now() - tradingUnauthorizedStartedAt;
  assert.equal(tradingUnauthorizedRead.status(), 401);
  assert.equal(tradingUnauthorizedReadPayload.code, 'PREVIEW_UNAUTHORIZED');
  assert.equal(tradingUnauthorizedRefresh.status(), 401);
  assert.equal(tradingUnauthorizedRefreshPayload.code, 'SESSION_EXPIRED');
  assert.ok(tradingUnauthorizedResponses.length > 0);
  assert.ok(tradingUnauthorizedRefreshResponses.length > 0);
  assert.ok(
    tradingUnauthorizedResponses.every(
      (response) => response.status === 401 && response.fromServiceWorker,
    ),
  );
  assert.ok(
    tradingUnauthorizedRefreshResponses.every(
      (response) => response.status === 401 && response.fromServiceWorker,
    ),
  );
  assert.deepEqual(unexpectedTradingUnauthorizedRequests, []);
  assert.equal(tradingUnauthorizedStalePositionsVisible, false);
  assert.match(tradingUnauthorizedFinalRoute, /\/(?:w\/)?auth\/login$/);
  await page.screenshot({ path: tradingUnauthorizedLoginScreenshotPath, fullPage: true });
  page.off('request', collectTradingUnauthorizedRequest);
  page.off('response', collectTradingUnauthorizedResponse);
  const tradingUnauthorizedEvidence = {
    scenario: {
      id: 'trading.unauthorized',
      domain: 'trading',
      state: 'unauthorized',
      status: 'passed',
      persona: 'developer',
      route: tradingUnauthorizedFinalRoute,
      operationIds: ['listOpenPositions'],
      readRequestCount: tradingUnauthorizedRequests.length,
      readResponses: tradingUnauthorizedResponses,
      refreshRequestCount: tradingUnauthorizedRefreshRequests.length,
      refreshResponses: tradingUnauthorizedRefreshResponses,
      unauthorizedCode: tradingUnauthorizedReadPayload.code,
      refreshCode: tradingUnauthorizedRefreshPayload.code,
      redirectedToLogin: true,
      stalePositionsVisible: tradingUnauthorizedStalePositionsVisible,
      unexpectedTradingRequestCount: unexpectedTradingUnauthorizedRequests.length,
      writeRequestCount: unexpectedTradingUnauthorizedRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      elapsedMs: tradingUnauthorizedElapsedMs,
      screenshot: path.basename(tradingUnauthorizedLoginScreenshotPath),
      note: 'Representative Trading unauthorized evidence covers listOpenPositions only. OpenAPI declares 401 for this and all 12 other Trading operations; all routes were not exercised. Local MSW returns 401, session refresh returns 401 and the protected route redirects to login without retaining positions UI. This is not backend authorization, staging or user-acceptance evidence.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Tài khoản xem trước').selectOption('developer');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page.waitForURL('**/w/home');
  if ((await page.getByLabel('Miền API').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('trading');
  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('trading.forbidden').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const tradingForbiddenRequests = [];
  const tradingForbiddenResponses = [];
  const unexpectedTradingForbiddenRequests = [];
  const collectTradingForbiddenRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/trading/')) return;
    if (request.method() === 'GET' && requestPath.endsWith('/api/trading/positions')) {
      tradingForbiddenRequests.push({
        operationId: 'listOpenPositions',
        method: request.method(),
        path: requestPath,
      });
      return;
    }
    unexpectedTradingForbiddenRequests.push({ method: request.method(), path: requestPath });
  };
  const collectTradingForbiddenResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    if (responsePath.endsWith('/api/trading/positions')) {
      tradingForbiddenResponses.push({
        operationId: 'listOpenPositions',
        method: response.request().method(),
        path: responsePath,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectTradingForbiddenRequest);
  page.on('response', collectTradingForbiddenResponse);
  const tradingForbiddenStartedAt = Date.now();
  const tradingForbiddenResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/api/trading/positions') &&
      response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  await navigateWithinSpa('/w/trade/positions');
  const tradingForbiddenResponse = await tradingForbiddenResponsePromise;
  const tradingForbiddenPayload = await tradingForbiddenResponse.json();
  await page.getByText('Không có quyền xem vị thế', { exact: true }).waitFor();
  const tradingForbiddenDeniedVisible =
    (await page
      .getByText('Tài khoản của bạn không có quyền xem vị thế.', { exact: true })
      .count()) > 0;
  const tradingForbiddenEmptyVisible =
    (await page.getByText('Không có vị thế phù hợp.', { exact: true }).count()) > 0;
  const tradingForbiddenRetryVisible =
    (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) > 0;
  const tradingForbiddenElapsedMs = Date.now() - tradingForbiddenStartedAt;
  assert.equal(tradingForbiddenResponse.status(), 403);
  assert.equal(tradingForbiddenPayload.code, 'PREVIEW_FORBIDDEN');
  assert.ok(tradingForbiddenResponse.fromServiceWorker());
  assert.ok(tradingForbiddenDeniedVisible);
  assert.equal(tradingForbiddenEmptyVisible, false);
  assert.equal(tradingForbiddenRetryVisible, false);
  assert.ok(tradingForbiddenRequests.length > 0);
  assert.equal(tradingForbiddenRequests.length, tradingForbiddenResponses.length);
  assert.ok(
    tradingForbiddenResponses.every(
      (response) => response.status === 403 && response.fromServiceWorker,
    ),
  );
  assert.deepEqual(unexpectedTradingForbiddenRequests, []);
  await page.screenshot({ path: tradingForbiddenPositionsScreenshotPath, fullPage: true });
  page.off('request', collectTradingForbiddenRequest);
  page.off('response', collectTradingForbiddenResponse);
  const tradingForbiddenEvidence = {
    scenario: {
      id: 'trading.forbidden',
      domain: 'trading',
      state: 'forbidden',
      status: 'passed',
      persona: 'developer',
      route: '/w/trade/positions',
      operationIds: ['listOpenPositions'],
      declared403OperationCount: 10,
      readRequestCount: tradingForbiddenRequests.length,
      readResponses: tradingForbiddenResponses,
      responseCode: tradingForbiddenPayload.code,
      permissionDeniedVisible: tradingForbiddenDeniedVisible,
      falseEmptyStateVisible: tradingForbiddenEmptyVisible,
      retryActionVisible: tradingForbiddenRetryVisible,
      unexpectedTradingRequestCount: unexpectedTradingForbiddenRequests.length,
      writeRequestCount: unexpectedTradingForbiddenRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      elapsedMs: tradingForbiddenElapsedMs,
      screenshot: path.basename(tradingForbiddenPositionsScreenshotPath),
      note: 'Representative Trading forbidden evidence exercises listOpenPositions only, one of the 10 operations declaring 403. The query retries the GET once in this run, and every attempt receives 403 from MSW. The UI shows explicit permission denial without an empty state or Retry. This is not backend authorization, staging or user-acceptance evidence.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await signInAdminThroughPreview();
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.success').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const adminOperationPaths = {
    getAdminOverview: '/api/admin/overview',
    getAdminFunnel: '/api/admin/analytics/funnel',
    listAdminAbTests: '/api/admin/analytics/ab-tests',
  };
  const adminOperationRequestCounts = Object.fromEntries(
    Object.keys(adminOperationPaths).map((operationId) => [operationId, 0]),
  );
  const adminRequests = [];
  const adminResponses = [];
  const unexpectedAdminRequests = [];
  const collectAdminRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/admin/')) return;
    const operationId = Object.entries(adminOperationPaths).find(
      ([, pathname]) => pathname === requestPath,
    )?.[0];
    if (operationId && request.method() === 'GET') {
      adminOperationRequestCounts[operationId] += 1;
      adminRequests.push({ operationId, method: request.method(), path: requestPath });
      return;
    }
    unexpectedAdminRequests.push({ method: request.method(), path: requestPath });
  };
  const collectAdminResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    const operationId = Object.entries(adminOperationPaths).find(
      ([, pathname]) => pathname === responsePath,
    )?.[0];
    if (!operationId) return;
    adminResponses.push({
      operationId,
      method: response.request().method(),
      path: responsePath,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectAdminRequest);
  page.on('response', collectAdminResponse);
  const adminStartedAt = Date.now();
  await navigateWithinSpa('/w/admin');
  await page.getByText('Active users', { exact: true }).waitFor();
  await page.getByText('1.284', { exact: true }).waitFor();
  await page.screenshot({ path: adminOverviewScreenshotPath, fullPage: true });
  await navigateWithinSpa('/w/admin/funnels');
  await page.getByText('Funnel analytics', { exact: true }).waitFor();
  await page.getByText('10.000 users', { exact: true }).waitFor();
  await page.screenshot({ path: adminFunnelScreenshotPath, fullPage: true });
  await navigateWithinSpa('/w/admin/abtests');
  await page.getByText('trade-terminal-v2', { exact: true }).waitFor();
  await page.getByText('control: 50%', { exact: true }).waitFor();
  await page.screenshot({ path: adminAbTestsScreenshotPath, fullPage: true });
  const adminFinalRoute = new URL(page.url()).pathname;
  const adminElapsedMs = Date.now() - adminStartedAt;
  assert.equal(adminFinalRoute, '/w/admin/abtests');
  assert.deepEqual(adminOperationRequestCounts, {
    getAdminOverview: 1,
    getAdminFunnel: 1,
    listAdminAbTests: 1,
  });
  assert.equal(adminResponses.length, 3);
  assert.ok(
    adminResponses.every((response) => response.status === 200 && response.fromServiceWorker),
  );
  assert.deepEqual(unexpectedAdminRequests, []);
  page.off('request', collectAdminRequest);
  page.off('response', collectAdminResponse);
  const adminSuccessEvidence = {
    scenario: {
      id: 'admin.success',
      domain: 'admin',
      state: 'success',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin', '/w/admin/funnels', '/w/admin/abtests'],
      operationIds: [
        'getAdminOverview',
        'getAdminFunnel',
        'listAdminAbTests',
        'getAdminAbTest',
        'updateAdminFeatureFlag',
      ],
      observedOperationIds: Object.keys(adminOperationPaths),
      operationRequestCounts: adminOperationRequestCounts,
      responses: adminResponses,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      unexpectedAdminRequestCount: unexpectedAdminRequests.length,
      writeRequestCount: unexpectedAdminRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute: adminFinalRoute,
      elapsedMs: adminElapsedMs,
      screenshots: [
        path.basename(adminOverviewScreenshotPath),
        path.basename(adminFunnelScreenshotPath),
        path.basename(adminAbTestsScreenshotPath),
      ],
      note: 'Representative Admin UI evidence covers the three readable operations reachable from current routes. getAdminAbTest has no detail route/link and updateAdminFeatureFlag has no current UI form; the read-only mock persona deliberately cannot perform that privileged mutation. All responses are local MSW fixtures, not backend or staging evidence.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Trạng thái phản hồi').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.empty').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const adminEmptyOperationPaths = {
    getAdminFunnel: '/api/admin/analytics/funnel',
    listAdminAbTests: '/api/admin/analytics/ab-tests',
  };
  const adminEmptyOperationRequestCounts = Object.fromEntries(
    Object.keys(adminEmptyOperationPaths).map((operationId) => [operationId, 0]),
  );
  const adminEmptyResponses = [];
  const unexpectedAdminEmptyRequests = [];
  const collectAdminEmptyRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/admin/')) return;
    const operationId = Object.entries(adminEmptyOperationPaths).find(
      ([, pathname]) => pathname === requestPath,
    )?.[0];
    if (operationId && request.method() === 'GET') {
      adminEmptyOperationRequestCounts[operationId] += 1;
      return;
    }
    unexpectedAdminEmptyRequests.push({ method: request.method(), path: requestPath });
  };
  const collectAdminEmptyResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    const operationId = Object.entries(adminEmptyOperationPaths).find(
      ([, pathname]) => pathname === responsePath,
    )?.[0];
    if (!operationId) return;
    adminEmptyResponses.push({
      operationId,
      method: response.request().method(),
      path: responsePath,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectAdminEmptyRequest);
  page.on('response', collectAdminEmptyResponse);
  const adminEmptyStartedAt = Date.now();
  await navigateWithinSpa('/w/admin/funnels');
  await page.getByText('Chưa có dữ liệu funnel.', { exact: true }).waitFor();
  await page.screenshot({ path: adminEmptyFunnelScreenshotPath, fullPage: true });
  await navigateWithinSpa('/w/admin/abtests');
  await page.getByText('Chưa có A/B test nào.', { exact: true }).waitFor();
  await page.screenshot({ path: adminEmptyAbTestsScreenshotPath, fullPage: true });
  const adminEmptyFinalRoute = new URL(page.url()).pathname;
  const adminEmptyElapsedMs = Date.now() - adminEmptyStartedAt;
  assert.equal(adminEmptyFinalRoute, '/w/admin/abtests');
  assert.deepEqual(adminEmptyOperationRequestCounts, {
    getAdminFunnel: 1,
    listAdminAbTests: 1,
  });
  assert.equal(adminEmptyResponses.length, 2);
  assert.ok(
    adminEmptyResponses.every((response) => response.status === 200 && response.fromServiceWorker),
  );
  assert.deepEqual(unexpectedAdminEmptyRequests, []);
  page.off('request', collectAdminEmptyRequest);
  page.off('response', collectAdminEmptyResponse);
  const adminEmptyEvidence = {
    scenario: {
      id: 'admin.empty',
      domain: 'admin',
      state: 'empty',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin/funnels', '/w/admin/abtests'],
      operationIds: ['getAdminFunnel', 'listAdminAbTests'],
      observedOperationIds: Object.keys(adminEmptyOperationPaths),
      operationRequestCounts: adminEmptyOperationRequestCounts,
      responses: adminEmptyResponses,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      unexpectedAdminRequestCount: unexpectedAdminEmptyRequests.length,
      writeRequestCount: unexpectedAdminEmptyRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute: adminEmptyFinalRoute,
      elapsedMs: adminEmptyElapsedMs,
      screenshots: [
        path.basename(adminEmptyFunnelScreenshotPath),
        path.basename(adminEmptyAbTestsScreenshotPath),
      ],
      note: 'Empty evidence covers only the contract collection reads getAdminFunnel and listAdminAbTests; required overview metrics remain outside the empty scenario. Both empty arrays came from local MSW and rendered explicit UI states. The A/B test detail route and feature-flag write UI are absent; no mutation was sent. This does not verify backend or staging behavior.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Trạng thái phản hồi').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.loading').waitFor();
  await navigateWithinSpa('/w/markets/overview');
  await signInAdminThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('admin.loading').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const adminLoadingOperationPaths = {
    getAdminOverview: '/api/admin/overview',
    getAdminFunnel: '/api/admin/analytics/funnel',
    listAdminAbTests: '/api/admin/analytics/ab-tests',
  };
  const adminLoadingOperationRequestCounts = Object.fromEntries(
    Object.keys(adminLoadingOperationPaths).map((operationId) => [operationId, 0]),
  );
  const adminLoadingRequestStartedAt = {};
  const adminLoadingResponses = [];
  const adminLoadingObservations = [];
  const unexpectedAdminLoadingRequests = [];
  const collectAdminLoadingRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/admin/')) return;
    const operationId = Object.entries(adminLoadingOperationPaths).find(
      ([, pathname]) => pathname === requestPath,
    )?.[0];
    if (operationId && request.method() === 'GET') {
      adminLoadingOperationRequestCounts[operationId] += 1;
      adminLoadingRequestStartedAt[operationId] = Date.now();
      return;
    }
    unexpectedAdminLoadingRequests.push({ method: request.method(), path: requestPath });
  };
  const collectAdminLoadingResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    const operationId = Object.entries(adminLoadingOperationPaths).find(
      ([, pathname]) => pathname === responsePath,
    )?.[0];
    if (!operationId) return;
    adminLoadingResponses.push({
      operationId,
      method: response.request().method(),
      path: responsePath,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
      elapsedMs: Date.now() - adminLoadingRequestStartedAt[operationId],
    });
  };
  page.on('request', collectAdminLoadingRequest);
  page.on('response', collectAdminLoadingResponse);

  const adminLoadingStartedAt = Date.now();
  await navigateWithinSpa('/w/admin');
  const overviewLoadingStartedAt = Date.now();
  await page.getByText('Đang tải dữ liệu quản trị…', { exact: true }).waitFor();
  adminLoadingObservations.push({
    operationId: 'getAdminOverview',
    route: '/w/admin',
    visibleBeforeResponse: !adminLoadingResponses.some(
      (response) => response.operationId === 'getAdminOverview',
    ),
    visibleMsAfterNavigation: Date.now() - overviewLoadingStartedAt,
  });
  assert.equal(adminLoadingObservations.at(-1).visibleBeforeResponse, true);
  await page.screenshot({ path: adminLoadingOverviewScreenshotPath, fullPage: true });
  await page.getByText('1.284', { exact: true }).waitFor();

  await navigateWithinSpa('/w/admin/funnels');
  const funnelLoadingStartedAt = Date.now();
  await page.getByText('Đang tải funnel…', { exact: true }).waitFor();
  adminLoadingObservations.push({
    operationId: 'getAdminFunnel',
    route: '/w/admin/funnels',
    visibleBeforeResponse: !adminLoadingResponses.some(
      (response) => response.operationId === 'getAdminFunnel',
    ),
    visibleMsAfterNavigation: Date.now() - funnelLoadingStartedAt,
  });
  assert.equal(adminLoadingObservations.at(-1).visibleBeforeResponse, true);
  await page.screenshot({ path: adminLoadingFunnelScreenshotPath, fullPage: true });
  await page.getByText('10.000 users', { exact: true }).waitFor();

  await navigateWithinSpa('/w/admin/abtests');
  const abTestsLoadingStartedAt = Date.now();
  await page.getByText('Đang tải A/B tests…', { exact: true }).waitFor();
  adminLoadingObservations.push({
    operationId: 'listAdminAbTests',
    route: '/w/admin/abtests',
    visibleBeforeResponse: !adminLoadingResponses.some(
      (response) => response.operationId === 'listAdminAbTests',
    ),
    visibleMsAfterNavigation: Date.now() - abTestsLoadingStartedAt,
  });
  assert.equal(adminLoadingObservations.at(-1).visibleBeforeResponse, true);
  await page.screenshot({ path: adminLoadingAbTestsScreenshotPath, fullPage: true });
  await page.getByText('trade-terminal-v2', { exact: true }).waitFor();

  const adminLoadingFinalRoute = new URL(page.url()).pathname;
  const adminLoadingElapsedMs = Date.now() - adminLoadingStartedAt;
  assert.equal(adminLoadingFinalRoute, '/w/admin/abtests');
  assert.deepEqual(adminLoadingOperationRequestCounts, {
    getAdminOverview: 1,
    getAdminFunnel: 1,
    listAdminAbTests: 1,
  });
  assert.equal(adminLoadingResponses.length, 3);
  assert.ok(
    adminLoadingResponses.every(
      (response) => response.status === 200 && response.fromServiceWorker,
    ),
  );
  assert.deepEqual(unexpectedAdminLoadingRequests, []);
  page.off('request', collectAdminLoadingRequest);
  page.off('response', collectAdminLoadingResponse);
  const adminLoadingEvidence = {
    scenario: {
      id: 'admin.loading',
      domain: 'admin',
      state: 'loading',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin', '/w/admin/funnels', '/w/admin/abtests'],
      operationIds: Object.keys(adminLoadingOperationPaths),
      observedOperationIds: Object.keys(adminLoadingOperationPaths),
      operationRequestCounts: adminLoadingOperationRequestCounts,
      responses: adminLoadingResponses,
      observations: adminLoadingObservations,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      unexpectedAdminRequestCount: unexpectedAdminLoadingRequests.length,
      writeRequestCount: unexpectedAdminLoadingRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      finalRoute: adminLoadingFinalRoute,
      elapsedMs: adminLoadingElapsedMs,
      screenshots: [
        path.basename(adminLoadingOverviewScreenshotPath),
        path.basename(adminLoadingFunnelScreenshotPath),
        path.basename(adminLoadingAbTestsScreenshotPath),
      ],
      note: 'Loading evidence covers the three current Admin read routes. Each loading label was visible before its delayed local MSW response returned HTTP 200; cache was cleared by reapplying the read-only Admin preview persona before measurement. The A/B test detail route and feature-flag write UI are absent; this does not verify backend or staging latency.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  if ((await page.getByLabel('Trạng thái phản hồi').count()) === 0) {
    await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  }
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.error').waitFor();
  await navigateWithinSpa('/w/markets/overview');
  await signInAdminThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('admin.error').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const adminErrorOperationPaths = {
    getAdminOverview: '/api/admin/overview',
    getAdminFunnel: '/api/admin/analytics/funnel',
    listAdminAbTests: '/api/admin/analytics/ab-tests',
  };
  const adminErrorOperationRequestCounts = Object.fromEntries(
    Object.keys(adminErrorOperationPaths).map((operationId) => [operationId, 0]),
  );
  const adminErrorResponses = [];
  const unexpectedAdminErrorRequests = [];
  const collectAdminErrorRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/admin/')) return;
    const operationId = Object.entries(adminErrorOperationPaths).find(
      ([, pathname]) => pathname === requestPath,
    )?.[0];
    if (operationId && request.method() === 'GET') {
      adminErrorOperationRequestCounts[operationId] += 1;
      return;
    }
    unexpectedAdminErrorRequests.push({ method: request.method(), path: requestPath });
  };
  const collectAdminErrorResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    const operationId = Object.entries(adminErrorOperationPaths).find(
      ([, pathname]) => pathname === responsePath,
    )?.[0];
    if (!operationId) return;
    adminErrorResponses.push({
      operationId,
      method: response.request().method(),
      path: responsePath,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectAdminErrorRequest);
  page.on('response', collectAdminErrorResponse);
  const adminErrorStartedAt = Date.now();
  await navigateWithinSpa('/w/admin');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  assert.equal(await page.getByText('1.284', { exact: true }).count(), 0);
  await page.screenshot({ path: adminErrorOverviewScreenshotPath, fullPage: true });
  await navigateWithinSpa('/w/admin/funnels');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  assert.equal(await page.getByText('Chưa có dữ liệu funnel.', { exact: true }).count(), 0);
  await page.screenshot({ path: adminErrorFunnelScreenshotPath, fullPage: true });
  await navigateWithinSpa('/w/admin/abtests');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Thử lại' }).waitFor();
  assert.equal(await page.getByText('Chưa có A/B test nào.', { exact: true }).count(), 0);
  const adminErrorFinalRoute = new URL(page.url()).pathname;
  await page.screenshot({ path: adminErrorAbTestsScreenshotPath, fullPage: true });
  const adminErrorElapsedMs = Date.now() - adminErrorStartedAt;
  assert.equal(adminErrorFinalRoute, '/w/admin/abtests');
  assert.ok(
    Object.values(adminErrorOperationRequestCounts).every((count) => count > 0),
    'Each current Admin read route must be requested during the error scenario.',
  );
  assert.ok(
    adminErrorResponses.length >= 3 &&
      adminErrorResponses.every(
        (response) => response.status === 503 && response.fromServiceWorker,
      ),
  );
  assert.deepEqual(unexpectedAdminErrorRequests, []);
  page.off('request', collectAdminErrorRequest);
  page.off('response', collectAdminErrorResponse);
  const adminErrorEvidence = {
    scenario: {
      id: 'admin.error',
      domain: 'admin',
      state: 'error',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: ['/w/admin', '/w/admin/funnels', '/w/admin/abtests'],
      operationIds: [
        'getAdminOverview',
        'getAdminFunnel',
        'listAdminAbTests',
        'getAdminAbTest',
        'updateAdminFeatureFlag',
      ],
      observedOperationIds: Object.keys(adminErrorOperationPaths),
      operationRequestCounts: adminErrorOperationRequestCounts,
      responses: adminErrorResponses,
      retryAvailableOnAllRoutes: true,
      retryClicked: false,
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      unexpectedAdminRequestCount: unexpectedAdminErrorRequests.length,
      writeRequestCount: unexpectedAdminErrorRequests.filter((request) => request.method !== 'GET')
        .length,
      finalRoute: adminErrorFinalRoute,
      elapsedMs: adminErrorElapsedMs,
      screenshots: [
        path.basename(adminErrorOverviewScreenshotPath),
        path.basename(adminErrorFunnelScreenshotPath),
        path.basename(adminErrorAbTestsScreenshotPath),
      ],
      note: 'This is generic local MSW HTTP 503 UI-error evidence only; Admin OpenAPI declares no 503 response for these reads. All three current pages show ErrorState and Retry without false data/empty success. Retry visibility is browser-observed; retry success is verified in focused page tests. The detail route and write form are absent; no mutation was sent.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  await signInAdminThroughPreview();
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('unauthorized');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.unauthorized').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const adminUnauthorizedOperationPaths = {
    getAdminOverview: '/api/admin/overview',
  };
  const adminUnauthorizedRequests = [];
  const adminUnauthorizedResponses = [];
  const adminUnauthorizedRefreshRequests = [];
  const adminUnauthorizedRefreshResponses = [];
  const unexpectedAdminUnauthorizedRequests = [];
  const collectAdminUnauthorizedRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath === '/api/auth/refresh' && request.method() === 'POST') {
      adminUnauthorizedRefreshRequests.push({ method: request.method(), path: requestPath });
      return;
    }
    if (!requestPath.startsWith('/api/admin/')) return;
    const operationId = Object.entries(adminUnauthorizedOperationPaths).find(
      ([, pathname]) => pathname === requestPath,
    )?.[0];
    if (operationId && request.method() === 'GET') {
      adminUnauthorizedRequests.push({ operationId, method: request.method(), path: requestPath });
      return;
    }
    unexpectedAdminUnauthorizedRequests.push({ method: request.method(), path: requestPath });
  };
  const collectAdminUnauthorizedResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    if (responsePath === '/api/auth/refresh' && response.request().method() === 'POST') {
      adminUnauthorizedRefreshResponses.push({
        method: response.request().method(),
        path: responsePath,
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
      return;
    }
    const operationId = Object.entries(adminUnauthorizedOperationPaths).find(
      ([, pathname]) => pathname === responsePath,
    )?.[0];
    if (!operationId) return;
    adminUnauthorizedResponses.push({
      operationId,
      method: response.request().method(),
      path: responsePath,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectAdminUnauthorizedRequest);
  page.on('response', collectAdminUnauthorizedResponse);

  const adminUnauthorizedStartedAt = Date.now();
  const adminUnauthorizedLoginPromise = page.waitForURL(/\/(?:w\/)?auth\/login$/, {
    timeout: 60_000,
  });
  const adminUnauthorizedReadPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/admin/overview' &&
      response.request().method() === 'GET',
    { timeout: 60_000 },
  );
  const adminUnauthorizedRefreshPromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/auth/refresh' &&
      response.request().method() === 'POST',
    { timeout: 60_000 },
  );
  await navigateWithinSpa('/w/admin');
  const [adminUnauthorizedRead, adminUnauthorizedRefresh] = await Promise.all([
    adminUnauthorizedReadPromise,
    adminUnauthorizedRefreshPromise,
    adminUnauthorizedLoginPromise,
  ]);
  const adminUnauthorizedReadPayload = await adminUnauthorizedRead.json();
  const adminUnauthorizedRefreshPayload = await adminUnauthorizedRefresh.json();
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).waitFor();
  await page.waitForTimeout(500);
  const adminUnauthorizedStaleContentVisible =
    (await page.getByText('Active users', { exact: true }).count()) > 0 ||
    (await page.getByText('1.284', { exact: true }).count()) > 0;
  const adminUnauthorizedFinalRoute = new URL(page.url()).pathname;
  const adminUnauthorizedElapsedMs = Date.now() - adminUnauthorizedStartedAt;
  assert.equal(adminUnauthorizedRead.status(), 401);
  assert.equal(adminUnauthorizedReadPayload.code, 'PREVIEW_UNAUTHORIZED');
  assert.equal(adminUnauthorizedRefresh.status(), 401);
  assert.equal(adminUnauthorizedRefreshPayload.code, 'SESSION_EXPIRED');
  assert.deepEqual(adminUnauthorizedRequests.length, 1);
  assert.deepEqual(adminUnauthorizedRefreshRequests.length, 1);
  assert.equal(adminUnauthorizedResponses.length, 1);
  assert.equal(adminUnauthorizedRefreshResponses.length, 1);
  assert.ok(
    adminUnauthorizedResponses.every(
      (response) => response.status === 401 && response.fromServiceWorker,
    ),
  );
  assert.ok(
    adminUnauthorizedRefreshResponses.every(
      (response) => response.status === 401 && response.fromServiceWorker,
    ),
  );
  assert.deepEqual(unexpectedAdminUnauthorizedRequests, []);
  assert.equal(adminUnauthorizedStaleContentVisible, false);
  assert.match(adminUnauthorizedFinalRoute, /\/(?:w\/)?auth\/login$/);
  await page.screenshot({ path: adminUnauthorizedLoginScreenshotPath, fullPage: true });
  page.off('request', collectAdminUnauthorizedRequest);
  page.off('response', collectAdminUnauthorizedResponse);
  const adminUnauthorizedEvidence = {
    scenario: {
      id: 'admin.unauthorized',
      domain: 'admin',
      state: 'unauthorized',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      operationIds: [
        'getAdminOverview',
        'getAdminFunnel',
        'listAdminAbTests',
        'getAdminAbTest',
        'updateAdminFeatureFlag',
      ],
      observedOperationIds: Object.keys(adminUnauthorizedOperationPaths),
      declared401OperationCount: 5,
      readRequests: adminUnauthorizedRequests,
      readResponses: adminUnauthorizedResponses,
      refreshRequestCount: adminUnauthorizedRefreshRequests.length,
      refreshResponses: adminUnauthorizedRefreshResponses,
      unauthorizedCode: adminUnauthorizedReadPayload.code,
      refreshCode: adminUnauthorizedRefreshPayload.code,
      redirectedToLogin: true,
      staleAdminContentVisible: adminUnauthorizedStaleContentVisible,
      unexpectedAdminRequestCount: unexpectedAdminUnauthorizedRequests.length,
      writeRequestCount: unexpectedAdminUnauthorizedRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      finalRoute: adminUnauthorizedFinalRoute,
      elapsedMs: adminUnauthorizedElapsedMs,
      screenshots: [path.basename(adminUnauthorizedLoginScreenshotPath)],
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      note: 'Representative Admin unauthorized evidence exercises getAdminOverview only (1/5 linked operations); OpenAPI declares 401 for all five, including the currently unreachable detail and write operations. Local MSW returns 401 for the read, refresh returns 401, and the protected route redirects to login without visible overview content. No mutation is sent; backend authorization/session behavior, staging and user acceptance are not certified.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await signInAdminThroughPreview();
  await page.getByLabel('Miền API').selectOption('admin');
  await page.getByLabel('Trạng thái phản hồi').selectOption('forbidden');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('admin.forbidden').waitFor();
  await navigateWithinSpa('/w/markets/overview');
  await signInAdminThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('admin.forbidden').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const adminForbiddenOperationPaths = {
    getAdminOverview: { path: '/api/admin/overview', route: '/w/admin' },
    getAdminFunnel: { path: '/api/admin/analytics/funnel', route: '/w/admin/funnels' },
    listAdminAbTests: { path: '/api/admin/analytics/ab-tests', route: '/w/admin/abtests' },
  };
  const adminForbiddenOperationRequestCounts = Object.fromEntries(
    Object.keys(adminForbiddenOperationPaths).map((operationId) => [operationId, 0]),
  );
  const adminForbiddenRequests = [];
  const adminForbiddenResponses = [];
  const adminForbiddenRefreshRequests = [];
  const unexpectedAdminForbiddenRequests = [];
  const adminForbiddenObservations = [];
  const collectAdminForbiddenRequest = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (requestPath === '/api/auth/refresh' && request.method() === 'POST') {
      adminForbiddenRefreshRequests.push({ method: request.method(), path: requestPath });
      return;
    }
    if (!requestPath.startsWith('/api/admin/')) return;
    const operation = Object.entries(adminForbiddenOperationPaths).find(
      ([, value]) => value.path === requestPath,
    );
    if (operation && request.method() === 'GET') {
      const [operationId] = operation;
      adminForbiddenOperationRequestCounts[operationId] += 1;
      adminForbiddenRequests.push({ operationId, method: request.method(), path: requestPath });
      return;
    }
    unexpectedAdminForbiddenRequests.push({ method: request.method(), path: requestPath });
  };
  const collectAdminForbiddenResponse = (response) => {
    const responsePath = new URL(response.url()).pathname;
    const operation = Object.entries(adminForbiddenOperationPaths).find(
      ([, value]) => value.path === responsePath,
    );
    if (!operation) return;
    const [operationId] = operation;
    adminForbiddenResponses.push({
      operationId,
      method: response.request().method(),
      path: responsePath,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectAdminForbiddenRequest);
  page.on('response', collectAdminForbiddenResponse);

  const adminForbiddenStartedAt = Date.now();
  const adminForbiddenRoutes = [
    {
      operationId: 'getAdminOverview',
      route: '/w/admin',
      screenshot: adminForbiddenOverviewScreenshotPath,
      forbiddenText: 'Active users',
    },
    {
      operationId: 'getAdminFunnel',
      route: '/w/admin/funnels',
      screenshot: adminForbiddenFunnelScreenshotPath,
      forbiddenText: '10.000 users',
    },
    {
      operationId: 'listAdminAbTests',
      route: '/w/admin/abtests',
      screenshot: adminForbiddenAbTestsScreenshotPath,
      forbiddenText: 'trade-terminal-v2',
    },
  ];
  for (const observation of adminForbiddenRoutes) {
    const operationPath = adminForbiddenOperationPaths[observation.operationId].path;
    const responsePromise = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === operationPath && response.request().method() === 'GET',
      { timeout: 60_000 },
    );
    const startedAt = Date.now();
    await navigateWithinSpa(observation.route);
    await responsePromise;
    await page.getByText('Không có quyền truy cập', { exact: true }).waitFor();
    const permissionDeniedVisible =
      (await page
        .getByText('Tài khoản của bạn không có quyền xem dữ liệu quản trị.', {
          exact: true,
        })
        .count()) > 0;
    const retryActionVisible =
      (await page.getByRole('button', { name: 'Thử lại', exact: true }).count()) > 0;
    const falseSuccessContentVisible =
      (await page.getByText(observation.forbiddenText, { exact: true }).count()) > 0;
    assert.equal(permissionDeniedVisible, true);
    assert.equal(retryActionVisible, false);
    assert.equal(falseSuccessContentVisible, false);
    await page.screenshot({ path: observation.screenshot, fullPage: true });
    adminForbiddenObservations.push({
      operationId: observation.operationId,
      route: observation.route,
      permissionDeniedVisible,
      retryActionVisible,
      falseSuccessContentVisible,
      elapsedMs: Date.now() - startedAt,
    });
  }
  const adminForbiddenFinalRoute = new URL(page.url()).pathname;
  const adminForbiddenElapsedMs = Date.now() - adminForbiddenStartedAt;
  assert.deepEqual(adminForbiddenFinalRoute, '/w/admin/abtests');
  assert.ok(
    Object.values(adminForbiddenOperationRequestCounts).every((count) => count > 0),
    'Each current Admin read operation must be requested during the forbidden scenario.',
  );
  assert.deepEqual(adminForbiddenOperationRequestCounts, {
    getAdminOverview: 1,
    getAdminFunnel: 1,
    listAdminAbTests: 1,
  });
  assert.ok(
    adminForbiddenResponses.length >= 3 &&
      adminForbiddenResponses.every(
        (response) => response.status === 403 && response.fromServiceWorker,
      ),
  );
  assert.deepEqual(adminForbiddenRefreshRequests, []);
  assert.deepEqual(unexpectedAdminForbiddenRequests, []);
  page.off('request', collectAdminForbiddenRequest);
  page.off('response', collectAdminForbiddenResponse);
  const adminForbiddenEvidence = {
    scenario: {
      id: 'admin.forbidden',
      domain: 'admin',
      state: 'forbidden',
      status: 'passed',
      persona: 'admin',
      role: 'admin',
      permissions: ['admin:read'],
      routes: adminForbiddenRoutes.map((observation) => observation.route),
      operationIds: [
        'getAdminOverview',
        'getAdminFunnel',
        'listAdminAbTests',
        'getAdminAbTest',
        'updateAdminFeatureFlag',
      ],
      observedOperationIds: Object.keys(adminForbiddenOperationPaths),
      declared403OperationCount: 5,
      operationRequestCounts: adminForbiddenOperationRequestCounts,
      responses: adminForbiddenResponses,
      observations: adminForbiddenObservations,
      refreshRequestCount: adminForbiddenRefreshRequests.length,
      permissionDeniedVisibleOnAllRoutes: adminForbiddenObservations.every(
        (observation) => observation.permissionDeniedVisible,
      ),
      retryActionVisibleOnAnyRoute: adminForbiddenObservations.some(
        (observation) => observation.retryActionVisible,
      ),
      falseSuccessContentVisibleOnAnyRoute: adminForbiddenObservations.some(
        (observation) => observation.falseSuccessContentVisible,
      ),
      unexpectedAdminRequestCount: unexpectedAdminForbiddenRequests.length,
      writeRequestCount: unexpectedAdminForbiddenRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      finalRoute: adminForbiddenFinalRoute,
      elapsedMs: adminForbiddenElapsedMs,
      baselineScreenshot: path.basename(adminForbiddenBeforeFixScreenshotPath),
      screenshots: adminForbiddenRoutes.map((observation) => path.basename(observation.screenshot)),
      detailOperationNotReachableFromCurrentRoutes: 'getAdminAbTest',
      mutationNotSent:
        'updateAdminFeatureFlag; the preview persona has admin:read only and no current UI route exposes the write form.',
      note: 'The before-fix baseline received two local 403 responses for getAdminOverview and showed the generic error plus Retry. After the fix, each of the three current Admin read pages makes one 403 request and shows explicit permission denial without Retry or false success/empty content. The Admin read queries now skip React Query retry for HTTP 403 while preserving one retry for other failures. This representative browser evidence covers 3/5 linked operations; getAdminAbTest has no UI detail route and updateAdminFeatureFlag has no form. The mock injects 403 regardless of persona, so this is not backend authorization or staging evidence; no mutation or session refresh was sent.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('arena');
  await page.getByLabel('Trạng thái phản hồi').selectOption('success');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.success').waitFor();
  await signInArenaThroughPreview();
  await page.getByTestId('active-preview-scenario').getByText('arena.success').waitFor();

  const arenaOperationMatchers = {
    getArenaDiscovery: {
      method: 'GET',
      matches: (pathname) => pathname === '/api/arena/discovery',
    },
    getArenaMode: {
      method: 'GET',
      matches: (pathname) => /^\/api\/arena\/modes\/[^/]+$/.test(pathname),
    },
    getArenaChallenge: {
      method: 'GET',
      matches: (pathname) => /^\/api\/arena\/challenges\/[^/]+$/.test(pathname),
    },
    joinArenaChallenge: {
      method: 'POST',
      matches: (pathname) => /^\/api\/arena\/challenges\/[^/]+\/join$/.test(pathname),
    },
  };
  const arenaOperationRequestCounts = Object.fromEntries(
    Object.keys(arenaOperationMatchers).map((operationId) => [operationId, 0]),
  );
  const arenaRequests = [];
  const arenaResponses = [];
  const unexpectedArenaRequests = [];
  const collectArenaRequest = (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/arena/')) return;
    const operation = Object.entries(arenaOperationMatchers).find(
      ([, matcher]) => matcher.method === request.method() && matcher.matches(pathname),
    );
    if (!operation) {
      unexpectedArenaRequests.push({ method: request.method(), path: pathname });
      return;
    }
    const [operationId] = operation;
    arenaOperationRequestCounts[operationId] += 1;
    arenaRequests.push({ operationId, method: request.method(), path: pathname });
  };
  const collectArenaResponse = (response) => {
    const pathname = new URL(response.url()).pathname;
    const operation = Object.entries(arenaOperationMatchers).find(
      ([, matcher]) => matcher.method === response.request().method() && matcher.matches(pathname),
    );
    if (!operation) return;
    const [operationId] = operation;
    arenaResponses.push({
      operationId,
      method: response.request().method(),
      path: pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectArenaRequest);
  page.on('response', collectArenaResponse);

  const arenaSuccessStartedAt = Date.now();
  const arenaDiscoveryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/discovery' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/arena');
  const arenaDiscoveryResponse = await arenaDiscoveryResponsePromise;
  const arenaDiscoveryPayload = await arenaDiscoveryResponse.json();
  const arenaChallengeFixture = arenaDiscoveryPayload.challenges.find(
    (item) => item.id === 'ch001',
  );
  assert.equal(arenaDiscoveryResponse.status(), 200);
  assert.equal(arenaDiscoveryResponse.fromServiceWorker(), true);
  assert.ok(
    arenaChallengeFixture,
    'Open Arena discovery must expose the public open ch001 fixture.',
  );
  await page.getByRole('heading', { name: arenaChallengeFixture.title }).waitFor();
  const arenaPointsDisclosureVisible = await page
    .getByText('Arena Points only.', { exact: false })
    .isVisible();
  assert.equal(arenaPointsDisclosureVisible, true);
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }
  await page.screenshot({ path: arenaDiscoveryScreenshotPath, fullPage: true });

  const arenaModeResponsePromise = page.waitForResponse(
    (response) =>
      /^\/api\/arena\/modes\/mode001$/.test(new URL(response.url()).pathname) &&
      response.request().method() === 'GET',
  );
  await page.getByRole('tab', { name: 'Mode' }).click();
  await page.getByRole('button', { name: 'Xem mode', exact: true }).first().click();
  await page.waitForURL('**/w/arena/mode/mode001');
  const arenaModeResponse = await arenaModeResponsePromise;
  const arenaModePayload = await arenaModeResponse.json();
  assert.equal(arenaModeResponse.status(), 200);
  assert.equal(arenaModeResponse.fromServiceWorker(), true);
  assert.equal(arenaModePayload.id, 'mode001');
  await page.getByRole('heading', { name: arenaModePayload.title }).waitFor();
  await page.getByText(arenaModePayload.winCondition, { exact: true }).waitFor();
  await page.screenshot({ path: arenaModeScreenshotPath, fullPage: true });

  await navigateWithinSpa('/w/arena');
  await page.getByRole('tab', { name: 'Challenge' }).click();
  await page.getByRole('heading', { name: arenaChallengeFixture.title }).waitFor();
  const arenaChallengeResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/challenges/ch001' &&
      response.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Xem challenge', exact: true }).click();
  await page.waitForURL('**/w/arena/challenge/ch001');
  const arenaChallengeResponse = await arenaChallengeResponsePromise;
  const arenaChallengePayload = await arenaChallengeResponse.json();
  assert.equal(arenaChallengeResponse.status(), 200);
  assert.equal(arenaChallengeResponse.fromServiceWorker(), true);
  assert.equal(arenaChallengePayload.id, 'ch001');
  await page.getByRole('heading', { name: arenaChallengePayload.title }).waitFor();
  await page.getByRole('button', { name: 'Tham gia challenge', exact: true }).waitFor();

  const arenaJoinRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/arena/challenges/ch001/join' &&
      request.method() === 'POST',
  );
  const arenaJoinResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/challenges/ch001/join' &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Tham gia challenge', exact: true }).click();
  const [arenaJoinRequest, arenaJoinResponse] = await Promise.all([
    arenaJoinRequestPromise,
    arenaJoinResponsePromise,
  ]);
  const arenaJoinResponsePayload = await arenaJoinResponse.json();
  const arenaJoinIdempotencyKey = arenaJoinRequest.headers()['idempotency-key'];
  assert.equal(arenaJoinResponse.status(), 201);
  assert.equal(arenaJoinResponse.fromServiceWorker(), true);
  assert.ok(arenaJoinIdempotencyKey && arenaJoinIdempotencyKey.length >= 8);
  assert.equal(arenaJoinResponsePayload.challenge.slotsFilled, 39);
  assert.ok(
    arenaJoinResponsePayload.challenge.participants.some(
      (participant) => participant.name === 'VitTrade Developer',
    ),
  );
  await page.getByText('39/50', { exact: true }).waitFor();
  await page.getByRole('main').getByText('VitTrade Developer', { exact: true }).waitFor();
  await page.screenshot({ path: arenaChallengeScreenshotPath, fullPage: true });
  const arenaSuccessElapsedMs = Date.now() - arenaSuccessStartedAt;
  page.off('request', collectArenaRequest);
  page.off('response', collectArenaResponse);
  assert.deepEqual(arenaOperationRequestCounts, {
    getArenaDiscovery: 1,
    getArenaMode: 1,
    getArenaChallenge: 1,
    joinArenaChallenge: 1,
  });
  assert.equal(arenaResponses.length, 4);
  assert.ok(
    arenaResponses.every(
      (response) => response.fromServiceWorker && [200, 201].includes(response.status),
    ),
  );
  assert.deepEqual(unexpectedArenaRequests, []);
  const arenaSuccessEvidence = {
    scenario: {
      id: 'arena.success',
      domain: 'arena',
      state: 'success',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena', '/w/arena/mode/mode001', '/w/arena/challenge/ch001'],
      operationIds: [
        'getArenaDiscovery',
        'getArenaMode',
        'getArenaChallenge',
        'joinArenaChallenge',
      ],
      observedOperationIds: Object.keys(arenaOperationMatchers),
      operationRequestCounts: arenaOperationRequestCounts,
      requests: arenaRequests,
      responses: arenaResponses,
      discoveryChallengeCount: arenaDiscoveryPayload.challenges.length,
      modeId: arenaModePayload.id,
      challengeId: arenaChallengePayload.id,
      joinStatus: arenaJoinResponse.status(),
      idempotencyKeyPresent: Boolean(arenaJoinIdempotencyKey),
      idempotencyKeyLength: arenaJoinIdempotencyKey.length,
      slotsFilledAfterJoin: arenaJoinResponsePayload.challenge.slotsFilled,
      joinedParticipantVisible: true,
      arenaPointsDisclosureVisible,
      unexpectedArenaRequestCount: unexpectedArenaRequests.length,
      writeRequestCount: arenaRequests.filter((request) => request.method === 'POST').length,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: arenaSuccessElapsedMs,
      screenshots: [
        path.basename(arenaDiscoveryScreenshotPath),
        path.basename(arenaModeScreenshotPath),
        path.basename(arenaChallengeScreenshotPath),
      ],
      note: 'Chromium exercised all four Arena OpenAPI operations using the local MSW service worker. The dedicated preview persona has only arena:join; the join POST returned a local contract-shaped 201 with Idempotency-Key, then the UI showed the updated participant/slot count. The service worker does not enforce backend permission, persistence or replay behavior; Arena Points remain preview fixture values and no wallet/trading API was called.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Miền API').selectOption('arena');
  await page.getByLabel('Trạng thái phản hồi').selectOption('empty');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.empty').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const arenaEmptyOperationRequestCounts = { getArenaDiscovery: 0 };
  const arenaEmptyRequests = [];
  const arenaEmptyResponses = [];
  const unexpectedArenaEmptyRequests = [];
  const collectArenaEmptyRequest = (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/arena/')) return;
    if (request.method() === 'GET' && pathname === '/api/arena/discovery') {
      arenaEmptyOperationRequestCounts.getArenaDiscovery += 1;
      arenaEmptyRequests.push({ operationId: 'getArenaDiscovery', method: 'GET', path: pathname });
      return;
    }
    unexpectedArenaEmptyRequests.push({ method: request.method(), path: pathname });
  };
  const collectArenaEmptyResponse = (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname !== '/api/arena/discovery' || response.request().method() !== 'GET') return;
    arenaEmptyResponses.push({
      operationId: 'getArenaDiscovery',
      method: 'GET',
      path: pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectArenaEmptyRequest);
  page.on('response', collectArenaEmptyResponse);

  const arenaEmptyStartedAt = Date.now();
  const arenaEmptyDiscoveryResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/discovery' &&
      response.request().method() === 'GET',
  );
  await navigateWithinSpa('/w/arena');
  const arenaEmptyDiscoveryResponse = await arenaEmptyDiscoveryResponsePromise;
  const arenaEmptyDiscoveryPayload = await arenaEmptyDiscoveryResponse.json();
  assert.equal(arenaEmptyDiscoveryResponse.status(), 200);
  assert.equal(arenaEmptyDiscoveryResponse.fromServiceWorker(), true);
  assert.deepEqual(arenaEmptyDiscoveryPayload, { modes: [], challenges: [] });
  await page.getByText('Chưa có challenge nào khả dụng.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Xem challenge', exact: true }).count(), 0);
  assert.equal(
    await page.getByRole('button', { name: 'Tham gia challenge', exact: true }).count(),
    0,
  );
  assert.equal(await page.getByText('Không thể tham gia. Vui lòng thử lại.').count(), 0);
  await page.screenshot({ path: arenaEmptyChallengesScreenshotPath, fullPage: true });
  const arenaEmptyModeTab = page.getByRole('tab', { name: 'Mode' });
  await arenaEmptyModeTab.click();
  await page.getByText('Chưa có mode nào khả dụng.', { exact: true }).waitFor();
  await page.waitForFunction(() => {
    const selectedTab = document.querySelector(
      '[role="tablist"][aria-label="Loại nội dung Arena"] [role="tab"][aria-selected="true"]',
    );
    return (
      selectedTab?.textContent?.trim() === 'Mode' &&
      getComputedStyle(selectedTab).backgroundColor === 'rgb(139, 92, 246)'
    );
  });
  assert.equal(await arenaEmptyModeTab.getAttribute('aria-selected'), 'true');
  await page.screenshot({ path: arenaEmptyModesScreenshotPath, fullPage: true });

  const arenaEmptyElapsedMs = Date.now() - arenaEmptyStartedAt;
  page.off('request', collectArenaEmptyRequest);
  page.off('response', collectArenaEmptyResponse);
  assert.deepEqual(arenaEmptyOperationRequestCounts, { getArenaDiscovery: 1 });
  assert.equal(arenaEmptyResponses.length, 1);
  assert.equal(arenaEmptyResponses[0].status, 200);
  assert.equal(arenaEmptyResponses[0].fromServiceWorker, true);
  assert.deepEqual(unexpectedArenaEmptyRequests, []);
  const arenaEmptyEvidence = {
    scenario: {
      id: 'arena.empty',
      domain: 'arena',
      state: 'empty',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena'],
      operationIds: ['getArenaDiscovery'],
      observedOperationIds: ['getArenaDiscovery'],
      operationRequestCounts: arenaEmptyOperationRequestCounts,
      requests: arenaEmptyRequests,
      responses: arenaEmptyResponses,
      emptyChallengeStateVisible: true,
      emptyModeStateVisible: true,
      modeTabSelected: true,
      challengeOpenActionCount: 0,
      joinActionCount: 0,
      joinFailureCopyCount: 0,
      unexpectedArenaRequestCount: unexpectedArenaEmptyRequests.length,
      writeRequestCount: arenaEmptyRequests.filter((request) => request.method !== 'GET').length,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: arenaEmptyElapsedMs,
      screenshots: [
        path.basename(arenaEmptyChallengesScreenshotPath),
        path.basename(arenaEmptyModesScreenshotPath),
      ],
      note: 'Chromium received a contract-shaped empty Arena discovery from the local MSW service worker and rendered explicit empty states for both Challenge and Mode. No detail, join, mutation or other Arena request was sent. This is local UI/fixture evidence only and does not establish backend authorization or persistence.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Tài khoản xem trước').selectOption('arena');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .getByText('Đang xem bằng persona Arena · chỉ tham gia challenge mock.', { exact: true })
    .waitFor();
  await page.getByLabel('Miền API').selectOption('arena');
  await page.getByLabel('Trạng thái phản hồi').selectOption('loading');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.loading').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const arenaLoadingOperationRequestCounts = { getArenaDiscovery: 0 };
  const arenaLoadingRequests = [];
  const arenaLoadingResponses = [];
  const unexpectedArenaLoadingRequests = [];
  let arenaLoadingRequestAt = null;
  let arenaLoadingResponseAt = null;
  const collectArenaLoadingRequest = (request) => {
    const pathname = new URL(request.url()).pathname;
    if (!pathname.startsWith('/api/arena/')) return;
    if (request.method() === 'GET' && pathname === '/api/arena/discovery') {
      arenaLoadingRequestAt ??= Date.now();
      arenaLoadingOperationRequestCounts.getArenaDiscovery += 1;
      arenaLoadingRequests.push({
        operationId: 'getArenaDiscovery',
        method: 'GET',
        path: pathname,
      });
      return;
    }
    unexpectedArenaLoadingRequests.push({ method: request.method(), path: pathname });
  };
  const collectArenaLoadingResponse = (response) => {
    const pathname = new URL(response.url()).pathname;
    if (pathname !== '/api/arena/discovery' || response.request().method() !== 'GET') return;
    arenaLoadingResponseAt ??= Date.now();
    arenaLoadingResponses.push({
      operationId: 'getArenaDiscovery',
      method: 'GET',
      path: pathname,
      status: response.status(),
      fromServiceWorker: response.fromServiceWorker(),
    });
  };
  page.on('request', collectArenaLoadingRequest);
  page.on('response', collectArenaLoadingResponse);

  const arenaLoadingStartedAt = Date.now();
  const arenaLoadingRequestPromise = page.waitForRequest(
    (request) =>
      new URL(request.url()).pathname === '/api/arena/discovery' && request.method() === 'GET',
  );
  const arenaLoadingResponsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/arena/discovery' &&
      response.request().method() === 'GET',
  );
  let arenaLoadingResponseObserved = false;
  void arenaLoadingResponsePromise.then(() => {
    arenaLoadingResponseObserved = true;
  });
  await navigateWithinSpa('/w/arena');
  const arenaLoadingRequest = await arenaLoadingRequestPromise;
  const arenaLoadingUiStartedAt = Date.now();
  await page.getByText('Đang tải dữ liệu Arena…', { exact: true }).waitFor();
  const arenaLoadingUiObservedMs = Date.now() - arenaLoadingUiStartedAt;
  assert.equal(arenaLoadingResponseObserved, false);
  await page.screenshot({ path: arenaLoadingScreenshotPath, fullPage: true });
  const arenaLoadingResponse = await arenaLoadingResponsePromise;
  const arenaLoadingPayload = await arenaLoadingResponse.json();
  assert.equal(arenaLoadingResponse.status(), 200);
  assert.equal(arenaLoadingResponse.fromServiceWorker(), true);
  assert.ok(Array.isArray(arenaLoadingPayload.challenges));
  const arenaLoadedChallengeTitle = arenaLoadingPayload.challenges[0]?.title;
  assert.equal(typeof arenaLoadedChallengeTitle, 'string');
  await page.getByText(arenaLoadedChallengeTitle, { exact: true }).waitFor();
  const arenaLoadingElapsedMs = Date.now() - arenaLoadingStartedAt;
  page.off('request', collectArenaLoadingRequest);
  page.off('response', collectArenaLoadingResponse);
  assert.equal(arenaLoadingRequest.method(), 'GET');
  assert.deepEqual(arenaLoadingOperationRequestCounts, { getArenaDiscovery: 1 });
  assert.equal(arenaLoadingResponses.length, 1);
  assert.equal(arenaLoadingResponses[0].status, 200);
  assert.equal(arenaLoadingResponses[0].fromServiceWorker, true);
  assert.deepEqual(unexpectedArenaLoadingRequests, []);
  const arenaLoadingEvidence = {
    scenario: {
      id: 'arena.loading',
      domain: 'arena',
      state: 'loading',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena'],
      operationIds: ['getArenaDiscovery'],
      observedOperationIds: ['getArenaDiscovery'],
      operationRequestCounts: arenaLoadingOperationRequestCounts,
      requests: arenaLoadingRequests,
      responses: arenaLoadingResponses,
      loadingStateVisibleBeforeResponse: true,
      loadingUiObservedMs: arenaLoadingUiObservedMs,
      requestToResponseMs: arenaLoadingResponseAt - arenaLoadingRequestAt,
      unexpectedArenaRequestCount: unexpectedArenaLoadingRequests.length,
      writeRequestCount: arenaLoadingRequests.filter((request) => request.method !== 'GET').length,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: arenaLoadingElapsedMs,
      screenshots: [path.basename(arenaLoadingScreenshotPath)],
      note: 'Chromium observed the Arena discovery loading state while its single GET remained in flight, then received the existing fixture response through local MSW. The preview delay is a local transport simulation, not backend latency or a server-pending state. The screenshot also shows the sidebar still highlighting Trang chủ on /w/arena; track that navigation active-state issue in UI acceptance.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  await navigateWithinSpa('/w/home');
  await page.getByRole('button', { name: 'Mở công cụ xem trước' }).click();
  await page.getByLabel('Tài khoản xem trước').selectOption('arena');
  await page.getByRole('button', { name: 'Áp dụng tài khoản' }).click();
  await page
    .getByText('Đang xem bằng persona Arena · chỉ tham gia challenge mock.', { exact: true })
    .waitFor();
  await page.getByLabel('Miền API').selectOption('arena');
  await page.getByLabel('Trạng thái phản hồi').selectOption('error');
  await page.getByRole('button', { name: 'Áp dụng trạng thái API' }).click();
  await page.getByTestId('active-preview-scenario').getByText('arena.error').waitFor();
  if (await page.getByRole('button', { name: 'Thu gọn' }).count()) {
    await page.getByRole('button', { name: 'Thu gọn' }).click();
  }

  const arenaErrorOperationRequestCounts = { getArenaDiscovery: 0 };
  const arenaErrorRequests = [];
  const arenaErrorFailures = [];
  const arenaErrorResponses = [];
  let unexpectedArenaErrorRequests = 0;
  const collectArenaErrorRequests = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (!requestPath.startsWith('/api/arena/')) return;
    if (request.method() === 'GET' && requestPath === '/api/arena/discovery') {
      arenaErrorOperationRequestCounts.getArenaDiscovery += 1;
      arenaErrorRequests.push({
        operationId: 'getArenaDiscovery',
        method: 'GET',
        path: requestPath,
      });
      return;
    }
    unexpectedArenaErrorRequests += 1;
  };
  const collectArenaErrorFailures = (request) => {
    const requestPath = new URL(request.url()).pathname;
    if (request.method() === 'GET' && requestPath === '/api/arena/discovery') {
      arenaErrorFailures.push({
        operationId: 'getArenaDiscovery',
        method: 'GET',
        path: requestPath,
        failure: request.failure()?.errorText ?? null,
      });
    }
  };
  const collectArenaErrorResponses = (response) => {
    const requestPath = new URL(response.url()).pathname;
    if (requestPath === '/api/arena/discovery' && response.request().method() === 'GET') {
      arenaErrorResponses.push({
        operationId: 'getArenaDiscovery',
        status: response.status(),
        fromServiceWorker: response.fromServiceWorker(),
      });
    }
  };
  page.on('request', collectArenaErrorRequests);
  page.on('requestfailed', collectArenaErrorFailures);
  page.on('response', collectArenaErrorResponses);
  const arenaErrorStartedAt = Date.now();
  await navigateWithinSpa('/w/arena');
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const arenaErrorRetryButton = page.getByRole('button', { name: 'Thử lại', exact: true });
  await arenaErrorRetryButton.waitFor({ state: 'visible' });
  const arenaErrorVisibleState = await page.getByText('Có lỗi xảy ra', { exact: true }).isVisible();
  const arenaErrorRetryVisible = await arenaErrorRetryButton.isVisible();
  const arenaErrorInitialElapsedMs = Date.now() - arenaErrorStartedAt;
  const arenaErrorInitialFailureCount = arenaErrorFailures.length;
  assert.ok(arenaErrorInitialFailureCount > 0);
  assert.equal(await page.getByText('Chưa có challenge nào khả dụng.', { exact: true }).count(), 0);
  await page.screenshot({ path: arenaErrorScreenshotPath, fullPage: true });

  const arenaErrorRetryStartedAt = Date.now();
  await arenaErrorRetryButton.click();
  const arenaErrorRetryDeadline = Date.now() + 10_000;
  while (
    arenaErrorFailures.length < arenaErrorInitialFailureCount * 2 &&
    Date.now() < arenaErrorRetryDeadline
  ) {
    await page.waitForTimeout(25);
  }
  await page.getByText('Có lỗi xảy ra', { exact: true }).waitFor({ state: 'visible' });
  const arenaErrorRetryElapsedMs = Date.now() - arenaErrorRetryStartedAt;
  const arenaErrorEmptyCountAfterRetry = await page
    .getByText('Chưa có challenge nào khả dụng.', { exact: true })
    .count();
  assert.equal(arenaErrorFailures.length, arenaErrorInitialFailureCount * 2);
  assert.equal(arenaErrorRetryVisible, true);
  assert.equal(arenaErrorEmptyCountAfterRetry, 0);
  assert.equal(arenaErrorResponses.length, 0);
  page.off('request', collectArenaErrorRequests);
  page.off('requestfailed', collectArenaErrorFailures);
  page.off('response', collectArenaErrorResponses);

  assert.deepEqual(unexpectedArenaErrorRequests, 0);
  assert.equal(arenaErrorOperationRequestCounts.getArenaDiscovery, arenaErrorFailures.length);
  const arenaErrorElapsedMs = Date.now() - arenaErrorStartedAt;
  const arenaErrorEvidence = {
    scenario: {
      id: 'arena.error',
      domain: 'arena',
      state: 'error',
      status: 'passed',
      persona: 'arena',
      role: 'user',
      permissions: ['arena:join'],
      routes: ['/w/arena'],
      operationIds: [
        'getArenaDiscovery',
        'getArenaMode',
        'getArenaChallenge',
        'joinArenaChallenge',
      ],
      observedOperationIds: ['getArenaDiscovery'],
      operationRequestCounts: arenaErrorOperationRequestCounts,
      requests: arenaErrorRequests,
      failures: arenaErrorFailures,
      responses: arenaErrorResponses,
      visibleErrorState: arenaErrorVisibleState,
      visibleRetryAction: arenaErrorRetryVisible,
      emptySuccessStateVisible: false,
      initialFailureCount: arenaErrorInitialFailureCount,
      retryFailureCount: arenaErrorFailures.length - arenaErrorInitialFailureCount,
      retryElapsedMs: arenaErrorRetryElapsedMs,
      initialElapsedMs: arenaErrorInitialElapsedMs,
      unexpectedArenaRequestCount: unexpectedArenaErrorRequests,
      writeRequestCount: arenaErrorRequests.filter((request) => request.method !== 'GET').length,
      finalRoute: new URL(page.url()).pathname,
      elapsedMs: arenaErrorElapsedMs,
      screenshots: [path.basename(arenaErrorScreenshotPath)],
      note: 'Chromium observed ErrorState/Retry for the one in-scope discovery read and kept the failure distinct from empty success. Arena OpenAPI declares no 5xx response, so local MSW returned a transport error with no HTTP response. The error scenario covers only getArenaDiscovery (1/4 linked operations); no join mutation ran. The screenshot also retains the known sidebar active-state mismatch at /w/arena.',
    },
    externalApiOrigins: [...externalApiOrigins],
  };

  const sourceHashes = Object.fromEntries(
    await Promise.all(
      sourceFiles.map(async (file) => [
        file,
        crypto
          .createHash('sha256')
          .update(await fs.readFile(path.resolve(file)))
          .digest('hex'),
      ]),
    ),
  );
  const tradingSuccessEvidence = JSON.parse(
    await fs.readFile(
      path.join(evidenceDirectory, 'trading-success-browser-check-2026-09-28.json'),
      'utf8',
    ),
  );
  const evidence = {
    checkedAt: new Date().toISOString(),
    sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
    sourceHashes,
    origin,
    route: '/w/markets/overview',
    emptyRoute: '/w/markets/screener',
    viewport: { width: 1440, height: 900 },
    scenarios: [
      {
        id: 'market.loading',
        status: 'passed',
        route: '/w/markets/overview',
        operationId: 'getMarketOverview',
        visibleLoadingState: true,
      },
      {
        id: 'market.error',
        status: 'passed',
        route: '/w/markets/overview',
        operationId: 'getMarketOverview',
        visibleRetryAction: true,
      },
      {
        id: 'market.success',
        status: 'passed',
        route: '/w/markets/overview',
        operationId: 'getMarketOverview',
        fixtureContentVisible: true,
      },
      {
        id: 'market.empty',
        status: 'passed',
        route: '/w/markets/screener',
        operationId: 'listMarketPairs',
        operation: 'GET /market/pairs',
        contractResponse: { items: [] },
        visibleEmptyState: true,
      },
      {
        id: 'market.forbidden',
        status: 'passed',
        route: '/w/markets/watchlist',
        operationId: 'getMarketWatchlist',
        operation: 'GET /market/watchlist',
        responseStatus: forbiddenWatchlistResponse.status(),
        publicPairsStatus: publicPairsForbiddenResponse.status(),
        visiblePermissionDeniedState: true,
        staleOrEmptyWatchlistVisible: false,
      },
      {
        id: 'market.unauthorized',
        status: 'passed',
        route: '/w/markets/watchlist',
        operationId: 'getMarketWatchlist',
        operation: 'GET /market/watchlist',
        responseStatus: unauthorizedWatchlistResponse.status(),
        refreshStatus: unauthorizedRefreshResponse.status(),
        loginRouteAfterRefreshFailure: marketUnauthorizedLoginRoute,
        protectedRouteNoLongerVisible: true,
      },
      {
        id: 'earn.empty',
        status: 'passed',
        route: '/w/earn/savings/portfolio',
        routes: ['/w/earn/savings/portfolio', '/w/earn/savings/history'],
        operationIds: ['getEarnSnapshot', 'listEarnTransactions'],
        operations: ['GET /earn/snapshot', 'GET /earn/transactions?domain=savings'],
        snapshotStatus: earnSnapshotResponse.status(),
        transactionsStatus: earnTransactionsResponse.status(),
        visiblePortfolioEmptyState: true,
        visibleHistoryEmptyState: true,
      },
      {
        id: 'earn.pending',
        status: 'passed',
        routes: [
          '/w/earn/savings/product/sav001',
          '/w/earn/savings/redeem/earn-position-1',
          '/w/earn/savings/receipt',
          '/w/earn/savings/history',
        ],
        operationIds: ['createEarnSubscription', 'redeemEarnPosition', 'listEarnTransactions'],
        statuses: [
          earnPendingSubscribePayload.status,
          earnPendingRedeemPayload.status,
          earnPendingHistoryPayload.items.find((item) => item.id === 'earn-tx-savings-002')?.status,
        ],
        subscriptionStatus: earnPendingSubscribeResponse.status(),
        redemptionStatus: earnPendingRedeemResponse.status(),
        historyStatus: earnPendingHistoryResponse.status(),
        subscriptionIdempotencyKeyPresent: Boolean(
          earnPendingSubscribeResponse.request().headers()['idempotency-key'],
        ),
        redemptionIdempotencyKeyPresent: Boolean(
          earnPendingRedeemResponse.request().headers()['idempotency-key'],
        ),
        visiblePendingReceiptForBothWrites: true,
        visiblePendingHistoryFixture: true,
      },
      {
        id: 'discovery.empty',
        status: 'passed',
        domain: 'discovery',
        state: 'empty',
        route: '/w/search',
        operationIds: ['searchDiscovery'],
        operation: 'GET /discovery/search?query=zz',
        responseStatus: discoverySearchResponse.status(),
        responseFromServiceWorker: discoverySearchResponse.fromServiceWorker(),
        payload: discoverySearchPayload,
        visibleNoResultsState: true,
      },
      {
        id: 'discovery.success',
        status: 'passed',
        domain: 'discovery',
        state: 'success',
        routes: ['/w/search', '/w/topic/crypto'],
        operationIds: ['searchDiscovery', 'getDiscoveryTopic'],
        searchStatus: discoverySuccessSearchResponse.status(),
        searchResponseFromServiceWorker: discoverySuccessSearchResponse.fromServiceWorker(),
        searchResultCount: discoverySuccessSearchPayload.predictions.length,
        visibleSearchFixture: true,
        topicStatus: discoveryTopicResponse.status(),
        topicResponseFromServiceWorker: discoveryTopicResponse.fromServiceWorker(),
        topicId: discoveryTopicPayload.topic.id,
        topicPredictionCount: discoveryTopicPayload.predictions.length,
        visibleTopicFixture: true,
      },
      {
        id: 'discovery.loading',
        status: 'passed',
        domain: 'discovery',
        state: 'loading',
        routes: ['/w/search', '/w/topic/macro'],
        operationIds: ['searchDiscovery', 'getDiscoveryTopic'],
        searchStatus: discoveryLoadingSearchResponse.status(),
        searchResponseFromServiceWorker: discoveryLoadingSearchResponse.fromServiceWorker(),
        searchPayloadQuery: discoveryLoadingSearchPayload.query,
        visibleSearchLoadingState: true,
        topicStatus: discoveryLoadingTopicResponse.status(),
        topicResponseFromServiceWorker: discoveryLoadingTopicResponse.fromServiceWorker(),
        topicId: discoveryLoadingTopicPayload.topic.id,
        visibleTopicLoadingState: true,
      },
      {
        id: 'discovery.error',
        status: 'passed',
        domain: 'discovery',
        state: 'error',
        routes: ['/w/topic/macro', '/w/search'],
        operationIds: ['searchDiscovery', 'getDiscoveryTopic'],
        topicStatus: discoveryErrorTopicResponse.status(),
        topicResponseFromServiceWorker: discoveryErrorTopicResponse.fromServiceWorker(),
        visibleTopicRetryAction: true,
        searchStatus: discoveryErrorSearchResponse.status(),
        searchResponseFromServiceWorker: discoveryErrorSearchResponse.fromServiceWorker(),
        visibleSearchError: true,
        visibleSearchRetryAction: true,
      },
      {
        id: 'discovery.forbidden',
        status: 'passed',
        domain: 'discovery',
        state: 'forbidden',
        routes: ['/w/search', '/w/topic/ai'],
        operationIds: ['searchDiscovery', 'getDiscoveryTopic'],
        searchStatus: discoveryForbiddenSearchResponse.status(),
        searchResponseFromServiceWorker: discoveryForbiddenSearchResponse.fromServiceWorker(),
        visibleSearchPermissionDeniedState: true,
        topicStatus: discoveryForbiddenTopicResponse.status(),
        topicResponseFromServiceWorker: discoveryForbiddenTopicResponse.fromServiceWorker(),
        visibleTopicPermissionDeniedState: true,
      },
      {
        id: 'discovery.unauthorized',
        status: 'passed',
        domain: 'discovery',
        state: 'unauthorized',
        routes: ['/w/topic/community', '/w/search'],
        operationIds: ['getDiscoveryTopic', 'searchDiscovery'],
        topicStatus: discoveryUnauthorizedTopicResponse.status(),
        topicResponseFromServiceWorker: discoveryUnauthorizedTopicResponse.fromServiceWorker(),
        topicRefreshStatus: discoveryUnauthorizedTopicRefresh.status(),
        topicLoginRoute: '/auth/login',
        searchStatus: discoveryUnauthorizedSearchResponse.status(),
        searchResponseFromServiceWorker: discoveryUnauthorizedSearchResponse.fromServiceWorker(),
        searchRefreshStatus: discoveryUnauthorizedSearchRefresh.status(),
        topicLoginRoute: discoveryUnauthorizedTopicLoginRoute,
        searchLoginRoute: discoveryUnauthorizedSearchLoginRoute,
        staleProtectedDiscoveryDataVisible: false,
      },
      {
        id: 'referral.loading',
        status: 'passed',
        route: '/w/referral',
        operationId: 'getReferralOverview',
        responseStatus: referralLoadingResponse.status(),
        responseFromServiceWorker: referralLoadingResponse.fromServiceWorker(),
        visibleLoadingState: true,
      },
      {
        id: 'referral.success',
        status: 'passed',
        route: '/w/referral',
        operationId: 'getReferralOverview',
        responseStatus: referralSuccessResponse.status(),
        responseFromServiceWorker: referralSuccessResponse.fromServiceWorker(),
        visibleCampaign: true,
        visibleFriend: true,
        friendCount: referralSuccessPayload.friends.length,
      },
      {
        id: 'referral.empty',
        status: 'passed',
        route: '/w/referral',
        operationId: 'getReferralOverview',
        responseStatus: referralEmptyResponse.status(),
        responseFromServiceWorker: referralEmptyResponse.fromServiceWorker(),
        friendCount: referralEmptyPayload.friends.length,
        totalFriends: referralEmptyPayload.stats.totalFriends,
        visibleEmptyState: true,
        campaignRemainsVisible: true,
      },
      {
        id: 'referral.error',
        status: 'passed',
        route: '/w/referral',
        operationId: 'getReferralOverview',
        responseStatus: referralErrorResponse.status(),
        responseFromServiceWorker: referralErrorResponse.fromServiceWorker(),
        visibleRetryAction: true,
      },
      {
        id: 'referral.forbidden',
        status: 'passed',
        route: '/w/referral',
        operationId: 'getReferralOverview',
        responseStatus: referralForbiddenResponse.status(),
        responseFromServiceWorker: referralForbiddenResponse.fromServiceWorker(),
        visiblePermissionDeniedState: true,
      },
      {
        id: 'referral.unauthorized',
        status: 'passed',
        route: '/w/referral',
        operationId: 'getReferralOverview',
        responseStatus: referralUnauthorizedResponse.status(),
        responseFromServiceWorker: referralUnauthorizedResponse.fromServiceWorker(),
        refreshStatus: referralUnauthorizedRefresh.status(),
        loginRoute: referralUnauthorizedLoginRoute,
        staleReferralDataVisible: false,
      },
      {
        id: 'p2p.success',
        status: 'passed',
        route: '/w/p2p/escrow/p2p002',
        operationIds: ['getP2POrder', 'createP2POrder'],
        responseStatus: p2pOrderResponse.status(),
        responseFromServiceWorker: p2pOrderResponse.fromServiceWorker(),
        orderStatus: p2pOrderPayload.status,
        escrowAmount: p2pOrderPayload.escrowAmount,
        releaseActionVisibleForAuthorizedPersona: true,
        createOrderStatus: p2pOrderCreateResponse.status(),
        createOrderIdempotencyKeyPresent: Boolean(p2pOrderCreateIdempotencyKey),
        createdOrderDetailStatus: p2pCreatedOrderResponse.status(),
        createdOrderRoute: p2pAdOrderCreatedRoute,
      },
      {
        id: 'p2p.duplicate',
        status: 'passed',
        route: '/w/p2p/ad/ad001',
        operationIds: [
          'createP2POrder',
          'markP2POrderPaid',
          'releaseP2POrderEscrow',
          'getP2POrder',
        ],
        responseStatus: p2pOrderConflictResponse.status(),
        responseFromServiceWorker: p2pOrderConflictResponse.fromServiceWorker(),
        idempotencyKeyPresent: Boolean(p2pOrderConflictIdempotencyKey),
        visibleConflictGuidance: true,
        createRequestCount: p2pOrderConflictRequests.length,
        observationWindowMs: 500,
        routeAfterConflict: p2pOrderConflictRoute,
        markPaidResponseStatus: p2pMarkPaidConflictResponse.status(),
        markPaidResponseFromServiceWorker: p2pMarkPaidConflictResponse.fromServiceWorker(),
        markPaidIdempotencyKeyPresent: Boolean(p2pMarkPaidConflictIdempotencyKey),
        visibleMarkPaidConflictGuidance: true,
        markPaidRequestCount: p2pMarkPaidConflictRequests.length,
        markPaidObservationWindowMs: 500,
        markPaidRefreshedOrderStatus: p2pMarkPaidOrderRefreshPayload.status,
        markPaidRefreshedOrderResponseStatus: p2pMarkPaidOrderRefreshResponse.status(),
        markPaidRoute: '/w/p2p/escrow/p2p001',
        markPaidRouteAfterConflict: p2pMarkPaidConflictRoute,
        releaseResponseStatus: p2pReleaseConflictResponse.status(),
        releaseResponseFromServiceWorker: p2pReleaseConflictResponse.fromServiceWorker(),
        releaseIdempotencyKeyPresent: Boolean(p2pReleaseConflictIdempotencyKey),
        releaseRequestCount: p2pReleaseConflictRequests.length,
        releaseObservationWindowMs: 500,
        releaseRefreshedOrderStatus: p2pReleaseConflictOrderRefreshPayload.status,
        releaseRefreshedOrderResponseStatus: p2pReleaseConflictOrderRefreshResponse.status(),
        releaseOrderReadCount: p2pReleaseConflictOrderRefreshRequests.length,
        releaseChallengeStatus: p2pDuplicateReleaseChallengeResponse.status(),
        releaseVerificationStatus: p2pDuplicateReleaseVerificationResponse.status(),
        visibleReleaseConflictGuidance: true,
        releaseRouteAfterConflict: p2pReleaseConflictRoute,
      },
      {
        id: 'p2p.forbidden',
        status: 'passed',
        route: '/w/p2p/escrow/p2p002',
        operationIds: ['createP2PReleaseChallenge'],
        responseStatus: p2pReleaseChallengeForbiddenResponse.status(),
        responseFromServiceWorker: p2pReleaseChallengeForbiddenResponse.fromServiceWorker(),
        permissionDeniedMessage: p2pReleaseChallengeForbiddenMessage,
        verificationRequestCount: p2pReleaseChallengeForbiddenVerificationRequests.length,
        releaseRequestCount: p2pReleaseChallengeForbiddenReleaseRequests.length,
        routeAfterDeniedChallenge: p2pReleaseChallengeForbiddenRoute,
      },
      {
        id: 'p2p.pending',
        status: 'passed',
        route: '/w/p2p/escrow/p2p002',
        routes: [
          '/w/p2p/ad/ad001',
          `/w/p2p/order/${p2pPendingCreatedOrderId}`,
          '/w/p2p/escrow/p2p002',
        ],
        operationIds: [
          'createP2POrder',
          'getP2POrder',
          'markP2POrderPaid',
          'releaseP2POrderEscrow',
        ],
        createStatus: p2pPendingCreateResponse.status(),
        createResponseFromServiceWorker: p2pPendingCreateResponse.fromServiceWorker(),
        createReceiptStatus: p2pPendingCreateReceipt.status,
        createIdempotencyKeyPresent: Boolean(p2pPendingCreateIdempotencyKey),
        createButtonDisabledWhilePending: p2pPendingCreateButtonDisabled,
        createdOrderId: p2pPendingCreateReceipt.orderId,
        markPaidStatus: p2pPendingMarkPaidResponse.status(),
        markPaidResponseFromServiceWorker: p2pPendingMarkPaidResponse.fromServiceWorker(),
        markPaidOrderStatus: p2pPendingMarkPaidOrder.status,
        markPaidIdempotencyKeyPresent: Boolean(p2pPendingMarkPaidIdempotencyKey),
        markPaidButtonDisabledWhilePending: p2pPendingMarkPaidButtonDisabled,
        releaseChallengeStatus: p2pChallengeResponse.status(),
        verificationStatus: p2pVerificationResponse.status(),
        releaseStatus: p2pReleaseResponse.status(),
        releaseResponseFromServiceWorker: p2pReleaseResponse.fromServiceWorker(),
        releaseOrderStatus: p2pReleasePayload.status,
        releaseIdempotencyKeyPresent: Boolean(p2pReleaseIdempotencyKey),
        releaseButtonDisabledWhilePending: p2pReleaseButtonDisabled,
        visibleFinalReleasedState: true,
      },
      {
        id: 'p2p.unauthorized',
        status: 'passed',
        route: '/w/p2p/escrow/p2p002',
        operationIds: ['getP2POrder'],
        responseStatus: p2pUnauthorizedOrderResponse.status(),
        responseFromServiceWorker: p2pUnauthorizedOrderResponse.fromServiceWorker(),
        refreshStatus: p2pUnauthorizedRefreshResponse.status(),
        refreshFromServiceWorker: p2pUnauthorizedRefreshResponse.fromServiceWorker(),
        loginRoute: p2pUnauthorizedLoginRoute,
        staleP2POrderVisible,
      },
      {
        id: 'wallet.unauthorized',
        status: 'passed',
        route: '/w/wallet',
        routes: ['/w/wallet', walletUnauthorizedLoginRoute],
        operationIds: ['getWalletAssets', 'getWalletTransactions'],
        assetsStatus: walletAssetsResponse.status(),
        assetsFromServiceWorker: walletAssetsResponse.fromServiceWorker(),
        assetsError: walletAssetsError,
        transactionsStatus: walletTransactionsResponse.status(),
        transactionsFromServiceWorker: walletTransactionsResponse.fromServiceWorker(),
        transactionsError: walletTransactionsError,
        refreshStatus: walletUnauthorizedRefreshResponse.status(),
        refreshFromServiceWorker: walletUnauthorizedRefreshResponse.fromServiceWorker(),
        refreshError: walletUnauthorizedRefreshError,
        loginRoute: walletUnauthorizedLoginRoute,
        staleBalanceVisibleAfterRedirect: walletStaleBalanceVisible,
      },
      {
        id: 'wallet.forbidden',
        status: 'passed',
        route: '/w/wallet',
        operationIds: ['getWalletAssets', 'getWalletTransactions'],
        assetsStatus: walletForbiddenAssetsResponse.status(),
        assetsFromServiceWorker: walletForbiddenAssetsResponse.fromServiceWorker(),
        assetsError: walletForbiddenAssetsError,
        transactionsStatus: walletForbiddenTransactionsResponse.status(),
        transactionsFromServiceWorker: walletForbiddenTransactionsResponse.fromServiceWorker(),
        transactionsError: walletForbiddenTransactionsError,
        refreshRequestCount: walletForbiddenRefreshRequests.length,
        routeAfterResponse: walletForbiddenRoute,
        errorVisible: walletForbiddenErrorVisible,
        staleBalanceVisible: walletForbiddenBalanceVisible,
      },
      {
        id: 'wallet.loading',
        status: 'passed',
        route: walletLoadingRoute,
        operationIds: ['getWalletAssets', 'getWalletTransactions'],
        responses: walletLoadingResponses,
        assetsPayloadSummary: walletLoadingAssetsPayload.summary,
        transactionCount: walletLoadingTransactionsPayload.items.length,
        visibleLoadingBeforeResponses: walletLoadingVisibleBeforeResponses,
        remainedLoadingBeforeResponses: walletStillLoadingBeforeResponses,
        responseCountBeforeResponses: walletLoadingResponseCountBeforeResponses,
        visibleLoadingAfterResponses: walletLoadingVisibleAfterResponses,
        staleBalanceVisibleBeforeResponses: walletLoadingBalanceVisibleBeforeResponses,
        balanceVisibleAfterResponses: walletLoadingBalanceVisibleAfterResponses,
        falseEmptyStateVisible: walletLoadingFalseEmptyStateVisible,
        errorVisibleAfterResponses: walletLoadingErrorVisibleAfterResponses,
        elapsedMs: walletLoadingElapsedMs,
      },
      {
        id: 'wallet.error',
        status: 'passed',
        route: walletErrorRouteAfterRetry,
        operationIds: ['getWalletAssets', 'getWalletTransactions'],
        errorResponsesBeforeRetry: walletErrorInitialResponses,
        errorResponsesAfterRetry: walletErrorRetryResponses,
        requestCount: walletErrorRequests.length,
        attemptsPerOperationBeforeRetry: {
          assets: countWalletErrorResponses(walletErrorInitialResponses, '/api/wallet/assets'),
          transactions: countWalletErrorResponses(
            walletErrorInitialResponses,
            '/api/wallet/transactions',
          ),
        },
        attemptsPerOperationAfterRetry: {
          assets: countWalletErrorResponses(walletErrorRetryResponses, '/api/wallet/assets'),
          transactions: countWalletErrorResponses(
            walletErrorRetryResponses,
            '/api/wallet/transactions',
          ),
        },
        initialElapsedMs: walletErrorInitialElapsedMs,
        errorVisibleBeforeRetry: walletErrorInitialErrorVisible,
        errorVisibleDuringRetry: walletErrorVisibleDuringRetry,
        retryActionVisible: walletErrorRetryActionVisible,
        retryActionStillVisible: walletErrorRetryActionStillVisible,
        staleBalanceVisibleBeforeRetry: walletErrorStaleBalanceVisibleBeforeRetry,
        staleBalanceVisibleAfterRetry: walletErrorStaleBalanceVisibleAfterRetry,
        summaryVisibleBeforeRetry: walletErrorSummaryVisibleBeforeRetry,
        summaryVisibleAfterRetry: walletErrorSummaryVisibleAfterRetry,
        routeBeforeRetry: walletErrorRouteBeforeRetry,
        routeAfterRetry: walletErrorRouteAfterRetry,
        refreshRequestCount: walletErrorRefreshRequests.length,
        syntheticStatus: 503,
        declaredByWalletReadOperations: false,
      },
      {
        id: 'wallet.success',
        domain: 'wallet',
        state: 'success',
        status: 'passed',
        route: walletSuccessRoute,
        operationIds: ['getWalletAssets', 'getWalletTransactions'],
        responses: [
          {
            operationId: 'getWalletAssets',
            path: '/api/wallet/assets',
            method: walletSuccessAssetsResponse.request().method(),
            status: walletSuccessAssetsResponse.status(),
            fromServiceWorker: walletSuccessAssetsResponse.fromServiceWorker(),
          },
          {
            operationId: 'getWalletTransactions',
            path: '/api/wallet/transactions',
            method: walletSuccessTransactionsResponse.request().method(),
            status: walletSuccessTransactionsResponse.status(),
            fromServiceWorker: walletSuccessTransactionsResponse.fromServiceWorker(),
          },
        ],
        assetsPayloadSummary: walletSuccessAssetsPayload.summary,
        transactionCount: walletSuccessTransactionsPayload.items.length,
        visibleTotalBalance: walletSuccessTotalBalanceVisible,
        visibleRecentActivity: walletSuccessRecentActivityVisible,
        visibleDepositAction: walletSuccessDepositActionVisible,
        visibleHistoryAction: walletSuccessHistoryActionVisible,
        visibleWithdrawAction: walletSuccessWithdrawActionVisible,
        visibleTransferAction: walletSuccessTransferActionVisible,
        visibleError: walletSuccessErrorVisible,
        elapsedMs: walletSuccessElapsedMs,
      },
      {
        id: 'wallet.empty',
        domain: 'wallet',
        state: 'empty',
        status: 'passed',
        route: walletEmptyRoute,
        operationIds: ['getWalletAssets', 'getWalletTransactions'],
        responses: [
          {
            operationId: 'getWalletAssets',
            path: '/api/wallet/assets',
            method: walletEmptyAssetsResponse.request().method(),
            status: walletEmptyAssetsResponse.status(),
            fromServiceWorker: walletEmptyAssetsResponse.fromServiceWorker(),
          },
          {
            operationId: 'getWalletTransactions',
            path: '/api/wallet/transactions',
            method: walletEmptyTransactionsResponse.request().method(),
            status: walletEmptyTransactionsResponse.status(),
            fromServiceWorker: walletEmptyTransactionsResponse.fromServiceWorker(),
          },
        ],
        assetsPayloadSummary: walletEmptyAssetsPayload.summary,
        assetCount: walletEmptyAssetsPayload.items.length,
        transactionPayload: walletEmptyTransactionsPayload,
        visibleBalance: walletEmptyBalanceVisible,
        visibleEmptyActivity: walletEmptyActivityVisible,
        falseEmptyAssetStateVisible: walletEmptyFalseAssetEmptyVisible,
        visibleError: walletEmptyErrorVisible,
        elapsedMs: walletEmptyElapsedMs,
      },
      {
        id: 'wallet.pending',
        domain: 'wallet',
        state: 'pending',
        status: 'passed',
        route: walletPendingTransactionRoute,
        operationIds: ['createWalletTransfer', 'createWalletWithdrawal', 'getWalletTransaction'],
        responses: [
          {
            operationId: 'createWalletTransfer',
            path: '/api/wallet/transfers',
            method: walletPendingTransferResponse.request().method(),
            status: walletPendingTransferResponse.status(),
            fromServiceWorker: walletPendingTransferResponse.fromServiceWorker(),
          },
          {
            operationId: 'createWalletWithdrawal',
            path: '/api/wallet/withdrawals',
            method: walletPendingWithdrawalResponse.request().method(),
            status: walletPendingWithdrawalResponse.status(),
            fromServiceWorker: walletPendingWithdrawalResponse.fromServiceWorker(),
          },
          {
            operationId: 'getWalletTransaction',
            path: `/api/wallet/transactions/${walletPendingTransactionId}`,
            method: walletPendingTransactionResponse.request().method(),
            status: walletPendingTransactionResponse.status(),
            fromServiceWorker: walletPendingTransactionResponse.fromServiceWorker(),
          },
        ],
        withdrawalPrerequisites: {
          challengeStatus: walletPendingChallengeResponse.status(),
          verificationStatus: walletPendingVerificationResponse.status(),
        },
        transferReceipt: walletPendingTransferPayload,
        withdrawalReceipt: walletPendingWithdrawalPayload,
        transactionPayload: walletPendingTransactionPayload,
        transferRoute: walletPendingRoute,
        withdrawalRoute: walletPendingWithdrawalRoute,
        transactionRoute: walletPendingTransactionRoute,
        visibleTransferReference: walletPendingTransferReference,
        visibleWithdrawalReference: walletPendingWithdrawalReference,
        visibleTransactionId: walletPendingTransactionId,
        retainedTransferAmount: walletPendingTransferAmount,
        sameIntentSubmitDisabled: walletPendingTransferButtonDisabled,
        transferRequestCount: walletPendingTransferRequestCount,
        visibleWithdrawalPendingStatus: walletPendingWithdrawalStatusVisible,
        visibleTransactionPendingStatus: walletPendingTransactionStatusVisible,
        elapsedMs: walletPendingElapsedMs,
      },
      {
        id: 'trading.pending',
        domain: 'trading',
        state: 'pending',
        status: 'passed',
        route: '/w/trade/btcusdt',
        operationIds: tradingPendingOperationIds,
        requestMethod: tradingPendingRequest.method(),
        responseStatus: tradingPendingResponse.status(),
        responseFromServiceWorker: tradingPendingResponse.fromServiceWorker(),
        idempotencyKeyLength: tradingPendingRequest.headers()['idempotency-key']?.length ?? 0,
        uiObservedAfterMs: tradingPendingUiObservedMs,
        responseElapsedMs: tradingPendingResponseElapsedMs,
        responseStillWaitingWhenUiObserved: tradingPendingResponseStillWaiting,
        confirmDisabledWhileInFlight: tradingPendingSubmitDisabled,
        mutationRequestCount: tradingPendingOperationRequestCounts.placeOrder,
        responseStatusEnum: tradingPendingOrder.status,
        responseOrderId: tradingPendingOrder.id,
        receiptRoute: tradingPendingReceiptRoute,
        visibleReceiptReference: true,
        operationEvidence: {
          listOpenOrders: {
            initialStatus: tradingPendingOpenOrdersResponse.status(),
            initialFromServiceWorker: tradingPendingOpenOrdersResponse.fromServiceWorker(),
            refreshedStatus: tradingPendingModifyOpenOrdersResponse.status(),
            refreshedFromServiceWorker: tradingPendingModifyOpenOrdersResponse.fromServiceWorker(),
            modifiedOrderInResponse: tradingPendingModifiedOrderInOpenOrders,
          },
          modifyOrder: {
            requestMethod: tradingPendingModifyRequest.method(),
            responseStatus: tradingPendingModifyResponse.status(),
            responseFromServiceWorker: tradingPendingModifyResponse.fromServiceWorker(),
            idempotencyKeyLength:
              tradingPendingModifyRequest.headers()['idempotency-key']?.length ?? 0,
            elapsedMs: tradingPendingModifyResponseElapsedMs,
            responseStillWaitingWhenSubmitDisabled: tradingPendingModifyResponseStillWaiting,
            submitDisabledWhileInFlight: tradingPendingModifyDisabledWhileInFlight,
            responseOrderId: tradingPendingModifiedOrder.id,
            responsePrice: tradingPendingModifiedOrder.price,
            responseStatusEnum: tradingPendingModifiedOrder.status,
          },
          cancelOrder: {
            requestMethod: tradingPendingCancelRequest.method(),
            responseStatus: tradingPendingCancelResponse.status(),
            responseFromServiceWorker: tradingPendingCancelResponse.fromServiceWorker(),
            idempotencyKeyLength:
              tradingPendingCancelRequest.headers()['idempotency-key']?.length ?? 0,
            elapsedMs: tradingPendingCancelResponseElapsedMs,
            responseStillWaitingWhenCancelDisabled: tradingPendingCancelResponseStillWaiting,
            cancelDisabledWhileInFlight: tradingPendingCancelDisabledWhileInFlight,
            responseOrderId: tradingPendingCancelledOrder.id,
            responseStatusEnum: tradingPendingCancelledOrder.status,
          },
          listOrderHistory: {
            initialStatus: tradingPendingInitialHistoryResponse.status(),
            finalStatus: tradingPendingCancelHistoryResponse.status(),
            initialFromServiceWorker: tradingPendingInitialHistoryResponse.fromServiceWorker(),
            finalFromServiceWorker: tradingPendingCancelHistoryResponse.fromServiceWorker(),
            cancelledOrderInResponse: tradingPendingHistoryPayload.items.some(
              (order) => order.id === tradingPendingOrder.id && order.status === 'cancelled',
            ),
            cancelledOrderVisible: tradingPendingHistoryCancelledOrderVisible,
          },
        },
        screenshot: path.basename(tradingPendingScreenshotPath),
      },
      {
        id: 'trading.empty',
        domain: 'trading',
        state: 'empty',
        status: 'passed',
        persona: 'developer',
        route: '/w/trade/orders-history',
        routes: [
          '/w/trade/orders-history',
          '/w/trade/orders-history (tab Lịch sử)',
          '/w/trade/positions',
        ],
        operationIds: tradingEmptyOperationIds,
        requestCounts: tradingEmptyRequestCounts,
        requests: tradingEmptyRequests,
        responses: tradingEmptyResponses,
        unexpectedTradingRequestCount: unexpectedTradingEmptyRequests.length,
        openOrders: {
          status: openOrdersResponse.status(),
          payload: openOrdersPayload,
          visibleEmptyState: true,
        },
        orderHistory: {
          status: orderHistoryResponse.status(),
          payload: orderHistoryPayload,
          visibleEmptyState: true,
        },
        positions: {
          status: positionsResponse.status(),
          payload: positionsPayload,
          visibleEmptyState: true,
          unavailableStateVisible: false,
        },
        writeRequests: 0,
        finalRoute: tradingEmptyFinalRoute,
        elapsedMs: tradingEmptyElapsedMs,
        screenshots: [
          path.basename(tradingEmptyOpenOrdersScreenshotPath),
          path.basename(tradingEmptyHistoryScreenshotPath),
          path.basename(tradingEmptyPositionsScreenshotPath),
        ],
      },
      {
        id: 'trading.loading',
        domain: 'trading',
        state: 'loading',
        status: 'passed',
        persona: 'developer',
        route: '/w/trade/positions',
        routes: [
          '/w/trade/orders-history (Lệnh mở)',
          '/w/trade/orders-history (tab Lịch sử)',
          '/w/trade/positions',
        ],
        operationIds: tradingLoadingOperationIds,
        requestCounts: tradingLoadingRequestCounts,
        responseCounts: tradingLoadingResponseCounts,
        requests: tradingLoadingRequests,
        responses: tradingLoadingResponses,
        loadingReads: tradingLoadingReads,
        unexpectedTradingRequestCount: unexpectedTradingLoadingRequests.length,
        writeRequestCount: unexpectedTradingLoadingRequests.filter(
          (request) => request.method !== 'GET',
        ).length,
        positionsUnavailableAttempts: tradingLoadingResponseCounts.listOpenPositions,
        positionsFinalStateVisible: true,
        finalRoute: tradingLoadingFinalRoute,
        elapsedMs: tradingLoadingElapsedMs,
        screenshots: [
          path.basename(tradingLoadingOpenOrdersScreenshotPath),
          path.basename(tradingLoadingHistoryScreenshotPath),
          path.basename(tradingLoadingPositionsScreenshotPath),
          path.basename(tradingLoadingPositionsErrorScreenshotPath),
        ],
        note: 'Chromium verifies loading UI before response on the three Trading collection GETs. The two order reads fall through to existing local fixtures; listOpenPositions falls through to the current 503 positions_source_unavailable handler after retries because no account-position source exists. Every observed response is from local MSW. This is not backend latency, account-data, staging or user-acceptance evidence.',
      },
      {
        ...tradingSuccessEvidence.scenario,
        domain: 'trading',
        state: 'success',
        elapsedMs: tradingSuccessEvidence.elapsedMs,
        apiRequestCount: tradingSuccessEvidence.apiRequestCount,
        apiResponseCount: tradingSuccessEvidence.apiResponseCount,
        externalApiOrigins: tradingSuccessEvidence.externalApiOrigins,
        positionsUnavailableAttempts:
          tradingSuccessEvidence.scenario.operationRequestCounts.listOpenPositions,
        note: 'This dedicated Trading success run observed 12 of 13 linked operations. listOpenPositions returned the existing local 503 positions_source_unavailable after six attempts because no account-position source is configured. Keep success coverage representative; the report does not certify backend behavior, staging, exchange execution or user acceptance.',
      },
      tradingErrorEvidence.scenario,
      tradingUnauthorizedEvidence.scenario,
      tradingForbiddenEvidence.scenario,
      adminSuccessEvidence.scenario,
      adminEmptyEvidence.scenario,
      adminLoadingEvidence.scenario,
      adminErrorEvidence.scenario,
      adminUnauthorizedEvidence.scenario,
      adminForbiddenEvidence.scenario,
      arenaSuccessEvidence.scenario,
      arenaEmptyEvidence.scenario,
      arenaLoadingEvidence.scenario,
      arenaErrorEvidence.scenario,
      {
        id: 'predictions.pending',
        domain: 'predictions',
        state: 'pending',
        status: 'passed',
        route: predictionsPendingReceiptRoute,
        operationIds: predictionsPendingOperationIds,
        eventResponseStatus: predictionsPendingEventResponse.status(),
        eventResponseFromServiceWorker: predictionsPendingEventResponse.fromServiceWorker(),
        eventId: predictionsPendingEvent.id,
        requestMethod: predictionsPendingRequest.method(),
        responseStatus: predictionsPendingResponse.status(),
        responseFromServiceWorker: predictionsPendingResponse.fromServiceWorker(),
        idempotencyKeyLength: predictionsPendingRequest.headers()['idempotency-key']?.length ?? 0,
        uiObservedAfterMs: predictionsPendingUiObservedMs,
        responseElapsedMs: predictionsPendingResponseElapsedMs,
        responseStillWaitingWhenUiObserved: predictionsPendingResponseStillWaiting,
        submitDisabledWhileInFlight: predictionsPendingSubmitDisabled,
        mutationRequestCount: predictionsPendingOperationRequestCounts.placePredictionOrder,
        receiptId: predictionsPendingReceipt.id,
        receiptStatus: predictionsPendingReceiptPayload.status,
        receiptReadStatus: predictionsPendingReceiptResponse.status(),
        receiptReadFromServiceWorker: predictionsPendingReceiptResponse.fromServiceWorker(),
        receiptRoute: predictionsPendingReceiptRoute,
        screenshot: path.basename(predictionsPendingScreenshotPath),
      },
      {
        id: 'predictions.success',
        domain: 'predictions',
        state: 'success',
        status: 'passed',
        route: '/w/markets/predictions',
        operationIds: predictionsSuccessOperationIds,
        requestCounts: predictionsSuccessOperationRequestCounts,
        elapsedMs: predictionsSuccessElapsedMs,
        listPredictionEvents: {
          status: predictionsSuccessEventsResponse.status(),
          fromServiceWorker: predictionsSuccessEventsResponse.fromServiceWorker(),
          eventCount: predictionsSuccessEventsPayload.items.length,
          visibleEventTitle: predictionsSuccessEvent.title,
        },
        getPredictionEvent: {
          status: predictionsSuccessEventResponse.status(),
          fromServiceWorker: predictionsSuccessEventResponse.fromServiceWorker(),
          eventId: predictionsSuccessEventPayload.id,
          visible: predictionsSuccessEventVisible,
        },
        placePredictionOrder: {
          status: predictionsSuccessOrderResponse.status(),
          fromServiceWorker: predictionsSuccessOrderResponse.fromServiceWorker(),
          requestMethod: predictionsSuccessOrderRequest.method(),
          idempotencyKeyLength:
            predictionsSuccessOrderRequest.headers()['idempotency-key']?.length ?? 0,
          requestEventId: predictionsSuccessOrderRequest.postDataJSON().eventId,
          requestOutcome: predictionsSuccessOrderRequest.postDataJSON().outcome,
          receiptId: predictionsSuccessOrderPayload.id,
          receiptStatus: predictionsSuccessOrderPayload.status,
        },
        getPredictionOrderReceipt: {
          status: predictionsSuccessReceiptResponse.status(),
          fromServiceWorker: predictionsSuccessReceiptResponse.fromServiceWorker(),
          receiptId: predictionsSuccessReceiptPayload.id,
          receiptStatus: predictionsSuccessReceiptPayload.status,
          visible: predictionsSuccessReceiptStatusVisible,
          route: predictionsSuccessReceiptRoute,
        },
        listPredictionPositions: {
          status: predictionsSuccessPositionsResponse.status(),
          fromServiceWorker: predictionsSuccessPositionsResponse.fromServiceWorker(),
          itemCount: predictionsSuccessPositionsPayload.items.length,
          visible: predictionsSuccessPositionVisible,
        },
        listPredictionRewards: {
          status: predictionsSuccessRewardsResponse.status(),
          fromServiceWorker: predictionsSuccessRewardsResponse.fromServiceWorker(),
          itemCount: predictionsSuccessRewardsPayload.items.length,
          visible: predictionsSuccessRewardVisible,
        },
        listPredictionLeaderboard: {
          status: predictionsSuccessLeaderboardResponse.status(),
          fromServiceWorker: predictionsSuccessLeaderboardResponse.fromServiceWorker(),
          itemCount: predictionsSuccessLeaderboardPayload.items.length,
          visible: predictionsSuccessLeaderboardVisible,
        },
        listPredictionActivity: {
          status: predictionsSuccessActivityResponse.status(),
          fromServiceWorker: predictionsSuccessActivityResponse.fromServiceWorker(),
          itemCount: predictionsSuccessActivityPayload.items.length,
          visible: predictionsSuccessActivityVisible,
        },
        screenshots: [
          path.basename(predictionsSuccessEventsScreenshotPath),
          path.basename(predictionsSuccessReceiptScreenshotPath),
        ],
      },
      {
        id: 'predictions.empty',
        domain: 'predictions',
        state: 'empty',
        status: 'passed',
        route: '/w/markets/predictions',
        operationIds: predictionsEmptyOperationIds,
        requestCounts: predictionsEmptyOperationRequestCounts,
        unexpectedPredictionRequestCount: predictionsEmptyUnexpectedPredictionRequestCount,
        elapsedMs: predictionsEmptyElapsedMs,
        listPredictionEvents: {
          status: predictionsEmptyEventsResponse.status(),
          fromServiceWorker: predictionsEmptyEventsResponse.fromServiceWorker(),
          itemCount: predictionsEmptyEventsPayload.items.length,
          visible: predictionsEmptyEventsVisible,
        },
        listPredictionPositions: {
          status: predictionsEmptyPositionsResponse.status(),
          fromServiceWorker: predictionsEmptyPositionsResponse.fromServiceWorker(),
          itemCount: predictionsEmptyPositionsPayload.items.length,
          visible: predictionsEmptyPositionsVisible,
        },
        listPredictionRewards: {
          status: predictionsEmptyRewardsResponse.status(),
          fromServiceWorker: predictionsEmptyRewardsResponse.fromServiceWorker(),
          itemCount: predictionsEmptyRewardsPayload.items.length,
          visible: predictionsEmptyRewardsVisible,
        },
        listPredictionLeaderboard: {
          status: predictionsEmptyLeaderboardResponse.status(),
          fromServiceWorker: predictionsEmptyLeaderboardResponse.fromServiceWorker(),
          itemCount: predictionsEmptyLeaderboardPayload.items.length,
          visible: predictionsEmptyLeaderboardVisible,
        },
        listPredictionActivity: {
          status: predictionsEmptyActivityResponse.status(),
          fromServiceWorker: predictionsEmptyActivityResponse.fromServiceWorker(),
          itemCount: predictionsEmptyActivityPayload.items.length,
          visible: predictionsEmptyActivityVisible,
        },
        screenshots: [
          path.basename(predictionsEmptyEventsScreenshotPath),
          path.basename(predictionsEmptyPortfolioScreenshotPath),
        ],
      },
      {
        id: 'predictions.loading',
        domain: 'predictions',
        state: 'loading',
        status: 'passed',
        route: '/w/markets/predictions',
        operationIds: predictionsLoadingOperationIds,
        requestCounts: predictionsLoadingOperationRequestCounts,
        unexpectedPredictionRequestCount: predictionsLoadingUnexpectedPredictionRequestCount,
        routeResults: predictionsLoadingRouteResults,
        screenshot: path.basename(predictionsLoadingScreenshotPath),
      },
      {
        id: 'predictions.error',
        domain: 'predictions',
        state: 'error',
        status: 'passed',
        route: '/w/markets/predictions',
        operationIds: predictionsErrorOperationIds,
        requestCounts: predictionsErrorOperationRequestCounts,
        initialFailureCount: predictionsErrorInitialFailureCount,
        manualRetryFailureCount:
          predictionsErrorFailures.length - predictionsErrorInitialFailureCount,
        totalFailureCount: predictionsErrorFailures.length,
        failureReasons: [...new Set(predictionsErrorFailures.map((item) => item.failure))],
        httpResponseCount: predictionsErrorResponses.length,
        unexpectedPredictionRequestCount: predictionsErrorUnexpectedPredictionRequestCount,
        initialElapsedMs: predictionsErrorInitialElapsedMs,
        manualRetryElapsedMs: predictionsErrorRetryElapsedMs,
        visibleErrorState: predictionsErrorVisibleErrorState,
        visibleRetryAction: predictionsErrorVisibleRetryAction,
        routeAfterRetry: predictionsErrorRouteAfterRetry,
        visibleEventCountAfterFailure: predictionsErrorVisibleEventCount,
        screenshot: path.basename(predictionsErrorScreenshotPath),
        note: 'Local MSW transport failure on a read-only GET; no HTTP status or backend response was fabricated.',
      },
      {
        id: 'predictions.unauthorized',
        domain: 'predictions',
        state: 'unauthorized',
        status: 'passed',
        route: '/w/markets/predictions',
        operationIds: predictionsUnauthorizedOperationIds,
        requestCounts: predictionsUnauthorizedEventRequestCounts,
        eventStatus: predictionsUnauthorizedEventResponse.status(),
        eventFromServiceWorker: predictionsUnauthorizedEventResponse.fromServiceWorker(),
        refreshStatus: predictionsUnauthorizedRefreshResponse.status(),
        refreshFromServiceWorker: predictionsUnauthorizedRefreshResponse.fromServiceWorker(),
        refreshResponseCount: predictionsUnauthorizedRefreshResponseCount,
        loginRoute: predictionsUnauthorizedLoginRoute,
        elapsedMs: predictionsUnauthorizedElapsedMs,
        visibleStaleEventCount: predictionsUnauthorizedVisibleStaleEventCount,
        unexpectedPredictionRequestCount: predictionsUnauthorizedUnexpectedPredictionRequestCount,
        screenshot: path.basename(predictionsUnauthorizedScreenshotPath),
        note: 'GET /predictions/events and POST /auth/refresh return contract-declared 401 responses through local MSW; this is not backend session certification.',
      },
      {
        id: 'predictions.forbidden',
        domain: 'predictions',
        state: 'forbidden',
        status: 'passed',
        route: '/w/markets/predictions/event/pred-1',
        persona: 'demo',
        operationIds: predictionsForbiddenOperationIds,
        requestCounts: {
          getPredictionEvent: predictionsForbiddenOperationRequestCounts.getPredictionEvent,
          placePredictionOrder: predictionsForbiddenOrderRequestCount,
        },
        eventStatus: predictionsForbiddenEventResponse.status(),
        eventFromServiceWorker: predictionsForbiddenEventResponse.fromServiceWorker(),
        permissionMessageVisible: predictionsForbiddenPermissionMessageVisible,
        buyButtonDisabled: predictionsForbiddenBuyButtonDisabled,
        routeAfterCheck: predictionsForbiddenRoute,
        observationWindowMs: 500,
        elapsedMs: predictionsForbiddenElapsedMs,
        unexpectedPredictionRequestCount: predictionsForbiddenUnexpectedPredictionRequestCount,
        screenshot: path.basename(predictionsForbiddenScreenshotPath),
        note: 'The Demo persona lacks predictions:trade. The declared detail GET succeeds, the order action is disabled, and no order POST is sent. The contract declares no Prediction HTTP 403, so no 403 response was injected.',
      },
      {
        id: 'profile.success',
        domain: 'profile',
        state: 'success',
        status: 'passed',
        persona: 'developer',
        route: '/w/profile',
        operationIds: profileSuccessOperationIds,
        requestCounts: profileSuccessOperationRequestCounts,
        responses: profileSuccessResponses,
        initialProfileStatus: profileSuccessInitialReadResponse.status(),
        listDevicesStatus: profileSuccessDeviceListResponse.status(),
        activityStatus: profileSuccessActivityResponse.status(),
        subAccountsStatus: profileSuccessSubAccountsResponse.status(),
        editControlsDisabled: profileSuccessEditDisabled,
        editPermissionMessageVisible: profileSuccessEditPermissionMessageVisible,
        deviceTrustActionDisabled: profileSuccessTrustDisabled,
        deviceRevokeActionDisabled: profileSuccessRevokeDisabled,
        securityPermissionMessageVisible: profileSuccessSecurityPermissionMessageVisible,
        activityVisible: profileSuccessActivityVisible,
        subAccountVisible: profileSuccessSubAccountVisible,
        unexpectedProfileRequestCount: profileSuccessUnexpectedRequestCount,
        profileWriteRequests: {
          updateProfile: profileSuccessOperationRequestCounts.updateProfile,
          setDeviceTrust: profileSuccessOperationRequestCounts.setDeviceTrust,
          revokeDevice: profileSuccessOperationRequestCounts.revokeDevice,
        },
        finalRoute: profileSuccessFinalRoute,
        elapsedMs: profileSuccessElapsedMs,
        screenshots: [
          path.basename(profileSuccessEditPermissionScreenshotPath),
          path.basename(profileSuccessDevicesScreenshotPath),
          path.basename(profileSuccessActivityScreenshotPath),
          path.basename(profileSuccessSubAccountsScreenshotPath),
        ],
        note: 'Four Profile reads render through local MSW. The Developer preview persona has no profile:read, profile:write or profile:security:write permission; local handlers do not enforce the declared read permission, while the real UI disables edit/trust/revoke actions. No mutation was sent. This is representative preview evidence only and does not certify API authorization, persistence or user acceptance.',
      },
      {
        id: 'profile.empty',
        domain: 'profile',
        state: 'empty',
        status: 'passed',
        persona: 'developer',
        route: '/w/profile/sub-accounts',
        operationIds: profileEmptyOperationIds,
        requestCounts: profileEmptyOperationRequestCounts,
        responses: profileEmptyResponses,
        responsePayloads: {
          listTrustedDevices: profileEmptyDevicesPayload,
          listProfileActivity: profileEmptyActivityPayload,
          listSubAccounts: profileEmptySubAccountsPayload,
        },
        devicesStatus: profileEmptyDeviceListResponse.status(),
        activityStatus: profileEmptyActivityResponse.status(),
        subAccountsStatus: profileEmptySubAccountsResponse.status(),
        devicesEmptyStateVisible: profileEmptyDevicesVisible,
        activityEmptyStateVisible: profileEmptyActivityVisible,
        subAccountsEmptyStateVisible: profileEmptySubAccountsVisible,
        zeroSubAccountCountVisible: profileEmptySubAccountCountVisible,
        unexpectedProfileRequestCount: profileEmptyUnexpectedRequestCount,
        finalRoute: profileEmptyFinalRoute,
        elapsedMs: profileEmptyElapsedMs,
        screenshots: [
          path.basename(profileEmptyDevicesScreenshotPath),
          path.basename(profileEmptyActivityScreenshotPath),
          path.basename(profileEmptySubAccountsScreenshotPath),
        ],
        note: 'Three Profile collection reads return the contract-valid {items:[]} from local MSW and show explicit empty states. The required Profile object is not replaced by an empty payload; updateProfile and device mutations are outside this read-only scenario. The Developer persona lacks profile:read and local MSW does not enforce that declared permission, so this does not certify authorization or backend behavior.',
      },
      {
        id: 'profile.loading',
        domain: 'profile',
        state: 'loading',
        status: 'passed',
        persona: 'developer',
        route: '/w/profile',
        operationIds: profileLoadingOperationIds,
        requestCounts: profileLoadingOperationRequestCounts,
        responses: profileLoadingResponses,
        loadingReads: profileLoadingReads,
        writeRequests: {
          updateProfile: profileLoadingOperationRequestCounts.updateProfile,
          revokeDevice: profileLoadingOperationRequestCounts.revokeDevice,
          setDeviceTrust: profileLoadingOperationRequestCounts.setDeviceTrust,
        },
        unexpectedProfileRequestCount: profileLoadingUnexpectedRequestCount,
        finalRoute: profileLoadingFinalRoute,
        elapsedMs: profileLoadingElapsedMs,
        screenshots: [
          path.basename(profileLoadingProfileScreenshotPath),
          path.basename(profileLoadingDevicesScreenshotPath),
          path.basename(profileLoadingActivityScreenshotPath),
          path.basename(profileLoadingSubAccountsScreenshotPath),
        ],
        note: 'The local loading scenario observes the four contract-secured Profile GETs and each route’s visible loading state while the service worker holds the response for two seconds. The Developer persona lacks profile:read and local MSW does not enforce that permission; updateProfile/device mutations require permissions the persona lacks and were not sent. This is representative local UI evidence, not authorization/backend evidence.',
      },
      {
        id: 'profile.error',
        domain: 'profile',
        state: 'error',
        status: 'passed',
        persona: 'developer',
        route: '/w/profile',
        operationIds: profileErrorOperationIds,
        requestCounts: profileErrorOperationRequestCounts,
        responses: profileErrorResponses,
        errorReads: profileErrorReads,
        writeRequests: {
          updateProfile: profileErrorOperationRequestCounts.updateProfile,
          revokeDevice: profileErrorOperationRequestCounts.revokeDevice,
          setDeviceTrust: profileErrorOperationRequestCounts.setDeviceTrust,
        },
        unexpectedProfileRequestCount: profileErrorUnexpectedRequestCount,
        finalRoute: profileErrorFinalRoute,
        elapsedMs: profileErrorElapsedMs,
        screenshots: [
          path.basename(profileErrorProfileScreenshotPath),
          path.basename(profileErrorDevicesScreenshotPath),
          path.basename(profileErrorActivityScreenshotPath),
          path.basename(profileErrorSubAccountsScreenshotPath),
        ],
        note: 'The local preview injects generic HTTP 503 failures into the four Profile GET surfaces. Each page shows ErrorState and Retry before and after a manual retry; the shared HTTP client plus React Query produce six requests per read cycle. The Profile OpenAPI does not declare 503 for these reads, so this is synthetic UI failure-path evidence only. Developer lacks profile:read and local MSW does not enforce that permission; writes were not sent. Coverage is representative, not authorization or backend evidence.',
      },
      {
        id: 'profile.unauthorized',
        domain: 'profile',
        state: 'unauthorized',
        status: 'passed',
        persona: 'developer',
        route: '/w/profile',
        routes: profileUnauthorizedReads.map((read) => read.route),
        operationIds: profileUnauthorizedOperationIds,
        requestCounts: profileUnauthorizedOperationRequestCounts,
        responses: profileUnauthorizedResponses,
        refreshRequests: profileUnauthorizedRefreshRequests.length,
        refreshResponses: profileUnauthorizedRefreshResponses,
        unauthorizedReads: profileUnauthorizedReads,
        writeRequests: {
          updateProfile: profileUnauthorizedOperationRequestCounts.updateProfile,
          revokeDevice: profileUnauthorizedOperationRequestCounts.revokeDevice,
          setDeviceTrust: profileUnauthorizedOperationRequestCounts.setDeviceTrust,
        },
        unexpectedProfileRequestCount: profileUnauthorizedUnexpectedRequestCount,
        finalRoute: profileUnauthorizedFinalRoute,
        elapsedMs: profileUnauthorizedElapsedMs,
        screenshots: [
          path.basename(profileUnauthorizedProfileScreenshotPath),
          path.basename(profileUnauthorizedDevicesScreenshotPath),
          path.basename(profileUnauthorizedActivityScreenshotPath),
          path.basename(profileUnauthorizedSubAccountsScreenshotPath),
        ],
        note: 'All four Profile read operations declare HTTP 401 in OpenAPI. Local MSW returns 401 for each read; the mock refresh returns 401 and the browser redirects to login after each route. Success fixture content was loaded first to check stale-content visibility. This is a synthetic expired-session flow only: Developer lacks profile:read, MSW does not enforce that permission, mutations were not sent, and no backend/session behavior is certified.',
      },
      {
        id: 'support.success',
        domain: 'support',
        state: 'success',
        status: 'passed',
        persona: 'support',
        route: '/w/support',
        routes: ['/w/news', '/w/notifications', '/w/support/help', '/w/support'],
        operationIds: supportOperationIds,
        requestCounts: supportOperationRequestCounts,
        responseCounts: supportResponseCounts,
        responses: supportResponses,
        unreadCountBefore: unreadCountBefore,
        unreadCountAfter: unreadCountAfter,
        notificationReadIdempotencyKey: markNotificationReadResponse.request().headers()[
          'idempotency-key'
        ],
        createdTicket: createdSupportTicket,
        ticketCreateIdempotencyKey: createSupportTicketResponse.request().headers()[
          'idempotency-key'
        ],
        unexpectedRequestCount: supportUnexpectedRequestCount,
        finalRoute: supportFinalRoute,
        elapsedMs: supportSuccessElapsedMs,
        screenshots: [
          path.basename(supportSuccessNewsScreenshotPath),
          path.basename(supportSuccessNotificationsScreenshotPath),
          path.basename(supportSuccessHelpScreenshotPath),
          path.basename(supportSuccessTicketsScreenshotPath),
        ],
        note: 'Chromium traversed the four Support/Content routes using a development-only Support persona with exactly support:read, support:write, notifications:read and notifications:write. The browser observed all six contract operation IDs via the local service worker; one notification was marked read with an Idempotency-Key, one ticket was created with HTTP 201 and an Idempotency-Key, then the list refreshed. These results exercise UI, client and local MSW fixtures only; mock authorization is not enforced by the handlers and real backend authorization, persistence, same-key replay and staging remain unverified.',
      },
      {
        id: 'support.empty',
        domain: 'support',
        state: 'empty',
        status: 'passed',
        persona: 'support',
        route: '/w/support',
        routes: ['/w/news', '/w/notifications', '/w/support/help', '/w/support'],
        operationIds: supportEmptyObservedOperationIds,
        requestCounts: supportEmptyOperationRequestCounts,
        responseCounts: supportEmptyResponseCounts,
        responses: supportEmptyResponses,
        initialTicketList: {
          status: emptyTicketListResponse.status(),
          body: emptyTicketListPayload,
          visibleEmptyState: true,
          retryActionVisible: false,
        },
        faqArticleVisible: true,
        createActionEnabled: true,
        notification: {
          unreadCountBefore: supportEmptyUnreadBefore,
          unreadCountAfter: supportEmptyUnreadAfter,
          status: supportEmptyMarkReadResponse.status(),
          idempotencyKey: supportEmptyMarkReadResponse.request().headers()['idempotency-key'],
        },
        createdTicket: supportEmptyCreatedTicket,
        refreshedTicketList: refreshedTicketListPayload,
        ticketCreateStatus: supportEmptyCreateResponse.status(),
        ticketCreateIdempotencyKey: supportEmptyCreateResponse.request().headers()[
          'idempotency-key'
        ],
        unexpectedRequestCount: supportEmptyUnexpectedRequestCount,
        finalRoute: supportEmptyFinalRoute,
        elapsedMs: supportEmptyElapsedMs,
        screenshots: [
          path.basename(supportEmptyTicketsScreenshotPath),
          path.basename(supportEmptyCreatedTicketScreenshotPath),
        ],
        note: 'Chromium selected support.empty with the Support preview persona. Ticket GET returned a successful empty list and showed no-ticket guidance without an error, while news, notifications and FAQ retained their mock content. The create action was enabled after valid input; the mock POST returned 201 and the same scenario-local list then contained the created ticket. All six linked operation IDs were observed via the local service worker, including notification read and ticket creation with Idempotency-Key. Existing component tests separately verify a failed ticket read renders Retry rather than the empty state. This is UI/client/local MSW evidence only; it does not certify backend authorization, persistence, same-key replay, staging or user acceptance.',
      },
      {
        id: 'support.loading',
        domain: 'support',
        state: 'loading',
        status: 'passed',
        persona: 'support',
        route: '/w/support',
        routes: ['/w/news', '/w/notifications', '/w/support/help', '/w/support'],
        operationIds: supportLoadingOperationIds,
        requestCounts: supportLoadingOperationRequestCounts,
        responseCounts: Object.fromEntries(
          supportOperationIds.map((operationId) => [
            operationId,
            supportLoadingResponses.filter((response) => response.operationId === operationId)
              .length,
          ]),
        ),
        responses: supportLoadingResponses,
        loadingReads: supportLoadingReads,
        mutationRequests: {
          markNotificationRead: supportLoadingOperationRequestCounts.markNotificationRead,
          createSupportTicket: supportLoadingOperationRequestCounts.createSupportTicket,
        },
        unexpectedRequestCount: supportLoadingUnexpectedRequestCount,
        finalRoute: supportLoadingFinalRoute,
        elapsedMs: supportLoadingElapsedMs,
        screenshots: [
          path.basename(supportLoadingNewsScreenshotPath),
          path.basename(supportLoadingNotificationsScreenshotPath),
          path.basename(supportLoadingHelpScreenshotPath),
          path.basename(supportLoadingTicketsScreenshotPath),
        ],
        note: 'Chromium verifies the visible loading state on the four Support/content GET surfaces while local MSW delays each response by two seconds, then confirms populated contract-shaped data. Only listNews, listNotifications, getHelpCenter and listSupportTickets run; notification-read and ticket-create mutations intentionally remain at zero in this read-only loading scenario. This is representative local UI/MSW evidence, not backend latency, authorization, staging or user acceptance.',
      },
      {
        id: 'support.error',
        domain: 'support',
        state: 'error',
        status: 'passed',
        persona: 'support',
        route: '/w/support',
        routes: ['/w/news', '/w/notifications', '/w/support/help', '/w/support'],
        operationIds: supportErrorOperationIds,
        requestCounts: supportErrorOperationRequestCounts,
        responseCounts: Object.fromEntries(
          supportOperationIds.map((operationId) => [
            operationId,
            supportErrorResponses.filter((response) => response.operationId === operationId).length,
          ]),
        ),
        responses: supportErrorResponses,
        errorReads: supportErrorReads,
        retryBehavior: {
          initialRequestsPerRead: 6,
          requestsAfterOneManualRetryPerRead: 12,
          allResponsesStay503: true,
        },
        mutationRequests: {
          markNotificationRead: supportErrorOperationRequestCounts.markNotificationRead,
          createSupportTicket: supportErrorOperationRequestCounts.createSupportTicket,
        },
        unexpectedRequestCount: supportErrorUnexpectedRequestCount,
        finalRoute: supportErrorFinalRoute,
        elapsedMs: supportErrorElapsedMs,
        screenshots: [
          path.basename(supportErrorNewsScreenshotPath),
          path.basename(supportErrorNotificationsScreenshotPath),
          path.basename(supportErrorHelpScreenshotPath),
          path.basename(supportErrorTicketsScreenshotPath),
        ],
        note: 'Chromium observes the visible ErrorState and Retry action on four Support/content read pages. Local MSW injects HTTP 503; each GET makes six attempts before ErrorState and six more after one manual Retry. The scenario observes only four of six linked operation IDs; both writes remain at zero. The checked-in Support OpenAPI does not declare 503 for these GETs, so this is generic UI failure-path evidence only, not a contract response, backend outage, retry recommendation, staging or user acceptance.',
      },
      {
        id: 'p2p.loading',
        status: 'passed',
        route: '/w/p2p/order-room',
        operationIds: ['listP2POrders'],
        requestMethod: p2pOrdersResponse.request().method(),
        responseStatus: p2pOrdersResponse.status(),
        responseFromServiceWorker: p2pOrdersResponse.fromServiceWorker(),
        elapsedMs: p2pOrdersElapsedMs,
        visibleLoadingState: p2pOrdersLoadingStateVisible,
        totalOrderCount: p2pOrdersPayload.total,
        renderedProcessingOrderNumber: visibleProcessingOrder.orderNumber,
      },
      {
        id: 'p2p.empty',
        status: 'passed',
        route: '/w/p2p/order-room',
        operationIds: ['listP2POrders'],
        requestMethod: p2pOrdersEmptyResponse.request().method(),
        responseStatus: p2pOrdersEmptyResponse.status(),
        responseFromServiceWorker: p2pOrdersEmptyResponse.fromServiceWorker(),
        contractResponse: p2pOrdersEmptyPayload,
        visibleEmptyState: true,
        visibleZeroOrderCount: true,
        mutationRequestCount: p2pOrdersEmptyMutationRequests.length,
        routeAfterResponse: p2pOrdersEmptyRoute,
        aliasRouteCheck: {
          route: p2pMyOrdersAliasRoute,
          operationId: 'listP2POrders',
          requestMethod: p2pMyOrdersAliasResponse.request().method(),
          responseStatus: p2pMyOrdersAliasResponse.status(),
          responseFromServiceWorker: p2pMyOrdersAliasResponse.fromServiceWorker(),
          contractResponse: p2pMyOrdersAliasPayload,
          visibleEmptyState: true,
          visibleZeroOrderCount: true,
          mutationRequestCount: p2pMyOrdersAliasMutationRequests.length,
        },
      },
      {
        id: 'p2p.error',
        status: 'passed',
        route: '/w/p2p/order-room',
        operationIds: ['listP2POrders'],
        responseStatus: p2pOrdersInitialErrorResponse.status(),
        responseFromServiceWorker: p2pOrdersInitialErrorResponse.fromServiceWorker(),
        visibleErrorState: true,
        visibleRetryAction: true,
        retryStatus: p2pOrdersRetryResponse.status(),
        retryFromServiceWorker: p2pOrdersRetryResponse.fromServiceWorker(),
        retryAttemptStatuses: p2pOrdersRetryAttemptStatuses,
        retryRoute: p2pOrdersRetryRoute,
      },
    ],
    loadingResponse: {
      status: loadingResponse.status(),
      fromServiceWorker: loadingResponse.fromServiceWorker(),
    },
    errorResponse: {
      status: errorResponse.status(),
      fromServiceWorker: errorResponse.fromServiceWorker(),
    },
    emptyResponse: {
      status: emptyResponse.status(),
      fromServiceWorker: emptyResponse.fromServiceWorker(),
      body: emptyPayload,
      visibleResultCount: emptyVisibleResultCount,
    },
    resetToFixtureResponse: {
      status: successResponse.status(),
      fromServiceWorker: successResponse.fromServiceWorker(),
    },
    clearedScenarioResponse: {
      status: resetResponse.status(),
      fromServiceWorker: resetResponse.fromServiceWorker(),
    },
    earnEmptyResponses: {
      snapshot: {
        status: earnSnapshotResponse.status(),
        fromServiceWorker: earnSnapshotResponse.fromServiceWorker(),
        body: earnSnapshotPayload,
      },
      transactions: {
        status: earnTransactionsResponse.status(),
        fromServiceWorker: earnTransactionsResponse.fromServiceWorker(),
        body: earnTransactionsPayload,
      },
    },
    earnPendingResponses: {
      subscription: {
        status: earnPendingSubscribeResponse.status(),
        fromServiceWorker: earnPendingSubscribeResponse.fromServiceWorker(),
        idempotencyKey: earnPendingSubscribeResponse.request().headers()['idempotency-key'],
        body: earnPendingSubscribePayload,
      },
      redemption: {
        status: earnPendingRedeemResponse.status(),
        fromServiceWorker: earnPendingRedeemResponse.fromServiceWorker(),
        idempotencyKey: earnPendingRedeemResponse.request().headers()['idempotency-key'],
        body: earnPendingRedeemPayload,
      },
      history: {
        status: earnPendingHistoryResponse.status(),
        fromServiceWorker: earnPendingHistoryResponse.fromServiceWorker(),
        body: earnPendingHistoryPayload,
      },
    },
    discoveryEmptyResponse: {
      status: discoverySearchResponse.status(),
      fromServiceWorker: discoverySearchResponse.fromServiceWorker(),
      body: discoverySearchPayload,
    },
    discoverySuccessResponses: {
      search: {
        status: discoverySuccessSearchResponse.status(),
        fromServiceWorker: discoverySuccessSearchResponse.fromServiceWorker(),
        query: discoverySuccessSearchPayload.query,
        predictionCount: discoverySuccessSearchPayload.predictions.length,
      },
      topic: {
        status: discoveryTopicResponse.status(),
        fromServiceWorker: discoveryTopicResponse.fromServiceWorker(),
        topicId: discoveryTopicPayload.topic.id,
        predictionCount: discoveryTopicPayload.predictions.length,
      },
    },
    discoveryLoadingResponses: {
      search: {
        status: discoveryLoadingSearchResponse.status(),
        fromServiceWorker: discoveryLoadingSearchResponse.fromServiceWorker(),
        query: discoveryLoadingSearchPayload.query,
      },
      topic: {
        status: discoveryLoadingTopicResponse.status(),
        fromServiceWorker: discoveryLoadingTopicResponse.fromServiceWorker(),
        topicId: discoveryLoadingTopicPayload.topic.id,
      },
    },
    discoveryErrorResponses: {
      search: {
        status: discoveryErrorSearchResponse.status(),
        fromServiceWorker: discoveryErrorSearchResponse.fromServiceWorker(),
      },
      topic: {
        status: discoveryErrorTopicResponse.status(),
        fromServiceWorker: discoveryErrorTopicResponse.fromServiceWorker(),
      },
    },
    discoveryForbiddenResponses: {
      search: {
        status: discoveryForbiddenSearchResponse.status(),
        fromServiceWorker: discoveryForbiddenSearchResponse.fromServiceWorker(),
      },
      topic: {
        status: discoveryForbiddenTopicResponse.status(),
        fromServiceWorker: discoveryForbiddenTopicResponse.fromServiceWorker(),
      },
    },
    discoveryUnauthorizedResponses: {
      topic: {
        status: discoveryUnauthorizedTopicResponse.status(),
        fromServiceWorker: discoveryUnauthorizedTopicResponse.fromServiceWorker(),
        refreshStatus: discoveryUnauthorizedTopicRefresh.status(),
      },
      search: {
        status: discoveryUnauthorizedSearchResponse.status(),
        fromServiceWorker: discoveryUnauthorizedSearchResponse.fromServiceWorker(),
        refreshStatus: discoveryUnauthorizedSearchRefresh.status(),
      },
    },
    p2pOrdersLoadingResponse: {
      status: p2pOrdersResponse.status(),
      fromServiceWorker: p2pOrdersResponse.fromServiceWorker(),
      method: p2pOrdersResponse.request().method(),
      elapsedMs: p2pOrdersElapsedMs,
      total: p2pOrdersPayload.total,
      itemCount: p2pOrdersPayload.items.length,
      renderedProcessingOrderNumber: visibleProcessingOrder.orderNumber,
    },
    p2pOrdersEmptyResponse: {
      status: p2pOrdersEmptyResponse.status(),
      fromServiceWorker: p2pOrdersEmptyResponse.fromServiceWorker(),
      method: p2pOrdersEmptyResponse.request().method(),
      body: p2pOrdersEmptyPayload,
      mutationRequestCount: p2pOrdersEmptyMutationRequests.length,
      route: p2pOrdersEmptyRoute,
    },
    p2pMyOrdersAliasResponse: {
      status: p2pMyOrdersAliasResponse.status(),
      fromServiceWorker: p2pMyOrdersAliasResponse.fromServiceWorker(),
      method: p2pMyOrdersAliasResponse.request().method(),
      body: p2pMyOrdersAliasPayload,
      mutationRequestCount: p2pMyOrdersAliasMutationRequests.length,
      route: p2pMyOrdersAliasRoute,
    },
    p2pReleaseChallengeForbiddenResponse: {
      status: p2pReleaseChallengeForbiddenResponse.status(),
      fromServiceWorker: p2pReleaseChallengeForbiddenResponse.fromServiceWorker(),
      method: p2pReleaseChallengeForbiddenResponse.request().method(),
      body: p2pReleaseChallengeForbiddenPayload,
      permissionDeniedMessage: p2pReleaseChallengeForbiddenMessage,
      verificationRequestCount: p2pReleaseChallengeForbiddenVerificationRequests.length,
      releaseRequestCount: p2pReleaseChallengeForbiddenReleaseRequests.length,
      route: p2pReleaseChallengeForbiddenRoute,
    },
    p2pAdOrderCreatedResponse: {
      adStatus: p2pAdResponse.status(),
      adFromServiceWorker: p2pAdResponse.fromServiceWorker(),
      adId: p2pAdPayload.id,
      status: p2pOrderCreateResponse.status(),
      fromServiceWorker: p2pOrderCreateResponse.fromServiceWorker(),
      request: p2pOrderCreateRequestBody,
      idempotencyKeyPresent: Boolean(p2pOrderCreateIdempotencyKey),
      requestCount: p2pOrderCreateRequests.length,
      receipt: p2pOrderCreatePayload,
      orderDetailStatus: p2pCreatedOrderResponse.status(),
      orderDetailFromServiceWorker: p2pCreatedOrderResponse.fromServiceWorker(),
      orderDetailId: p2pCreatedOrderPayload.id,
      route: p2pAdOrderCreatedRoute,
    },
    p2pAdOrderConflictResponse: {
      adStatus: p2pConflictAdResponse.status(),
      adFromServiceWorker: p2pConflictAdResponse.fromServiceWorker(),
      status: p2pOrderConflictResponse.status(),
      fromServiceWorker: p2pOrderConflictResponse.fromServiceWorker(),
      body: p2pOrderConflictPayload,
      idempotencyKeyPresent: Boolean(p2pOrderConflictIdempotencyKey),
      createRequestCount: p2pOrderConflictRequests.length,
      observationWindowMs: 500,
      conflictGuidance: p2pOrderConflictMessage,
      route: p2pOrderConflictRoute,
    },
    p2pMarkPaidConflictResponse: {
      status: p2pMarkPaidConflictResponse.status(),
      fromServiceWorker: p2pMarkPaidConflictResponse.fromServiceWorker(),
      body: p2pMarkPaidConflictPayload,
      idempotencyKeyPresent: Boolean(p2pMarkPaidConflictIdempotencyKey),
      requestCount: p2pMarkPaidConflictRequests.length,
      observationWindowMs: 500,
      refreshedOrderResponseStatus: p2pMarkPaidOrderRefreshResponse.status(),
      refreshedOrderStatus: p2pMarkPaidOrderRefreshPayload.status,
      conflictGuidance: p2pMarkPaidConflictMessage,
      route: p2pMarkPaidConflictRoute,
    },
    p2pReleaseConflictResponse: {
      status: p2pReleaseConflictResponse.status(),
      fromServiceWorker: p2pReleaseConflictResponse.fromServiceWorker(),
      body: p2pReleaseConflictPayload,
      challengeStatus: p2pDuplicateReleaseChallengeResponse.status(),
      verificationStatus: p2pDuplicateReleaseVerificationResponse.status(),
      idempotencyKeyPresent: Boolean(p2pReleaseConflictIdempotencyKey),
      requestCount: p2pReleaseConflictRequests.length,
      observationWindowMs: 500,
      refreshedOrderResponseStatus: p2pReleaseConflictOrderRefreshResponse.status(),
      refreshedOrderStatus: p2pReleaseConflictOrderRefreshPayload.status,
      orderReadCount: p2pReleaseConflictOrderRefreshRequests.length,
      conflictGuidance: p2pReleaseConflictMessage,
      route: p2pReleaseConflictRoute,
    },
    p2pOrdersErrorResponses: {
      initialStatus: p2pOrdersInitialErrorResponse.status(),
      initialFromServiceWorker: p2pOrdersInitialErrorResponse.fromServiceWorker(),
      retryStatus: p2pOrdersRetryResponse.status(),
      retryFromServiceWorker: p2pOrdersRetryResponse.fromServiceWorker(),
      retryAttemptStatuses: p2pOrdersRetryAttemptStatuses,
      retryRoute: p2pOrdersRetryRoute,
    },
    profileErrorResponses: {
      reads: profileErrorReads,
      requestCounts: profileErrorOperationRequestCounts,
      responses: profileErrorResponses,
      unexpectedProfileRequestCount: profileErrorUnexpectedRequestCount,
      finalRoute: profileErrorFinalRoute,
      elapsedMs: profileErrorElapsedMs,
    },
    profileUnauthorizedResponses: {
      reads: profileUnauthorizedReads,
      requestCounts: profileUnauthorizedOperationRequestCounts,
      responses: profileUnauthorizedResponses,
      refreshRequests: profileUnauthorizedRefreshRequests.length,
      refreshResponses: profileUnauthorizedRefreshResponses,
      unexpectedProfileRequestCount: profileUnauthorizedUnexpectedRequestCount,
      finalRoute: profileUnauthorizedFinalRoute,
      elapsedMs: profileUnauthorizedElapsedMs,
    },
    supportSuccessResponses: {
      personaPermissions: [
        'support:read',
        'support:write',
        'notifications:read',
        'notifications:write',
      ],
      requestCounts: supportOperationRequestCounts,
      responseCounts: supportResponseCounts,
      responses: supportResponses,
      notification: {
        status: markNotificationReadResponse.status(),
        unreadCountBefore,
        unreadCountAfter,
        idempotencyKey: markNotificationReadResponse.request().headers()['idempotency-key'],
      },
      ticket: {
        status: createSupportTicketResponse.status(),
        body: createdSupportTicket,
        idempotencyKey: createSupportTicketResponse.request().headers()['idempotency-key'],
      },
      unexpectedRequestCount: supportUnexpectedRequestCount,
      finalRoute: supportFinalRoute,
      elapsedMs: supportSuccessElapsedMs,
    },
    supportEmptyResponses: {
      personaPermissions: [
        'support:read',
        'support:write',
        'notifications:read',
        'notifications:write',
      ],
      requestCounts: supportEmptyOperationRequestCounts,
      responseCounts: supportEmptyResponseCounts,
      responses: supportEmptyResponses,
      initialTicketList: emptyTicketListPayload,
      createdTicket: supportEmptyCreatedTicket,
      refreshedTicketList: refreshedTicketListPayload,
      notification: {
        status: supportEmptyMarkReadResponse.status(),
        unreadCountBefore: supportEmptyUnreadBefore,
        unreadCountAfter: supportEmptyUnreadAfter,
        idempotencyKey: supportEmptyMarkReadResponse.request().headers()['idempotency-key'],
      },
      ticketCreateIdempotencyKey: supportEmptyCreateResponse.request().headers()['idempotency-key'],
      unexpectedRequestCount: supportEmptyUnexpectedRequestCount,
      finalRoute: supportEmptyFinalRoute,
      elapsedMs: supportEmptyElapsedMs,
    },
    supportLoadingResponses: {
      personaPermissions: [
        'support:read',
        'support:write',
        'notifications:read',
        'notifications:write',
      ],
      requestCounts: supportLoadingOperationRequestCounts,
      responses: supportLoadingResponses,
      loadingReads: supportLoadingReads,
      mutationRequests: {
        markNotificationRead: supportLoadingOperationRequestCounts.markNotificationRead,
        createSupportTicket: supportLoadingOperationRequestCounts.createSupportTicket,
      },
      unexpectedRequestCount: supportLoadingUnexpectedRequestCount,
      finalRoute: supportLoadingFinalRoute,
      elapsedMs: supportLoadingElapsedMs,
    },
    supportErrorResponses: {
      personaPermissions: [
        'support:read',
        'support:write',
        'notifications:read',
        'notifications:write',
      ],
      requestCounts: supportErrorOperationRequestCounts,
      responses: supportErrorResponses,
      errorReads: supportErrorReads,
      mutationRequests: {
        markNotificationRead: supportErrorOperationRequestCounts.markNotificationRead,
        createSupportTicket: supportErrorOperationRequestCounts.createSupportTicket,
      },
      unexpectedRequestCount: supportErrorUnexpectedRequestCount,
      finalRoute: supportErrorFinalRoute,
      elapsedMs: supportErrorElapsedMs,
    },
    tradingEmptyResponses: {
      operationIds: tradingEmptyOperationIds,
      requestCounts: tradingEmptyRequestCounts,
      requests: tradingEmptyRequests,
      responses: tradingEmptyResponses,
      unexpectedTradingRequests: unexpectedTradingEmptyRequests,
      openOrdersPayload,
      orderHistoryPayload,
      positionsPayload,
      visibleEmptyStates: {
        openOrders: true,
        orderHistory: true,
        positions: true,
        positionsUnavailable: false,
      },
      writeRequests: 0,
      finalRoute: tradingEmptyFinalRoute,
      elapsedMs: tradingEmptyElapsedMs,
    },
    tradingLoadingResponses: {
      operationIds: tradingLoadingOperationIds,
      requestCounts: tradingLoadingRequestCounts,
      responseCounts: tradingLoadingResponseCounts,
      requests: tradingLoadingRequests,
      responses: tradingLoadingResponses,
      loadingReads: tradingLoadingReads,
      unexpectedTradingRequests: unexpectedTradingLoadingRequests,
      writeRequestCount: unexpectedTradingLoadingRequests.filter(
        (request) => request.method !== 'GET',
      ).length,
      positionsUnavailableAttempts: tradingLoadingResponseCounts.listOpenPositions,
      finalRoute: tradingLoadingFinalRoute,
      elapsedMs: tradingLoadingElapsedMs,
      externalApiOrigins: [...externalApiOrigins],
    },
    tradingSuccessEvidence,
    tradingErrorEvidence,
    tradingUnauthorizedEvidence,
    tradingForbiddenEvidence,
    adminSuccessEvidence,
    adminEmptyEvidence,
    adminLoadingEvidence,
    adminErrorEvidence,
    adminUnauthorizedEvidence,
    adminForbiddenEvidence,
    arenaSuccessEvidence,
    arenaEmptyEvidence,
    arenaLoadingEvidence,
    arenaErrorEvidence,
    externalApiOrigins: [...externalApiOrigins],
    externalAssetOrigins: [...externalAssetOrigins],
    screenshots: [
      path.basename(screenshotPath),
      path.basename(emptyScreenshotPath),
      path.basename(forbiddenScreenshotPath),
      path.basename(adminOverviewScreenshotPath),
      path.basename(adminFunnelScreenshotPath),
      path.basename(adminAbTestsScreenshotPath),
      path.basename(adminEmptyFunnelScreenshotPath),
      path.basename(adminEmptyAbTestsScreenshotPath),
      path.basename(adminLoadingOverviewScreenshotPath),
      path.basename(adminLoadingFunnelScreenshotPath),
      path.basename(adminLoadingAbTestsScreenshotPath),
      path.basename(adminErrorOverviewScreenshotPath),
      path.basename(adminErrorFunnelScreenshotPath),
      path.basename(adminErrorAbTestsScreenshotPath),
      path.basename(adminUnauthorizedLoginScreenshotPath),
      path.basename(adminForbiddenOverviewScreenshotPath),
      path.basename(adminForbiddenFunnelScreenshotPath),
      path.basename(adminForbiddenAbTestsScreenshotPath),
      path.basename(arenaDiscoveryScreenshotPath),
      path.basename(arenaModeScreenshotPath),
      path.basename(arenaChallengeScreenshotPath),
      path.basename(arenaEmptyChallengesScreenshotPath),
      path.basename(arenaEmptyModesScreenshotPath),
      path.basename(arenaLoadingScreenshotPath),
      path.basename(arenaErrorScreenshotPath),
      path.basename(earnEmptyScreenshotPath),
      path.basename(earnPendingSubscribeScreenshotPath),
      path.basename(earnPendingRedeemScreenshotPath),
      path.basename(discoveryEmptyScreenshotPath),
      path.basename(discoverySuccessScreenshotPath),
      path.basename(discoveryLoadingScreenshotPath),
      path.basename(discoveryForbiddenScreenshotPath),
      path.basename(referralEmptyScreenshotPath),
      path.basename(p2pEscrowPaidScreenshotPath),
      path.basename(p2pEscrowForbiddenScreenshotPath),
      path.basename(p2pAdOrderCreatedScreenshotPath),
      path.basename(p2pAdOrderConflictScreenshotPath),
      path.basename(p2pMarkPaidConflictScreenshotPath),
      path.basename(p2pReleaseConflictScreenshotPath),
      path.basename(p2pPendingCreateScreenshotPath),
      path.basename(p2pPendingMarkPaidScreenshotPath),
      path.basename(p2pEscrowPendingScreenshotPath),
      path.basename(p2pEscrowUnauthorizedScreenshotPath),
      path.basename(p2pOrdersLoadingScreenshotPath),
      path.basename(p2pOrdersEmptyScreenshotPath),
      path.basename(p2pMyOrdersAliasScreenshotPath),
      path.basename(p2pOrdersErrorScreenshotPath),
      path.basename(walletUnauthorizedScreenshotPath),
      path.basename(walletForbiddenScreenshotPath),
      path.basename(walletLoadingScreenshotPath),
      path.basename(walletErrorScreenshotPath),
      path.basename(walletSuccessScreenshotPath),
      path.basename(walletEmptyScreenshotPath),
      path.basename(walletPendingTransferScreenshotPath),
      path.basename(walletPendingWithdrawalScreenshotPath),
      path.basename(walletPendingTransactionScreenshotPath),
      path.basename(tradingPendingScreenshotPath),
      path.basename(tradingEmptyOpenOrdersScreenshotPath),
      path.basename(tradingEmptyHistoryScreenshotPath),
      path.basename(tradingEmptyPositionsScreenshotPath),
      path.basename(tradingLoadingOpenOrdersScreenshotPath),
      path.basename(tradingLoadingHistoryScreenshotPath),
      path.basename(tradingLoadingPositionsScreenshotPath),
      path.basename(tradingLoadingPositionsErrorScreenshotPath),
      path.basename(tradingErrorPositionsScreenshotPath),
      path.basename(tradingUnauthorizedLoginScreenshotPath),
      path.basename(predictionsPendingScreenshotPath),
      path.basename(predictionsSuccessEventsScreenshotPath),
      path.basename(predictionsSuccessReceiptScreenshotPath),
      path.basename(predictionsEmptyEventsScreenshotPath),
      path.basename(predictionsEmptyPortfolioScreenshotPath),
      path.basename(predictionsLoadingScreenshotPath),
      path.basename(predictionsErrorScreenshotPath),
      path.basename(predictionsUnauthorizedScreenshotPath),
      path.basename(predictionsForbiddenScreenshotPath),
      path.basename(profileSuccessEditPermissionScreenshotPath),
      path.basename(profileSuccessDevicesScreenshotPath),
      path.basename(profileSuccessActivityScreenshotPath),
      path.basename(profileSuccessSubAccountsScreenshotPath),
      path.basename(profileEmptyDevicesScreenshotPath),
      path.basename(profileEmptyActivityScreenshotPath),
      path.basename(profileEmptySubAccountsScreenshotPath),
      path.basename(profileLoadingProfileScreenshotPath),
      path.basename(profileLoadingDevicesScreenshotPath),
      path.basename(profileLoadingActivityScreenshotPath),
      path.basename(profileLoadingSubAccountsScreenshotPath),
      path.basename(profileErrorProfileScreenshotPath),
      path.basename(profileErrorDevicesScreenshotPath),
      path.basename(profileErrorActivityScreenshotPath),
      path.basename(profileErrorSubAccountsScreenshotPath),
      path.basename(profileUnauthorizedProfileScreenshotPath),
      path.basename(profileUnauthorizedDevicesScreenshotPath),
      path.basename(profileUnauthorizedActivityScreenshotPath),
      path.basename(profileUnauthorizedSubAccountsScreenshotPath),
      path.basename(supportSuccessNewsScreenshotPath),
      path.basename(supportSuccessNotificationsScreenshotPath),
      path.basename(supportSuccessHelpScreenshotPath),
      path.basename(supportSuccessTicketsScreenshotPath),
      path.basename(supportEmptyTicketsScreenshotPath),
      path.basename(supportEmptyCreatedTicketScreenshotPath),
      path.basename(supportLoadingNewsScreenshotPath),
      path.basename(supportLoadingNotificationsScreenshotPath),
      path.basename(supportLoadingHelpScreenshotPath),
      path.basename(supportLoadingTicketsScreenshotPath),
      path.basename(supportErrorNewsScreenshotPath),
      path.basename(supportErrorNotificationsScreenshotPath),
      path.basename(supportErrorHelpScreenshotPath),
      path.basename(supportErrorTicketsScreenshotPath),
    ],
    limits: [
      'Development MSW evidence covers Market overview, screener, and watchlist routes only; not all Market operations, other domains, real backend or staging certification.',
      'Earn empty evidence covers only GET /earn/snapshot and GET /earn/transactions on the savings portfolio/history routes; other Earn operations are not covered by this row.',
      'Discovery empty evidence covers only GET /discovery/search; topic feeds and other domain operations are not covered by this row.',
      'Discovery success evidence covers the populated GET /discovery/search and GET /discovery/topics/crypto operations through the dev service worker; it is fixture evidence, not backend certification.',
      'Discovery loading evidence covers both search and /topics/macro requests after the configured two-second MSW delay; Discovery error evidence covers both operations with HTTP 503 and visible retry actions.',
      'Discovery forbidden evidence covers search/topic HTTP 403 and explicit permission UI. Discovery unauthorized evidence covers both operations returning 401, refresh also returning 401, and redirect to login; all remain local fixture behavior.',
      'Referral evidence covers getReferralOverview success, valid empty overview, two-second loading, 503 retry, 403 permission UI and 401 refresh failure/login redirect in the local MSW preview. The OpenAPI contract declares 401 but not 403; the 403 row is generic authorization-path evidence, not a contract-declared Referral response.',
      'Earn pending evidence covers contract-shaped 201 receipts for subscription/redemption and the fixture pending history row; the contract has no stable receipt-to-history correlation or same-key replay semantics, so reconciliation, unknown and duplicate behavior remain unverified.',
      'Earn pending responses are development MSW evidence only; they do not certify real backend or staging behavior.',
      'P2P success evidence creates one order from /w/p2p/ad/ad001 with a contract-shaped 201 and required Idempotency-Key. P2P pending delays createP2POrder, markP2POrderPaid and releaseP2POrderEscrow in local MSW, confirms each action disables while in flight, and observes getP2POrder after the mark-paid transition. These are client/preview checks only; they do not prove server-side idempotency, replay or real escrow.',
      'P2P duplicate evidence injects local, route-scoped contract-declared HTTP 409 responses for createP2POrder, markP2POrderPaid, and releaseP2POrderEscrow; confirms an Idempotency-Key on each request, visible conflict guidance, refreshed order state and unchanged routes; and observes exactly one request per action for 500 ms. It does not replay a key, prove backend deduplication, or establish same-key replay semantics.',
      'P2P unauthorized evidence covers only the contract-secured getP2POrder read: local MSW returns 401, auth refresh returns 401, and the UI redirects to login without displaying the previous order. It does not certify backend session behavior or all 42 secured P2P operations.',
      'P2P forbidden evidence covers only the OpenAPI-declared 403 from createP2PReleaseChallenge on /w/p2p/escrow/p2p002. The local MSW keeps the order read available, the UI shows a permission-denied message, and no challenge verification or release request follows. This does not verify server-side authorization or other P2P operations.',
      'P2P loading evidence covers only listP2POrders on /w/p2p/order-room: the page shows its loading state during the two-second local delay, then renders a contract-parsed processing order from GET /p2p/orders. It does not certify every order status, route alias or any backend behavior.',
      'P2P empty evidence covers listP2POrders on /w/p2p/order-room and its /w/p2p/my-orders route alias: local MSW returns the contract-valid GET /p2p/orders response {items:[],total:0}, both routes render the true empty-history state, and neither sends an order-list mutation. Other operations/routes and real backend behavior remain unverified.',
      'P2P error evidence covers only listP2POrders on /w/p2p/order-room with a synthetic local MSW HTTP 503: the page shows its recoverable error and Retry triggers another GET that remains on the same route. The OpenAPI operation does not declare this 503 response; this is generic UI failure-path evidence, not backend certification.',
      'Wallet unauthorized evidence covers getWalletAssets and getWalletTransactions on /w/wallet: the OpenAPI operations declare 401, local MSW returns 401 for both plus refresh 401, protected balances do not remain visible after redirect to /auth/login. Other Wallet operations/routes and real backend or staging behavior are not verified.',
      'Wallet forbidden evidence covers only getWalletAssets and getWalletTransactions on /w/wallet: the OpenAPI operations declare 403, local MSW returns 403 for both, the page shows its recoverable load error, stays on the route and sends no session refresh. This does not certify other Wallet operations or backend authorization.',
      'Wallet loading evidence covers getWalletAssets and getWalletTransactions on /w/wallet: the page displays loading with no prior balance while both local MSW requests are pending, then renders their 200 responses. The configured delay is a preview control; this does not verify all 19 Wallet operations or backend performance.',
      'Wallet error evidence covers getWalletAssets and getWalletTransactions on /w/wallet: local MSW injects synthetic HTTP 503 responses. The shared HTTP client retries twice and React Query retries once, producing six observed GET attempts per read; clicking the visible Retry action starts the same bounded cycle. The 503 is not declared for these wallet read operations in OpenAPI; this proves only the generic local UI failure/retry path, not backend behavior.',
      'Predictions success evidence traverses the event list/detail, places one mock market order, reads its receipt, and loads positions, rewards, leaderboard and activity; all eight linked operations are observed through the development service worker. Fixtures do not certify backend execution, user acceptance or staging.',
      'Predictions empty evidence is deliberately limited to the five contract-valid collection reads (events, positions, rewards, leaderboard, activity). Each returns {items:[]} through local MSW and each page shows a specific empty state; event detail, order creation and receipt reads pass through to ordinary fixtures and are not part of this empty scenario.',
      'Predictions error evidence covers only GET /predictions/events on /w/markets/predictions: local MSW produces a transport failure with no HTTP response, and the browser observes six failed GET attempts before ErrorState plus six more after Retry; no mutation or other Prediction operation runs. This exercises the generic client transport-failure path, not a contract response, backend outage or staging behavior.',
      'Predictions unauthorized evidence covers only GET /predictions/events, whose OpenAPI contract declares 401: local MSW returns 401, the session refresh returns 401, and the browser redirects to login without retaining the prior event. This is a local auth-flow check, not backend/staging certification or coverage of the other Prediction operations.',
      'Predictions forbidden evidence exercises the x-required-permissions: [predictions:trade] UI boundary with the Demo persona: GET /predictions/events/pred-1 succeeds from local MSW, the permission message is visible, Mua Yes is disabled, and no placePredictionOrder POST occurs during a 500 ms observation. No HTTP 403 is declared for Prediction operations, so none was fabricated; this does not certify backend authorization.',
      'Profile success evidence is representative: it observes getProfile, listTrustedDevices, listProfileActivity and listSubAccounts via local MSW and verifies the rendered data. The Developer persona lacks the contract-required profile:read permission, which the local MSW does not enforce. Profile edit and trusted-device actions remain disabled because profile:write/profile:security:write are absent; no mutation was sent. Mutation behavior, API authorization, backend persistence and user acceptance remain unverified.',
      'Profile empty evidence covers only the three contract-valid collection reads listTrustedDevices, listProfileActivity and listSubAccounts. Each returns {items:[]} via local MSW; all three pages render explicit empty states and sub-accounts preserves a $0/0-account summary. The Profile object remains populated because its schema requires profile fields. Developer lacks profile:read and local MSW does not enforce that permission; this is representative UI evidence, not API authorization or backend certification.',
      'Support empty evidence returns an empty ticket collection, preserves populated news/notification/help reads, marks one notification read, then creates a ticket and verifies it appears in the same scenario-local list. The page-level read-failure test keeps a failed ticket GET in ErrorState/Retry rather than presenting an empty success. All behavior is local MSW evidence; it does not certify backend authorization, persistence, same-key replay, staging or user acceptance.',
      'Profile error evidence covers only the four Profile GET surfaces, with six local 503 attempts per read before ErrorState and six more after Retry. Profile OpenAPI declares 401 but not 503 for these reads; this is a generic synthetic UI failure path, not a contract response or backend outage. Developer lacks profile:read and local MSW does not enforce it; the three Profile mutations remain untested.',
      'Profile unauthorized evidence covers the four Profile GETs declared with 401: each local service-worker response is followed by one refresh request returning 401 and a redirect to login; prior success-fixture content is not visible after redirect. This exercises the preview expired-session flow only. Developer lacks profile:read and local MSW does not enforce permissions; mutations, backend behavior and staging remain unverified.',
      'Support success evidence traverses /w/news, /w/notifications, /w/support/help, and /w/support with a development-only least-privilege preview persona; Chromium observes all six OpenAPI operations through local MSW, marks one fixture notification as read, creates one local ticket, and observes both list refreshes. The persona scopes UI behavior only because the handlers do not enforce authorization. Backend authorization, persistence, idempotent replay, staging, and user acceptance remain unverified.',
      'Wallet success evidence covers only getWalletAssets and getWalletTransactions on /w/wallet using the Developer preview persona. Contract-shaped 200 responses render the balance and recent activity. The Developer persona has wallet:read but no wallet write permission, so Deposit and Transaction history are visible while Withdraw and Transfer are hidden. This is representative local MSW evidence, not all 19 Wallet operations or backend certification.',
      'Wallet empty evidence covers getWalletAssets and getWalletTransactions on /w/wallet: local MSW returns the normal non-empty balance plus a contract-valid empty transaction list; the UI keeps the available balance visible and renders “No wallet activity yet.” This does not verify the address-book empty state, other Wallet operations or backend behavior.',
      'Wallet pending evidence uses the dedicated local Wallet preview persona and MSW to receive pending createWalletTransfer/createWalletWithdrawal receipts and read the pending withdrawal through getWalletTransaction. The transfer retains its amount/reference and disables same-intent submit; the withdrawal shows both receipt IDs. Challenge, verification and status correlation are fixture behavior, not a guarantee of real backend replay/reconciliation or staging behavior.',
      'Trading pending evidence covers placeOrder, modifyOrder, cancelOrder, listOpenOrders and listOrderHistory through /w/trade/btcusdt. Chromium observed the place, modify and cancel controls disabled while their single Idempotency-Key mutations waited; the normal local MSW handlers returned contract-shaped open, modified-open and cancelled orders, refreshed the open list, and rendered the cancelled order in history. The 2-second delay proves request-in-flight UI behavior only; it is not a server pending status, exchange acceptance, backend idempotency guarantee or staging result.',
    ],
  };

  if (
    errorResponse.status() !== 503 ||
    emptyResponse.status() !== 200 ||
    JSON.stringify(emptyPayload) !== JSON.stringify({ items: [] }) ||
    earnSnapshotResponse.status() !== 200 ||
    JSON.stringify(earnSnapshotPayload) !==
      JSON.stringify({
        products: [],
        positions: [],
        balances: {},
        summary: {
          totalDepositedUsd: 0,
          totalEarnedUsd: 0,
          averageApy: 0,
          activePositions: 0,
        },
      }) ||
    earnTransactionsResponse.status() !== 200 ||
    JSON.stringify(earnTransactionsPayload) !== JSON.stringify({ items: [] }) ||
    earnPendingSubscribeResponse.status() !== 201 ||
    earnPendingSubscribePayload.operation !== 'subscribe' ||
    earnPendingSubscribePayload.status !== 'pending' ||
    !earnPendingSubscribeResponse.fromServiceWorker() ||
    !earnPendingSubscribeResponse.request().headers()['idempotency-key'] ||
    earnPendingRedeemResponse.status() !== 201 ||
    earnPendingRedeemPayload.operation !== 'redeem' ||
    earnPendingRedeemPayload.status !== 'pending' ||
    !earnPendingRedeemResponse.fromServiceWorker() ||
    !earnPendingRedeemResponse.request().headers()['idempotency-key'] ||
    earnPendingHistoryResponse.status() !== 200 ||
    !earnPendingHistoryResponse.fromServiceWorker() ||
    !earnPendingHistoryPayload.items.some(
      (item) => item.id === 'earn-tx-savings-002' && item.status === 'pending',
    ) ||
    discoverySearchResponse.status() !== 200 ||
    discoverySuccessSearchResponse.status() !== 200 ||
    discoveryTopicResponse.status() !== 200 ||
    discoveryLoadingSearchResponse.status() !== 200 ||
    discoveryLoadingTopicResponse.status() !== 200 ||
    discoveryErrorSearchResponse.status() !== 503 ||
    discoveryErrorTopicResponse.status() !== 503 ||
    discoveryForbiddenSearchResponse.status() !== 403 ||
    discoveryForbiddenTopicResponse.status() !== 403 ||
    discoveryUnauthorizedTopicResponse.status() !== 401 ||
    discoveryUnauthorizedTopicRefresh.status() !== 401 ||
    discoveryUnauthorizedSearchResponse.status() !== 401 ||
    discoveryUnauthorizedSearchRefresh.status() !== 401 ||
    referralLoadingResponse.status() !== 200 ||
    referralSuccessResponse.status() !== 200 ||
    referralEmptyResponse.status() !== 200 ||
    referralEmptyPayload.referralCode !== 'PREVIEW-EMPTY' ||
    referralEmptyPayload.stats.totalFriends !== 0 ||
    referralEmptyPayload.friends.length !== 0 ||
    referralErrorResponse.status() !== 503 ||
    referralForbiddenResponse.status() !== 403 ||
    referralUnauthorizedResponse.status() !== 401 ||
    referralUnauthorizedRefresh.status() !== 401 ||
    p2pOrderResponse.status() !== 200 ||
    !p2pOrderResponse.fromServiceWorker() ||
    p2pOrderPayload.status !== 'paid' ||
    p2pChallengeResponse.status() !== 201 ||
    p2pVerificationResponse.status() !== 200 ||
    p2pReleaseResponse.status() !== 200 ||
    !p2pReleaseResponse.fromServiceWorker() ||
    p2pReleasePayload.status !== 'released' ||
    !p2pReleaseIdempotencyKey ||
    !p2pReleaseButtonDisabled ||
    p2pDuplicateReleaseChallengeResponse.status() !== 201 ||
    p2pDuplicateReleaseVerificationResponse.status() !== 200 ||
    p2pReleaseConflictResponse.status() !== 409 ||
    !p2pReleaseConflictResponse.fromServiceWorker() ||
    p2pReleaseConflictPayload.code !== 'P2P_ORDER_CONFLICT' ||
    !/^p2p-escrow-release-p2p002-/.test(p2pReleaseConflictIdempotencyKey) ||
    p2pReleaseConflictOrderRefreshResponse.status() !== 200 ||
    !p2pReleaseConflictOrderRefreshResponse.fromServiceWorker() ||
    p2pReleaseConflictOrderRefreshPayload.status !== 'paid' ||
    p2pReleaseConflictRequests.length !== 1 ||
    p2pReleaseConflictOrderRefreshRequests.length < 1 ||
    p2pReleaseConflictRoute !== '/w/p2p/escrow/p2p002' ||
    !p2pReleaseConflictMessage.includes('HTTP 409') ||
    p2pPendingCreateResponse.status() !== 201 ||
    !p2pPendingCreateResponse.fromServiceWorker() ||
    p2pPendingCreateReceipt.status !== 'created' ||
    !p2pPendingCreateIdempotencyKey ||
    !p2pPendingCreateButtonDisabled ||
    p2pPendingMarkPaidResponse.status() !== 200 ||
    !p2pPendingMarkPaidResponse.fromServiceWorker() ||
    p2pPendingMarkPaidOrder.status !== 'paid' ||
    !p2pPendingMarkPaidIdempotencyKey ||
    !p2pPendingMarkPaidButtonDisabled ||
    !p2pPendingCreatedOrderId ||
    p2pReleaseChallengeForbiddenResponse.status() !== 403 ||
    !p2pReleaseChallengeForbiddenResponse.fromServiceWorker() ||
    p2pReleaseChallengeForbiddenResponse.request().method() !== 'POST' ||
    !p2pReleaseChallengeForbiddenMessage.includes('Không có quyền') ||
    p2pReleaseChallengeForbiddenVerificationRequests.length !== 0 ||
    p2pReleaseChallengeForbiddenReleaseRequests.length !== 0 ||
    p2pReleaseChallengeForbiddenRoute !== '/w/p2p/escrow/p2p002' ||
    p2pUnauthorizedOrderResponse.status() !== 401 ||
    !p2pUnauthorizedOrderResponse.fromServiceWorker() ||
    p2pUnauthorizedRefreshResponse.status() !== 401 ||
    !p2pUnauthorizedRefreshResponse.fromServiceWorker() ||
    !p2pUnauthorizedLoginRoute.endsWith('/auth/login') ||
    staleP2POrderVisible ||
    p2pOrdersResponse.status() !== 200 ||
    !p2pOrdersResponse.fromServiceWorker() ||
    !p2pOrdersLoadingStateVisible ||
    p2pOrdersEmptyResponse.status() !== 200 ||
    !p2pOrdersEmptyResponse.fromServiceWorker() ||
    p2pOrdersEmptyResponse.request().method() !== 'GET' ||
    JSON.stringify(p2pOrdersEmptyPayload) !== JSON.stringify({ items: [], total: 0 }) ||
    p2pOrdersEmptyMutationRequests.length !== 0 ||
    p2pOrdersEmptyRoute !== '/w/p2p/order-room' ||
    p2pMyOrdersAliasResponse.status() !== 200 ||
    !p2pMyOrdersAliasResponse.fromServiceWorker() ||
    p2pMyOrdersAliasResponse.request().method() !== 'GET' ||
    JSON.stringify(p2pMyOrdersAliasPayload) !== JSON.stringify({ items: [], total: 0 }) ||
    p2pMyOrdersAliasMutationRequests.length !== 0 ||
    p2pMyOrdersAliasRoute !== '/w/p2p/my-orders' ||
    p2pOrdersInitialErrorResponse.status() !== 503 ||
    !p2pOrdersInitialErrorResponse.fromServiceWorker() ||
    p2pOrdersRetryResponse.status() !== 503 ||
    !p2pOrdersRetryResponse.fromServiceWorker() ||
    p2pOrdersRetryRoute !== '/w/p2p/order-room' ||
    walletAssetsResponse.status() !== 401 ||
    !walletAssetsResponse.fromServiceWorker() ||
    walletAssetsResponse.request().method() !== 'GET' ||
    walletAssetsError.code !== 'PREVIEW_UNAUTHORIZED' ||
    walletTransactionsResponse.status() !== 401 ||
    !walletTransactionsResponse.fromServiceWorker() ||
    walletTransactionsResponse.request().method() !== 'GET' ||
    walletTransactionsError.code !== 'PREVIEW_UNAUTHORIZED' ||
    walletUnauthorizedRefreshResponse.status() !== 401 ||
    !walletUnauthorizedRefreshResponse.fromServiceWorker() ||
    walletUnauthorizedRefreshError.code !== 'SESSION_EXPIRED' ||
    !walletUnauthorizedLoginRoute.endsWith('/auth/login') ||
    walletStaleBalanceVisible ||
    walletForbiddenAssetsResponse.status() !== 403 ||
    !walletForbiddenAssetsResponse.fromServiceWorker() ||
    walletForbiddenAssetsResponse.request().method() !== 'GET' ||
    walletForbiddenAssetsError.code !== 'PREVIEW_FORBIDDEN' ||
    walletForbiddenTransactionsResponse.status() !== 403 ||
    !walletForbiddenTransactionsResponse.fromServiceWorker() ||
    walletForbiddenTransactionsResponse.request().method() !== 'GET' ||
    walletForbiddenTransactionsError.code !== 'PREVIEW_FORBIDDEN' ||
    walletForbiddenRefreshRequests.length !== 0 ||
    walletForbiddenRoute !== '/w/wallet' ||
    !walletForbiddenErrorVisible ||
    walletForbiddenBalanceVisible ||
    walletLoadingAssetsResponse.status() !== 200 ||
    !walletLoadingAssetsResponse.fromServiceWorker() ||
    walletLoadingAssetsResponse.request().method() !== 'GET' ||
    walletLoadingTransactionsResponse.status() !== 200 ||
    !walletLoadingTransactionsResponse.fromServiceWorker() ||
    walletLoadingTransactionsResponse.request().method() !== 'GET' ||
    walletLoadingElapsedMs < 1_800 ||
    walletLoadingRoute !== '/w/wallet' ||
    !walletLoadingVisibleBeforeResponses ||
    !walletStillLoadingBeforeResponses ||
    walletLoadingResponseCountBeforeResponses !== 0 ||
    walletLoadingResponses.length !== 2 ||
    walletLoadingVisibleAfterResponses ||
    walletLoadingBalanceVisibleBeforeResponses ||
    !walletLoadingBalanceVisibleAfterResponses ||
    walletLoadingFalseEmptyStateVisible ||
    walletLoadingErrorVisibleAfterResponses ||
    walletLoadingAssetsPayload.summary.totalUsd !== 16_754.32 ||
    !Array.isArray(walletLoadingTransactionsPayload.items) ||
    walletErrorInitialResponses.length !== 12 ||
    countWalletErrorResponses(walletErrorInitialResponses, '/api/wallet/assets') !== 6 ||
    countWalletErrorResponses(walletErrorInitialResponses, '/api/wallet/transactions') !== 6 ||
    walletErrorInitialResponses.some(
      (response) => response.status !== 503 || !response.fromServiceWorker,
    ) ||
    walletErrorRetryResponses.length !== 12 ||
    countWalletErrorResponses(walletErrorRetryResponses, '/api/wallet/assets') !== 6 ||
    countWalletErrorResponses(walletErrorRetryResponses, '/api/wallet/transactions') !== 6 ||
    walletErrorRetryResponses.some(
      (response) => response.status !== 503 || !response.fromServiceWorker,
    ) ||
    walletErrorRequests.length !== 24 ||
    walletErrorRetryResponseCountBefore !== 12 ||
    walletErrorRefreshRequests.length !== 0 ||
    !walletErrorInitialErrorVisible ||
    !walletErrorVisibleDuringRetry ||
    !walletErrorRetryActionVisible ||
    !walletErrorRetryErrorVisible ||
    !walletErrorRetryActionStillVisible ||
    walletErrorStaleBalanceVisibleBeforeRetry ||
    walletErrorStaleBalanceVisibleAfterRetry ||
    walletErrorSummaryVisibleBeforeRetry ||
    walletErrorSummaryVisibleAfterRetry ||
    walletErrorRouteBeforeRetry !== '/w/wallet' ||
    walletErrorRouteAfterRetry !== '/w/wallet' ||
    walletSuccessAssetsResponse.status() !== 200 ||
    !walletSuccessAssetsResponse.fromServiceWorker() ||
    walletSuccessAssetsResponse.request().method() !== 'GET' ||
    walletSuccessTransactionsResponse.status() !== 200 ||
    !walletSuccessTransactionsResponse.fromServiceWorker() ||
    walletSuccessTransactionsResponse.request().method() !== 'GET' ||
    walletSuccessAssetsPayload.summary.totalUsd !== 16_754.32 ||
    !Array.isArray(walletSuccessTransactionsPayload.items) ||
    walletSuccessTransactionsPayload.items.length !== 6 ||
    walletSuccessRoute !== '/w/wallet' ||
    !walletSuccessTotalBalanceVisible ||
    !walletSuccessRecentActivityVisible ||
    !walletSuccessDepositActionVisible ||
    !walletSuccessHistoryActionVisible ||
    walletSuccessWithdrawActionVisible ||
    walletSuccessTransferActionVisible ||
    walletSuccessErrorVisible ||
    walletEmptyAssetsResponse.status() !== 200 ||
    !walletEmptyAssetsResponse.fromServiceWorker() ||
    walletEmptyAssetsResponse.request().method() !== 'GET' ||
    walletEmptyTransactionsResponse.status() !== 200 ||
    !walletEmptyTransactionsResponse.fromServiceWorker() ||
    walletEmptyTransactionsResponse.request().method() !== 'GET' ||
    walletEmptyAssetsPayload.summary.totalUsd !== 16_754.32 ||
    walletEmptyAssetsPayload.summary.availableUsd !== 16_754.32 ||
    walletEmptyAssetsPayload.items.length === 0 ||
    JSON.stringify(walletEmptyTransactionsPayload) !== JSON.stringify({ items: [], total: 0 }) ||
    walletEmptyRoute !== '/w/wallet' ||
    !walletEmptyBalanceVisible ||
    !walletEmptyActivityVisible ||
    walletEmptyFalseAssetEmptyVisible ||
    walletEmptyErrorVisible ||
    walletPendingTransferResponse.status() !== 201 ||
    !walletPendingTransferResponse.fromServiceWorker() ||
    walletPendingTransferResponse.request().method() !== 'POST' ||
    walletPendingTransferPayload.status !== 'pending' ||
    !walletPendingTransferReference ||
    walletPendingRoute !== '/w/wallet/transfer' ||
    walletPendingTransferAmount !== '12.5' ||
    !walletPendingTransferButtonDisabled ||
    walletPendingTransferRequestCount !== 1 ||
    walletPendingChallengeResponse.status() !== 201 ||
    !walletPendingChallengeResponse.fromServiceWorker() ||
    walletPendingVerificationResponse.status() !== 200 ||
    !walletPendingVerificationResponse.fromServiceWorker() ||
    walletPendingWithdrawalResponse.status() !== 201 ||
    !walletPendingWithdrawalResponse.fromServiceWorker() ||
    walletPendingWithdrawalPayload.status !== 'pending' ||
    !walletPendingWithdrawalReference ||
    !walletPendingTransactionId ||
    walletPendingWithdrawalRoute !== '/w/wallet/withdraw/USDT' ||
    !walletPendingWithdrawalStatusVisible ||
    walletPendingTransactionResponse.status() !== 200 ||
    !walletPendingTransactionResponse.fromServiceWorker() ||
    walletPendingTransactionResponse.request().method() !== 'GET' ||
    walletPendingTransactionPayload.id !== walletPendingTransactionId ||
    walletPendingTransactionPayload.status !== 'pending' ||
    walletPendingTransactionRoute !== `/w/wallet/transaction/${walletPendingTransactionId}` ||
    !walletPendingTransactionStatusVisible ||
    predictionsPendingEventResponse.status() !== 200 ||
    !predictionsPendingEventResponse.fromServiceWorker() ||
    predictionsPendingRequest.method() !== 'POST' ||
    predictionsPendingResponse.status() !== 201 ||
    !predictionsPendingResponse.fromServiceWorker() ||
    predictionsPendingResponseElapsedMs < 1_900 ||
    !predictionsPendingResponseStillWaiting ||
    !predictionsPendingSubmitDisabled ||
    predictionsPendingOperationRequestCounts.placePredictionOrder !== 1 ||
    predictionsPendingRequest.headers()['idempotency-key']?.length < 8 ||
    !predictionsPendingReceipt.id ||
    predictionsPendingReceiptResponse.status() !== 200 ||
    !predictionsPendingReceiptResponse.fromServiceWorker() ||
    predictionsPendingReceiptPayload.id !== predictionsPendingReceipt.id ||
    predictionsPendingReceiptPayload.status !== 'filled' ||
    predictionsPendingOperationRequestCounts.getPredictionOrderReceipt !== 1 ||
    predictionsPendingReceiptRoute !==
      `/w/markets/predictions/receipt/${predictionsPendingReceipt.id}` ||
    predictionsSuccessEventsResponse.status() !== 200 ||
    !predictionsSuccessEventsResponse.fromServiceWorker() ||
    !predictionsSuccessEvent ||
    predictionsSuccessEventResponse.status() !== 200 ||
    !predictionsSuccessEventResponse.fromServiceWorker() ||
    !predictionsSuccessEventVisible ||
    predictionsSuccessOrderRequest.method() !== 'POST' ||
    predictionsSuccessOrderResponse.status() !== 201 ||
    !predictionsSuccessOrderResponse.fromServiceWorker() ||
    predictionsSuccessOrderRequest.headers()['idempotency-key']?.length < 8 ||
    predictionsSuccessOrderRequest.postDataJSON().eventId !== 'pred-1' ||
    predictionsSuccessOrderRequest.postDataJSON().outcome !== 'Yes' ||
    !predictionsSuccessOrderPayload.id ||
    predictionsSuccessOrderPayload.status !== 'filled' ||
    predictionsSuccessReceiptResponse.status() !== 200 ||
    !predictionsSuccessReceiptResponse.fromServiceWorker() ||
    predictionsSuccessReceiptPayload.id !== predictionsSuccessOrderPayload.id ||
    predictionsSuccessReceiptPayload.status !== 'filled' ||
    predictionsSuccessReceiptRoute !==
      `/w/markets/predictions/receipt/${predictionsSuccessOrderPayload.id}` ||
    !predictionsSuccessReceiptStatusVisible ||
    predictionsSuccessPositionsResponse.status() !== 200 ||
    !predictionsSuccessPositionsResponse.fromServiceWorker() ||
    !predictionsSuccessPositionVisible ||
    predictionsSuccessRewardsResponse.status() !== 200 ||
    !predictionsSuccessRewardsResponse.fromServiceWorker() ||
    !predictionsSuccessRewardVisible ||
    predictionsSuccessLeaderboardResponse.status() !== 200 ||
    !predictionsSuccessLeaderboardResponse.fromServiceWorker() ||
    !predictionsSuccessLeaderboardVisible ||
    predictionsSuccessActivityResponse.status() !== 200 ||
    !predictionsSuccessActivityResponse.fromServiceWorker() ||
    !predictionsSuccessActivityVisible ||
    predictionsSuccessOperationIds.length !== 8 ||
    Object.values(predictionsSuccessOperationRequestCounts).some((count) => count !== 1) ||
    predictionsEmptyEventsResponse.status() !== 200 ||
    !predictionsEmptyEventsResponse.fromServiceWorker() ||
    predictionsEmptyEventsPayload.items.length !== 0 ||
    !predictionsEmptyEventsVisible ||
    predictionsEmptyPositionsResponse.status() !== 200 ||
    !predictionsEmptyPositionsResponse.fromServiceWorker() ||
    predictionsEmptyPositionsPayload.items.length !== 0 ||
    !predictionsEmptyPositionsVisible ||
    predictionsEmptyRewardsResponse.status() !== 200 ||
    !predictionsEmptyRewardsResponse.fromServiceWorker() ||
    predictionsEmptyRewardsPayload.items.length !== 0 ||
    !predictionsEmptyRewardsVisible ||
    predictionsEmptyLeaderboardResponse.status() !== 200 ||
    !predictionsEmptyLeaderboardResponse.fromServiceWorker() ||
    predictionsEmptyLeaderboardPayload.items.length !== 0 ||
    !predictionsEmptyLeaderboardVisible ||
    predictionsEmptyActivityResponse.status() !== 200 ||
    !predictionsEmptyActivityResponse.fromServiceWorker() ||
    predictionsEmptyActivityPayload.items.length !== 0 ||
    !predictionsEmptyActivityVisible ||
    predictionsEmptyOperationIds.length !== 5 ||
    Object.values(predictionsEmptyOperationRequestCounts).some((count) => count !== 1) ||
    predictionsEmptyUnexpectedPredictionRequestCount !== 0 ||
    predictionsLoadingOperationIds.length !== 7 ||
    predictionsLoadingOperationRequestCounts.placePredictionOrder !== 0 ||
    Object.entries(predictionsLoadingOperationRequestCounts)
      .filter(([operationId]) => operationId !== 'placePredictionOrder')
      .some(([, requestCount]) => requestCount !== 1) ||
    predictionsLoadingUnexpectedPredictionRequestCount !== 0 ||
    predictionsLoadingRouteResults.length !== 7 ||
    predictionsLoadingRouteResults.some(
      (result) =>
        result.status !== 200 ||
        !result.fromServiceWorker ||
        result.elapsedMs < 1_900 ||
        !result.loadingVisibleWhilePending ||
        !result.finalContentVisible,
    ) ||
    predictionsErrorOperationIds.length !== 1 ||
    predictionsErrorOperationIds[0] !== 'listPredictionEvents' ||
    predictionsErrorOperationRequestCounts.listPredictionEvents !== 12 ||
    predictionsErrorInitialFailureCount !== 6 ||
    predictionsErrorFailures.length !== 12 ||
    predictionsErrorFailures.some((item) => !item.failure) ||
    predictionsErrorResponses.length !== 0 ||
    predictionsErrorUnexpectedPredictionRequestCount !== 0 ||
    predictionsErrorVisibleErrorState !== true ||
    predictionsErrorVisibleRetryAction !== true ||
    predictionsErrorRouteAfterRetry !== '/w/markets/predictions' ||
    predictionsErrorVisibleEventCount !== 0 ||
    predictionsUnauthorizedOperationIds.length !== 1 ||
    predictionsUnauthorizedOperationIds[0] !== 'listPredictionEvents' ||
    predictionsUnauthorizedEventRequestCounts.listPredictionEvents !== 1 ||
    predictionsUnauthorizedEventRequestCounts.refreshSession !== 1 ||
    predictionsUnauthorizedRefreshResponseCount !== 1 ||
    predictionsUnauthorizedRefreshResponses.some(
      (response) => response.status !== 401 || !response.fromServiceWorker,
    ) ||
    predictionsUnauthorizedUnexpectedPredictionRequestCount !== 0 ||
    predictionsUnauthorizedEventResponse.status() !== 401 ||
    !predictionsUnauthorizedEventResponse.fromServiceWorker() ||
    predictionsUnauthorizedRefreshResponse.status() !== 401 ||
    !predictionsUnauthorizedRefreshResponse.fromServiceWorker() ||
    !predictionsUnauthorizedLoginRoute.endsWith('/auth/login') ||
    predictionsUnauthorizedVisibleStaleEventCount !== 0 ||
    predictionsForbiddenOperationIds.length !== 1 ||
    predictionsForbiddenOperationIds[0] !== 'getPredictionEvent' ||
    predictionsForbiddenOperationRequestCounts.getPredictionEvent !== 1 ||
    predictionsForbiddenOrderRequestCount !== 0 ||
    predictionsForbiddenUnexpectedPredictionRequestCount !== 0 ||
    predictionsForbiddenEventResponse.status() !== 200 ||
    !predictionsForbiddenEventResponse.fromServiceWorker() ||
    !predictionsForbiddenPermissionMessageVisible ||
    !predictionsForbiddenBuyButtonDisabled ||
    predictionsForbiddenRoute !== '/w/markets/predictions/event/pred-1' ||
    JSON.stringify(profileSuccessOperationIds) !==
      JSON.stringify([
        'getProfile',
        'listTrustedDevices',
        'listProfileActivity',
        'listSubAccounts',
      ]) ||
    profileSuccessOperationRequestCounts.getProfile !== 1 ||
    profileSuccessOperationRequestCounts.listTrustedDevices !== 1 ||
    profileSuccessOperationRequestCounts.listProfileActivity !== 1 ||
    profileSuccessOperationRequestCounts.listSubAccounts !== 1 ||
    profileSuccessOperationRequestCounts.updateProfile !== 0 ||
    profileSuccessOperationRequestCounts.setDeviceTrust !== 0 ||
    profileSuccessOperationRequestCounts.revokeDevice !== 0 ||
    profileSuccessResponses.some(
      (response) =>
        !response.fromServiceWorker ||
        response.status !==
          {
            getProfile: 200,
            listTrustedDevices: 200,
            listProfileActivity: 200,
            listSubAccounts: 200,
          }[response.operationId],
    ) ||
    profileSuccessUnexpectedRequestCount !== 0 ||
    profileSuccessInitialReadResponse.status() !== 200 ||
    !profileSuccessInitialReadResponse.fromServiceWorker() ||
    profileSuccessDeviceListResponse.status() !== 200 ||
    !profileSuccessDeviceListResponse.fromServiceWorker() ||
    profileSuccessActivityResponse.status() !== 200 ||
    !profileSuccessActivityResponse.fromServiceWorker() ||
    profileSuccessSubAccountsResponse.status() !== 200 ||
    !profileSuccessSubAccountsResponse.fromServiceWorker() ||
    !profileSuccessEditDisabled ||
    !profileSuccessEditPermissionMessageVisible ||
    !profileSuccessTrustDisabled ||
    !profileSuccessRevokeDisabled ||
    !profileSuccessSecurityPermissionMessageVisible ||
    !profileSuccessActivityVisible ||
    !profileSuccessSubAccountVisible ||
    profileSuccessFinalRoute !== '/w/profile/sub-accounts' ||
    JSON.stringify(profileEmptyOperationIds) !==
      JSON.stringify(['listTrustedDevices', 'listProfileActivity', 'listSubAccounts']) ||
    Object.values(profileEmptyOperationRequestCounts).some((count) => count !== 1) ||
    profileEmptyResponses.length !== 3 ||
    profileEmptyResponses.some(
      (response) => response.status !== 200 || !response.fromServiceWorker,
    ) ||
    profileEmptyUnexpectedRequestCount !== 0 ||
    JSON.stringify(profileEmptyDevicesPayload) !== JSON.stringify({ items: [] }) ||
    JSON.stringify(profileEmptyActivityPayload) !== JSON.stringify({ items: [] }) ||
    JSON.stringify(profileEmptySubAccountsPayload) !== JSON.stringify({ items: [] }) ||
    profileEmptyDeviceListResponse.status() !== 200 ||
    !profileEmptyDeviceListResponse.fromServiceWorker() ||
    profileEmptyActivityResponse.status() !== 200 ||
    !profileEmptyActivityResponse.fromServiceWorker() ||
    profileEmptySubAccountsResponse.status() !== 200 ||
    !profileEmptySubAccountsResponse.fromServiceWorker() ||
    !profileEmptyDevicesVisible ||
    !profileEmptyActivityVisible ||
    !profileEmptySubAccountsVisible ||
    !profileEmptySubAccountCountVisible ||
    profileEmptyFinalRoute !== '/w/profile/activity' ||
    JSON.stringify(profileLoadingOperationIds) !==
      JSON.stringify([
        'getProfile',
        'listTrustedDevices',
        'listProfileActivity',
        'listSubAccounts',
      ]) ||
    profileLoadingOperationRequestCounts.getProfile !== 1 ||
    profileLoadingOperationRequestCounts.listTrustedDevices !== 1 ||
    profileLoadingOperationRequestCounts.listProfileActivity !== 1 ||
    profileLoadingOperationRequestCounts.listSubAccounts !== 1 ||
    profileLoadingOperationRequestCounts.updateProfile !== 0 ||
    profileLoadingOperationRequestCounts.revokeDevice !== 0 ||
    profileLoadingOperationRequestCounts.setDeviceTrust !== 0 ||
    profileLoadingUnexpectedRequestCount !== 0 ||
    profileLoadingResponses.length !== 4 ||
    profileLoadingResponses.some(
      (response) => response.status !== 200 || !response.fromServiceWorker,
    ) ||
    profileLoadingReads.length !== 4 ||
    profileLoadingReads.some(
      (read) =>
        !read.loadingVisible ||
        read.status !== 200 ||
        !read.fromServiceWorker ||
        read.responseElapsedMs < 1_900,
    ) ||
    profileLoadingFinalRoute !== '/w/profile/sub-accounts' ||
    JSON.stringify(profileErrorOperationIds) !==
      JSON.stringify([
        'getProfile',
        'listTrustedDevices',
        'listProfileActivity',
        'listSubAccounts',
      ]) ||
    profileErrorOperationRequestCounts.getProfile !== 12 ||
    profileErrorOperationRequestCounts.listTrustedDevices !== 12 ||
    profileErrorOperationRequestCounts.listProfileActivity !== 12 ||
    profileErrorOperationRequestCounts.listSubAccounts !== 12 ||
    profileErrorOperationRequestCounts.updateProfile !== 0 ||
    profileErrorOperationRequestCounts.revokeDevice !== 0 ||
    profileErrorOperationRequestCounts.setDeviceTrust !== 0 ||
    profileErrorUnexpectedRequestCount !== 0 ||
    profileErrorResponses.length !== 48 ||
    profileErrorResponses.some(
      (response) => response.status !== 503 || !response.fromServiceWorker,
    ) ||
    profileErrorReads.length !== 4 ||
    profileErrorReads.some(
      (read) =>
        read.initialRequestCount !== 6 ||
        read.initialResponseCount !== 6 ||
        read.retryRequestCount !== 6 ||
        read.retryResponseCount !== 6 ||
        read.responseStatuses.length !== 12 ||
        read.responseStatuses.some((status) => status !== 503) ||
        !read.responsesFromServiceWorker ||
        !read.errorVisible ||
        !read.retryVisible ||
        read.successContentVisibleAfterError ||
        read.routeAfterRetry !== read.route,
    ) ||
    profileErrorFinalRoute !== '/w/profile/sub-accounts' ||
    JSON.stringify(profileUnauthorizedOperationIds) !==
      JSON.stringify([
        'getProfile',
        'listTrustedDevices',
        'listProfileActivity',
        'listSubAccounts',
      ]) ||
    profileUnauthorizedOperationRequestCounts.getProfile !== 1 ||
    profileUnauthorizedOperationRequestCounts.listTrustedDevices !== 1 ||
    profileUnauthorizedOperationRequestCounts.listProfileActivity !== 1 ||
    profileUnauthorizedOperationRequestCounts.listSubAccounts !== 1 ||
    profileUnauthorizedOperationRequestCounts.updateProfile !== 0 ||
    profileUnauthorizedOperationRequestCounts.revokeDevice !== 0 ||
    profileUnauthorizedOperationRequestCounts.setDeviceTrust !== 0 ||
    profileUnauthorizedUnexpectedRequestCount !== 0 ||
    profileUnauthorizedResponses.length !== 4 ||
    profileUnauthorizedResponses.some(
      (response) => response.status !== 401 || !response.fromServiceWorker,
    ) ||
    profileUnauthorizedRefreshRequests.length !== 4 ||
    profileUnauthorizedRefreshResponses.length !== 4 ||
    profileUnauthorizedRefreshResponses.some(
      (response) => response.status !== 401 || !response.fromServiceWorker,
    ) ||
    profileUnauthorizedReads.length !== 4 ||
    profileUnauthorizedReads.some(
      (read) =>
        read.readRequestCount !== 1 ||
        read.readResponseCount !== 1 ||
        JSON.stringify(read.readStatuses) !== JSON.stringify([401]) ||
        !read.readResponsesFromServiceWorker ||
        read.refreshRequestCount !== 1 ||
        read.refreshResponseCount !== 1 ||
        JSON.stringify(read.refreshStatuses) !== JSON.stringify([401]) ||
        !read.refreshResponsesFromServiceWorker ||
        !read.redirectedToLogin ||
        read.staleSuccessContentVisible,
    ) ||
    !profileUnauthorizedFinalRoute.endsWith('/auth/login') ||
    tradingPendingResponse.status() !== 201 ||
    !tradingPendingResponse.fromServiceWorker() ||
    tradingPendingRequest.method() !== 'POST' ||
    tradingPendingOrder.status !== 'open' ||
    !tradingPendingOrder.id ||
    tradingPendingResponseElapsedMs < 1_900 ||
    !tradingPendingResponseStillWaiting ||
    !tradingPendingSubmitDisabled ||
    tradingPendingOperationRequestCounts.placeOrder !== 1 ||
    tradingPendingRequest.headers()['idempotency-key']?.length < 8 ||
    tradingPendingReceiptRoute !== '/w/trade/order-receipt' ||
    tradingPendingOpenOrdersResponse.status() !== 200 ||
    !tradingPendingOpenOrdersResponse.fromServiceWorker() ||
    tradingPendingInitialHistoryResponse.status() !== 200 ||
    !tradingPendingInitialHistoryResponse.fromServiceWorker() ||
    tradingPendingModifyRequest.method() !== 'PATCH' ||
    tradingPendingModifyResponse.status() !== 200 ||
    !tradingPendingModifyResponse.fromServiceWorker() ||
    tradingPendingModifiedOrder.id !== tradingPendingOrder.id ||
    tradingPendingModifiedOrder.price !== 65_100 ||
    tradingPendingModifiedOrder.status !== 'open' ||
    tradingPendingModifyResponseElapsedMs < 1_900 ||
    !tradingPendingModifyResponseStillWaiting ||
    !tradingPendingModifyDisabledWhileInFlight ||
    tradingPendingModifyRequest.headers()['idempotency-key']?.length < 8 ||
    tradingPendingModifyOpenOrdersResponse.status() !== 200 ||
    !tradingPendingModifyOpenOrdersResponse.fromServiceWorker() ||
    !tradingPendingModifiedOrderInOpenOrders ||
    tradingPendingOperationRequestCounts.modifyOrder !== 1 ||
    tradingPendingCancelRequest.method() !== 'POST' ||
    tradingPendingCancelResponse.status() !== 200 ||
    !tradingPendingCancelResponse.fromServiceWorker() ||
    tradingPendingCancelledOrder.id !== tradingPendingOrder.id ||
    tradingPendingCancelledOrder.status !== 'cancelled' ||
    tradingPendingCancelResponseElapsedMs < 1_900 ||
    !tradingPendingCancelResponseStillWaiting ||
    !tradingPendingCancelDisabledWhileInFlight ||
    tradingPendingCancelRequest.headers()['idempotency-key']?.length < 8 ||
    tradingPendingOperationRequestCounts.cancelOrder !== 1 ||
    tradingPendingCancelHistoryResponse.status() !== 200 ||
    !tradingPendingCancelHistoryResponse.fromServiceWorker() ||
    !tradingPendingHistoryPayload.items.some(
      (order) => order.id === tradingPendingOrder.id && order.status === 'cancelled',
    ) ||
    !tradingPendingHistoryCancelledOrderVisible ||
    tradingPendingOperationRequestCounts.listOpenOrders < 1 ||
    tradingPendingOperationRequestCounts.listOrderHistory < 1 ||
    JSON.stringify(discoverySearchPayload) !==
      JSON.stringify({
        query: 'zz',
        predictions: [],
        arenaModes: [],
        arenaRooms: [],
        creators: [],
        tradingPairs: [],
      }) ||
    !earnSnapshotResponse.fromServiceWorker() ||
    !earnTransactionsResponse.fromServiceWorker() ||
    !discoverySearchResponse.fromServiceWorker() ||
    !discoverySuccessSearchResponse.fromServiceWorker() ||
    !discoveryTopicResponse.fromServiceWorker() ||
    !discoveryLoadingSearchResponse.fromServiceWorker() ||
    !discoveryLoadingTopicResponse.fromServiceWorker() ||
    !discoveryErrorSearchResponse.fromServiceWorker() ||
    !discoveryErrorTopicResponse.fromServiceWorker() ||
    !discoveryForbiddenSearchResponse.fromServiceWorker() ||
    !discoveryForbiddenTopicResponse.fromServiceWorker() ||
    !discoveryUnauthorizedTopicResponse.fromServiceWorker() ||
    !discoveryUnauthorizedSearchResponse.fromServiceWorker() ||
    !referralLoadingResponse.fromServiceWorker() ||
    !referralSuccessResponse.fromServiceWorker() ||
    !referralEmptyResponse.fromServiceWorker() ||
    !referralErrorResponse.fromServiceWorker() ||
    !referralForbiddenResponse.fromServiceWorker() ||
    !referralUnauthorizedResponse.fromServiceWorker() ||
    !emptyResponse.fromServiceWorker() ||
    loadingResponse.status() !== 200 ||
    successResponse.status() !== 200 ||
    resetResponse.status() !== 200 ||
    forbiddenWatchlistResponse.status() !== 403 ||
    publicPairsForbiddenResponse.status() !== 200 ||
    unauthorizedWatchlistResponse.status() !== 401 ||
    unauthorizedRefreshResponse.status() !== 401 ||
    !forbiddenWatchlistResponse.fromServiceWorker() ||
    !publicPairsForbiddenResponse.fromServiceWorker() ||
    !unauthorizedWatchlistResponse.fromServiceWorker() ||
    !unauthorizedRefreshResponse.fromServiceWorker() ||
    !marketUnauthorizedLoginRoute.endsWith('/auth/login') ||
    !discoveryUnauthorizedTopicLoginRoute.endsWith('/auth/login') ||
    !discoveryUnauthorizedSearchLoginRoute.endsWith('/auth/login') ||
    !referralUnauthorizedLoginRoute.endsWith('/auth/login') ||
    !loadingResponse.fromServiceWorker() ||
    !errorResponse.fromServiceWorker() ||
    !successResponse.fromServiceWorker() ||
    !resetResponse.fromServiceWorker() ||
    externalApiOrigins.size > 0
  ) {
    throw new Error(`Preview scenario browser check failed: ${JSON.stringify(evidence)}`);
  }

  const prettierOptions = (await prettier.resolveConfig(reportPath)) ?? {};
  const reportContent = await prettier.format(`${JSON.stringify(evidence, null, 2)}\n`, {
    ...prettierOptions,
    parser: 'json',
  });
  await fs.writeFile(reportPath, reportContent);
  process.stdout.write(reportContent);
} finally {
  await browser.close();
}
