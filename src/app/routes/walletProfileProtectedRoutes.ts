import { lazy, type ComponentType } from 'react';
import type { RouteObject } from 'react-router';
import { IntegrationPendingPage } from '../pages/system/IntegrationPendingPage';
import { createWalletRoutes } from '@/features/wallet/routes';
import { createProfileRoutes } from '@/features/profile/routes';

const AssetDetailPage = lazy(() =>
  import('../pages/wallet/AssetDetailPage').then((module) => ({ default: module.AssetDetailPage })),
);

export interface WalletProfileRouteOverrides {
  WalletPage: ComponentType;
  TxHistoryPage: ComponentType;
  ProfilePage: ComponentType;
}

export function createWalletProfileProtectedRoutes(
  overrides: WalletProfileRouteOverrides,
): RouteObject[] {
  return [
    { path: 'wallet', Component: overrides.WalletPage },
    { path: 'wallet/history', Component: overrides.TxHistoryPage },
    { path: 'wallet/buy-crypto', Component: IntegrationPendingPage },
    { path: 'wallet/multi-manager', Component: IntegrationPendingPage },
    { path: 'wallet/gas-optimizer', Component: IntegrationPendingPage },
    { path: 'wallet/token-approval', Component: IntegrationPendingPage },
    { path: 'wallet/health-score', Component: IntegrationPendingPage },
    ...createWalletRoutes({ assetDetail: AssetDetailPage }),
    { path: 'profile', Component: overrides.ProfilePage },
    { path: 'profile/kyc', Component: IntegrationPendingPage },
    { path: 'profile/settings', Component: IntegrationPendingPage },
    { path: 'profile/api/create', Component: IntegrationPendingPage },
    { path: 'profile/api', Component: IntegrationPendingPage },
    { path: 'profile/vip', Component: IntegrationPendingPage },
    ...createProfileRoutes(),
  ];
}
