import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { lazyRoute } from '../components/layout/LazyRoute';

/**
 * LAZY LOADED STAKING & EARN ROUTES
 * Bundle size optimization: ~15KB initial → ~500KB lazy loaded
 * All Staking pages loaded on-demand
 */

// ═══════════════════════════════════════════════════════════
//  PHASE 1: COMPLIANCE (5 pages) — ~25KB gzipped
// ═══════════════════════════════════════════════════════════
const StakingTermsPage = lazyRoute(() => import('../pages/earn/StakingTermsPage').then(m => ({ default: m.StakingTermsPage })));
const StakingRiskDisclosurePage = lazyRoute(() => import('../pages/earn/StakingRiskDisclosurePage').then(m => ({ default: m.StakingRiskDisclosurePage })));
const StakingWithdrawalPolicyPage = lazyRoute(() => import('../pages/earn/StakingWithdrawalPolicyPage').then(m => ({ default: m.StakingWithdrawalPolicyPage })));
const StakingTaxGuidePage = lazyRoute(() => import('../pages/earn/StakingTaxGuidePage').then(m => ({ default: m.StakingTaxGuidePage })));
const StakingRiskAssessmentPage = lazyRoute(() => import('../pages/earn/StakingRiskAssessmentPage').then(m => ({ default: m.StakingRiskAssessmentPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 2: PORTFOLIO (4 pages) — ~35KB gzipped (Recharts heavy)
// ═══════════════════════════════════════════════════════════
const StakingDashboardPage = lazyRoute(() => import('../pages/earn/StakingDashboardPage').then(m => ({ default: m.StakingDashboardPage })));
const StakingAnalyticsPage = lazyRoute(() => import('../pages/earn/StakingAnalyticsPage').then(m => ({ default: m.StakingAnalyticsPage })));
const StakingHistoryPage = lazyRoute(() => import('../pages/earn/StakingHistoryPage').then(m => ({ default: m.StakingHistoryPage })));
const StakingEarningsCalendarPage = lazyRoute(() => import('../pages/earn/StakingEarningsCalendarPage').then(m => ({ default: m.StakingEarningsCalendarPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 3: ADVANCED FEATURES (7 pages) — ~40KB gzipped
// ═══════════════════════════════════════════════════════════
const StakingValidatorSelectionPage = lazyRoute(() => import('../pages/earn/StakingValidatorSelectionPage').then(m => ({ default: m.StakingValidatorSelectionPage })));
const StakingAutoCompoundPage = lazyRoute(() => import('../pages/earn/StakingAutoCompoundPage').then(m => ({ default: m.StakingAutoCompoundPage })));
const StakingLiquidStakingPage = lazyRoute(() => import('../pages/earn/StakingLiquidStakingPage').then(m => ({ default: m.StakingLiquidStakingPage })));
const StakingInsurancePage = lazyRoute(() => import('../pages/earn/StakingInsurancePage').then(m => ({ default: m.StakingInsurancePage })));
const StakingAdvancedOrdersPage = lazyRoute(() => import('../pages/earn/StakingAdvancedOrdersPage').then(m => ({ default: m.StakingAdvancedOrdersPage })));
const StakingMultiChainPage = lazyRoute(() => import('../pages/earn/StakingMultiChainPage').then(m => ({ default: m.StakingMultiChainPage })));
const StakingInstitutionalPage = lazyRoute(() => import('../pages/earn/StakingInstitutionalPage').then(m => ({ default: m.StakingInstitutionalPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 4: UX ENHANCEMENTS (4 pages) — ~20KB gzipped
// ══════════════════════════════════════════════════════════
const StakingGuidePage = lazyRoute(() => import('../pages/earn/StakingGuidePage').then(m => ({ default: m.StakingGuidePage })));
const StakingFAQPage = lazyRoute(() => import('../pages/earn/StakingFAQPage').then(m => ({ default: m.StakingFAQPage })));
const StakingNotificationsPage = lazyRoute(() => import('../pages/earn/StakingNotificationsPage').then(m => ({ default: m.StakingNotificationsPage })));
const StakingRecommendationsPage = lazyRoute(() => import('../pages/earn/StakingRecommendationsPage').then(m => ({ default: m.StakingRecommendationsPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 5: REGULATORY (8 pages) — ~45KB gzipped
// ═══════════════════════════════════════════════════════════
const StakingRegulatoryFrameworkPage = lazyRoute(() => import('../pages/earn/StakingRegulatoryFrameworkPage').then(m => ({ default: m.StakingRegulatoryFrameworkPage })));
const StakingAuditReportsPage = lazyRoute(() => import('../pages/earn/StakingAuditReportsPage').then(m => ({ default: m.StakingAuditReportsPage })));
const StakingCustodyPage = lazyRoute(() => import('../pages/earn/StakingCustodyPage').then(m => ({ default: m.StakingCustodyPage })));
const StakingSuitabilityAssessmentPage = lazyRoute(() => import('../pages/earn/StakingSuitabilityAssessmentPage').then(m => ({ default: m.StakingSuitabilityAssessmentPage })));
const StakingInsuranceFundTransparencyPage = lazyRoute(() => import('../pages/earn/StakingInsuranceFundTransparencyPage').then(m => ({ default: m.StakingInsuranceFundTransparencyPage })));
const StakingTransactionReportingPage = lazyRoute(() => import('../pages/earn/StakingTransactionReportingPage').then(m => ({ default: m.StakingTransactionReportingPage })));
const StakingAPIDocumentationPage = lazyRoute(() => import('../pages/earn/StakingAPIDocumentationPage').then(m => ({ default: m.StakingAPIDocumentationPage })));
const StakingProofOfReservesPage = lazyRoute(() => import('../pages/earn/StakingProofOfReservesPage').then(m => ({ default: m.StakingProofOfReservesPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 6: RISK MANAGEMENT (6 pages) — ~38KB gzipped
// ══════════════════════════════════════════════════════════
const StakingRiskDashboardPage = lazyRoute(() => import('../pages/earn/StakingRiskDashboardPage').then(m => ({ default: m.StakingRiskDashboardPage })));
const StakingSlashingHistoryPage = lazyRoute(() => import('../pages/earn/StakingSlashingHistoryPage').then(m => ({ default: m.StakingSlashingHistoryPage })));
const StakingValidatorHealthMonitorPage = lazyRoute(() => import('../pages/earn/StakingValidatorHealthMonitorPage').then(m => ({ default: m.StakingValidatorHealthMonitorPage })));
const StakingRiskScoreCalculatorPage = lazyRoute(() => import('../pages/earn/StakingRiskScoreCalculatorPage').then(m => ({ default: m.StakingRiskScoreCalculatorPage })));
const StakingEmergencyActionsPage = lazyRoute(() => import('../pages/earn/StakingEmergencyActionsPage').then(m => ({ default: m.StakingEmergencyActionsPage })));
const StakingContingencyPlanPage = lazyRoute(() => import('../pages/earn/StakingContingencyPlanPage').then(m => ({ default: m.StakingContingencyPlanPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 7: SOCIAL & COMMUNITY (5 pages) — ~28KB gzipped
// ═══════════════════════════════════════════════════════════
const StakingSocialFeedPage = lazyRoute(() => import('../pages/earn/StakingSocialFeedPage').then(m => ({ default: m.StakingSocialFeedPage })));
const StakingCommunityGovernancePage = lazyRoute(() => import('../pages/earn/StakingCommunityGovernancePage').then(m => ({ default: m.StakingCommunityGovernancePage })));
const StakingProposalsPage = lazyRoute(() => import('../pages/earn/StakingProposalsPage').then(m => ({ default: m.StakingProposalsPage })));
const StakingVotingPage = lazyRoute(() => import('../pages/earn/StakingVotingPage').then(m => ({ default: m.StakingVotingPage })));
const StakingForumPage = lazyRoute(() => import('../pages/earn/StakingForumPage').then(m => ({ default: m.StakingForumPage })));

// ═══════════════════════════════════════════════════════════
//  PHASE 8: API & INTEGRATIONS (4 pages) — ~22KB gzipped
// ═══════════════════════════════════════════════════════════
const StakingWebhooksPage = lazyRoute(() => import('../pages/earn/StakingWebhooksPage').then(m => ({ default: m.StakingWebhooksPage })));
const StakingDataExportPage = lazyRoute(() => import('../pages/earn/StakingDataExportPage').then(m => ({ default: m.StakingDataExportPage })));
const StakingThirdPartyIntegrationsPage = lazyRoute(() => import('../pages/earn/StakingThirdPartyIntegrationsPage').then(m => ({ default: m.StakingThirdPartyIntegrationsPage })));
const StakingDeveloperConsolePage = lazyRoute(() => import('../pages/earn/StakingDeveloperConsolePage').then(m => ({ default: m.StakingDeveloperConsolePage })));

// Entry pages (NOT lazy - need fast initial load)
import { StakingEarnPage } from '../pages/earn/StakingEarnPage';
import { SavingsPage } from '../pages/earn/SavingsPage';

// ─── Savings Transaction Flow (P1) ───
const SavingsProductDetailPage = lazyRoute(() => import('../pages/earn/SavingsProductDetailPage').then(m => ({ default: m.SavingsProductDetailPage })));
const SavingsRedeemPage = lazyRoute(() => import('../pages/earn/SavingsRedeemPage').then(m => ({ default: m.SavingsRedeemPage })));
const SavingsReceiptPage = lazyRoute(() => import('../pages/earn/SavingsReceiptPage').then(m => ({ default: m.SavingsReceiptPage })));

// ─── Savings Portfolio & History (P2) ───
const SavingsPortfolioPage = lazyRoute(() => import('../pages/earn/SavingsPortfolioPage').then(m => ({ default: m.SavingsPortfolioPage })));
const SavingsHistoryPage = lazyRoute(() => import('../pages/earn/SavingsHistoryPage').then(m => ({ default: m.SavingsHistoryPage })));

// ─── Savings UX (P3) ───
const SavingsGuidePage = lazyRoute(() => import('../pages/earn/SavingsGuidePage').then(m => ({ default: m.SavingsGuidePage })));
const SavingsFAQPage = lazyRoute(() => import('../pages/earn/SavingsFAQPage').then(m => ({ default: m.SavingsFAQPage })));
const SavingsNotificationsPage = lazyRoute(() => import('../pages/earn/SavingsNotificationsPage').then(m => ({ default: m.SavingsNotificationsPage })));

// ─── Savings Recommendations & Risk (P4-P5) ───
const SavingsRecommendationsPage = lazyRoute(() => import('../pages/earn/SavingsRecommendationsPage').then(m => ({ default: m.SavingsRecommendationsPage })));
const SavingsRiskAssessmentPage = lazyRoute(() => import('../pages/earn/SavingsRiskAssessmentPage').then(m => ({ default: m.SavingsRiskAssessmentPage })));

// ─── Savings Comparison & Auto-Compound (P6) ───
const SavingsComparisonPage = lazyRoute(() => import('../pages/earn/SavingsComparisonPage').then(m => ({ default: m.SavingsComparisonPage })));
const AutoCompoundSettingsPage = lazyRoute(() => import('../pages/earn/AutoCompoundSettingsPage').then(m => ({ default: m.AutoCompoundSettingsPage })));

// ─── Savings Goal (P7) ───
const SavingsGoalPage = lazyRoute(() => import('../pages/earn/SavingsGoalPage').then(m => ({ default: m.SavingsGoalPage })));

// ─── Savings Analytics (P7) ───
const SavingsAnalyticsPage = lazyRoute(() => import('../pages/earn/SavingsAnalyticsPage').then(m => ({ default: m.SavingsAnalyticsPage })));

// ─── Savings Auto-Rebalance (P8) ───
const SavingsAutoRebalancePage = lazyRoute(() => import('../pages/earn/SavingsAutoRebalancePage').then(m => ({ default: m.SavingsAutoRebalancePage })));

// ─── Savings Notification Preferences (P9) ───
const SavingsNotificationPreferencesPage = lazyRoute(() => import('../pages/earn/SavingsNotificationPreferencesPage').then(m => ({ default: m.SavingsNotificationPreferencesPage })));

// ─── Savings DCA (P10) ───
const SavingsDCAPage = lazyRoute(() => import('../pages/earn/SavingsDCAPage').then(m => ({ default: m.SavingsDCAPage })));

// ─── Savings Smart Suggestions (P11) ───
const SavingsSmartSuggestionsPage = lazyRoute(() => import('../pages/earn/SavingsSmartSuggestionsPage').then(m => ({ default: m.SavingsSmartSuggestionsPage })));

// ─── Savings Export (P12) ───
const SavingsExportPage = lazyRoute(() => import('../pages/earn/SavingsExportPage').then(m => ({ default: m.SavingsExportPage })));

// ─── Savings Backtest (P13) ───
const SavingsBacktestPage = lazyRoute(() => import('../pages/earn/SavingsBacktestPage').then(m => ({ default: m.SavingsBacktestPage })));

// ─── Savings AutoPilot (P14) ───
const SavingsAutoPilotPage = lazyRoute(() => import('../pages/earn/SavingsAutoPilotPage').then(m => ({ default: m.SavingsAutoPilotPage })));

// ─── Savings Ladder (P15) ───
const SavingsLadderPage = lazyRoute(() => import('../pages/earn/SavingsLadderPage').then(m => ({ default: m.SavingsLadderPage })));

// ─── Savings WhatIf (P16) ───
const SavingsWhatIfPage = lazyRoute(() => import('../pages/earn/SavingsWhatIfPage').then(m => ({ default: m.SavingsWhatIfPage })));

/**
 * STAKING ROUTES CONFIGURATION
 * Total lazy loaded: ~253KB gzipped (43 pages)
 * Initial bundle impact: ~2KB (route config only)
 * Savings: ~251KB on initial load ⚡️
 */
export function createStakingRoutes(): RouteObject[] {
  return [
    // Entry pages (eager loaded for fast access)
    { path: 'earn', Component: StakingEarnPage },
    { path: 'earn/staking', Component: StakingEarnPage },
    { path: 'earn/savings', Component: SavingsPage },
    // ─── Savings Transaction Flow (P1) ───
    { path: 'earn/savings/product/:productId', Component: SavingsProductDetailPage },
    { path: 'earn/savings/redeem/:positionId', Component: SavingsRedeemPage },
    { path: 'earn/savings/receipt', Component: SavingsReceiptPage },

    // ─── Savings Portfolio & History (P2) ───
    { path: 'earn/savings/portfolio', Component: SavingsPortfolioPage },
    { path: 'earn/savings/history', Component: SavingsHistoryPage },

    // ─── Savings UX (P3) ───
    { path: 'earn/savings/guide', Component: SavingsGuidePage },
    { path: 'earn/savings/faq', Component: SavingsFAQPage },
    { path: 'earn/savings/notifications', Component: SavingsNotificationsPage },

    // ─── Savings Recommendations & Risk (P4-P5) ───
    { path: 'earn/savings/recommendations', Component: SavingsRecommendationsPage },
    { path: 'earn/savings/risk-assessment', Component: SavingsRiskAssessmentPage },

    // ─── Savings Comparison & Auto-Compound (P6) ───
    { path: 'earn/savings/comparison', Component: SavingsComparisonPage },
    { path: 'earn/savings/auto-compound', Component: AutoCompoundSettingsPage },

    // ─── Savings Goal (P7) ───
    { path: 'earn/savings/goals', Component: SavingsGoalPage },

    // ─── Savings Analytics (P7) ───
    { path: 'earn/savings/analytics', Component: SavingsAnalyticsPage },

    // ─── Savings Auto-Rebalance (P8) ───
    { path: 'earn/savings/rebalance', Component: SavingsAutoRebalancePage },

    // ─── Savings Notification Preferences (P9) ───
    { path: 'earn/savings/notification-preferences', Component: SavingsNotificationPreferencesPage },

    // ─── Savings DCA (P10) ───
    { path: 'earn/savings/dca', Component: SavingsDCAPage },

    // ─── Savings Smart Suggestions (P11) ───
    { path: 'earn/savings/smart-suggestions', Component: SavingsSmartSuggestionsPage },

    // ─── Savings Export (P12) ───
    { path: 'earn/savings/export', Component: SavingsExportPage },

    // ─── Savings Backtest (P13) ───
    { path: 'earn/savings/backtest', Component: SavingsBacktestPage },

    // ─── Savings AutoPilot (P14) ───
    { path: 'earn/savings/autopilot', Component: SavingsAutoPilotPage },

    // ─── Savings Ladder (P15) ───
    { path: 'earn/savings/ladder', Component: SavingsLadderPage },

    // ─── Savings WhatIf (P16) ───
    { path: 'earn/savings/whatif', Component: SavingsWhatIfPage },

    // ─── Phase 1: Compliance (lazy) ───
    { path: 'earn/staking/terms', Component: StakingTermsPage },
    { path: 'earn/staking/risk-disclosure', Component: StakingRiskDisclosurePage },
    { path: 'earn/staking/withdrawal-policy', Component: StakingWithdrawalPolicyPage },
    { path: 'earn/staking/tax-guide', Component: StakingTaxGuidePage },
    { path: 'earn/staking/risk-assessment', Component: StakingRiskAssessmentPage },

    // ─── Phase 2: Portfolio (lazy) ───
    { path: 'earn/dashboard', Component: StakingDashboardPage },
    { path: 'earn/analytics', Component: StakingAnalyticsPage },
    { path: 'earn/history', Component: StakingHistoryPage },
    { path: 'earn/calendar', Component: StakingEarningsCalendarPage },

    // ─── Phase 3: Advanced (lazy) ───
    { path: 'earn/validator-selection', Component: StakingValidatorSelectionPage },
    { path: 'earn/auto-compound', Component: StakingAutoCompoundPage },
    { path: 'earn/liquid-staking', Component: StakingLiquidStakingPage },
    { path: 'earn/insurance', Component: StakingInsurancePage },
    { path: 'earn/advanced-orders', Component: StakingAdvancedOrdersPage },
    { path: 'earn/multi-chain', Component: StakingMultiChainPage },
    { path: 'earn/institutional', Component: StakingInstitutionalPage },

    // ─── Phase 4: UX (lazy) ───
    { path: 'earn/guide', Component: StakingGuidePage },
    { path: 'earn/faq', Component: StakingFAQPage },
    { path: 'earn/notifications', Component: StakingNotificationsPage },
    { path: 'earn/recommendations', Component: StakingRecommendationsPage },

    // ─── Phase 5: Regulatory (lazy) ───
    { path: 'earn/regulatory-framework', Component: StakingRegulatoryFrameworkPage },
    { path: 'earn/audit-reports', Component: StakingAuditReportsPage },
    { path: 'earn/custody', Component: StakingCustodyPage },
    { path: 'earn/suitability-assessment', Component: StakingSuitabilityAssessmentPage },
    { path: 'earn/insurance-fund-transparency', Component: StakingInsuranceFundTransparencyPage },
    { path: 'earn/transaction-reporting', Component: StakingTransactionReportingPage },
    { path: 'earn/api-documentation', Component: StakingAPIDocumentationPage },
    { path: 'earn/proof-of-reserves', Component: StakingProofOfReservesPage },

    // ─── Phase 6: Risk Management (lazy) ───
    { path: 'earn/risk-dashboard', Component: StakingRiskDashboardPage },
    { path: 'earn/slashing-history', Component: StakingSlashingHistoryPage },
    { path: 'earn/validator-health-monitor', Component: StakingValidatorHealthMonitorPage },
    { path: 'earn/risk-score-calculator', Component: StakingRiskScoreCalculatorPage },
    { path: 'earn/emergency-actions', Component: StakingEmergencyActionsPage },
    { path: 'earn/contingency-plan', Component: StakingContingencyPlanPage },

    // ─── Phase 7: Social & Community (lazy) ───
    { path: 'earn/social-feed', Component: StakingSocialFeedPage },
    { path: 'earn/community-governance', Component: StakingCommunityGovernancePage },
    { path: 'earn/proposals', Component: StakingProposalsPage },
    { path: 'earn/voting/:proposalId', Component: StakingVotingPage },
    { path: 'earn/voting', Component: StakingVotingPage },
    { path: 'earn/forum', Component: StakingForumPage },

    // ─── Phase 8: API & Integrations (lazy) ───
    { path: 'earn/webhooks', Component: StakingWebhooksPage },
    { path: 'earn/data-export', Component: StakingDataExportPage },
    { path: 'earn/third-party-integrations', Component: StakingThirdPartyIntegrationsPage },
    { path: 'earn/developer-console', Component: StakingDeveloperConsolePage },
  ];
}