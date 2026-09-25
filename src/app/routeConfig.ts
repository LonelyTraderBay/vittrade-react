import { lazy } from 'react';
import React from 'react';
import type { RouteObject } from 'react-router';
import { isDevelopmentBuild } from './config/env';
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
// Registration has no backend contract yet; keep the legacy flow development-only.
const RegisterPage = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })))
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
const PredictionMarketMakerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionMarketMakerPage').then((m) => ({
        default: m.PredictionMarketMakerPage,
      })),
    )
  : IntegrationPendingPage;
const PredictionPortfolioAnalyzerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionPortfolioAnalyzerPage').then((m) => ({
        default: m.PredictionPortfolioAnalyzerPage,
      })),
    )
  : IntegrationPendingPage;
const PredictionEventCalendarPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionEventCalendarPage').then((m) => ({
        default: m.PredictionEventCalendarPage,
      })),
    )
  : IntegrationPendingPage;
const PredictionSocialPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionSocialPage').then((m) => ({
        default: m.PredictionSocialPage,
      })),
    )
  : IntegrationPendingPage;
const PredictionAdvancedChartPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionAdvancedChartPage').then((m) => ({
        default: m.PredictionAdvancedChartPage,
      })),
    )
  : IntegrationPendingPage;
const PredictionTournamentsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionTournamentsPage').then((m) => ({
        default: m.PredictionTournamentsPage,
      })),
    )
  : IntegrationPendingPage;
const PredictionDataIntegrationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/predictions/PredictionDataIntegrationPage').then((m) => ({
        default: m.PredictionDataIntegrationPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Arena Pages (26 pages) ───
const ArenaHomePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaHomePage').then((m) => ({ default: m.ArenaHomePage })),
    )
  : IntegrationPendingPage;
const ArenaStudioPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaStudioPage').then((m) => ({ default: m.ArenaStudioPage })),
    )
  : IntegrationPendingPage;
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
const ArenaResolutionCenterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaResolutionCenterPage').then((m) => ({
        default: m.ArenaResolutionCenterPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaCreatorPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaCreatorPage').then((m) => ({ default: m.ArenaCreatorPage })),
    )
  : IntegrationPendingPage;
const ArenaLeaderboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaLeaderboardPage').then((m) => ({
        default: m.ArenaLeaderboardPage,
      })),
    )
  : IntegrationPendingPage;
const VerifiedChallengesPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/VerifiedChallengesPage').then((m) => ({
        default: m.VerifiedChallengesPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaPointsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaPointsPage').then((m) => ({ default: m.ArenaPointsPage })),
    )
  : IntegrationPendingPage;
const ArenaFlowMapPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaFlowMapPage').then((m) => ({ default: m.ArenaFlowMapPage })),
    )
  : IntegrationPendingPage;
const ArenaSafetyCenterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaSafetyCenterPage').then((m) => ({
        default: m.ArenaSafetyCenterPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaTrustBreakdownPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaTrustBreakdownPage').then((m) => ({
        default: m.ArenaTrustBreakdownPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaPointsLedgerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaPointsLedgerPage').then((m) => ({
        default: m.ArenaPointsLedgerPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaPointsEntryDetailPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaPointsEntryDetailPage').then((m) => ({
        default: m.ArenaPointsEntryDetailPage,
      })),
    )
  : IntegrationPendingPage;
const MyArenaPage = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/arena/MyArenaPage').then((m) => ({ default: m.MyArenaPage })))
  : IntegrationPendingPage;
const ArenaReportCasePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaReportCasePage').then((m) => ({
        default: m.ArenaReportCasePage,
      })),
    )
  : IntegrationPendingPage;
const ArenaBlockedUsersPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaBlockedUsersPage').then((m) => ({
        default: m.ArenaBlockedUsersPage,
      })),
    )
  : IntegrationPendingPage;
const MyArenaReportsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/MyArenaReportsPage').then((m) => ({
        default: m.MyArenaReportsPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaProductionReadyPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaProductionReadyPage').then((m) => ({
        default: m.ArenaProductionReadyPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaPredictionBridgeFoundationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaPredictionBridgeFoundationPage').then((m) => ({
        default: m.ArenaPredictionBridgeFoundationPage,
      })),
    )
  : IntegrationPendingPage;
const ConnectedEcosystemProductionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ConnectedEcosystemProductionPage').then((m) => ({
        default: m.ConnectedEcosystemProductionPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaSmartRuleBuilderPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaSmartRuleBuilderPage').then((m) => ({
        default: m.ArenaSmartRuleBuilderPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaUniversalPresetLibraryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaUniversalPresetLibraryPage').then((m) => ({
        default: m.ArenaUniversalPresetLibraryPage,
      })),
    )
  : IntegrationPendingPage;
const ArenaGovernanceGatePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaGovernanceGatePage').then((m) => ({
        default: m.ArenaGovernanceGatePage,
      })),
    )
  : IntegrationPendingPage;
const ArenaGuidePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/arena/ArenaGuidePage').then((m) => ({ default: m.ArenaGuidePage })),
    )
  : IntegrationPendingPage;

// ─── DCA Pages ───
const DCAPage = lazy(() => import('./pages/dca/DCAPage'));
const dcaDevelopmentRoutes: RouteObject[] = isDevelopmentBuild
  ? [
      {
        path: 'dca/rebalance/config',
        Component: lazy(() => import('@/dev/legacy/dca/DCARebalanceConfig')),
      },
      {
        path: 'dca/rebalance/:configId',
        Component: lazy(() => import('@/dev/legacy/dca/DCARebalanceDashboard')),
      },
      {
        path: 'dca/schedule/config',
        Component: lazy(() => import('@/dev/legacy/dca/DCAScheduleConfig')),
      },
      {
        path: 'dca/schedule/:configId',
        Component: lazy(() => import('@/dev/legacy/dca/DCAScheduleAnalytics')),
      },
      {
        path: 'dca/portfolio-optimizer',
        Component: lazy(() => import('@/dev/legacy/dca/DCAPortfolioOptimizer')),
      },
      {
        path: 'dca/dynamic-amount',
        Component: lazy(() => import('@/dev/legacy/dca/DCADynamicAmount')),
      },
      {
        path: 'dca/backtester',
        Component: lazy(() =>
          import('@/dev/legacy/dca/DCABacktesterPage').then((m) => ({
            default: m.DCABacktesterPage,
          })),
        ),
      },
      {
        path: 'dca/multi-asset',
        Component: lazy(() =>
          import('@/dev/legacy/dca/DCAMultiAssetPage').then((m) => ({
            default: m.DCAMultiAssetPage,
          })),
        ),
      },
      {
        path: 'dca/performance-compare',
        Component: lazy(() =>
          import('@/dev/legacy/dca/DCAPerformanceComparePage').then((m) => ({
            default: m.DCAPerformanceComparePage,
          })),
        ),
      },
      {
        path: 'dca/smart-rules',
        Component: lazy(() =>
          import('@/dev/legacy/dca/DCASmartRulesPage').then((m) => ({
            default: m.DCASmartRulesPage,
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
const UnifiedPortfolioDashboard = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/cross-module/UnifiedPortfolioDashboard').then((m) => ({
        default: m.UnifiedPortfolioDashboard,
      })),
    )
  : IntegrationPendingPage;
const CrossModuleAnalytics = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/cross-module/CrossModuleAnalytics').then((m) => ({
        default: m.CrossModuleAnalytics,
      })),
    )
  : IntegrationPendingPage;
const SmartAlertCenter = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/cross-module/SmartAlertCenter').then((m) => ({
        default: m.SmartAlertCenter,
      })),
    )
  : IntegrationPendingPage;
const TaxReportCenter = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/cross-module/TaxReportCenter').then((m) => ({
        default: m.TaxReportCenter,
      })),
    )
  : IntegrationPendingPage;

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
const RouteChecker = lazy(() =>
  import('./components/dev/RouteChecker').then((m) => ({ default: m.RouteChecker })),
);
const PerformanceMonitor = lazy(() =>
  import('./components/dev/PerformanceMonitor').then((m) => ({ default: m.PerformanceMonitor })),
);

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
const ReferralHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/referral/ReferralHistoryPage').then((m) => ({
        default: m.ReferralHistoryPage,
      })),
    )
  : IntegrationPendingPage;
const ReferralRewardsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/referral/ReferralRewardsPage').then((m) => ({
        default: m.ReferralRewardsPage,
      })),
    )
  : IntegrationPendingPage;
const ReferralRulesPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/referral/ReferralRulesPage').then((m) => ({
        default: m.ReferralRulesPage,
      })),
    )
  : IntegrationPendingPage;
const ReferralFriendDetailPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/referral/ReferralFriendDetailPage').then((m) => ({
        default: m.ReferralFriendDetailPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadReceiptPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadReceiptPage').then((m) => ({
        default: m.LaunchpadReceiptPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadPortfolioPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadPortfolioPage').then((m) => ({
        default: m.LaunchpadPortfolioPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadPerformancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadPerformancePage').then((m) => ({
        default: m.LaunchpadPerformancePage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadStakingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadStakingPage').then((m) => ({
        default: m.LaunchpadStakingPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadIDOBridgePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadIDOBridgePage').then((m) => ({
        default: m.LaunchpadIDOBridgePage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadClaimReceiptPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadClaimReceiptPage').then((m) => ({
        default: m.LaunchpadClaimReceiptPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadBridgeOrderPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadBridgeOrderPage').then((m) => ({
        default: m.LaunchpadBridgeOrderPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadBatchClaimPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadBatchClaimPage').then((m) => ({
        default: m.LaunchpadBatchClaimPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadBridgeComparePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadBridgeComparePage').then((m) => ({
        default: m.LaunchpadBridgeComparePage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadNotifSoundPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadNotifSoundPage').then((m) => ({
        default: m.LaunchpadNotifSoundPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadEventLogPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadEventLogPage').then((m) => ({
        default: m.LaunchpadEventLogPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadABIDiffPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadABIDiffPage').then((m) => ({
        default: m.LaunchpadABIDiffPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadAddressBookPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadAddressBookPage').then((m) => ({
        default: m.LaunchpadAddressBookPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadWebhooksPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadWebhooksPage').then((m) => ({
        default: m.LaunchpadWebhooksPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadGasTrackerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadGasTrackerPage').then((m) => ({
        default: m.LaunchpadGasTrackerPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadRebalancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadRebalancePage').then((m) => ({
        default: m.LaunchpadRebalancePage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadMultisigPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadMultisigPage').then((m) => ({
        default: m.LaunchpadMultisigPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadSwapAggregatorPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadSwapAggregatorPage').then((m) => ({
        default: m.LaunchpadSwapAggregatorPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadLimitOrdersPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadLimitOrdersPage').then((m) => ({
        default: m.LaunchpadLimitOrdersPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadDCABuilderPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadDCABuilderPage').then((m) => ({
        default: m.LaunchpadDCABuilderPage,
      })),
    )
  : IntegrationPendingPage;
const LaunchpadRiskAnalyticsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/launchpad/LaunchpadRiskAnalyticsPage').then((m) => ({
        default: m.LaunchpadRiskAnalyticsPage,
      })),
    )
  : IntegrationPendingPage;
const RewardsHubPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/rewards/RewardsHubPage').then((m) => ({ default: m.RewardsHubPage })),
    )
  : IntegrationPendingPage;
// Các màn hình này còn dùng fixture tĩnh; chỉ expose trong development cho đến
// khi market contract định nghĩa freshness, provenance và authorization.
const MarketCalendarPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/MarketCalendarPage').then((m) => ({
        default: m.MarketCalendarPage,
      })),
    )
  : IntegrationPendingPage;
const DerivativesOverviewPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/DerivativesOverviewPage').then((m) => ({
        default: m.DerivativesOverviewPage,
      })),
    )
  : IntegrationPendingPage;
const SocialSentimentPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/SocialSentimentPage').then((m) => ({
        default: m.SocialSentimentPage,
      })),
    )
  : IntegrationPendingPage;
const PortfolioTrackerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/PortfolioTrackerPage').then((m) => ({
        default: m.PortfolioTrackerPage,
      })),
    )
  : IntegrationPendingPage;
const MarketNewsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/MarketNewsPage').then((m) => ({ default: m.MarketNewsPage })),
    )
  : IntegrationPendingPage;
const TokenUnlocksPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/TokenUnlocksPage').then((m) => ({ default: m.TokenUnlocksPage })),
    )
  : IntegrationPendingPage;
const SocialSignalsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/SocialSignalsPage').then((m) => ({
        default: m.SocialSignalsPage,
      })),
    )
  : IntegrationPendingPage;
const MarketCorrelationsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/market/MarketCorrelationsPage').then((m) => ({
        default: m.MarketCorrelationsPage,
      })),
    )
  : IntegrationPendingPage;
const EnterpriseStatesPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/responsive/EnterpriseStatesPage').then((m) => ({
        default: m.EnterpriseStatesPage,
      })),
    )
  : IntegrationPendingPage;

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
}

/* ═══════════════════════════════════════════
   PUBLIC ROUTES — pages accessible without login
   ══════════════════════════════════════════ */
export function createPublicRoutes(o: ShellOverrides): RouteObject[] {
  return [
    { path: 'home', Component: o.HomePage },
    {
      path: 'markets',
      children: [
        { index: true, Component: o.MarketListPage },
        { path: 'calendar', Component: MarketCalendarPage },
        { path: 'derivatives', Component: DerivativesOverviewPage },
        { path: 'social-sentiment', Component: SocialSentimentPage },
        { path: 'portfolio-tracker', Component: PortfolioTrackerPage },
        { path: 'news', Component: MarketNewsPage },
        { path: 'unlocks', Component: TokenUnlocksPage },
        { path: 'signals', Component: SocialSignalsPage },
        { path: 'correlations', Component: MarketCorrelationsPage },
        {
          path: 'predictions',
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
            { path: 'market-maker', Component: PredictionMarketMakerPage },
            { path: 'portfolio-analyzer', Component: PredictionPortfolioAnalyzerPage },
            { path: 'event-calendar', Component: PredictionEventCalendarPage },
            { path: 'social', Component: PredictionSocialPage },
            { path: 'advanced-chart/:pairId', Component: PredictionAdvancedChartPage },
            { path: 'tournaments', Component: PredictionTournamentsPage },
            { path: 'data-integration', Component: PredictionDataIntegrationPage },
          ],
        },
      ],
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
    { path: 'arena', Component: ArenaHomePage },
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
    { path: 'referral/history', Component: ReferralHistoryPage },
    { path: 'referral/rewards', Component: ReferralRewardsPage },
    { path: 'referral/rules', Component: ReferralRulesPage },
    { path: 'referral/friend/:friendId', Component: ReferralFriendDetailPage },
    ...createReferralRoutes({ home: ReferralHomePage }),

    // ═══════════════════════════════════════════════════════════
    //  MISC — Notifications, Support, Launchpad, Rewards
    // ═══════════════════════���═══════════════════════════════════
    ...createSupportProtectedRoutes(),
    { path: 'launchpad/portfolio', Component: LaunchpadPortfolioPage },
    { path: 'launchpad/performance', Component: LaunchpadPerformancePage },
    { path: 'launchpad/staking', Component: LaunchpadStakingPage },
    { path: 'launchpad/idobridge/:id', Component: LaunchpadIDOBridgePage },
    { path: 'launchpad/receipt/:subId', Component: LaunchpadReceiptPage },
    { path: 'launchpad/claim-receipt/:positionId', Component: LaunchpadClaimReceiptPage },
    { path: 'launchpad/bridge-order/:txId', Component: LaunchpadBridgeOrderPage },
    { path: 'launchpad/batch-claim', Component: LaunchpadBatchClaimPage },
    { path: 'launchpad/bridge-compare', Component: LaunchpadBridgeComparePage },
    { path: 'launchpad/notif-sound', Component: LaunchpadNotifSoundPage },
    { path: 'launchpad/event-log', Component: LaunchpadEventLogPage },
    { path: 'launchpad/abi-diff/:contractId', Component: LaunchpadABIDiffPage },
    { path: 'launchpad/address-book', Component: LaunchpadAddressBookPage },
    { path: 'launchpad/webhooks', Component: LaunchpadWebhooksPage },
    { path: 'launchpad/gas-tracker', Component: LaunchpadGasTrackerPage },
    { path: 'launchpad/rebalance', Component: LaunchpadRebalancePage },
    { path: 'launchpad/multisig', Component: LaunchpadMultisigPage },
    { path: 'launchpad/swap-aggregator', Component: LaunchpadSwapAggregatorPage },
    { path: 'launchpad/limit-orders', Component: LaunchpadLimitOrdersPage },
    { path: 'launchpad/dca-builder', Component: LaunchpadDCABuilderPage },
    { path: 'launchpad/risk-analytics', Component: LaunchpadRiskAnalyticsPage },
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
