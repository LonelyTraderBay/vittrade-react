import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { isDevelopmentBuild } from '../config/env';
import { IntegrationPendingPage } from '../pages/system/IntegrationPendingPage';
import { createMarketProtectedRoutes } from '@/features/market/routes';

const OrdersHistoryPage = lazy(() =>
  import('@/features/trading/pages/OrdersHistoryPage').then((m) => ({
    default: m.OrdersHistoryPage,
  })),
);
// Các implementation dưới đây còn dùng dữ liệu mô phỏng hoặc chưa có contract hoàn chỉnh.
// Vite sẽ loại nhánh import development khỏi staging/production build.
const ConvertPage = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/trading/ConvertPage').then((m) => ({ default: m.ConvertPage })))
  : IntegrationPendingPage;
const FuturesPage = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/trading/FuturesPage').then((m) => ({ default: m.FuturesPage })))
  : IntegrationPendingPage;
const LeveragePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/LeveragePage').then((m) => ({ default: m.LeveragePage })),
    )
  : IntegrationPendingPage;
// This screen still creates client-side demo bots without a backend contract.
const TradingBotsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/TradingBotsDemoPage').then((m) => ({
        default: m.TradingBotsDemoPage,
      })),
    )
  : IntegrationPendingPage;
const CopyTradingPageV2 = lazy(() =>
  import('@/features/trading/pages/CopyTradingPage').then((m) => ({ default: m.CopyTradingPage })),
);
const RiskManagementDemoPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/RiskManagementDemoPage').then((m) => ({
        default: m.RiskManagementDemoPage,
      })),
    )
  : IntegrationPendingPage;
const ExecutionQualityDemoPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ExecutionQualityDemoPage').then((m) => ({
        default: m.ExecutionQualityDemoPage,
      })),
    )
  : IntegrationPendingPage;
const AdvancedToolsDemoPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/AdvancedToolsDemoPage').then((m) => ({
        default: m.AdvancedToolsDemoPage,
      })),
    )
  : IntegrationPendingPage;
const CopyPerformancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/CopyPerformancePage').then((m) => ({
        default: m.CopyPerformancePage,
      })),
    )
  : IntegrationPendingPage;
const ProviderApplicationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trade/ProviderApplicationPage').then((m) => ({
        default: m.ProviderApplicationPage,
      })),
    )
  : IntegrationPendingPage;
const CopySettingsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/CopySettingsPage').then((m) => ({
        default: m.CopySettingsPage,
      })),
    )
  : IntegrationPendingPage;
const CopyNotificationsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/CopyNotificationsPage').then((m) => ({
        default: m.CopyNotificationsPage,
      })),
    )
  : IntegrationPendingPage;
const PerformanceAttributionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/PerformanceAttributionPage').then((m) => ({
        default: m.PerformanceAttributionPage,
      })),
    )
  : IntegrationPendingPage;
const CopyAuditLogPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/CopyAuditLogPage').then((m) => ({
        default: m.CopyAuditLogPage,
      })),
    )
  : IntegrationPendingPage;
const PortfolioRiskAnalysisPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/PortfolioRiskAnalysisPage').then((m) => ({
        default: m.PortfolioRiskAnalysisPage,
      })),
    )
  : IntegrationPendingPage;
const ProviderLeaderboardPage = lazy(() =>
  import('@/features/trading/pages/ProviderLeaderboardPage').then((m) => ({
    default: m.ProviderLeaderboardPage,
  })),
);
const SafetyEducationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trade/SafetyEducationPage').then((m) => ({
        default: m.SafetyEducationPage,
      })),
    )
  : IntegrationPendingPage;
const ProviderGovernancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trade/ProviderGovernancePage').then((m) => ({
        default: m.ProviderGovernancePage,
      })),
    )
  : IntegrationPendingPage;
const DisputeResolutionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/DisputeResolutionPage').then((m) => ({
        default: m.DisputeResolutionPage,
      })),
    )
  : IntegrationPendingPage;
const CopySafetyCenterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trade/CopySafetyCenterPage').then((m) => ({
        default: m.CopySafetyCenterPage,
      })),
    )
  : IntegrationPendingPage;
const RegulatoryDisclosuresPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/RegulatoryDisclosuresPage').then((m) => ({
        default: m.RegulatoryDisclosuresPage,
      })),
    )
  : IntegrationPendingPage;
const MarginTradingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/MarginTradingPage').then((m) => ({
        default: m.MarginTradingPage,
      })),
    )
  : IntegrationPendingPage;
const TraderProfilePage = lazy(() =>
  import('@/features/trading/pages/TraderProfilePage').then((m) => ({
    default: m.TraderProfilePage,
  })),
);

// ─── Margin Trading - P1 & P2 Advanced Features ───
const AdvancedTradingDemoPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/AdvancedTradingDemoPage').then((m) => ({
        default: m.AdvancedTradingDemoPage,
      })),
    )
  : IntegrationPendingPage;
const MarketDataAnalyticsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/MarketDataAnalyticsPage').then((m) => ({
        default: m.MarketDataAnalyticsPage,
      })),
    )
  : IntegrationPendingPage;
const MarginTradingHubPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/MarginTradingHubPage').then((m) => ({
        default: m.MarginTradingHubPage,
      })),
    )
  : IntegrationPendingPage;
const LiveMarketDataAnalyticsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/LiveMarketDataAnalyticsPage').then((m) => ({
        default: m.LiveMarketDataAnalyticsPage,
      })),
    )
  : IntegrationPendingPage;
const AdvancedAnalyticsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/AdvancedAnalyticsPage').then((m) => ({
        default: m.AdvancedAnalyticsPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 1: Transaction Reporting & Best Execution ───
const TransactionReportingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/TransactionReportingPage').then((m) => ({
        default: m.TransactionReportingPage,
      })),
    )
  : IntegrationPendingPage;
const RegulatoryReportsDashboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trade/RegulatoryReportsDashboardPage').then((m) => ({
        default: m.RegulatoryReportsDashboardPage,
      })),
    )
  : IntegrationPendingPage;
const ARMIntegrationStatusPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ARMIntegrationStatusPage').then((m) => ({
        default: m.ARMIntegrationStatusPage,
      })),
    )
  : IntegrationPendingPage;
const BestExecutionReportsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/BestExecutionReportsPage').then((m) => ({
        default: m.BestExecutionReportsPage,
      })),
    )
  : IntegrationPendingPage;
const ExecutionVenueAnalysisPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ExecutionVenueAnalysisPage').then((m) => ({
        default: m.ExecutionVenueAnalysisPage,
      })),
    )
  : IntegrationPendingPage;
const SlippageMonitoringPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/SlippageMonitoringPage').then((m) => ({
        default: m.SlippageMonitoringPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 2: Client Protection & Governance ───
const ClientCategorizationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ClientCategorizationPage').then((m) => ({
        default: m.ClientCategorizationPage,
      })),
    )
  : IntegrationPendingPage;
const ProductGovernancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ProductGovernancePage').then((m) => ({
        default: m.ProductGovernancePage,
      })),
    )
  : IntegrationPendingPage;
const TargetMarketDefinitionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/TargetMarketDefinitionPage').then((m) => ({
        default: m.TargetMarketDefinitionPage,
      })),
    )
  : IntegrationPendingPage;
const ClientMoneyProtectionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ClientMoneyProtectionPage').then((m) => ({
        default: m.ClientMoneyProtectionPage,
      })),
    )
  : IntegrationPendingPage;
const CASSReconciliationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/CASSReconciliationPage').then((m) => ({
        default: m.CASSReconciliationPage,
      })),
    )
  : IntegrationPendingPage;
const InvestorCompensationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/InvestorCompensationPage').then((m) => ({
        default: m.InvestorCompensationPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 3: Cost Transparency & KID ───
const ExAnteCostsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ExAnteCostsPage').then((m) => ({ default: m.ExAnteCostsPage })),
    )
  : IntegrationPendingPage;
const RIYCalculatorPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/RIYCalculatorPage').then((m) => ({
        default: m.RIYCalculatorPage,
      })),
    )
  : IntegrationPendingPage;
const ExPostCostsReportPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ExPostCostsReportPage').then((m) => ({
        default: m.ExPostCostsReportPage,
      })),
    )
  : IntegrationPendingPage;
const KIDGeneratorPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/KIDGeneratorPage').then((m) => ({
        default: m.KIDGeneratorPage,
      })),
    )
  : IntegrationPendingPage;
const PerformanceScenariosPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/PerformanceScenariosPage').then((m) => ({
        default: m.PerformanceScenariosPage,
      })),
    )
  : IntegrationPendingPage;
const RiskIndicatorExplainerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/RiskIndicatorExplainerPage').then((m) => ({
        default: m.RiskIndicatorExplainerPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 4: Complaints & Audit Trail ───
const ComplaintsHandlingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ComplaintsHandlingPage').then((m) => ({
        default: m.ComplaintsHandlingPage,
      })),
    )
  : IntegrationPendingPage;
const ComplaintSubmissionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ComplaintSubmissionPage').then((m) => ({
        default: m.ComplaintSubmissionPage,
      })),
    )
  : IntegrationPendingPage;
const ComplaintTrackingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/ComplaintTrackingPage').then((m) => ({
        default: m.ComplaintTrackingPage,
      })),
    )
  : IntegrationPendingPage;
const OmbudsmanReferralPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/OmbudsmanReferralPage').then((m) => ({
        default: m.OmbudsmanReferralPage,
      })),
    )
  : IntegrationPendingPage;
const AuditTrailPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/AuditTrailPage').then((m) => ({ default: m.AuditTrailPage })),
    )
  : IntegrationPendingPage;
const RegulatoryInspectionReadyPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/RegulatoryInspectionReadyPage').then((m) => ({
        default: m.RegulatoryInspectionReadyPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Trade Sprint 1B-3: Enhanced Trading Features ───
const OrderReceiptPage = lazy(() =>
  import('@/features/trading/pages/OrderReceiptPage').then((m) => ({
    default: m.OrderReceiptPage,
  })),
);
const TradeSettingsPage = lazy(() =>
  import('@/features/trading/pages/TradeSettingsPage').then((m) => ({
    default: m.TradeSettingsPage,
  })),
);
const PositionDashboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/PositionDashboardPage').then((m) => ({
        default: m.PositionDashboardPage,
      })),
    )
  : IntegrationPendingPage;
const TradeHistoryExportPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/TradeHistoryExportPage').then((m) => ({
        default: m.TradeHistoryExportPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Trading Bots Sub-pages (Phase 1: Compliance MVP) ───
const BotTermsOfServicePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotTermsOfServicePage').then((m) => ({
        default: m.BotTermsOfServicePage,
      })),
    )
  : IntegrationPendingPage;
const BotRiskDisclosurePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotRiskDisclosurePage').then((m) => ({
        default: m.BotRiskDisclosurePage,
      })),
    )
  : IntegrationPendingPage;
const BotSuitabilityAssessmentPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotSuitabilityAssessmentPage').then((m) => ({
        default: m.BotSuitabilityAssessmentPage,
      })),
    )
  : IntegrationPendingPage;
const BotRiskDashboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotRiskDashboardPage').then((m) => ({
        default: m.BotRiskDashboardPage,
      })),
    )
  : IntegrationPendingPage;
const BotEmergencyStopPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotEmergencyStopPage').then((m) => ({
        default: m.BotEmergencyStopPage,
      })),
    )
  : IntegrationPendingPage;
const BotSecuritySettingsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotSecuritySettingsPage').then((m) => ({
        default: m.BotSecuritySettingsPage,
      })),
    )
  : IntegrationPendingPage;
const BotHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotHistoryPage').then((m) => ({
        default: m.BotHistoryPage,
      })),
    )
  : IntegrationPendingPage;
const BotPerformanceAnalyticsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotPerformanceAnalyticsPage').then((m) => ({
        default: m.BotPerformanceAnalyticsPage,
      })),
    )
  : IntegrationPendingPage;

// ─── Trading Bots Sub-pages (Phase 2: Analytics & Optimization) ───
const BotBacktestingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotBacktestingPage').then((m) => ({
        default: m.BotBacktestingPage,
      })),
    )
  : IntegrationPendingPage;
const BotStrategyComparePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotStrategyComparePage').then((m) => ({
        default: m.BotStrategyComparePage,
      })),
    )
  : IntegrationPendingPage;
const BotOptimizationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotOptimizationPage').then((m) => ({
        default: m.BotOptimizationPage,
      })),
    )
  : IntegrationPendingPage;
const BotPortfolioDashboardPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotPortfolioDashboardPage').then((m) => ({
        default: m.BotPortfolioDashboardPage,
      })),
    )
  : IntegrationPendingPage;
const BotDrawdownAnalyzerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotDrawdownAnalyzerPage').then((m) => ({
        default: m.BotDrawdownAnalyzerPage,
      })),
    )
  : IntegrationPendingPage;
const BotEquityCurvePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotEquityCurvePage').then((m) => ({
        default: m.BotEquityCurvePage,
      })),
    )
  : IntegrationPendingPage;

// ─── Trading Bots Sub-pages (Phase 3: Polish & Enterprise) ───
const BotGuidePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotGuidePage').then((m) => ({ default: m.BotGuidePage })),
    )
  : IntegrationPendingPage;
const BotFAQPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotFAQPage').then((m) => ({ default: m.BotFAQPage })),
    )
  : IntegrationPendingPage;
const BotTaxReportingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotTaxReportingPage').then((m) => ({
        default: m.BotTaxReportingPage,
      })),
    )
  : IntegrationPendingPage;
const BotAPIDocumentationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/trading/bots/BotAPIDocumentationPage').then((m) => ({
        default: m.BotAPIDocumentationPage,
      })),
    )
  : IntegrationPendingPage;

/** Compose authenticated trading routes while keeping legacy simulations behind dev guards. */
export function createTradingProtectedRoutes(
  tradePage: NonNullable<RouteObject['Component']>,
): RouteObject[] {
  return [
    { path: 'trade', Component: tradePage },
    { path: 'trade/:pairId', Component: tradePage },
    { path: 'trade/orders-history', Component: OrdersHistoryPage },
    { path: 'trade/order-receipt', Component: OrderReceiptPage },
    { path: 'trade/settings', Component: TradeSettingsPage },
    { path: 'trade/positions', Component: PositionDashboardPage },
    { path: 'trade/export', Component: TradeHistoryExportPage },
    ...createMarketProtectedRoutes(),
    { path: 'trade/convert', Component: ConvertPage },
    { path: 'trade/:pairId/futures', Component: FuturesPage },
    { path: 'trade/:pairId/futures/leverage', Component: LeveragePage },
    { path: 'trade/bots', Component: TradingBotsPage },
    { path: 'trade/risk-management', Component: RiskManagementDemoPage },
    { path: 'trade/execution-quality', Component: ExecutionQualityDemoPage },
    { path: 'trade/advanced-tools', Component: AdvancedToolsDemoPage },
    { path: 'trade/copy-trading/v2', Component: CopyTradingPageV2 },
    { path: 'trade/copy-trading/settings', Component: CopySettingsPage },
    { path: 'trade/copy-trading/notifications', Component: CopyNotificationsPage },
    { path: 'trade/copy-provider-apply', Component: ProviderApplicationPage },
    { path: 'trade/copy-performance/:copyId', Component: CopyPerformancePage },
    { path: 'trade/copy-performance/:copyId/attribution', Component: PerformanceAttributionPage },
    { path: 'trade/copy-audit-log/:copyId', Component: CopyAuditLogPage },
    { path: 'trade/copy-trading/risk-analysis', Component: PortfolioRiskAnalysisPage },
    { path: 'trade/copy-trading/leaderboard', Component: ProviderLeaderboardPage },
    { path: 'trade/copy-trading/safety', Component: SafetyEducationPage },
    { path: 'trade/copy-provider-governance', Component: ProviderGovernancePage },
    { path: 'trade/copy-dispute-resolution', Component: DisputeResolutionPage },
    { path: 'trade/copy-safety-center', Component: CopySafetyCenterPage },
    { path: 'trade/copy-regulatory-disclosures', Component: RegulatoryDisclosuresPage },
    { path: 'trade/margin', Component: MarginTradingPage },
    { path: 'trade/margin/:pairId', Component: MarginTradingPage },
    { path: 'trade/trader/:traderId', Component: TraderProfilePage },

    // ─── Margin Trading - P1 & P2 Advanced Features ───
    { path: 'trade/margin/advanced-demo', Component: AdvancedTradingDemoPage },
    { path: 'trade/margin/market-data-analytics', Component: MarketDataAnalyticsPage },
    { path: 'trade/margin/hub', Component: MarginTradingHubPage },
    { path: 'trade/margin/live-market-data-analytics', Component: LiveMarketDataAnalyticsPage },
    { path: 'trade/margin/advanced-analytics', Component: AdvancedAnalyticsPage },

    // ─── Copy Trading - Phase 4 Sprint 1: Transaction Reporting & Best Execution ───
    { path: 'trade/copy-trading/transaction-reporting', Component: TransactionReportingPage },
    {
      path: 'trade/copy-trading/regulatory-reports-dashboard',
      Component: RegulatoryReportsDashboardPage,
    },
    { path: 'trade/copy-trading/arm-integration-status', Component: ARMIntegrationStatusPage },
    { path: 'trade/copy-trading/best-execution-reports', Component: BestExecutionReportsPage },
    { path: 'trade/copy-trading/execution-venue-analysis', Component: ExecutionVenueAnalysisPage },
    { path: 'trade/copy-trading/slippage-monitoring', Component: SlippageMonitoringPage },

    // ─── Copy Trading - Phase 4 Sprint 2: Client Protection & Governance ───
    { path: 'trade/copy-trading/client-categorization', Component: ClientCategorizationPage },
    { path: 'trade/copy-trading/product-governance', Component: ProductGovernancePage },
    { path: 'trade/copy-trading/target-market-definition', Component: TargetMarketDefinitionPage },
    { path: 'trade/copy-trading/client-money-protection', Component: ClientMoneyProtectionPage },
    { path: 'trade/copy-trading/cass-reconciliation', Component: CASSReconciliationPage },
    { path: 'trade/copy-trading/investor-compensation', Component: InvestorCompensationPage },

    // ─── Copy Trading - Phase 4 Sprint 3: Cost Transparency & KID ───
    { path: 'trade/copy-trading/ex-ante-costs', Component: ExAnteCostsPage },
    { path: 'trade/copy-trading/riy-calculator', Component: RIYCalculatorPage },
    { path: 'trade/copy-trading/ex-post-costs-report', Component: ExPostCostsReportPage },
    { path: 'trade/copy-trading/kid-generator', Component: KIDGeneratorPage },
    { path: 'trade/copy-trading/performance-scenarios', Component: PerformanceScenariosPage },
    { path: 'trade/copy-trading/risk-indicator-explainer', Component: RiskIndicatorExplainerPage },

    // ─── Copy Trading - Phase 4 Sprint 4: Complaints & Audit Trail ───
    { path: 'trade/copy-trading/complaints-handling', Component: ComplaintsHandlingPage },
    { path: 'trade/copy-trading/complaint-submission', Component: ComplaintSubmissionPage },
    { path: 'trade/copy-trading/complaint-tracking', Component: ComplaintTrackingPage },
    { path: 'trade/copy-trading/ombudsman-referral', Component: OmbudsmanReferralPage },
    { path: 'trade/copy-trading/audit-trail', Component: AuditTrailPage },
    {
      path: 'trade/copy-trading/regulatory-inspection-ready',
      Component: RegulatoryInspectionReadyPage,
    },

    // ─── Trading Bots Sub-pages (Phase 1: Compliance MVP) ───
    { path: 'trade/bots/terms-of-service', Component: BotTermsOfServicePage },
    { path: 'trade/bots/risk-disclosure', Component: BotRiskDisclosurePage },
    { path: 'trade/bots/suitability-assessment', Component: BotSuitabilityAssessmentPage },
    { path: 'trade/bots/risk-dashboard', Component: BotRiskDashboardPage },
    { path: 'trade/bots/emergency-stop', Component: BotEmergencyStopPage },
    { path: 'trade/bots/security-settings', Component: BotSecuritySettingsPage },
    { path: 'trade/bots/history', Component: BotHistoryPage },
    { path: 'trade/bots/performance-analytics', Component: BotPerformanceAnalyticsPage },

    // ─── Trading Bots Sub-pages (Phase 2: Analytics & Optimization) ───
    { path: 'trade/bots/backtesting', Component: BotBacktestingPage },
    { path: 'trade/bots/strategy-compare', Component: BotStrategyComparePage },
    { path: 'trade/bots/optimization', Component: BotOptimizationPage },
    { path: 'trade/bots/portfolio-dashboard', Component: BotPortfolioDashboardPage },
    { path: 'trade/bots/drawdown-analyzer', Component: BotDrawdownAnalyzerPage },
    { path: 'trade/bots/equity-curve', Component: BotEquityCurvePage },

    // ─── Trading Bots Sub-pages (Phase 3: Polish & Enterprise) ───
    { path: 'trade/bots/guide', Component: BotGuidePage },
    { path: 'trade/bots/faq', Component: BotFAQPage },
    { path: 'trade/bots/tax-reporting', Component: BotTaxReportingPage },
    { path: 'trade/bots/api-documentation', Component: BotAPIDocumentationPage },
  ];
}
