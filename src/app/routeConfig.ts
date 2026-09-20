import React from 'react';
import type { RouteObject } from 'react-router';

// ═══════════════════════════════════════════════════════════
//  ALL EAGER LOADED — No lazy loading (Figma iframe compat)
// ═══════════════════════════════════════════════════════════

// ─── Auth Pages ───
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OTPPage } from './pages/auth/OTPPage';
import { TwoFASetupPage } from './pages/auth/TwoFASetupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// ─── Auth Layout ───
import { AuthLayout } from './components/layout/AuthLayout';

// ─── Core Shell Pages ───
import { TradePage } from './pages/trade/TradePage';
import { WalletPage } from './pages/wallet/WalletPage';
import { TransactionHistoryPage as TxHistoryPage } from './pages/wallet/TransactionHistoryPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { HomePage } from './pages/market/HomePage';
import { MarketListPage } from './pages/market/MarketListPage';
import { PairDetailPage } from './pages/market/PairDetailPage';

// ─── Trade Sub-pages ───
import { OrdersHistoryPage } from './pages/trade/OrdersHistoryPage';
import { AdvancedChartPage } from './pages/trade/AdvancedChartPage';
import { ConvertPage } from './pages/trade/ConvertPage';
import { FuturesPage } from './pages/trade/FuturesPage';
import { LeveragePage } from './pages/trade/LeveragePage';
import { TradingBotsPage } from './pages/trade/TradingBotsPage';
import { CopyTradingPage } from './pages/trade/CopyTradingPage';
import { CopyTradingPageV2 } from './pages/trade/CopyTradingPageV2';
import { CopyProviderDetailPage } from './pages/trade/CopyProviderDetailPage';
import { PreCopyAssessmentPage } from './pages/trade/PreCopyAssessmentPage';
import { RiskManagementDemoPage } from './pages/trade/RiskManagementDemoPage';
import { ExecutionQualityDemoPage } from './pages/trade/ExecutionQualityDemoPage';
import { AdvancedToolsDemoPage } from './pages/trade/AdvancedToolsDemoPage';
import { CopyEducationPage } from './pages/trade/CopyEducationPage';
import { CopyConfigurationPage } from './pages/trade/CopyConfigurationPage';
import { CopyConfirmationPage } from './pages/trade/CopyConfirmationPage';
import { ActiveCopiesPage } from './pages/trade/ActiveCopiesPage';
import { CopyPerformancePage } from './pages/trade/CopyPerformancePage';
import { ProviderApplicationPage } from './pages/trade/ProviderApplicationPage';
import { CopySettingsPage } from './pages/trade/CopySettingsPage';
import { CopyNotificationsPage } from './pages/trade/CopyNotificationsPage';
import { PerformanceAttributionPage } from './pages/trade/PerformanceAttributionPage';
import { ProviderComparisonPage } from './pages/trade/ProviderComparisonPage';
import { CopyAuditLogPage } from './pages/trade/CopyAuditLogPage';
import { PortfolioRiskAnalysisPage } from './pages/trade/PortfolioRiskAnalysisPage';
import { ProviderLeaderboardPage } from './pages/trade/ProviderLeaderboardPage';
import { SafetyEducationPage } from './pages/trade/SafetyEducationPage';
import { ProviderGovernancePage } from './pages/trade/ProviderGovernancePage';
import { DisputeResolutionPage } from './pages/trade/DisputeResolutionPage';
import { CopySafetyCenterPage } from './pages/trade/CopySafetyCenterPage';
import { RegulatoryDisclosuresPage } from './pages/trade/RegulatoryDisclosuresPage';
import { MarginTradingPage } from './pages/trade/MarginTradingPage';
import { TraderProfilePage } from './pages/trade/TraderProfilePage';

// ─── Margin Trading - P1 & P2 Advanced Features ───
import { AdvancedTradingDemoPage } from './pages/trade/AdvancedTradingDemoPage';
import { MarketDataAnalyticsPage } from './pages/trade/MarketDataAnalyticsPage';
import { MarginTradingHubPage } from './pages/trade/MarginTradingHubPage';
import { LiveMarketDataAnalyticsPage } from './pages/trade/LiveMarketDataAnalyticsPage';
import { AdvancedAnalyticsPage } from './pages/trade/AdvancedAnalyticsPage';

// ─── Copy Trading - Phase 4 Sprint 1: Transaction Reporting & Best Execution ───
import { TransactionReportingPage } from './pages/trade/TransactionReportingPage';
import { RegulatoryReportsDashboardPage } from './pages/trade/RegulatoryReportsDashboardPage';
import { ARMIntegrationStatusPage } from './pages/trade/ARMIntegrationStatusPage';
import { BestExecutionReportsPage } from './pages/trade/BestExecutionReportsPage';
import { ExecutionVenueAnalysisPage } from './pages/trade/ExecutionVenueAnalysisPage';
import { SlippageMonitoringPage } from './pages/trade/SlippageMonitoringPage';

// ─── Copy Trading - Phase 4 Sprint 2: Client Protection & Governance ───
import { ClientCategorizationPage } from './pages/trade/ClientCategorizationPage';
import { ProductGovernancePage } from './pages/trade/ProductGovernancePage';
import { TargetMarketDefinitionPage } from './pages/trade/TargetMarketDefinitionPage';
import { ClientMoneyProtectionPage } from './pages/trade/ClientMoneyProtectionPage';
import { CASSReconciliationPage } from './pages/trade/CASSReconciliationPage';
import { InvestorCompensationPage } from './pages/trade/InvestorCompensationPage';

// ─── Copy Trading - Phase 4 Sprint 3: Cost Transparency & KID ───
import { ExAnteCostsPage } from './pages/trade/ExAnteCostsPage';
import { RIYCalculatorPage } from './pages/trade/RIYCalculatorPage';
import { ExPostCostsReportPage } from './pages/trade/ExPostCostsReportPage';
import { KIDGeneratorPage } from './pages/trade/KIDGeneratorPage';
import { PerformanceScenariosPage } from './pages/trade/PerformanceScenariosPage';
import { RiskIndicatorExplainerPage } from './pages/trade/RiskIndicatorExplainerPage';

// ─── Copy Trading - Phase 4 Sprint 4: Complaints & Audit Trail ───
import { ComplaintsHandlingPage } from './pages/trade/ComplaintsHandlingPage';
import { ComplaintSubmissionPage } from './pages/trade/ComplaintSubmissionPage';
import { ComplaintTrackingPage } from './pages/trade/ComplaintTrackingPage';
import { OmbudsmanReferralPage } from './pages/trade/OmbudsmanReferralPage';
import { AuditTrailPage } from './pages/trade/AuditTrailPage';
import { RegulatoryInspectionReadyPage } from './pages/trade/RegulatoryInspectionReadyPage';

// ─── Trade Sprint 1B-3: Enhanced Trading Features ───
import { OrderReceiptPage } from './pages/trade/OrderReceiptPage';
import { TradeSettingsPage } from './pages/trade/TradeSettingsPage';
import { PositionDashboardPage } from './pages/trade/PositionDashboardPage';
import { TradeHistoryExportPage } from './pages/trade/TradeHistoryExportPage';

// ─── Trading Bots Sub-pages (Phase 1: Compliance MVP) ───
import { BotTermsOfServicePage } from './pages/trade/bots/BotTermsOfServicePage';
import { BotRiskDisclosurePage } from './pages/trade/bots/BotRiskDisclosurePage';
import { BotSuitabilityAssessmentPage } from './pages/trade/bots/BotSuitabilityAssessmentPage';
import { BotRiskDashboardPage } from './pages/trade/bots/BotRiskDashboardPage';
import { BotEmergencyStopPage } from './pages/trade/bots/BotEmergencyStopPage';
import { BotSecuritySettingsPage } from './pages/trade/bots/BotSecuritySettingsPage';
import { BotHistoryPage } from './pages/trade/bots/BotHistoryPage';
import { BotPerformanceAnalyticsPage } from './pages/trade/bots/BotPerformanceAnalyticsPage';

// ─── Trading Bots Sub-pages (Phase 2: Analytics & Optimization) ───
import { BotBacktestingPage } from './pages/trade/bots/BotBacktestingPage';
import { BotStrategyComparePage } from './pages/trade/bots/BotStrategyComparePage';
import { BotOptimizationPage } from './pages/trade/bots/BotOptimizationPage';
import { BotPortfolioDashboardPage } from './pages/trade/bots/BotPortfolioDashboardPage';
import { BotDrawdownAnalyzerPage } from './pages/trade/bots/BotDrawdownAnalyzerPage';
import { BotEquityCurvePage } from './pages/trade/bots/BotEquityCurvePage';

// ─── Trading Bots Sub-pages (Phase 3: Polish & Enterprise) ───
import { BotGuidePage } from './pages/trade/bots/BotGuidePage';
import { BotFAQPage } from './pages/trade/bots/BotFAQPage';
import { BotTaxReportingPage } from './pages/trade/bots/BotTaxReportingPage';
import { BotAPIDocumentationPage } from './pages/trade/bots/BotAPIDocumentationPage';

// ─── Wallet Sub-pages ───
import { DepositPage } from './pages/wallet/DepositPage';
import { WithdrawPage } from './pages/wallet/WithdrawPage';
import { TransactionDetailPage } from './pages/wallet/TransactionDetailPage';
import { PortfolioAnalyticsPage } from './pages/wallet/PortfolioAnalyticsPage';
import { AddressBookPage } from './pages/wallet/AddressBookPage';
import { AddressAddPage } from './pages/wallet/AddressAddPage';
import { BuyCryptoPage } from './pages/wallet/BuyCryptoPage';
import { TransferPage } from './pages/wallet/TransferPage';
import { AssetDetailPage } from './pages/wallet/AssetDetailPage';
import { WalletMultiManagerPage } from './pages/wallet/WalletMultiManagerPage';
import { WalletGasOptimizerPage } from './pages/wallet/WalletGasOptimizerPage';
import { WalletTokenApprovalPage } from './pages/wallet/WalletTokenApprovalPage';
import { WalletHealthScorePage } from './pages/wallet/WalletHealthScorePage';
import { PendingDepositsPage } from './pages/wallet/PendingDepositsPage';
import { WithdrawLimitsPage } from './pages/wallet/WithdrawLimitsPage';
import { DustConverterPage } from './pages/wallet/DustConverterPage';
import { NetworkStatusPage } from './pages/wallet/NetworkStatusPage';

// ─── Profile Sub-pages ───
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { SecurityPage } from './pages/profile/SecurityPage';
import { KYCPage } from './pages/profile/KYCPage';
import { SettingsPage } from './pages/profile/SettingsPage';
import { ActivityLogPage } from './pages/profile/ActivityLogPage';
import { ApiManagementPage } from './pages/profile/ApiManagementPage';
import { ApiKeyCreatePage } from './pages/profile/ApiKeyCreatePage';
import { VIPPage } from './pages/profile/VIPPage';
import { DeviceManagementPage } from './pages/profile/DeviceManagementPage';
import { SubAccountPage } from './pages/profile/SubAccountPage';

// ─── P2P Pages (Core + Phase 1-6) ───
import { P2PHomePage } from './pages/p2p/P2PHomePage';
import { P2PCreateAdPage } from './pages/p2p/P2PCreateAdPage';
import { P2PPaymentMethodsPage } from './pages/p2p/P2PPaymentMethodsPage';
import { P2PPaymentMethodAddPage } from './pages/p2p/P2PPaymentMethodAddPage';
import { P2PMyOrdersPage } from './pages/p2p/P2PMyOrdersPage';
import { P2PMyAdsPage } from './pages/p2p/P2PMyAdsPage';
import { P2PAdDetailPage } from './pages/p2p/P2PAdDetailPage';
import { P2PAdAnalyticsPage } from './pages/p2p/P2PAdAnalyticsPage';
import { P2PMerchantProfilePage } from './pages/p2p/P2PMerchantProfilePage';
import { P2PMerchantApplyPage } from './pages/p2p/P2PMerchantApplyPage';
import { P2PReportMerchantPage } from './pages/p2p/P2PReportMerchantPage';
import { P2PTradingLevelPage } from './pages/p2p/P2PTradingLevelPage';
import { P2POrderPage } from './pages/p2p/P2POrderPage';
import { P2PChatPage } from './pages/p2p/P2PChatPage';
import { P2POrderRatePage } from './pages/p2p/P2POrderRatePage';
import { P2POrderCancelPage } from './pages/p2p/P2POrderCancelPage';
import { P2POrderProofPage } from './pages/p2p/P2POrderProofPage';
import { P2POrderTimelinePage } from './pages/p2p/P2POrderTimelinePage';
import { P2PDisputePage } from './pages/p2p/P2PDisputePage';
import { P2PDisputeDetailPage } from './pages/p2p/P2PDisputeDetailPage';
import { P2PDisputesPage } from './pages/p2p/P2PDisputesPage';
import { P2PDisputeEvidencePage } from './pages/p2p/P2PDisputeEvidencePage';
import { P2PDisputeResolutionPage } from './pages/p2p/P2PDisputeResolutionPage';
import { P2PAchievementsPage } from './pages/p2p/P2PAchievementsPage';
import { P2POrderBookPage } from './pages/p2p/P2POrderBookPage';
import { P2PDashboardPage } from './pages/p2p/P2PDashboardPage';
import { P2PReviewsPage } from './pages/p2p/P2PReviewsPage';
import { P2PInsuranceFundPage } from './pages/p2p/P2PInsuranceFundPage';
import { P2PEscrowDetailPage } from './pages/p2p/P2PEscrowDetailPage';
import { P2PClaimDetailPage } from './pages/p2p/P2PClaimDetailPage';
import { P2PInsurancePolicyPage } from './pages/p2p/P2PInsurancePolicyPage';
import { P2PContributionHistoryPage } from './pages/p2p/P2PContributionHistoryPage';
import { P2PInsuranceScorePage } from './pages/p2p/P2PInsuranceScorePage';
import { P2PInsuranceCertificatePage } from './pages/p2p/P2PInsuranceCertificatePage';
import { P2PBlacklistPage } from './pages/p2p/P2PBlacklistPage';
import { P2PBlacklistAddPage } from './pages/p2p/P2PBlacklistAddPage';
import { P2PSettingsPage } from './pages/p2p/P2PSettingsPage';
import { P2PFraudPreventionPage } from './pages/p2p/P2PFraudPreventionPage';
import { P2PNotificationsSettingsPage } from './pages/p2p/P2PNotificationsSettingsPage';
import { P2PExpressPage } from './pages/p2p/P2PExpressPage';
import { P2PExpressConfirmPage } from './pages/p2p/P2PExpressConfirmPage';
import { P2PGuidePage } from './pages/p2p/P2PGuidePage';
import { P2PE2EInfoPage } from './pages/p2p/P2PE2EInfoPage';
// Phase 1: KYC & Verification
import { P2PKYCRequirementsPage } from './pages/p2p/P2PKYCRequirementsPage';
import { P2PKYCStatusPage } from './pages/p2p/P2PKYCStatusPage';
import { P2PIdentityVerificationPage } from './pages/p2p/P2PIdentityVerificationPage';
import { P2PAddressProofPage } from './pages/p2p/P2PAddressProofPage';
import { P2PSelfieVerificationPage } from './pages/p2p/P2PSelfieVerificationPage';
import { P2PVideoVerificationPage } from './pages/p2p/P2PVideoVerificationPage';
// Phase 1: Security
import { P2PSecurityCenterPage } from './pages/p2p/P2PSecurityCenterPage';
import { P2P2FASettingsPage } from './pages/p2p/P2P2FASettingsPage';
import { P2PDeviceManagementPage } from './pages/p2p/P2PDeviceManagementPage';
import { P2PAntiPhishingCodePage } from './pages/p2p/P2PAntiPhishingCodePage';
import { P2PLoginHistoryPage } from './pages/p2p/P2PLoginHistoryPage';
import { P2PSuspiciousActivityPage } from './pages/p2p/P2PSuspiciousActivityPage';
// Phase 1: Wallet & Limits
import { P2PWalletPage } from './pages/p2p/P2PWalletPage';
import { P2PWalletTransferPage } from './pages/p2p/P2PWalletTransferPage';
import { P2PEscrowBalancePage } from './pages/p2p/P2PEscrowBalancePage';
import { P2PFundLockHistoryPage } from './pages/p2p/P2PFundLockHistoryPage';
import { P2PTransactionLimitsPage } from './pages/p2p/P2PTransactionLimitsPage';
import { P2PLimitTrackerPage } from './pages/p2p/P2PLimitTrackerPage';
// Phase 1: Compliance
import { P2PAMLScreeningPage } from './pages/p2p/P2PAMLScreeningPage';
import { P2PSourceOfFundsPage } from './pages/p2p/P2PSourceOfFundsPage';
import { P2PLargeTransactionJustificationPage } from './pages/p2p/P2PLargeTransactionJustificationPage';
// Phase 1: Payment Method Verification
import { P2PPaymentMethodVerificationPage } from './pages/p2p/P2PPaymentMethodVerificationPage';
import { P2PPaymentMethodOwnershipPage } from './pages/p2p/P2PPaymentMethodOwnershipPage';
import { P2PPaymentMethodCoolingPeriodPage } from './pages/p2p/P2PPaymentMethodCoolingPeriodPage';
import { P2PPaymentMethodHistoryPage } from './pages/p2p/P2PPaymentMethodHistoryPage';
// Phase 3+: Regulatory
import { P2PTaxReportingPage } from './pages/p2p/P2PTaxReportingPage';
import { P2PRiskAssessmentPage } from './pages/p2p/P2PRiskAssessmentPage';
import { P2PComplianceOverviewPage } from './pages/p2p/P2PComplianceOverviewPage';

// ─── Prediction Markets Pages ───
import { PredictionsHomePage } from './pages/predictions/PredictionsHomePage';
import { PredictionsSearchPage } from './pages/predictions/PredictionsSearchPage';
import { PredictionsBreakingPage } from './pages/predictions/PredictionsBreakingPage';
import { PredictionEventDetailPage } from './pages/predictions/PredictionEventDetailPage';
import { PredictionsPortfolioPage } from './pages/predictions/PredictionsPortfolioPage';
import { PredictionsRewardsPage } from './pages/predictions/PredictionsRewardsPage';
import { PredictionsLeaderboardPage } from './pages/predictions/PredictionsLeaderboardPage';
import { PredictionsGlobalActivityPage } from './pages/predictions/PredictionsGlobalActivityPage';
import { PredictionOrderReceiptPage } from './pages/predictions/PredictionOrderReceiptPage';
import { PredictionRiskCalculatorPage } from './pages/predictions/PredictionRiskCalculatorPage';
import { PredictionMarketMakerPage } from './pages/predictions/PredictionMarketMakerPage';
import { PredictionPortfolioAnalyzerPage } from './pages/predictions/PredictionPortfolioAnalyzerPage';
import { PredictionEventCalendarPage } from './pages/predictions/PredictionEventCalendarPage';
import { PredictionSocialPage } from './pages/predictions/PredictionSocialPage';
import { PredictionAdvancedChartPage } from './pages/predictions/PredictionAdvancedChartPage';
import { PredictionTournamentsPage } from './pages/predictions/PredictionTournamentsPage';
import { PredictionDataIntegrationPage } from './pages/predictions/PredictionDataIntegrationPage';

// ─── Arena Pages (26 pages) ───
import { ArenaHomePage } from './pages/arena/ArenaHomePage';
import { ArenaStudioPage } from './pages/arena/ArenaStudioPage';
import { ArenaModeDetailPage } from './pages/arena/ArenaModeDetailPage';
import { ArenaChallengeDetailPage } from './pages/arena/ArenaChallengeDetailPage';
import { ArenaJoinPage } from './pages/arena/ArenaJoinPage';
import { ArenaResolutionCenterPage } from './pages/arena/ArenaResolutionCenterPage';
import { ArenaCreatorPage } from './pages/arena/ArenaCreatorPage';
import { ArenaLeaderboardPage } from './pages/arena/ArenaLeaderboardPage';
import { VerifiedChallengesPage } from './pages/arena/VerifiedChallengesPage';
import { ArenaPointsPage } from './pages/arena/ArenaPointsPage';
import { ArenaFlowMapPage } from './pages/arena/ArenaFlowMapPage';
import { ArenaSafetyCenterPage } from './pages/arena/ArenaSafetyCenterPage';
import { ArenaTrustBreakdownPage } from './pages/arena/ArenaTrustBreakdownPage';
import { ArenaPointsLedgerPage } from './pages/arena/ArenaPointsLedgerPage';
import { ArenaPointsEntryDetailPage } from './pages/arena/ArenaPointsEntryDetailPage';
import { MyArenaPage } from './pages/arena/MyArenaPage';
import { ArenaReportCasePage } from './pages/arena/ArenaReportCasePage';
import { ArenaBlockedUsersPage } from './pages/arena/ArenaBlockedUsersPage';
import { MyArenaReportsPage } from './pages/arena/MyArenaReportsPage';
import { ArenaProductionReadyPage } from './pages/arena/ArenaProductionReadyPage';
import { ArenaPredictionBridgeFoundationPage } from './pages/arena/ArenaPredictionBridgeFoundationPage';
import { ConnectedEcosystemProductionPage } from './pages/arena/ConnectedEcosystemProductionPage';
import { ArenaSmartRuleBuilderPage } from './pages/arena/ArenaSmartRuleBuilderPage';
import { ArenaUniversalPresetLibraryPage } from './pages/arena/ArenaUniversalPresetLibraryPage';
import { ArenaGovernanceGatePage } from './pages/arena/ArenaGovernanceGatePage';
import { ArenaGuidePage } from './pages/arena/ArenaGuidePage';

// ─── DCA Pages ───
import DCAPage from './pages/dca/DCAPage';
import DCARebalanceConfig from './pages/dca/DCARebalanceConfig';
import DCARebalanceDashboard from './pages/dca/DCARebalanceDashboard';
import DCAScheduleConfig from './pages/dca/DCAScheduleConfig';
import DCAScheduleAnalytics from './pages/dca/DCAScheduleAnalytics';
import DCAPortfolioOptimizer from './pages/dca/DCAPortfolioOptimizer';
import DCADynamicAmount from './pages/dca/DCADynamicAmount';
import { DCABacktesterPage } from './pages/dca/DCABacktesterPage';
import { DCAMultiAssetPage } from './pages/dca/DCAMultiAssetPage';
import { DCAPerformanceComparePage } from './pages/dca/DCAPerformanceComparePage';
import { DCASmartRulesPage } from './pages/dca/DCASmartRulesPage';

// ─── Cross-Module Pages ───
import { UnifiedPortfolioDashboard } from './pages/cross-module/UnifiedPortfolioDashboard';
import { CrossModuleAnalytics } from './pages/cross-module/CrossModuleAnalytics';
import { SmartAlertCenter } from './pages/cross-module/SmartAlertCenter';
import { TaxReportCenter } from './pages/cross-module/TaxReportCenter';

// ─── Staking & Earn - Compliance Pages (Phase 1) ───
import { StakingTermsPage } from './pages/earn/StakingTermsPage';
import { StakingRiskDisclosurePage } from './pages/earn/StakingRiskDisclosurePage';
import { StakingWithdrawalPolicyPage } from './pages/earn/StakingWithdrawalPolicyPage';
import { StakingTaxGuidePage } from './pages/earn/StakingTaxGuidePage';
import { StakingRiskAssessmentPage } from './pages/earn/StakingRiskAssessmentPage';

// ─── Staking & Earn - Portfolio Management (Phase 2) ───
import { StakingDashboardPage } from './pages/earn/StakingDashboardPage';
import { StakingAnalyticsPage } from './pages/earn/StakingAnalyticsPage';
import { StakingHistoryPage } from './pages/earn/StakingHistoryPage';
import { StakingEarningsCalendarPage } from './pages/earn/StakingEarningsCalendarPage';

// ─── Staking & Earn - Advanced Features (Phase 3) ───
import { StakingValidatorSelectionPage } from './pages/earn/StakingValidatorSelectionPage';
import { StakingAutoCompoundPage } from './pages/earn/StakingAutoCompoundPage';
import { StakingLiquidStakingPage } from './pages/earn/StakingLiquidStakingPage';
import { StakingInsurancePage } from './pages/earn/StakingInsurancePage';

// ─── Staking & Earn - UX Enhancements (Phase 4) ───
import { StakingGuidePage } from './pages/earn/StakingGuidePage';
import { StakingFAQPage } from './pages/earn/StakingFAQPage';
import { StakingNotificationsPage } from './pages/earn/StakingNotificationsPage';
import { StakingRecommendationsPage } from './pages/earn/StakingRecommendationsPage';

// ─── Staking & Earn - Regulatory Compliance (Phase 5) ───
import { StakingRegulatoryFrameworkPage } from './pages/earn/StakingRegulatoryFrameworkPage';
import { StakingAuditReportsPage } from './pages/earn/StakingAuditReportsPage';
import { StakingCustodyPage } from './pages/earn/StakingCustodyPage';
import { StakingSuitabilityAssessmentPage } from './pages/earn/StakingSuitabilityAssessmentPage';
import { StakingInsuranceFundTransparencyPage } from './pages/earn/StakingInsuranceFundTransparencyPage';
import { StakingTransactionReportingPage } from './pages/earn/StakingTransactionReportingPage';
import { StakingAPIDocumentationPage } from './pages/earn/StakingAPIDocumentationPage';
import { StakingProofOfReservesPage } from './pages/earn/StakingProofOfReservesPage';

// ─── Staking & Earn - Risk Management (Phase 6) ───
import { StakingRiskDashboardPage } from './pages/earn/StakingRiskDashboardPage';
import { StakingSlashingHistoryPage } from './pages/earn/StakingSlashingHistoryPage';
import { StakingValidatorHealthMonitorPage } from './pages/earn/StakingValidatorHealthMonitorPage';
import { StakingRiskScoreCalculatorPage } from './pages/earn/StakingRiskScoreCalculatorPage';
import { StakingEmergencyActionsPage } from './pages/earn/StakingEmergencyActionsPage';
import { StakingContingencyPlanPage } from './pages/earn/StakingContingencyPlanPage';

// ─── Staking & Earn - Social & Community (Phase 7) ───
import { StakingSocialFeedPage } from './pages/earn/StakingSocialFeedPage';
import { StakingCommunityGovernancePage } from './pages/earn/StakingCommunityGovernancePage';
import { StakingProposalsPage } from './pages/earn/StakingProposalsPage';
import { StakingVotingPage } from './pages/earn/StakingVotingPage';
import { StakingForumPage } from './pages/earn/StakingForumPage';

// ─── Staking & Earn - API & Integrations (Phase 8) ───
import { StakingWebhooksPage } from './pages/earn/StakingWebhooksPage';
import { StakingDataExportPage } from './pages/earn/StakingDataExportPage';
import { StakingThirdPartyIntegrationsPage } from './pages/earn/StakingThirdPartyIntegrationsPage';
import { StakingDeveloperConsolePage } from './pages/earn/StakingDeveloperConsolePage';

// ─── Staking & Earn - Advanced Features (Phase 3 Extensions) ───
import { StakingAdvancedOrdersPage } from './pages/earn/StakingAdvancedOrdersPage';
import { StakingMultiChainPage } from './pages/earn/StakingMultiChainPage';
import { StakingInstitutionalPage } from './pages/earn/StakingInstitutionalPage';

// ─── Admin Pages ───
import AdminHome from './pages/admin/AdminHome';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import ABTestDashboard from './pages/admin/ABTestDashboard';
import FunnelDashboard from './pages/admin/FunnelDashboard';

// ─── Dev Tools ───
import { RouteChecker } from './components/dev/RouteChecker';
import { PerformanceMonitor } from './components/dev/PerformanceMonitor';

// ─── Staking Routes (Lazy Loaded) ───
import { createStakingRoutes } from './routes/stakingRoutes.lazy';

// ─── Misc Pages ───
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { SupportPage } from './pages/support/SupportPage';
import { HelpCenterPage } from './pages/support/HelpCenterPage';
import { AnnouncementsPage } from './pages/support/AnnouncementsPage';
import { NewsPage } from './pages/news/NewsPage';
import { StakingEarnPage } from './pages/earn/StakingEarnPage';
import { ReferralHomePage } from './pages/referral/ReferralHomePage';
import { ReferralHistoryPage } from './pages/referral/ReferralHistoryPage';
import { ReferralRewardsPage } from './pages/referral/ReferralRewardsPage';
import { ReferralRulesPage } from './pages/referral/ReferralRulesPage';
import { ReferralFriendDetailPage } from './pages/referral/ReferralFriendDetailPage';
import { LaunchpadPage } from './pages/launchpad/LaunchpadPage';
import { LaunchpadDetailPage } from './pages/launchpad/LaunchpadDetailPage';
import { LaunchpadReceiptPage } from './pages/launchpad/LaunchpadReceiptPage';
import { LaunchpadPortfolioPage } from './pages/launchpad/LaunchpadPortfolioPage';
import { LaunchpadPerformancePage } from './pages/launchpad/LaunchpadPerformancePage';
import { LaunchpadStakingPage } from './pages/launchpad/LaunchpadStakingPage';
import { LaunchpadIDOBridgePage } from './pages/launchpad/LaunchpadIDOBridgePage';
import { LaunchpadContractPage } from './pages/launchpad/LaunchpadContractPage';
import { LaunchpadClaimReceiptPage } from './pages/launchpad/LaunchpadClaimReceiptPage';
import { LaunchpadBridgeOrderPage } from './pages/launchpad/LaunchpadBridgeOrderPage';
import { LaunchpadBatchClaimPage } from './pages/launchpad/LaunchpadBatchClaimPage';
import { LaunchpadBridgeComparePage } from './pages/launchpad/LaunchpadBridgeComparePage';
import { LaunchpadNotifSoundPage } from './pages/launchpad/LaunchpadNotifSoundPage';
import { LaunchpadEventLogPage } from './pages/launchpad/LaunchpadEventLogPage';
import { LaunchpadABIDiffPage } from './pages/launchpad/LaunchpadABIDiffPage';
import { LaunchpadAddressBookPage } from './pages/launchpad/LaunchpadAddressBookPage';
import { LaunchpadWebhooksPage } from './pages/launchpad/LaunchpadWebhooksPage';
import { LaunchpadGasTrackerPage } from './pages/launchpad/LaunchpadGasTrackerPage';
import { LaunchpadRebalancePage } from './pages/launchpad/LaunchpadRebalancePage';
import { LaunchpadMultisigPage } from './pages/launchpad/LaunchpadMultisigPage';
import { LaunchpadSwapAggregatorPage } from './pages/launchpad/LaunchpadSwapAggregatorPage';
import { LaunchpadLimitOrdersPage } from './pages/launchpad/LaunchpadLimitOrdersPage';
import { LaunchpadDCABuilderPage } from './pages/launchpad/LaunchpadDCABuilderPage';
import { LaunchpadRiskAnalyticsPage } from './pages/launchpad/LaunchpadRiskAnalyticsPage';
import { RewardsHubPage } from './pages/rewards/RewardsHubPage';
import { MarketHeatmapPage } from './pages/market/MarketHeatmapPage';
import { WatchlistPage } from './pages/markets/WatchlistPage';
import { PriceAlertsPage } from './pages/markets/PriceAlertsPage';
import { MarketOverviewPage } from './pages/markets/MarketOverviewPage';
import { MarketMoversPage } from './pages/markets/MarketMoversPage';
import { MarketSectorsPage } from './pages/markets/MarketSectorsPage';
import { TokenInfoPage } from './pages/markets/TokenInfoPage';
import { MarketScreenerPage } from './pages/markets/MarketScreenerPage';
import { ComparisonToolPage } from './pages/markets/ComparisonToolPage';
import { MarketCalendarPage } from './pages/markets/MarketCalendarPage';
import { DerivativesOverviewPage } from './pages/markets/DerivativesOverviewPage';
import { MarketDepthPage } from './pages/markets/MarketDepthPage';
import { SocialSentimentPage } from './pages/markets/SocialSentimentPage';
import { PortfolioTrackerPage } from './pages/markets/PortfolioTrackerPage';
import { MarketNewsPage } from './pages/markets/MarketNewsPage';
import { AdvancedChartsPage } from './pages/markets/AdvancedChartsPage';
import { TokenUnlocksPage } from './pages/markets/TokenUnlocksPage';
import { SocialSignalsPage } from './pages/markets/SocialSignalsPage';
import { MarketCorrelationsPage } from './pages/markets/MarketCorrelationsPage';
import { EnterpriseStatesPage } from './pages/responsive/EnterpriseStatesPage';

// ─── Discovery Pages ───
import { UnifiedSearchPage } from './pages/discovery/UnifiedSearchPage';
import { TopicHubPage } from './pages/discovery/TopicHubPage';


/* ════════════════════════════════════════════
   AUTH ROUTES
   ══════════════════════════════════════════ */
export const authRoutes: RouteObject[] = [
  { path: 'login', Component: LoginPage },
  { path: 'register', Component: RegisterPage },
  { path: 'otp', Component: OTPPage },
  { path: '2fa-setup', Component: TwoFASetupPage },
  { path: 'forgot-password', Component: ForgotPasswordPage },
  { path: 'reset-password', Component: ResetPasswordPage },
];

export function createAuthBlock(): RouteObject {
  return {
    path: 'auth',
    Component: AuthLayout,
    children: authRoutes,
  };
}

/**
 * Web-specific auth block — allows overriding LoginPage
 * with a desktop-optimized version while sharing other auth pages.
 * No AuthLayout wrapper (web login handles its own layout).
 */
export function createWebAuthBlock(
  LoginOverride: React.ComponentType,
  RegisterOverride?: React.ComponentType,
  ForgotPasswordOverride?: React.ComponentType,
  ResetPasswordOverride?: React.ComponentType,
  OTPOverride?: React.ComponentType,
  TwoFASetupOverride?: React.ComponentType,
  AuthSuccessOverride?: React.ComponentType,
  AccountLockedOverride?: React.ComponentType,
  SessionExpiredOverride?: React.ComponentType,
  DeviceTrustOverride?: React.ComponentType,
): RouteObject {
  return {
    path: 'auth',
    children: [
      { path: 'login', Component: LoginOverride },
      { path: 'register', Component: RegisterOverride || RegisterPage },
      { path: 'otp', Component: OTPOverride || OTPPage },
      { path: '2fa-setup', Component: TwoFASetupOverride || TwoFASetupPage },
      { path: 'forgot-password', Component: ForgotPasswordOverride || ForgotPasswordPage },
      { path: 'reset-password', Component: ResetPasswordOverride || ResetPasswordPage },
      ...(AuthSuccessOverride ? [{ path: 'success', Component: AuthSuccessOverride }] : []),
      ...(AccountLockedOverride ? [{ path: 'account-locked', Component: AccountLockedOverride }] : []),
      ...(SessionExpiredOverride ? [{ path: 'session-expired', Component: SessionExpiredOverride }] : []),
      ...(DeviceTrustOverride ? [{ path: 'device-trust', Component: DeviceTrustOverride }] : []),
    ],
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
        { path: 'overview', Component: MarketOverviewPage },
        { path: 'movers', Component: MarketMoversPage },
        { path: 'sectors', Component: MarketSectorsPage },
        { path: 'watchlist', Component: WatchlistPage },
        { path: 'heatmap', Component: MarketHeatmapPage },
        { path: 'alerts', Component: PriceAlertsPage },
        { path: 'screener', Component: MarketScreenerPage },
        { path: 'compare', Component: ComparisonToolPage },
        { path: 'calendar', Component: MarketCalendarPage },
        { path: 'derivatives', Component: DerivativesOverviewPage },
        { path: 'depth', Component: MarketDepthPage },
        { path: 'social-sentiment', Component: SocialSentimentPage },
        { path: 'portfolio-tracker', Component: PortfolioTrackerPage },
        { path: 'news', Component: MarketNewsPage },
        { path: 'advanced-charts', Component: AdvancedChartsPage },
        { path: 'unlocks', Component: TokenUnlocksPage },
        { path: 'signals', Component: SocialSignalsPage },
        { path: 'correlations', Component: MarketCorrelationsPage },
        {
          path: 'predictions',
          children: [
            { index: true, Component: PredictionsHomePage },
            { path: 'search', Component: PredictionsSearchPage },
            { path: 'breaking', Component: PredictionsBreakingPage },
            { path: 'event/:eventId', Component: PredictionEventDetailPage },
            { path: 'portfolio', Component: PredictionsPortfolioPage },
            { path: 'rewards', Component: PredictionsRewardsPage },
            { path: 'leaderboard', Component: PredictionsLeaderboardPage },
            { path: 'activity', Component: PredictionsGlobalActivityPage },
            { path: 'receipt/:orderId', Component: PredictionOrderReceiptPage },
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
    { path: 'pair/:pairId', Component: o.PairDetailPage },
    { path: 'pair/:pairId/info', Component: TokenInfoPage },
    { path: 'pair/:pairId/depth', Component: MarketDepthPage },

    // ─── News (public) ───
    { path: 'news', Component: NewsPage },
  ];
}

/* ═══════════════════════════════════════════
   PROTECTED ROUTES — require authentication
   ═══════════════════════════════════════════ */
export function createProtectedRoutes(o: ShellOverrides): RouteObject[] {
  return [
    // ═══════════════════════════════════════════════════════════
    //  TRADE — Core + Sub-pages
    // ═══════════════════════════════════════════════════════════
    { path: 'trade', Component: o.TradePage },
    { path: 'trade/:pairId', Component: o.TradePage },
    { path: 'trade/orders-history', Component: OrdersHistoryPage },
    { path: 'trade/order-receipt', Component: OrderReceiptPage },
    { path: 'trade/settings', Component: TradeSettingsPage },
    { path: 'trade/positions', Component: PositionDashboardPage },
    { path: 'trade/export', Component: TradeHistoryExportPage },
    { path: 'trade/advanced-chart/:pairId', Component: AdvancedChartPage },
    { path: 'trade/convert', Component: ConvertPage },
    { path: 'trade/:pairId/futures', Component: FuturesPage },
    { path: 'trade/:pairId/futures/leverage', Component: LeveragePage },
    { path: 'trade/bots', Component: TradingBotsPage },
    { path: 'trade/risk-management', Component: RiskManagementDemoPage },
    { path: 'trade/execution-quality', Component: ExecutionQualityDemoPage },
    { path: 'trade/advanced-tools', Component: AdvancedToolsDemoPage },
    { path: 'trade/copy-trading', Component: CopyTradingPage },
    { path: 'trade/copy-trading/v2', Component: CopyTradingPageV2 },
    { path: 'trade/copy-trading/education', Component: CopyEducationPage },
    { path: 'trade/copy-trading/active', Component: ActiveCopiesPage },
    { path: 'trade/copy-trading/settings', Component: CopySettingsPage },
    { path: 'trade/copy-trading/notifications', Component: CopyNotificationsPage },
    { path: 'trade/copy-provider-apply', Component: ProviderApplicationPage },
    { path: 'trade/copy-provider/:providerId', Component: CopyProviderDetailPage },
    { path: 'trade/copy-provider/:providerId/assessment', Component: PreCopyAssessmentPage },
    { path: 'trade/copy-provider/:providerId/configuration', Component: CopyConfigurationPage },
    { path: 'trade/copy-provider/:providerId/confirmation', Component: CopyConfirmationPage },
    { path: 'trade/copy-performance/:copyId', Component: CopyPerformancePage },
    { path: 'trade/copy-performance/:copyId/attribution', Component: PerformanceAttributionPage },
    { path: 'trade/copy-trading/comparison', Component: ProviderComparisonPage },
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
    { path: 'trade/copy-trading/regulatory-reports-dashboard', Component: RegulatoryReportsDashboardPage },
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
    { path: 'trade/copy-trading/regulatory-inspection-ready', Component: RegulatoryInspectionReadyPage },

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

    // ═══════════════════════════���═══════════════════════════════
    //  WALLET — Core + Sub-pages
    // ═══════════════════════════════════════════════════════════
    { path: 'wallet', Component: o.WalletPage },
    { path: 'wallet/history', Component: o.TxHistoryPage },
    { path: 'wallet/deposit', Component: DepositPage },
    { path: 'wallet/deposit/:asset', Component: DepositPage },
    { path: 'wallet/withdraw', Component: WithdrawPage },
    { path: 'wallet/withdraw/:asset', Component: WithdrawPage },
    { path: 'wallet/transaction/:txId', Component: TransactionDetailPage },
    { path: 'wallet/portfolio-analytics', Component: PortfolioAnalyticsPage },
    { path: 'wallet/address-book/add', Component: AddressAddPage },
    { path: 'wallet/address-book', Component: AddressBookPage },
    { path: 'wallet/buy-crypto', Component: BuyCryptoPage },
    { path: 'wallet/transfer', Component: TransferPage },
    { path: 'wallet/asset/:assetId', Component: AssetDetailPage },
    { path: 'wallet/multi-manager', Component: WalletMultiManagerPage },
    { path: 'wallet/gas-optimizer', Component: WalletGasOptimizerPage },
    { path: 'wallet/token-approval', Component: WalletTokenApprovalPage },
    { path: 'wallet/health-score', Component: WalletHealthScorePage },
    { path: 'wallet/pending-deposits', Component: PendingDepositsPage },
    { path: 'wallet/limits', Component: WithdrawLimitsPage },
    { path: 'wallet/dust-converter', Component: DustConverterPage },
    { path: 'wallet/network-status', Component: NetworkStatusPage },

    // ═════════════════════════════════════════════════════════
    //  PROFILE — Core + Sub-pages
    // ═══════════════════════════════════════════════════════════
    { path: 'profile', Component: o.ProfilePage },
    { path: 'profile/edit', Component: EditProfilePage },
    { path: 'profile/security', Component: SecurityPage },
    { path: 'profile/kyc', Component: KYCPage },
    { path: 'profile/settings', Component: SettingsPage },
    { path: 'profile/activity', Component: ActivityLogPage },
    { path: 'profile/api/create', Component: ApiKeyCreatePage },
    { path: 'profile/api', Component: ApiManagementPage },
    { path: 'profile/vip', Component: VIPPage },
    { path: 'profile/devices', Component: DeviceManagementPage },
    { path: 'profile/sub-accounts', Component: SubAccountPage },
    // Profile bridges (Guidelines §5.3)
    { path: 'profile/predictions', Component: PredictionsPortfolioPage },
    { path: 'profile/arena', Component: MyArenaPage },

    // ═══════════════════════════════════════════════════════════
    //  DCA (Dollar Cost Averaging) — Standalone module
    // ═══════════════════════════════════════════════════════════
    { path: 'dca', Component: DCAPage },
    { path: 'dca/rebalance/config', Component: DCARebalanceConfig },
    { path: 'dca/rebalance/:configId', Component: DCARebalanceDashboard },
    { path: 'dca/schedule/config', Component: DCAScheduleConfig },
    { path: 'dca/schedule/:configId', Component: DCAScheduleAnalytics },
    { path: 'dca/portfolio-optimizer', Component: DCAPortfolioOptimizer },
    { path: 'dca/dynamic-amount', Component: DCADynamicAmount },
    { path: 'dca/backtester', Component: DCABacktesterPage },
    { path: 'dca/multi-asset', Component: DCAMultiAssetPage },
    { path: 'dca/performance-compare', Component: DCAPerformanceComparePage },
    { path: 'dca/smart-rules', Component: DCASmartRulesPage },

    // ═══════════════════════════════════════════════════════════
    //  ADMIN & ANALYTICS
    // ══════════════════════════════���════════════════════════════
    { path: 'admin', Component: AdminHome },
    { path: 'admin/analytics', Component: AnalyticsDashboard },
    { path: 'admin/abtests', Component: ABTestDashboard },
    { path: 'admin/funnels', Component: FunnelDashboard },

    // ═══════════════════════════════════════════════════════════
    //  ARENA — /arena/* (Guidelines §5.3)
    //  Creator-driven, points-only social module
    // ═══════════════════════════════════════════════════════════
    { path: 'arena', Component: ArenaHomePage },
    { path: 'arena/studio', Component: ArenaStudioPage },
    { path: 'arena/studio/smart-rules', Component: ArenaSmartRuleBuilderPage },
    { path: 'arena/studio/presets', Component: ArenaUniversalPresetLibraryPage },
    { path: 'arena/studio/governance', Component: ArenaGovernanceGatePage },
    { path: 'arena/mode/:modeId', Component: ArenaModeDetailPage },
    { path: 'arena/challenge/:challengeId', Component: ArenaChallengeDetailPage },
    { path: 'arena/join/:challengeId', Component: ArenaJoinPage },
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

    // ═══════════════════════════════════════════════════════════
    //  P2P ROUTES — 75+ routes, ordered by specificity
    //  CRITICAL: More specific paths MUST come before generic ones
    // ═══════════════════════════════════════════════════════════

    // ─── P2P: Express Trade (specific first) ───
    { path: 'p2p/express/confirm', Component: P2PExpressConfirmPage },
    { path: 'p2p/express', Component: P2PExpressPage },

    // ─── P2P: Order Management (specific first) ───
    { path: 'p2p/order/timeline/:orderId', Component: P2POrderTimelinePage },
    { path: 'p2p/order/rate/:orderId', Component: P2POrderRatePage },
    { path: 'p2p/order/cancel/:orderId', Component: P2POrderCancelPage },
    { path: 'p2p/order/proof/:orderId', Component: P2POrderProofPage },
    { path: 'p2p/order/:orderId', Component: P2POrderPage },
    { path: 'p2p/chat/:orderId', Component: P2PChatPage },

    // ─── P2P: Dispute & Resolution ───
    { path: 'p2p/dispute/detail/:id', Component: P2PDisputeDetailPage },
    { path: 'p2p/dispute/evidence/:id', Component: P2PDisputeEvidencePage },
    { path: 'p2p/dispute/resolution/:id', Component: P2PDisputeResolutionPage },
    { path: 'p2p/dispute/:orderId', Component: P2PDisputePage },
    { path: 'p2p/disputes', Component: P2PDisputesPage },

    // ─── P2P: Ad Management ───
    { path: 'p2p/ad-analytics/:id', Component: P2PAdAnalyticsPage },
    { path: 'p2p/ad/:id', Component: P2PAdDetailPage },
    { path: 'p2p/my-ads', Component: P2PMyAdsPage },
    { path: 'p2p/create', Component: P2PCreateAdPage },

    // ─── P2P: Merchant & Trust ───
    { path: 'p2p/merchant-apply', Component: P2PMerchantApplyPage },
    { path: 'p2p/merchant/:merchantId', Component: P2PMerchantProfilePage },
    { path: 'p2p/report/:merchantId', Component: P2PReportMerchantPage },
    { path: 'p2p/trading-level', Component: P2PTradingLevelPage },
    { path: 'p2p/reviews', Component: P2PReviewsPage },

    // ─── P2P: Payment Methods ───
    { path: 'p2p/payment-method/add', Component: P2PPaymentMethodAddPage },
    { path: 'p2p/payment-method/verification/:id', Component: P2PPaymentMethodVerificationPage },
    { path: 'p2p/payment-method/ownership/:id', Component: P2PPaymentMethodOwnershipPage },
    { path: 'p2p/payment-method/cooling-period', Component: P2PPaymentMethodCoolingPeriodPage },
    { path: 'p2p/payment-method/history', Component: P2PPaymentMethodHistoryPage },
    { path: 'p2p/payment-methods', Component: P2PPaymentMethodsPage },

    // ─── P2P: Insurance & Escrow ───
    {
      path: 'p2p/insurance',
      children: [
        { index: true, Component: P2PInsuranceFundPage },
        { path: 'certificate', Component: P2PInsuranceCertificatePage },
        { path: 'score', Component: P2PInsuranceScorePage },
        { path: 'policy', Component: P2PInsurancePolicyPage },
        { path: 'contribution-history', Component: P2PContributionHistoryPage },
        { path: 'claim/:id', Component: P2PClaimDetailPage },
      ],
    },
    { path: 'p2p/insurance-fund', Component: P2PInsuranceFundPage },
    { path: 'p2p/escrow/balance', Component: P2PEscrowBalancePage },
    { path: 'p2p/escrow/:orderId', Component: P2PEscrowDetailPage },

    // ─── P2P: KYC & Verification (Phase 1) ───
    { path: 'p2p/kyc/requirements', Component: P2PKYCRequirementsPage },
    { path: 'p2p/kyc/status', Component: P2PKYCStatusPage },
    { path: 'p2p/kyc/identity', Component: P2PIdentityVerificationPage },
    { path: 'p2p/kyc/address', Component: P2PAddressProofPage },
    { path: 'p2p/kyc/selfie', Component: P2PSelfieVerificationPage },
    { path: 'p2p/kyc/video', Component: P2PVideoVerificationPage },

    // ─── P2P: Security (Phase 1) ───
    { path: 'p2p/security/center', Component: P2PSecurityCenterPage },
    { path: 'p2p/security/2fa', Component: P2P2FASettingsPage },
    { path: 'p2p/security/devices', Component: P2PDeviceManagementPage },
    { path: 'p2p/security/anti-phishing', Component: P2PAntiPhishingCodePage },
    { path: 'p2p/security/login-history', Component: P2PLoginHistoryPage },
    { path: 'p2p/security/suspicious-activity', Component: P2PSuspiciousActivityPage },
    { path: 'p2p/e2e-info', Component: P2PE2EInfoPage },
    { path: 'p2p/fraud-prevention', Component: P2PFraudPreventionPage },

    // ─── P2P: Wallet & Limits (Phase 1) ───
    { path: 'p2p/wallet/transfer', Component: P2PWalletTransferPage },
    { path: 'p2p/wallet/fund-lock-history', Component: P2PFundLockHistoryPage },
    { path: 'p2p/wallet/history', Component: P2PFundLockHistoryPage }, // alias: P2P wallet tx history
    { path: 'p2p/wallet', Component: P2PWalletPage },
    { path: 'p2p/limits/tracker', Component: P2PLimitTrackerPage },
    { path: 'p2p/limits', Component: P2PTransactionLimitsPage },

    // ─── P2P: Compliance & Regulatory (Phase 1 + 3) ───
    { path: 'p2p/compliance/overview', Component: P2PComplianceOverviewPage },
    { path: 'p2p/compliance/aml-screening', Component: P2PAMLScreeningPage },
    { path: 'p2p/compliance/source-of-funds', Component: P2PSourceOfFundsPage },
    { path: 'p2p/compliance/large-transaction', Component: P2PLargeTransactionJustificationPage },
    { path: 'p2p/compliance/risk-assessment', Component: P2PRiskAssessmentPage },
    { path: 'p2p/tax-reporting', Component: P2PTaxReportingPage },

    // ─── P2P: Advanced Features ───
    { path: 'p2p/order-book', Component: P2POrderBookPage },
    { path: 'p2p/dashboard', Component: P2PDashboardPage },
    { path: 'p2p/achievements', Component: P2PAchievementsPage },

    // ─── P2P: Settings & Support ───
    { path: 'p2p/blacklist/add', Component: P2PBlacklistAddPage },
    { path: 'p2p/blacklist', Component: P2PBlacklistPage },
    { path: 'p2p/settings/notifications', Component: P2PNotificationsSettingsPage },
    { path: 'p2p/settings', Component: P2PSettingsPage },
    { path: 'p2p/guide', Component: P2PGuidePage },

    // ─── P2P: Orders List ───
    { path: 'p2p/my-orders', Component: P2PMyOrdersPage },

    // ─── P2P: Home (LEAST specific, MUST be LAST) ───
    { path: 'p2p', Component: o.P2PHomePage },

    // ══════════════════════════════════════════════════════════
    //  DISCOVERY — Unified Search & Topic Hub
    // ═══════════════════════════════════════════════════════════
    { path: 'search', Component: UnifiedSearchPage },
    { path: 'topics', Component: TopicHubPage },
    { path: 'topic/:topicId', Component: TopicHubPage },

    // ══════════════════════════════════════════════════════════
    //  EARN — Staking & Savings
    // ══════════════════════════════════════════════════════════
    // Note: Staking routes are lazy-loaded via createStakingRoutes()
    // See bottom of file for lazy-loaded staking routes
    
    // ══════════════════════════════════════════════════════════
    //  REFERRAL
    // ═════════════════════════════════════════════════════════
    { path: 'referral/history', Component: ReferralHistoryPage },
    { path: 'referral/rewards', Component: ReferralRewardsPage },
    { path: 'referral/rules', Component: ReferralRulesPage },
    { path: 'referral/friend/:friendId', Component: ReferralFriendDetailPage },
    { path: 'referral', Component: ReferralHomePage },

    // ═══════════════════════════════════════════════════════════
    //  MISC — Notifications, Support, Launchpad, Rewards
    // ═══════════════════════���═══════════════════════════════════
    { path: 'notifications', Component: NotificationsPage },
    { path: 'support/help', Component: HelpCenterPage },
    { path: 'support/announcements', Component: AnnouncementsPage },
    { path: 'support', Component: SupportPage },
    { path: 'launchpad', Component: LaunchpadPage },
    { path: 'launchpad/portfolio', Component: LaunchpadPortfolioPage },
    { path: 'launchpad/performance', Component: LaunchpadPerformancePage },
    { path: 'launchpad/staking', Component: LaunchpadStakingPage },
    { path: 'launchpad/idobridge/:id', Component: LaunchpadIDOBridgePage },
    { path: 'launchpad/contract/:id', Component: LaunchpadContractPage },
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
    { path: 'launchpad/:id', Component: LaunchpadDetailPage },
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
    { path: 'dev/route-checker', Component: RouteChecker },
    { path: 'dev/performance-monitor', Component: PerformanceMonitor },

    // ═══════════════════════════════════════════════════════════
    //  STAKING — Lazy Loaded Routes
    // ═══════════════════════════════════════════════════════════
    ...createStakingRoutes(),
  ];
}