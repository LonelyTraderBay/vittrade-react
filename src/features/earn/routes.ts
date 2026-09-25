import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const StakingPage = lazyRoute(() =>
  import('./pages/EarnPage').then((module) => ({ default: module.StakingPage })),
);
const SavingsPage = lazyRoute(() =>
  import('./pages/EarnPage').then((module) => ({ default: module.SavingsPage })),
);
const EarnProductDetailPage = lazyRoute(() =>
  import('./pages/EarnTransactionPages').then((module) => ({
    default: module.EarnProductDetailPage,
  })),
);
const EarnRedeemPage = lazyRoute(() =>
  import('./pages/EarnTransactionPages').then((module) => ({
    default: module.EarnRedeemPage,
  })),
);
const EarnReceiptPage = lazyRoute(() =>
  import('./pages/EarnTransactionPages').then((module) => ({
    default: module.EarnReceiptPage,
  })),
);
const SavingsComparisonPage = lazyRoute(() =>
  import('./pages/SavingsContractPages').then((module) => ({
    default: module.SavingsComparisonContractPage,
  })),
);
const SavingsPortfolioPage = lazyRoute(() =>
  import('./pages/SavingsPortfolioPage').then((module) => ({
    default: module.SavingsPortfolioPage,
  })),
);
const SavingsHistoryPage = lazyRoute(() =>
  import('./pages/EarnHistoryPage').then((module) => ({
    default: module.SavingsHistoryPage,
  })),
);
const StakingHistoryPage = lazyRoute(() =>
  import('./pages/EarnHistoryPage').then((module) => ({
    default: module.StakingHistoryPage,
  })),
);

/** Production route boundary for the contract-backed Earn slice. */
export function createEarnRoutes(): RouteObject[] {
  return [
    { path: 'earn', Component: StakingPage },
    { path: 'earn/staking', Component: StakingPage },
    { path: 'earn/savings', Component: SavingsPage },
    { path: 'earn/savings/product/:productId', Component: EarnProductDetailPage },
    { path: 'earn/savings/redeem/:positionId', Component: EarnRedeemPage },
    { path: 'earn/savings/receipt', Component: EarnReceiptPage },
    { path: 'earn/savings/comparison', Component: SavingsComparisonPage },
    { path: 'earn/savings/portfolio', Component: SavingsPortfolioPage },
    { path: 'earn/savings/history', Component: SavingsHistoryPage },
    { path: 'earn/history', Component: StakingHistoryPage },
  ];
}
