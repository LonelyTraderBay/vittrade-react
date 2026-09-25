import { lazy } from 'react';
import { IntegrationPendingPage } from './pages/system/IntegrationPendingPage';
import { isDevelopmentBuild } from './config/env';
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
const OnboardingFlow = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/onboarding/OnboardingFlow'))
  : IntegrationPendingPage;

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
const WebTradingBotsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/WebTradingBotsDemoPage').then((m) => ({
        default: m.WebTradingBotsDemoPage,
      })),
    )
  : IntegrationPendingPage;
const WebPredictionsPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionsHomeContractPage,
  })),
);
const WebEarnSavingsPage = lazy(() =>
  import('@/features/earn/pages/EarnPage').then((m) => ({ default: m.SavingsPage })),
);
const WebNotificationsPage = lazy(() =>
  import('@/features/support/pages/NotificationsContractPage').then((m) => ({
    default: m.NotificationsContractPage,
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
const WebBotFAQPage = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/web/WebBotFAQPage').then((m) => ({ default: m.WebBotFAQPage })))
  : IntegrationPendingPage;
const WebBotGuidePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotGuidePage').then((m) => ({ default: m.WebBotGuidePage })),
    )
  : IntegrationPendingPage;
const WebBotRiskDisclosurePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotRiskDisclosurePage').then((m) => ({
        default: m.WebBotRiskDisclosurePage,
      })),
    )
  : IntegrationPendingPage;
const WebBotBacktestingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotBacktestingPage').then((m) => ({
        default: m.WebBotBacktestingPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotTermsOfServicePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotCompliancePages').then((m) => ({
        default: m.WebBotTermsOfServicePage,
      })),
    )
  : IntegrationPendingPage;
const WebBotSuitabilityAssessmentPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotCompliancePages').then((m) => ({
        default: m.WebBotSuitabilityAssessmentPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotEmergencyStopPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotCompliancePages').then((m) => ({
        default: m.WebBotEmergencyStopPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotSecuritySettingsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotCompliancePages').then((m) => ({
        default: m.WebBotSecuritySettingsPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotHistoryPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotPerformanceAnalyticsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotPerformanceAnalyticsPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotRiskDashboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotRiskDashboardPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotPortfolioDashboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotPortfolioDashboardPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotStrategyComparePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotStrategyComparePage,
      })),
    )
  : IntegrationPendingPage;
const WebBotOptimizationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotOptimizationPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotDrawdownAnalyzerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotDrawdownAnalyzerPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotEquityCurvePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotAnalyticsPages').then((m) => ({
        default: m.WebBotEquityCurvePage,
      })),
    )
  : IntegrationPendingPage;
const WebBotTaxReportingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotUtilityPages').then((m) => ({
        default: m.WebBotTaxReportingPage,
      })),
    )
  : IntegrationPendingPage;
const WebBotAPIDocumentationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebBotUtilityPages').then((m) => ({
        default: m.WebBotAPIDocumentationPage,
      })),
    )
  : IntegrationPendingPage;
const WebOrdersHistoryPage = lazy(() =>
  import('@/features/trading/pages/OrdersHistoryPage').then((m) => ({
    default: m.OrdersHistoryPage,
  })),
);
const WebLoginPage = lazy(() =>
  import('@/features/auth/pages/WebLoginPage').then((m) => ({ default: m.WebLoginPage })),
);
// Account creation remains development-only until the registration contract exists.
const WebRegisterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/auth/WebRegisterForm').then((m) => ({
        default: m.WebRegisterPage,
      })),
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
const WebDeviceTrustPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebDeviceTrustPage').then((m) => ({
        default: m.WebDeviceTrustPage,
      })),
    )
  : IntegrationPendingPage;
const WebAntiPhishingSetupPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebAntiPhishingSetupPage').then((m) => ({
        default: m.WebAntiPhishingSetupPage,
      })),
    )
  : IntegrationPendingPage;
const WebPasskeySetupPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebPasskeySetupPage').then((m) => ({
        default: m.WebPasskeySetupPage,
      })),
    )
  : IntegrationPendingPage;
const WebLoginActivityPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebLoginActivityPage').then((m) => ({
        default: m.WebLoginActivityPage,
      })),
    )
  : IntegrationPendingPage;
const WebSecurityAuditPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebSecurityAuditPage').then((m) => ({
        default: m.WebSecurityAuditPage,
      })),
    )
  : IntegrationPendingPage;
const WebSecurityNotificationsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebSecurityNotificationsPage').then((m) => ({
        default: m.WebSecurityNotificationsPage,
      })),
    )
  : IntegrationPendingPage;
const WebSessionManagementPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebSessionManagementPage').then((m) => ({
        default: m.WebSessionManagementPage,
      })),
    )
  : IntegrationPendingPage;
const PasswordChangePage = lazy(() =>
  import('@/features/auth/pages/PasswordChangePage').then((m) => ({
    default: m.PasswordChangePage,
  })),
);
const WebSecurityAlertDetailPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebSecurityAlertDetailPage').then((m) => ({
        default: m.WebSecurityAlertDetailPage,
      })),
    )
  : IntegrationPendingPage;
const WebSecurityAlertListPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebSecurityAlertListPage').then((m) => ({
        default: m.WebSecurityAlertListPage,
      })),
    )
  : IntegrationPendingPage;
const WebTwoFAManagementPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebTwoFAManagementPage').then((m) => ({
        default: m.WebTwoFAManagementPage,
      })),
    )
  : IntegrationPendingPage;
const WebDeviceTrustDetailPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebDeviceTrustDetailPage').then((m) => ({
        default: m.WebDeviceTrustDetailPage,
      })),
    )
  : IntegrationPendingPage;
const WebPredictionEventDetailPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionEventContractPage,
  })),
);
const WebArenaHomePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/web/WebArenaHomePage').then((m) => ({ default: m.WebArenaHomePage })),
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
        Component: lazy(() =>
          import('@/dev/legacy/v2/MissingScreensShowcasePage').then((m) => ({
            default: m.MissingScreensShowcasePage,
          })),
        ),
      },
      {
        path: 'dev/design-system',
        Component: lazy(() =>
          import('@/dev/legacy/v2/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
        ),
      },
      {
        path: 'dev/dca-overview',
        Component: lazy(() => import('@/dev/legacy/dca/DCAOverviewDemo')),
      },
      {
        path: 'demo/copy-card',
        Component: lazy(() => import('@/dev/legacy/demo/CopyTradingCardDemo')),
      },
    ]
  : [];

/* ═══════════════════════════════════════════
   Router Definition — 3 Platform Shells
   ═══════════════════════════════════════════ */

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
              deviceTrust: WebDeviceTrustPage,
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
              { path: 'profile/security/anti-phishing', Component: WebAntiPhishingSetupPage },
              { path: 'profile/security/passkey', Component: WebPasskeySetupPage },
              { path: 'profile/security/login-activity', Component: WebLoginActivityPage },
              { path: 'profile/security/security-audit', Component: WebSecurityAuditPage },
              { path: 'profile/security/notifications', Component: WebSecurityNotificationsPage },
              { path: 'profile/security/session-management', Component: WebSessionManagementPage },
              { path: 'profile/security/change-password', Component: PasswordChangePage },
              { path: 'profile/security/alert-detail', Component: WebSecurityAlertDetailPage },
              { path: 'profile/security/alerts/:alertId', Component: WebSecurityAlertDetailPage },
              { path: 'profile/security/alert-list', Component: WebSecurityAlertListPage },
              { path: 'profile/security/two-factor-auth', Component: WebTwoFAManagementPage },
              { path: 'profile/security/device-trust', Component: WebDeviceTrustDetailPage },
              { path: 'profile/security/devices/:deviceId', Component: WebDeviceTrustDetailPage },
              { path: 'profile/devices', Component: WebDeviceManagementPage },
              { path: 'profile/activity', Component: WebActivityHistoryPage },
              // ─── Referral ───
              // ─── News ───
              { path: 'news', Component: WebNewsPage },
              // ─── Copy Trading (Web versions) ───
              ...createTradingWebRoutes(),
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
