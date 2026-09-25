import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const CopyTradingPage = lazyRoute(() =>
  import('./pages/CopyTradingPage').then((module) => ({ default: module.CopyTradingPage })),
);
const ActiveCopiesPage = lazyRoute(() =>
  import('./pages/ActiveCopiesContractPage').then((module) => ({
    default: module.ActiveCopiesContractPage,
  })),
);
const CopyProviderDetailPage = lazyRoute(() =>
  import('./pages/CopyProviderDetailContractPage').then((module) => ({
    default: module.CopyProviderDetailContractPage,
  })),
);
const PreCopyAssessmentPage = lazyRoute(() =>
  import('./pages/PreCopyAssessmentContractPage').then((module) => ({
    default: module.PreCopyAssessmentContractPage,
  })),
);
const CopyConfigurationPage = lazyRoute(() =>
  import('./pages/CopyConfigurationContractPage').then((module) => ({
    default: module.CopyConfigurationContractPage,
  })),
);
const CopyConfirmationPage = lazyRoute(() =>
  import('./pages/CopyConfirmationContractPage').then((module) => ({
    default: module.CopyConfirmationContractPage,
  })),
);
const ProviderComparisonPage = lazyRoute(() =>
  import('./pages/ProviderComparisonContractPage').then((module) => ({
    default: module.ProviderComparisonContractPage,
  })),
);
const CopyEducationPage = lazyRoute(() =>
  import('./pages/CopyEducationPage').then((module) => ({
    default: module.CopyEducationPage,
  })),
);
const TradingWebCopyPerformancePage = lazyRoute(() =>
  import('./pages/WebCopyPerformancePage').then((module) => ({
    default: module.WebCopyPerformancePage,
  })),
);
const TradingWebAnalyticsPage = lazyRoute(() =>
  import('./pages/TradeAnalyticsContractPage').then((module) => ({
    default: module.TradeAnalyticsContractPage,
  })),
);

// Các URL copy-trading web cũ vẫn được giữ, nhưng implementation thuộc feature này.
export function createTradingWebRoutes(): RouteObject[] {
  return [
    { path: 'trade/copy', Component: CopyTradingPage },
    { path: 'trade/copy/provider/:providerId', Component: CopyProviderDetailPage },
    {
      path: 'trade/copy/provider/:providerId/assessment',
      Component: PreCopyAssessmentPage,
    },
    {
      path: 'trade/copy/provider/:providerId/configuration',
      Component: CopyConfigurationPage,
    },
    {
      path: 'trade/copy/provider/:providerId/confirmation',
      Component: CopyConfirmationPage,
    },
    { path: 'trade/copy/active', Component: ActiveCopiesPage },
    { path: 'trade/copy/performance/:copyId', Component: TradingWebCopyPerformancePage },
    { path: 'trade/copy/education', Component: CopyEducationPage },
    { path: 'trade/copy-trading/education', Component: CopyEducationPage },
    { path: 'trade/analytics', Component: TradingWebAnalyticsPage },
  ];
}

/** Production route boundary for the contract-backed copy-trading slice. */
export function createTradingRoutes(): RouteObject[] {
  return [
    { path: 'trade/copy-trading', Component: CopyTradingPage },
    { path: 'trade/copy-trading/active', Component: ActiveCopiesPage },
    { path: 'trade/copy-provider/:providerId', Component: CopyProviderDetailPage },
    { path: 'trade/copy-provider/:providerId/assessment', Component: PreCopyAssessmentPage },
    { path: 'trade/copy-provider/:providerId/configuration', Component: CopyConfigurationPage },
    { path: 'trade/copy-provider/:providerId/confirmation', Component: CopyConfirmationPage },
    { path: 'trade/copy-trading/comparison', Component: ProviderComparisonPage },
    { path: 'trade/copy-trading/education', Component: CopyEducationPage },
  ];
}
