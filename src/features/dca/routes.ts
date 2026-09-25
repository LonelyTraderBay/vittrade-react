import type { RouteObject } from 'react-router';
import { lazyRoute } from '@/shared/ui/lazy-route';

const SavingsDCAPage = lazyRoute(() =>
  import('./pages/SavingsDCAContractPage').then((module) => ({
    default: module.SavingsDCAContractPage,
  })),
);

/** Production route boundary for the contract-backed DCA slice. */
export function createDCARoutes(): RouteObject[] {
  return [{ path: 'earn/savings/dca', Component: SavingsDCAPage }];
}
