import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { isDevelopmentBuild } from '@/shared/config/env';
import { IntegrationPendingPage } from '../pages/system/IntegrationPendingPage';
import { createMarketProtectedRoutes } from '@/features/market/routes';

// Các URL chưa có contract backend giữ nguyên để không phá public navigation,
// nhưng chỉ render boundary fail-closed cho tới khi có nguồn dữ liệu server.
const ConvertPage = IntegrationPendingPage;
const FuturesPage = IntegrationPendingPage;
const LeveragePage = IntegrationPendingPage;
// This screen still creates client-side demo bots without a backend contract.
const TradingBotsPage = IntegrationPendingPage;
const RiskManagementDemoPage = IntegrationPendingPage;
const ExecutionQualityDemoPage = IntegrationPendingPage;
const AdvancedToolsDemoPage = IntegrationPendingPage;
const ProviderApplicationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/trading/pages/CopyFrontendStatusPages').then((m) => ({
        default: m.ProviderApplicationPage,
      })),
    )
  : IntegrationPendingPage;
const CopyNotificationsPage = IntegrationPendingPage;
const PerformanceAttributionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/trading/pages/CopyFrontendStatusPages').then((m) => ({
        default: m.PerformanceAttributionPage,
      })),
    )
  : IntegrationPendingPage;
const ProviderGovernancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/trading/pages/CopyFrontendStatusPages').then((m) => ({
        default: m.ProviderGovernancePage,
      })),
    )
  : IntegrationPendingPage;
const CopySafetyCenterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/features/trading/pages/CopyFrontendStatusPages').then((m) => ({
        default: m.CopySafetyCenterPage,
      })),
    )
  : IntegrationPendingPage;
const MarginTradingPage = IntegrationPendingPage;

// ─── Margin Trading - P1 & P2 Advanced Features ───
const AdvancedTradingDemoPage = IntegrationPendingPage;
const MarketDataAnalyticsPage = IntegrationPendingPage;
const MarginTradingHubPage = IntegrationPendingPage;
const LiveMarketDataAnalyticsPage = IntegrationPendingPage;
const AdvancedAnalyticsPage = IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 1: Transaction Reporting & Best Execution ───
const TransactionReportingPage = IntegrationPendingPage;
const RegulatoryReportsDashboardPage = IntegrationPendingPage;
const ARMIntegrationStatusPage = IntegrationPendingPage;
const BestExecutionReportsPage = IntegrationPendingPage;
const ExecutionVenueAnalysisPage = IntegrationPendingPage;
const SlippageMonitoringPage = IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 2: Client Protection & Governance ───
const ClientCategorizationPage = IntegrationPendingPage;
const ProductGovernancePage = IntegrationPendingPage;
const TargetMarketDefinitionPage = IntegrationPendingPage;
const ClientMoneyProtectionPage = IntegrationPendingPage;
const CASSReconciliationPage = IntegrationPendingPage;
const InvestorCompensationPage = IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 3: Cost Transparency & KID ───
const ExAnteCostsPage = IntegrationPendingPage;
const RIYCalculatorPage = IntegrationPendingPage;
const ExPostCostsReportPage = IntegrationPendingPage;
const KIDGeneratorPage = IntegrationPendingPage;
const PerformanceScenariosPage = IntegrationPendingPage;
const RiskIndicatorExplainerPage = IntegrationPendingPage;

// ─── Copy Trading - Phase 4 Sprint 4: Complaints & Audit Trail ───
const ComplaintsHandlingPage = IntegrationPendingPage;
const ComplaintSubmissionPage = IntegrationPendingPage;
const ComplaintTrackingPage = IntegrationPendingPage;
const OmbudsmanReferralPage = IntegrationPendingPage;
const AuditTrailPage = IntegrationPendingPage;
const RegulatoryInspectionReadyPage = IntegrationPendingPage;

// ─── Trade Sprint 1B-3: Enhanced Trading Features ───
const TradeHistoryExportPage = IntegrationPendingPage;

// ─── Trading Bots Sub-pages (Phase 1: Compliance MVP) ───
const BotTermsOfServicePage = IntegrationPendingPage;
const BotRiskDisclosurePage = IntegrationPendingPage;
const BotSuitabilityAssessmentPage = IntegrationPendingPage;
const BotRiskDashboardPage = IntegrationPendingPage;
const BotEmergencyStopPage = IntegrationPendingPage;
const BotSecuritySettingsPage = IntegrationPendingPage;
const BotHistoryPage = IntegrationPendingPage;
const BotPerformanceAnalyticsPage = IntegrationPendingPage;

// ─── Trading Bots Sub-pages (Phase 2: Analytics & Optimization) ───
const BotBacktestingPage = IntegrationPendingPage;
const BotStrategyComparePage = IntegrationPendingPage;
const BotOptimizationPage = IntegrationPendingPage;
const BotPortfolioDashboardPage = IntegrationPendingPage;
const BotDrawdownAnalyzerPage = IntegrationPendingPage;
const BotEquityCurvePage = IntegrationPendingPage;

// ─── Trading Bots Sub-pages (Phase 3: Polish & Enterprise) ───
const BotGuidePage = IntegrationPendingPage;
const BotFAQPage = IntegrationPendingPage;
const BotTaxReportingPage = IntegrationPendingPage;
const BotAPIDocumentationPage = IntegrationPendingPage;

/** Compose authenticated trading routes while keeping unbacked URLs explicit and fail-closed. */
export function createTradingProtectedRoutes(
  tradePage: NonNullable<RouteObject['Component']>,
): RouteObject[] {
  return [
    { path: 'trade', Component: tradePage },
    { path: 'trade/:pairId', Component: tradePage },
    { path: 'trade/export', Component: TradeHistoryExportPage },
    ...createMarketProtectedRoutes(),
    { path: 'trade/convert', Component: ConvertPage },
    { path: 'trade/:pairId/futures', Component: FuturesPage },
    { path: 'trade/:pairId/futures/leverage', Component: LeveragePage },
    { path: 'trade/bots', Component: TradingBotsPage },
    { path: 'trade/risk-management', Component: RiskManagementDemoPage },
    { path: 'trade/execution-quality', Component: ExecutionQualityDemoPage },
    { path: 'trade/advanced-tools', Component: AdvancedToolsDemoPage },
    { path: 'trade/copy-trading/settings', Component: IntegrationPendingPage },
    { path: 'trade/copy-trading/notifications', Component: CopyNotificationsPage },
    { path: 'trade/copy-provider-apply', Component: ProviderApplicationPage },
    { path: 'trade/copy-performance/:copyId/attribution', Component: PerformanceAttributionPage },
    { path: 'trade/copy-audit-log/:copyId', Component: IntegrationPendingPage },
    { path: 'trade/copy-trading/risk-analysis', Component: IntegrationPendingPage },
    { path: 'trade/copy-trading/safety', Component: IntegrationPendingPage },
    { path: 'trade/copy-provider-governance', Component: ProviderGovernancePage },
    { path: 'trade/copy-dispute-resolution', Component: IntegrationPendingPage },
    { path: 'trade/copy-safety-center', Component: CopySafetyCenterPage },
    { path: 'trade/copy-regulatory-disclosures', Component: IntegrationPendingPage },
    { path: 'trade/margin', Component: MarginTradingPage },
    { path: 'trade/margin/:pairId', Component: MarginTradingPage },

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
