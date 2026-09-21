import { lazy } from 'react';
import React from 'react';
import type { RouteObject } from 'react-router';

// ═══════════════════════════════════════════════════════════
//  ALL PAGES LAZY-LOADED — route-level code splitting.
//  Each page ships as its own chunk; the shared RootLayout
//  Suspense boundary renders the chunk fallback.
//  Only layout/route helpers remain statically imported.
// ═══════════════════════════════════════════════════════════

// ─── Auth Pages ───
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const OTPPage = lazy(() => import('./pages/auth/OTPPage').then((m) => ({ default: m.OTPPage })));
const TwoFASetupPage = lazy(() =>
  import('./pages/auth/TwoFASetupPage').then((m) => ({ default: m.TwoFASetupPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
);

// ─── Auth Layout ───
import { AuthLayout } from './components/layout/AuthLayout';

// ─── Core Shell Pages ───
const TradePage = lazy(() =>
  import('./pages/trade/TradePage').then((m) => ({ default: m.TradePage })),
);
const WalletPage = lazy(() =>
  import('./pages/wallet/WalletPage').then((m) => ({ default: m.WalletPage })),
);
const TxHistoryPage = lazy(() =>
  import('./pages/wallet/TransactionHistoryPage').then((m) => ({
    default: m.TransactionHistoryPage,
  })),
);
const ProfilePage = lazy(() =>
  import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const HomePage = lazy(() =>
  import('./pages/market/HomePage').then((m) => ({ default: m.HomePage })),
);
const MarketListPage = lazy(() =>
  import('./pages/market/MarketListPage').then((m) => ({ default: m.MarketListPage })),
);
const PairDetailPage = lazy(() =>
  import('./pages/market/PairDetailPage').then((m) => ({ default: m.PairDetailPage })),
);

// ─── Trade Sub-pages ───
const OrdersHistoryPage = lazy(() =>
  import('./pages/trade/OrdersHistoryPage').then((m) => ({ default: m.OrdersHistoryPage })),
);
const AdvancedChartPage = lazy(() =>
  import('./pages/trade/AdvancedChartPage').then((m) => ({ default: m.AdvancedChartPage })),
);
const ConvertPage = lazy(() =>
  import('./pages/trade/ConvertPage').then((m) => ({ default: m.ConvertPage })),
);
const FuturesPage = lazy(() =>
  import('./pages/trade/FuturesPage').then((m) => ({ default: m.FuturesPage })),
);
const LeveragePage = lazy(() =>
  import('./pages/trade/LeveragePage').then((m) => ({ default: m.LeveragePage })),
);
const TradingBotsPage = lazy(() =>
  import('./pages/trade/TradingBotsPage').then((m) => ({ default: m.TradingBotsPage })),
);
const CopyTradingPage = lazy(() =>
  import('./pages/trade/CopyTradingPage').then((m) => ({ default: m.CopyTradingPage })),
);
const CopyTradingPageV2 = lazy(() =>
  import('./pages/trade/CopyTradingPageV2').then((m) => ({ default: m.CopyTradingPageV2 })),
);
const CopyProviderDetailPage = lazy(() =>
  import('./pages/trade/CopyProviderDetailPage').then((m) => ({
    default: m.CopyProviderDetailPage,
  })),
);
const PreCopyAssessmentPage = lazy(() =>
  import('./pages/trade/PreCopyAssessmentPage').then((m) => ({ default: m.PreCopyAssessmentPage })),
);
const RiskManagementDemoPage = lazy(() =>
  import('./pages/trade/RiskManagementDemoPage').then((m) => ({
    default: m.RiskManagementDemoPage,
  })),
);
const ExecutionQualityDemoPage = lazy(() =>
  import('./pages/trade/ExecutionQualityDemoPage').then((m) => ({
    default: m.ExecutionQualityDemoPage,
  })),
);
const AdvancedToolsDemoPage = lazy(() =>
  import('./pages/trade/AdvancedToolsDemoPage').then((m) => ({ default: m.AdvancedToolsDemoPage })),
);
const CopyEducationPage = lazy(() =>
  import('./pages/trade/CopyEducationPage').then((m) => ({ default: m.CopyEducationPage })),
);
const CopyConfigurationPage = lazy(() =>
  import('./pages/trade/CopyConfigurationPage').then((m) => ({ default: m.CopyConfigurationPage })),
);
const CopyConfirmationPage = lazy(() =>
  import('./pages/trade/CopyConfirmationPage').then((m) => ({ default: m.CopyConfirmationPage })),
);
const ActiveCopiesPage = lazy(() =>
  import('./pages/trade/ActiveCopiesPage').then((m) => ({ default: m.ActiveCopiesPage })),
);
const CopyPerformancePage = lazy(() =>
  import('./pages/trade/CopyPerformancePage').then((m) => ({ default: m.CopyPerformancePage })),
);
const ProviderApplicationPage = lazy(() =>
  import('./pages/trade/ProviderApplicationPage').then((m) => ({
    default: m.ProviderApplicationPage,
  })),
);
const CopySettingsPage = lazy(() =>
  import('./pages/trade/CopySettingsPage').then((m) => ({ default: m.CopySettingsPage })),
);
const CopyNotificationsPage = lazy(() =>
  import('./pages/trade/CopyNotificationsPage').then((m) => ({ default: m.CopyNotificationsPage })),
);
const PerformanceAttributionPage = lazy(() =>
  import('./pages/trade/PerformanceAttributionPage').then((m) => ({
    default: m.PerformanceAttributionPage,
  })),
);
const ProviderComparisonPage = lazy(() =>
  import('./pages/trade/ProviderComparisonPage').then((m) => ({
    default: m.ProviderComparisonPage,
  })),
);
const CopyAuditLogPage = lazy(() =>
  import('./pages/trade/CopyAuditLogPage').then((m) => ({ default: m.CopyAuditLogPage })),
);
const PortfolioRiskAnalysisPage = lazy(() =>
  import('./pages/trade/PortfolioRiskAnalysisPage').then((m) => ({
    default: m.PortfolioRiskAnalysisPage,
  })),
);
const ProviderLeaderboardPage = lazy(() =>
  import('./pages/trade/ProviderLeaderboardPage').then((m) => ({
    default: m.ProviderLeaderboardPage,
  })),
);
const SafetyEducationPage = lazy(() =>
  import('./pages/trade/SafetyEducationPage').then((m) => ({ default: m.SafetyEducationPage })),
);
const ProviderGovernancePage = lazy(() =>
  import('./pages/trade/ProviderGovernancePage').then((m) => ({
    default: m.ProviderGovernancePage,
  })),
);
const DisputeResolutionPage = lazy(() =>
  import('./pages/trade/DisputeResolutionPage').then((m) => ({ default: m.DisputeResolutionPage })),
);
const CopySafetyCenterPage = lazy(() =>
  import('./pages/trade/CopySafetyCenterPage').then((m) => ({ default: m.CopySafetyCenterPage })),
);
const RegulatoryDisclosuresPage = lazy(() =>
  import('./pages/trade/RegulatoryDisclosuresPage').then((m) => ({
    default: m.RegulatoryDisclosuresPage,
  })),
);
const MarginTradingPage = lazy(() =>
  import('./pages/trade/MarginTradingPage').then((m) => ({ default: m.MarginTradingPage })),
);
const TraderProfilePage = lazy(() =>
  import('./pages/trade/TraderProfilePage').then((m) => ({ default: m.TraderProfilePage })),
);

// ─── Margin Trading - P1 & P2 Advanced Features ───
const AdvancedTradingDemoPage = lazy(() =>
  import('./pages/trade/AdvancedTradingDemoPage').then((m) => ({
    default: m.AdvancedTradingDemoPage,
  })),
);
const MarketDataAnalyticsPage = lazy(() =>
  import('./pages/trade/MarketDataAnalyticsPage').then((m) => ({
    default: m.MarketDataAnalyticsPage,
  })),
);
const MarginTradingHubPage = lazy(() =>
  import('./pages/trade/MarginTradingHubPage').then((m) => ({ default: m.MarginTradingHubPage })),
);
const LiveMarketDataAnalyticsPage = lazy(() =>
  import('./pages/trade/LiveMarketDataAnalyticsPage').then((m) => ({
    default: m.LiveMarketDataAnalyticsPage,
  })),
);
const AdvancedAnalyticsPage = lazy(() =>
  import('./pages/trade/AdvancedAnalyticsPage').then((m) => ({ default: m.AdvancedAnalyticsPage })),
);

// ─── Copy Trading - Phase 4 Sprint 1: Transaction Reporting & Best Execution ───
const TransactionReportingPage = lazy(() =>
  import('./pages/trade/TransactionReportingPage').then((m) => ({
    default: m.TransactionReportingPage,
  })),
);
const RegulatoryReportsDashboardPage = lazy(() =>
  import('./pages/trade/RegulatoryReportsDashboardPage').then((m) => ({
    default: m.RegulatoryReportsDashboardPage,
  })),
);
const ARMIntegrationStatusPage = lazy(() =>
  import('./pages/trade/ARMIntegrationStatusPage').then((m) => ({
    default: m.ARMIntegrationStatusPage,
  })),
);
const BestExecutionReportsPage = lazy(() =>
  import('./pages/trade/BestExecutionReportsPage').then((m) => ({
    default: m.BestExecutionReportsPage,
  })),
);
const ExecutionVenueAnalysisPage = lazy(() =>
  import('./pages/trade/ExecutionVenueAnalysisPage').then((m) => ({
    default: m.ExecutionVenueAnalysisPage,
  })),
);
const SlippageMonitoringPage = lazy(() =>
  import('./pages/trade/SlippageMonitoringPage').then((m) => ({
    default: m.SlippageMonitoringPage,
  })),
);

// ─── Copy Trading - Phase 4 Sprint 2: Client Protection & Governance ───
const ClientCategorizationPage = lazy(() =>
  import('./pages/trade/ClientCategorizationPage').then((m) => ({
    default: m.ClientCategorizationPage,
  })),
);
const ProductGovernancePage = lazy(() =>
  import('./pages/trade/ProductGovernancePage').then((m) => ({ default: m.ProductGovernancePage })),
);
const TargetMarketDefinitionPage = lazy(() =>
  import('./pages/trade/TargetMarketDefinitionPage').then((m) => ({
    default: m.TargetMarketDefinitionPage,
  })),
);
const ClientMoneyProtectionPage = lazy(() =>
  import('./pages/trade/ClientMoneyProtectionPage').then((m) => ({
    default: m.ClientMoneyProtectionPage,
  })),
);
const CASSReconciliationPage = lazy(() =>
  import('./pages/trade/CASSReconciliationPage').then((m) => ({
    default: m.CASSReconciliationPage,
  })),
);
const InvestorCompensationPage = lazy(() =>
  import('./pages/trade/InvestorCompensationPage').then((m) => ({
    default: m.InvestorCompensationPage,
  })),
);

// ─── Copy Trading - Phase 4 Sprint 3: Cost Transparency & KID ───
const ExAnteCostsPage = lazy(() =>
  import('./pages/trade/ExAnteCostsPage').then((m) => ({ default: m.ExAnteCostsPage })),
);
const RIYCalculatorPage = lazy(() =>
  import('./pages/trade/RIYCalculatorPage').then((m) => ({ default: m.RIYCalculatorPage })),
);
const ExPostCostsReportPage = lazy(() =>
  import('./pages/trade/ExPostCostsReportPage').then((m) => ({ default: m.ExPostCostsReportPage })),
);
const KIDGeneratorPage = lazy(() =>
  import('./pages/trade/KIDGeneratorPage').then((m) => ({ default: m.KIDGeneratorPage })),
);
const PerformanceScenariosPage = lazy(() =>
  import('./pages/trade/PerformanceScenariosPage').then((m) => ({
    default: m.PerformanceScenariosPage,
  })),
);
const RiskIndicatorExplainerPage = lazy(() =>
  import('./pages/trade/RiskIndicatorExplainerPage').then((m) => ({
    default: m.RiskIndicatorExplainerPage,
  })),
);

// ─── Copy Trading - Phase 4 Sprint 4: Complaints & Audit Trail ───
const ComplaintsHandlingPage = lazy(() =>
  import('./pages/trade/ComplaintsHandlingPage').then((m) => ({
    default: m.ComplaintsHandlingPage,
  })),
);
const ComplaintSubmissionPage = lazy(() =>
  import('./pages/trade/ComplaintSubmissionPage').then((m) => ({
    default: m.ComplaintSubmissionPage,
  })),
);
const ComplaintTrackingPage = lazy(() =>
  import('./pages/trade/ComplaintTrackingPage').then((m) => ({ default: m.ComplaintTrackingPage })),
);
const OmbudsmanReferralPage = lazy(() =>
  import('./pages/trade/OmbudsmanReferralPage').then((m) => ({ default: m.OmbudsmanReferralPage })),
);
const AuditTrailPage = lazy(() =>
  import('./pages/trade/AuditTrailPage').then((m) => ({ default: m.AuditTrailPage })),
);
const RegulatoryInspectionReadyPage = lazy(() =>
  import('./pages/trade/RegulatoryInspectionReadyPage').then((m) => ({
    default: m.RegulatoryInspectionReadyPage,
  })),
);

// ─── Trade Sprint 1B-3: Enhanced Trading Features ───
const OrderReceiptPage = lazy(() =>
  import('./pages/trade/OrderReceiptPage').then((m) => ({ default: m.OrderReceiptPage })),
);
const TradeSettingsPage = lazy(() =>
  import('./pages/trade/TradeSettingsPage').then((m) => ({ default: m.TradeSettingsPage })),
);
const PositionDashboardPage = lazy(() =>
  import('./pages/trade/PositionDashboardPage').then((m) => ({ default: m.PositionDashboardPage })),
);
const TradeHistoryExportPage = lazy(() =>
  import('./pages/trade/TradeHistoryExportPage').then((m) => ({
    default: m.TradeHistoryExportPage,
  })),
);

// ─── Trading Bots Sub-pages (Phase 1: Compliance MVP) ───
const BotTermsOfServicePage = lazy(() =>
  import('./pages/trade/bots/BotTermsOfServicePage').then((m) => ({
    default: m.BotTermsOfServicePage,
  })),
);
const BotRiskDisclosurePage = lazy(() =>
  import('./pages/trade/bots/BotRiskDisclosurePage').then((m) => ({
    default: m.BotRiskDisclosurePage,
  })),
);
const BotSuitabilityAssessmentPage = lazy(() =>
  import('./pages/trade/bots/BotSuitabilityAssessmentPage').then((m) => ({
    default: m.BotSuitabilityAssessmentPage,
  })),
);
const BotRiskDashboardPage = lazy(() =>
  import('./pages/trade/bots/BotRiskDashboardPage').then((m) => ({
    default: m.BotRiskDashboardPage,
  })),
);
const BotEmergencyStopPage = lazy(() =>
  import('./pages/trade/bots/BotEmergencyStopPage').then((m) => ({
    default: m.BotEmergencyStopPage,
  })),
);
const BotSecuritySettingsPage = lazy(() =>
  import('./pages/trade/bots/BotSecuritySettingsPage').then((m) => ({
    default: m.BotSecuritySettingsPage,
  })),
);
const BotHistoryPage = lazy(() =>
  import('./pages/trade/bots/BotHistoryPage').then((m) => ({ default: m.BotHistoryPage })),
);
const BotPerformanceAnalyticsPage = lazy(() =>
  import('./pages/trade/bots/BotPerformanceAnalyticsPage').then((m) => ({
    default: m.BotPerformanceAnalyticsPage,
  })),
);

// ─── Trading Bots Sub-pages (Phase 2: Analytics & Optimization) ───
const BotBacktestingPage = lazy(() =>
  import('./pages/trade/bots/BotBacktestingPage').then((m) => ({ default: m.BotBacktestingPage })),
);
const BotStrategyComparePage = lazy(() =>
  import('./pages/trade/bots/BotStrategyComparePage').then((m) => ({
    default: m.BotStrategyComparePage,
  })),
);
const BotOptimizationPage = lazy(() =>
  import('./pages/trade/bots/BotOptimizationPage').then((m) => ({
    default: m.BotOptimizationPage,
  })),
);
const BotPortfolioDashboardPage = lazy(() =>
  import('./pages/trade/bots/BotPortfolioDashboardPage').then((m) => ({
    default: m.BotPortfolioDashboardPage,
  })),
);
const BotDrawdownAnalyzerPage = lazy(() =>
  import('./pages/trade/bots/BotDrawdownAnalyzerPage').then((m) => ({
    default: m.BotDrawdownAnalyzerPage,
  })),
);
const BotEquityCurvePage = lazy(() =>
  import('./pages/trade/bots/BotEquityCurvePage').then((m) => ({ default: m.BotEquityCurvePage })),
);

// ─── Trading Bots Sub-pages (Phase 3: Polish & Enterprise) ───
const BotGuidePage = lazy(() =>
  import('./pages/trade/bots/BotGuidePage').then((m) => ({ default: m.BotGuidePage })),
);
const BotFAQPage = lazy(() =>
  import('./pages/trade/bots/BotFAQPage').then((m) => ({ default: m.BotFAQPage })),
);
const BotTaxReportingPage = lazy(() =>
  import('./pages/trade/bots/BotTaxReportingPage').then((m) => ({
    default: m.BotTaxReportingPage,
  })),
);
const BotAPIDocumentationPage = lazy(() =>
  import('./pages/trade/bots/BotAPIDocumentationPage').then((m) => ({
    default: m.BotAPIDocumentationPage,
  })),
);

// ─── Wallet Sub-pages ───
const DepositPage = lazy(() =>
  import('./pages/wallet/DepositPage').then((m) => ({ default: m.DepositPage })),
);
const WithdrawPage = lazy(() =>
  import('./pages/wallet/WithdrawPage').then((m) => ({ default: m.WithdrawPage })),
);
const TransactionDetailPage = lazy(() =>
  import('./pages/wallet/TransactionDetailPage').then((m) => ({
    default: m.TransactionDetailPage,
  })),
);
const PortfolioAnalyticsPage = lazy(() =>
  import('./pages/wallet/PortfolioAnalyticsPage').then((m) => ({
    default: m.PortfolioAnalyticsPage,
  })),
);
const AddressBookPage = lazy(() =>
  import('./pages/wallet/AddressBookPage').then((m) => ({ default: m.AddressBookPage })),
);
const AddressAddPage = lazy(() =>
  import('./pages/wallet/AddressAddPage').then((m) => ({ default: m.AddressAddPage })),
);
const BuyCryptoPage = lazy(() =>
  import('./pages/wallet/BuyCryptoPage').then((m) => ({ default: m.BuyCryptoPage })),
);
const TransferPage = lazy(() =>
  import('./pages/wallet/TransferPage').then((m) => ({ default: m.TransferPage })),
);
const AssetDetailPage = lazy(() =>
  import('./pages/wallet/AssetDetailPage').then((m) => ({ default: m.AssetDetailPage })),
);
const WalletMultiManagerPage = lazy(() =>
  import('./pages/wallet/WalletMultiManagerPage').then((m) => ({
    default: m.WalletMultiManagerPage,
  })),
);
const WalletGasOptimizerPage = lazy(() =>
  import('./pages/wallet/WalletGasOptimizerPage').then((m) => ({
    default: m.WalletGasOptimizerPage,
  })),
);
const WalletTokenApprovalPage = lazy(() =>
  import('./pages/wallet/WalletTokenApprovalPage').then((m) => ({
    default: m.WalletTokenApprovalPage,
  })),
);
const WalletHealthScorePage = lazy(() =>
  import('./pages/wallet/WalletHealthScorePage').then((m) => ({
    default: m.WalletHealthScorePage,
  })),
);
const PendingDepositsPage = lazy(() =>
  import('./pages/wallet/PendingDepositsPage').then((m) => ({ default: m.PendingDepositsPage })),
);
const WithdrawLimitsPage = lazy(() =>
  import('./pages/wallet/WithdrawLimitsPage').then((m) => ({ default: m.WithdrawLimitsPage })),
);
const DustConverterPage = lazy(() =>
  import('./pages/wallet/DustConverterPage').then((m) => ({ default: m.DustConverterPage })),
);
const NetworkStatusPage = lazy(() =>
  import('./pages/wallet/NetworkStatusPage').then((m) => ({ default: m.NetworkStatusPage })),
);

// ─── Profile Sub-pages ───
const EditProfilePage = lazy(() =>
  import('./pages/profile/EditProfilePage').then((m) => ({ default: m.EditProfilePage })),
);
const SecurityPage = lazy(() =>
  import('./pages/profile/SecurityPage').then((m) => ({ default: m.SecurityPage })),
);
const KYCPage = lazy(() => import('./pages/profile/KYCPage').then((m) => ({ default: m.KYCPage })));
const SettingsPage = lazy(() =>
  import('./pages/profile/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const ActivityLogPage = lazy(() =>
  import('./pages/profile/ActivityLogPage').then((m) => ({ default: m.ActivityLogPage })),
);
const ApiManagementPage = lazy(() =>
  import('./pages/profile/ApiManagementPage').then((m) => ({ default: m.ApiManagementPage })),
);
const ApiKeyCreatePage = lazy(() =>
  import('./pages/profile/ApiKeyCreatePage').then((m) => ({ default: m.ApiKeyCreatePage })),
);
const VIPPage = lazy(() => import('./pages/profile/VIPPage').then((m) => ({ default: m.VIPPage })));
const DeviceManagementPage = lazy(() =>
  import('./pages/profile/DeviceManagementPage').then((m) => ({ default: m.DeviceManagementPage })),
);
const SubAccountPage = lazy(() =>
  import('./pages/profile/SubAccountPage').then((m) => ({ default: m.SubAccountPage })),
);

// ─── P2P Pages (Core + Phase 1-6) ───
const P2PHomePage = lazy(() =>
  import('./pages/p2p/P2PHomePage').then((m) => ({ default: m.P2PHomePage })),
);
const P2PCreateAdPage = lazy(() =>
  import('./pages/p2p/P2PCreateAdPage').then((m) => ({ default: m.P2PCreateAdPage })),
);
const P2PPaymentMethodsPage = lazy(() =>
  import('./pages/p2p/P2PPaymentMethodsPage').then((m) => ({ default: m.P2PPaymentMethodsPage })),
);
const P2PPaymentMethodAddPage = lazy(() =>
  import('./pages/p2p/P2PPaymentMethodAddPage').then((m) => ({
    default: m.P2PPaymentMethodAddPage,
  })),
);
const P2PMyOrdersPage = lazy(() =>
  import('./pages/p2p/P2PMyOrdersPage').then((m) => ({ default: m.P2PMyOrdersPage })),
);
const P2PMyAdsPage = lazy(() =>
  import('./pages/p2p/P2PMyAdsPage').then((m) => ({ default: m.P2PMyAdsPage })),
);
const P2PAdDetailPage = lazy(() =>
  import('./pages/p2p/P2PAdDetailPage').then((m) => ({ default: m.P2PAdDetailPage })),
);
const P2PAdAnalyticsPage = lazy(() =>
  import('./pages/p2p/P2PAdAnalyticsPage').then((m) => ({ default: m.P2PAdAnalyticsPage })),
);
const P2PMerchantProfilePage = lazy(() =>
  import('./pages/p2p/P2PMerchantProfilePage').then((m) => ({ default: m.P2PMerchantProfilePage })),
);
const P2PMerchantApplyPage = lazy(() =>
  import('./pages/p2p/P2PMerchantApplyPage').then((m) => ({ default: m.P2PMerchantApplyPage })),
);
const P2PReportMerchantPage = lazy(() =>
  import('./pages/p2p/P2PReportMerchantPage').then((m) => ({ default: m.P2PReportMerchantPage })),
);
const P2PTradingLevelPage = lazy(() =>
  import('./pages/p2p/P2PTradingLevelPage').then((m) => ({ default: m.P2PTradingLevelPage })),
);
const P2POrderPage = lazy(() =>
  import('./pages/p2p/P2POrderPage').then((m) => ({ default: m.P2POrderPage })),
);
const P2PChatPage = lazy(() =>
  import('./pages/p2p/P2PChatPage').then((m) => ({ default: m.P2PChatPage })),
);
const P2POrderRatePage = lazy(() =>
  import('./pages/p2p/P2POrderRatePage').then((m) => ({ default: m.P2POrderRatePage })),
);
const P2POrderCancelPage = lazy(() =>
  import('./pages/p2p/P2POrderCancelPage').then((m) => ({ default: m.P2POrderCancelPage })),
);
const P2POrderProofPage = lazy(() =>
  import('./pages/p2p/P2POrderProofPage').then((m) => ({ default: m.P2POrderProofPage })),
);
const P2POrderTimelinePage = lazy(() =>
  import('./pages/p2p/P2POrderTimelinePage').then((m) => ({ default: m.P2POrderTimelinePage })),
);
const P2PDisputePage = lazy(() =>
  import('./pages/p2p/P2PDisputePage').then((m) => ({ default: m.P2PDisputePage })),
);
const P2PDisputeDetailPage = lazy(() =>
  import('./pages/p2p/P2PDisputeDetailPage').then((m) => ({ default: m.P2PDisputeDetailPage })),
);
const P2PDisputesPage = lazy(() =>
  import('./pages/p2p/P2PDisputesPage').then((m) => ({ default: m.P2PDisputesPage })),
);
const P2PDisputeEvidencePage = lazy(() =>
  import('./pages/p2p/P2PDisputeEvidencePage').then((m) => ({ default: m.P2PDisputeEvidencePage })),
);
const P2PDisputeResolutionPage = lazy(() =>
  import('./pages/p2p/P2PDisputeResolutionPage').then((m) => ({
    default: m.P2PDisputeResolutionPage,
  })),
);
const P2PAchievementsPage = lazy(() =>
  import('./pages/p2p/P2PAchievementsPage').then((m) => ({ default: m.P2PAchievementsPage })),
);
const P2POrderBookPage = lazy(() =>
  import('./pages/p2p/P2POrderBookPage').then((m) => ({ default: m.P2POrderBookPage })),
);
const P2PDashboardPage = lazy(() =>
  import('./pages/p2p/P2PDashboardPage').then((m) => ({ default: m.P2PDashboardPage })),
);
const P2PReviewsPage = lazy(() =>
  import('./pages/p2p/P2PReviewsPage').then((m) => ({ default: m.P2PReviewsPage })),
);
const P2PInsuranceFundPage = lazy(() =>
  import('./pages/p2p/P2PInsuranceFundPage').then((m) => ({ default: m.P2PInsuranceFundPage })),
);
const P2PEscrowDetailPage = lazy(() =>
  import('./pages/p2p/P2PEscrowDetailPage').then((m) => ({ default: m.P2PEscrowDetailPage })),
);
const P2PClaimDetailPage = lazy(() =>
  import('./pages/p2p/P2PClaimDetailPage').then((m) => ({ default: m.P2PClaimDetailPage })),
);
const P2PInsurancePolicyPage = lazy(() =>
  import('./pages/p2p/P2PInsurancePolicyPage').then((m) => ({ default: m.P2PInsurancePolicyPage })),
);
const P2PContributionHistoryPage = lazy(() =>
  import('./pages/p2p/P2PContributionHistoryPage').then((m) => ({
    default: m.P2PContributionHistoryPage,
  })),
);
const P2PInsuranceScorePage = lazy(() =>
  import('./pages/p2p/P2PInsuranceScorePage').then((m) => ({ default: m.P2PInsuranceScorePage })),
);
const P2PInsuranceCertificatePage = lazy(() =>
  import('./pages/p2p/P2PInsuranceCertificatePage').then((m) => ({
    default: m.P2PInsuranceCertificatePage,
  })),
);
const P2PBlacklistPage = lazy(() =>
  import('./pages/p2p/P2PBlacklistPage').then((m) => ({ default: m.P2PBlacklistPage })),
);
const P2PBlacklistAddPage = lazy(() =>
  import('./pages/p2p/P2PBlacklistAddPage').then((m) => ({ default: m.P2PBlacklistAddPage })),
);
const P2PSettingsPage = lazy(() =>
  import('./pages/p2p/P2PSettingsPage').then((m) => ({ default: m.P2PSettingsPage })),
);
const P2PFraudPreventionPage = lazy(() =>
  import('./pages/p2p/P2PFraudPreventionPage').then((m) => ({ default: m.P2PFraudPreventionPage })),
);
const P2PNotificationsSettingsPage = lazy(() =>
  import('./pages/p2p/P2PNotificationsSettingsPage').then((m) => ({
    default: m.P2PNotificationsSettingsPage,
  })),
);
const P2PExpressPage = lazy(() =>
  import('./pages/p2p/P2PExpressPage').then((m) => ({ default: m.P2PExpressPage })),
);
const P2PExpressConfirmPage = lazy(() =>
  import('./pages/p2p/P2PExpressConfirmPage').then((m) => ({ default: m.P2PExpressConfirmPage })),
);
const P2PGuidePage = lazy(() =>
  import('./pages/p2p/P2PGuidePage').then((m) => ({ default: m.P2PGuidePage })),
);
const P2PE2EInfoPage = lazy(() =>
  import('./pages/p2p/P2PE2EInfoPage').then((m) => ({ default: m.P2PE2EInfoPage })),
);
// Phase 1: KYC & Verification
const P2PKYCRequirementsPage = lazy(() =>
  import('./pages/p2p/P2PKYCRequirementsPage').then((m) => ({ default: m.P2PKYCRequirementsPage })),
);
const P2PKYCStatusPage = lazy(() =>
  import('./pages/p2p/P2PKYCStatusPage').then((m) => ({ default: m.P2PKYCStatusPage })),
);
const P2PIdentityVerificationPage = lazy(() =>
  import('./pages/p2p/P2PIdentityVerificationPage').then((m) => ({
    default: m.P2PIdentityVerificationPage,
  })),
);
const P2PAddressProofPage = lazy(() =>
  import('./pages/p2p/P2PAddressProofPage').then((m) => ({ default: m.P2PAddressProofPage })),
);
const P2PSelfieVerificationPage = lazy(() =>
  import('./pages/p2p/P2PSelfieVerificationPage').then((m) => ({
    default: m.P2PSelfieVerificationPage,
  })),
);
const P2PVideoVerificationPage = lazy(() =>
  import('./pages/p2p/P2PVideoVerificationPage').then((m) => ({
    default: m.P2PVideoVerificationPage,
  })),
);
// Phase 1: Security
const P2PSecurityCenterPage = lazy(() =>
  import('./pages/p2p/P2PSecurityCenterPage').then((m) => ({ default: m.P2PSecurityCenterPage })),
);
const P2P2FASettingsPage = lazy(() =>
  import('./pages/p2p/P2P2FASettingsPage').then((m) => ({ default: m.P2P2FASettingsPage })),
);
const P2PDeviceManagementPage = lazy(() =>
  import('./pages/p2p/P2PDeviceManagementPage').then((m) => ({
    default: m.P2PDeviceManagementPage,
  })),
);
const P2PAntiPhishingCodePage = lazy(() =>
  import('./pages/p2p/P2PAntiPhishingCodePage').then((m) => ({
    default: m.P2PAntiPhishingCodePage,
  })),
);
const P2PLoginHistoryPage = lazy(() =>
  import('./pages/p2p/P2PLoginHistoryPage').then((m) => ({ default: m.P2PLoginHistoryPage })),
);
const P2PSuspiciousActivityPage = lazy(() =>
  import('./pages/p2p/P2PSuspiciousActivityPage').then((m) => ({
    default: m.P2PSuspiciousActivityPage,
  })),
);
// Phase 1: Wallet & Limits
const P2PWalletPage = lazy(() =>
  import('./pages/p2p/P2PWalletPage').then((m) => ({ default: m.P2PWalletPage })),
);
const P2PWalletTransferPage = lazy(() =>
  import('./pages/p2p/P2PWalletTransferPage').then((m) => ({ default: m.P2PWalletTransferPage })),
);
const P2PEscrowBalancePage = lazy(() =>
  import('./pages/p2p/P2PEscrowBalancePage').then((m) => ({ default: m.P2PEscrowBalancePage })),
);
const P2PFundLockHistoryPage = lazy(() =>
  import('./pages/p2p/P2PFundLockHistoryPage').then((m) => ({ default: m.P2PFundLockHistoryPage })),
);
const P2PTransactionLimitsPage = lazy(() =>
  import('./pages/p2p/P2PTransactionLimitsPage').then((m) => ({
    default: m.P2PTransactionLimitsPage,
  })),
);
const P2PLimitTrackerPage = lazy(() =>
  import('./pages/p2p/P2PLimitTrackerPage').then((m) => ({ default: m.P2PLimitTrackerPage })),
);
// Phase 1: Compliance
const P2PAMLScreeningPage = lazy(() =>
  import('./pages/p2p/P2PAMLScreeningPage').then((m) => ({ default: m.P2PAMLScreeningPage })),
);
const P2PSourceOfFundsPage = lazy(() =>
  import('./pages/p2p/P2PSourceOfFundsPage').then((m) => ({ default: m.P2PSourceOfFundsPage })),
);
const P2PLargeTransactionJustificationPage = lazy(() =>
  import('./pages/p2p/P2PLargeTransactionJustificationPage').then((m) => ({
    default: m.P2PLargeTransactionJustificationPage,
  })),
);
// Phase 1: Payment Method Verification
const P2PPaymentMethodVerificationPage = lazy(() =>
  import('./pages/p2p/P2PPaymentMethodVerificationPage').then((m) => ({
    default: m.P2PPaymentMethodVerificationPage,
  })),
);
const P2PPaymentMethodOwnershipPage = lazy(() =>
  import('./pages/p2p/P2PPaymentMethodOwnershipPage').then((m) => ({
    default: m.P2PPaymentMethodOwnershipPage,
  })),
);
const P2PPaymentMethodCoolingPeriodPage = lazy(() =>
  import('./pages/p2p/P2PPaymentMethodCoolingPeriodPage').then((m) => ({
    default: m.P2PPaymentMethodCoolingPeriodPage,
  })),
);
const P2PPaymentMethodHistoryPage = lazy(() =>
  import('./pages/p2p/P2PPaymentMethodHistoryPage').then((m) => ({
    default: m.P2PPaymentMethodHistoryPage,
  })),
);
// Phase 3+: Regulatory
const P2PTaxReportingPage = lazy(() =>
  import('./pages/p2p/P2PTaxReportingPage').then((m) => ({ default: m.P2PTaxReportingPage })),
);
const P2PRiskAssessmentPage = lazy(() =>
  import('./pages/p2p/P2PRiskAssessmentPage').then((m) => ({ default: m.P2PRiskAssessmentPage })),
);
const P2PComplianceOverviewPage = lazy(() =>
  import('./pages/p2p/P2PComplianceOverviewPage').then((m) => ({
    default: m.P2PComplianceOverviewPage,
  })),
);

// ─── Prediction Markets Pages ───
const PredictionsHomePage = lazy(() =>
  import('./pages/predictions/PredictionsHomePage').then((m) => ({
    default: m.PredictionsHomePage,
  })),
);
const PredictionsSearchPage = lazy(() =>
  import('./pages/predictions/PredictionsSearchPage').then((m) => ({
    default: m.PredictionsSearchPage,
  })),
);
const PredictionsBreakingPage = lazy(() =>
  import('./pages/predictions/PredictionsBreakingPage').then((m) => ({
    default: m.PredictionsBreakingPage,
  })),
);
const PredictionEventDetailPage = lazy(() =>
  import('./pages/predictions/PredictionEventDetailPage').then((m) => ({
    default: m.PredictionEventDetailPage,
  })),
);
const PredictionsPortfolioPage = lazy(() =>
  import('./pages/predictions/PredictionsPortfolioPage').then((m) => ({
    default: m.PredictionsPortfolioPage,
  })),
);
const PredictionsRewardsPage = lazy(() =>
  import('./pages/predictions/PredictionsRewardsPage').then((m) => ({
    default: m.PredictionsRewardsPage,
  })),
);
const PredictionsLeaderboardPage = lazy(() =>
  import('./pages/predictions/PredictionsLeaderboardPage').then((m) => ({
    default: m.PredictionsLeaderboardPage,
  })),
);
const PredictionsGlobalActivityPage = lazy(() =>
  import('./pages/predictions/PredictionsGlobalActivityPage').then((m) => ({
    default: m.PredictionsGlobalActivityPage,
  })),
);
const PredictionOrderReceiptPage = lazy(() =>
  import('./pages/predictions/PredictionOrderReceiptPage').then((m) => ({
    default: m.PredictionOrderReceiptPage,
  })),
);
const PredictionRiskCalculatorPage = lazy(() =>
  import('./pages/predictions/PredictionRiskCalculatorPage').then((m) => ({
    default: m.PredictionRiskCalculatorPage,
  })),
);
const PredictionMarketMakerPage = lazy(() =>
  import('./pages/predictions/PredictionMarketMakerPage').then((m) => ({
    default: m.PredictionMarketMakerPage,
  })),
);
const PredictionPortfolioAnalyzerPage = lazy(() =>
  import('./pages/predictions/PredictionPortfolioAnalyzerPage').then((m) => ({
    default: m.PredictionPortfolioAnalyzerPage,
  })),
);
const PredictionEventCalendarPage = lazy(() =>
  import('./pages/predictions/PredictionEventCalendarPage').then((m) => ({
    default: m.PredictionEventCalendarPage,
  })),
);
const PredictionSocialPage = lazy(() =>
  import('./pages/predictions/PredictionSocialPage').then((m) => ({
    default: m.PredictionSocialPage,
  })),
);
const PredictionAdvancedChartPage = lazy(() =>
  import('./pages/predictions/PredictionAdvancedChartPage').then((m) => ({
    default: m.PredictionAdvancedChartPage,
  })),
);
const PredictionTournamentsPage = lazy(() =>
  import('./pages/predictions/PredictionTournamentsPage').then((m) => ({
    default: m.PredictionTournamentsPage,
  })),
);
const PredictionDataIntegrationPage = lazy(() =>
  import('./pages/predictions/PredictionDataIntegrationPage').then((m) => ({
    default: m.PredictionDataIntegrationPage,
  })),
);

// ─── Arena Pages (26 pages) ───
const ArenaHomePage = lazy(() =>
  import('./pages/arena/ArenaHomePage').then((m) => ({ default: m.ArenaHomePage })),
);
const ArenaStudioPage = lazy(() =>
  import('./pages/arena/ArenaStudioPage').then((m) => ({ default: m.ArenaStudioPage })),
);
const ArenaModeDetailPage = lazy(() =>
  import('./pages/arena/ArenaModeDetailPage').then((m) => ({ default: m.ArenaModeDetailPage })),
);
const ArenaChallengeDetailPage = lazy(() =>
  import('./pages/arena/ArenaChallengeDetailPage').then((m) => ({
    default: m.ArenaChallengeDetailPage,
  })),
);
const ArenaJoinPage = lazy(() =>
  import('./pages/arena/ArenaJoinPage').then((m) => ({ default: m.ArenaJoinPage })),
);
const ArenaResolutionCenterPage = lazy(() =>
  import('./pages/arena/ArenaResolutionCenterPage').then((m) => ({
    default: m.ArenaResolutionCenterPage,
  })),
);
const ArenaCreatorPage = lazy(() =>
  import('./pages/arena/ArenaCreatorPage').then((m) => ({ default: m.ArenaCreatorPage })),
);
const ArenaLeaderboardPage = lazy(() =>
  import('./pages/arena/ArenaLeaderboardPage').then((m) => ({ default: m.ArenaLeaderboardPage })),
);
const VerifiedChallengesPage = lazy(() =>
  import('./pages/arena/VerifiedChallengesPage').then((m) => ({
    default: m.VerifiedChallengesPage,
  })),
);
const ArenaPointsPage = lazy(() =>
  import('./pages/arena/ArenaPointsPage').then((m) => ({ default: m.ArenaPointsPage })),
);
const ArenaFlowMapPage = lazy(() =>
  import('./pages/arena/ArenaFlowMapPage').then((m) => ({ default: m.ArenaFlowMapPage })),
);
const ArenaSafetyCenterPage = lazy(() =>
  import('./pages/arena/ArenaSafetyCenterPage').then((m) => ({ default: m.ArenaSafetyCenterPage })),
);
const ArenaTrustBreakdownPage = lazy(() =>
  import('./pages/arena/ArenaTrustBreakdownPage').then((m) => ({
    default: m.ArenaTrustBreakdownPage,
  })),
);
const ArenaPointsLedgerPage = lazy(() =>
  import('./pages/arena/ArenaPointsLedgerPage').then((m) => ({ default: m.ArenaPointsLedgerPage })),
);
const ArenaPointsEntryDetailPage = lazy(() =>
  import('./pages/arena/ArenaPointsEntryDetailPage').then((m) => ({
    default: m.ArenaPointsEntryDetailPage,
  })),
);
const MyArenaPage = lazy(() =>
  import('./pages/arena/MyArenaPage').then((m) => ({ default: m.MyArenaPage })),
);
const ArenaReportCasePage = lazy(() =>
  import('./pages/arena/ArenaReportCasePage').then((m) => ({ default: m.ArenaReportCasePage })),
);
const ArenaBlockedUsersPage = lazy(() =>
  import('./pages/arena/ArenaBlockedUsersPage').then((m) => ({ default: m.ArenaBlockedUsersPage })),
);
const MyArenaReportsPage = lazy(() =>
  import('./pages/arena/MyArenaReportsPage').then((m) => ({ default: m.MyArenaReportsPage })),
);
const ArenaProductionReadyPage = lazy(() =>
  import('./pages/arena/ArenaProductionReadyPage').then((m) => ({
    default: m.ArenaProductionReadyPage,
  })),
);
const ArenaPredictionBridgeFoundationPage = lazy(() =>
  import('./pages/arena/ArenaPredictionBridgeFoundationPage').then((m) => ({
    default: m.ArenaPredictionBridgeFoundationPage,
  })),
);
const ConnectedEcosystemProductionPage = lazy(() =>
  import('./pages/arena/ConnectedEcosystemProductionPage').then((m) => ({
    default: m.ConnectedEcosystemProductionPage,
  })),
);
const ArenaSmartRuleBuilderPage = lazy(() =>
  import('./pages/arena/ArenaSmartRuleBuilderPage').then((m) => ({
    default: m.ArenaSmartRuleBuilderPage,
  })),
);
const ArenaUniversalPresetLibraryPage = lazy(() =>
  import('./pages/arena/ArenaUniversalPresetLibraryPage').then((m) => ({
    default: m.ArenaUniversalPresetLibraryPage,
  })),
);
const ArenaGovernanceGatePage = lazy(() =>
  import('./pages/arena/ArenaGovernanceGatePage').then((m) => ({
    default: m.ArenaGovernanceGatePage,
  })),
);
const ArenaGuidePage = lazy(() =>
  import('./pages/arena/ArenaGuidePage').then((m) => ({ default: m.ArenaGuidePage })),
);

// ─── DCA Pages ───
const DCAPage = lazy(() => import('./pages/dca/DCAPage'));
const DCARebalanceConfig = lazy(() => import('./pages/dca/DCARebalanceConfig'));
const DCARebalanceDashboard = lazy(() => import('./pages/dca/DCARebalanceDashboard'));
const DCAScheduleConfig = lazy(() => import('./pages/dca/DCAScheduleConfig'));
const DCAScheduleAnalytics = lazy(() => import('./pages/dca/DCAScheduleAnalytics'));
const DCAPortfolioOptimizer = lazy(() => import('./pages/dca/DCAPortfolioOptimizer'));
const DCADynamicAmount = lazy(() => import('./pages/dca/DCADynamicAmount'));
const DCABacktesterPage = lazy(() =>
  import('./pages/dca/DCABacktesterPage').then((m) => ({ default: m.DCABacktesterPage })),
);
const DCAMultiAssetPage = lazy(() =>
  import('./pages/dca/DCAMultiAssetPage').then((m) => ({ default: m.DCAMultiAssetPage })),
);
const DCAPerformanceComparePage = lazy(() =>
  import('./pages/dca/DCAPerformanceComparePage').then((m) => ({
    default: m.DCAPerformanceComparePage,
  })),
);
const DCASmartRulesPage = lazy(() =>
  import('./pages/dca/DCASmartRulesPage').then((m) => ({ default: m.DCASmartRulesPage })),
);

// ─── Cross-Module Pages ───
const UnifiedPortfolioDashboard = lazy(() =>
  import('./pages/cross-module/UnifiedPortfolioDashboard').then((m) => ({
    default: m.UnifiedPortfolioDashboard,
  })),
);
const CrossModuleAnalytics = lazy(() =>
  import('./pages/cross-module/CrossModuleAnalytics').then((m) => ({
    default: m.CrossModuleAnalytics,
  })),
);
const SmartAlertCenter = lazy(() =>
  import('./pages/cross-module/SmartAlertCenter').then((m) => ({ default: m.SmartAlertCenter })),
);
const TaxReportCenter = lazy(() =>
  import('./pages/cross-module/TaxReportCenter').then((m) => ({ default: m.TaxReportCenter })),
);

// ─── Staking & Earn - Compliance Pages (Phase 1) ───
const StakingTermsPage = lazy(() =>
  import('./pages/earn/StakingTermsPage').then((m) => ({ default: m.StakingTermsPage })),
);
const StakingRiskDisclosurePage = lazy(() =>
  import('./pages/earn/StakingRiskDisclosurePage').then((m) => ({
    default: m.StakingRiskDisclosurePage,
  })),
);
const StakingWithdrawalPolicyPage = lazy(() =>
  import('./pages/earn/StakingWithdrawalPolicyPage').then((m) => ({
    default: m.StakingWithdrawalPolicyPage,
  })),
);
const StakingTaxGuidePage = lazy(() =>
  import('./pages/earn/StakingTaxGuidePage').then((m) => ({ default: m.StakingTaxGuidePage })),
);
const StakingRiskAssessmentPage = lazy(() =>
  import('./pages/earn/StakingRiskAssessmentPage').then((m) => ({
    default: m.StakingRiskAssessmentPage,
  })),
);

// ─── Staking & Earn - Portfolio Management (Phase 2) ───
const StakingDashboardPage = lazy(() =>
  import('./pages/earn/StakingDashboardPage').then((m) => ({ default: m.StakingDashboardPage })),
);
const StakingAnalyticsPage = lazy(() =>
  import('./pages/earn/StakingAnalyticsPage').then((m) => ({ default: m.StakingAnalyticsPage })),
);
const StakingHistoryPage = lazy(() =>
  import('./pages/earn/StakingHistoryPage').then((m) => ({ default: m.StakingHistoryPage })),
);
const StakingEarningsCalendarPage = lazy(() =>
  import('./pages/earn/StakingEarningsCalendarPage').then((m) => ({
    default: m.StakingEarningsCalendarPage,
  })),
);

// ─── Staking & Earn - Advanced Features (Phase 3) ───
const StakingValidatorSelectionPage = lazy(() =>
  import('./pages/earn/StakingValidatorSelectionPage').then((m) => ({
    default: m.StakingValidatorSelectionPage,
  })),
);
const StakingAutoCompoundPage = lazy(() =>
  import('./pages/earn/StakingAutoCompoundPage').then((m) => ({
    default: m.StakingAutoCompoundPage,
  })),
);
const StakingLiquidStakingPage = lazy(() =>
  import('./pages/earn/StakingLiquidStakingPage').then((m) => ({
    default: m.StakingLiquidStakingPage,
  })),
);
const StakingInsurancePage = lazy(() =>
  import('./pages/earn/StakingInsurancePage').then((m) => ({ default: m.StakingInsurancePage })),
);

// ─── Staking & Earn - UX Enhancements (Phase 4) ───
const StakingGuidePage = lazy(() =>
  import('./pages/earn/StakingGuidePage').then((m) => ({ default: m.StakingGuidePage })),
);
const StakingFAQPage = lazy(() =>
  import('./pages/earn/StakingFAQPage').then((m) => ({ default: m.StakingFAQPage })),
);
const StakingNotificationsPage = lazy(() =>
  import('./pages/earn/StakingNotificationsPage').then((m) => ({
    default: m.StakingNotificationsPage,
  })),
);
const StakingRecommendationsPage = lazy(() =>
  import('./pages/earn/StakingRecommendationsPage').then((m) => ({
    default: m.StakingRecommendationsPage,
  })),
);

// ─── Staking & Earn - Regulatory Compliance (Phase 5) ───
const StakingRegulatoryFrameworkPage = lazy(() =>
  import('./pages/earn/StakingRegulatoryFrameworkPage').then((m) => ({
    default: m.StakingRegulatoryFrameworkPage,
  })),
);
const StakingAuditReportsPage = lazy(() =>
  import('./pages/earn/StakingAuditReportsPage').then((m) => ({
    default: m.StakingAuditReportsPage,
  })),
);
const StakingCustodyPage = lazy(() =>
  import('./pages/earn/StakingCustodyPage').then((m) => ({ default: m.StakingCustodyPage })),
);
const StakingSuitabilityAssessmentPage = lazy(() =>
  import('./pages/earn/StakingSuitabilityAssessmentPage').then((m) => ({
    default: m.StakingSuitabilityAssessmentPage,
  })),
);
const StakingInsuranceFundTransparencyPage = lazy(() =>
  import('./pages/earn/StakingInsuranceFundTransparencyPage').then((m) => ({
    default: m.StakingInsuranceFundTransparencyPage,
  })),
);
const StakingTransactionReportingPage = lazy(() =>
  import('./pages/earn/StakingTransactionReportingPage').then((m) => ({
    default: m.StakingTransactionReportingPage,
  })),
);
const StakingAPIDocumentationPage = lazy(() =>
  import('./pages/earn/StakingAPIDocumentationPage').then((m) => ({
    default: m.StakingAPIDocumentationPage,
  })),
);
const StakingProofOfReservesPage = lazy(() =>
  import('./pages/earn/StakingProofOfReservesPage').then((m) => ({
    default: m.StakingProofOfReservesPage,
  })),
);

// ─── Staking & Earn - Risk Management (Phase 6) ───
const StakingRiskDashboardPage = lazy(() =>
  import('./pages/earn/StakingRiskDashboardPage').then((m) => ({
    default: m.StakingRiskDashboardPage,
  })),
);
const StakingSlashingHistoryPage = lazy(() =>
  import('./pages/earn/StakingSlashingHistoryPage').then((m) => ({
    default: m.StakingSlashingHistoryPage,
  })),
);
const StakingValidatorHealthMonitorPage = lazy(() =>
  import('./pages/earn/StakingValidatorHealthMonitorPage').then((m) => ({
    default: m.StakingValidatorHealthMonitorPage,
  })),
);
const StakingRiskScoreCalculatorPage = lazy(() =>
  import('./pages/earn/StakingRiskScoreCalculatorPage').then((m) => ({
    default: m.StakingRiskScoreCalculatorPage,
  })),
);
const StakingEmergencyActionsPage = lazy(() =>
  import('./pages/earn/StakingEmergencyActionsPage').then((m) => ({
    default: m.StakingEmergencyActionsPage,
  })),
);
const StakingContingencyPlanPage = lazy(() =>
  import('./pages/earn/StakingContingencyPlanPage').then((m) => ({
    default: m.StakingContingencyPlanPage,
  })),
);

// ─── Staking & Earn - Social & Community (Phase 7) ───
const StakingSocialFeedPage = lazy(() =>
  import('./pages/earn/StakingSocialFeedPage').then((m) => ({ default: m.StakingSocialFeedPage })),
);
const StakingCommunityGovernancePage = lazy(() =>
  import('./pages/earn/StakingCommunityGovernancePage').then((m) => ({
    default: m.StakingCommunityGovernancePage,
  })),
);
const StakingProposalsPage = lazy(() =>
  import('./pages/earn/StakingProposalsPage').then((m) => ({ default: m.StakingProposalsPage })),
);
const StakingVotingPage = lazy(() =>
  import('./pages/earn/StakingVotingPage').then((m) => ({ default: m.StakingVotingPage })),
);
const StakingForumPage = lazy(() =>
  import('./pages/earn/StakingForumPage').then((m) => ({ default: m.StakingForumPage })),
);

// ─── Staking & Earn - API & Integrations (Phase 8) ───
const StakingWebhooksPage = lazy(() =>
  import('./pages/earn/StakingWebhooksPage').then((m) => ({ default: m.StakingWebhooksPage })),
);
const StakingDataExportPage = lazy(() =>
  import('./pages/earn/StakingDataExportPage').then((m) => ({ default: m.StakingDataExportPage })),
);
const StakingThirdPartyIntegrationsPage = lazy(() =>
  import('./pages/earn/StakingThirdPartyIntegrationsPage').then((m) => ({
    default: m.StakingThirdPartyIntegrationsPage,
  })),
);
const StakingDeveloperConsolePage = lazy(() =>
  import('./pages/earn/StakingDeveloperConsolePage').then((m) => ({
    default: m.StakingDeveloperConsolePage,
  })),
);

// ─── Staking & Earn - Advanced Features (Phase 3 Extensions) ───
const StakingAdvancedOrdersPage = lazy(() =>
  import('./pages/earn/StakingAdvancedOrdersPage').then((m) => ({
    default: m.StakingAdvancedOrdersPage,
  })),
);
const StakingMultiChainPage = lazy(() =>
  import('./pages/earn/StakingMultiChainPage').then((m) => ({ default: m.StakingMultiChainPage })),
);
const StakingInstitutionalPage = lazy(() =>
  import('./pages/earn/StakingInstitutionalPage').then((m) => ({
    default: m.StakingInstitutionalPage,
  })),
);

// ─── Admin Pages ───
const AdminHome = lazy(() => import('./pages/admin/AdminHome'));
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'));
const ABTestDashboard = lazy(() => import('./pages/admin/ABTestDashboard'));
const FunnelDashboard = lazy(() => import('./pages/admin/FunnelDashboard'));

// ─── Dev Tools ───
import { RouteChecker } from './components/dev/RouteChecker';
import { PerformanceMonitor } from './components/dev/PerformanceMonitor';

// ─── Staking Routes (Lazy Loaded) ───
import { createStakingRoutes } from './routes/stakingRoutes.lazy';

// ─── Misc Pages ───
const NotificationsPage = lazy(() =>
  import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })),
);
const SupportPage = lazy(() =>
  import('./pages/support/SupportPage').then((m) => ({ default: m.SupportPage })),
);
const HelpCenterPage = lazy(() =>
  import('./pages/support/HelpCenterPage').then((m) => ({ default: m.HelpCenterPage })),
);
const AnnouncementsPage = lazy(() =>
  import('./pages/support/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })),
);
const NewsPage = lazy(() => import('./pages/news/NewsPage').then((m) => ({ default: m.NewsPage })));
const StakingEarnPage = lazy(() =>
  import('./pages/earn/StakingEarnPage').then((m) => ({ default: m.StakingEarnPage })),
);
const ReferralHomePage = lazy(() =>
  import('./pages/referral/ReferralHomePage').then((m) => ({ default: m.ReferralHomePage })),
);
const ReferralHistoryPage = lazy(() =>
  import('./pages/referral/ReferralHistoryPage').then((m) => ({ default: m.ReferralHistoryPage })),
);
const ReferralRewardsPage = lazy(() =>
  import('./pages/referral/ReferralRewardsPage').then((m) => ({ default: m.ReferralRewardsPage })),
);
const ReferralRulesPage = lazy(() =>
  import('./pages/referral/ReferralRulesPage').then((m) => ({ default: m.ReferralRulesPage })),
);
const ReferralFriendDetailPage = lazy(() =>
  import('./pages/referral/ReferralFriendDetailPage').then((m) => ({
    default: m.ReferralFriendDetailPage,
  })),
);
const LaunchpadPage = lazy(() =>
  import('./pages/launchpad/LaunchpadPage').then((m) => ({ default: m.LaunchpadPage })),
);
const LaunchpadDetailPage = lazy(() =>
  import('./pages/launchpad/LaunchpadDetailPage').then((m) => ({ default: m.LaunchpadDetailPage })),
);
const LaunchpadReceiptPage = lazy(() =>
  import('./pages/launchpad/LaunchpadReceiptPage').then((m) => ({
    default: m.LaunchpadReceiptPage,
  })),
);
const LaunchpadPortfolioPage = lazy(() =>
  import('./pages/launchpad/LaunchpadPortfolioPage').then((m) => ({
    default: m.LaunchpadPortfolioPage,
  })),
);
const LaunchpadPerformancePage = lazy(() =>
  import('./pages/launchpad/LaunchpadPerformancePage').then((m) => ({
    default: m.LaunchpadPerformancePage,
  })),
);
const LaunchpadStakingPage = lazy(() =>
  import('./pages/launchpad/LaunchpadStakingPage').then((m) => ({
    default: m.LaunchpadStakingPage,
  })),
);
const LaunchpadIDOBridgePage = lazy(() =>
  import('./pages/launchpad/LaunchpadIDOBridgePage').then((m) => ({
    default: m.LaunchpadIDOBridgePage,
  })),
);
const LaunchpadContractPage = lazy(() =>
  import('./pages/launchpad/LaunchpadContractPage').then((m) => ({
    default: m.LaunchpadContractPage,
  })),
);
const LaunchpadClaimReceiptPage = lazy(() =>
  import('./pages/launchpad/LaunchpadClaimReceiptPage').then((m) => ({
    default: m.LaunchpadClaimReceiptPage,
  })),
);
const LaunchpadBridgeOrderPage = lazy(() =>
  import('./pages/launchpad/LaunchpadBridgeOrderPage').then((m) => ({
    default: m.LaunchpadBridgeOrderPage,
  })),
);
const LaunchpadBatchClaimPage = lazy(() =>
  import('./pages/launchpad/LaunchpadBatchClaimPage').then((m) => ({
    default: m.LaunchpadBatchClaimPage,
  })),
);
const LaunchpadBridgeComparePage = lazy(() =>
  import('./pages/launchpad/LaunchpadBridgeComparePage').then((m) => ({
    default: m.LaunchpadBridgeComparePage,
  })),
);
const LaunchpadNotifSoundPage = lazy(() =>
  import('./pages/launchpad/LaunchpadNotifSoundPage').then((m) => ({
    default: m.LaunchpadNotifSoundPage,
  })),
);
const LaunchpadEventLogPage = lazy(() =>
  import('./pages/launchpad/LaunchpadEventLogPage').then((m) => ({
    default: m.LaunchpadEventLogPage,
  })),
);
const LaunchpadABIDiffPage = lazy(() =>
  import('./pages/launchpad/LaunchpadABIDiffPage').then((m) => ({
    default: m.LaunchpadABIDiffPage,
  })),
);
const LaunchpadAddressBookPage = lazy(() =>
  import('./pages/launchpad/LaunchpadAddressBookPage').then((m) => ({
    default: m.LaunchpadAddressBookPage,
  })),
);
const LaunchpadWebhooksPage = lazy(() =>
  import('./pages/launchpad/LaunchpadWebhooksPage').then((m) => ({
    default: m.LaunchpadWebhooksPage,
  })),
);
const LaunchpadGasTrackerPage = lazy(() =>
  import('./pages/launchpad/LaunchpadGasTrackerPage').then((m) => ({
    default: m.LaunchpadGasTrackerPage,
  })),
);
const LaunchpadRebalancePage = lazy(() =>
  import('./pages/launchpad/LaunchpadRebalancePage').then((m) => ({
    default: m.LaunchpadRebalancePage,
  })),
);
const LaunchpadMultisigPage = lazy(() =>
  import('./pages/launchpad/LaunchpadMultisigPage').then((m) => ({
    default: m.LaunchpadMultisigPage,
  })),
);
const LaunchpadSwapAggregatorPage = lazy(() =>
  import('./pages/launchpad/LaunchpadSwapAggregatorPage').then((m) => ({
    default: m.LaunchpadSwapAggregatorPage,
  })),
);
const LaunchpadLimitOrdersPage = lazy(() =>
  import('./pages/launchpad/LaunchpadLimitOrdersPage').then((m) => ({
    default: m.LaunchpadLimitOrdersPage,
  })),
);
const LaunchpadDCABuilderPage = lazy(() =>
  import('./pages/launchpad/LaunchpadDCABuilderPage').then((m) => ({
    default: m.LaunchpadDCABuilderPage,
  })),
);
const LaunchpadRiskAnalyticsPage = lazy(() =>
  import('./pages/launchpad/LaunchpadRiskAnalyticsPage').then((m) => ({
    default: m.LaunchpadRiskAnalyticsPage,
  })),
);
const RewardsHubPage = lazy(() =>
  import('./pages/rewards/RewardsHubPage').then((m) => ({ default: m.RewardsHubPage })),
);
const MarketHeatmapPage = lazy(() =>
  import('./pages/market/MarketHeatmapPage').then((m) => ({ default: m.MarketHeatmapPage })),
);
const WatchlistPage = lazy(() =>
  import('./pages/markets/WatchlistPage').then((m) => ({ default: m.WatchlistPage })),
);
const PriceAlertsPage = lazy(() =>
  import('./pages/markets/PriceAlertsPage').then((m) => ({ default: m.PriceAlertsPage })),
);
const MarketOverviewPage = lazy(() =>
  import('./pages/markets/MarketOverviewPage').then((m) => ({ default: m.MarketOverviewPage })),
);
const MarketMoversPage = lazy(() =>
  import('./pages/markets/MarketMoversPage').then((m) => ({ default: m.MarketMoversPage })),
);
const MarketSectorsPage = lazy(() =>
  import('./pages/markets/MarketSectorsPage').then((m) => ({ default: m.MarketSectorsPage })),
);
const TokenInfoPage = lazy(() =>
  import('./pages/markets/TokenInfoPage').then((m) => ({ default: m.TokenInfoPage })),
);
const MarketScreenerPage = lazy(() =>
  import('./pages/markets/MarketScreenerPage').then((m) => ({ default: m.MarketScreenerPage })),
);
const ComparisonToolPage = lazy(() =>
  import('./pages/markets/ComparisonToolPage').then((m) => ({ default: m.ComparisonToolPage })),
);
const MarketCalendarPage = lazy(() =>
  import('./pages/markets/MarketCalendarPage').then((m) => ({ default: m.MarketCalendarPage })),
);
const DerivativesOverviewPage = lazy(() =>
  import('./pages/markets/DerivativesOverviewPage').then((m) => ({
    default: m.DerivativesOverviewPage,
  })),
);
const MarketDepthPage = lazy(() =>
  import('./pages/markets/MarketDepthPage').then((m) => ({ default: m.MarketDepthPage })),
);
const SocialSentimentPage = lazy(() =>
  import('./pages/markets/SocialSentimentPage').then((m) => ({ default: m.SocialSentimentPage })),
);
const PortfolioTrackerPage = lazy(() =>
  import('./pages/markets/PortfolioTrackerPage').then((m) => ({ default: m.PortfolioTrackerPage })),
);
const MarketNewsPage = lazy(() =>
  import('./pages/markets/MarketNewsPage').then((m) => ({ default: m.MarketNewsPage })),
);
const AdvancedChartsPage = lazy(() =>
  import('./pages/markets/AdvancedChartsPage').then((m) => ({ default: m.AdvancedChartsPage })),
);
const TokenUnlocksPage = lazy(() =>
  import('./pages/markets/TokenUnlocksPage').then((m) => ({ default: m.TokenUnlocksPage })),
);
const SocialSignalsPage = lazy(() =>
  import('./pages/markets/SocialSignalsPage').then((m) => ({ default: m.SocialSignalsPage })),
);
const MarketCorrelationsPage = lazy(() =>
  import('./pages/markets/MarketCorrelationsPage').then((m) => ({
    default: m.MarketCorrelationsPage,
  })),
);
const EnterpriseStatesPage = lazy(() =>
  import('./pages/responsive/EnterpriseStatesPage').then((m) => ({
    default: m.EnterpriseStatesPage,
  })),
);

// ─── Discovery Pages ───
const UnifiedSearchPage = lazy(() =>
  import('./pages/discovery/UnifiedSearchPage').then((m) => ({ default: m.UnifiedSearchPage })),
);
const TopicHubPage = lazy(() =>
  import('./pages/discovery/TopicHubPage').then((m) => ({ default: m.TopicHubPage })),
);

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
      ...(AccountLockedOverride
        ? [{ path: 'account-locked', Component: AccountLockedOverride }]
        : []),
      ...(SessionExpiredOverride
        ? [{ path: 'session-expired', Component: SessionExpiredOverride }]
        : []),
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
