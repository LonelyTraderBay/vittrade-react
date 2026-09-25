import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { isDevelopmentBuild } from '../config/env';
import { IntegrationPendingPage } from '../pages/system/IntegrationPendingPage';
import {
  p2pComplianceRoutes,
  p2pAdRoutes,
  p2pEscrowRoutes,
  p2pEducationRoutes,
  p2pExpressRoutes,
  p2pOrderRoutes,
  p2pOrderActionRoutes,
  p2pOrderCommunicationRoutes,
  p2pOverviewRoutes,
  p2pPaymentMethodRoutes,
  p2pSecurityRoutes,
  p2pTrustRoutes,
} from '@/features/p2p/routes';

const P2PMyOrdersPage = lazy(() =>
  import('@/features/p2p/pages/P2POrdersContractPage').then((m) => ({
    default: m.P2POrdersContractPage,
  })),
);
const P2PMerchantApplyPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PMerchantApplyPage').then((m) => ({
        default: m.P2PMerchantApplyPage,
      })),
    )
  : IntegrationPendingPage;
const P2PDisputePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PDisputePage').then((m) => ({ default: m.P2PDisputePage })),
    )
  : IntegrationPendingPage;
const P2PDisputeEvidencePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PDisputeEvidencePage').then((m) => ({
        default: m.P2PDisputeEvidencePage,
      })),
    )
  : IntegrationPendingPage;
const P2PDisputeResolutionPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PDisputeResolutionPage').then((m) => ({
        default: m.P2PDisputeResolutionPage,
      })),
    )
  : IntegrationPendingPage;
const P2POrderBookPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2POrderBookPage').then((m) => ({ default: m.P2POrderBookPage })),
    )
  : IntegrationPendingPage;
const P2PInsuranceFundPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PInsuranceFundPage').then((m) => ({
        default: m.P2PInsuranceFundPage,
      })),
    )
  : IntegrationPendingPage;
const P2PClaimDetailPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PClaimDetailPage').then((m) => ({
        default: m.P2PClaimDetailPage,
      })),
    )
  : IntegrationPendingPage;
const P2PInsurancePolicyPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PInsurancePolicyPage').then((m) => ({
        default: m.P2PInsurancePolicyPage,
      })),
    )
  : IntegrationPendingPage;
const P2PContributionHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PContributionHistoryPage').then((m) => ({
        default: m.P2PContributionHistoryPage,
      })),
    )
  : IntegrationPendingPage;
const P2PInsuranceScorePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PInsuranceScorePage').then((m) => ({
        default: m.P2PInsuranceScorePage,
      })),
    )
  : IntegrationPendingPage;
const P2PInsuranceCertificatePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PInsuranceCertificatePage').then((m) => ({
        default: m.P2PInsuranceCertificatePage,
      })),
    )
  : IntegrationPendingPage;
const P2PSettingsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PSettingsPage').then((m) => ({ default: m.P2PSettingsPage })),
    )
  : IntegrationPendingPage;
const P2PNotificationsSettingsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PNotificationsSettingsPage').then((m) => ({
        default: m.P2PNotificationsSettingsPage,
      })),
    )
  : IntegrationPendingPage;
const P2PE2EInfoPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PE2EInfoPage').then((m) => ({ default: m.P2PE2EInfoPage })),
    )
  : IntegrationPendingPage;
// Phase 1: KYC & Verification
// The page still derives the user's current tier from a local constant, so it is
// preview-only until the P2P KYC status contract is connected.
const P2PKYCRequirementsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PKYCRequirementsPage').then((m) => ({
        default: m.P2PKYCRequirementsPage,
      })),
    )
  : IntegrationPendingPage;
const P2PKYCStatusPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PKYCStatusPage').then((m) => ({ default: m.P2PKYCStatusPage })),
    )
  : IntegrationPendingPage;
const P2PIdentityVerificationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PIdentityVerificationPage').then((m) => ({
        default: m.P2PIdentityVerificationPage,
      })),
    )
  : IntegrationPendingPage;
const P2PAddressProofPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PAddressProofPage').then((m) => ({
        default: m.P2PAddressProofPage,
      })),
    )
  : IntegrationPendingPage;
const P2PSelfieVerificationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PSelfieVerificationPage').then((m) => ({
        default: m.P2PSelfieVerificationPage,
      })),
    )
  : IntegrationPendingPage;
const P2PVideoVerificationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PVideoVerificationPage').then((m) => ({
        default: m.P2PVideoVerificationPage,
      })),
    )
  : IntegrationPendingPage;
// Phase 1: Security
const P2PSecurityCenterPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PSecurityCenterPage').then((m) => ({
        default: m.P2PSecurityCenterPage,
      })),
    )
  : IntegrationPendingPage;
const P2PDeviceManagementPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PDeviceManagementPage').then((m) => ({
        default: m.P2PDeviceManagementPage,
      })),
    )
  : IntegrationPendingPage;
const P2PAntiPhishingCodePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PAntiPhishingCodePage').then((m) => ({
        default: m.P2PAntiPhishingCodePage,
      })),
    )
  : IntegrationPendingPage;
const P2PLoginHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PLoginHistoryPage').then((m) => ({
        default: m.P2PLoginHistoryPage,
      })),
    )
  : IntegrationPendingPage;
const P2PSuspiciousActivityPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PSuspiciousActivityPage').then((m) => ({
        default: m.P2PSuspiciousActivityPage,
      })),
    )
  : IntegrationPendingPage;
// Phase 1: Wallet & Limits
const P2PWalletPage = isDevelopmentBuild
  ? lazy(() => import('@/dev/legacy/p2p/P2PWalletPage').then((m) => ({ default: m.P2PWalletPage })))
  : IntegrationPendingPage;
const P2PWalletTransferPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PWalletTransferPage').then((m) => ({
        default: m.P2PWalletTransferPage,
      })),
    )
  : IntegrationPendingPage;
const P2PEscrowBalancePage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PEscrowBalancePage').then((m) => ({
        default: m.P2PEscrowBalancePage,
      })),
    )
  : IntegrationPendingPage;
const P2PFundLockHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PFundLockHistoryPage').then((m) => ({
        default: m.P2PFundLockHistoryPage,
      })),
    )
  : IntegrationPendingPage;
const P2PTransactionLimitsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PTransactionLimitsPage').then((m) => ({
        default: m.P2PTransactionLimitsPage,
      })),
    )
  : IntegrationPendingPage;
const P2PLimitTrackerPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PLimitTrackerPage').then((m) => ({
        default: m.P2PLimitTrackerPage,
      })),
    )
  : IntegrationPendingPage;
// Phase 1: Compliance
const P2PAMLScreeningPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PAMLScreeningPage').then((m) => ({
        default: m.P2PAMLScreeningPage,
      })),
    )
  : IntegrationPendingPage;
const P2PSourceOfFundsPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PSourceOfFundsPage').then((m) => ({
        default: m.P2PSourceOfFundsPage,
      })),
    )
  : IntegrationPendingPage;
const P2PLargeTransactionJustificationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PLargeTransactionJustificationPage').then((m) => ({
        default: m.P2PLargeTransactionJustificationPage,
      })),
    )
  : IntegrationPendingPage;
// Phase 1: Payment Method Verification
const P2PPaymentMethodVerificationPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PPaymentMethodVerificationPage').then((m) => ({
        default: m.P2PPaymentMethodVerificationPage,
      })),
    )
  : IntegrationPendingPage;
const P2PPaymentMethodOwnershipPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PPaymentMethodOwnershipPage').then((m) => ({
        default: m.P2PPaymentMethodOwnershipPage,
      })),
    )
  : IntegrationPendingPage;
const P2PPaymentMethodCoolingPeriodPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PPaymentMethodCoolingPeriodPage').then((m) => ({
        default: m.P2PPaymentMethodCoolingPeriodPage,
      })),
    )
  : IntegrationPendingPage;
const P2PPaymentMethodHistoryPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PPaymentMethodHistoryPage').then((m) => ({
        default: m.P2PPaymentMethodHistoryPage,
      })),
    )
  : IntegrationPendingPage;
// Phase 3+: Regulatory
const P2PTaxReportingPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PTaxReportingPage').then((m) => ({
        default: m.P2PTaxReportingPage,
      })),
    )
  : IntegrationPendingPage;
const P2PRiskAssessmentPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PRiskAssessmentPage').then((m) => ({
        default: m.P2PRiskAssessmentPage,
      })),
    )
  : IntegrationPendingPage;
const P2PComplianceOverviewPage = isDevelopmentBuild
  ? lazy(() =>
      import('@/dev/legacy/p2p/P2PComplianceOverviewPage').then((m) => ({
        default: m.P2PComplianceOverviewPage,
      })),
    )
  : IntegrationPendingPage;

/** Compose the protected P2P catalog for every authenticated shell. */
export function createP2PProtectedRoutes(
  homePage: NonNullable<RouteObject['Component']>,
): RouteObject[] {
  return [
    // ─── P2P: Express Trade (specific first) ───
    ...p2pExpressRoutes,

    // ─── P2P: Order Management (specific first) ───
    ...p2pOrderActionRoutes,
    ...p2pOrderRoutes,
    ...p2pOrderCommunicationRoutes,

    // ─── P2P: Dispute & Resolution ───
    ...p2pComplianceRoutes,
    { path: 'p2p/dispute/evidence/:id', Component: P2PDisputeEvidencePage },
    { path: 'p2p/dispute/resolution/:id', Component: P2PDisputeResolutionPage },
    { path: 'p2p/dispute/:orderId', Component: P2PDisputePage },

    // ─── P2P: Ad Management ───
    ...p2pAdRoutes,

    // ─── P2P: Merchant & Trust ───
    { path: 'p2p/merchant-apply', Component: P2PMerchantApplyPage },
    ...p2pTrustRoutes,
    ...p2pOverviewRoutes,
    ...p2pEducationRoutes,

    // ─── P2P: Payment Methods ───
    { path: 'p2p/payment-method/verification/:id', Component: P2PPaymentMethodVerificationPage },
    { path: 'p2p/payment-method/ownership/:id', Component: P2PPaymentMethodOwnershipPage },
    { path: 'p2p/payment-method/cooling-period', Component: P2PPaymentMethodCoolingPeriodPage },
    { path: 'p2p/payment-method/history', Component: P2PPaymentMethodHistoryPage },
    ...p2pPaymentMethodRoutes,

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
    ...p2pEscrowRoutes,

    // ─── P2P: KYC & Verification (Phase 1) ───
    { path: 'p2p/kyc/requirements', Component: P2PKYCRequirementsPage },
    { path: 'p2p/kyc/status', Component: P2PKYCStatusPage },
    { path: 'p2p/kyc/identity', Component: P2PIdentityVerificationPage },
    { path: 'p2p/kyc/address', Component: P2PAddressProofPage },
    { path: 'p2p/kyc/selfie', Component: P2PSelfieVerificationPage },
    { path: 'p2p/kyc/video', Component: P2PVideoVerificationPage },

    // ─── P2P: Security (Phase 1) ───
    { path: 'p2p/security/center', Component: P2PSecurityCenterPage },
    ...p2pSecurityRoutes,
    { path: 'p2p/security/devices', Component: P2PDeviceManagementPage },
    { path: 'p2p/security/anti-phishing', Component: P2PAntiPhishingCodePage },
    { path: 'p2p/security/login-history', Component: P2PLoginHistoryPage },
    { path: 'p2p/security/suspicious-activity', Component: P2PSuspiciousActivityPage },
    { path: 'p2p/e2e-info', Component: P2PE2EInfoPage },

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

    // ─── P2P: Settings & Support ───
    { path: 'p2p/settings/notifications', Component: P2PNotificationsSettingsPage },
    { path: 'p2p/settings', Component: P2PSettingsPage },

    // ─── P2P: Orders List ───
    { path: 'p2p/my-orders', Component: P2PMyOrdersPage },

    // ─── P2P: Home (LEAST specific, MUST be LAST) ───
    { path: 'p2p', Component: homePage },
  ];
}
