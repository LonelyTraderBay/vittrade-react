import { lazy } from 'react';
import React from 'react';
import type { RouteObject } from 'react-router';
import { isDevelopmentBuild } from '@/shared/config/env';
import { IntegrationPendingPage } from './pages/system/IntegrationPendingPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { createP2PProtectedRoutes } from './routes/p2pProtectedRoutes';
import { createTradingProtectedRoutes } from './routes/tradingProtectedRoutes';
import { createWalletProfileProtectedRoutes } from './routes/walletProfileProtectedRoutes';

// ═══════════════════════════════════════════════════════════
//  ALL PAGES LAZY-LOADED — route-level code splitting.
//  Each page ships as its own chunk; the shared RootLayout
//  Suspense boundary renders the chunk fallback.
//  Only layout/route helpers remain statically imported.
// ═══════════════════════════════════════════════════════════

// ─── Auth Pages ───
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
// Registration uses the frontend contract in development and stays pending until backend integration.
const RegisterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/auth/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
    )
  : IntegrationPendingPage;
const OTPPage = lazy(() =>
  import('@/features/auth/pages/OTPPage').then((m) => ({ default: m.OTPPage })),
);
const TwoFASetupPage = lazy(() =>
  import('@/features/auth/pages/TwoFASetupPage').then((m) => ({ default: m.TwoFASetupPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('@/features/auth/pages/PasswordResetPages').then((m) => ({
    default: m.ForgotPasswordContractPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import('@/features/auth/pages/PasswordResetPages').then((m) => ({
    default: m.ResetPasswordContractPage,
  })),
);

// ─── Auth Layout ───
import { AuthLayout } from './components/layout/AuthLayout';

// ─── Prediction Markets Pages ───
const PredictionsHomePage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionsHomeContractPage,
  })),
);
const PredictionsSearchPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionsSearchContractPage,
  })),
);
const PredictionsBreakingPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionsBreakingContractPage,
  })),
);
const PredictionEventDetailPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionEventContractPage,
  })),
);
const PredictionsPortfolioPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionPortfolioContractPage,
  })),
);
const PredictionsRewardsPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionRewardsContractPage,
  })),
);
const PredictionsLeaderboardPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionLeaderboardContractPage,
  })),
);
const PredictionsGlobalActivityPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionActivityContractPage,
  })),
);
const PredictionOrderReceiptPage = lazy(() =>
  import('@/features/predictions/pages/PredictionContractPages').then((m) => ({
    default: m.PredictionReceiptContractPage,
  })),
);
const PredictionRiskCalculatorPage = lazy(() =>
  import('@/features/predictions/pages/PredictionRiskCalculatorPage').then((m) => ({
    default: m.PredictionRiskCalculatorPage,
  })),
);

// ─── Arena contract pages and integration placeholders ───
const ArenaHomePage = IntegrationPendingPage;
const ArenaStudioPage = IntegrationPendingPage;
const ArenaModeDetailPage = lazy(() =>
  import('@/features/arena/pages/ArenaContractPages').then((m) => ({
    default: m.ArenaModeContractPage,
  })),
);
const ArenaChallengeDetailPage = lazy(() =>
  import('@/features/arena/pages/ArenaContractPages').then((m) => ({
    default: m.ArenaChallengeContractPage,
  })),
);
const ArenaResolutionCenterPage = IntegrationPendingPage;
const ArenaCreatorPage = IntegrationPendingPage;
const ArenaLeaderboardPage = IntegrationPendingPage;
const VerifiedChallengesPage = IntegrationPendingPage;
const ArenaPointsPage = IntegrationPendingPage;
const ArenaFlowMapPage = IntegrationPendingPage;
const ArenaSafetyCenterPage = IntegrationPendingPage;
const ArenaTrustBreakdownPage = IntegrationPendingPage;
const ArenaPointsLedgerPage = IntegrationPendingPage;
const ArenaPointsEntryDetailPage = IntegrationPendingPage;
const MyArenaPage = IntegrationPendingPage;
const ArenaReportCasePage = IntegrationPendingPage;
const ArenaBlockedUsersPage = IntegrationPendingPage;
const MyArenaReportsPage = IntegrationPendingPage;
const ArenaProductionReadyPage = IntegrationPendingPage;
const ArenaPredictionBridgeFoundationPage = IntegrationPendingPage;
const ConnectedEcosystemProductionPage = IntegrationPendingPage;
const ArenaSmartRuleBuilderPage = IntegrationPendingPage;
const ArenaUniversalPresetLibraryPage = IntegrationPendingPage;
const ArenaGovernanceGatePage = IntegrationPendingPage;
const ArenaGuidePage = IntegrationPendingPage;

// ─── DCA Pages ───
const DCAPage = lazy(() => import('./pages/dca/DCAPage'));
const dcaDevelopmentRoutes: RouteObject[] = isDevelopmentBuild
  ? [
      {
        path: 'dca/rebalance/config',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/rebalance/:configId',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/schedule/config',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/schedule/:configId',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/portfolio-optimizer',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/dynamic-amount',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/backtester',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/multi-asset',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/performance-compare',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
      {
        path: 'dca/smart-rules',
        Component: lazy(() =>
          import('@/features/dca/pages/DCAAdvancedPreviewPage').then((m) => ({
            default: m.DCAAdvancedPreviewPage,
          })),
        ),
      },
    ]
  : [];
const dcaProductionPendingRoutes: RouteObject[] = isDevelopmentBuild
  ? []
  : [
      { path: 'dca/rebalance/config', Component: IntegrationPendingPage },
      { path: 'dca/rebalance/:configId', Component: IntegrationPendingPage },
      { path: 'dca/schedule/config', Component: IntegrationPendingPage },
      { path: 'dca/schedule/:configId', Component: IntegrationPendingPage },
      { path: 'dca/portfolio-optimizer', Component: IntegrationPendingPage },
      { path: 'dca/dynamic-amount', Component: IntegrationPendingPage },
      { path: 'dca/backtester', Component: IntegrationPendingPage },
      { path: 'dca/multi-asset', Component: IntegrationPendingPage },
      { path: 'dca/performance-compare', Component: IntegrationPendingPage },
      { path: 'dca/smart-rules', Component: IntegrationPendingPage },
    ];

// ─── Cross-Module Pages ───
const UnifiedPortfolioDashboard = IntegrationPendingPage;
const CrossModuleAnalytics = IntegrationPendingPage;
const SmartAlertCenter = IntegrationPendingPage;
const TaxReportCenter = IntegrationPendingPage;

// ─── Staking & Earn - Compliance Pages (Phase 1) ───

// ─── Staking & Earn - Portfolio Management (Phase 2) ───

// ─── Staking & Earn - Advanced Features (Phase 3) ───

// ─── Staking & Earn - UX Enhancements (Phase 4) ───

// ─── Staking & Earn - Regulatory Compliance (Phase 5) ───

// ─── Staking & Earn - Risk Management (Phase 6) ───

// ─── Staking & Earn - Social & Community (Phase 7) ───

// ─── Staking & Earn - API & Integrations (Phase 8) ───

// ─── Staking & Earn - Advanced Features (Phase 3 Extensions) ───

// ─── Admin Pages ───
const AdminHome = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/admin/pages/AdminOverviewContractPage').then((module) => ({
        default: module.AdminOverviewContractPage,
      })),
    )
  : IntegrationPendingPage;
const AnalyticsDashboard = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/admin/pages/AdminOverviewContractPage').then((module) => ({
        default: module.AdminOverviewContractPage,
      })),
    )
  : IntegrationPendingPage;
const ABTestDashboard = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/admin/pages/AdminAbTestsContractPage').then((module) => ({
        default: module.AdminAbTestsContractPage,
      })),
    )
  : IntegrationPendingPage;
const FunnelDashboard = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/admin/pages/AdminFunnelContractPage').then((module) => ({
        default: module.AdminFunnelContractPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Dev Tools (never registered in a production route tree) ───
const RouteChecker = isDevelopmentBuild
  ? lazy(() => import('./components/dev/RouteChecker').then((m) => ({ default: m.RouteChecker })))
  : IntegrationPendingPage;
const PerformanceMonitor = isDevelopmentBuild
  ? lazy(() =>
      import('./components/dev/PerformanceMonitor').then((m) => ({
        default: m.PerformanceMonitor,
      })),
    )
  : IntegrationPendingPage;

// ─── Staking Routes (Lazy Loaded) ───
import { createEarnRoutes } from '@/features/earn/routes';
import { createTradingRoutes } from '@/features/trading/routes';
import { createDCARoutes } from '@/features/dca/routes';
import { createLaunchpadRoutes } from '@/features/launchpad/routes';
import { createAdminRoutes } from '@/features/admin/routes';
import { createPredictionRoutes } from '@/features/predictions/routes';
import { createArenaRoutes } from '@/features/arena/routes';
import { createReferralRoutes } from '@/features/referral/routes';
import { createAuthRoutes } from '@/features/auth/routes';
import { createMarketPublicRoutes } from '@/features/market/routes';
import { createSupportProtectedRoutes, createSupportPublicRoutes } from '@/features/support/routes';
import { createDiscoveryRoutes } from '@/features/discovery/routes';

// ─── Misc Pages ───
const ReferralHomePage = lazy(() =>
  import('@/features/referral/pages/ReferralContractPage').then((m) => ({
    default: m.ReferralContractPage,
  })),
);
const RewardsHubPage = IntegrationPendingPage;
const EnterpriseStatesPage = IntegrationPendingPage;

// ─── Discovery Pages ───
/* ════════════════════════════════════════════
   AUTH ROUTES
   ══════════════════════════════════════════ */
export const authRoutes: RouteObject[] = [
  ...createAuthRoutes({
    login: LoginPage,
    register: RegisterPage,
    otp: OTPPage,
    twoFASetup: TwoFASetupPage,
    forgotPassword: ForgotPasswordPage,
    resetPassword: ResetPasswordPage,
  }),
];

export function createAuthBlock(): RouteObject {
  return {
    path: 'auth',
    Component: AuthLayout,
    children: authRoutes,
  };
}

/* ═══════════════════════════════════════════
   Shell-specific component overrides
   ═══════════════════════════════════════════ */
export interface ShellOverrides {
  TradePage: React.ComponentType;
  WalletPage: React.ComponentType;
  TxHistoryPage: React.ComponentType;
  ProfilePage: React.ComponentType;
  P2PHomePage: React.ComponentType;
  HomePage: React.ComponentType;
  MarketListPage: React.ComponentType;
  PairDetailPage: React.ComponentType;
  ArenaHomePage?: React.ComponentType;
}

/* ═══════════════════════════════════════════
   PUBLIC ROUTES — pages accessible without login
   ══════════════════════════════════════════ */
export function createPublicRoutes(o: ShellOverrides): RouteObject[] {
  return [
    { path: 'home', Component: o.HomePage },
    {
      path: 'markets',
      children: [{ index: true, Component: o.MarketListPage }],
    },
    ...createMarketPublicRoutes({ pairDetail: o.PairDetailPage }),

    ...createSupportPublicRoutes(),
  ];
}

/* ═══════════════════════════════════════════
   PROTECTED ROUTES — require authentication
   ═══════════════════════════════════════════ */
export function createProtectedRoutes(o: ShellOverrides): RouteObject[] {
  return [
    ...createTradingProtectedRoutes(o.TradePage),

    {
      path: 'markets/predictions',
      children: [
        ...createPredictionRoutes({
          home: PredictionsHomePage,
          search: PredictionsSearchPage,
          breaking: PredictionsBreakingPage,
          event: PredictionEventDetailPage,
          portfolio: PredictionsPortfolioPage,
          rewards: PredictionsRewardsPage,
          leaderboard: PredictionsLeaderboardPage,
          activity: PredictionsGlobalActivityPage,
          receipt: PredictionOrderReceiptPage,
        }),
        { path: 'risk-calculator', Component: PredictionRiskCalculatorPage },
        { path: 'market-maker', Component: IntegrationPendingPage },
        { path: 'portfolio-analyzer', Component: IntegrationPendingPage },
        { path: 'event-calendar', Component: IntegrationPendingPage },
        { path: 'social', Component: IntegrationPendingPage },
        { path: 'advanced-chart/:pairId', Component: IntegrationPendingPage },
        { path: 'tournaments', Component: IntegrationPendingPage },
        { path: 'data-integration', Component: IntegrationPendingPage },
      ],
    },

    // ═══════════════════════════���═══════════════════════════════
    //  WALLET — Core + Sub-pages
    // ═══════════════════════════════════════════════════════════

    // ═════════════════════════════════════════════════════════
    //  PROFILE — Core + Sub-pages
    // ═══════════════════════════════════════════════════════════
    ...createWalletProfileProtectedRoutes(o),
    // Profile bridges (Guidelines §5.3)
    { path: 'profile/predictions', Component: PredictionsPortfolioPage },
    { path: 'profile/arena', Component: MyArenaPage },

    // ═══════════════════════════════════════════════════════════
    //  DCA (Dollar Cost Averaging) — Standalone module
    // ═══════════════════════════════════════════════════════════
    { path: 'dca', Component: DCAPage },
    ...dcaDevelopmentRoutes,
    ...dcaProductionPendingRoutes,

    // ═══════════════════════════════════════════════════════════
    //  ADMIN & ANALYTICS
    // ══════════════════════════════���════════════════════════════
    {
      element: React.createElement(ProtectedRoute, {
        requiredRoles: ['admin'],
        requiredPermissions: ['admin:read'],
      }),
      children: [
        ...createAdminRoutes({
          home: AdminHome,
          analytics: AnalyticsDashboard,
          funnel: FunnelDashboard,
          abTests: ABTestDashboard,
        }),
      ],
    },

    // ═══════════════════════════════════════════════════════════
    //  ARENA — /arena/* (Guidelines §5.3)
    //  Creator-driven, points-only social module
    // ═══════════════════════════════════════════════════════════
    { path: 'arena', Component: o.ArenaHomePage ?? ArenaHomePage },
    { path: 'arena/studio', Component: ArenaStudioPage },
    { path: 'arena/studio/smart-rules', Component: ArenaSmartRuleBuilderPage },
    { path: 'arena/studio/presets', Component: ArenaUniversalPresetLibraryPage },
    { path: 'arena/studio/governance', Component: ArenaGovernanceGatePage },
    ...createArenaRoutes({
      mode: ArenaModeDetailPage,
      challenge: ArenaChallengeDetailPage,
      join: lazy(() =>
        import('@/features/arena/pages/ArenaContractPages').then((m) => ({
          default: m.ArenaJoinContractPage,
        })),
      ),
    }),
    { path: 'arena/resolution', Component: ArenaResolutionCenterPage },
    { path: 'arena/creator/:creatorId', Component: ArenaCreatorPage },
    { path: 'arena/leaderboard', Component: ArenaLeaderboardPage },
    { path: 'arena/verified', Component: VerifiedChallengesPage },
    { path: 'arena/points', Component: ArenaPointsPage },
    { path: 'arena/flow-map', Component: ArenaFlowMapPage },
    { path: 'arena/safety', Component: ArenaSafetyCenterPage },
    { path: 'arena/trust/:userId', Component: ArenaTrustBreakdownPage },
    { path: 'arena/ledger/entry/:entryId', Component: ArenaPointsEntryDetailPage },
    { path: 'arena/ledger', Component: ArenaPointsLedgerPage },
    { path: 'arena/report/:caseId', Component: ArenaReportCasePage },
    { path: 'arena/blocked', Component: ArenaBlockedUsersPage },
    { path: 'arena/my-reports', Component: MyArenaReportsPage },
    { path: 'arena/my', Component: MyArenaPage },
    { path: 'arena/production', Component: ArenaProductionReadyPage },
    { path: 'arena/bridge', Component: ArenaPredictionBridgeFoundationPage },
    { path: 'arena/ecosystem', Component: ConnectedEcosystemProductionPage },
    { path: 'arena/guide', Component: ArenaGuidePage },

    ...createP2PProtectedRoutes(o.P2PHomePage),

    // ══════════════════════════════════════════════════════════
    //  DISCOVERY — Unified Search & Topic Hub
    // ═══════════════════════════════════════════════════════════
    ...createDiscoveryRoutes(),

    // ══════════════════════════════════════════════════════════
    //  EARN — Staking & Savings
    // ══════════════════════════════════════════════════════════
    // The remaining contract-backed Earn entry routes are composed at the bottom.

    // ══════════════════════════════════════════════════════════
    //  REFERRAL
    // ═════════════════════════════════════════════════════════
    { path: 'referral/history', Component: IntegrationPendingPage },
    { path: 'referral/rewards', Component: IntegrationPendingPage },
    { path: 'referral/rules', Component: IntegrationPendingPage },
    { path: 'referral/friend/:friendId', Component: IntegrationPendingPage },
    ...createReferralRoutes({ home: ReferralHomePage }),

    // ═══════════════════════════════════════════════════════════
    //  MISC — Notifications, Support, Launchpad, Rewards
    // ═══════════════════════���═══════════════════════════════════
    ...createSupportProtectedRoutes(),
    { path: 'launchpad/portfolio', Component: IntegrationPendingPage },
    { path: 'launchpad/performance', Component: IntegrationPendingPage },
    { path: 'launchpad/staking', Component: IntegrationPendingPage },
    { path: 'launchpad/idobridge/:id', Component: IntegrationPendingPage },
    { path: 'launchpad/receipt/:subId', Component: IntegrationPendingPage },
    { path: 'launchpad/claim-receipt/:positionId', Component: IntegrationPendingPage },
    { path: 'launchpad/bridge-order/:txId', Component: IntegrationPendingPage },
    { path: 'launchpad/batch-claim', Component: IntegrationPendingPage },
    { path: 'launchpad/bridge-compare', Component: IntegrationPendingPage },
    { path: 'launchpad/notif-sound', Component: IntegrationPendingPage },
    { path: 'launchpad/event-log', Component: IntegrationPendingPage },
    { path: 'launchpad/abi-diff/:contractId', Component: IntegrationPendingPage },
    { path: 'launchpad/address-book', Component: IntegrationPendingPage },
    { path: 'launchpad/webhooks', Component: IntegrationPendingPage },
    { path: 'launchpad/gas-tracker', Component: IntegrationPendingPage },
    { path: 'launchpad/rebalance', Component: IntegrationPendingPage },
    { path: 'launchpad/multisig', Component: IntegrationPendingPage },
    { path: 'launchpad/swap-aggregator', Component: IntegrationPendingPage },
    { path: 'launchpad/limit-orders', Component: IntegrationPendingPage },
    { path: 'launchpad/dca-builder', Component: IntegrationPendingPage },
    { path: 'launchpad/risk-analytics', Component: IntegrationPendingPage },
    { path: 'rewards', Component: RewardsHubPage },
    { path: 'enterprise-states', Component: EnterpriseStatesPage },

    // ═══════════════════════════════════════════════════════════
    //  CROSS-MODULE FEATURES — Unified Portfolio, Analytics, Alerts, Tax
    // ═══════════════════════════════════════════════════════════
    { path: 'unified-portfolio', Component: UnifiedPortfolioDashboard },
    { path: 'cross-module-analytics', Component: CrossModuleAnalytics },
    { path: 'smart-alerts', Component: SmartAlertCenter },
    { path: 'tax-reports', Component: TaxReportCenter },

    // ═══════════════════════════════════════════════════════════
    //  DEV TOOLS — Route Testing & Debugging
    // ═══════════════════════════════════════════════════════════
    ...(isDevelopmentBuild
      ? [
          { path: 'dev/route-checker', Component: RouteChecker },
          { path: 'dev/performance-monitor', Component: PerformanceMonitor },
        ]
      : []),

    // ═══════════════════════════════════════════════════════════
    //  STAKING — Lazy Loaded Routes
    // ═══════════════════════════════════════════════════════════
    ...createEarnRoutes(),
    ...createDCARoutes(),
    ...createTradingRoutes(),
    ...createLaunchpadRoutes(),
  ];
}
