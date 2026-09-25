import { lazy } from 'react';
import type { RouteObject } from 'react-router';

const P2PDisputeDetailPage = lazy(() =>
  import('./pages/P2PDisputeDetailPage').then((module) => ({
    default: module.P2PDisputeDetailPage,
  })),
);

const P2PDisputesPage = lazy(() =>
  import('./pages/P2PDisputesPage').then((module) => ({ default: module.P2PDisputesPage })),
);

const P2PChatPage = lazy(() =>
  import('./pages/P2PChatPage').then((module) => ({ default: module.P2PChatPage })),
);

const P2PEscrowDetailPage = lazy(() =>
  import('./pages/P2PEscrowDetailPage').then((module) => ({
    default: module.P2PEscrowDetailPage,
  })),
);

const P2POrderTimelinePage = lazy(() =>
  import('./pages/P2POrderActionPages').then((module) => ({
    default: module.P2POrderTimelineContractPage,
  })),
);
const P2POrderRatePage = lazy(() =>
  import('./pages/P2POrderActionPages').then((module) => ({
    default: module.P2POrderRateContractPage,
  })),
);
const P2POrderCancelPage = lazy(() =>
  import('./pages/P2POrderActionPages').then((module) => ({
    default: module.P2POrderCancelContractPage,
  })),
);
const P2POrderProofPage = lazy(() =>
  import('./pages/P2POrderActionPages').then((module) => ({
    default: module.P2POrderProofContractPage,
  })),
);

const P2PPaymentMethodsPage = lazy(() =>
  import('./pages/P2PPaymentMethodsPage').then((module) => ({
    default: module.P2PPaymentMethodsPage,
  })),
);

const P2PBlacklistPage = lazy(() =>
  import('./pages/P2PBlacklistPage').then((module) => ({ default: module.P2PBlacklistPage })),
);

const P2PBlacklistAddPage = lazy(() =>
  import('./pages/P2PBlacklistAddPage').then((module) => ({
    default: module.P2PBlacklistAddPage,
  })),
);

const P2PMerchantProfilePage = lazy(() =>
  import('./pages/P2PMerchantProfilePage').then((module) => ({
    default: module.P2PMerchantProfilePage,
  })),
);

const P2PReportMerchantPage = lazy(() =>
  import('./pages/P2PReportMerchantPage').then((module) => ({
    default: module.P2PReportMerchantPage,
  })),
);

const P2PReviewsPage = lazy(() =>
  import('./pages/P2PReviewsPage').then((module) => ({ default: module.P2PReviewsPage })),
);

const P2P2FASettingsPage = lazy(() =>
  import('./pages/P2P2FASettingsPage').then((module) => ({
    default: module.P2P2FASettingsPage,
  })),
);

const P2PAchievementsPage = lazy(() =>
  import('./pages/P2PAchievementsPage').then((module) => ({
    default: module.P2PAchievementsPage,
  })),
);

const P2PAdAnalyticsPage = lazy(() =>
  import('./pages/P2PAdAnalyticsPage').then((module) => ({
    default: module.P2PAdAnalyticsPage,
  })),
);
const P2PAdDetailContractPage = lazy(() =>
  import('./pages/P2PAdDetailContractPage').then((module) => ({
    default: module.P2PAdDetailContractPage,
  })),
);
const P2PCreateAdContractPage = lazy(() =>
  import('./pages/P2PCreateAdContractPage').then((module) => ({
    default: module.P2PCreateAdContractPage,
  })),
);

const P2PWebOrdersPage = lazy(() =>
  import('./pages/P2POrdersContractPage').then((module) => ({
    default: module.P2POrdersContractPage,
  })),
);
const P2PMyAdsContractPage = lazy(() =>
  import('./pages/P2PMyAdsContractPage').then((module) => ({
    default: module.P2PMyAdsContractPage,
  })),
);

const P2PExpressPage = lazy(() =>
  import('./pages/P2PExpressPage').then((module) => ({ default: module.P2PExpressPage })),
);

const P2PExpressConfirmPage = lazy(() =>
  import('./pages/P2PExpressConfirmPage').then((module) => ({
    default: module.P2PExpressConfirmPage,
  })),
);

const P2PFraudPreventionPage = lazy(() =>
  import('./pages/P2PFraudPreventionPage').then((module) => ({
    default: module.P2PFraudPreventionPage,
  })),
);

const P2PGuidePage = lazy(() =>
  import('./pages/P2PGuidePage').then((module) => ({ default: module.P2PGuidePage })),
);

const P2PPaymentMethodAddPage = lazy(() =>
  import('./pages/P2PPaymentMethodAddPage').then((module) => ({
    default: module.P2PPaymentMethodAddPage,
  })),
);

const P2PDashboardPage = lazy(() =>
  import('./pages/P2PDashboardPage').then((module) => ({ default: module.P2PDashboardPage })),
);

const P2PTradingLevelPage = lazy(() =>
  import('./pages/P2PTradingLevelPage').then((module) => ({
    default: module.P2PTradingLevelPage,
  })),
);

/** Routes owned by the migrated P2P compliance vertical slice. */
export const p2pComplianceRoutes: RouteObject[] = [
  { path: 'p2p/dispute/detail/:id', Component: P2PDisputeDetailPage },
  { path: 'p2p/disputes', Component: P2PDisputesPage },
];

/** Routes owned by the migrated P2P order-communication vertical slice. */
export const p2pOrderCommunicationRoutes: RouteObject[] = [
  { path: 'p2p/chat/:orderId', Component: P2PChatPage },
];

/** Routes owned by the migrated P2P escrow state-transition slice. */
export const p2pEscrowRoutes: RouteObject[] = [
  { path: 'p2p/escrow/:orderId', Component: P2PEscrowDetailPage },
];

/** Canonical order URL now composes the same contract-backed lifecycle page. */
export const p2pOrderRoutes: RouteObject[] = [
  { path: 'p2p/order/:orderId', Component: P2PEscrowDetailPage },
];

/** Web-shell aliases for contract-backed P2P create, orders and escrow pages. */
export const p2pWebRoutes: RouteObject[] = [
  { path: 'p2p/create-offer', Component: P2PCreateAdContractPage },
  { path: 'p2p/order-room', Component: P2PWebOrdersPage },
  { path: 'p2p/order/:orderId', Component: P2PEscrowDetailPage },
];

/** Routes for the contract-backed order action lifecycle. */
export const p2pOrderActionRoutes: RouteObject[] = [
  { path: 'p2p/order/timeline/:orderId', Component: P2POrderTimelinePage },
  { path: 'p2p/order/rate/:orderId', Component: P2POrderRatePage },
  { path: 'p2p/order/cancel/:orderId', Component: P2POrderCancelPage },
  { path: 'p2p/order/proof/:orderId', Component: P2POrderProofPage },
];

/** Routes owned by the migrated P2P payment-method slice. */
export const p2pPaymentMethodRoutes: RouteObject[] = [
  { path: 'p2p/payment-method/add', Component: P2PPaymentMethodAddPage },
  { path: 'p2p/payment-methods', Component: P2PPaymentMethodsPage },
];

/** Routes owned by the migrated P2P trust and blacklist vertical slice. */
export const p2pTrustRoutes: RouteObject[] = [
  { path: 'p2p/blacklist/add', Component: P2PBlacklistAddPage },
  { path: 'p2p/blacklist', Component: P2PBlacklistPage },
  { path: 'p2p/merchant/:merchantId', Component: P2PMerchantProfilePage },
  { path: 'p2p/report/:merchantId', Component: P2PReportMerchantPage },
  { path: 'p2p/reviews', Component: P2PReviewsPage },
];

/** Routes owned by the migrated P2P security settings slice. */
export const p2pSecurityRoutes: RouteObject[] = [
  { path: 'p2p/security/2fa', Component: P2P2FASettingsPage },
];

/** Routes owned by the migrated P2P overview and level slice. */
export const p2pOverviewRoutes: RouteObject[] = [
  { path: 'p2p/dashboard', Component: P2PDashboardPage },
  { path: 'p2p/trading-level', Component: P2PTradingLevelPage },
  { path: 'p2p/achievements', Component: P2PAchievementsPage },
];

/** Routes owned by the migrated P2P ad analytics slice. */
export const p2pAdRoutes: RouteObject[] = [
  { path: 'p2p/ad/:id', Component: P2PAdDetailContractPage },
  { path: 'p2p/ad-analytics/:id', Component: P2PAdAnalyticsPage },
  { path: 'p2p/create', Component: P2PCreateAdContractPage },
  { path: 'p2p/my-ads', Component: P2PMyAdsContractPage },
];

/** Routes owned by the migrated P2P Express order-creation slice. */
export const p2pExpressRoutes: RouteObject[] = [
  { path: 'p2p/express/confirm', Component: P2PExpressConfirmPage },
  { path: 'p2p/express', Component: P2PExpressPage },
];

/** Routes owned by the P2P education slice. */
export const p2pEducationRoutes: RouteObject[] = [
  { path: 'p2p/fraud-prevention', Component: P2PFraudPreventionPage },
  { path: 'p2p/guide', Component: P2PGuidePage },
];
