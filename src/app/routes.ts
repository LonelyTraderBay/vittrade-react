import { lazy } from 'react';
/**
 * ══════════════════════════════════════════════════════════
 *  App Router — 3 Platform Shells (Phone / Tablet / Web)
 * ══════════════════════════════════════════════════════════
 *
 *  Phone  (default): /home, /markets, /trade, ...
 *  Tablet:           /t/home, /t/markets, /t/trade, ...
 *  Web:              /w/home, /w/markets, /w/trade, ...
 *  Legacy:           /r/... (responsive — kept for compat)
 *
 *  Each shell has fundamentally different:
 *  - Navigation (bottom nav / sidebar / full sidebar + command bar)
 *  - Layout (single-col / split-view / multi-panel)
 *  - Interactions (gestures / touch / mouse+keyboard)
 *  - Information density
 */

import { createBrowserRouter } from 'react-router';
import React from 'react';
import { Navigate } from 'react-router';
import { RouteErrorBoundary } from './routes/RouteErrorBoundary';
import { RootLayout } from './components/layout/RootLayout';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ResponsiveAppLayout } from './components/layout/ResponsiveShell';
import { TabletShell } from './components/layout/TabletShell';
import { WebShell } from './components/layout/WebShell';
const ShellTemplatePage = lazy(() =>
  import('./pages/responsive/ShellTemplatePage').then((m) => ({ default: m.ShellTemplatePage })),
);

// Shared route builders
import {
  createAuthBlock,
  createWebAuthBlock,
  createPublicRoutes,
  createProtectedRoutes,
  type ShellOverrides,
} from './routeConfig';

// ─── Mobile Shell Components ───
const HomePage = lazy(() =>
  import('./pages/market/HomePage').then((m) => ({ default: m.HomePage })),
);
const MarketListPage = lazy(() =>
  import('./pages/market/MarketListPage').then((m) => ({ default: m.MarketListPage })),
);
const PairDetailPage = lazy(() =>
  import('./pages/market/PairDetailPage').then((m) => ({ default: m.PairDetailPage })),
);
const TradePage = lazy(() =>
  import('./pages/trade/TradePage').then((m) => ({ default: m.TradePage })),
);
const WalletPage = lazy(() =>
  import('./pages/wallet/WalletPage').then((m) => ({ default: m.WalletPage })),
);
const TransactionHistoryPage = lazy(() =>
  import('./pages/wallet/TransactionHistoryPage').then((m) => ({
    default: m.TransactionHistoryPage,
  })),
);
const ProfilePage = lazy(() =>
  import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const P2PHomePage = lazy(() =>
  import('./pages/p2p/P2PHomePage').then((m) => ({ default: m.P2PHomePage })),
);

// ─── Responsive Shell Components (legacy + shared) ───
const ResponsiveHomePage = lazy(() =>
  import('./pages/responsive/ResponsiveHomePage').then((m) => ({ default: m.ResponsiveHomePage })),
);
const ResponsiveMarketListPage = lazy(() =>
  import('./pages/responsive/ResponsiveMarketListPage').then((m) => ({
    default: m.ResponsiveMarketListPage,
  })),
);
const ResponsivePairDetailPage = lazy(() =>
  import('./pages/responsive/ResponsivePairDetailPage').then((m) => ({
    default: m.ResponsivePairDetailPage,
  })),
);
const ResponsiveTradePage = lazy(() =>
  import('./pages/responsive/ResponsiveTradePage').then((m) => ({
    default: m.ResponsiveTradePage,
  })),
);
const ResponsiveWalletPage = lazy(() =>
  import('./pages/responsive/ResponsiveWalletPage').then((m) => ({
    default: m.ResponsiveWalletPage,
  })),
);
const ResponsiveTxHistoryPage = lazy(() =>
  import('./pages/responsive/ResponsiveTxHistoryPage').then((m) => ({
    default: m.ResponsiveTxHistoryPage,
  })),
);
const ResponsiveProfilePage = lazy(() =>
  import('./pages/responsive/ResponsiveProfilePage').then((m) => ({
    default: m.ResponsiveProfilePage,
  })),
);
const ResponsiveP2PHomePage = lazy(() =>
  import('./pages/responsive/ResponsiveP2PHomePage').then((m) => ({
    default: m.ResponsiveP2PHomePage,
  })),
);

// ─── Demo Pages ───
const CopyTradingCardDemo = lazy(() => import('./pages/demo/CopyTradingCardDemo'));

// ─── Dev / Showcase Pages ───
const MissingScreensShowcasePage = lazy(() =>
  import('./pages/v2/MissingScreensShowcasePage').then((m) => ({
    default: m.MissingScreensShowcasePage,
  })),
);
const DesignSystemPage = lazy(() =>
  import('./pages/v2/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
);
const DCAOverviewDemo = lazy(() => import('./pages/dca/DCAOverviewDemo'));
const DCAPage = lazy(() => import('./pages/dca/DCAPage'));

// ─── Onboarding ───
const OnboardingFlow = lazy(() => import('./pages/onboarding/OnboardingFlow'));

// ─── Web-Specific Pages ───
const WebHomePage = lazy(() =>
  import('./pages/web/WebHomePage').then((m) => ({ default: m.WebHomePage })),
);
const WebMarketListPage = lazy(() =>
  import('./pages/web/WebMarketListPage').then((m) => ({ default: m.WebMarketListPage })),
);
const WebWalletPage = lazy(() =>
  import('./pages/web/WebWalletPage').then((m) => ({ default: m.WebWalletPage })),
);
const WebProfilePage = lazy(() =>
  import('./pages/web/WebProfilePage').then((m) => ({ default: m.WebProfilePage })),
);
const WebP2PHomePage = lazy(() =>
  import('./pages/web/WebP2PHomePage').then((m) => ({ default: m.WebP2PHomePage })),
);
const WebTradePage = lazy(() =>
  import('./pages/web/WebTradePage').then((m) => ({ default: m.WebTradePage })),
);
const WebTxHistoryPage = lazy(() =>
  import('./pages/web/WebTxHistoryPage').then((m) => ({ default: m.WebTxHistoryPage })),
);
const WebPairDetailPage = lazy(() =>
  import('./pages/web/WebPairDetailPage').then((m) => ({ default: m.WebPairDetailPage })),
);
const WebTradeAnalyticsPage = lazy(() =>
  import('./pages/web/WebTradeAnalyticsPage').then((m) => ({ default: m.WebTradeAnalyticsPage })),
);
const WebMarketScannerPage = lazy(() =>
  import('./pages/web/WebMarketScannerPage').then((m) => ({ default: m.WebMarketScannerPage })),
);
const WebMarketsOverviewPage = lazy(() =>
  import('./pages/web/WebMarketsOverviewPage').then((m) => ({ default: m.WebMarketsOverviewPage })),
);
const WebMarketsMoversPage = lazy(() =>
  import('./pages/web/WebMarketsMoversPage').then((m) => ({ default: m.WebMarketsMoversPage })),
);
const WebMarketsWatchlistPage = lazy(() =>
  import('./pages/web/WebMarketsWatchlistPage').then((m) => ({
    default: m.WebMarketsWatchlistPage,
  })),
);
const WebMarketsHeatmapPage = lazy(() =>
  import('./pages/web/WebMarketsHeatmapPage').then((m) => ({ default: m.WebMarketsHeatmapPage })),
);
const WebTradingBotsPage = lazy(() =>
  import('./pages/web/WebTradingBotsPage').then((m) => ({ default: m.WebTradingBotsPage })),
);
const WebPredictionsPage = lazy(() =>
  import('./pages/web/WebPredictionsPage').then((m) => ({ default: m.WebPredictionsPage })),
);
const WebEarnSavingsPage = lazy(() =>
  import('./pages/web/WebEarnSavingsPage').then((m) => ({ default: m.WebEarnSavingsPage })),
);
const WebNotificationsPage = lazy(() =>
  import('./pages/web/WebNotificationsPage').then((m) => ({ default: m.WebNotificationsPage })),
);
const WebSupportPage = lazy(() =>
  import('./pages/web/WebSupportPage').then((m) => ({ default: m.WebSupportPage })),
);
const WebSecurityCenterPage = lazy(() =>
  import('./pages/web/WebSecurityCenterPage').then((m) => ({ default: m.WebSecurityCenterPage })),
);
const WebVIPProgramPage = lazy(() =>
  import('./pages/web/WebVIPProgramPage').then((m) => ({ default: m.WebVIPProgramPage })),
);
const WebReferralPage = lazy(() =>
  import('./pages/web/WebReferralPage').then((m) => ({ default: m.WebReferralPage })),
);
const WebNewsPage = lazy(() =>
  import('./pages/web/WebNewsPage').then((m) => ({ default: m.WebNewsPage })),
);
const WebKYCPage = lazy(() =>
  import('./pages/web/WebKYCPage').then((m) => ({ default: m.WebKYCPage })),
);
const WebAPIManagementPage = lazy(() =>
  import('./pages/web/WebAPIManagementPage').then((m) => ({ default: m.WebAPIManagementPage })),
);
const WebDeviceManagementPage = lazy(() =>
  import('./pages/web/WebDeviceManagementPage').then((m) => ({
    default: m.WebDeviceManagementPage,
  })),
);
const WebActivityHistoryPage = lazy(() =>
  import('./pages/web/WebActivityHistoryPage').then((m) => ({ default: m.WebActivityHistoryPage })),
);
const WebSettingsPage = lazy(() =>
  import('./pages/web/WebSettingsPage').then((m) => ({ default: m.WebSettingsPage })),
);
const WebEarnStakingPage = lazy(() =>
  import('./pages/web/WebEarnStakingPage').then((m) => ({ default: m.WebEarnStakingPage })),
);
const WebPortfolioAnalyticsPage = lazy(() =>
  import('./pages/web/WebPortfolioAnalyticsPage').then((m) => ({
    default: m.WebPortfolioAnalyticsPage,
  })),
);
const WebAddressBookPage = lazy(() =>
  import('./pages/web/WebAddressBookPage').then((m) => ({ default: m.WebAddressBookPage })),
);
const WebP2PMyOrdersPage = lazy(() =>
  import('./pages/web/WebP2PMyOrdersPage').then((m) => ({ default: m.WebP2PMyOrdersPage })),
);
const WebP2PCreateOfferPage = lazy(() =>
  import('./pages/web/WebP2PCreateOfferPage').then((m) => ({ default: m.WebP2PCreateOfferPage })),
);
const WebP2POrderRoomPage = lazy(() =>
  import('./pages/web/WebP2POrderRoomPage').then((m) => ({ default: m.WebP2POrderRoomPage })),
);
const WebBotFAQPage = lazy(() =>
  import('./pages/web/WebBotFAQPage').then((m) => ({ default: m.WebBotFAQPage })),
);
const WebBotGuidePage = lazy(() =>
  import('./pages/web/WebBotGuidePage').then((m) => ({ default: m.WebBotGuidePage })),
);
const WebBotRiskDisclosurePage = lazy(() =>
  import('./pages/web/WebBotRiskDisclosurePage').then((m) => ({
    default: m.WebBotRiskDisclosurePage,
  })),
);
const WebBotBacktestingPage = lazy(() =>
  import('./pages/web/WebBotBacktestingPage').then((m) => ({ default: m.WebBotBacktestingPage })),
);
const WebBotTermsOfServicePage = lazy(() =>
  import('./pages/web/WebBotCompliancePages').then((m) => ({
    default: m.WebBotTermsOfServicePage,
  })),
);
const WebBotSuitabilityAssessmentPage = lazy(() =>
  import('./pages/web/WebBotCompliancePages').then((m) => ({
    default: m.WebBotSuitabilityAssessmentPage,
  })),
);
const WebBotEmergencyStopPage = lazy(() =>
  import('./pages/web/WebBotCompliancePages').then((m) => ({ default: m.WebBotEmergencyStopPage })),
);
const WebBotSecuritySettingsPage = lazy(() =>
  import('./pages/web/WebBotCompliancePages').then((m) => ({
    default: m.WebBotSecuritySettingsPage,
  })),
);
const WebBotHistoryPage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({ default: m.WebBotHistoryPage })),
);
const WebBotPerformanceAnalyticsPage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({
    default: m.WebBotPerformanceAnalyticsPage,
  })),
);
const WebBotRiskDashboardPage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({ default: m.WebBotRiskDashboardPage })),
);
const WebBotPortfolioDashboardPage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({
    default: m.WebBotPortfolioDashboardPage,
  })),
);
const WebBotStrategyComparePage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({
    default: m.WebBotStrategyComparePage,
  })),
);
const WebBotOptimizationPage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({ default: m.WebBotOptimizationPage })),
);
const WebBotDrawdownAnalyzerPage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({
    default: m.WebBotDrawdownAnalyzerPage,
  })),
);
const WebBotEquityCurvePage = lazy(() =>
  import('./pages/web/WebBotAnalyticsPages').then((m) => ({ default: m.WebBotEquityCurvePage })),
);
const WebBotTaxReportingPage = lazy(() =>
  import('./pages/web/WebBotUtilityPages').then((m) => ({ default: m.WebBotTaxReportingPage })),
);
const WebBotAPIDocumentationPage = lazy(() =>
  import('./pages/web/WebBotUtilityPages').then((m) => ({ default: m.WebBotAPIDocumentationPage })),
);
const WebCopyTradingPage = lazy(() =>
  import('./pages/web/WebCopyTradingPage').then((m) => ({ default: m.WebCopyTradingPage })),
);
const WebCopyProviderDetailPage = lazy(() =>
  import('./pages/web/WebCopyProviderDetailPage').then((m) => ({
    default: m.WebCopyProviderDetailPage,
  })),
);
const WebPreCopyAssessmentPage = lazy(() =>
  import('./pages/web/WebPreCopyAssessmentPage').then((m) => ({
    default: m.WebPreCopyAssessmentPage,
  })),
);
const WebCopyConfigurationPage = lazy(() =>
  import('./pages/web/WebCopyTradingPages').then((m) => ({ default: m.WebCopyConfigurationPage })),
);
const WebCopyConfirmationPage = lazy(() =>
  import('./pages/web/WebCopyTradingPages').then((m) => ({ default: m.WebCopyConfirmationPage })),
);
const WebCopyPerformancePage = lazy(() =>
  import('./pages/web/WebCopyTradingPages').then((m) => ({ default: m.WebCopyPerformancePage })),
);
const WebCopyEducationPage = lazy(() =>
  import('./pages/web/WebCopyTradingPages').then((m) => ({ default: m.WebCopyEducationPage })),
);
const WebCopyActiveCopiesPage = lazy(() =>
  import('./pages/web/WebCopyManagementPages').then((m) => ({
    default: m.WebCopyActiveCopiesPage,
  })),
);
const WebOrdersHistoryPage = lazy(() =>
  import('./pages/web/WebOrdersHistoryPage').then((m) => ({ default: m.WebOrdersHistoryPage })),
);
const WebLoginPage = lazy(() =>
  import('./pages/web/WebLoginPage').then((m) => ({ default: m.WebLoginPage })),
);
const WebRegisterPage = lazy(() =>
  import('./pages/web/WebRegisterPage').then((m) => ({ default: m.WebRegisterPage })),
);
const WebForgotPasswordPage = lazy(() =>
  import('./pages/web/WebForgotPasswordPage').then((m) => ({ default: m.WebForgotPasswordPage })),
);
const WebResetPasswordPage = lazy(() =>
  import('./pages/web/WebResetPasswordPage').then((m) => ({ default: m.WebResetPasswordPage })),
);
const WebOTPPage = lazy(() =>
  import('./pages/web/WebOTPPage').then((m) => ({ default: m.WebOTPPage })),
);
const Web2FASetupPage = lazy(() =>
  import('./pages/web/Web2FASetupPage').then((m) => ({ default: m.Web2FASetupPage })),
);
const WebAuthSuccessPage = lazy(() =>
  import('./pages/web/WebAuthSuccessPage').then((m) => ({ default: m.WebAuthSuccessPage })),
);
const WebAccountLockedPage = lazy(() =>
  import('./pages/web/WebAccountLockedPage').then((m) => ({ default: m.WebAccountLockedPage })),
);
const WebSessionExpiredPage = lazy(() =>
  import('./pages/web/WebSessionExpiredPage').then((m) => ({ default: m.WebSessionExpiredPage })),
);
const WebDeviceTrustPage = lazy(() =>
  import('./pages/web/WebDeviceTrustPage').then((m) => ({ default: m.WebDeviceTrustPage })),
);
const WebAntiPhishingSetupPage = lazy(() =>
  import('./pages/web/WebAntiPhishingSetupPage').then((m) => ({
    default: m.WebAntiPhishingSetupPage,
  })),
);
const WebPasskeySetupPage = lazy(() =>
  import('./pages/web/WebPasskeySetupPage').then((m) => ({ default: m.WebPasskeySetupPage })),
);
const WebLoginActivityPage = lazy(() =>
  import('./pages/web/WebLoginActivityPage').then((m) => ({ default: m.WebLoginActivityPage })),
);
const WebWithdrawalWhitelistPage = lazy(() =>
  import('./pages/web/WebWithdrawalWhitelistPage').then((m) => ({
    default: m.WebWithdrawalWhitelistPage,
  })),
);
const WebSecurityAuditPage = lazy(() =>
  import('./pages/web/WebSecurityAuditPage').then((m) => ({ default: m.WebSecurityAuditPage })),
);
const WebSecurityNotificationsPage = lazy(() =>
  import('./pages/web/WebSecurityNotificationsPage').then((m) => ({
    default: m.WebSecurityNotificationsPage,
  })),
);
const WebSessionManagementPage = lazy(() =>
  import('./pages/web/WebSessionManagementPage').then((m) => ({
    default: m.WebSessionManagementPage,
  })),
);
const WebChangePasswordPage = lazy(() =>
  import('./pages/web/WebChangePasswordPage').then((m) => ({ default: m.WebChangePasswordPage })),
);
const WebSecurityAlertDetailPage = lazy(() =>
  import('./pages/web/WebSecurityAlertDetailPage').then((m) => ({
    default: m.WebSecurityAlertDetailPage,
  })),
);
const WebSecurityAlertListPage = lazy(() =>
  import('./pages/web/WebSecurityAlertListPage').then((m) => ({
    default: m.WebSecurityAlertListPage,
  })),
);
const WebTwoFAManagementPage = lazy(() =>
  import('./pages/web/WebTwoFAManagementPage').then((m) => ({ default: m.WebTwoFAManagementPage })),
);
const WebDeviceTrustDetailPage = lazy(() =>
  import('./pages/web/WebDeviceTrustDetailPage').then((m) => ({
    default: m.WebDeviceTrustDetailPage,
  })),
);
const WebPredictionEventDetailPage = lazy(() =>
  import('./pages/web/WebPredictionEventDetailPage').then((m) => ({
    default: m.WebPredictionEventDetailPage,
  })),
);
const WebArenaHomePage = lazy(() =>
  import('./pages/web/WebArenaHomePage').then((m) => ({ default: m.WebArenaHomePage })),
);

/* ══════════════════════════════════════════
   Shell Overrides — Components that differ
   between platforms
   ═══════════════════════════════════════════ */

/** Phone: touch-first, single-column, gesture-heavy */
const phoneOverrides: ShellOverrides = {
  HomePage,
  MarketListPage,
  PairDetailPage,
  TradePage,
  WalletPage,
  TxHistoryPage: TransactionHistoryPage,
  ProfilePage,
  P2PHomePage,
};

/**
 * Tablet: split-view, floating sidebar, 2-column grids
 * Uses Responsive variants for wider layouts
 */
const tabletOverrides: ShellOverrides = {
  HomePage: ResponsiveHomePage,
  MarketListPage: ResponsiveMarketListPage,
  PairDetailPage: ResponsivePairDetailPage,
  TradePage: ResponsiveTradePage,
  WalletPage: ResponsiveWalletPage,
  TxHistoryPage: ResponsiveTxHistoryPage,
  ProfilePage: ResponsiveProfilePage,
  P2PHomePage: ResponsiveP2PHomePage,
};

/**
 * Web: multi-panel, full sidebar, command bar, keyboard shortcuts
 * Uses dedicated Web pages for desktop-native experience
 */
const webOverrides: ShellOverrides = {
  HomePage: WebHomePage,
  MarketListPage: WebMarketListPage,
  PairDetailPage: WebPairDetailPage,
  TradePage: WebTradePage,
  WalletPage: WebWalletPage,
  TxHistoryPage: WebTxHistoryPage,
  ProfilePage: WebProfilePage,
  P2PHomePage: WebP2PHomePage,
};

/** Legacy responsive overrides (backward compat) */
const responsiveOverrides: ShellOverrides = tabletOverrides;

/* ═══════════════════════════════════════════
   Router Definition — 3 Platform Shells
   ═══════════════════════════════════════════ */

console.log('[Router] Initializing 3-shell architecture @', new Date().toISOString());

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    errorElement: React.createElement(RouteErrorBoundary),
    children: [
      // ─── Default: redirect / → /home ───
      { index: true, element: React.createElement(Navigate, { to: '/home', replace: true }) },

      // ─── Auth ───
      createAuthBlock(),

      // ─── Onboarding (standalone, no shell) ───
      { path: 'onboarding', Component: OnboardingFlow },

      // ════════════════════════════════════
      //  PHONE SHELL — Touch-first, gestures
      // ════════════════════════════════════
      {
        Component: AppLayout,
        children: [
          ...createPublicRoutes(phoneOverrides),
          { path: 'dev/showcase', Component: MissingScreensShowcasePage },
          { path: 'dev/design-system', Component: DesignSystemPage },
          { path: 'dev/dca-overview', Component: DCAOverviewDemo },
          { path: 'demo/copy-card', Component: CopyTradingCardDemo },
          {
            Component: ProtectedRoute,
            children: createProtectedRoutes(phoneOverrides),
          },
        ],
      },

      // ════════════════════════════════════
      //  TABLET SHELL — Split-view, sidebar
      // ════════════════════════════════════
      {
        path: 't',
        Component: TabletShell,
        children: [
          { index: true, element: React.createElement(Navigate, { to: '/t/home', replace: true }) },
          createAuthBlock(),
          ...createPublicRoutes(tabletOverrides),
          {
            Component: ProtectedRoute,
            children: createProtectedRoutes(tabletOverrides),
          },
        ],
      },

      // ════════════════════════════════════
      //  WEB SHELL — Multi-panel, keyboard
      // ════════════════════════════════════
      {
        path: 'w',
        Component: WebShell,
        children: [
          { index: true, element: React.createElement(Navigate, { to: '/w/home', replace: true }) },
          createWebAuthBlock(
            WebLoginPage,
            WebRegisterPage,
            WebForgotPasswordPage,
            WebResetPasswordPage,
            WebOTPPage,
            Web2FASetupPage,
            WebAuthSuccessPage,
            WebAccountLockedPage,
            WebSessionExpiredPage,
            WebDeviceTrustPage,
          ),
          ...createPublicRoutes(webOverrides),
          {
            Component: ProtectedRoute,
            children: [
              // ─── Web-specific overrides (before shared routes) ───
              { path: 'trade/bots', Component: WebTradingBotsPage },
              { path: 'trade/bots/faq', Component: WebBotFAQPage },
              { path: 'trade/bots/guide', Component: WebBotGuidePage },
              { path: 'trade/bots/risk-disclosure', Component: WebBotRiskDisclosurePage },
              { path: 'trade/bots/backtesting', Component: WebBotBacktestingPage },
              { path: 'trade/bots/terms-of-service', Component: WebBotTermsOfServicePage },
              {
                path: 'trade/bots/suitability-assessment',
                Component: WebBotSuitabilityAssessmentPage,
              },
              { path: 'trade/bots/emergency-stop', Component: WebBotEmergencyStopPage },
              { path: 'trade/bots/security-settings', Component: WebBotSecuritySettingsPage },
              { path: 'trade/bots/history', Component: WebBotHistoryPage },
              {
                path: 'trade/bots/performance-analytics',
                Component: WebBotPerformanceAnalyticsPage,
              },
              { path: 'trade/bots/risk-dashboard', Component: WebBotRiskDashboardPage },
              { path: 'trade/bots/portfolio-dashboard', Component: WebBotPortfolioDashboardPage },
              { path: 'trade/bots/strategy-compare', Component: WebBotStrategyComparePage },
              { path: 'trade/bots/optimization', Component: WebBotOptimizationPage },
              { path: 'trade/bots/drawdown-analyzer', Component: WebBotDrawdownAnalyzerPage },
              { path: 'trade/bots/equity-curve', Component: WebBotEquityCurvePage },
              { path: 'trade/bots/tax-reporting', Component: WebBotTaxReportingPage },
              { path: 'trade/bots/api-documentation', Component: WebBotAPIDocumentationPage },
              ...createProtectedRoutes(webOverrides),
              // ─── Web-only pages ───
              { path: 'trade/analytics', Component: WebTradeAnalyticsPage },
              { path: 'scanner', Component: WebMarketScannerPage },
              // ─── Markets pages ───
              { path: 'markets/overview', Component: WebMarketsOverviewPage },
              { path: 'markets/movers', Component: WebMarketsMoversPage },
              { path: 'markets/watchlist', Component: WebMarketsWatchlistPage },
              { path: 'markets/heatmap', Component: WebMarketsHeatmapPage },
              // ─── Predictions ───
              { path: 'predictions', Component: WebPredictionsPage },
              { path: 'predictions/event/:eventId', Component: WebPredictionEventDetailPage },
              // ─── Earn & Savings ───
              { path: 'earn/savings', Component: WebEarnSavingsPage },
              { path: 'earn/staking', Component: WebEarnStakingPage },
              { path: 'portfolio/analytics', Component: WebPortfolioAnalyticsPage },
              { path: 'address-book', Component: WebAddressBookPage },
              { path: 'p2p/my-orders', Component: WebP2PMyOrdersPage },
              { path: 'p2p/create-offer', Component: WebP2PCreateOfferPage },
              { path: 'p2p/order-room', Component: WebP2POrderRoomPage },
              { path: 'p2p/order/:orderId', Component: WebP2POrderRoomPage },
              // ─── Notifications ───
              { path: 'notifications', Component: WebNotificationsPage },
              // ─── Support ───
              { path: 'support', Component: WebSupportPage },
              // ─── Profile pages ───
              { path: 'profile/security', Component: WebSecurityCenterPage },
              { path: 'profile/security/anti-phishing', Component: WebAntiPhishingSetupPage },
              { path: 'profile/security/passkey', Component: WebPasskeySetupPage },
              { path: 'profile/security/login-activity', Component: WebLoginActivityPage },
              {
                path: 'profile/security/withdrawal-whitelist',
                Component: WebWithdrawalWhitelistPage,
              },
              { path: 'profile/security/security-audit', Component: WebSecurityAuditPage },
              { path: 'profile/security/notifications', Component: WebSecurityNotificationsPage },
              { path: 'profile/security/session-management', Component: WebSessionManagementPage },
              { path: 'profile/security/change-password', Component: WebChangePasswordPage },
              { path: 'profile/security/alert-detail', Component: WebSecurityAlertDetailPage },
              { path: 'profile/security/alerts/:alertId', Component: WebSecurityAlertDetailPage },
              { path: 'profile/security/alert-list', Component: WebSecurityAlertListPage },
              { path: 'profile/security/two-factor-auth', Component: WebTwoFAManagementPage },
              { path: 'profile/security/device-trust', Component: WebDeviceTrustDetailPage },
              { path: 'profile/security/devices/:deviceId', Component: WebDeviceTrustDetailPage },
              { path: 'profile/vip', Component: WebVIPProgramPage },
              { path: 'profile/kyc', Component: WebKYCPage },
              { path: 'profile/api', Component: WebAPIManagementPage },
              { path: 'profile/devices', Component: WebDeviceManagementPage },
              { path: 'profile/activity', Component: WebActivityHistoryPage },
              { path: 'profile/settings', Component: WebSettingsPage },
              // ─── Referral ───
              { path: 'referral', Component: WebReferralPage },
              // ─── News ───
              { path: 'news', Component: WebNewsPage },
              // ─── Copy Trading (Web versions) ───
              { path: 'trade/copy', Component: WebCopyTradingPage },
              { path: 'trade/copy/provider/:providerId', Component: WebCopyProviderDetailPage },
              {
                path: 'trade/copy/provider/:providerId/assessment',
                Component: WebPreCopyAssessmentPage,
              },
              {
                path: 'trade/copy/provider/:providerId/configuration',
                Component: WebCopyConfigurationPage,
              },
              {
                path: 'trade/copy/provider/:providerId/confirmation',
                Component: WebCopyConfirmationPage,
              },
              { path: 'trade/copy/active', Component: WebCopyActiveCopiesPage },
              { path: 'trade/copy/performance/:copyId', Component: WebCopyPerformancePage },
              { path: 'trade/copy/education', Component: WebCopyEducationPage },
              // ─── Orders ───
              { path: 'trade/orders', Component: WebOrdersHistoryPage },
              // ─── Arena ───
              { path: 'arena', Component: WebArenaHomePage },
            ],
          },
        ],
      },

      // ════════════════════════════════════
      //  LEGACY — Responsive Shell (compat)
      // ════════════════════════════════════
      {
        path: 'r',
        Component: ResponsiveAppLayout,
        children: [
          { index: true, Component: ShellTemplatePage },
          createAuthBlock(),
          ...createPublicRoutes(responsiveOverrides),
          { path: 'shell', Component: ShellTemplatePage },
          {
            Component: ProtectedRoute,
            children: createProtectedRoutes(responsiveOverrides),
          },
        ],
      },
    ],
  },
]);
