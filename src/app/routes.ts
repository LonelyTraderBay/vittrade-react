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
import { RootLayout } from './components/layout/RootLayout';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ResponsiveAppLayout } from './components/layout/ResponsiveShell';
import { TabletShell } from './components/layout/TabletShell';
import { WebShell } from './components/layout/WebShell';
import { ShellTemplatePage } from './pages/responsive/ShellTemplatePage';

// Shared route builders
import {
  createAuthBlock,
  createWebAuthBlock,
  createPublicRoutes,
  createProtectedRoutes,
  type ShellOverrides,
} from './routeConfig';

// ─── Mobile Shell Components ───
import { HomePage } from './pages/market/HomePage';
import { MarketListPage } from './pages/market/MarketListPage';
import { PairDetailPage } from './pages/market/PairDetailPage';
import { TradePage } from './pages/trade/TradePage';
import { WalletPage } from './pages/wallet/WalletPage';
import { TransactionHistoryPage } from './pages/wallet/TransactionHistoryPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { P2PHomePage } from './pages/p2p/P2PHomePage';

// ─── Responsive Shell Components (legacy + shared) ───
import { ResponsiveHomePage } from './pages/responsive/ResponsiveHomePage';
import { ResponsiveMarketListPage } from './pages/responsive/ResponsiveMarketListPage';
import { ResponsivePairDetailPage } from './pages/responsive/ResponsivePairDetailPage';
import { ResponsiveTradePage } from './pages/responsive/ResponsiveTradePage';
import { ResponsiveWalletPage } from './pages/responsive/ResponsiveWalletPage';
import { ResponsiveTxHistoryPage } from './pages/responsive/ResponsiveTxHistoryPage';
import { ResponsiveProfilePage } from './pages/responsive/ResponsiveProfilePage';
import { ResponsiveP2PHomePage } from './pages/responsive/ResponsiveP2PHomePage';

// ─── Demo Pages ───
import CopyTradingCardDemo from './pages/demo/CopyTradingCardDemo';

// ─── Dev / Showcase Pages ───
import { MissingScreensShowcasePage } from './pages/v2/MissingScreensShowcasePage';
import { DesignSystemPage } from './pages/v2/DesignSystemPage';
import DCAOverviewDemo from './pages/dca/DCAOverviewDemo';
import DCAPage from './pages/dca/DCAPage';

// ─── Onboarding ───
import OnboardingFlow from './pages/onboarding/OnboardingFlow';

// ─── Web-Specific Pages ───
import { WebHomePage } from './pages/web/WebHomePage';
import { WebMarketListPage } from './pages/web/WebMarketListPage';
import { WebWalletPage } from './pages/web/WebWalletPage';
import { WebProfilePage } from './pages/web/WebProfilePage';
import { WebP2PHomePage } from './pages/web/WebP2PHomePage';
import { WebTradePage } from './pages/web/WebTradePage';
import { WebTxHistoryPage } from './pages/web/WebTxHistoryPage';
import { WebPairDetailPage } from './pages/web/WebPairDetailPage';
import { WebTradeAnalyticsPage } from './pages/web/WebTradeAnalyticsPage';
import { WebMarketScannerPage } from './pages/web/WebMarketScannerPage';
import { WebMarketsOverviewPage } from './pages/web/WebMarketsOverviewPage';
import { WebMarketsMoversPage } from './pages/web/WebMarketsMoversPage';
import { WebMarketsWatchlistPage } from './pages/web/WebMarketsWatchlistPage';
import { WebMarketsHeatmapPage } from './pages/web/WebMarketsHeatmapPage';
import { WebTradingBotsPage } from './pages/web/WebTradingBotsPage';
import { WebPredictionsPage } from './pages/web/WebPredictionsPage';
import { WebEarnSavingsPage } from './pages/web/WebEarnSavingsPage';
import { WebNotificationsPage } from './pages/web/WebNotificationsPage';
import { WebSupportPage } from './pages/web/WebSupportPage';
import { WebSecurityCenterPage } from './pages/web/WebSecurityCenterPage';
import { WebVIPProgramPage } from './pages/web/WebVIPProgramPage';
import { WebReferralPage } from './pages/web/WebReferralPage';
import { WebNewsPage } from './pages/web/WebNewsPage';
import { WebKYCPage } from './pages/web/WebKYCPage';
import { WebAPIManagementPage } from './pages/web/WebAPIManagementPage';
import { WebDeviceManagementPage } from './pages/web/WebDeviceManagementPage';
import { WebActivityHistoryPage } from './pages/web/WebActivityHistoryPage';
import { WebSettingsPage } from './pages/web/WebSettingsPage';
import { WebEarnStakingPage } from './pages/web/WebEarnStakingPage';
import { WebPortfolioAnalyticsPage } from './pages/web/WebPortfolioAnalyticsPage';
import { WebAddressBookPage } from './pages/web/WebAddressBookPage';
import { WebP2PMyOrdersPage } from './pages/web/WebP2PMyOrdersPage';
import { WebP2PCreateOfferPage } from './pages/web/WebP2PCreateOfferPage';
import { WebP2POrderRoomPage } from './pages/web/WebP2POrderRoomPage';
import { WebBotFAQPage } from './pages/web/WebBotFAQPage';
import { WebBotGuidePage } from './pages/web/WebBotGuidePage';
import { WebBotRiskDisclosurePage } from './pages/web/WebBotRiskDisclosurePage';
import { WebBotBacktestingPage } from './pages/web/WebBotBacktestingPage';
import {
  WebBotTermsOfServicePage,
  WebBotSuitabilityAssessmentPage,
  WebBotEmergencyStopPage,
  WebBotSecuritySettingsPage,
} from './pages/web/WebBotCompliancePages';
import {
  WebBotHistoryPage,
  WebBotPerformanceAnalyticsPage,
  WebBotRiskDashboardPage,
  WebBotPortfolioDashboardPage,
  WebBotStrategyComparePage,
  WebBotOptimizationPage,
  WebBotDrawdownAnalyzerPage,
  WebBotEquityCurvePage,
} from './pages/web/WebBotAnalyticsPages';
import {
  WebBotTaxReportingPage,
  WebBotAPIDocumentationPage,
} from './pages/web/WebBotUtilityPages';
import { WebCopyTradingPage } from './pages/web/WebCopyTradingPage';
import { WebCopyProviderDetailPage } from './pages/web/WebCopyProviderDetailPage';
import { WebPreCopyAssessmentPage } from './pages/web/WebPreCopyAssessmentPage';
import {
  WebCopyConfigurationPage,
  WebCopyConfirmationPage,
  WebCopyPerformancePage,
  WebCopyEducationPage,
} from './pages/web/WebCopyTradingPages';
import { WebCopyActiveCopiesPage } from './pages/web/WebCopyManagementPages';
import { WebOrdersHistoryPage } from './pages/web/WebOrdersHistoryPage';
import { WebLoginPage } from './pages/web/WebLoginPage';
import { WebRegisterPage } from './pages/web/WebRegisterPage';
import { WebForgotPasswordPage } from './pages/web/WebForgotPasswordPage';
import { WebResetPasswordPage } from './pages/web/WebResetPasswordPage';
import { WebOTPPage } from './pages/web/WebOTPPage';
import { Web2FASetupPage } from './pages/web/Web2FASetupPage';
import { WebAuthSuccessPage } from './pages/web/WebAuthSuccessPage';
import { WebAccountLockedPage } from './pages/web/WebAccountLockedPage';
import { WebSessionExpiredPage } from './pages/web/WebSessionExpiredPage';
import { WebDeviceTrustPage } from './pages/web/WebDeviceTrustPage';
import { WebAntiPhishingSetupPage } from './pages/web/WebAntiPhishingSetupPage';
import { WebPasskeySetupPage } from './pages/web/WebPasskeySetupPage';
import { WebLoginActivityPage } from './pages/web/WebLoginActivityPage';
import { WebWithdrawalWhitelistPage } from './pages/web/WebWithdrawalWhitelistPage';
import { WebSecurityAuditPage } from './pages/web/WebSecurityAuditPage';
import { WebSecurityNotificationsPage } from './pages/web/WebSecurityNotificationsPage';
import { WebSessionManagementPage } from './pages/web/WebSessionManagementPage';
import { WebChangePasswordPage } from './pages/web/WebChangePasswordPage';
import { WebSecurityAlertDetailPage } from './pages/web/WebSecurityAlertDetailPage';
import { WebSecurityAlertListPage } from './pages/web/WebSecurityAlertListPage';
import { WebTwoFAManagementPage } from './pages/web/WebTwoFAManagementPage';
import { WebDeviceTrustDetailPage } from './pages/web/WebDeviceTrustDetailPage';
import { WebPredictionEventDetailPage } from './pages/web/WebPredictionEventDetailPage';
import { WebArenaHomePage } from './pages/web/WebArenaHomePage';

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
          createWebAuthBlock(WebLoginPage, WebRegisterPage, WebForgotPasswordPage, WebResetPasswordPage, WebOTPPage, Web2FASetupPage, WebAuthSuccessPage, WebAccountLockedPage, WebSessionExpiredPage, WebDeviceTrustPage),
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
              { path: 'trade/bots/suitability-assessment', Component: WebBotSuitabilityAssessmentPage },
              { path: 'trade/bots/emergency-stop', Component: WebBotEmergencyStopPage },
              { path: 'trade/bots/security-settings', Component: WebBotSecuritySettingsPage },
              { path: 'trade/bots/history', Component: WebBotHistoryPage },
              { path: 'trade/bots/performance-analytics', Component: WebBotPerformanceAnalyticsPage },
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
              { path: 'profile/security/withdrawal-whitelist', Component: WebWithdrawalWhitelistPage },
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
              { path: 'trade/copy/provider/:providerId/assessment', Component: WebPreCopyAssessmentPage },
              { path: 'trade/copy/provider/:providerId/configuration', Component: WebCopyConfigurationPage },
              { path: 'trade/copy/provider/:providerId/confirmation', Component: WebCopyConfirmationPage },
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