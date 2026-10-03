import { lazy } from 'react';
import { IntegrationPendingPage } from './pages/system/IntegrationPendingPage';
import { env, isDevelopmentBuild } from '@/shared/config/env';
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
const ShellTemplatePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/responsive/ShellTemplatePage').then((m) => ({
        default: m.ShellTemplatePage,
      })),
    )
  : IntegrationPendingPage;
const DevelopmentPreviewControls =
  isDevelopmentBuild && env.dataSource === 'mock'
    ? lazy(() =>
        import('@/dev/PreviewControls').then((module) => ({
          default: module.PreviewControls,
        })),
      )
    : undefined;

// Shared route builders
import {
  createAuthBlock,
  createPublicRoutes,
  createProtectedRoutes,
  type ShellOverrides,
} from './routeConfig';
import { createAuthRoutes } from '@/features/auth/routes';
import { createTradingWebRoutes } from '@/features/trading/routes';
import { createWalletWebRoutes } from '@/features/wallet';
import { createMarketWebRoutes } from '@/features/market/routes';
import { p2pWebRoutes } from '@/features/p2p/routes';

// ─── Mobile Shell Components ───
const MarketHomePage = lazy(() =>
  import('@/features/market/pages/MarketHomePage').then((m) => ({
    default: m.MarketHomePage,
  })),
);
const HomePage = MarketHomePage;
const MarketListPage = lazy(() =>
  import('@/features/market/pages/MarketListPage').then((m) => ({ default: m.MarketListPage })),
);
const PairDetailPage = lazy(() =>
  import('@/features/market/pages/PairDetailPage').then((m) => ({ default: m.PairDetailPage })),
);
const TradePage = lazy(() =>
  import('@/features/trading/pages/TradePage').then((m) => ({ default: m.TradePage })),
);
const WalletContractPage = lazy(() =>
  import('@/features/wallet/pages/WalletOverviewContractPage').then((m) => ({
    default: m.WalletOverviewContractPage,
  })),
);
const TxHistoryContractPage = lazy(() =>
  import('@/features/wallet/pages/WalletTransactionHistoryContractPage').then((m) => ({
    default: m.WalletTransactionHistoryContractPage,
  })),
);
const ProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfileContractPage').then((m) => ({
    default: m.ProfileContractPage,
  })),
);
const P2PHomePage = lazy(() =>
  import('./pages/p2p/P2PHomePage').then((m) => ({ default: m.P2PHomePage })),
);

// ─── Responsive Shell Components (legacy + shared) ───
const ResponsiveHomePage = MarketHomePage;
const ResponsiveMarketListPage = MarketListPage;
const ResponsivePairDetailPage = PairDetailPage;
const ResponsiveTradePage = TradePage;
const ResponsiveProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfileContractPage').then((m) => ({
    default: m.ProfileContractPage,
  })),
);
const ResponsiveP2PHomePage = lazy(() =>
  import('./pages/p2p/P2PHomePage').then((m) => ({ default: m.P2PHomePage })),
);

// ─── Onboarding ───
const OnboardingFlow = IntegrationPendingPage;

// ─── Web-Specific Pages ───
const WebHomePage = MarketHomePage;
const WebMarketListPage = MarketListPage;
const WebProfilePage = lazy(() =>
  import('@/features/profile/pages/ProfileContractPage').then((m) => ({
    default: m.ProfileContractPage,
  })),
);
const WebEditProfilePage = lazy(() =>
  import('@/features/profile/pages/EditProfileContractPage').then((m) => ({
    default: m.EditProfileContractPage,
  })),
);
const WebSubAccountPage = lazy(() =>
  import('@/features/profile/pages/SubAccountContractPage').then((m) => ({
    default: m.SubAccountContractPage,
  })),
);
const WebP2PHomePage = lazy(() =>
  import('./pages/p2p/P2PHomePage').then((m) => ({ default: m.P2PHomePage })),
);
const WebTradePage = TradePage;
const WebPairDetailPage = PairDetailPage;
const WebTradingBotsPage = IntegrationPendingPage;
const WebPredictionsPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionsHomeContractPage,
  })),
);
const WebEarnSavingsPage = lazy(() =>
  import('@/features/earn/pages/EarnPage').then((m) => ({ default: m.SavingsPage })),
);
const WebNotificationsPage = lazy(() =>
  import('./pages/platform/NotificationsPageAdapter').then((m) => ({
    default: m.NotificationsPageAdapter,
  })),
);
const WebSupportPage = lazy(() =>
  import('@/features/support/pages/SupportContractPage').then((m) => ({
    default: m.SupportContractPage,
  })),
);
const WebNewsPage = lazy(() =>
  import('@/features/support/pages/NewsContractPage').then((m) => ({
    default: m.NewsContractPage,
  })),
);
const WebDeviceManagementPage = lazy(() =>
  import('@/features/profile/pages/DeviceManagementContractPage').then((m) => ({
    default: m.DeviceManagementContractPage,
  })),
);
const WebActivityHistoryPage = lazy(() =>
  import('@/features/profile/pages/ActivityLogContractPage').then((m) => ({
    default: m.ActivityLogContractPage,
  })),
);
const WebEarnStakingPage = lazy(() =>
  import('@/features/earn/pages/EarnPage').then((m) => ({ default: m.StakingPage })),
);
const WebAddressBookPage = lazy(() =>
  import('@/features/wallet/pages/AddressBookPage').then((m) => ({ default: m.AddressBookPage })),
);
const WebBotFAQPage = IntegrationPendingPage;
const WebBotGuidePage = IntegrationPendingPage;
const WebBotRiskDisclosurePage = IntegrationPendingPage;
const WebBotBacktestingPage = IntegrationPendingPage;
const WebBotTermsOfServicePage = IntegrationPendingPage;
const WebBotSuitabilityAssessmentPage = IntegrationPendingPage;
const WebBotEmergencyStopPage = IntegrationPendingPage;
const WebBotSecuritySettingsPage = IntegrationPendingPage;
const WebBotHistoryPage = IntegrationPendingPage;
const WebBotPerformanceAnalyticsPage = IntegrationPendingPage;
const WebBotRiskDashboardPage = IntegrationPendingPage;
const WebBotPortfolioDashboardPage = IntegrationPendingPage;
const WebBotStrategyComparePage = IntegrationPendingPage;
const WebBotOptimizationPage = IntegrationPendingPage;
const WebBotDrawdownAnalyzerPage = IntegrationPendingPage;
const WebBotEquityCurvePage = IntegrationPendingPage;
const WebBotTaxReportingPage = IntegrationPendingPage;
const WebBotAPIDocumentationPage = IntegrationPendingPage;
const WebLoginPage = lazy(() =>
  import('@/features/auth/pages/WebLoginPage').then((m) => ({ default: m.WebLoginPage })),
);
// Account creation uses its typed frontend contract in development; production awaits backend integration.
const WebRegisterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/auth/pages/WebRegisterPage').then((m) => ({ default: m.WebRegisterPage })),
    )
  : IntegrationPendingPage;
const WebForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/PasswordResetPages').then((m) => ({
    default: m.ForgotPasswordContractPage,
  })),
);
const WebResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/PasswordResetPages').then((m) => ({
    default: m.ResetPasswordContractPage,
  })),
);
const WebOTPPage = lazy(() =>
  import('@/features/auth/pages/WebOTPPage').then((m) => ({ default: m.WebOTPPage })),
);
const Web2FASetupPage = lazy(() =>
  import('@/features/auth/pages/Web2FASetupPage').then((m) => ({ default: m.Web2FASetupPage })),
);
const WebAuthSuccessPage = lazy(() =>
  import('@/features/auth/pages/WebAuthSuccessPage').then((m) => ({
    default: m.WebAuthSuccessPage,
  })),
);
const WebAccountLockedPage = lazy(() =>
  import('@/features/auth/pages/WebAccountLockedPage').then((m) => ({
    default: m.WebAccountLockedPage,
  })),
);
const WebSessionExpiredPage = lazy(() =>
  import('@/features/auth/pages/WebSessionExpiredPage').then((m) => ({
    default: m.WebSessionExpiredPage,
  })),
);
const PasswordChangePage = lazy(() =>
  import('@/features/auth/pages/PasswordChangePage').then((m) => ({
    default: m.PasswordChangePage,
  })),
);
const WebPredictionEventDetailPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionEventContractPage,
  })),
);
const WebArenaHomePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/arena/pages/ArenaDiscoveryPage').then((m) => ({
        default: m.ArenaDiscoveryPage,
      })),
    )
  : IntegrationPendingPage;

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
  WalletPage: WalletContractPage,
  TxHistoryPage: TxHistoryContractPage,
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
  WalletPage: WalletContractPage,
  TxHistoryPage: TxHistoryContractPage,
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
  WalletPage: WalletContractPage,
  TxHistoryPage: TxHistoryContractPage,
  ProfilePage: WebProfilePage,
  P2PHomePage: WebP2PHomePage,
  ArenaHomePage: WebArenaHomePage,
};

/** Legacy responsive overrides (backward compat) */
const responsiveOverrides: ShellOverrides = tabletOverrides;

/**
 * Demo/showcase routes are created only in development builds. Keeping the
 * dynamic imports inside the DEV branch prevents demo chunks from becoming a
 * production route or an accidental production dependency.
 */
const developmentRoutes = isDevelopmentBuild
  ? [
      {
        path: 'dev/showcase',
        Component: IntegrationPendingPage,
      },
      {
        path: 'dev/design-system',
        Component: IntegrationPendingPage,
      },
      {
        path: 'dev/dca-overview',
        Component: lazy(() => import('@/dev/legacy/dca/DCAOverviewDemo')),
      },
      {
        path: 'demo/copy-card',
        Component: IntegrationPendingPage,
      },
    ]
  : [];

/* ═══════════════════════════════════════════
   Router Definition — 3 Platform Shells
   ═══════════════════════════════════════════ */

export const router = createBrowserRouter([
  {
    path: '/',
    element: React.createElement(RootLayout, {
      developmentPreviewControls: DevelopmentPreviewControls,
    }),
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
          ...developmentRoutes,
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
          {
            path: 'auth',
            children: createAuthRoutes({
              login: WebLoginPage,
              register: WebRegisterPage,
              otp: WebOTPPage,
              twoFASetup: Web2FASetupPage,
              forgotPassword: WebForgotPasswordPage,
              resetPassword: WebResetPasswordPage,
              success: WebAuthSuccessPage,
              accountLocked: WebAccountLockedPage,
              sessionExpired: WebSessionExpiredPage,
              deviceTrust: IntegrationPendingPage,
            }),
          },
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
              ...createMarketWebRoutes(),
              // ─── Predictions ───
              { path: 'predictions', Component: WebPredictionsPage },
              { path: 'predictions/event/:eventId', Component: WebPredictionEventDetailPage },
              // ─── Earn & Savings ───
              { path: 'earn/savings', Component: WebEarnSavingsPage },
              { path: 'earn/staking', Component: WebEarnStakingPage },
              ...createWalletWebRoutes(),
              { path: 'address-book', Component: WebAddressBookPage },
              ...p2pWebRoutes,
              // ─── Notifications ───
              { path: 'notifications', Component: WebNotificationsPage },
              // ─── Support ───
              { path: 'support', Component: WebSupportPage },
              // ─── Profile pages ───
              { path: 'profile/edit', Component: WebEditProfilePage },
              { path: 'profile/sub-accounts', Component: WebSubAccountPage },
              { path: 'profile/security/anti-phishing', Component: IntegrationPendingPage },
              { path: 'profile/security/passkey', Component: IntegrationPendingPage },
              { path: 'profile/security/login-activity', Component: IntegrationPendingPage },
              { path: 'profile/security/security-audit', Component: IntegrationPendingPage },
              { path: 'profile/security/notifications', Component: IntegrationPendingPage },
              { path: 'profile/security/session-management', Component: IntegrationPendingPage },
              { path: 'profile/security/change-password', Component: PasswordChangePage },
              { path: 'profile/security/alert-detail', Component: IntegrationPendingPage },
              { path: 'profile/security/alerts/:alertId', Component: IntegrationPendingPage },
              { path: 'profile/security/alert-list', Component: IntegrationPendingPage },
              { path: 'profile/security/two-factor-auth', Component: IntegrationPendingPage },
              { path: 'profile/security/device-trust', Component: IntegrationPendingPage },
              { path: 'profile/security/devices/:deviceId', Component: IntegrationPendingPage },
              { path: 'profile/devices', Component: WebDeviceManagementPage },
              { path: 'profile/activity', Component: WebActivityHistoryPage },
              // ─── Referral ───
              // ─── News ───
              { path: 'news', Component: WebNewsPage },
              // ─── Copy Trading (Web versions) ───
              ...createTradingWebRoutes(),
              // ─── Orders ───
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
